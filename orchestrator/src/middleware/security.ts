import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { AuthenticationManager } from '../services/AuthenticationManager';

export interface SecurityConfig {
  csrfProtection: boolean;
  secureHeaders: boolean;
  auditLogging: boolean;
  rateLimiting: boolean;
  inputValidation: boolean;
  xssProtection: boolean;
}

export interface AuditEvent {
  timestamp: Date;
  eventType: string;
  userId?: string;
  sessionId?: string;
  appId?: string;
  ipAddress: string;
  userAgent?: string;
  action: string;
  resource?: string;
  success: boolean;
  details?: Record<string, any>;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
}

/**
 * CSRF Protection Middleware
 */
export const csrfProtection = (config: { secret: string; cookieName?: string; headerName?: string }) => {
  const { secret, cookieName = 'csrf-token', headerName = 'x-csrf-token' } = config;

  return (req: Request, res: Response, next: NextFunction): void => {
    // Generate CSRF token for GET requests
    if (req.method === 'GET') {
      const token = crypto.randomBytes(32).toString('hex');
      res.cookie(cookieName, token, {
        httpOnly: true,
        secure: req.secure,
        sameSite: 'strict',
        maxAge: 3600000 // 1 hour
      });
      (req as any).csrfToken = token;
      return next();
    }

    // Validate CSRF token for state-changing requests
    if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
      const tokenFromCookie = req.cookies[cookieName];
      const tokenFromHeader = req.headers[headerName] as string;

      if (!tokenFromCookie || !tokenFromHeader || tokenFromCookie !== tokenFromHeader) {
        res.status(403).json({
          success: false,
          error: 'CSRF token validation failed',
          code: 'CSRF_VALIDATION_FAILED'
        });
        return;
      }
    }

    next();
  };
};

/**
 * Security Headers Middleware
 */
export const securityHeaders = (config: {
  contentSecurityPolicy?: Record<string, string[]>;
  hsts?: boolean;
  noSniff?: boolean;
  frameOptions?: string;
  xssProtection?: boolean;
}) => {
  const {
    contentSecurityPolicy,
    hsts = true,
    noSniff = true,
    frameOptions = 'DENY',
    xssProtection = true
  } = config;

  return (req: Request, res: Response, next: NextFunction): void => {
    // Content Security Policy
    if (contentSecurityPolicy) {
      const cspString = Object.entries(contentSecurityPolicy)
        .map(([directive, values]) => `${directive} ${values.join(' ')}`)
        .join('; ');
      res.setHeader('Content-Security-Policy', cspString);
    }

    // HTTP Strict Transport Security
    if (hsts && req.secure) {
      res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    }

    // X-Content-Type-Options
    if (noSniff) {
      res.setHeader('X-Content-Type-Options', 'nosniff');
    }

    // X-Frame-Options
    if (frameOptions) {
      res.setHeader('X-Frame-Options', frameOptions);
    }

    // X-XSS-Protection
    if (xssProtection) {
      res.setHeader('X-XSS-Protection', '1; mode=block');
    }

    // Referrer Policy
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

    // Permissions Policy
    res.setHeader('Permissions-Policy',
      'camera=(), microphone=(), geolocation=(), payment=(), usb=()'
    );

    next();
  };
};

/**
 * Audit Logging Middleware
 */
export const auditLogging = (authManager: AuthenticationManager) => {
  const auditEvents: AuditEvent[] = [];

  // Clean up old audit events (keep last 7 days)
  setInterval(() => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 7);
    const filtered = auditEvents.filter(event => event.timestamp > cutoff);
    auditEvents.splice(0, auditEvents.length - filtered.length, ...filtered);
  }, 24 * 60 * 60 * 1000); // Daily cleanup

  return (req: Request, res: Response, next: NextFunction): void => {
    const startTime = Date.now();

    res.on('finish', () => {
      const authContext = (req as any).auth;
      const duration = Date.now() - startTime;

      const auditEvent: AuditEvent = {
        timestamp: new Date(),
        eventType: 'api_request',
        userId: authContext?.userId,
        sessionId: authContext?.sessionId,
        appId: (req as any).targetApp?.id,
        ipAddress: req.ip || req.connection.remoteAddress || 'unknown',
        userAgent: req.headers['user-agent'],
        action: `${req.method} ${req.path}`,
        resource: req.path,
        success: res.statusCode < 400,
        details: {
          method: req.method,
          path: req.path,
          statusCode: res.statusCode,
          duration,
          userAgent: req.headers['user-agent'],
          referer: req.headers.referer
        },
        riskLevel: calculateRiskLevel(req, res, authContext)
      };

      auditEvents.push(auditEvent);

      // Log high-risk events immediately
      if (auditEvent.riskLevel === 'high' || auditEvent.riskLevel === 'critical') {
        console.warn('HIGH RISK AUDIT EVENT:', auditEvent);
      }
    });

    next();
  };

  function calculateRiskLevel(req: Request, res: Response, authContext: any): AuditEvent['riskLevel'] {
    // Critical: Authentication bypass attempts
    if (req.path.includes('/auth/') && res.statusCode === 401) {
      return 'critical';
    }

    // High: Failed authentication, unusual patterns
    if (res.statusCode >= 400 && req.path.includes('/auth/')) {
      return 'high';
    }

    // Medium: State-changing operations without proper auth
    if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method) && !authContext) {
      return 'medium';
    }

    // Low: Normal successful operations
    return 'low';
  }
};

/**
 * Input Validation and Sanitization Middleware
 */
