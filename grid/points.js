const util = require(`./../util`);
const uuidv1 = require(`uuid/v1`);

const _ = module.exports;

_.rangeOf = (ns) => [
  Math.min(...ns),
  Math.max(...ns),
];

_.rangesOf2dPoints = (points) => {
  const ps = Object.values(points);
  const xs = ps.map(p => p.coordinates.x);
  const ys = ps.map(p => p.coordinates.y);

  return ({
    x: _.rangeOf(xs),
    y: _.rangeOf(ys),
  });
};

_.privateToPublicIds = (points) => util.mapObj(() => uuidv1(), points);

_.publicToPrivateIds = (privateToPublic) =>
  Object.entries(privateToPublic).reduce((acc, [ internalId, publicId, ]) => {
    acc[publicId] = internalId;
    return acc;
  }, {});

_.createIds = (points) => {
  const privateToPublic = _.privateToPublicIds(points);
  const publicToPrivate = _.publicToPrivateIds(privateToPublic);

  return {
    privateToPublic,
    publicToPrivate,
  };
};

_.scaleToRange = ([ newMin, newMax, ], [ oldMin, oldMax, ], n) =>
  ((newMax - newMin) * (n - oldMin) / (oldMax - oldMin)) + newMin;

_.scale2dCoordToRanges = (newRanges, oldRanges, { x, y, }) => ({
  x: _.scaleToRange(newRanges.x, oldRanges.x, x),
  y: _.scaleToRange(newRanges.y, oldRanges.y, y),
});

_.scale2dPointsToRanges = (newRanges, oldRanges, points) =>
  util.mapObj((point) => ({
    ...point,
    coordinates: _.scale2dCoordToRanges(
      newRanges,
      oldRanges,
      point.coordinates
    ),
  }), points);

_.floor2dCoordinates = (coordinates) => util.mapObj(Math.floor, coordinates);

_.floor2dPoints = (points) =>
  util.mapObj((point) => ({
    ...point,
    coordinates: _.floor2dCoordinates(point.coordinates),
  }), points);

_.toPublicIds = (pointIds, points) =>
  util.mapObj((point) => ({
    ...point,
    id: pointIds.privateToPublic[point.id],
  }), points);

_.toPublic = util.compose(
  Object.values,
  _.toPublicIds,
);
