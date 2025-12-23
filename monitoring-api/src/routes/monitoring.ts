import { Router } from 'express';
import { MonitoringService } from '../services/monitoring';

const router = Router();
const monitoringService = new MonitoringService();

// Get Prometheus metrics
router.get('/metrics/:service', async (req, res) => {
  try {
    const { service } = req.params;
    const { range = '1h' } = req.query;
    const metrics = await monitoringService.getServiceMetrics(service, range as string);
    res.json(metrics);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get Grafana dashboard URL
router.get('/dashboard/:project', async (req, res) => {
  try {
    const { project } = req.params;
    const dashboardUrl = await monitoringService.getProjectDashboardUrl(project);
    res.json({ url: dashboardUrl });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get alerts
router.get('/alerts', async (req, res) => {
  try {
    const { active = 'true' } = req.query;
    const alerts = await monitoringService.getAlerts(active === 'true');
    res.json(alerts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get system overview metrics
router.get('/overview', async (req, res) => {
  try {
    const overview = await monitoringService.getSystemOverview();
    res.json(overview);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export { router as monitoringRoutes };