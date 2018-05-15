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
      `Returns a mapping to private id for each public id.`,
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

  describe(`grid > paths > fromTripUpdates`, () => {
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
        'private-4': `public-4`,
      },
      publicToPrivate: {
        'public-1': `private-1`,
        'public-3': `private-3`,
        'public-4': `private-4`,
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
      'private-4': {
        id: `private-4`,
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
      'public-4': {
        id: `public-4`,
        points: [ `public-2`, ],
      },
    };
    const updatedCache = paths.fromTripUpdates(
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

    test(
      `Does not append a new point when it is a duplicate of a cached point.`,
      () => {
        const expected = expect.arrayContaining([ `public-2`, ]);
        expect(updatedCache[`public-4`].points).toEqual(expected);
        expect(updatedCache[`public-4`].points.length).toBe(1);
      }
    );

    test(`Removes cached paths that are not in the update set.`, () => {
      expect(updatedCache[`public-2`]).toBe(undefined);
    });
  });

  describe(`grid > paths > updateIdsFromFeeds`, () => {
    const feeds1 = {
      'feed-1': {
        'tripupdate-private-1': {
          id: 'tripupdate-private-1',
          currentStation: 'point-private-1'
        },
      },
      'feed-2': {
        'tripupdate-private-2': {
          id: 'tripupdate-private-2',
          currentStation: 'point-private-2'
        },
      },
      'feed-3': null,
    };
    const feeds2 = {
      'feed-2': {
        'tripupdate-private-2': {
          id: 'tripupdate-private-2',
          currentStation: 'point-private-3'
        },
      },
      'feed-3': {
        'tripupdate-private-3': {
          id: 'tripupdate-private-3',
          currentStation: 'point-private-4'
        },
      },
    };
    const emptyIds = {
      privateToPublic: {},
      publicToPrivate: {},
    };
    const pathIds = paths.updateIdsFromFeeds(feeds1, emptyIds);
    const updatedPathIds = paths.updateIdsFromFeeds(feeds2, pathIds);

    test(`Adds a new public/private id pair for a new trip update.`, () => {
      const privateId = `tripupdate-private-3`;
      const publicId = updatedPathIds.privateToPublic[privateId];
      const expected = updatedPathIds.publicToPrivate[publicId];
      expect(publicId).toBeTruthy();
      expect(expected).toBe(privateId);
    });

    test(`Keeps a public/private id pair that is not in the update.`, () => {
      const privateId = `tripupdate-private-1`;
      const publicId = pathIds.privateToPublic[privateId];
      const actual1 = updatedPathIds.privateToPublic[privateId];
      const actual2 = updatedPathIds.publicToPrivate[actual1];
      expect(actual1).toBe(publicId);
      expect(actual2).toBe(privateId);
    });

    test(
      `Keeps the same new public id for an existing private id.`,
      () => {
        const expected = pathIds.privateToPublic[`tripupdate-private-2`];
        const actual = updatedPathIds.privateToPublic[`tripupdate-private-2`];
        expect(actual).toBe(expected);
      }
    );
  });

  describe.skip(`grid > paths > updateFromFeeds`, () => {
    const feeds1 = {
      'feed-1': {
        'tripupdate-private-1': {
          id: 'tripupdate-private-1',
          currentStation: 'point-private-1'
        },
        'tripupdate-private-2': {
          id: 'tripupdate-private-2',
          currentStation: 'point-private-2'
        }
      },
      'feed-2': {
        'tripupdate-private-3': {
          id: 'tripupdate-private-3',
          currentStation: 'point-private-3'
        },
      },
      'feed-3': null,
    };
    const feeds2 = {
      'feed-1': {
        'tripupdate-private-1': {
          id: 'tripupdate-private-1',
          currentStation: 'point-private-5'
        },
      },
      'feed-2': null,
      'feed-3': {
        'tripupdate-private-4': {
          id: 'tripupdate-private-4',
          currentStation: 'point-private-6'
        },
      },
    };
    const pointIds = {
      privateToPublic: {
        'point-private-1': 'point-public-1',
        'point-private-2': 'point-public-2',
        'point-private-3': 'point-public-3',
        'point-private-4': 'point-public-4',
        'point-private-5': 'point-public-5',
        'point-private-6': 'point-public-6',
        'point-private-7': 'point-public-7',
      },
      publicToPrivate: {
        'point-public-1': 'point-private-1',
        'point-public-2': 'point-private-2',
        'point-public-3': 'point-private-3',
        'point-public-4': 'point-private-4',
        'point-public-5': 'point-private-5',
        'point-public-6': 'point-private-6',
        'point-public-7': 'point-private-7',
      },
    };
    const pathIds = {
      privateToPublic: {
        'tripupdate-private-1': 'path-public-1',
        'tripupdate-private-2': 'path-public-2',
        'tripupdate-private-3': 'path-public-3',
        'tripupdate-private-4': 'path-public-4',
      },
      publicToPrivate: {
        'path-public-1': 'tripupdate-private-1',
        'path-public-2': 'tripupdate-private-2',
        'path-public-3': 'tripupdate-private-3',
        'path-public-4': 'tripupdate-private-4',
      },
    };
    const pathsCached = {
      'feed-1': {
        'path-public-1': {
          id: 'path-public-1',
          points: [ 'point-public-7', ],
        },
        'path-public-2': {
          id: 'path-public-2',
          points: [],
        },
      },
      'feed-2': {
        'path-public-3': {
          id: 'path-public-3',
          points: [],
        },
      },
      'feed-3': {
        'path-public-4': {
          id: 'path-public-3',
          points: [],
        },
      },
    };
    test(`Keys paths by feed id.`, () => {});
    test(`Caches every path in a feed update.`, () => {});
    test(`Creates a new path if there is not cached path.`, () => {});
    test(`Does not overwrite a cached path.`, () => {});
    test(`Appends a new point to cached points.`, () => {});
    test(`Does not appends a duplicate point.`, () => {});
    test(`Removes cached paths that are not in a feed update.`, () => {});
  });

  describe(`grid > paths > toPublic`, () => {
    const ps = {
      'feed-1': {
        'path-public-1': {
          id: 'path-public-1',
          points: ['point-public-1'],
        },
        'path-public-2': {
          id: 'path-public-2',
          points: ['point-public-2', 'point-public-3'],
        },
      },
      'feed-2': {
        'path-public-3': {
          id: 'path-public-3',
          points: ['point-public-4'],
        },
      },
    };
    test(`Combines the paths for each feed to a flat array of paths.`, () => {
      const actual = paths.toPublic(ps);
      const expected = expect.arrayContaining([
        ps['feed-1']['path-public-1'],
        ps['feed-1']['path-public-2'],
        ps['feed-2']['path-public-3'],
      ]);
      expect(actual).toEqual(expected);
    });
  });
});
