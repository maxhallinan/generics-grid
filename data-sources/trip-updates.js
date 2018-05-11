const util = require(`./../util`);

const _ = module.exports;

_.entityToTripUpdate = (entities) => entities;

_.feedToTripUpdates = (feed) => feed;

_.filterByTripUpdate = (entities) => entities;

_.stopIdToStationId = util.compose(
  util.head,
  (stopId) => (/^[1-9]+/).exec(stopId) || []
);

_.tripUpdatesToTrips = (tripUpdates) => tripUpdates;
