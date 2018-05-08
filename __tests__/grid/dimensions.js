const dimensions = require(`./../../grid/dimensions`);

const range1 = [ 0, 10, ];
const range2 = [ 10, 20, ];

describe(`grid > dimensions`, () => {
  describe(`grid > dimensions > to2dRanges`, () => {
    const rs = dimensions.to2dRanges(range1, range2);
    const expected = {
      x: range1,
      y: range2,
    };

    test(`Returns the expected ranges object.`, () => {
      expect(rs).toMatchObject(expected);
    });

    test(`Assigns the first argument to the x range.`, () => {
      expect(rs.x).toEqual(range1);
    });

    test(`Assigns the second argument to the y range.`, () => {
      expect(rs.y).toEqual(range2);
    });
  });

  describe(`grid > dimensions > to2d`, () => {
    const ds = dimensions.to2d(range1, range2);
    const expected = {
      x: {
        range: range1,
      },
      y: {
        range: range2,
      },
    };

    test(`Returns the expected dimensions object.`, () => {
      expect(ds).toMatchObject(expected);
    });

    test(`Assigns the first argument to x.range.`, () => {
      expect(ds.x.range).toEqual(range1);
    });

    test(`Assigns the second argument to y.range.`, () => {
      expect(ds.y.range).toEqual(range2);
    });
  });
});
