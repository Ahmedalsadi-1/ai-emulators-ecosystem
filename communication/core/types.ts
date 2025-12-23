/**
 * Unified Communication Types
 * Core type definitions for postMessage and WebSocket communication
 */

export enum MessageType {
  // State synchronization
  STATE_SYNC = 'state:sync',
  STATE_UPDATE = 'state:update',
  STATE_REQUEST = 'state:request',
  STATE_RESPONSE = 'state:response',

  // Workflow chaining
  WORKFLOW_START = 'workflow:start',
  WORKFLOW_STEP = 'workflow:step',
  WORKFLOW_COMPLETE = 'workflow:complete',
  WORKFLOW_ERROR = 'workflow:error',
  WORKFLOW_CANCEL = 'workflow:cancel',

  // Navigation
  NAVIGATION_CHANGE = 'nav:change',
  NAVIGATION_REQUEST = 'nav:request',
  NAVIGATION_SYNC = 'nav:sync',
  NAVIGATION_BROADCAST = 'nav:broadcast',

  // Authentication & Security
  AUTH_REQUEST = 'auth:request',
  AUTH_RESPONSE = 'auth:response',
  AUTH_REFRESH = 'auth:refresh',
  AUTH_ERROR = 'auth:error',

  // Health & Monitoring
  HEALTH_CHECK = 'health:check',
  HEALTH_STATUS = 'health:status',
  HEALTH_PING = 'health:ping',
  HEALTH_PONG = 'health:pong',
  ERROR_REPORT = 'error:report',

  // Error responses
  ERROR_RESPONSE = 'error:response',

  // General communication
  ACKNOWLEDGE = 'ack',
  HEARTBEAT = 'heartbeat',
  BROADCAST = 'broadcast'
}

export enum MessagePriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export enum MessageChannel {
  POSTMESSAGE = 'postmessage',
  WEBSOCKET = 'websocket',
  BROADCAST = 'broadcast'
}

export interface UnifiedMessage {
  id: string;
  type: MessageType;
  source: string; // iframe id or 'main'
  target: string; // iframe id or 'main' or 'broadcast'
  channel: MessageChannel;
  payload: any;
  timestamp: number;
  signature?: string;
  correlationId?: string;
  priority?: MessagePriority;
  ttl?: number; // time to live in milliseconds
  metadata?: Record<string, any>;
}

export interface MessageEnvelope {
  message: UnifiedMessage;
  origin?: string;
  sourceWindow?: Window;
  targetWindow?: Window;
}

export interface CommunicationConfig {
  allowedOrigins: string[];
  trustedDomains: string[];
  messageTimeout: number;
  maxMessageSize: number;
  rateLimitPerSecond: number;
  enableEncryption: boolean;
  enableCompression: boolean;
}

export interface PanelConfig {
  id: string;
  name: string;
  url: string;
  allowedOrigins: string[];
  permissions: string[];
  sandboxAttributes?: string[];
  cspDirectives?: Record<string, string[]>;
}

export class CommunicationError extends Error {
  public readonly code: string;
  public readonly source: string;
  public readonly target: string;
  public readonly timestamp: number;
  public readonly originalError?: Error;
  public readonly correlationId?: string;

  constructor(
    code: string,
    message: string,
    source: string,
    target: string,
    timestamp: number,
    originalError?: Error,
    correlationId?: string
  ) {
    super(message);
    this.name = 'CommunicationError';
    this.code = code;
    this.source = source;
    this.target = target;
    this.timestamp = timestamp;
    this.originalError = originalError;
    this.correlationId = correlationId;
  }
}

export interface MessageValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  sanitizedMessage?: UnifiedMessage;
}

export interface RateLimitInfo {
  allowed: boolean;
  remaining: number;
  resetTime: number;
  windowSize: number;
}

// Event types for communication events
export interface CommunicationEvent {
  type: 'message' | 'error' | 'connect' | 'disconnect' | 'security';
  source: string;
  target: string;
  data: any;
  timestamp: number;
}

export interface ConnectionStatus {
  panelId: string;
  connected: boolean;
  lastSeen: number;
  connectionType: 'iframe' | 'websocket' | 'both';
  healthStatus: 'healthy' | 'degraded' | 'unhealthy';
}

// Workflow types
export interface WorkflowStep {
  id: string;
  panelId: string;
  action: string;
  params: any;
  dependencies: string[]; // step IDs that must complete first
  timeout: number;
  retryPolicy: RetryPolicy;
  rollbackAction?: string;
}

export interface WorkflowChain {
  id: string;
  name: string;
  steps: WorkflowStep[];
  currentStep: number;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  results: Map<string, any>;
  error?: WorkflowError;
  createdAt: number;
  updatedAt: number;
}

export class WorkflowError extends Error {
  public readonly stepId: string;
  public readonly timestamp: number;
  public readonly retryCount: number;
  public readonly canRetry: boolean;

  constructor(stepId: string, message: string, timestamp: number, retryCount: number, canRetry: boolean) {
    super(message);
    this.name = 'WorkflowError';
    this.stepId = stepId;
    this.timestamp = timestamp;
    this.retryCount = retryCount;
    this.canRetry = canRetry;
  }
}

export interface RetryPolicy {
  maxRetries: number;
  backoffMultiplier: number;
  initialDelay: number;
  maxDelay: number;
}

// State synchronization types
export interface StateSyncMessage {
  stateKey: string;
  state: any;
  version: number;
  lastModified: number;
  source: string;
  conflicts?: StateConflict[];
}

export interface StateConflict {
  key: string;
  localValue: any;
  remoteValue: any;
  localVersion: number;
  remoteVersion: number;
  resolved?: boolean;
  resolution?: any;
}

export interface StateSubscription {
  panelId: string;
  stateKeys: string[];
  callback: (state: StateSyncMessage) => void;
}

// Navigation types
export interface NavigationContext {
  currentPanel: string;
  panelHistory: NavigationEntry[];
  breadcrumbs: Breadcrumb[];
  crossPanelData: Map<string, any>;
  activeWorkflows?: string[];
}

export interface NavigationEntry {
  panelId: string;
  route: string;
  params?: any;
  timestamp: number;
  context?: any;
}

export interface Breadcrumb {
  id: string;
  label: string;
  panelId: string;
  route?: string;
  params?: any;
  clickable: boolean;
}

export interface NavigationChange {
  type: 'switch' | 'navigate' | 'back' | 'forward';
  fromPanel?: string;
  toPanel: string;
  route?: string;
  params?: any;
  preserveContext: boolean;
}

// Security types
export interface SecurityContext {
  authenticated: boolean;
  userId?: string;
  sessionId?: string;
  permissions: string[];
  tokenExpiry?: number;
}

export interface MessageSignature {
  algorithm: string;
  keyId: string;
  signature: string;
  timestamp: number;
}

// Monitoring types
export interface CommunicationMetrics {
  messagesSent: number;
  messagesReceived: number;
  messagesFailed: number;
  averageLatency: number;
  errorRate: number;
  throughputPerSecond: number;
  activeConnections: number;
}

export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  lastCheck: number;
  responseTime: number;
  errorCount: number;
  details: Record<string, any>;
}