export const inputValidation = (config: { maxBodySize?: number; sanitize?: boolean }) => {
  const { maxBodySize = 1024 * 1024, sanitize = true } = config; // 1MB default

  return (req: Request, res: Response, next: NextFunction): void => {
    // Check request body size
    if (req.headers['content-length']) {
      const bodySize = parseInt(req.headers['content-length']);
      if (bodySize > maxBodySize) {
        res.status(413).json({
          success: false,
          error: 'Request body too large',
          code: 'BODY_TOO_LARGE'
        });
        return;
      }
    }

    // Basic input sanitization
    if (sanitize) {
      sanitizeInput(req.body);
      sanitizeInput(req.query);
      sanitizeInput(req.params);
    }

    // Validate common injection patterns
    if (containsInjectionPatterns(req)) {
      res.status(400).json({
        success: false,
        error: 'Invalid input detected',
        code: 'INVALID_INPUT'
      });
      return;
    }

    next();
  };

  function sanitizeInput(obj: any): void {
    if (!obj || typeof obj !== 'object') return;

    for (const key in obj) {
      if (typeof obj[key] === 'string') {
        // Basic XSS prevention
        obj[key] = obj[key]
          .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
          .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
          .replace(/javascript:/gi, '')
          .replace(/on\w+\s*=/gi, '');
      } else if (typeof obj[key] === 'object') {
        sanitizeInput(obj[key]);
      }
    }
  }

  function containsInjectionPatterns(req: Request): boolean {
    const patterns = [
      /(\b(union|select|insert|update|delete|drop|create|alter|exec|execute)\b)/i,
      /('|(\\x27)|(\\x2D\\x2D)|(\-\-)|(\\x23)|(#))/i,
      /(<script|javascript:|on\w+=)/i,
      /(\.\.|\/etc\/passwd|\/etc\/shadow|\.\.\/)/i
    ];

    const checkString = JSON.stringify({
      body: req.body,
      query: req.query,
      params: req.params
    });

    return patterns.some(pattern => pattern.test(checkString));
  }
};

/**
 * Brute Force Protection Middleware
 */
export const bruteForceProtection = (config: {
  maxAttempts: number;
  windowMs: number;
  blockDuration: number;
}) => {
  const { maxAttempts = 5, windowMs = 15 * 60 * 1000, blockDuration = 60 * 60 * 1000 } = config;
  const attempts = new Map<string, { count: number; firstAttempt: number; blocked: boolean; blockedUntil: number }>();

  return (req: Request, res: Response, next: NextFunction): void => {
    const key = `${req.ip}:${req.path}`;
    const now = Date.now();

    let record = attempts.get(key);
    if (!record) {
      record = { count: 0, firstAttempt: now, blocked: false, blockedUntil: 0 };
      attempts.set(key, record);
    }

    // Check if currently blocked
    if (record.blocked && now < record.blockedUntil) {
      res.status(429).json({
        success: false,
        error: 'Too many requests. Account temporarily blocked.',
        retryAfter: Math.ceil((record.blockedUntil - now) / 1000)
      });
      return;
    }

    // Reset if window has passed
    if (now - record.firstAttempt > windowMs) {
      record.count = 0;
      record.firstAttempt = now;
      record.blocked = false;
    }

    // Increment attempt count
    record.count++;

    // Check if limit exceeded
    if (record.count > maxAttempts && req.path.includes('/auth/')) {
      record.blocked = true;
      record.blockedUntil = now + blockDuration;

      console.warn(`Brute force protection activated for ${key}`);

      res.status(429).json({
        success: false,
        error: 'Too many failed attempts. Account blocked.',
        retryAfter: Math.ceil(blockDuration / 1000)
      });
      return;
    }

    attempts.set(key, record);
    next();
  };
};

/**
 * Legacy security middleware for backward compatibility
 */
export const securityMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  // Basic security headers
  res.header('X-Content-Type-Options', 'nosniff');
  res.header('X-Frame-Options', 'DENY');
  res.header('X-XSS-Protection', '1; mode=block');
  res.header('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
};

/**
 * Comprehensive Security Middleware Factory
 */
export const createSecurityMiddleware = (config: SecurityConfig, authManager: AuthenticationManager) => {
  const middlewares: any[] = [];

  if (config.csrfProtection) {
    middlewares.push(csrfProtection({
      secret: process.env.CSRF_SECRET || 'csrf-secret-key',
      cookieName: 'csrf-token',
      headerName: 'x-csrf-token'
    }));
  }

  if (config.secureHeaders) {
    middlewares.push(securityHeaders({
      contentSecurityPolicy: {
        'default-src': ["'self'"],
        'script-src': ["'self'", "'unsafe-inline'"],
        'style-src': ["'self'", "'unsafe-inline'"],
        'img-src': ["'self'", 'data:', 'https:'],
        'connect-src': ["'self'"]
      },
      hsts: true,
      noSniff: true,
      frameOptions: 'SAMEORIGIN',
      xssProtection: true
    }));
  }

  if (config.auditLogging) {
    middlewares.push(auditLogging(authManager));
  }

  if (config.inputValidation) {
    middlewares.push(inputValidation({
      maxBodySize: 1024 * 1024, // 1MB
      sanitize: true
    }));
  }

  if (config.rateLimiting) {
    middlewares.push(bruteForceProtection({
      maxAttempts: 5,
      windowMs: 15 * 60 * 1000, // 15 minutes
      blockDuration: 60 * 60 * 1000 // 1 hour
    }));
  }

  return middlewares;
};