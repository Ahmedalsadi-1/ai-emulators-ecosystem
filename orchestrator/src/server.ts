import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { createServer } from 'http';
import { Server as SocketServer } from 'socket.io';
import dotenv from 'dotenv';

import { config } from './config';
import { errorHandler } from './middleware/errorHandler';
import { securityMiddleware, createSecurityMiddleware } from './middleware/security';
import { rateLimitMiddleware } from './middleware/rateLimit';
import { authenticationMiddleware } from './middleware/authentication';
import { tokenForwardingMiddleware, tokenRefreshMiddleware, embeddedAppValidationMiddleware } from './middleware/tokenForwarding';

import { ServiceRegistry } from '@/services/ServiceRegistry';
import { RequestRouter } from '@/services/RequestRouter';
import { AuthenticationManager } from '@/services/AuthenticationManager';
import { AuthenticationProxy } from '@/services/AuthenticationProxy';
import { HealthChecker } from '@/services/HealthChecker';
import { MetricsCollector } from '@/services/MetricsCollector';
import { WebSocketManager } from '@/services/WebSocketManager';

import { unifiedApiRoutes } from './routes/unifiedApi';
import { serviceRoutes } from './routes/services';
import { healthRoutes } from './routes/health';
import { authRoutes } from './routes/auth';
import { CORSMiddleware } from './middleware/cors';
import { EmbeddedApp } from './types/iframe';

// Load environment variables
dotenv.config();

class OrchestratorServer {
  private app: express.Application;
  private httpServer: any;
  private io: SocketServer;

  // Core services
  private serviceRegistry!: ServiceRegistry;
  private requestRouter!: RequestRouter;
  private authManager!: AuthenticationManager;
  private authProxy!: AuthenticationProxy;
  private healthChecker!: HealthChecker;
  private metricsCollector!: MetricsCollector;
  private wsManager!: WebSocketManager;
  private corsMiddleware!: CORSMiddleware;

  constructor() {
    this.app = express();
    this.httpServer = createServer(this.app);

    // Initialize Socket.IO with CORS
    this.io = new SocketServer(this.httpServer, {
      cors: {
        origin: config.cors.origins,
        methods: config.cors.methods,
        credentials: config.cors.credentials,
        allowedHeaders: config.cors.headers,
      },
      pingTimeout: 60000,
      pingInterval: 25000,
    });

    this.initializeServices();
    this.configureMiddleware();
    this.configureRoutes();
    this.configureWebSocket();
    this.configureErrorHandling();
  }

