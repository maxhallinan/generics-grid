const points = require(`./../../grid/points`);

const ps = {
  '1': {
    id: `1`,
    coordinates: {
      x: 1,
      y: 2,
    },
  },
  '2': {
    id: `2`,
    coordinates: {
      x: 2,
      y: 3,
    },
  },
  '3': {
    id: `3`,
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
        const expected = [ 1, 10, ];
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
      Object.entries(privateToPublic).forEach(([ privateId, publicId, ]) => {
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
    const oldRange = [ 1, 10, ];
    const newRange = [ 11, 20, ];
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

  describe(`grid > points > scale2dPointsToRanges`, () => {
    const newRanges = {
      x: [ 11, 20, ],
      y: [ 11, 20, ],
    };
    const oldRanges = {
      x: [ 1, 10, ],
      y: [ 1, 10, ],
    };
    const actual = points.scale2dPointsToRanges(newRanges, oldRanges, ps);
    const expected = {
      '1': {
        id: `1`,
        coordinates: {
          x: 11,
          y: 12,
        },
      },
      '2': {
        id: `2`,
        coordinates: {
          x: 12,
          y: 13,
        },
      },
      '3': {
        id: `3`,
        coordinates: {
          x: 13,
          y: 14,
        },
      },
    };
    test(
      `Scales a collection of 2d points to the target 2d ranges.`,
      () => {
        expect(actual).toMatchObject(expected);
      }
    );
  });

  describe(`grid > points > floor2dCoordinates`, () => {
    const coordinates = {
      x: 1.1,
      y: 2.001,
    };
    const actual = points.floor2dCoordinates(coordinates);
    const expected = {
      x: 1,
      y: 2,
    };
    test(`Floors the values of a 2d coordinate.`, () => {
      expect(actual).toMatchObject(expected);
    });
  });

  describe(`grid > points > floor2dPoints`, () => {
    const pointsWithFloatCoords = {
      '1': {
        id: `1`,
        coordinates: {
          x: 1.123,
          y: 2.01,
        },
      },
      '2': {
        id: `1`,
        coordinates: {
          x: 2.111,
          y: 3.312,
        },
      },
      '3': {
        id: `3`,
        coordinates: {
          x: 3.71,
          y: 4.9,
        },
      },
    };

    const actual = points.floor2dPoints(pointsWithFloatCoords);

    const expected = {
      '1': {
        id: `1`,
        coordinates: {
          x: 1,
          y: 2,
        },
      },
      '2': {
        id: `1`,
        coordinates: {
          x: 2,
          y: 3,
        },
      },
      '3': {
        id: `3`,
        coordinates: {
          x: 3,
          y: 4,
        },
      },
    };

    test(`Floors each coordinate in a collection of 2d points.`, () => {
      expect(actual).toMatchObject(expected);
    });
  });

  describe(`grid > points > toPublicIds`, () => {
    const pointIds = points.createIds(ps);
    const actual = points.toPublicIds(pointIds, ps);

    test(`Replaces the private id with the corresponding public id.`, () => {
      Object.entries(ps).forEach(([ privateId, ]) => {
        const publicId = pointIds.privateToPublic[privateId];
        const point2 = actual[publicId];
        expect(point2.id).toBe(publicId);
      });
    });

    test(`Maps each point.id without modifying any other values.`, () => {
      Object.entries(ps).forEach(([ privateId, ]) => {
        const publicId = pointIds.privateToPublic[privateId];
        const point2 = actual[publicId];
        // eslint-disable-next-line no-unused-vars
        const { id: id1, ...p1 } = point2;
        // eslint-disable-next-line no-unused-vars
        const { id: id2, ...p2 } = point2;
        expect(p1).toMatchObject(p2);
      });
    });
  });

  describe(`grid > points > toPublic`, () => {
    const pointIds = points.createIds(ps);
    const actual = points.toPublic(pointIds, ps);

    test(`Returns an array of points.`, () => {
      expect(Array.isArray(actual)).toBeTruthy();
    });

    test(`Replaces the private id with the public id for each point.`, () => {
      actual.forEach((point1) => {
        const privateId = pointIds.publicToPrivate[point1.id];
        const point2 = ps[privateId];
        // eslint-disable-next-line no-unused-vars
        const { id: id1, ...p1 } = point1;
        // eslint-disable-next-line no-unused-vars
        const { id: id2, ...p2 } = point2;
        expect(p1).toMatchObject(p2);
      });
    });
  });
});
