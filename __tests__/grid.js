const grid = require(`./../grid.js`);

describe(`grid > rangeOf`, () => {
  const ns = [ 7, 1, 3, 4, 3, 10, ];
  const actual = grid.rangeOf(ns);

  test(`Returns an array with two elements.`, () => {
    expect(Array.isArray(actual)).toBeTruthy();
    expect(actual.length).toBe(2);
  });

  test(`Returns the correct lower bound.`, () => {
    expect(actual[0]).toBe(1);
  });

  test(`Returns the correct upper bound.`, () => {
    expect(actual[1]).toBe(10);
  });
});

describe(`grid > scaleRange`, () => {
  const newRange = [ 11, 20, ];
  const oldRange = [ 1, 10, ];
  const ns = [ 1, 2, 5, 10, ];
  const expected = [ 11, 12, 15, 20, ];
  const actual = ns.map((n) => grid.scaleRange(newRange, oldRange, n));

  test(`Converts each input number to the expected output number.`, () => {
    actual.forEach((n, index) => {
      expect(n).toBe(expected[index]);
    });
  });
});

describe(`grid > scale2dPoint`, () => {
  const oldRanges = {
    x: [1, 10],
    y: [1, 10],
  };
  const newRanges = {
    x: [ 11, 20, ],
    y: [ 21, 30, ],
  };
  const point = [2, 5];
  const expected = [ 12, 25 ];
  const actual = grid.scale2dPoint(newRanges, oldRanges, point);

  test(`Converts each pair of numbers to the expected pair of numbers.`, () => {
    expect(actual[0]).toBe(expected[0]);
    expect(actual[1]).toBe(expected[1]);
  });
});
