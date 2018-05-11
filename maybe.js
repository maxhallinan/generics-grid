const _ = module.exports;

const types = {
  JUST: `Just`,
  NOTHING: `Nothing`,
};

_.Nothing = () => ({
  __type: types.NOTHING,
  fold: () => _.Nothing(),
  map: () => _.Nothing(),
  matchWith: (patterns) => patterns.Nothing(),
});

_.Just = (x) => ({
  __type: types.JUST,
  fold: (f) => f(x),
  map: (f) => _.Just(f(x)),
  matchWith: (patterns) => patterns.Just(x),
});

_.fromNullable = (x) => (x === undefined || x === null)
  ? _.Nothing()
  : _.Just(x);

_.isJust = (mX) => mX.__type === types.JUST;

_.isNothing = (mX) => mX.__type === types.NOTHING;

_.foldM = (f, defaultValue, ms) => ms.map((m) => m.matchWith({
  Just: f,
  Nothing: () => defaultValue,
}));
