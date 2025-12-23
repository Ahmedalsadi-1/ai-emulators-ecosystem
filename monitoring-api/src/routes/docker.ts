import { Router } from 'express';
import { DockerService } from '../services/docker';

const router = Router();
const dockerService = new DockerService();

// Get all services status
router.get('/services', async (req, res) => {
  try {
    const services = await dockerService.getAllServices();
    res.json(services);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get specific service status
router.get('/services/:serviceName', async (req, res) => {
  try {
    const { serviceName } = req.params;
    const service = await dockerService.getServiceStatus(serviceName);
    res.json(service);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Start service
router.post('/services/:serviceName/start', async (req, res) => {
  try {
    const { serviceName } = req.params;
    await dockerService.startService(serviceName);
    res.json({ message: `Service ${serviceName} started successfully` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Stop service
router.post('/services/:serviceName/stop', async (req, res) => {
  try {
    const { serviceName } = req.params;
    await dockerService.stopService(serviceName);
    res.json({ message: `Service ${serviceName} stopped successfully` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Restart service
router.post('/services/:serviceName/restart', async (req, res) => {
  try {
    const { serviceName } = req.params;
    await dockerService.restartService(serviceName);
    res.json({ message: `Service ${serviceName} restarted successfully` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get service logs
router.get('/services/:serviceName/logs', async (req, res) => {
  try {
    const { serviceName } = req.params;
    const { tail = 100, since } = req.query;
    const logs = await dockerService.getServiceLogs(serviceName, {
      tail: parseInt(tail as string),
      since: since as string
    });
    res.json({ logs });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get service metrics
router.get('/services/:serviceName/metrics', async (req, res) => {
  try {
    const { serviceName } = req.params;
    const metrics = await dockerService.getServiceMetrics(serviceName);
    res.json(metrics);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export { router as dockerRoutes };