  /**
   * Get embedded apps configuration
   */
  private getEmbeddedApps(): EmbeddedApp[] {
    return [
      {
        id: 'vy-workflows',
        name: 'Vy Workflows',
        description: 'Visual workflow builder and automation platform',
        url: 'http://localhost:9992/workflows',
        allowedOrigins: ['http://localhost:9992'],
        authenticationMode: 'sso',
        sessionTimeout: 3600000, // 1 hour
        tokenRefreshThreshold: 300000, // 5 minutes
        category: 'automation',
        tags: ['workflows', 'automation', 'visual'],
        version: '1.0.0',

        // SSO Configuration
        sso: {
          enabled: true,
          autoLogin: true,
          tokenSharing: true,
          sharedApps: ['bytebot', 'factif-ai'],
          loginRedirectUrl: '/workflows/dashboard',
          customScopes: ['workflows:read', 'workflows:write']
        },

        // Authentication Policy
        authPolicy: {
          requireMfa: false,
          maxSessionDuration: 3600000, // 1 hour
          rateLimit: { requests: 1000, window: 60000 }, // 1000 requests per minute
          auditLog: true
        },

        // Security Configuration
        security: {
          requireHttps: false, // Development only
          allowCredentials: true,
          corsMaxAge: 86400,
          contentSecurityPolicy: {
            'default-src': ["'self'"],
            'script-src': ["'self'", "'unsafe-inline'"],
            'style-src': ["'self'", "'unsafe-inline'"],
          }
        },

        // Credential Sharing
        credentialSharing: {
          enabled: true,
          allowedTypes: ['api-key', 'oauth'],
          requireApproval: false
        },

        // Communication Settings
        messageTimeout: 30000,
        allowedMessageTypes: ['auth:*', 'data:*', 'ui:*', 'health:*']
      },
      {
        id: 'postiz-dashboard',
        name: 'Postiz Dashboard',
        description: 'Social media management and scheduling platform',
        url: 'http://localhost:3000',
        allowedOrigins: ['http://localhost:3000'],
        authenticationMode: 'sso',
        sessionTimeout: 7200000, // 2 hours
        tokenRefreshThreshold: 600000, // 10 minutes
        category: 'social',
        tags: ['social-media', 'scheduling', 'content'],
        version: '1.0.0',

        // SSO Configuration
        sso: {
          enabled: true,
          autoLogin: true,
          tokenSharing: true,
          sharedApps: ['onlysnarf', 'reels-clips-automator'],
          loginRedirectUrl: '/dashboard',
          customScopes: ['social:read', 'social:write', 'social:publish']
        },

        // Authentication Policy
        authPolicy: {
          requireMfa: true,
          maxSessionDuration: 7200000, // 2 hours
          rateLimit: { requests: 500, window: 60000 },
          auditLog: true
        },

        // Security Configuration
        security: {
          requireHttps: false,
          allowCredentials: true,
          corsMaxAge: 86400
        },

        // Credential Sharing
        credentialSharing: {
          enabled: true,
          allowedTypes: ['oauth', 'api-key', 'password'],
          requireApproval: true
        }
      },
      {
        id: 'wan2gp-gradio',
        name: 'Wan2GP Video Generation',
        description: 'AI-powered video generation interface',
        url: 'http://localhost:7860',
        allowedOrigins: ['http://localhost:7860'],
        authenticationMode: 'none', // Public interface
        sessionTimeout: 1800000, // 30 minutes
        tokenRefreshThreshold: 300000, // 5 minutes
        category: 'content',
        tags: ['video', 'generation', 'ai'],
        version: '1.0.0',

        // No SSO for public interface
        sso: {
          enabled: false,
          autoLogin: false,
          tokenSharing: false,
          sharedApps: []
        },

        // Minimal authentication policy
        authPolicy: {
          requireMfa: false,
          maxSessionDuration: 1800000,
          rateLimit: { requests: 100, window: 60000 },
          auditLog: false
        }
      },
      {
        id: 'turix-cards',
        name: 'Turix Automation Cards',
        description: 'Visual automation card builder',
        url: 'http://localhost:3003/cards',
        allowedOrigins: ['http://localhost:3003'],
        authenticationMode: 'sso',
        sessionTimeout: 3600000, // 1 hour
        tokenRefreshThreshold: 300000, // 5 minutes
        category: 'automation',
        tags: ['cards', 'automation', 'visual'],
        version: '1.0.0',

        // SSO Configuration
        sso: {
          enabled: true,
          autoLogin: true,
          tokenSharing: true,
          sharedApps: ['vy-workflows', 'bytebot'],
          loginRedirectUrl: '/cards/dashboard'
        },

        // Authentication Policy
        authPolicy: {
          requireMfa: false,
          maxSessionDuration: 3600000,
          rateLimit: { requests: 800, window: 60000 },
          auditLog: true
        },

        // Credential Sharing
        credentialSharing: {
          enabled: true,
          allowedTypes: ['api-key', 'oauth'],
          requireApproval: false
        }
      },
      {
        id: 'bytebot',
        name: 'ByteBot Agent',
        description: 'Desktop automation and computer control agent',
        url: 'http://localhost:4000',
        allowedOrigins: ['http://localhost:4000'],
        authenticationMode: 'sso',
        sessionTimeout: 3600000,
        tokenRefreshThreshold: 300000,
        category: 'automation',
        tags: ['desktop', 'automation', 'agent'],
        version: '1.0.0',

        sso: {
          enabled: true,
          autoLogin: false, // Require explicit login for security
          tokenSharing: true,
          sharedApps: ['vy-workflows', 'turix-cards'],
          customScopes: ['automation:execute', 'desktop:control']
        },

        authPolicy: {
          requireMfa: true,
          maxSessionDuration: 3600000,
          rateLimit: { requests: 200, window: 60000 },
          auditLog: true
        },

        security: {
          requireHttps: false,
          allowCredentials: true,
          permissionsPolicy: {
            'camera': [],
            'microphone': [],
            'geolocation': []
          }
        }
      },
      {
        id: 'factif-ai',
        name: 'Factif AI',
        description: 'Web automation and testing platform',
        url: 'http://localhost:7010',
        allowedOrigins: ['http://localhost:7010'],
        authenticationMode: 'sso',
        sessionTimeout: 3600000,
        tokenRefreshThreshold: 300000,
        category: 'automation',
        tags: ['web', 'testing', 'automation'],
        version: '1.0.0',

        sso: {
          enabled: true,
          autoLogin: true,
          tokenSharing: true,
          sharedApps: ['vy-workflows'],
          customScopes: ['web:automate', 'testing:execute']
        },

        authPolicy: {
          requireMfa: false,
          maxSessionDuration: 3600000,
          rateLimit: { requests: 300, window: 60000 },
          auditLog: true
        }
      }
    ];
  }

