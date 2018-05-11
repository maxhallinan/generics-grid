const tripUpdates = require(`./../../data-sources/trip-updates`);
const fixtures = require(`./../fixtures/data-sources/trip-updates`);

describe(`services > tripUpdates`, () => {
  describe(`services > trips > filterByTripUpdate`, () => {
    test(`Filters the list of entities to trip updates.`, () => {
    });
  });

  describe(`services > tripUpdates > entityToTripUpdate`, () => {
    const entity = fixtures.feed.entity[0];
    const actual = trips.entityToTripUpdate(entity);
    test(`Returns the trip_update from a trip update entity`, () => {
      expect(actual).toMatchObject(actual.trip_update);
    });
  });

  describe(`services > tripUpdates > feedToTripUpdates`, () => {
    test(`Returns an array of trip updates.`, () => {});
  });

  describe(`services > trips > tripUpdatesToTrips`, () => {
    // const expected = {
    //   '065350_3..S01R': {
    //     id: '065350_3..S01R',
    //     currentStation: '101N',
    //   },
    //   '064700_3..N01R': {
    //     id: '064700_3..N01R',
    //     currentStation: '135S',
    //   },
    // };

    test(`Returns an array of trips.`, () => {});
    test(`Sets tripUpdate.trip.trip_id as trip.id.`, () => {});
    test(
      `Sets tripUpdate.trip.stop_time_update[0].stop_id as trip.currentStation.`,
      () => {}
    );
  });

  describe.only(`services > tripUpdates > stopIdToStationId`, () => {
    test(`Extracts the station id from the stop id.`, () => {
      const stopId = '123S';
      const actual = tripUpdates.stopIdToStationId(stopId);
      const expected = '123';
      expect(actual).toBe(expected);
    });
  });
});
