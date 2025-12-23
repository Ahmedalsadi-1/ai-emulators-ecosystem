import { Router, Request, Response, NextFunction } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { postizService } from '../services/postiz.service';
import { CreatePostDto, UpdatePostDto } from '../dto/post.dto';
import { logger } from '../utils/logger';

const router = Router();

// Validation middleware
const handleValidationErrors = (req: Request, res: Response, next: NextFunction) => {
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
const createPostValidation = [
  body('content').isString().isLength({ min: 1, max: 5000 }).withMessage('Content must be 1-5000 characters'),
  body('platforms').isArray({ min: 1 }).withMessage('At least one platform required'),
  body('platforms.*').isString().withMessage('Platform must be a string'),
  body('scheduledAt').optional().isISO8601().withMessage('Invalid scheduled time format'),
  body('media').optional().isArray().withMessage('Media must be an array'),
  body('tags').optional().isArray().withMessage('Tags must be an array'),
  body('aiEnhance').optional().isBoolean().withMessage('aiEnhance must be a boolean'),
];

const updatePostValidation = [
  param('id').isUUID().withMessage('Invalid post ID'),
  body('content').optional().isString().isLength({ min: 1, max: 5000 }).withMessage('Content must be 1-5000 characters'),
  body('platforms').optional().isArray({ min: 1 }).withMessage('At least one platform required'),
  body('scheduledAt').optional().isISO8601().withMessage('Invalid scheduled time format'),
];

const getPostsValidation = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be 1-100'),
  query('status').optional().isIn(['draft', 'scheduled', 'published', 'failed']).withMessage('Invalid status'),
  query('platform').optional().isString().withMessage('Platform must be a string'),
];

/**
 * @swagger
 * /api/v1/posts:
 *   post:
 *     summary: Create a new social media post
 *     tags: [Posts]
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
 *               - content
 *               - platforms
 *             properties:
 *               content:
 *                 type: string
 *                 maxLength: 5000
 *               platforms:
 *                 type: array
 *                 items:
 *                   type: string
 *               scheduledAt:
 *                 type: string
 *                 format: date-time
 *               media:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     url:
 *                       type: string
 *                     type:
 *                       type: string
 *                       enum: [image, video]
 *                     alt:
 *                       type: string
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *               aiEnhance:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Post created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
router.post('/', createPostValidation, handleValidationErrors, async (req: Request, res: Response) => {
  try {
    const postData: CreatePostDto = req.body;
    const result = await postizService.createPost(postData);

    logger.info('Post created successfully', { postId: result.id });
    res.status(201).json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    logger.error('Failed to create post', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create post',
    });
  }
});

/**
 * @swagger
 * /api/v1/posts:
 *   get:
 *     summary: Get posts with pagination and filters
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *       - apiKeyAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *         description: Number of posts per page
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [draft, scheduled, published, failed]
 *         description: Filter by post status
 *       - in: query
 *         name: platform
 *         schema:
 *           type: string
 *         description: Filter by platform
 *     responses:
 *       200:
 *         description: Posts retrieved successfully
 */
router.get('/', getPostsValidation, handleValidationErrors, async (req: Request, res: Response) => {
  try {
    const params = {
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 10,
      status: req.query.status as string,
      platform: req.query.platform as string,
    };

    const result = await postizService.getPosts(params);

    res.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    logger.error('Failed to get posts', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to retrieve posts',
    });
  }
});

/**
 * @swagger
 * /api/v1/posts/{id}:
 *   get:
 *     summary: Get a specific post by ID
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *       - apiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Post ID
 *     responses:
 *       200:
 *         description: Post retrieved successfully
 *       404:
 *         description: Post not found
 */
router.get('/:id', param('id').isUUID().withMessage('Invalid post ID'), handleValidationErrors, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await postizService.getPost(id);

    res.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    logger.error(`Failed to get post ${req.params.id}`, error);

    if (error.response?.status === 404) {
      return res.status(404).json({
        success: false,
        error: 'Post not found',
      });
    }

    res.status(500).json({
      success: false,
      error: error.message || 'Failed to retrieve post',
    });
  }
});

/**
 * @swagger
 * /api/v1/posts/{id}:
 *   put:
 *     summary: Update a post
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *       - apiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Post ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               content:
 *                 type: string
 *                 maxLength: 5000
 *               platforms:
 *                 type: array
 *                 items:
 *                   type: string
 *               scheduledAt:
 *                 type: string
 *                 format: date-time
 *               media:
 *                 type: array
 *                 items:
 *                   type: object
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Post updated successfully
 *       404:
 *         description: Post not found
 */
router.put('/:id', updatePostValidation, handleValidationErrors, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updateData: UpdatePostDto = req.body;
    const result = await postizService.updatePost(id, updateData);

    logger.info(`Post updated successfully`, { postId: id });
    res.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    logger.error(`Failed to update post ${req.params.id}`, error);

    if (error.response?.status === 404) {
      return res.status(404).json({
        success: false,
        error: 'Post not found',
      });
    }

    res.status(500).json({
      success: false,
      error: error.message || 'Failed to update post',
    });
  }
});

/**
 * @swagger
 * /api/v1/posts/{id}:
 *   delete:
 *     summary: Delete a post
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *       - apiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Post ID
 *     responses:
 *       200:
 *         description: Post deleted successfully
 *       404:
 *         description: Post not found
 */
router.delete('/:id', param('id').isUUID().withMessage('Invalid post ID'), handleValidationErrors, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await postizService.deletePost(id);

    logger.info(`Post deleted successfully`, { postId: id });
    res.json({
      success: true,
      message: 'Post deleted successfully',
    });
  } catch (error: any) {
    logger.error(`Failed to delete post ${req.params.id}`, error);

    if (error.response?.status === 404) {
      return res.status(404).json({
        success: false,
        error: 'Post not found',
      });
    }

    res.status(500).json({
      success: false,
      error: error.message || 'Failed to delete post',
    });
  }
});

export default router;