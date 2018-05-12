const Maybe = require(`./../maybe`);
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

// a -> Maybe String
const toMTripUpdateId = util.compose(
  Maybe.fromNullable,
  util.get([ `trip_update`, `trip`, `trip_id`, ])(Maybe.Nothing())
);

// Maybe a => a -> a
const toMStationId = Maybe.chain(util.compose(
  Maybe.fromNullable,
  _.stopIdToStationId
));

// a -> Maybe String
const toMStopId = util.compose(
  Maybe.fromNullable,
  util.get([ `trip_update`, `stop_time_update`, 0, `stop_id`])(Maybe.Nothing())
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

_.feedToTripUpdates = util.compose(
  (tripUpdates) => util.keyBy(({ id, }) => id, tripUpdates),
  _.tripUpdateEntitiesToTripUpdates,
  _.feedToTripUpdateEntities
);
