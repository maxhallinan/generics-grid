require(`dotenv`).config();
const Rx = require(`rxjs`);
const rxOperators = require(`rxjs/operators`);
const url = require(`url`);
const uuidv1 = require(`uuid/v1`);
const WebSocket = require(`ws`);

const dimensions = require(`./grid/dimensions`);
const logger = require(`./logger`);
const mtaFeeds = require(`./data-sources/mta-feeds`);
const originalPoints = require(`./data/points.json`);
const paths = require(`./grid/paths`);
const points = require(`./grid/points`);
const session = require(`./server/session`);
const tripUpdates = require(`./data-sources/trip-updates`);
const util = require(`./util`);

const feedsConfig = {
  apiKey: process.env[`MTA_FEED_API_KEY`],
  urlBase: process.env[`MTA_FEED_ROOT_URL`],
};
const feedIds = process.env[`MTA_FEED_IDS`].split(`,`);
const refreshInterval = process.env[`MTA_FEED_REFRESH_INTERVAL`];
const timer = Rx.timer(0, refreshInterval);
const feedsReq = (feedsConfig, feedIds) => () =>
  mtaFeeds.fetchAll(feedsConfig, feedIds);
const toFeeds = util.compose(Rx.from, feedsReq(feedsConfig, feedIds));
const logFeedsError = ({ logger, }) => (error) => {
  logger.error(`feeds error`, {
    error: error.message,
    type: `FEEDS_ERROR`,
  });
};
const logFeedsUpdate = ({ logger, }) => (feeds) => {
  const updatedFeeds = mtaFeeds.filterNull(feeds);
  const feedIds = Object.keys(updatedFeeds).join(`,`);
  logger.info(`feeds updated`, {
    feedIds,
    type: `FEEDS_UPDATED`,
  });
};
const tripUpdateFeeds = timer.pipe(
  rxOperators.flatMap(toFeeds),
  rxOperators.map(tripUpdates.fromMtaFeeds),
  rxOperators.tap({
    error: logFeedsError({ logger, }),
    next: logFeedsUpdate({ logger, }),
  }),
  rxOperators.multicast(new Rx.Subject())
);
tripUpdateFeeds.connect();

const originalRanges = points.rangesOf2dPoints(originalPoints);
const defaultRanges = dimensions.to2dRanges([
  util.toInt(process.env[`RANGE_X_START`]),
  util.toInt(process.env[`RANGE_X_STOP`]),
], [
  util.toInt(process.env[`RANGE_Y_START`]),
  util.toInt(process.env[`RANGE_Y_STOP`]),
]);
const app = {
  default_: {
    ranges: defaultRanges,
  },
  logger,
  original: {
    points: originalPoints,
    ranges: originalRanges,
  },
  tripUpdateFeeds,
  points: {
    ids: points.createIds(originalPoints),
  },
};

const startSession = (app) => (websocket, request) => {
  const sessionId = uuidv1();

  app.logger.info(`session started`, {
    sessionId,
    type: `SESSION_STARTED`,
  });

  const { query, } = url.parse(request.url, true);

  const initialState = session.initState({
    query,
    defaultRanges: app.default_.ranges,
    originalPoints: app.original.points,
    originalRanges: app.original.ranges,
    pointIds: app.points.ids,
  });

  const sessionState = app.tripUpdateFeeds.pipe(
    rxOperators.scan((state, feeds) => ({
      ...state,
      pathIds: paths.updateIdsFromFeeds(
        feeds,
        state.pathIds
      ),
      paths: paths.updateFromFeeds(
        feeds,
        state.pointIds,
        state.pathIds,
        state.paths
      ),
    }), initialState)
  );

  const sessionMessages = sessionState.pipe(
    rxOperators.map((state) => ({
      paths: paths.toPublic(state.paths),
      points: points.toPublic(state.pointIds, state.points),
      dimensions: state.dimensions,
    }))
  );

  const subscription = sessionMessages.subscribe({
    error: session.handleErr({
      logger: app.logger,
      sessionId,
      websocket,
    }),
    next: session.sendMsg({
      logger: app.logger,
      sessionId,
      websocket,
    }),
  });

  websocket.on(`close`, session.end({
    logger: app.logger,
    sessionId,
    subscription,
  }));
};

const port = process.env[`WS_PORT`];
const server = new WebSocket.Server({ port, });
const logServerListening = ({ logger, port, }) => () => {
  logger.info(`server started`, {
    port,
    type: `SERVER_LISTENING`,
  });
};
server.on(`listening`, logServerListening({ logger, port, }));
server.on(`connection`, startSession(app));
