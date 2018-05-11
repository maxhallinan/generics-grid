const util = require(`./../util`);

const _ = module.exports;

_.entityToTripUpdate = (entities) => entities;

_.feedToTripUpdateEntities = util.compose(
  (entities) => entities.filter((entity) => !!entity.trip_update),
  (feed) => feed.entity
);

_.filterByTripUpdate = (entities) => entities;

_.stopIdToStationId = util.compose(
  util.head,
  (stopId) => (/^[1-9]+/).exec(stopId) || []
);

_.tripUpdatesToTrips = (tripUpdates) => tripUpdates;
