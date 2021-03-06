const _ = module.exports;

_.add = (x) => (y) => x + y;

_.always = (x) => () => x;

_.compose = (...fns) => (...args) => {
  const [ f1, ...fs ] = [ ...fns, ].reverse();
  return fs.reduce((x, f) => f(x), f1(...args));
};

_.head = (xs) => xs[0];

_.identity = (x) => x;

_.increment = _.add(1);

_.isObj = (x) => x !== null && typeof x === `object`;

_.flatten = (arr) => arr.reduce((acc, xs) => [ ...acc, ...xs, ], []);

_.get = (propArr) => (fallback) => (src) =>  {
  const go = (props, current) => {
    const [ p, ...ps ] = props;

    if (props.length < 1) {
      return current;
    }

    if (_.isObj(current) && !current.hasOwnProperty(p)) {
      return fallback;
    }

    return go(ps, current[p]);
  };

  return go(propArr, src);
};

_.head = (xs) => xs[0];

_.keyBy = (f, xs) => xs.reduce(
  (acc, x) => {
    const key = f(x);
    acc[key] = x;
    return acc;
  },
  {});

_.map = (f) => (functor) => functor.map(f);

_.mapObj = (f, obj) => Object.entries(obj).reduce((acc, [ k, v, ]) => {
  acc[k] = f(v);
  return acc;
}, {});

_.toInt = (x) => parseInt(x, 10);

_.prop = (x) => (obj) => obj[x];

_.subtract = (x, y) => x - y;
