const _ = module.exports;

_.rangeOf = (ns) => [
  Math.min(...ns),
  Math.max(...ns),
];

_.scaleRange = ([ newMin, newMax, ], [ oldMin, oldMax, ], n) =>
  ((newMax - newMin) * (n - oldMin) / (oldMax - oldMin)) + newMin;

_.scale2dPoints = (newRanges, points) => {
  const rangeX = _.rangeOf(points.map(p => p[0]));
  const rangeY = _.rangeOf(points.map(p => p[1]));

  return points.map(p => [
    _.scaleRange(newRanges.x, rangeX, p[0]),
    _.scaleRange(newRanges.y, rangeY, p[1]),
  ]);
};