  private initializeServices(): void {
    // Initialize core services
    this.serviceRegistry = new ServiceRegistry();
    this.authManager = new AuthenticationManager();
    this.authProxy = new AuthenticationProxy(this.authManager);
    this.healthChecker = new HealthChecker(this.serviceRegistry);
    this.metricsCollector = new MetricsCollector();
    this.wsManager = new WebSocketManager(this.io);

    // Initialize CORS middleware with embedded apps
    const embeddedApps = this.getEmbeddedApps();
    this.corsMiddleware = new CORSMiddleware(embeddedApps);

    // Initialize request router with dependencies
    this.requestRouter = new RequestRouter(
      this.serviceRegistry,
      this.authManager,
      this.metricsCollector
    );

    // Register services from configuration
    this.registerConfiguredServices();
  }

  private registerConfiguredServices(): void {
    config.services.forEach(service => {
      this.serviceRegistry.register(service);
    });
  }

  private configureMiddleware(): void {
    // Security middleware
    this.app.use(helmet());

    // Comprehensive security measures
    const securityMiddlewares = createSecurityMiddleware({
      csrfProtection: true,
      secureHeaders: true,
      auditLogging: true,
      rateLimiting: true,
      inputValidation: true,
      xssProtection: true
    }, this.authManager);

    // Apply security middlewares
    securityMiddlewares.forEach(middleware => {
      this.app.use(middleware);
    });

    // Configure CORS for embedded applications
    this.corsMiddleware.configureCORS(this.app);

    // Additional CORS configuration for general API access
    this.app.use(cors({
      origin: (origin, callback) => {
        if (!origin || config.cors.origins.includes(origin)) {
          callback(null, true);
        } else {
          callback(new Error('Not allowed by CORS'));
        }
      },
      credentials: config.cors.credentials,
      methods: config.cors.methods,
      allowedHeaders: config.cors.headers,
    }));

    // Compression
    this.app.use(compression());

    // Body parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Rate limiting
    this.app.use(rateLimitMiddleware);

    // Request logging and metrics
    this.app.use(this.metricsCollector.requestMiddleware());

    // Authentication (applied after rate limiting)
    this.app.use(authenticationMiddleware(this.authManager));

    // Token forwarding for embedded applications
    this.app.use('/api/apps', embeddedAppValidationMiddleware(this.authProxy));
    this.app.use('/api/apps', tokenRefreshMiddleware(this.authProxy));
    this.app.use('/api/apps', tokenForwardingMiddleware(this.authProxy, {
      allowedPaths: ['/api/apps'],
      excludedPaths: ['/api/apps/auth/login', '/api/apps/auth/logout']
    }));
  }

