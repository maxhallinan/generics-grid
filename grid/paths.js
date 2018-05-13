const uuidv1 = require(`uuid/v1`);
const util = require(`./../util`);

const _ = module.exports;

const privateToPublicIds = (privateIds) =>
  privateIds.reduce((acc, privateId) => {
    acc[privateId] = uuidv1();
    return acc;
  }, {});

const publicToPrivateIds = (privateToPublic) =>
  Object.entries(privateToPublic).reduce((acc, [privateId, publicId]) => {
    acc[publicId] = privateId;
    return acc;
  }, {});

_.toIds = (privateIds) => {
  const privateToPublic = privateToPublicIds(privateIds);
  const publicToPrivate = publicToPrivateIds(privateToPublic);

  return {
    privateToPublic,
    publicToPrivate,
  };
};

_.updateIds = (privateIds, pathIds) =>
  privateIds.reduce((acc, privateId) => {
    const publicId = pathIds.privateToPublic[privateId]
      ? pathIds.privateToPublic[privateId]
      : uuidv1();

    acc.privateToPublic[privateId] = publicId;
    acc.publicToPrivate[publicId] = privateId;

    return acc;
  }, { privateToPublic: {}, publicToPrivate: {}, });
