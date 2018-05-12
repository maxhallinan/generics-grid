const _ = module.exports;

_.compose = (...fns) => (...args) => {
  const [ f1, ...fs ] = [ ...fns, ].reverse();
  return fs.reduce((x, f) => f(x), f1(...args));
};

_.identity = (x) => x;

_.isObj = (x) => x !== null && typeof x === `object`;

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
