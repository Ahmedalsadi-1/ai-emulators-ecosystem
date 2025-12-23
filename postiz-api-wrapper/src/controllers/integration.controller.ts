import { Router, Request, Response } from 'express';
import { body, param, validationResult } from 'express-validator';
import { postizService } from '../services/postiz.service';
import { ConnectIntegrationDto } from '../dto/integration.dto';
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
const connectIntegrationValidation = [
  body('platform').isString().isIn(['twitter', 'instagram', 'facebook', 'linkedin', 'youtube', 'tiktok', 'pinterest', 'discord', 'mastodon', 'bluesky']).withMessage('Invalid platform'),
  body('code').optional().isString().withMessage('Authorization code must be a string'),
  body('state').optional().isString().withMessage('State must be a string'),
  body('redirectUri').optional().isString().withMessage('Redirect URI must be a string'),
];

const disconnectIntegrationValidation = [
  param('id').isUUID().withMessage('Invalid integration ID'),
];

/**
 * @swagger
 * /api/v1/integrations:
 *   get:
 *     summary: Get all connected integrations
 *     tags: [Integrations]
 *     security:
 *       - bearerAuth: []
 *       - apiKeyAuth: []
 *     responses:
 *       200:
 *         description: Integrations retrieved successfully
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const result = await postizService.getIntegrations();

    res.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    logger.error('Failed to get integrations', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to retrieve integrations',
    });
  }
});

/**
 * @swagger
 * /api/v1/integrations/platforms:
 *   get:
 *     summary: Get available platforms for integration
 *     tags: [Integrations]
 *     responses:
 *       200:
 *         description: Available platforms retrieved successfully
 */
router.get('/platforms', async (req: Request, res: Response) => {
  try {
    const platforms = [
      {
        platform: 'twitter',
        name: 'Twitter',
        authUrl: '/api/v1/integrations/connect/twitter',
        scopes: ['tweet.read', 'tweet.write', 'users.read'],
        features: ['posting', 'analytics', 'scheduling'],
      },
      {
        platform: 'instagram',
        name: 'Instagram',
        authUrl: '/api/v1/integrations/connect/instagram',
        scopes: ['user_profile', 'user_media'],
        features: ['posting', 'stories', 'analytics'],
      },
      {
        platform: 'facebook',
        name: 'Facebook',
        authUrl: '/api/v1/integrations/connect/facebook',
        scopes: ['pages_manage_posts', 'pages_read_engagement'],
        features: ['posting', 'analytics', 'page management'],
      },
      {
        platform: 'linkedin',
        name: 'LinkedIn',
        authUrl: '/api/v1/integrations/connect/linkedin',
        scopes: ['w_member_social', 'r_liteprofile'],
        features: ['posting', 'analytics', 'company pages'],
      },
      {
        platform: 'youtube',
        name: 'YouTube',
        authUrl: '/api/v1/integrations/connect/youtube',
        scopes: ['https://www.googleapis.com/auth/youtube.upload'],
        features: ['video upload', 'analytics'],
      },
      {
        platform: 'tiktok',
        name: 'TikTok',
        authUrl: '/api/v1/integrations/connect/tiktok',
        scopes: ['user.info.basic', 'video.publish'],
        features: ['video posting', 'analytics'],
      },
      {
        platform: 'pinterest',
        name: 'Pinterest',
        authUrl: '/api/v1/integrations/connect/pinterest',
        scopes: ['boards:read', 'pins:read', 'pins:write'],
        features: ['pin posting', 'board management'],
      },
      {
        platform: 'discord',
        name: 'Discord',
        authUrl: '/api/v1/integrations/connect/discord',
        scopes: ['bot'],
        features: ['message posting', 'server management'],
      },
      {
        platform: 'mastodon',
        name: 'Mastodon',
        authUrl: '/api/v1/integrations/connect/mastodon',
        scopes: ['read', 'write'],
        features: ['posting', 'federation'],
      },
      {
        platform: 'bluesky',
        name: 'Bluesky',
        authUrl: '/api/v1/integrations/connect/bluesky',
        scopes: ['atproto'],
        features: ['posting', 'social networking'],
      },
    ];

    res.json({
      success: true,
      data: platforms,
    });
  } catch (error: any) {
    logger.error('Failed to get platforms', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to retrieve platforms',
    });
  }
});

