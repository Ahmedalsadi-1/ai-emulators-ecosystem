import { Router, Request, Response } from 'express';
import { postizService } from '../services/postiz.service';
import { logger } from '../utils/logger';

const router = Router();

/**
 * @swagger
 * /api/health:
 *   get:
 *     summary: Health check endpoint
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Service is healthy
 *       503:
 *         description: Service is unhealthy
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    // Check Postiz service connectivity
    let postizHealth = { status: 'unknown', latency: 0 };
    const startTime = Date.now();

    try {
      await postizService.healthCheck();
      postizHealth = {
        status: 'healthy',
        latency: Date.now() - startTime,
      };
    } catch (error) {
      postizHealth = {
        status: 'unhealthy',
        latency: Date.now() - startTime,
      };
      logger.warn('Postiz service health check failed', error);
    }

    const healthData = {
      status: postizHealth.status === 'healthy' ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      services: {
        postiz: postizHealth,
      },
      version: process.env.npm_package_version || '1.0.0',
    };

    const statusCode = healthData.status === 'healthy' ? 200 : 503;

    res.status(statusCode).json({
      success: healthData.status === 'healthy',
      data: healthData,
    });
  } catch (error: any) {
    logger.error('Health check failed', error);
    res.status(503).json({
      success: false,
      error: 'Health check failed',
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * @swagger
 * /api/health/ready:
 *   get:
 *     summary: Readiness check endpoint
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Service is ready
 *       503:
 *         description: Service is not ready
 */
router.get('/ready', async (req: Request, res: Response) => {
  try {
    // Perform more thorough checks for readiness
    await postizService.healthCheck();

    res.json({
      success: true,
      status: 'ready',
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    logger.error('Readiness check failed', error);
    res.status(503).json({
      success: false,
      status: 'not ready',
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * @swagger
 * /api/health/metrics:
 *   get:
 *     summary: Get service metrics
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Metrics retrieved successfully
 */
router.get('/metrics', async (req: Request, res: Response) => {
  try {
    const metrics = {
      timestamp: new Date().toISOString(),
      process: {
        pid: process.pid,
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        cpu: process.cpuUsage(),
      },
      node: {
        version: process.version,
        platform: process.platform,
        arch: process.arch,
      },
      environment: {
        nodeEnv: process.env.NODE_ENV,
        port: process.env.PORT,
      },
    };

    res.json({
      success: true,
      data: metrics,
    });
  } catch (error: any) {
    logger.error('Failed to get metrics', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to retrieve metrics',
    });
  }
});

export default router;