  private configureRoutes(): void {
    // Health check (no auth required)
    this.app.use('/health', healthRoutes(this.healthChecker, this.metricsCollector));

    // Unified API routes
    this.app.use('/api/v1', unifiedApiRoutes(
      this.serviceRegistry,
      this.requestRouter,
      this.authManager
    ));

    // Service management routes
    this.app.use('/api/v1/services', serviceRoutes(
      this.serviceRegistry,
      this.healthChecker
    ));

    // Authentication routes
    this.app.use('/auth', authRoutes(
      this.authManager,
      this.authProxy
    ));

    // API documentation
    this.app.get('/api/docs', (req, res) => {
      res.json({
        title: 'Backend Orchestrator API',
        version: '1.0.0',
        description: 'Unified API Gateway for AI Ecosystem',
        endpoints: {
          unified: '/api/v1/*',
          services: '/api/v1/services/*',
          health: '/health/*'
        }
      });
    });

    // 404 handler for unmatched routes
    this.app.use('*', (req, res) => {
      res.status(404).json({
        error: {
          code: 'ROUTE_NOT_FOUND',
          message: `Route ${req.method} ${req.path} not found`,
          statusCode: 404
        }
      });
    });
  }

  private configureWebSocket(): void {
    this.io.on('connection', (socket) => {
      console.log(`WebSocket connection established: ${socket.id}`);

      // Handle real-time service status updates
      socket.on('subscribe:service-status', (serviceId: string) => {
        this.wsManager.subscribeToServiceStatus(socket, serviceId);
      });

      socket.on('unsubscribe:service-status', (serviceId: string) => {
        this.wsManager.unsubscribeFromServiceStatus(socket, serviceId);
      });

      // Handle real-time metrics updates
      socket.on('subscribe:metrics', () => {
        this.wsManager.subscribeToMetrics(socket);
      });

      socket.on('unsubscribe:metrics', () => {
        this.wsManager.unsubscribeFromMetrics(socket);
      });

      socket.on('disconnect', () => {
        console.log(`WebSocket connection closed: ${socket.id}`);
        this.wsManager.handleDisconnect(socket);
      });

      socket.on('error', (error) => {
        console.error(`WebSocket error for ${socket.id}:`, error);
        this.wsManager.handleError(socket, error);
      });
    });

    // Start WebSocket manager
    this.wsManager.start();
  }

  private configureErrorHandling(): void {
    this.app.use(errorHandler);
  }

  public async start(): Promise<void> {
    try {
      // Start health checking
      await this.healthChecker.start();

      // Start metrics collection
      await this.metricsCollector.start();

      // Start HTTP server
      this.httpServer.listen(config.port, config.host, () => {
        console.log(`
╔══════════════════════════════════════════════════════════════╗
║                    BACKEND ORCHESTRATOR                      ║
║                                                              ║
║  Server running on: http://${config.host}:${config.port}     ║
║  Environment: ${process.env.NODE_ENV || 'development'}        ║
║  WebSocket: Enabled                                          ║
║  Services registered: ${config.services.length}               ║
║                                                              ║
║  API Documentation: http://${config.host}:${config.port}/api/docs ║
║  Health Check: http://${config.host}:${config.port}/health   ║
╚══════════════════════════════════════════════════════════════╝
        `);
      });

      // Graceful shutdown
      process.on('SIGTERM', () => this.gracefulShutdown());
      process.on('SIGINT', () => this.gracefulShutdown());

    } catch (error) {
      console.error('Failed to start orchestrator server:', error);
      process.exit(1);
    }
  }

  private async gracefulShutdown(): Promise<void> {
    console.log('Initiating graceful shutdown...');

    try {
      // Stop health checking
      await this.healthChecker.stop();

      // Stop metrics collection
      await this.metricsCollector.stop();

      // Stop WebSocket manager
      await this.wsManager.stop();

      // Close HTTP server
      this.httpServer.close(() => {
        console.log('HTTP server closed');
        process.exit(0);
      });

    } catch (error) {
      console.error('Error during shutdown:', error);
      process.exit(1);
    }
  }

  // Public getters for testing
  public getApp(): express.Application {
    return this.app;
  }

  public getServiceRegistry(): ServiceRegistry {
    return this.serviceRegistry;
  }

  public getRequestRouter(): RequestRouter {
    return this.requestRouter;
  }

  public getAuthManager(): AuthenticationManager {
    return this.authManager;
  }
}

// Start server if this file is run directly
if (require.main === module) {
  const server = new OrchestratorServer();
  server.start().catch(console.error);
}

export default OrchestratorServer;