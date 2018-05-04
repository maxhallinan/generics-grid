const createSession = (x, y) => ({
  scale: {
    x,
    y,
  },
});
module.exports.createSession = createSession;

const sessionToMsg = (timestamp, session) => ({
  timestamp,
  scale: session.scale,
});
module.exports.sessionToMsg = sessionToMsg;


