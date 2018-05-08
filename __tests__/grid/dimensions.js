const dimensions = require(`./../../grid/dimensions`);

const range1 = [0, 10];
const range2 = [10, 20];

const expectEqualArrays = (expected, actual) =>
  expect(actual).toEqual(expect.arrayContaining(expected));

describe(`grid > dimensions`, () => {
  describe(`grid > dimensions > to2dRanges`, () => {
    const rs = dimensions.to2dRanges(range1, range2);

    test(`Returns a ranges object.`, () => {
      const expected = [`x`, `y`];
      const actual = Object.keys(rs);
      expectEqualArrays(expected, actual);
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

    test(`Returns a dimensions object.`, () => {});

    test(`Assigns the first argument to x.range.`, () => {});

    test(`Assigns the second argument to y.range.`, () => {});
  });
});
