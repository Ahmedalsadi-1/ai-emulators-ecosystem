import { Router, Request, Response } from 'express';
import { query, param, validationResult } from 'express-validator';
import { postizService } from '../services/postiz.service';
import { AnalyticsQueryDto } from '../dto/analytics.dto';
import { logger } from '../utils/logger';

const router = Router();

// Validation middleware
const handleValidationErrors = (req: Request, res: Response, next: any) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors.array(),
    });
  }
  next();
};

// Validation rules
const analyticsQueryValidation = [
  query('platforms').optional().isString().withMessage('Platforms must be a comma-separated string'),
  query('startDate').optional().isISO8601().withMessage('Invalid start date format'),
  query('endDate').optional().isISO8601().withMessage('Invalid end date format'),
  query('metrics').optional().isString().withMessage('Metrics must be a comma-separated string'),
];

const postAnalyticsValidation = [
  param('postId').isUUID().withMessage('Invalid post ID'),
];

/**
 * @swagger
 * /api/v1/analytics:
 *   get:
 *     summary: Get analytics data
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *       - apiKeyAuth: []
 *     parameters:
 *       - in: query
 *         name: platforms
 *         schema:
 *           type: string
 *         description: Comma-separated list of platforms
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for analytics
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for analytics
 *       - in: query
 *         name: metrics
 *         schema:
 *           type: string
 *         description: Comma-separated list of metrics
 *     responses:
 *       200:
 *         description: Analytics data retrieved successfully
 */
router.get('/', analyticsQueryValidation, handleValidationErrors, async (req: Request, res: Response) => {
  try {
    const query: AnalyticsQueryDto = {
      platforms: req.query.platforms ? (req.query.platforms as string).split(',') : undefined,
      dateRange: req.query.startDate && req.query.endDate ? {
        start: req.query.startDate as string,
        end: req.query.endDate as string,
      } : undefined,
      metrics: req.query.metrics ? (req.query.metrics as string).split(',') : undefined,
    };

    const result = await postizService.getAnalytics(query);

    res.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    logger.error('Failed to get analytics', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to retrieve analytics',
    });
  }
});

/**
 * @swagger
 * /api/v1/analytics/posts/{postId}:
 *   get:
 *     summary: Get analytics for a specific post
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *       - apiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *         description: Post ID
 *     responses:
 *       200:
 *         description: Post analytics retrieved successfully
 *       404:
 *         description: Post not found
 */
router.get('/posts/:postId', postAnalyticsValidation, handleValidationErrors, async (req: Request, res: Response) => {
  try {
    const { postId } = req.params;
    const result = await postizService.getPostAnalytics(postId);

    res.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    logger.error(`Failed to get analytics for post ${req.params.postId}`, error);

    if (error.response?.status === 404) {
      return res.status(404).json({
        success: false,
        error: 'Post not found',
      });
    }

    res.status(500).json({
      success: false,
      error: error.message || 'Failed to retrieve post analytics',
    });
  }
});

/**
 * @swagger
 * /api/v1/analytics/summary:
 *   get:
 *     summary: Get analytics summary
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *       - apiKeyAuth: []
 *     parameters:
 *       - in: query
 *         name: platforms
 *         schema:
 *           type: string
 *         description: Comma-separated list of platforms
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [7d, 30d, 90d, 1y]
 *         description: Time period for summary
 *     responses:
 *       200:
 *         description: Analytics summary retrieved successfully
 */
router.get('/summary', async (req: Request, res: Response) => {
  try {
    const platforms = req.query.platforms ? (req.query.platforms as string).split(',') : undefined;
    const period = req.query.period as string || '30d';

    // Get comprehensive analytics data
    const analyticsData = await postizService.getAnalytics({
      platforms,
      dateRange: getDateRangeForPeriod(period),
    });

    // Calculate summary metrics
    const summary = calculateAnalyticsSummary(analyticsData);

    res.json({
      success: true,
      data: {
        period,
        platforms,
        summary,
        detailed: analyticsData,
      },
    });
  } catch (error: any) {
    logger.error('Failed to get analytics summary', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to retrieve analytics summary',
    });
  }
});

function getDateRangeForPeriod(period: string): { start: string; end: string } {
  const end = new Date();
  const start = new Date();

  switch (period) {
    case '7d':
      start.setDate(end.getDate() - 7);
      break;
    case '30d':
      start.setDate(end.getDate() - 30);
      break;
    case '90d':
      start.setDate(end.getDate() - 90);
      break;
    case '1y':
      start.setFullYear(end.getFullYear() - 1);
      break;
    default:
      start.setDate(end.getDate() - 30);
  }

  return {
    start: start.toISOString().split('T')[0],
    end: end.toISOString().split('T')[0],
  };
}

function calculateAnalyticsSummary(analyticsData: any[]) {
  const totalFollowers = analyticsData.reduce((sum, item) => sum + (item.followers || 0), 0);
  const totalEngagement = analyticsData.reduce((sum, item) => sum + (item.engagement || 0), 0);
  const totalReach = analyticsData.reduce((sum, item) => sum + (item.reach || 0), 0);
  const totalImpressions = analyticsData.reduce((sum, item) => sum + (item.impressions || 0), 0);
  const totalPosts = analyticsData.reduce((sum, item) => sum + (item.posts || 0), 0);

  // Calculate growth rate (simplified - comparing first and last data points)
  const growthRate = analyticsData.length > 1
    ? ((analyticsData[analyticsData.length - 1].followers - analyticsData[0].followers) / analyticsData[0].followers) * 100
    : 0;

  // Get top performing posts (mock data - would come from actual analytics)
  const topPerformingPosts = [
    {
      id: 'post-1',
      content: 'Sample post content...',
      engagement: 150,
      reach: 2500,
    },
  ];

  return {
    totalFollowers,
    totalEngagement,
    totalReach,
    totalImpressions,
    totalPosts,
    growthRate: Math.round(growthRate * 100) / 100,
    topPerformingPosts,
  };
}

export default router;