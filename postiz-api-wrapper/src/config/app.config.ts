import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '3001', 10),
  nodeEnv: process.env.NODE_ENV || 'development',

  // Postiz API configuration
  postizApiUrl: process.env.POSTIZ_API_URL || 'http://localhost:3000',
  postizApiKey: process.env.POSTIZ_API_KEY || '',
  postizUsername: process.env.POSTIZ_USERNAME || '',
  postizPassword: process.env.POSTIZ_PASSWORD || '',

  // JWT configuration
  jwtSecret: process.env.JWT_SECRET || 'your-secret-key',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '24h',

  // Redis configuration
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',

  // Rate limiting
  rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 minutes
  rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),

  // Logging
  logLevel: process.env.LOG_LEVEL || 'info',

  // CORS
  allowedOrigins: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],

  // API versioning
  apiVersion: process.env.API_VERSION || 'v1',

  // Timeouts
  requestTimeout: parseInt(process.env.REQUEST_TIMEOUT || '30000', 10), // 30 seconds

  // Health check
  healthCheckEnabled: process.env.HEALTH_CHECK_ENABLED !== 'false',
};