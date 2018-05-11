const util = require(`./../util`);

const _ = module.exports;

_.entityToTripUpdate = (entities) => entities;

_.feedToTripUpdateEntities = util.compose(
  (entities) => entities.filter((entity) => !!entity.trip_update),
  (feed) => feed.entity
);

_.tripUpdateEntitiesToTripUpdates = (entities) => entities.map((entity) => ({
  id:
    entity.trip_update &&
    entity.trip_update.trip &&
    entity.trip_update.trip.trip_id ||
    null,
  currentStation:
    entity.trip_update.stop_time_update &&
    entity.trip_update.stop_time_update[0] &&
    entity.trip_update.stop_time_update[0].stop_id ||
    null,
}));

_.stopIdToStationId = util.compose(
  util.head,
  (stopId) => (/^[1-9]+/).exec(stopId) || []
);

_.tripUpdatesToTrips = (tripUpdates) => tripUpdates;
