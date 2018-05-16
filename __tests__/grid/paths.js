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
          id: `tripupdate-private-1`,
          currentStation: `point-private-1`,
        },
      },
      'feed-2': {
        'tripupdate-private-2': {
          id: `tripupdate-private-2`,
          currentStation: `point-private-2`,
        },
      },
      'feed-3': null,
    };
    const feeds2 = {
      'feed-2': {
        'tripupdate-private-2': {
          id: `tripupdate-private-2`,
          currentStation: `point-private-3`,
        },
      },
      'feed-3': {
        'tripupdate-private-3': {
          id: `tripupdate-private-3`,
          currentStation: `point-private-4`,
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

  describe(`grid > paths > updateFromFeeds`, () => {
    const feeds1 = {
      'feed-1': {
        'tripupdate-private-1': {
          id: `tripupdate-private-1`,
          currentStation: `point-private-1`,
        },
        'tripupdate-private-2': {
          id: `tripupdate-private-2`,
          currentStation: `point-private-2`,
        },
      },
      'feed-2': {
        'tripupdate-private-3': {
          id: `tripupdate-private-3`,
          currentStation: `point-private-3`,
        },
      },
      'feed-3': null,
    };
    const feeds2 = {
      'feed-1': {
        'tripupdate-private-1': {
          id: `tripupdate-private-1`,
          currentStation: `point-private-5`,
        },
      },
      'feed-2': null,
      'feed-3': {
        'tripupdate-private-4': {
          id: `tripupdate-private-4`,
          currentStation: `point-private-6`,
        },
      },
    };
    const pointIds = {
      privateToPublic: {
        'point-private-1': `point-public-1`,
        'point-private-2': `point-public-2`,
        'point-private-3': `point-public-3`,
        'point-private-4': `point-public-4`,
        'point-private-5': `point-public-5`,
        'point-private-6': `point-public-6`,
        'point-private-7': `point-public-7`,
      },
      publicToPrivate: {
        'point-public-1': `point-private-1`,
        'point-public-2': `point-private-2`,
        'point-public-3': `point-private-3`,
        'point-public-4': `point-private-4`,
        'point-public-5': `point-private-5`,
        'point-public-6': `point-private-6`,
        'point-public-7': `point-private-7`,
      },
    };
    const pathIds = {
      privateToPublic: {
        'tripupdate-private-1': `path-public-1`,
        'tripupdate-private-2': `path-public-2`,
        'tripupdate-private-3': `path-public-3`,
        'tripupdate-private-4': `path-public-4`,
      },
      publicToPrivate: {
        'path-public-1': `tripupdate-private-1`,
        'path-public-2': `tripupdate-private-2`,
        'path-public-3': `tripupdate-private-3`,
        'path-public-4': `tripupdate-private-4`,
      },
    };
    const updated1 = paths.updateFromFeeds(feeds1, pointIds, pathIds, {});
    const updated2 = paths.updateFromFeeds(feeds2, pointIds, pathIds, updated1);

    test(`Keys paths by feed id.`, () => {
      const actual1 = Object.keys(updated1);
      const actual2 = Object.keys(updated2);
      const expected = expect.arrayContaining([
        `feed-1`,
        `feed-2`,
        `feed-3`,
      ]);
      expect(actual1).toEqual(expected);
      expect(actual2).toEqual(expected);
    });

    test(`Caches every path found in a feed update.`, () => {
      expect(updated1[`feed-1`][`path-public-1`]).toBeTruthy();
      expect(updated1[`feed-1`][`path-public-2`]).toBeTruthy();
      expect(updated1[`feed-2`][`path-public-3`]).toBeTruthy();
      expect(updated1[`feed-3`]).toBe(null);

      expect(updated2[`feed-1`][`path-public-1`]).toBeTruthy();
      expect(updated2[`feed-2`][`path-public-3`]).toBeTruthy();
      expect(updated2[`feed-3`][`path-public-4`]).toBeTruthy();
    });

    test(`Does not overwrite a cached feed if the updated feed is null.`, () => {
      const actual1 = updated1[`feed-2`][`path-public-3`];
      const actual2 = updated2[`feed-2`][`path-public-3`];
      expect(actual1).toBe(actual2);
    });

    test(`Removes cached paths that are not in the feed update.`, () => {
      expect(updated1[`feed-1`][`path-public-2`]).toBeTruthy();
      expect(updated2[`feed-1`][`path-public-2`]).toBe(undefined);
    });

    test(`Appends a new point to cached points.`, () => {
      const feeds3 = {
        'feed-1': {
          'tripupdate-private-1': {
            id: `tripupdate-private-1`,
            currentStation: `point-private-7`,
          },
        },
      };
      const updated3 =
        paths.updateFromFeeds(feeds3, pointIds, pathIds, updated2);
      const expected1 = expect.arrayContaining([
        `point-public-1`,
      ]);
      const expected2 = expect.arrayContaining([
        `point-public-1`,
        `point-public-5`,
      ]);
      const expected3 = expect.arrayContaining([
        `point-public-1`,
        `point-public-5`,
        `point-public-7`,
      ]);
      expect(updated1[`feed-1`][`path-public-1`].points).toEqual(expected1);
      expect(updated2[`feed-1`][`path-public-1`].points).toEqual(expected2);
      expect(updated3[`feed-1`][`path-public-1`].points).toEqual(expected3);
    });

    test(`Does not appends a duplicate point.`, () => {
      const updated3 =
        paths.updateFromFeeds(feeds2, pointIds, pathIds, updated2);
      const actual1 = updated3[`feed-1`][`path-public-1`].points;
      const expected1 = updated2[`feed-1`][`path-public-1`].points;
      const actual2 = updated3[`feed-3`][`path-public-4`].points;
      const expected2 = updated2[`feed-3`][`path-public-4`].points;
      expect(actual1).toBe(expected1);
      expect(actual2).toBe(expected2);
    });
  });

  describe(`grid > paths > toPublic`, () => {
    const ps = {
      'feed-1': {
        'path-public-1': {
          id: `path-public-1`,
          points: [ `point-public-1`, ],
        },
        'path-public-2': {
          id: `path-public-2`,
          points: [ `point-public-2`, `point-public-3`, ],
        },
      },
      'feed-2': {
        'path-public-3': {
          id: `path-public-3`,
          points: [ `point-public-4`, ],
        },
      },
    };
    test(`Combines the paths for each feed to a flat array of paths.`, () => {
      const actual = paths.toPublic(ps);
      const expected = expect.arrayContaining([
        ps[`feed-1`][`path-public-1`],
        ps[`feed-1`][`path-public-2`],
        ps[`feed-2`][`path-public-3`],
      ]);
      expect(actual).toEqual(expected);
    });
  });
});
