require(`dotenv`).config();
const EventEmitter = require(`events`);
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
const tripUpdateFeeds = timer.pipe(
  rxOperators.flatMap(toFeeds),
  rxOperators.map(tripUpdates.fromMtaFeeds),
  rxOperators.multicast(new Rx.Subject()),
);
tripUpdateFeeds.connect();

// server
const serverEvents = {
  CLOSE: `close`,
  CONNECTION : `connection`,
};
const port = util.toInt(process.env[`WS_PORT`]);
const server = new WebSocket.Server({ port, });

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
  server,
};

const startSession = (app) => (websocket, request) => {
  const sessionId = uuidv1();
  const startedAt = Date.now();
  app.logger.log(`Session ${sessionId} started at ${startedAt}.`);

  const { query, } = url.parse(request.url, true);

  const sessionRanges = session.toRanges(query, app.default_.ranges);

  const sessionDimensions = dimensions.to2d(
    sessionRanges.x,
    sessionRanges.y
  );

  const sessionPoints = session.toPoints(
    sessionRanges,
    app.original.ranges,
    app.original.points
  );

  // TODO: move to server/session
  const initSession = {
    dimensions: sessionDimensions,
    pathIds: {
      privateToPublic: {},
      publicToPrivate: {},
    },
    paths: {},
    pointIds: app.points.ids,
    points: sessionPoints,
    startedAt,
  };

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
    }), initSession),
  );

  const sessionMessages = sessionState.pipe(
    rxOperators.map((state) => ({
      paths: paths.toPublic(state.paths),
      points: points.toPublic(state.pointIds, state.points),
      dimensions: state.dimensions,
    })),
  );

  const subscription = sessionMessages.subscribe({
    complete: completeSession({
      logger: app.logger,
      sessionId,
      websocket,
    }),
    error: handleErr({
      logger: app.logger,
      sessionId,
      websocket,
    }),
    next: sendMsg({
      logger: app.logger,
      sessionId,
      websocket,
    }),
  });

  websocket.on(
    serverEvents.CLOSE,
    endSession({
      logger: app.logger,
      sessionId,
      subscription
    })
  );
};

// TODO: move to server/session
const completeSession = ({ logger, sessionId, websocket, }) => () => {
  const completedAt = Date.now();
  websocket.close();
  logger.log(`Session ${sessionId} completed at ${completedAt}`);
};

// TODO: move to server/session
const handleErr = ({ logger, sessionId, websocket, }) => (err) => {
  const errAt = Date.now();
  websocket.close();
  logger.log(`Session ${sessionId} error at ${errAt}`);
  logger.log(`Session ${sessionId} error ${err}`);
};

// TODO: move to server/session
const endSession = ({ logger, sessionId, subscription, }) => () => {
  const endedAt = Date.now();
  subscription.unsubscribe();
  logger.log(`Session ${sessionId} ended at ${endedAt}`);
};

// TODO: move to server/session
const sendMsg = ({ logger, sessionId, websocket, }) => (msg) => {
  const sentAt = Date.now();
  const serialized = JSON.stringify({ ...msg, sentAt, });
  websocket.send(serialized);
  logger.log(`Session ${sessionId} msg sent at ${sentAt}`);
};

server.on(serverEvents.CONNECTION, startSession(app));
