const protobuf = require(`protobufjs`);
const queryString = require(`querystring`);
const request = require(`request-promise-native`);
const mtaGtfsDescriptor = require(`./../proto/nyct-subway.json`);
const util = require(`./../util`);

const _ = module.exports;

const FeedMessage = protobuf.Root
  .fromJSON(mtaGtfsDescriptor)
  .lookupType(`transit_realtime.FeedMessage`);

const getFeed = (config, feedId) => {
  const qs = queryString.stringify({
    key: config.apiKey,
    // http://datamine.mta.info/list-of-feeds
    feed_id: feedId,
  });

  const url = `${config.urlBase}?${qs}`;

  return request({
    encoding: null,
    method: 'GET',
    resolveWithFullResponse: true,
    family: 4,
    url,
  }).then(res => {
    res.resume();
    return res.body;
  }).then(res => [ feedId, res, ]);
};

const getFeeds = (config, feedIds) =>
  Promise.all(feedIds.map((feedId) => getFeed(config, feedId)));

const decodeFeed = (decoded, [ feedId, buf, ]) => {
  try {
    decoded[feedId] = FeedMessage.toObject(FeedMessage.decode(buf));
  } catch (err) {
    decoded[feedId] = null;
  }

  return decoded;
};

const decodeFeeds = (feeds) => feeds.reduce(decodeFeed, {});

_.fetchAll = (config, feedIds) =>
  getFeeds(config, feedIds)
    .then(decodeFeeds)

_.filterNull = (feeds) =>
  Object.entries(feeds).reduce((filtered, [id, feed]) => {
    if (feed) {
      filtered[id] = feed;
    }

    return filtered;
  }, {});
