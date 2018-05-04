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

describe(`grid > scale2dPoints`, () => {
  const newRanges = {
    x: [ 11, 20, ],
    y: [ 21, 30, ],
  };

  const points = [
    [ 1, 1, ],
    [ 2, 2, ],
    [ 5, 5, ],
    [ 7, 7, ],
    [ 10, 10, ],
  ];

  const expected = [
    [ 11, 21, ],
    [ 12, 22, ],
    [ 15, 25, ],
    [ 17, 27, ],
    [ 20, 30, ],
  ];

  const actual = grid.scale2dPoints(newRanges, points);

  test(`Converts each pair of numbers to the expected pair of numbers.`, () => {
    actual.forEach((point, index) => {
      expect(point[0]).toBe(expected[index][0]);
      expect(point[1]).toBe(expected[index][1]);
    });
  });
});
