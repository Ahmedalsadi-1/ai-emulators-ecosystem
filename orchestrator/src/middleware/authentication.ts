import { Request, Response, NextFunction } from 'express';
import { AuthContext } from '@/types';
import { AuthenticationManager } from '@/services/AuthenticationManager';

export const authenticationMiddleware = (authManager: AuthenticationManager) =>
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader) {
        // No auth header - continue without authentication
        return next();
      }

      const authContext = await authManager.authenticate(authHeader);
      (req as any).auth = authContext;

      next();
    } catch (error) {
      // Authentication failed - continue without auth context
      // Individual routes can decide if auth is required
      next();
    }
  };