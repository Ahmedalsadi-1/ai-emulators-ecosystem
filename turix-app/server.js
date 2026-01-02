const http = require('http');
const fs = require('fs');
const path = require('path');

let WebSocketServer;
try {
  ({ WebSocketServer } = require('ws'));
} catch (error) {
  WebSocketServer = null;
}

const startTimestamp = new Date().toISOString();

function getHealthPayload() {
  return {
    status: 'ok',
    message: 'Turix service running',
    timestamp: new Date().toISOString(),
    startedAt: startTimestamp,
  };
}

const server = http.createServer((req, res) => {
  const url = req.url || '/';

  if (url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(getHealthPayload()));
    return;
  }

  if (url === '/' || url === '/index.html') {
    fs.readFile(path.join(__dirname, 'index.html'), (err, data) => {
      if (err) {
        res.writeHead(500);
        res.end('Error loading index.html');
        return;
      }
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(data);
    });
    return;
  }

  res.writeHead(404);
  res.end('Not found');
});

const PORT = Number(process.env.TURIX_PORT || 3000);
server.listen(PORT, () => {
  console.log(`🚀 TuriX Unified AI Ecosystem running at http://localhost:${PORT}`);
  console.log('🎯 Features:');
  console.log('  • Unified interface for AI services');
  console.log('  • Voice command support');
  console.log('  • Service selection and status');
  console.log('  • Command execution and feedback');
  console.log('  • Modal AI traversal capabilities');
  console.log('');
  console.log('📱 Available Services:');
  console.log('  • 🤖 AIOS (Running on port 8010)');
  console.log('  • 🖥️ Bytebot (Desktop automation)');
  console.log('  • 📱 Postiz (Social media)');
  console.log('  • 🧪 Factif-AI (Testing automation)');
  console.log('');
  console.log('🎉 TuriX is ready for AI-powered automation!');

  if (!WebSocketServer) {
    console.warn('WebSocket support disabled (install "ws" to enable).');
  }
});

if (WebSocketServer) {
  const wss = new WebSocketServer({ server });
  wss.on('connection', (socket) => {
    socket.send(JSON.stringify({ type: 'health', data: getHealthPayload() }));
  });

  setInterval(() => {
    const payload = JSON.stringify({ type: 'health', data: getHealthPayload() });
    wss.clients.forEach((client) => {
      if (client.readyState === 1) {
        client.send(payload);
      }
    });
  }, 15000);
}
