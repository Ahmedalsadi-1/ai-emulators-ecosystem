import { Router } from 'express';

export const serviceRoutes = (serviceRegistry: any, healthChecker: any) => {
  const router = Router();

  // Get all services
  router.get('/', async (req, res) => {
    try {
      const services = await serviceRegistry.getAllServices();
      res.json({
        success: true,
        data: services
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to fetch services'
      });
    }
  });

  // Get service by ID
  router.get('/:serviceId', async (req, res) => {
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
        data: service
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to fetch service'
      });
    }
  });

  return router;
};