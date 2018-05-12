const _ = module.exports;

const types = {
  JUST: `Just`,
  NOTHING: `Nothing`,
};

_.Nothing = () => ({
  __type: types.NOTHING,
  chain: () => _.Nothing(),
  map: () => _.Nothing(),
  matchWith: (patterns) => patterns.Nothing(),
});

_.Just = (x) => ({
  __type: types.JUST,
  chain: (f) => f(x),
  map: (f) => _.Just(f(x)),
  matchWith: (patterns) => patterns.Just(x),
});

_.fromNullable = (x) => (x === undefined || x === null)
  ? _.Nothing()
  : _.Just(x);

_.isJust = (mX) => mX.__type === types.JUST;

_.isNothing = (mX) => mX.__type === types.NOTHING;

_.chain = (f) => (mX) => mX.chain(f);

_.map = (f) => (mX) => mX.map(f);

_.matchWith = (patterns) => (mX) => mX.matchWith(patterns);

_.filterNothings = (mXs) => mXs.reduce((acc, mX) => {
  if (_.isJust(mX)) {
    acc.push(mX);
  }
  return acc;
}, []);
