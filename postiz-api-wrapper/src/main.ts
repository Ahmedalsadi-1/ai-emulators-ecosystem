import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import swaggerUi from 'swagger-ui-express';
import swaggerJSDoc from 'swagger-jsdoc';

import { config } from './config/app.config';
import { logger } from './utils/logger';
import { errorHandler } from './middleware/error.middleware';
import { notFoundHandler } from './middleware/not-found.middleware';

// Import routes
import postRoutes from './controllers/post.controller';
import analyticsRoutes from './controllers/analytics.controller';
import integrationRoutes from './controllers/integration.controller';
import healthRoutes from './controllers/health.controller';

const app = express();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// Compression
app.use(compression());

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Swagger configuration
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Postiz API Wrapper',
      version: '1.0.0',
      description: 'Standardized API wrapper for Postiz social media scheduling service',
    },
    servers: [
      {
        url: `http://localhost:${config.port}`,
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
        apiKeyAuth: {
          type: 'apiKey',
          in: 'header',
          name: 'X-API-Key',
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
      {
        apiKeyAuth: [],
      },
    ],
  },
  apis: ['./src/controllers/*.ts'],
};

const swaggerSpec = swaggerJSDoc(swaggerOptions);

// Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// API routes
app.use('/api/v1/posts', postRoutes);
app.use('/api/v1/analytics', analyticsRoutes);
app.use('/api/v1/integrations', integrationRoutes);
app.use('/api/health', healthRoutes);

// Error handling middleware
app.use(notFoundHandler);
app.use(errorHandler);

// Start server
const server = app.listen(config.port, () => {
  logger.info(`Postiz API Wrapper server running on port ${config.port}`);
  logger.info(`API Documentation available at http://localhost:${config.port}/api-docs`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  server.close(() => {
    logger.info('Process terminated');
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  server.close(() => {
    logger.info('Process terminated');
  });
});

export default app;