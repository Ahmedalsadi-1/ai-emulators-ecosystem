import { Router } from 'express';

export const unifiedApiRoutes = (
  serviceRegistry: any,
  requestRouter: any,
  authManager: any
) => {
  const router = Router();

  // Get all projects/services
  router.get('/projects', async (req, res) => {
    try {
      const services = await serviceRegistry.getAllServices();
      res.json({
        success: true,
        data: services.map((service: any) => ({
          id: service.id,
          name: service.name,
          category: service.metadata.category,
          status: service.status,
          capabilities: service.capabilities
        }))
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to fetch projects'
      });
    }
  });

  // Get project status
  router.get('/projects/:serviceId/status', async (req, res) => {
    try {
      const { serviceId } = req.params;
      const service = await serviceRegistry.discover(serviceId);

      if (!service) {
        return res.status(404).json({
          success: false,
          error: 'Service not found'
        });
      }

      res.json({
        success: true,
        data: {
          id: service.id,
          status: service.status,
          uptime: service.uptime,
          version: service.version,
          lastHealthCheck: service.lastHealthCheck
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to fetch service status'
      });
    }
  });

  // Execute action on service
  router.post('/projects/:serviceId/actions/:action', async (req, res) => {
    try {
      const { serviceId, action } = req.params;
      const payload = req.body;

      // Route to service
      const response = await requestRouter.route({
        id: `req_${Date.now()}`,
        path: `/api/actions/${action}`,
        method: 'POST',
        headers: req.headers as any,
        query: req.query as any,
        body: payload,
        auth: (req as any).auth
      });

      res.status(response.statusCode).json({
        success: true,
        data: response.data,
        metadata: response.metadata
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to execute action'
      });
    }
  });

  return router;
};