const tripUpdates = require(`./../../data-sources/trip-updates`);
const { feed, } = require(`./../fixtures/data-sources/trip-updates`);

describe(`services > tripUpdates`, () => {
  describe(`services > trips > feedToTripUpdateEntities`, () => {
    test(
      `Filters a list of all entities to a list of trip update entities.`,
      () => {
        const actual = tripUpdates.feedToTripUpdateEntities(feed);
        const expected =
          feed.entity.filter((entity) => entity.trip_update !== null);

        expect(actual).toEqual(expect.arrayContaining(expected));
      }
    );
  });

  describe(`services > trips > tripUpdateEntitiesToTripUpdates`, () => {
    test(
      `Transforms a list of all trip update entities a list of trip updates.`,
      () => {
        const entities = tripUpdates.feedToTripUpdateEntities(feed);
        const actual = tripUpdates.tripUpdateEntitiesToTripUpdates(entities);
        const expected = [ {
          id: `065350_3..S01R`,
          currentStation: `101N`,
        }, {
          id: `064700_3..N01R`,
          currentStation: `135S`,
        }, ];

        expect(actual).toEqual(expect.arrayContaining(expected));
      }
    );
  });

  describe(`services > tripUpdates > stopIdToStationId`, () => {
    test(`Extracts the station id from the stop id.`, () => {
      const stopId = `123S`;
      const actual = tripUpdates.stopIdToStationId(stopId);
      const expected = `123`;
      expect(actual).toBe(expected);
    });
  });

  describe.skip(`services > tripUpdates > feedToTripUpdates`, () => {
    const updates = feed.entity.filter((entity) => entity.trip_update !== null);
    const actuals = tripUpdates.feedToTripUpdates(feed);

    test(`Returns a table of trip updates keyed by trip_id.`, () => {
      updates.forEach((update) => {
        const tripId = update.trip_update.trip.trip_id;
        const actual = actuals[tripId];
        const actualId = actual.id;
        const actualKeys = Object.keys(actual);
        const expectedKeys = expect.arrayContaining([ `id`, `currentStation`, ]);
        expect(actual).toBeTruthy();
        expect(actualId).toBe(tripId);
        expect(actualKeys).toEqual(expectedKeys);
      });
    });

    test(`Returns the expected station id.`, () => {
      updates.forEach((update) => {
        const tripId = update.trip_update.trip.trip_id;
        const stopId = update.trip_update.stop_time_update[0].stop_id;
        const actual = actuals[tripId].currentStation;
        const expected = tripUpdates.stopIdToStationId(stopId);
        expect(actual).toBe(expected);
      });
    });
  });
});
