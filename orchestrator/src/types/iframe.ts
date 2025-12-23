// orchestrator/src/types/iframe.ts
export interface AuthToken {
  token: string;
  refreshToken?: string;
  expiresAt: Date;
  type: 'bearer' | 'api-key';
}

export interface IframeSession {
  sessionId: string;
  appId: string;
  userId: string;
  token: string;
  refreshToken: string;
  expiresAt: Date;
  permissions: string[];
  origin: string;
  createdAt: Date;
}

export interface SSOConfig {
  enabled: boolean;
  autoLogin: boolean;
  tokenSharing: boolean;
  sharedApps: string[]; // Apps that can share tokens with this app
  loginRedirectUrl?: string;
  logoutRedirectUrl?: string;
  customScopes?: string[];
}

export interface AuthPolicy {
  requireMfa: boolean;
  maxSessionDuration: number; // in milliseconds
  allowedIpRanges?: string[];
  rateLimit: {
    requests: number;
    window: number; // in milliseconds
  };
  auditLog: boolean;
}

export interface SecurityConfig {
  contentSecurityPolicy?: Record<string, string[]>;
  permissionsPolicy?: Record<string, string[]>;
  requireHttps: boolean;
  allowCredentials: boolean;
  corsMaxAge?: number;
}

export interface EmbeddedApp {
  id: string;
  name: string;
  url: string;
  allowedOrigins: string[];
  authenticationMode: 'proxy' | 'passthrough' | 'none' | 'sso';
  sessionTimeout: number; // in milliseconds
  tokenRefreshThreshold: number; // in milliseconds
  sandboxAttributes?: string[];
  cspDirectives?: Record<string, string[]>;

  // Enhanced SSO and security configurations
  sso?: SSOConfig;
  authPolicy?: AuthPolicy;
  security?: SecurityConfig;

  // Credential vault integration
  credentialSharing?: {
    enabled: boolean;
    allowedTypes: string[]; // Types of credentials this app can access
    requireApproval: boolean;
  };

  // Communication settings
  messageTimeout?: number;
  allowedMessageTypes?: string[];

  // Metadata
  version?: string;
  description?: string;
  category?: string;
  tags?: string[];
}

export interface EmbeddedMessage {
  type: string;
  id: string;
  source: 'parent' | 'iframe';
  targetAppId: string;
  payload: any;
  timestamp: number;
  signature?: string;
}

export interface AuthMessage extends EmbeddedMessage {
  type: 'auth:request' | 'auth:success' | 'auth:error' | 'auth:refresh';
  payload: {
    token?: string;
    refreshToken?: string;
    error?: string;
    sessionId?: string;
  };
}

export interface IframeError {
  type: 'load_error' | 'security_error' | 'communication_error' | 'auth_error';
  message: string;
  appId: string;
  timestamp: Date;
  details?: any;
}

export interface Permission {
  type: 'api' | 'storage' | 'notification' | 'geolocation';
  allow: boolean;
  restrictions?: string[];
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

export interface DataMessage extends EmbeddedMessage {
  type: 'data:request' | 'data:response';
  payload: {
    endpoint?: string;
    method?: string;
    data?: any;
    response?: any;
  };
}

export interface UIMessage extends EmbeddedMessage {
  type: 'ui:state-change' | 'ui:action' | 'ui:state-updated' | 'ui:action-response';
  payload: {
    component?: string;
    action?: string;
    state?: any;
    params?: any;
  };
}

export interface EventMessage extends EmbeddedMessage {
  type: 'event:user-action' | 'event:app-state' | 'event:acknowledged' | 'event:state-updated';
  payload: {
    eventType?: string;
    eventData?: any;
    sourceComponent?: string;
  };
}

export interface HealthMessage extends EmbeddedMessage {
  type: 'health:ping' | 'health:pong' | 'health:status' | 'health:status-response';
  payload: {
    status?: string;
    details?: any;
    timestamp?: number;
  };
}