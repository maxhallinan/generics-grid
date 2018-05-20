const dimensions = require(`./../grid/dimensions`);
const points = require(`./../grid/points`);
const util = require(`./../util`);
const _ = module.exports;

_.toRanges = (query, defaults) => dimensions.to2dRanges([
  util.toInt(query.x_start) || defaults.x[0],
  util.toInt(query.x_end) || defaults.x[1],
], [
  util.toInt(query.y_start) || defaults.y[0],
  util.toInt(query.y_end) || defaults.y[1],
]);

_.toPoints = util.compose(
  points.floor2dPoints,
  points.scale2dPointsToRanges
);

_.handleErr = ({ logger, sessionId, websocket, }) => (err) => {
  logger.error(`session error`, {
    error: err,
    type: `SESSION_ERROR`
  });
};

_.sendMsg = ({ logger, sessionId, websocket, }) => (msg) => {
  const sentAt = Date.now();
  const serialized = JSON.stringify({
    ...msg,
    sentAt,
  });

  websocket.send(serialized);

  logger.info(`message sent`, {
    sessionId,
    type: `MESSAGE_SENT`,
  });
};

_.end = ({ logger, sessionId, feedSubscription, }) => () => {
  feedSubscription.unsubscribe();

  logger.info(`session ended`, {
    sessionId,
    type: `SESSION_ENDED`,
  });
};

_.initState = ({
  query,
  defaultRanges,
  originalPoints,
  originalRanges,
  pointIds,
}) => {
  const sessionRanges = _.toRanges(query, defaultRanges);

  const sessionDimensions = dimensions.to2d(
    sessionRanges.x,
    sessionRanges.y
  );

  const sessionPoints = _.toPoints(
    sessionRanges,
    originalRanges,
    originalPoints
  );

  return ({
    dimensions: sessionDimensions,
    pathIds: {
      privateToPublic: {},
      publicToPrivate: {},
    },
    paths: {},
    pointIds,
    points: sessionPoints,
  });
};
