import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';

import { dockerRoutes } from './routes/docker';
import { monitoringRoutes } from './routes/monitoring';
import { mcpRoutes } from './routes/mcp';
import { projectRoutes } from './routes/projects';
import { WebSocketManager } from './services/websocket';

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server });

// Middleware
app.use(helmet());
app.use(cors());
app.use(compression());
app.use(express.json());

// Routes
app.use('/api/docker', dockerRoutes);
app.use('/api/monitoring', monitoringRoutes);
app.use('/api/mcp', mcpRoutes);
app.use('/api/projects', projectRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// WebSocket manager for real-time updates
const wsManager = new WebSocketManager(wss);

// Start periodic status updates
setInterval(async () => {
  try {
    // Broadcast service status updates to connected clients
    const status = await getAllServiceStatus();
    wsManager.broadcast('service-status', status);
  } catch (error) {
    console.error('Failed to broadcast service status:', error);
  }
}, 5000); // Update every 5 seconds

const PORT = process.env.PORT || 8080;

server.listen(PORT, () => {
  console.log(`Monitoring API server running on port ${PORT}`);
});

// Helper function to get all service status
async function getAllServiceStatus() {
  // Implementation will be in service layer
  return {};
}