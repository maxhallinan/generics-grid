// eslint-disable-next-line no-console
const log = (...args) => console.log(...args);
// const ws = new WebSocket(`ws://localhost:8080?x_start=0&x_end=100&y_start=0&y_end=100`);
const ws = new WebSocket(`ws://localhost:8080`);
ws.onopen = () => log(`Opening connection`);
ws.onerror = (err) => log(`Error: ${err.message}`);
ws.onmessage = (msg) => log(`Message received:`, JSON.parse(msg.data));
