const server = require(`./../server.js`);

describe(`server > createSession`, () => {
  const scaleX = 300;
  const scaleY = 400;
  const session = server.createSession(scaleX, scaleY);

  test(`Returns a session object with the expected keys.`, () => {
    const expected = [ `scale`, ];
    const actual = Object.keys(session);
    expect(actual).toEqual(expect.arrayContaining(expected));
  });

  test(`Sets session.scale to an object with an x key and a y key.`, () => {
    const expected = [ `x`, `y`, ];
    const actual = Object.keys(session.scale);
    expect(actual).toEqual(expect.arrayContaining(expected));
  });

  test(`Sets scale.x to the value of the first argument.`, () => {
    expect(session.scale.x).toBe(scaleX);
  });

  test(`Sets scale.y to the value of the second argument.`, () => {
    expect(session.scale.y).toBe(scaleY);
  });
});

describe(`server > sessionToMsg`, () => {
  const scaleX = 300;
  const scaleY = 400;
  const session = server.createSession(scaleX, scaleY);
  const timestamp = Date.now();
  const msg = server.sessionToMsg(timestamp, session);

  test(`Returns a session object with the expected keys.`, () => {
    const expected = [ `timestamp`, `scale`, ];
    const actual = Object.keys(msg);
    expect(actual).toEqual(expect.arrayContaining(expected));
  });

  test(`Sets msg.timestamp to the value of the first argument.`, () => {
    expect(msg.timestamp).toEqual(timestamp);
  });

  test(`Sets msg.scale to the value of session.scale.`, () => {
    expect(msg.scale).toEqual(session.scale);
  });
});
