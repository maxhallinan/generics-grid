const Maybe = require(`./../maybe`);
const util = require(`./../util`);

const _ = module.exports;

_.feedToTripUpdateEntities = util.compose(
  (entities) => entities.filter((entity) => !!entity.tripUpdate),
  (feed) => feed.entity
);

_.stopIdToStationId =
  (stopId) => stopId.substring(0, stopId.length - 1);

// a -> Maybe String
const toMTripUpdateId = util.compose(
  Maybe.fromNullable,
  util.get([ `tripUpdate`, `trip`, `tripId`, ])(Maybe.Nothing())
);

// Maybe a => a -> a
const toMStationId = Maybe.chain(util.compose(
  Maybe.fromNullable,
  _.stopIdToStationId
));

// a -> Maybe String
const toMStopId = util.compose(
  Maybe.fromNullable,
  util.get([ `tripUpdate`, `stopTimeUpdate`, 0, `stopId`])(Maybe.Nothing())
);

// a -> Maybe String
const toMCurrentStation = util.compose(toMStationId, toMStopId);

// Maybe a => a -> a -> Bool
const isNullTripUpdate = (mTripUpdateId, mCurrentStation) =>
  Maybe.isNothing(mTripUpdateId) || Maybe.isNothing(mCurrentStation);

// a -> Maybe { id : String, currentStation : String }
const toMTripUpdate = (entity) => {
  const mTripUpdateId = toMTripUpdateId(entity);
  const mCurrentStation = toMCurrentStation(entity);
  const isNull = isNullTripUpdate(mTripUpdateId, mCurrentStation);
  const patterns = {
    Just: util.identity,
    Nothing: util.identity,
  };
  return isNull ? Maybe.Nothing() : Maybe.Just({
    id: Maybe.matchWith(patterns)(mTripUpdateId),
    currentStation: Maybe.matchWith(patterns)(mCurrentStation),
  });
};

_.tripUpdateEntitiesToTripUpdates = util.compose(
  // `Array (Maybe TripUpdate)` to `Array TripUpdate`
  util.map(Maybe.matchWith({
    Nothing: util.identity,
    Just: util.identity,
  })),
  // Remove trip updates that do not have both a trip id and a current
  // station id.
  Maybe.filterNothings,
  // Trip updates is null when there is not both a trip id and a current
  // station id.
  util.map(toMTripUpdate)
);

_.fromMtaFeed = util.compose(
  (tripUpdates) => util.keyBy(({ id, }) => id, tripUpdates),
  _.tripUpdateEntitiesToTripUpdates,
  _.feedToTripUpdateEntities
);

_.fromMtaFeeds = util.mapObj.bind(null, _.fromMtaFeed);
