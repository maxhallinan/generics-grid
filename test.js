const ws = new WebSocket('ws://localhost:8080');
ws.onopen = () => console.log('Opening connection');
ws.onerror = (err) => console.log(`Error: ${err.message}`);
ws.onmessage = (msg) => console.log(`Message received: ${msg.data}`);
