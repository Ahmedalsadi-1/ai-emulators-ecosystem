import { OrchestratorConfig, ServiceDefinition } from '@/types';

// Environment variables with defaults
const PORT = parseInt(process.env.PORT || '3000', 10);
const HOST = process.env.HOST || '0.0.0.0';
const JWT_SECRET = process.env.JWT_SECRET || 'default-jwt-secret-change-in-production';
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const NODE_ENV = process.env.NODE_ENV || 'development';

// Service definitions for the ecosystem
const services: ServiceDefinition[] = [
  // AI Services
  {
    id: 'aios',
    name: 'AIOS',
    version: '1.0.0',
    baseUrl: 'http://localhost:8010',
    healthCheck: '/health',
    status: 'unknown',
    lastHealthCheck: new Date(),
    endpoints: [
      {
        path: '/api/*',
        method: 'POST',
        requiresAuth: true,
        timeout: 30000,
        retries: 2
      }
    ],
    capabilities: ['llm-inference', 'ai-agents', 'model-serving'],
    metadata: {
      category: 'ai',
      requiresAuth: true,
      rateLimit: { requests: 100, window: 60 },
      environment: NODE_ENV as any,
      tags: ['gpu', 'ml', 'inference']
    }
  },
  {
    id: 'gbox',
    name: 'GBox',
    version: '1.0.0',
    baseUrl: 'http://localhost:3010',
    healthCheck: '/api/health',
    status: 'unknown',
    lastHealthCheck: new Date(),
    endpoints: [
      {
        path: '/api/*',
        method: 'GET',
        requiresAuth: false,
        timeout: 5000,
        retries: 1
      }
    ],
    capabilities: ['environment-provisioning', 'container-management'],
    metadata: {
      category: 'infrastructure',
      requiresAuth: false,
      rateLimit: { requests: 50, window: 60 },
      environment: NODE_ENV as any,
      tags: ['containers', 'environments']
    }
  },

  // Automation Services
  {
    id: 'bytebot',
    name: 'ByteBot',
    version: '1.0.0',
    baseUrl: 'http://localhost:4000',
    healthCheck: '/health',
    status: 'unknown',
    lastHealthCheck: new Date(),
    endpoints: [
      {
        path: '/api/*',
        method: 'POST',
        requiresAuth: true,
        timeout: 15000,
        retries: 2
      },
      {
        path: '/vnc/*',
        method: 'GET',
        requiresAuth: true,
        timeout: 30000,
        retries: 1
      }
    ],
    capabilities: ['computer-control', 'automation', 'vnc'],
    metadata: {
      category: 'automation',
      requiresAuth: true,
      rateLimit: { requests: 200, window: 60 },
      environment: NODE_ENV as any,
      tags: ['desktop', 'automation', 'vnc']
    }
  },
  {
    id: 'open-interface',
    name: 'Open-Interface',
    version: '1.0.0',
    baseUrl: 'http://localhost:5010',
    healthCheck: '/health',
    status: 'unknown',
    lastHealthCheck: new Date(),
    endpoints: [
      {
        path: '/api/*',
        method: 'POST',
        requiresAuth: true,
        timeout: 10000,
        retries: 2
      }
    ],
    capabilities: ['computer-control', 'macos-automation'],
    metadata: {
      category: 'automation',
      requiresAuth: true,
      rateLimit: { requests: 150, window: 60 },
      environment: NODE_ENV as any,
      tags: ['macos', 'gui', 'automation']
    }
  },
  {
    id: 'factif-ai',
    name: 'Factif-AI',
    version: '1.0.0',
    baseUrl: 'http://localhost:7010',
    healthCheck: '/health',
    status: 'unknown',
    lastHealthCheck: new Date(),
    endpoints: [
      {
        path: '/api/*',
        method: 'POST',
        requiresAuth: true,
        timeout: 20000,
        retries: 2
      }
    ],
    capabilities: ['web-automation', 'testing', 'scraping'],
    metadata: {
      category: 'automation',
      requiresAuth: true,
      rateLimit: { requests: 100, window: 60 },
      environment: NODE_ENV as any,
      tags: ['web', 'testing', 'automation']
    }
  },

  // Social Media Services
  {
    id: 'postiz-app',
    name: 'Postiz',
    version: '1.0.0',
    baseUrl: 'http://localhost:9000',
    healthCheck: '/health',
    status: 'unknown',
    lastHealthCheck: new Date(),
    endpoints: [
      {
        path: '/api/*',
        method: 'POST',
        requiresAuth: true,
        timeout: 10000,
        retries: 2
      }
    ],
    capabilities: ['social-media', 'scheduling', 'posting'],
    metadata: {
      category: 'social',
      requiresAuth: true,
      rateLimit: { requests: 300, window: 60 },
      environment: NODE_ENV as any,
      tags: ['social', 'scheduling', 'content']
    }
  },
  {
    id: 'onlysnarf',
    name: 'OnlySnarf',
    version: '1.0.0',
    baseUrl: 'http://localhost:10000',
    healthCheck: '/health',
    status: 'unknown',
    lastHealthCheck: new Date(),
    endpoints: [
      {
        path: '/api/*',
        method: 'POST',
        requiresAuth: true,
        timeout: 15000,
        retries: 2
      }
    ],
    capabilities: ['onlyfans-automation', 'content-management'],
    metadata: {
      category: 'social',
      requiresAuth: true,
      rateLimit: { requests: 50, window: 60 },
      environment: NODE_ENV as any,
      tags: ['onlyfans', 'content', 'automation']
    }
  },

  // Content Creation Services
  {
    id: 'reels-clips-automator',
    name: 'Reels Automator',
    version: '1.0.0',
    baseUrl: 'http://localhost:11000',
    healthCheck: '/health',
    status: 'unknown',
    lastHealthCheck: new Date(),
    endpoints: [
      {
        path: '/api/*',
        method: 'POST',
        requiresAuth: true,
        timeout: 30000,
        retries: 2
      }
    ],
    capabilities: ['video-creation', 'instagram-reels', 'content-generation'],
    metadata: {
      category: 'content',
      requiresAuth: true,
      rateLimit: { requests: 20, window: 60 },
      environment: NODE_ENV as any,
      tags: ['video', 'instagram', 'content']
    }
  },
  {
    id: 'wan2gp',
    name: 'Wan2GP',
    version: '1.0.0',
    baseUrl: 'http://localhost:12000',
    healthCheck: '/health',
    status: 'unknown',
    lastHealthCheck: new Date(),
    endpoints: [
      {
        path: '/api/*',
        method: 'POST',
        requiresAuth: true,
        timeout: 60000,
        retries: 1
      },
      {
        path: '/gradio/*',
        method: 'GET',
        requiresAuth: false,
        timeout: 30000,
        retries: 1
      }
    ],
    capabilities: ['video-generation', 'ai-video', 'content-creation'],
    metadata: {
      category: 'content',
      requiresAuth: true,
      rateLimit: { requests: 10, window: 60 },
      environment: NODE_ENV as any,
      tags: ['video', 'generation', 'gpu', 'ai']
    }
  }
];

