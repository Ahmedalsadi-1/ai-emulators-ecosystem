import { Request, Response, NextFunction } from 'express';
import { AuthenticationProxy } from '../services/AuthenticationProxy';
import { AuthContext } from '../types';

export interface TokenForwardingOptions {
  headerName?: string;
  queryParam?: string;
  cookieName?: string;
  ssoHeader?: string;
  allowedPaths?: string[];
  excludedPaths?: string[];
}

/**
 * Middleware for automatic token forwarding to embedded applications
 */
export const tokenForwardingMiddleware = (
  authProxy: AuthenticationProxy,
  options: TokenForwardingOptions = {}
) => {
  const {
    headerName = 'Authorization',
    queryParam = 'auth_token',
    cookieName = 'auth_token',
    ssoHeader = 'X-SSO-Token',
    allowedPaths = [],
    excludedPaths = []
  } = options;

  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Skip token forwarding for excluded paths
      if (excludedPaths.some(path => req.path.startsWith(path))) {
        return next();
      }

      // Only forward tokens for allowed paths if specified
      if (allowedPaths.length > 0 && !allowedPaths.some(path => req.path.startsWith(path))) {
        return next();
      }

      // Get auth context from current request
      const authContext = (req as any).auth as AuthContext;
      if (!authContext || !authContext.sessionId) {
        return next();
      }

      // Get target app ID from request (could be from path, query, or header)
      const targetAppId = getTargetAppId(req);
      if (!targetAppId) {
        return next();
      }

      // Check if we have SSO context for this app
      const ssoContext = await authProxy.getSSOContext(authContext.sessionId);
      if (!ssoContext) {
        return next();
      }

      // Find the SSO app token
      const ssoApp = ssoContext.apps.find((app: any) => app.appId === targetAppId);
      if (!ssoApp || ssoApp.expiresAt < new Date()) {
        return next();
      }

      // Forward token based on configuration
      if (headerName && headerName !== 'Authorization') {
        // Use custom header for app-specific tokens
        req.headers[headerName.toLowerCase()] = `Bearer ${ssoApp.token}`;
      } else if (headerName === 'Authorization') {
        // Override or set Authorization header
        req.headers.authorization = `Bearer ${ssoApp.token}`;
      }

      // Add SSO-specific header
      req.headers[ssoHeader.toLowerCase()] = ssoApp.token;

      // Add token to query parameters if requested
      if (queryParam && !req.query[queryParam]) {
        req.query[queryParam] = ssoApp.token;
      }

      // Store token in res.locals for use by other middleware
      res.locals.forwardedToken = ssoApp.token;
      res.locals.targetAppId = targetAppId;
      res.locals.ssoContext = ssoContext;

      // Add security headers
      addSecurityHeaders(res, ssoApp, targetAppId);

      next();
    } catch (error) {
      // Log error but don't fail the request
      console.error('Token forwarding middleware error:', error);
      next();
    }
  };
};

/**
 * Middleware to handle token refresh for embedded applications
 */
export const tokenRefreshMiddleware = (
  authProxy: AuthenticationProxy
) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authContext = (req as any).auth as AuthContext;
      if (!authContext || !authContext.sessionId) {
        return next();
      }

      const targetAppId = getTargetAppId(req);
      if (!targetAppId) {
        return next();
      }

      // Check if token needs refresh (within refresh threshold)
      const ssoContext = await authProxy.getSSOContext(authContext.sessionId);
      if (!ssoContext) {
        return next();
      }

      const ssoApp = ssoContext.apps.find((app: any) => app.appId === targetAppId);
      if (!ssoApp) {
        return next();
      }

      const app = authProxy.getAppRegistry().get(targetAppId);
      if (!app || !app.tokenRefreshThreshold) {
        return next();
      }

      const timeToExpiry = ssoApp.expiresAt.getTime() - Date.now();
      if (timeToExpiry < app.tokenRefreshThreshold) {
        // Token needs refresh - request new token
        try {
          const newToken = await authProxy.requestCrossAppToken(
            authContext.sessionId,
            targetAppId,
            ssoApp.permissions
          );

          // Update the token in the request
          if (req.headers.authorization) {
            req.headers.authorization = `Bearer ${newToken}`;
          }

          res.locals.refreshedToken = newToken;
        } catch (error) {
          console.error('Token refresh failed:', error);
          // Continue with old token if refresh fails
        }
      }

      next();
    } catch (error) {
      console.error('Token refresh middleware error:', error);
      next();
    }
  };
};

/**
 * Middleware to validate embedded app requests
 */
export const embeddedAppValidationMiddleware = (
  authProxy: AuthenticationProxy
) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const targetAppId = getTargetAppId(req);
      if (!targetAppId) {
        return next();
      }

      const app = authProxy.getAppRegistry().get(targetAppId);
      if (!app) {
        throw new Error('Application not found');
      }

      // Check origin if specified
      const origin = req.headers.origin || req.headers.referer;
      if (app.allowedOrigins.length > 0 && origin) {
        const originUrl = new URL(origin);
        const isAllowed = app.allowedOrigins.some((allowed: string) => {
          if (allowed === '*') return true;
          try {
            const allowedUrl = new URL(allowed);
            return allowedUrl.origin === originUrl.origin;
          } catch {
            return false;
          }
        });

        if (!isAllowed) {
          throw new Error('Origin not allowed for this application');
        }
      }

      // Add app context to request
      (req as any).targetApp = app;

      next();
    } catch (error) {
      console.error('Embedded app validation error:', error);
      res.status(500).json({
        success: false,
        error: 'Application validation failed'
      });
    }
  };
};

/**
 * Get target app ID from request
 */
function getTargetAppId(req: Request): string | null {
  // Try different sources for app ID
  const sources = [
    () => req.params.appId,
    () => req.query.appId as string,
    () => req.headers['x-app-id'] as string,
    () => req.headers['x-target-app'] as string,
    () => {
      // Extract from path (e.g., /api/apps/vy-workflows/action)
      const pathMatch = req.path.match(/^\/api\/apps\/([^\/]+)/);
      return pathMatch ? pathMatch[1] : null;
    }
  ];

  for (const source of sources) {
    try {
      const appId = source();
      if (appId) return appId;
    } catch {
      continue;
    }
  }

  return null;
}

/**
 * Add security headers for embedded app requests
 */
function addSecurityHeaders(res: Response, ssoApp: any, appId: string): void {
  // Add security headers to prevent token leakage
  res.setHeader('X-App-ID', appId);
  res.setHeader('X-Token-Expires', ssoApp.expiresAt.toISOString());
  res.setHeader('X-SSO-Enabled', 'true');

  // Prevent caching of authenticated responses
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');

  // Content Security Policy for iframes
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
}