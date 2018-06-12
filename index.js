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

const host = process.env[`WS_HOST`];
const port = process.env[`WS_PORT`];
const server = new WebSocket.Server({
  host,
  port,
});
const logServerListening = ({ logger, port, }) => () => {
  logger.info(`server started`, {
    port,
    type: `SERVER_LISTENING`,
  });
};
server.on(`listening`, logServerListening({ logger, port, }));

const socket$ = Rx.fromEvent(server, `connection`).pipe(
  rxOperators.map(util.head)
);
const connectionEventCount$ = socket$.pipe(
  rxOperators.scan(util.increment, 0)
);
const createCloseEvent$ = (socket) => Rx.fromEvent(socket, `close`);
const closeEvent$ = socket$.pipe(
  rxOperators.flatMap(createCloseEvent$)
);
const zero$ = Rx.of(0);
const closeEventCount$ = Rx.merge(
  zero$,
  closeEvent$.pipe(rxOperators.scan(util.increment, 0))
);
const activeSocketCount$ = Rx.combineLatest(
  [ connectionEventCount$, closeEventCount$, ],
  util.subtract,
);
activeSocketCount$.subscribe({
  next: (count) => {
    console.log(`active count ${count}`)
  },
});
const isMtaFeedsPaused = (count) => 1 > count;
const isMtaFeedsPaused$ = activeSocketCount$.pipe(rxOperators.map(isMtaFeedsPaused));
isMtaFeedsPaused$.subscribe({
  next: (isPaused) => {
    console.log(`is paused ${isPaused}`)
  },
});

const refreshInterval = process.env[`MTA_FEED_REFRESH_INTERVAL`];

const feedsConfig = {
  apiKey: process.env[`MTA_FEED_API_KEY`],
  urlBase: process.env[`MTA_FEED_ROOT_URL`],
};
const feedIds = process.env[`MTA_FEED_IDS`].split(`_`);
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
const createTripUpdateFeeds = () => {
  const timer = Rx.timer(0, refreshInterval);

  const tripUpdateFeed$ = timer.pipe(
    rxOperators.flatMap(toFeeds),
    rxOperators.map(tripUpdates.fromMtaFeeds),
    rxOperators.tap({
      error: logFeedsError({ logger, }),
      next: logFeedsUpdate({ logger, }),
    }),
  );

  return tripUpdateFeed$;
};
const createPausableFeeds = (isPaused) => isPaused
  ? Rx.NEVER
  : createTripUpdateFeeds();

const tripUpdateFeeds = isMtaFeedsPaused$.pipe(
  rxOperators.switchMap(createPausableFeeds),
  rxOperators.multicast(new Rx.Subject())
);
tripUpdateFeeds.connect();
tripUpdateFeeds.subscribe({
  error: (e) => console.log(e),
});

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
    rxOperators.scan((state, feeds) => {
      const pathIds = paths.updateIdsFromFeeds(
        feeds,
        state.pathIds
      );

      return {
        ...state,
        pathIds,
        paths: paths.updateFromFeeds(
          feeds,
          state.pointIds,
          pathIds,
          state.paths
        ),
      };
    }, initialState),
  );

  const sessionMessages = sessionState.pipe(
    rxOperators.map((state) => ({
      paths: paths.toPublic(state.paths),
      points: points.toPublic(state.pointIds, state.points),
      dimensions: state.dimensions,
    }))
  );

  const feedSubscription = sessionMessages.subscribe({
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
    feedSubscription,
  }));
};

server.on(`connection`, startSession(app));
