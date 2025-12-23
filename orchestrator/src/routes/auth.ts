import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { AuthenticationManager } from '../services/AuthenticationManager';
import { AuthenticationProxy } from '../services/AuthenticationProxy';

export const authRoutes = (
  authManager: AuthenticationManager,
  authProxy: AuthenticationProxy
) => {
  const router = Router();

  /**
   * POST /auth/login
   * Authenticate user with credentials
   */
  router.post('/login', [
    body('username').isString().notEmpty().withMessage('Username is required'),
    body('password').isString().notEmpty().withMessage('Password is required'),
    body('rememberMe').optional().isBoolean()
  ], async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const { username, password, rememberMe } = req.body;
      const tokens = await authManager.authenticateUser({ username, password, rememberMe });

      res.json({
        success: true,
        data: tokens
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Authentication failed';
      res.status(401).json({
        success: false,
        error: errorMessage
      });
    }
  });

  /**
   * POST /auth/refresh
   * Refresh access token using refresh token
   */
  router.post('/refresh', [
    body('refreshToken').isString().notEmpty().withMessage('Refresh token is required')
  ], async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const { refreshToken } = req.body;
      const tokens = await authManager.refreshToken(refreshToken);

      res.json({
        success: true,
        data: tokens
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Token refresh failed';
      res.status(401).json({
        success: false,
        error: errorMessage
      });
    }
  });

  /**
   * POST /auth/logout
   * Logout user and invalidate session
   */
  router.post('/logout', async (req: Request, res: Response) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(400).json({
          success: false,
          error: 'Authorization header required'
        });
      }

      const token = authHeader.substring(7);
      const authContext = await authManager.validateToken(token);

      await authManager.logout(authContext.sessionId);

      res.json({
        success: true,
        message: 'Logged out successfully'
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Logout failed';
      res.status(500).json({
        success: false,
        error: errorMessage
      });
    }
  });

  /**
   * GET /auth/me
   * Get current user information
   */
  router.get('/me', async (req: Request, res: Response) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
          success: false,
          error: 'Authorization header required'
        });
      }

      const token = authHeader.substring(7);
      const authContext = await authManager.validateToken(token);

      const user = authManager.getUser(authContext.userId!);
      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }

      res.json({
        success: true,
        data: {
          id: user.id,
          username: user.username,
          email: user.email,
          roles: user.roles,
          permissions: user.permissions,
          profile: user.profile,
          lastLoginAt: user.lastLoginAt
        }
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to get user info';
      res.status(401).json({
        success: false,
        error: errorMessage
      });
    }
  });

  /**
   * POST /auth/sso/context
   * Create SSO context for cross-app authentication
   */
  router.post('/sso/context', [
    body('sessionId').isString().notEmpty().withMessage('Session ID is required'),
    body('appIds').isArray().withMessage('App IDs must be an array'),
    body('appIds.*').isString().notEmpty().withMessage('Each app ID must be a non-empty string')
  ], async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const { sessionId, appIds } = req.body;
      const ssoContext = await authProxy.createSSOContext(sessionId, appIds);

      res.json({
        success: true,
        data: ssoContext
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create SSO context';
      res.status(500).json({
        success: false,
        error: errorMessage
      });
    }
  });

  /**
   * GET /auth/sso/status
   * Get SSO authentication status for all apps
   */
  router.get('/sso/status', async (req: Request, res: Response) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
          success: false,
          error: 'Authorization header required'
        });
      }

      const token = authHeader.substring(7);
      const authContext = await authManager.validateToken(token);

      const status = authProxy.getMultiAppAuthStatus(authContext.sessionId);

      res.json({
        success: true,
        data: status
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to get SSO status';
      res.status(500).json({
        success: false,
        error: errorMessage
      });
    }
  });

  /**
   * POST /auth/sso/token
   * Request cross-app token for specific application
   */
  router.post('/sso/token', [
    body('sourceSessionId').isString().notEmpty().withMessage('Source session ID is required'),
    body('targetAppId').isString().notEmpty().withMessage('Target app ID is required'),
    body('permissions').optional().isArray().withMessage('Permissions must be an array')
  ], async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const { sourceSessionId, targetAppId, permissions } = req.body;
      const token = await authProxy.requestCrossAppToken(sourceSessionId, targetAppId, permissions);

      res.json({
        success: true,
        data: {
          token,
          appId: targetAppId,
          expiresAt: new Date(Date.now() + 60 * 60 * 1000) // 1 hour
        }
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to get cross-app token';
      res.status(500).json({
        success: false,
        error: errorMessage
      });
    }
  });

  /**
   * GET /auth/login
   * Serve login page for embedded applications
   */
  router.get('/login', (req: Request, res: Response) => {
    const { appId, state, redirect } = req.query;

    // In a real implementation, this would serve an HTML login page
    // For now, return JSON with login requirements
    res.json({
      success: true,
      data: {
        appId,
        state,
        redirect,
        loginUrl: '/auth/login',
        message: 'Please authenticate to access this application'
      }
    });
  });

  /**
   * POST /auth/iframe/message
   * Handle authentication messages from embedded iframes
   */
  router.post('/iframe/message', async (req: Request, res: Response) => {
    try {
      const { message, origin } = req.body;

      if (!message || !origin) {
        return res.status(400).json({
          success: false,
          error: 'Message and origin are required'
        });
      }

      const response = await authProxy.handleAuthMessage(message, origin);

      res.json({
        success: true,
        data: response
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to handle iframe message';
      res.status(500).json({
        success: false,
        error: errorMessage
      });
    }
  });

  /**
   * GET /auth/session/:sessionId
   * Get session information (for debugging/admin purposes)
   */
  router.get('/session/:sessionId', async (req: Request, res: Response) => {
    try {
      const { sessionId } = req.params;
      const session = await authManager.getSession(sessionId);

      if (!session) {
        return res.status(404).json({
          success: false,
          error: 'Session not found'
        });
      }

      res.json({
        success: true,
        data: {
          id: session.id,
          userId: session.userId,
          isActive: session.isActive,
          createdAt: session.createdAt,
          expiresAt: session.expiresAt,
          lastActivity: session.lastActivity
        }
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to get session info';
      res.status(500).json({
        success: false,
        error: errorMessage
      });
    }
  });

  return router;
};