require(`dotenv`).config();
const EventEmitter = require(`events`);
const url = require(`url`);
const uuidv1 = require(`uuid/v1`);
const WebSocket = require(`ws`);
const dimensions = require(`./grid/dimensions`);
const logger = require(`./logger`);
const originalPoints = require(`./points.json`);
const points = require(`./grid/points`);
const util = require(`./util`);

// data source
const pathEvents = {
  DATA: `data`,
};
const emitter = new EventEmitter();
setInterval(() => {
  emitter.emit(pathEvents.DATA, { foo: Date.now(), });
}, 2000);

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
  defaults: {
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

const toSessionPoints = util.compose(
  points.floor2dPoints,
  points.scale2dPointsToRanges,
);

const startSession = (app) => (websocket, request) => {
  const id = uuidv1();
  const startedAt = Date.now();
  app.logger.log(`Session ${id} started at ${startedAt}.`);

  const { query, } = url.parse(request.url, true);

  const sessionRanges = dimensions.to2dRanges([
    util.toInt(query.x_start) || app.defaults.ranges.x[0],
    util.toInt(query.x_stop) || app.defaults.ranges.x[1],
  ], [
    util.toInt(query.y_start) || app.defaults.ranges.y[0],
    util.toInt(query.y_stop) || app.defaults.ranges.y[1],
  ]);

  const sessionDimensions = dimensions.to2d(
    sessionRanges.x,
    sessionRanges.y,
  );

  const sessionPoints = toSessionPoints(
    sessionRanges,
    app.defaults.ranges,
    app.original.points,
  );

  const session = {
    id,
    dimensions: sessionDimensions,
    points: sessionPoints,
    startedAt,
    websocket: websocket,
  };

  websocket.on(serverEvents.CLOSE, endSession(app, session));
  app.paths.source.on(pathEvents.DATA, sendMsg(app, session));
};

const endSession = (app, session) => () => {
  const endedAt = Date.now();
  app.logger.log(`Session ${session.id} ended at ${endedAt}`);
};

const sendMsg = (app, session) => (data) => {
  const sentAt = Date.now();
  const msg = {
    paths: [],
    points: points.toPublic(app.points.ids, session.points),
    dimensions: session.dimensions,
    sentAt,
  };
  const serialized = JSON.stringify(msg);
  session.websocket.send(serialized);
  app.logger.log(`Session ${session.id} msg sent at ${sentAt}`);
  app.logger.log(`Session ${session.id} msg ${serialized}`);
};

server.on(serverEvents.CONNECTION, startSession(app));
