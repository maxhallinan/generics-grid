require(`dotenv`).config();
const EventEmitter = require(`events`);
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

const pathEvents = {
  DATA: `data`,
};
const emitter = new EventEmitter();
const feedsConfig = {
  apiKey: process.env[`GENERICS_GRID_MTA_API_KEY`],
  urlBase: process.env[`GENERICS_GRID_MTA_ROOT_URL`],
};
const feedIds = process.env[`GENERICS_GRID_MTA_FEED_IDS`].split(`,`);
setInterval(() => {
  mtaFeeds.fetchAll(feedsConfig, feedIds)
    .then(mtaFeeds.filterNull)
    .then(tripUpdates.fromMtaFeeds)
    .then((updates) => {
      emitter.emit(pathEvents.DATA, { tripUpdates: updates, });
    })
    .catch((err) => console.log(err));
}, 1000);

// server
const serverEvents = {
  CLOSE: `close`,
  CONNECTION : `connection`,
};
const port = util.toInt(process.env.GENERICS_GRID_WS_PORT);
const server = new WebSocket.Server({ port, });

const originalRanges = points.rangesOf2dPoints(originalPoints);

const defaultRanges = dimensions.to2dRanges([
  util.toInt(process.env.GENERICS_GRID_RANGE_X_START),
  util.toInt(process.env.GENERICS_GRID_RANGE_X_STOP),
], [
  util.toInt(process.env.GENERICS_GRID_RANGE_Y_START),
  util.toInt(process.env.GENERICS_GRID_RANGE_Y_STOP),
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
  paths: {
    source: emitter,
  },
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

  app.paths.source.on(pathEvents.DATA, pathsListener);
  websocket.on(
    serverEvents.CLOSE,
    endSession(app, sessionState, pathsListener)
  );
};

const endSession = (app, sessionState, pathsListener) => () => {
  const endedAt = Date.now();
  app.paths.source.removeListener(pathEvents.DATA, pathsListener);
  app.logger.log(`Session ${sessionState.id} ended at ${endedAt}`);
};

const sendMsg = (app, sessionState) => ({ tripUpdates, }) => {
  const sentAt = Date.now();
  const privatePathIds = Object.values(tripUpdates).reduce((acc, updates) => {
    if (updates) {

      return [ ...acc, ...Object.values(updates), ];
    }
    return acc;
  }, []).map(({ id, }) => id);
  sessionState.pathIds = paths.updateIds(privatePathIds, sessionState.pathIds);
  sessionState.paths = Object.entries(tripUpdates).reduce((acc, [ privateId, updates, ]) => {
    const publicId = sessionState.pathIds.privateToPublic[privateId];
    const cached = sessionState.paths[publicId];

    if (updates) {
      const ps = paths.fromTripUpdates(
        app.points.ids,
        sessionState.pathIds,
        updates,
        cached || {}
      );
      acc[publicId] = ps;
    } else {
      acc[publicId] = cached ? cached : null;
    }

    return acc;
  }, {});
  // sessionState.paths = Object.entries(sessionState.paths).reduce((acc, [ id, cachedPaths, ]) => {
  //   const update = tripUpdates[id];

  //   acc[id] = update
  //     ? paths.fromTripUpdates(
  //         app.points.ids,
  //         sessionState.pathIds,
  //         tripUpdates,
  //         cachedPaths
  //       )
  //     : cachedPaths;

  //   return acc;
  // }, {});
  const pathsArr = Object.values(sessionState.paths).reduce((acc, ps) => {
    if (ps) {
      return [ ...acc, ...Object.values(ps), ];
    }
    return acc;
  }, [])
  console.log(pathsArr);
  const msg = {
    paths: pathsArr,
    points: points.toPublic(app.points.ids, sessionState.points),
    dimensions: sessionState.dimensions,
    sentAt,
  };
  const serialized = JSON.stringify(msg);
  sessionState.websocket.send(serialized);
  // app.logger.log(`Session ${sessionState.id} msg sent at ${sentAt}`);
  // app.logger.log(`Session ${sessionState.id} msg ${serialized}`);
};

server.on(serverEvents.CONNECTION, startSession(app));
