const util = require(`./../util`);

const _ = module.exports;

_.feedToTripUpdateEntities = util.compose(
  (entities) => entities.filter((entity) => !!entity.trip_update),
  (feed) => feed.entity
);

_.stopIdToStationId = util.compose(
  util.head,
  (stopId) => (/^[0-9]+/).exec(stopId) || []
);

_.tripUpdateEntitiesToTripUpdates = (entities) => entities.map((entity) => ({
  id: util.get([ `trip_update`, `trip`, `trip_id`, ])(null)(entity),
  currentStation: util.compose(
    _.stopIdToStationId,
    util.get([ `trip_update`, `stop_time_update`, 0, `stop_id`])(null),
  )(entity),
}));

_.feedToTripUpdates = util.compose(
  (tripUpdates) => util.keyBy(({ id, }) => id, tripUpdates),
  _.tripUpdateEntitiesToTripUpdates,
  _.feedToTripUpdateEntities
);
