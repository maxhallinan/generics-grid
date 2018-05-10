const dimensions = require(`./../grid/dimensions`);
const util = require(`./../util`);
const _ = module.exports;

_.toRanges = (query, defaults) => dimensions.to2dRanges([
  util.toInt(query.x_start) || defaults.x[0],
  util.toInt(query.x_end) || defaults.x[1],
], [
  util.toInt(query.y_start) || defaults.y[0],
  util.toInt(query.y_end) || defaults.y[1],
]);