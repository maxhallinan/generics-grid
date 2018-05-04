require(`dotenv`).config();
const EventEmitter = require(`events`);
const url = require(`url`);
const uuidv1 = require(`uuid/v1`);
const WebSocket = require(`ws`);
const logger = require(`./logger`);
const util = require(`./util`);

// data source
const dataEvents = {
  DATA: `data`,
};
const emitter = new EventEmitter();
setInterval(() => {
  emitter.emit(dataEvents.DATA, { foo: Date.now(), });
}, 1500);

// server
const serverEvents = {
  CLOSE: `close`,
  CONNECTION : `connection`,
};
const port = util.toInt(process.env.GENERICS_GRID_WS_PORT);
const server = new WebSocket.Server({ port, });

const app = {
  defaultRanges: {
    x: [
      util.toInt(process.env.GENERICS_GRID_RANGE_X_START),
      util.toInt(process.env.GENERICS_GRID_RANGE_X_STOP),
    ],
    y: [
      util.toInt(process.env.GENERICS_GRID_RANGE_Y_START),
      util.toInt(process.env.GENERICS_GRID_RANGE_Y_STOP),
    ],
  },
  dataSource: emitter,
  logger,
  server,
};

const startSession = (app) => (websocket, request) => {
  const id = uuidv1();
  const startedAt = Date.now();
  app.logger.log(`Session ${id} started at ${startedAt}.`);

  const { query, } = url.parse(request.url, true);
  const ranges = {
    x: [
      util.toInt(query.x_start) || app.defaultRanges.x[0],
      util.toInt(query.x_stop) || app.defaultRanges.x[1],
    ],
    y: [
      util.toInt(query.y_start) || app.defaultRanges.y[0],
      util.toInt(query.y_stop) || app.defaultRanges.y[1],
    ],
  };

  const session = {
    id,
    ranges,
    startedAt,
    websocket: websocket,
  };

  websocket.on(serverEvents.CLOSE, endSession(app, session));
  app.dataSource.on(dataEvents.DATA, sendMsg(app, session));
};

const endSession = (app, session) => () => {
  const endedAt = Date.now();
  app.logger.log(`Session ${session.id} ended at ${endedAt}`);
};

const sendMsg = (app, session) => (data) => {
  const sentAt = Date.now();
  const msg = {
    data,
    sentAt,
    ranges: session.ranges,
  };
  const serialized = JSON.stringify(msg);
  session.websocket.send(serialized);
  app.logger.log(`Session ${session.id} msg sent at ${sentAt}`);
  app.logger.log(`Session ${session.id} msg ${serialized}`);
};

server.on(serverEvents.CONNECTION, startSession(app));
