const paths = require(`./../../grid/paths`);

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

describe(`grid > paths`, () => {
  describe(`grid > paths > toIds`, () => {
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
      `Creates a new entry in privateToPublic and publicToPrivate for each new id.`,
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
      `Filters any ids not present in the updates array.`,
      () => {
        expect(updated.privateToPublic[`private-2`]).toBe(undefined);
        expect(updated.publicToPrivate[`public-2`]).toBe(undefined);
      }
    );
  });

  // describe(`grid > paths > tripUpdatesToPaths`, () => {
  //   const tripUpdates = {};
  // });
  // describe(`grid > paths > updateCache`, () => {
  //   const pointIds = {
  //     privateToPublic: {
  //       'private-1': 'public-1',
  //       'private-2': 'public-2',
  //       'private-3': 'public-3',
  //     },
  //     publicToPrivate: {
  //       'public-1': 'private-1',
  //       'public-2': 'private-2',
  //       'public-3': 'private-3',
  //     },
  //   };
  //   const update = {
  //     'trip-update-1': {
  //       id: 'trip-update-1',
  //       currentStation: 'private-1',
  //     },
  //     'trip-update-2': {
  //       id: 'trip-update-2',
  //       currentStation: 'private-2',
  //     },
  //     'trip-update-3': {
  //       id: 'trip-update-3',
  //       currentStation: 'private-3',
  //     },
  //   };
  //   const cache = {
  //     'path-public-1': {
  //       id: 'path-public-1',
  //       points: [],
  //     },
  //     'path-public-2': {
  //       id: 'path-public-2',
  //       points: [],
  //     },
  //     'path-public-3': {
  //       id: 'path-public-3',
  //       points: [],
  //     },
  //   };
  //   const actual = paths.updateCache(pointIds, update, cache);

  //   test(`Keys each path by private id.`, () => {});
  //   test(`Maps tripUpdate.currentStation to the expected public point id.`, () => {});
  //   test(`Appends the point id to the points array.`, () => {});
  //   test(`Removes cached paths that are not in the update set.`, () => {});
  // });
});
