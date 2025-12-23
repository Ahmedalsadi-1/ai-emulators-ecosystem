// Core Types
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'OPTIONS' | 'HEAD';

export type ServiceStatus = 'healthy' | 'unhealthy' | 'unknown' | 'maintenance';

export type ServiceCategory = 'ai' | 'automation' | 'social' | 'content' | 'infrastructure';

export type TokenType = 'user' | 'service' | 'api_key';

// Service Definition Types
export interface ServiceDefinition {
  id: string;
  name: string;
  version: string;
  baseUrl: string;
  healthCheck: string;
  endpoints: EndpointDefinition[];
  capabilities: string[];
  metadata: ServiceMetadata;
  status: ServiceStatus;
  lastHealthCheck: Date;
  uptime?: number;
}

export interface EndpointDefinition {
  path: string;
  method: HttpMethod;
  description?: string;
  requiresAuth: boolean;
  rateLimit?: RateLimitConfig;
  timeout: number;
  retries: number;
  schema?: {
    request?: any;
    response?: any;
  };
}

export interface ServiceMetadata {
  category: ServiceCategory;
  requiresAuth: boolean;
  rateLimit: RateLimitConfig;
  dependencies?: string[];
  environment: 'development' | 'staging' | 'production';
  tags: string[];
}

// Authentication Types
export interface AuthContext {
  userId?: string;
  serviceId?: string;
  sessionId: string;
  permissions: string[];
  tokenType: TokenType;
  expiresAt: Date;
  metadata?: Record<string, any>;
}

export interface User {
  id: string;
  username: string;
  email: string;
  passwordHash: string;
  roles: string[];
  permissions: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
  profile?: UserProfile;
}

export interface UserProfile {
  firstName?: string;
  lastName?: string;
  avatar?: string;
  preferences: Record<string, any>;
}

export interface LoginCredentials {
  username: string;
  password: string;
  rememberMe?: boolean;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  tokenType: 'Bearer';
  expiresIn: number;
  expiresAt: Date;
}

export interface Session {
  id: string;
  userId: string;
  userAgent?: string;
  ipAddress?: string;
  isActive: boolean;
  createdAt: Date;
  expiresAt: Date;
  lastActivity: Date;
  metadata?: Record<string, any>;
}

export interface SSOContext {
  sessionId: string;
  userId: string;
  apps: SSOApp[];
  createdAt: Date;
  expiresAt: Date;
}

export interface SSOApp {
  appId: string;
  token: string;
  permissions: string[];
  grantedAt: Date;
  expiresAt: Date;
}

export interface JWTPayload {
  sub: string;
  sid: string;
  permissions: string[];
  iat: number;
  exp: number;
}

export interface ApiKeyDefinition {
  key: string;
  serviceId: string;
  permissions: string[];
  createdAt: Date;
  expiresAt?: Date;
  rateLimit: RateLimitConfig;
}

// Request/Response Types
export interface OrchestratorRequest {
  id: string;
  path: string;
  method: HttpMethod;
  headers: Record<string, string>;
  query: Record<string, any>;
  body?: any;
  auth?: AuthContext;
  timeout?: number;
  retries?: number;
}

export interface OrchestratorResponse {
  id: string;
  statusCode: number;
  headers: Record<string, string>;
  data: any;
  metadata: {
    serviceId: string;
    responseTime: number;
    cached?: boolean;
    transformed?: boolean;
  };
}

// Route Configuration Types
export interface RouteConfig {
  pattern: string;
  serviceId: string;
  methods: HttpMethod[];
  transforms?: {
    request?: RequestTransform[];
    response?: ResponseTransform[];
  };
  middleware?: string[];
  priority?: number;
}

export interface RequestTransform {
  type: 'header' | 'body' | 'query' | 'path';
  operation: 'add' | 'remove' | 'modify' | 'map';
  source?: string;
  target?: string;
  value?: any;
  mapping?: Record<string, any>;
}

export interface ResponseTransform {
  type: 'header' | 'body' | 'status';
  operation: 'add' | 'remove' | 'modify' | 'map';
  source?: string;
  target?: string;
  value?: any;
  mapping?: Record<string, any>;
}

// Configuration Types
export interface RateLimitConfig {
  requests: number;
  window: number; // seconds
  burst?: number;
}

export interface CircuitBreakerConfig {
  failureThreshold: number;
  timeout: number; // milliseconds
  retryDelay: number; // milliseconds
  monitoringPeriod: number; // milliseconds
}

export interface OrchestratorConfig {
  port: number;
  host: string;
  jwtSecret: string;
  redisUrl: string;
  services: ServiceDefinition[];
  rateLimits: {
    global: RateLimitConfig;
    authenticated: RateLimitConfig;
    anonymous: RateLimitConfig;
  };
  circuitBreaker: CircuitBreakerConfig;
  monitoring: {
    enabled: boolean;
    prometheusPort: number;
    logLevel: string;
    metricsRetention: number; // days
  };
  cors: {
    origins: string[];
    credentials: boolean;
    methods: HttpMethod[];
    headers: string[];
  };
}

// Error Types
export interface OrchestratorErrorDetails {
  code: string;
  message: string;
  statusCode: number;
  details?: any;
  serviceId?: string;
  requestId?: string;
  timestamp: Date;
}

// Health Check Types
export interface HealthCheckResult {
  serviceId: string;
  status: ServiceStatus;
  responseTime: number;
  error?: string;
  timestamp: Date;
  details?: Record<string, any>;
}

// Metrics Types
export interface ServiceMetrics {
  serviceId: string;
  requestsTotal: number;
  requestsSuccessful: number;
  requestsFailed: number;
  averageResponseTime: number;
  errorRate: number;
  uptime: number;
  lastUpdated: Date;
}

export interface SystemMetrics {
  totalRequests: number;
  activeConnections: number;
  memoryUsage: number;
  cpuUsage: number;
  uptime: number;
}

// WebSocket Types
export interface WebSocketMessage {
  type: string;
  payload: any;
  requestId?: string;
  timestamp: Date;
}

export interface ServiceEvent {
  serviceId: string;
  eventType: 'status_change' | 'health_check' | 'metrics_update';
  data: any;
  timestamp: Date;
}

// Cache Types
export interface CacheEntry {
  key: string;
  value: any;
  ttl: number;
  createdAt: Date;
  metadata?: Record<string, any>;
}

// Middleware Types
export type MiddlewareFunction = (
  req: OrchestratorRequest,
  res: OrchestratorResponse,
  next: () => void
) => void | Promise<void>;

// Load Balancer Types
export interface LoadBalancerStrategy {
  name: string;
  selectTarget: (targets: ServiceDefinition[]) => Promise<ServiceDefinition>;
}

// Plugin Types
export interface OrchestratorPlugin {
  name: string;
  version: string;
  init: (config: any) => Promise<void>;
  destroy?: () => Promise<void>;
  hooks: {
    onRequest?: (request: OrchestratorRequest) => Promise<void>;
    onResponse?: (response: OrchestratorResponse) => Promise<void>;
    onError?: (error: OrchestratorErrorDetails) => Promise<void>;
  };
}