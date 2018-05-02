const WebSocket = require('ws');

const port = process.argv[2] || 8080;

const wss = new WebSocket.Server({ port, });

wss.on('connection', (ws) => {
  console.log(`Connection opened. Timestamp: ${Date.now()}`)

  const intervalId = setInterval(() => {
    ws.send(Date.now());
  }, 1500)

  ws.on('close', () => {
    clearInterval(intervalId);
  });
});

console.log(`Server started on port ${port}`);
