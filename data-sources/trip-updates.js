const util = require(`./../util`);

const _ = module.exports;

_.feedToTripUpdateEntities = util.compose(
  (entity) => entity.filter((e) => !!e.tripUpdate),
  (feed) => feed.entity
);

_.stopIdToStationId = (stopId) => stopId
  ? stopId.substring(0, stopId.length - 1)
  : null;

const toTripUpdateId = util.get([ `tripUpdate`, `trip`, `tripId`, ])(null);

const toStopId = util.get([ `tripUpdate`, `stopTimeUpdate`, 0, `stopId`])(null);

const toCurrentStation = util.compose(_.stopIdToStationId, toStopId);

const toTripUpdate = (entity) => {
  const id = toTripUpdateId(entity);
  const currentStation = toCurrentStation(entity);
  const tripUpdate = id && currentStation
    ? { id, currentStation, }
    : null;

  return tripUpdate;
};

_.tripUpdateEntitiesToTripUpdates = util.compose(
  (tripUpdates) => tripUpdates.filter((e) => e !== null),
  (entities) => entities.map(toTripUpdate)
);

_.fromMtaFeed = util.compose(
  (tripUpdates) => util.keyBy(util.prop('id'), tripUpdates),
  _.tripUpdateEntitiesToTripUpdates,
  _.feedToTripUpdateEntities
);

_.fromMtaFeeds = (feeds) => util.mapObj((feed) => (
  feed ? _.fromMtaFeed(feed) : null
), feeds);
