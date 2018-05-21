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

const originalRanges = points.rangesOf2dPoints(originalPoints);
const defaultRanges = dimensions.to2dRanges([
  util.toInt(process.env[`RANGE_X_START`]),
  util.toInt(process.env[`RANGE_X_STOP`]),
], [
  util.toInt(process.env[`RANGE_Y_START`]),
  util.toInt(process.env[`RANGE_Y_STOP`]),
]);
const app$ = Rx.of({
  default_: {
    ranges: defaultRanges,
  },
  logger,
  original: {
    points: originalPoints,
    ranges: originalRanges,
  },
  points: {
    ids: points.createIds(originalPoints),
  },
})

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
const tripUpdates$ = tripUpdateFeeds;

const logServerListening = ({ logger, }) => (server) => {
  const address = server.address();
  logger.info(`Server started`, address);
};
const logServerErr = ({ logger, }) => (error) => {
  logger.error(`Server error`, { error, })
};
const logServerClose = ({ logger, }) => () => {
  logger.warn(`Server closed`);
};
const port = util.toInt(process.env[`WS_PORT`]);
const createServer$ = ({ port, }) => Rx.Observable.create((observer) => {
  const server = new WebSocket.Server({ port, });
  server.on(`listening`, () => observer.next(server));
  server.on(`error`, (err) => observer.error(err));
  return () => {
    server.close();
    observer.complete();
  };
});
const server$ = createServer$({ port, }).pipe(
  rxOperators.tap({
    complete: logServerClose({ logger, }),
    error: logServerErr({ logger, }),
    next: logServerListening({ logger, }),
  })
);
const websockets$ = server$.pipe(
  rxOperators.flatMap((server) => {
    return Rx.Observable.create((observer) => {
      server.on(`connection`, (websocket, request) => {
        console.log('on connection');
        observer.next({ request, websocket, });
      });
    });
  }),
);
const logConnectionOpen = ({ logger, }) => (connection) => {
  logger.info(`Connection opened`);
};
const logConnectionErr = ({ logger, }) => (connection) => {
  logger.error(`Connection error`, { error: connection.err, })
};
const logConnectionClose = ({ logger, }) => (connection) => {
  logger.info(`Connection closed`);
};
const createConnection$ = (connection) => Rx.Observable.create((observer) => {
  connection.websocket.on(`close`, () => {
    observer.complete(connection);
  });
  connection.websocket.on(`error`, (err) => {
    console.log('error');
    observer.error({
      ...connection,
      err,
    });
  });
  observer.next(connection);
});
const connections$ = websockets$.pipe(
  rxOperators.map(createConnection$),
  rxOperators.map((connection$) => connection$.pipe(
    rxOperators.tap({
      complete: logConnectionClose({ logger, }),
      error: logConnectionErr({ logger, }),
      next: logConnectionOpen({ logger, }),
    }),
  )),
);
const logSessionEnd = ({ logger, }) => (x) => {
  logger.info(`Session end`, x);
};
const logSessionErr = ({ logger, }) => (x) => {
  logger.error(`Session error`, x);
};
const logSessionStart = ({ logger, }) => (x) => {
  logger.info(`Session start`);
};
const sessionUpdate = ({ logger, }) => ([ session, tripUpdate, ]) => {
  logger.info(`Trip update`, { id: session.id, });
};
const sessions$ = connections$.pipe(
  rxOperators.map((connection$) => connection$.pipe(
    rxOperators.withLatestFrom(app$),
    rxOperators.map(([ connection, app, ]) => ({
      app,
      id: uuidv1(),
      query: (url.parse(connection.request.url, true)).query,
      request: connection.request,
      websocket: connection.websocket,
    })),
    rxOperators.map((s) => {
      const sessionRanges = session.toRanges(s.query, s.app.default_.ranges);

      const sessionDimensions = dimensions.to2d(
        sessionRanges.x,
        sessionRanges.y
      );

      const sessionPoints = session.toPoints(
        sessionRanges,
        s.app.original.ranges,
        s.app.original.points
      );

      // TODO: move to server/session#initState
      const initSession = {
        dimensions: sessionDimensions,
        pathIds: {
          privateToPublic: {},
          publicToPrivate: {},
        },
        paths: {},
        pointIds: s.app.points.ids,
        points: sessionPoints,
      };

      return {
        ...s,
        state: initSession,
      };
    }),
    rxOperators.tap({
      complete: logSessionEnd({ logger, }),
      error: logSessionErr({ logger, }),
      next: logSessionStart({ logger, }),
    }),
  )),
);

