import WebSocket from 'ws';

const url = process.env.WS_URL || 'ws://127.0.0.1:8080';
const clients = Number(process.env.WS_CLIENTS || 50);
const durationMs = Number(process.env.WS_DURATION_MS || 30_000);

let opened = 0;
let messages = 0;
let errors = 0;

const sockets = Array.from({ length: clients }, (_, index) => {
  const socket = new WebSocket(url);
  socket.on('open', () => {
    opened += 1;
    socket.send(JSON.stringify({ action: 'bet', userId: `load-${index}`, bet: 10 }));
  });
  socket.on('message', () => {
    messages += 1;
  });
  socket.on('error', () => {
    errors += 1;
  });
  const interval = setInterval(() => {
    if (socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ action: 'cashout', multiplier: 1.5, bet: 10 }));
    }
  }, 1000 + (index % 10) * 100);
  socket.on('close', () => clearInterval(interval));
  return socket;
});

setTimeout(() => {
  for (const socket of sockets) socket.close();
  console.log(JSON.stringify({ url, clients, opened, messages, errors, durationMs }, null, 2));
  process.exit(errors > clients * 0.1 ? 1 : 0);
}, durationMs);
