const _ = module.exports;

_.compose = (f, g) => (...args) => f(g(...args));

_.head = (xs) => xs[0];

_.keyBy = (f, xs) => xs.reduce(
  (acc, x) => {
    const key = f(x);
    acc[key] = x;
    return acc;
  },
{});

_.mapObj = (f, obj) => Object.entries(obj).reduce((acc, [ k, v, ]) => {
  acc[k] = f(v);
  return acc;
}, {});

_.toInt = (x) => parseInt(x, 10);
