const _ = module.exports;

_.to2dRanges = (x, y) => ({ x, y, });

_.to2d = (xRange, yRange) => ({
  x: {
    range: xRange,
  },
  y: {
    range: yRange,
  },
});
