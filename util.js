const _ = module.exports;

_.compose = (f, g) => (...args) => f(g(...args));

_.head = (xs) => xs[0];

_.mapObj = (f, obj) => Object.entries(obj).reduce((acc, [ k, v, ]) => {
  acc[k] = f(v);
  return acc;
}, {});

_.toInt = (x) => parseInt(x, 10);
