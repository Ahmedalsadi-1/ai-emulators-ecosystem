import { Router } from 'express';
import { DockerService } from '../services/docker';
import { MonitoringService } from '../services/monitoring';
import { MCPService } from '../services/mcp';

const router = Router();
const dockerService = new DockerService();
const monitoringService = new MonitoringService();
const mcpService = new MCPService();

// Get project monitoring overview
router.get('/:project/overview', async (req, res) => {
  try {
    const { project } = req.params;

    // Get services for this project
    const allServices = await dockerService.getAllServices();
    const projectServices = allServices.filter(s => s.project === project);

    // Get monitoring data
    const overview = await monitoringService.getSystemOverview();

    // Get MCP servers for this project
    const mcpServers = await mcpService.getServersByProject(project);

    // Get alerts for project services
    const alerts = await monitoringService.getAlerts(true);
    const projectAlerts = alerts.filter(alert =>
      projectServices.some(service => service.name === alert.service)
    );

    res.json({
      project,
      services: projectServices,
      overview,
      mcpServers,
      alerts: projectAlerts,
      dashboardUrl: await monitoringService.getProjectDashboardUrl(project)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get project service details
router.get('/:project/services/:service', async (req, res) => {
  try {
    const { project, service } = req.params;

    const serviceStatus = await dockerService.getServiceStatus(service);
    const metrics = await monitoringService.getServiceMetrics(service);
    const logs = await monitoringService.getServiceLogs(service, { limit: 50 });

    res.json({
      service: serviceStatus,
      metrics,
      logs
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Control project service
router.post('/:project/services/:service/:action', async (req, res) => {
  try {
    const { service, action } = req.params;

    switch (action) {
      case 'start':
        await dockerService.startService(service);
        res.json({ message: `Service ${service} started` });
        break;
      case 'stop':
        await dockerService.stopService(service);
        res.json({ message: `Service ${service} stopped` });
        break;
      case 'restart':
        await dockerService.restartService(service);
        res.json({ message: `Service ${service} restarted` });
        break;
      default:
        res.status(400).json({ error: 'Invalid action' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get project logs
router.get('/:project/logs', async (req, res) => {
  try {
    const { project } = req.params;
    const { service, level = 'info', limit = 100 } = req.query;

    let query = `{project="${project}"}`;
    if (service) {
      query = `{project="${project}", service="${service}"}`;
    }
    if (level !== 'all') {
      query = `{project="${project}", level="${level}"}`;
    }

    const logs = await monitoringService.getServiceLogs('', {
      query,
      limit: parseInt(limit as string)
    });

    res.json({ logs });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export { router as projectRoutes };