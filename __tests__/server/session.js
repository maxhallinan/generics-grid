const dimensions = require(`./../../grid/dimensions`);
const session = require(`./../../server/session`);

describe(`server > session`, () => {
  describe(`server > session > toRanges`, () => {
    const defaultRanges = dimensions.to2dRanges([ 0, 316, ], [ 0, 400, ]);

    test(`Overrides the default x range start with query.x_start.`, () => {
      const query = {
        x_start: 10,
      };
      const expected = {
        x: [ 10, defaultRanges.x[1] ],
        y: defaultRanges.y,
      };
      const actual = session.toRanges(query, defaultRanges);
      expect(actual.x).toEqual(expect.arrayContaining(expected.x));
      expect(actual.y).toEqual(expect.arrayContaining(expected.y));
    });

    test(`Overrides the default x range end with query.x_end.`, () => {
      const query = {
        x_end: 10,
      };
      const expected = {
        x: [ defaultRanges.x[0], 10, ],
        y: defaultRanges.y,
      };
      const actual = session.toRanges(query, defaultRanges);
      expect(actual.x).toEqual(expect.arrayContaining(expected.x));
      expect(actual.y).toEqual(expect.arrayContaining(expected.y));
    });

    test(`Overrides the default y range start with query.y_start.`, () => {
      const query = {
        y_start: 10,
      };
      const expected = {
        x: defaultRanges.x,
        y: [ 10, defaultRanges.y[1], ],
      };
      const actual = session.toRanges(query, defaultRanges);
      expect(actual.x).toEqual(expect.arrayContaining(expected.x));
      expect(actual.y).toEqual(expect.arrayContaining(expected.y));
    });

    test(`Overrides the default y range end with query.y_end.`, () => {
      const query = {
        y_end: 10,
      };
      const expected = {
        x: defaultRanges.x,
        y: [ defaultRanges.y[0], 10, ],
      };
      const actual = session.toRanges(query, defaultRanges);
      expect(actual.x).toEqual(expect.arrayContaining(expected.x));
      expect(actual.y).toEqual(expect.arrayContaining(expected.y));
    });

    test(`Falls back to the defaults if no query overrides are given.`, () => {
      const query = {};
      const expected = defaultRanges;
      const actual = session.toRanges(query, defaultRanges);
      expect(actual.x).toEqual(expect.arrayContaining(expected.x));
      expect(actual.y).toEqual(expect.arrayContaining(expected.y));
    });
  });
});