/**
 * @swagger
 * /api/v1/integrations/connect/{platform}:
 *   get:
 *     summary: Get authorization URL for platform integration
 *     tags: [Integrations]
 *     security:
 *       - bearerAuth: []
 *       - apiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: platform
 *         required: true
 *         schema:
 *           type: string
 *         description: Platform name
 *     responses:
 *       200:
 *         description: Authorization URL generated successfully
 */
router.get('/connect/:platform', async (req: Request, res: Response) => {
  try {
    const { platform } = req.params;
    const { redirectUri } = req.query;

    // This would typically call Postiz to get the auth URL
    const authUrl = `https://${platform}.com/oauth/authorize?client_id=your_client_id&redirect_uri=${redirectUri || 'http://localhost:3001/callback'}&scope=read,write&response_type=code`;

    res.json({
      success: true,
      data: {
        authUrl,
        platform,
      },
    });
  } catch (error: any) {
    logger.error(`Failed to get auth URL for ${req.params.platform}`, error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate authorization URL',
    });
  }
});

/**
 * @swagger
 * /api/v1/integrations/connect:
 *   post:
 *     summary: Connect a social media platform
 *     tags: [Integrations]
 *     security:
 *       - bearerAuth: []
 *       - apiKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - platform
 *             properties:
 *               platform:
 *                 type: string
 *                 enum: [twitter, instagram, facebook, linkedin, youtube, tiktok, pinterest, discord, mastodon, bluesky]
 *               code:
 *                 type: string
 *               state:
 *                 type: string
 *               redirectUri:
 *                 type: string
 *     responses:
 *       201:
 *         description: Platform connected successfully
 *       400:
 *         description: Validation error
 */
router.post('/connect', connectIntegrationValidation, handleValidationErrors, async (req: Request, res: Response) => {
  try {
    const connectData: ConnectIntegrationDto = req.body;
    const result = await postizService.connectIntegration(connectData);

    logger.info(`Platform connected successfully: ${connectData.platform}`);
    res.status(201).json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    logger.error(`Failed to connect platform ${req.body.platform}`, error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to connect platform',
    });
  }
});

/**
 * @swagger
 * /api/v1/integrations/{id}:
 *   delete:
 *     summary: Disconnect an integration
 *     tags: [Integrations]
 *     security:
 *       - bearerAuth: []
 *       - apiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Integration ID
 *     responses:
 *       200:
 *         description: Integration disconnected successfully
 *       404:
 *         description: Integration not found
 */
router.delete('/:id', disconnectIntegrationValidation, handleValidationErrors, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await postizService.disconnectIntegration(id);

    logger.info(`Integration disconnected successfully: ${id}`);
    res.json({
      success: true,
      message: 'Integration disconnected successfully',
    });
  } catch (error: any) {
    logger.error(`Failed to disconnect integration ${req.params.id}`, error);

    if (error.response?.status === 404) {
      return res.status(404).json({
        success: false,
        error: 'Integration not found',
      });
    }

    res.status(500).json({
      success: false,
      error: error.message || 'Failed to disconnect integration',
    });
  }
});

/**
 * @swagger
 * /api/v1/integrations/{id}/status:
 *   get:
 *     summary: Get integration status
 *     tags: [Integrations]
 *     security:
 *       - bearerAuth: []
 *       - apiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Integration ID
 *     responses:
 *       200:
 *         description: Integration status retrieved successfully
 */
router.get('/:id/status', param('id').isUUID().withMessage('Invalid integration ID'), handleValidationErrors, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Get all integrations and find the specific one
    const integrations = await postizService.getIntegrations();
    const integration = integrations.find(int => int.id === id);

    if (!integration) {
      return res.status(404).json({
        success: false,
        error: 'Integration not found',
      });
    }

    res.json({
      success: true,
      data: {
        id: integration.id,
        platform: integration.platform,
        status: integration.status,
        lastSync: integration.lastSync,
        followerCount: integration.followerCount,
        profileUrl: integration.profileUrl,
      },
    });
  } catch (error: any) {
    logger.error(`Failed to get integration status ${req.params.id}`, error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to retrieve integration status',
    });
  }
});

export default router;