const sessionUpdates$ = sessions$.pipe(
  rxOperators.map((session$) => {
    const subscription = Rx.combineLatest(session$, tripUpdates$);
  }),
  rxOperators.map((session$) => Rx.combineLatest(session$, tripUpdates$).pipe(
    rxOperators.map(([ session, update, ]) => ({ se: session, update, })),
    rxOperators.scan((s, state) => {
      const { se, update, } = state;
      return {
        ...s,
        state: {
          ...s.state,
          pathIds: paths.updateIdsFromFeeds(
            update,
            se.state.pathIds
          ),
          paths: paths.updateFromFeeds(
            update,
            se.state.pointIds,
            se.state.pathIds,
            se.state.paths
          ),
        },
      };
    }),
    rxOperators.tap({
      completed: () => {
        logger.warn(`Session update completed`);
      },
      error: (err) => {
        logger.error(`Session update error`, { error: err.message, });
      },
      next: (...args) => {
        logger.info(`Session updated`);
      },
    }),
  ).subscribe({
    completed: () => null,
    error: () => null,
    next: () => null,
  })),
);

sessionUpdates$.subscribe({
  completed: () => null,
  error: () => null,
  next: () => null,
})
// TODO: move to server/session
// const handleErr = ({ logger, sessionId, websocket, }) => (err) => {
//   const errAt = Date.now();
//   websocket.close();
//   logger.error(`Feed error`, { error, sessionId, });
// };

// TODO: move to server/session
// const endSession = ({ logger, sessionId, subscription, }) => () => {
//   const endedAt = Date.now();
//   subscription.unsubscribe();
//   logger.info(`Session ended`, { sessionId, });
// };

// TODO: move to server/session
// const sendMsg = ({ logger, sessionId, websocket, }) => (msg) => {
//   const sentAt = Date.now();
//   const serialized = JSON.stringify({ ...msg, sentAt, });
//   websocket.send(serialized);
//   logger.info(`Message sent`, { sessionId, });
// };
// const messages$ = sessionUpdates$.pipe(
//   rxOperators.map((sessionUpdate$) => {})
// );
//     // connection$.pipe(
    //   rxOperators.withLatestFrom(app$),
    //   rxOperators.map(([ connection, app, ]) => ({
    //     app,
    //     id: uuidv1(),
    //     query: (url.parse(connection.request.url, true)).query,
    //     request: connection.request,
    //     websocket: connection.websocket,
    //   })),
    //   rxOperators.tap({
    //     complete: logSessionEnd({ logger, }),
    //     error: logSessionErr({ logger, }),
    //     next: logSessionStart({ logger, }),
    //   }),
    //   rxOperators.map((s) => {
    //     const sessionRanges = session.toRanges(query, s.app.default_.ranges);

    //     const sessionDimensions = dimensions.to2d(
    //       sessionRanges.x,
    //       sessionRanges.y
    //     );

    //     const sessionPoints = session.toPoints(
    //       sessionRanges,
    //       s.app.original.ranges,
    //       s.app.original.points
    //     );

    //     // TODO: move to server/session#initState
    //     const initSession = {
    //       dimensions: sessionDimensions,
    //       pathIds: {
    //         privateToPublic: {},
    //         publicToPrivate: {},
    //       },
    //       paths: {},
    //       pointIds: s.app.points.ids,
    //       points: sessionPoints,
    //     };

    //     return {
    //       ...s,
    //       state: initSession,
    //     };
    //   }),
    // ),
    // tripUpdates$
  // ).pipe(
    // rxOperators.tap({
    //   complete: (x) => { console.log('trip updates'); },
    //   error: (x) => { console.log('error'); },
    //   next: sessionUpdate({ logger, }),
    // }),
    // rxOperators.scan((s, feeds) => ({
    //   ...s,
    //   state: {
    //     ...s.state,
    //     pathIds: paths.updateIdsFromFeeds(
    //       feeds
    //       s.state.pathIds
    //     ),
    //     paths: paths.updateFromFeeds(
    //       feeds,
    //       s.state.pointIds,
    //       s.state.pathIds,
    //       state.paths
    //     ),
    //   },
    // })),
    // rxOperators.map((s) => ({
    //   dimensions: s.state.session.dimensions,
    //   id: s.id,
    //   paths: paths.toPublic(s.state.session.paths),
    //   points: points.toPublic(s.state.session.pointIds, state.session.points),
    //   websocket: s.websocket,
    // })),
  // ).subscribe({
    // complete: (x) => x
    // error: (x) => x,
    // next: (x) => x,
  // }))
// );

// sessions$.subscribe({
//   complete: (x) => console.log('complete'),
//   error: (x) => console.log('e'),
//   next: (x) => logger.info('Subscribed'),
// });

// Rx.zip(
//   websockets$,
//   app$,
//   (connection, app) => ({
//     app,
//     request: connection.request,
//     tripUpdate,
//     websocket: connection.websocket,
//   })
// );

// websockets$.pipe(
//   rXoperators.forEach((websocket$) => Rx.zip(websocket$, app$)),
//   rXoperators.forEach((session$) => session$.withLatestFrom(tripUpdates$, app$)),
// );

// sessions$.pipe(
//   rxOperators.do((state) => {
//     app.logger.info(`Session started`, { sessionId: session.id, });
//   }),
// );
// .pipe(
//   rxOperators.withLatestFrom(tripUpdates$)
// );

