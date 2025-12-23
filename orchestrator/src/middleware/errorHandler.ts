import { Request, Response, NextFunction } from 'express';
import { OrchestratorErrorDetails } from '@/types';

export const errorHandler = (
  error: any,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Default error details
  const errorDetails: OrchestratorErrorDetails = {
    code: error.code || 'INTERNAL_SERVER_ERROR',
    message: error.message || 'An unexpected error occurred',
    statusCode: error.statusCode || 500,
    requestId: req.headers['x-request-id'] as string || 'unknown',
    timestamp: new Date(),
    details: error.details || {}
  };

  // Log error
  console.error(`[${new Date().toISOString()}] Error ${errorDetails.statusCode}: ${errorDetails.message}`, {
    requestId: errorDetails.requestId,
    path: req.path,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    stack: error.stack
  });

  // Don't expose internal errors in production
  if (process.env.NODE_ENV === 'production' && errorDetails.statusCode >= 500) {
    errorDetails.message = 'Internal server error';
    errorDetails.details = {};
  }

  // Send error response
  res.status(errorDetails.statusCode).json({
    error: {
      code: errorDetails.code,
      message: errorDetails.message,
      statusCode: errorDetails.statusCode,
      requestId: errorDetails.requestId,
      timestamp: errorDetails.timestamp,
      ...(errorDetails.details && { details: errorDetails.details })
    }
  });
};

// Custom error classes
export class OrchestratorError extends Error {
  public statusCode: number;
  public code: string;
  public details?: any;

  constructor(message: string, statusCode: number = 500, code: string = 'INTERNAL_ERROR', details?: any) {
    super(message);
    this.name = 'OrchestratorError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

export class AuthenticationError extends OrchestratorError {
  constructor(message: string = 'Authentication required') {
    super(message, 401, 'AUTHENTICATION_ERROR');
  }
}

export class AuthorizationError extends OrchestratorError {
  constructor(message: string = 'Insufficient permissions') {
    super(message, 403, 'AUTHORIZATION_ERROR');
  }
}

export class NotFoundError extends OrchestratorError {
  constructor(resource: string = 'Resource') {
    super(`${resource} not found`, 404, 'NOT_FOUND');
  }
}

export class ServiceUnavailableError extends OrchestratorError {
  constructor(serviceId?: string) {
    super(
      serviceId ? `Service ${serviceId} is currently unavailable` : 'Service unavailable',
      503,
      'SERVICE_UNAVAILABLE',
      { serviceId }
    );
  }
}

export class RateLimitError extends OrchestratorError {
  constructor(message: string = 'Rate limit exceeded') {
    super(message, 429, 'RATE_LIMIT_EXCEEDED');
  }
}

export class ValidationError extends OrchestratorError {
  constructor(message: string = 'Validation failed', details?: any) {
    super(message, 400, 'VALIDATION_ERROR', details);
  }
}