const points = require(`./../../grid/points`);

const ps = {
  '1': {
    id: '1',
    coordinates: {
      x: 1,
      y: 2,
    },
  },
  '2': {
    id: '2',
    coordinates: {
      x: 2,
      y: 3,
    },
  },
  '3': {
    id: '3',
    coordinates: {
      x: 3,
      y: 4,
    },
  },
};

describe(`grid > points`, () => {
  describe(`grid > points > rangeOf`, () => {
    test(
      `Returns a pair of numbers representing the start and end of the range.`,
      () => {
        const ns = [ 10, 1, 2, 7, 4, 5, 9, 1, ];
        const expected = [1, 10];
        const actual = points.rangeOf(ns);
        expect(actual).toEqual(expected);
      });
    }
  );

  describe(`grid > points > rangesOf2dPoints`, () => {
    test(
      `Returns an object containing the ranges for the x and y dimensions.`,
      () => {
        const expected = {
          x: [ 1, 3, ],
          y: [ 2, 4, ],
        };
        const actual = points.rangesOf2dPoints(ps);

        expect(actual).toEqual(expected);
      }
    );
  });

  describe(`grid > points > privateToPublicIds`, () => {
    test(`Creates an entry in the lookup table for each private id.`, () => {
      const actual = points.privateToPublicIds(ps);
      const expectedPrivateIds = Object.values(ps).map(({ id, }) => id);
      const actualPrivateIds = Object.keys(actual);
      const actualPublicIds = Object.values(actual);
      expectedPrivateIds.forEach((privateId) => {
        expect(actualPrivateIds).toContain(privateId);
      });
      actualPublicIds.forEach((publicId) => {
        expect(publicId.length).not.toBe(0);
      });
    });
  });

  describe(`grid > points > publicToPrivateIds`, () => {
    const privateToPublic = points.privateToPublicIds(ps);
    const publicToPrivate = points.publicToPrivateIds(privateToPublic);
    test(`Creates an entry in the lookup table for each public id.`, () => {
      Object.entries(privateToPublic).forEach(([privateId, publicId]) => {
        expect(publicToPrivate[publicId]).toBe(privateId);
      });
    });
  });

  describe(`grid > points > createIds`, () => {
    const ids = points.createIds(ps);
    test(
      `Returns an object with the keys privateToPublic and publicToPrivate.`,
      () => {
        const actual = Object.keys(ids);
        const expected = [ `privateToPublic`, `publicToPrivate`, ];
        actual.forEach((k) => {
          expect(expected).toContain(k);
        });
      }
    );

    test(
      `privateToPublic and publicToPrivate are symmetrical mappings.`,
      () => {
        const { privateToPublic, publicToPrivate, } = ids;
        Object.entries(privateToPublic).forEach(([ privateId, publicId, ]) => {
          expect(privateId).toBe(publicToPrivate[publicId]);
        });
        Object.entries(publicToPrivate).forEach(([ publicId, privateId, ]) => {
          expect(publicId).toBe(privateToPublic[privateId]);
        });
      }
    );
  });

  describe(`grid > points > scaleToRange`, () => {
    const oldRange = [1, 10];
    const newRange = [11, 20];
    const n = 2;
    const actual = points.scaleToRange(newRange, oldRange, n);
    const expected = 12;

    test(`Scales n to the target range.`, () => {
      expect(actual).toBe(expected);
    });
  });

  describe(`grid > points > scale2dCoordToRanges`, () => {
    const newRanges = {
      x: [ 11, 20, ],
      y: [ 11, 20, ],
    };
    const oldRanges = {
      x: [ 1, 10, ],
      y: [ 1, 10, ],
    };
    const coord = {
      x: 1,
      y: 2,
    };
    const actual = points.scale2dCoordToRanges(newRanges, oldRanges, coord);
    const expected = {
      x: 11,
      y: 12,
    };

    test(`Returns a coordinate object.`, () => {
      const actualKeys = Object.keys(actual);
      const expectedKeys = [ `x`, `y`, ];
      actualKeys.forEach((k) => {
        expect(expectedKeys).toContain(k);
      });
    });

    test(`Scales the x coordinate to the target range.`, () => {
      expect(actual.x).toBe(expected.x);
    });

    test(`Scales the y coordinate to the target range.`, () => {
      expect(actual.y).toBe(expected.y);
    });
  });

  describe(`grid > points > scale2dPointsToRanges`, () => {});
  describe(`grid > points > floor2dCoordinates`, () => {});
  describe(`grid > points > floor2dPoints`, () => {});
  describe(`grid > points > toPublicIds`, () => {});
  describe(`grid > points > toPublic`, () => {});
});
