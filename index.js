const WebSocket = require(`ws`);

// eslint-disable-next-line no-console 
const log = (...args) => console.log(...args);
const port = process.argv[2] || 8080;

const wss = new WebSocket.Server({ port, });

wss.on(`connection`, (ws) => {
  log(`Connection opened. Timestamp: \${Date.now()}`);

  const intervalId = setInterval(() => {
    ws.send(Date.now());
  }, 1500);

  ws.on(`close`, () => {
    clearInterval(intervalId);
  });
});

log(`Server started on port ${port}`);
