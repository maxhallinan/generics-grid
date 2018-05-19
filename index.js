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
  const id = uuidv1();
  const startedAt = Date.now();
  app.logger.log(`Session ${id} started at ${startedAt}.`);

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

  const sessionState = {
    id,
    dimensions: sessionDimensions,
    pathIds: {
      privateToPublic: {},
      publicToPrivate: {},
    },
    paths: {},
    points: sessionPoints,
    startedAt,
    websocket: websocket,
  };

  const pathsListener = sendMsg(app, sessionState);

  const subscription = app.tripUpdateFeeds.subscribe({
    complete: () => { app.logger.log('Complete'); },
    error: (err) => { app.logger.log('Error', err); },
    next: pathsListener,
  });

  websocket.on(
    serverEvents.CLOSE,
    endSession(app, sessionState, subscription)
  );
};

const endSession = (app, sessionState, subscription) => () => {
  const endedAt = Date.now();
  subscription.unsubscribe();
  app.logger.log(`Session ${sessionState.id} ended at ${endedAt}`);
};

const sendMsg = (app, sessionState) => (updates) => {
  const sentAt = Date.now();

  sessionState.pathIds = paths.updateIdsFromFeeds(
    updates,
    sessionState.pathIds
  );

  sessionState.paths = paths.updateFromFeeds(
    updates,
    app.points.ids,
    sessionState.pathIds,
    sessionState.paths
  );

  const publicPaths = paths.toPublic(sessionState.paths);

  const msg = {
    updates,
    paths: publicPaths,
    points: points.toPublic(app.points.ids, sessionState.points),
    dimensions: sessionState.dimensions,
    sentAt,
  };
  const serialized = JSON.stringify(msg);
  sessionState.websocket.send(serialized);
  app.logger.log(`Session ${sessionState.id} msg sent at ${sentAt}`);
};

server.on(serverEvents.CONNECTION, startSession(app));