// Main configuration object
export const config: OrchestratorConfig = {
  port: PORT,
  host: HOST,
  jwtSecret: JWT_SECRET,
  redisUrl: REDIS_URL,
  services,
  rateLimits: {
    global: {
      requests: 1000,
      window: 60
    },
    authenticated: {
      requests: 500,
      window: 60
    },
    anonymous: {
      requests: 100,
      window: 60
    }
  },
  circuitBreaker: {
    failureThreshold: 5,
    timeout: 60000, // 1 minute
    retryDelay: 30000, // 30 seconds
    monitoringPeriod: 300000 // 5 minutes
  },
  monitoring: {
    enabled: true,
    prometheusPort: parseInt(process.env.PROMETHEUS_PORT || '9091'),
    logLevel: process.env.LOG_LEVEL || 'info',
    metricsRetention: 30 // days
  },
  cors: {
    origins: process.env.ALLOWED_ORIGINS?.split(',') || [
      'http://localhost:5173',
      'http://localhost:5174',
      'http://localhost:3000',
      'http://localhost:9999'
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS', 'HEAD'],
    headers: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-API-Key']
  }
};

// Helper function to get service by ID
export function getServiceById(serviceId: string): ServiceDefinition | undefined {
  return services.find(service => service.id === serviceId);
}

// Helper function to get services by category
export function getServicesByCategory(category: string): ServiceDefinition[] {
  return services.filter(service => service.metadata.category === category);
}

// Helper function to validate configuration
export function validateConfig(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!JWT_SECRET || JWT_SECRET === 'default-jwt-secret-change-in-production') {
    errors.push('JWT_SECRET must be set in production');
  }

  if (services.length === 0) {
    errors.push('At least one service must be configured');
  }

  services.forEach(service => {
    if (!service.baseUrl) {
      errors.push(`Service ${service.id} is missing baseUrl`);
    }
    if (!service.healthCheck) {
      errors.push(`Service ${service.id} is missing healthCheck endpoint`);
    }
  });

  return {
    valid: errors.length === 0,
    errors
  };
}