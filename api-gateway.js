const express = require('express');
const httpProxy = require('http-proxy');
const cors = require('cors');
const fetch = require('node-fetch');
const { router: serviceRegistryRouter, serviceRegistry, updateServiceStatus } = require('./service-registry');

const app = express();
const proxy = httpProxy.createProxyServer();

// Use the comprehensive service registry
const services = serviceRegistry;

// Middleware
app.use(cors());
app.use(express.json());

// Service Registry Routes
app.use('/registry', serviceRegistryRouter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'API Gateway running', services });
});

// Service discovery endpoint
app.get('/services', (req, res) => {
  res.json(services);
});

// Proxy routes
app.use('/api/aios/*', (req, res) => {
  proxy.web(req, res, { target: services.aios.url }, (err) => {
    if (err) {
      res.status(503).json({ error: 'AIOS service unavailable' });
    }
  });
});

app.use('/api/bytebot/*', (req, res) => {
  proxy.web(req, res, { target: services.bytebot.url }, (err) => {
    if (err) {
      res.status(503).json({ error: 'Bytebot service unavailable' });
    }
  });
});

app.use('/api/postiz/*', (req, res) => {
  proxy.web(req, res, { target: services.postiz.url }, (err) => {
    if (err) {
      res.status(503).json({ error: 'Postiz service unavailable' });
    }
  });
});

app.use('/api/factif', (req, res) => {
  const originalUrl = req.url;
  console.log(`Factif route - Original URL: ${originalUrl}`);
  const targetPath = req.url.replace(/^\/api\/factif/, '') || '/';
  console.log(`Target path: ${targetPath}`);
  console.log(`Proxying to: ${services.factif.url}${targetPath}`);

  proxy.web(req, res, {
    target: services.factif.url,
    pathRewrite: (path) => path.replace(/^\/api\/factif/, '')
  }, (err) => {
    if (err) {
      console.error('Proxy error:', err);
      res.status(503).json({ error: 'Factif-AI service unavailable' });
    }
  });
});

// WebSocket support for real-time updates
const http = require('http');
const { Server } = require('socket.io');

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// WebSocket connection handling
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });

  // Service status updates
                socket.on('service-status', (data) => {
                    console.log('Service update:', data);
                    updateServiceStatus(data.service, data.status, new Date().toISOString());
                });
});

// Service health checking
function checkServiceHealth() {
  Object.keys(services).forEach(service => {
    const serviceUrl = services[service].url;
    fetch(`${serviceUrl}/health`, { timeout: 5000 })
      .then(() => {
        if (services[service].status !== 'healthy') {
          services[service].status = 'healthy';
          io.emit('service-update', { service, status: 'healthy' });
        }
      })
      .catch(() => {
        if (services[service].status !== 'unhealthy') {
          services[service].status = 'unhealthy';
          io.emit('service-update', { service, status: 'unhealthy' });
        }
      });
  });
}

// Check service health every 30 seconds
setInterval(checkServiceHealth, 30000);

// Start server
const PORT = process.env.PORT || 8080;
const HOST = process.env.HOST || '0.0.0.0';
server.listen(PORT, HOST, () => {
  console.log(`API Gateway running on ${HOST}:${PORT}`);
  console.log('WebSocket server enabled');
  console.log('Available services:', Object.keys(services));
});