// const messages$ = session$.pipe(
//   rxOperators.do((state) => {
//     app.logger.info(`Session started`, { sessionId: session.id, });
//   }),
//   rxOperators.map((state) => ({
//     ...state,
//     query: (url.parse(state.request.url, true)).query,
//   })),
  // rxOperators.map((state) => {
  //   const sessionRanges = session.toRanges(query, state.app.default_.ranges);

  //   const sessionDimensions = dimensions.to2d(
  //     sessionRanges.x,
  //     sessionRanges.y
  //   );

  //   const sessionPoints = session.toPoints(
  //     sessionRanges,
  //     state.app.original.ranges,
  //     state.app.original.points
  //   );

  //   // TODO: move to server/session#initState
  //   const initSession = {
  //     dimensions: sessionDimensions,
  //     pathIds: {
  //       privateToPublic: {},
  //       publicToPrivate: {},
  //     },
  //     paths: {},
  //     pointIds: state.app.points.ids,
  //     points: sessionPoints,
  //   };

  //   return {
  //     ...state,
  //     session: initSession,
  //   };
  // }),
//   rxOperators.scan((state, feeds) => ({
//     ...state,
//     session: {
//       ...state.session,
//       pathIds: paths.updateIdsFromFeeds(
//         state.tripUpdate,
//         state.pathIds
//       ),
//       paths: paths.updateFromFeeds(
//         feeds,
//         state.pointIds,
//         state.pathIds,
//         state.paths
//       ),
//     },
//   })),
//   rxOperators.map((state) => ({
//     paths: paths.toPublic(state.session.paths),
//     points: points.toPublic(state.session.pointIds, state.session.points),
//     dimensions: state.session.dimensions,
//   })),
// );

// session$.subscribe({
//   complete: completeSession({
//     logger: app.logger,
//     sessionId,
//     websocket,
//   }),
//   error: handleErr({
//     logger: app.logger,
//     sessionId,
//     websocket,
//   }),
//   next: sendMsg({
//     logger: app.logger,
//     sessionId,
//     websocket,
//   }),
// });

// const startSession = (app) => (websocket, request) => {
//   const sessionId = uuidv1();
//   app.logger.info(`Session started`, { sessionId, });

//   const { query, } = url.parse(request.url, true);

//   const sessionRanges = session.toRanges(query, app.default_.ranges);

//   const sessionDimensions = dimensions.to2d(
//     sessionRanges.x,
//     sessionRanges.y
//   );

//   const sessionPoints = session.toPoints(
//     sessionRanges,
//     app.original.ranges,
//     app.original.points
//   );

//   // TODO: move to server/session#initState
//   const initSession = {
//     dimensions: sessionDimensions,
//     pathIds: {
//       privateToPublic: {},
//       publicToPrivate: {},
//     },
//     paths: {},
//     pointIds: app.points.ids,
//     points: sessionPoints,
//   };

//   // TODO: move to server/session#tripUpdatesToState
//   const sessionState = app.tripUpdateFeeds.pipe(
//     rxOperators.scan((state, feeds) => ({
//       ...state,
//       pathIds: paths.updateIdsFromFeeds(
//         feeds,
//         state.pathIds
//       ),
//       paths: paths.updateFromFeeds(
//         feeds,
//         state.pointIds,
//         state.pathIds,
//         state.paths
//       ),
//     }), initSession),
//   );

//   // TODO: move to server/session#stateToMessage
//   const sessionMessages = sessionState.pipe(
//     rxOperators.map((state) => ({
//       paths: paths.toPublic(state.paths),
//       points: points.toPublic(state.pointIds, state.points),
//       dimensions: state.dimensions,
//     })),
//   );

//   const subscription = sessionMessages.subscribe({
//     complete: completeSession({
//       logger: app.logger,
//       sessionId,
//       websocket,
//     }),
//     error: handleErr({
//       logger: app.logger,
//       sessionId,
//       websocket,
//     }),
//     next: sendMsg({
//       logger: app.logger,
//       sessionId,
//       websocket,
//     }),
//   });

//   websocket.on(
//     serverEvents.CLOSE,
//     endSession({
//       logger: app.logger,
//       sessionId,
//       subscription
//     })
//   );
// };

// // TODO: move to server/session
// const completeSession = ({ logger, sessionId, websocket, }) => () => {
//   const completedAt = Date.now();
//   websocket.close();
//   logger.warn(`Feed completed`, { sessionId, });
// };

// // TODO: move to server/session
// const handleErr = ({ logger, sessionId, websocket, }) => (err) => {
//   const errAt = Date.now();
//   websocket.close();
//   logger.error(`Feed error`, { error, sessionId, });
// };

// // TODO: move to server/session
// const endSession = ({ logger, sessionId, subscription, }) => () => {
//   const endedAt = Date.now();
//   subscription.unsubscribe();
//   logger.info(`Session ended`, { sessionId, });
// };

// // TODO: move to server/session
// const sendMsg = ({ logger, sessionId, websocket, }) => (msg) => {
//   const sentAt = Date.now();
//   const serialized = JSON.stringify({ ...msg, sentAt, });
//   websocket.send(serialized);
//   logger.info(`Message sent`, { sessionId, });
// };

// server.on(serverEvents.CONNECTION, startSession(app));
