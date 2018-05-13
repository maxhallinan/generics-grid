const paths = require(`./../../grid/paths`);

describe(`grid > paths`, () => {
  describe(`grid > paths > toIds`, () => {
    const tripUpdates = {
      'trip-update-1': {
        id: `trip-update-1`,
        currentStation: `station-1`,
      },
      'trip-update-2': {
        id: `trip-update-2`,
        currentStation: `station-2`,
      },
      'trip-update-3': {
        id: `trip-update-3`,
        currentStation: `station-3`,
      },
    };
    const privateIds = Object.values(tripUpdates).map(({ id, }) => id);
    const pathIds = paths.toIds(privateIds);

    test(
      `Returns a mapping to public id for each private id.`,
      () => {
        const actual = Object.keys(pathIds.privateToPublic);
        expect(actual).toEqual(expect.arrayContaining(privateIds));
      }
    );

    test(
      `Returns a mapping to private id for public id.`,
      () => {
        const actual = Object.values(pathIds.publicToPrivate);
        expect(actual).toEqual(expect.arrayContaining(privateIds));
      }
    );

    test(
      `privateToPublic and publicToPrivate are symmetrical.`,
      () => {
        Object.entries(pathIds.publicToPrivate).forEach(
          ([ publicId, privateId, ]) => {
            expect(publicId).toEqual(pathIds.privateToPublic[privateId]);
          }
        );
        Object.entries(pathIds.privateToPublic).forEach(
          ([ privateId, publicId, ]) => {
            expect(privateId).toEqual(pathIds.publicToPrivate[publicId]);
          }
        );
      }
    );
  });

  describe(`grid > paths > updateIds`, () => {
    const pathIds = {
      privateToPublic: {
        'private-1': `public-1`,
        'private-2': `public-2`,
      },
      publicToPrivate: {
        'public-1': `private-1`,
        'public-2': `private-2`,
      },
    };
    const updates = [ `private-1`, `private-3`, ];
    const updated = paths.updateIds(updates, pathIds);

    test(
      `Creates a new public id for each new private id.`,
      () => {
        updates.forEach((privateId) => {
          const actualPublic = updated.privateToPublic[privateId];
          const actualPrivate = updated.publicToPrivate[actualPublic];
          expect(privateId).toBe(actualPrivate);
        });
      }
    );

    test(
      `Keeps the old public id for each old private id in the updates array.`,
      () => {
        const expectedPublic = pathIds.privateToPublic[`private-1`];
        const actualPublic = updated.privateToPublic[`private-1`];
        const expectedPrivate = pathIds.publicToPrivate[`public-1`];
        const actualPrivate = updated.publicToPrivate[`public-1`];
        expect(actualPublic).toBe(expectedPublic);
        expect(actualPrivate).toBe(expectedPrivate);
      }
    );

    test(
      `Filters any ids not contained by the updates array.`,
      () => {
        expect(updated.privateToPublic[`private-2`]).toBe(undefined);
        expect(updated.publicToPrivate[`public-2`]).toBe(undefined);
      }
    );
  });

  describe(`grid > paths > tripUpdatesToPaths`, () => {
    const pointIds = {
      privateToPublic: {
        'private-1': `public-1`,
        'private-2': `public-2`,
      },
      publicToPrivate: {
        'public-1': `private-1`,
        'public-2': `private-2`,
      },
    };
    const pathIds = {
      privateToPublic: {
        'private-1': `public-1`,
        'private-3': `public-3`,
      },
      publicToPrivate: {
        'public-1': `private-1`,
        'public-3': `private-3`,
      },
    };
    const tripUpdates = {
      'private-1': {
        id: `private-1`,
        currentStation: `private-2`,
      },
      'private-3': {
        id: `private-3`,
        currentStation: `private-2`,
      },
    };
    const cache = {
      'public-1': {
        id: `public-1`,
        points: [ `public-1`, ],
      },
      'public-2': {
        id: `public-2`,
        points: [ `public-2`, ],
      },
    };
    const updatedCache = paths.tripUpdatesToCache(
      pointIds,
      pathIds,
      tripUpdates,
      cache
    );

    test(`Keys each path by public id.`, () => {
      const expected =
        Object.values(tripUpdates)
          .map(({ id, }) => pathIds.privateToPublic[id]);
      const actual = Object.keys(updatedCache);

      expect(actual).toEqual(expect.arrayContaining(expected));
    });

    test(
      `Maps tripUpdate.currentStation to the expected public point id.`,
      () => {
        const actual1 = updatedCache[`public-1`].points[1];
        const expected1 =
          pointIds.privateToPublic[tripUpdates[`private-1`].currentStation];
        const actual2 = updatedCache[`public-3`].points[0];
        const expected2 =
          pointIds.privateToPublic[tripUpdates[`private-3`].currentStation];
        expect(actual1).toEqual(expected1);
        expect(actual2).toEqual(expected2);
      }
    );

    test(`Appends the point id to the points array.`, () => {
      const expected1 = expect.arrayContaining([ `public-1`, `public-2`, ]);
      const expected2 = expect.arrayContaining([ `public-2`, ]);
      expect(updatedCache[`public-1`].points).toEqual(expected1);
      expect(updatedCache[`public-3`].points).toEqual(expected2);
    });

    test(`Removes cached paths that are not in the update set.`, () => {
      expect(updatedCache[`public-2`]).toBe(undefined);
    });
  });
});
