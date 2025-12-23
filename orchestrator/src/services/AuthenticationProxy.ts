// orchestrator/src/services/AuthenticationProxy.ts
import * as crypto from 'crypto';
import * as jwt from 'jsonwebtoken';
import { AuthToken, IframeSession, EmbeddedApp, SSOContext, SSOApp } from '../types/iframe';
import { AuthenticationManager } from './AuthenticationManager';

export class AuthenticationProxy {
  private sessions = new Map<string, IframeSession>();
  private appRegistry!: Map<string, EmbeddedApp>;
  private ssoContexts = new Map<string, SSOContext>();
  private authManager: AuthenticationManager;
  private jwtSecret: string;

  constructor(
    authManager: AuthenticationManager,
    jwtSecret: string = process.env.JWT_SECRET || 'default-secret'
  ) {
    this.authManager = authManager;
    this.jwtSecret = jwtSecret;
    this.initializeAppRegistry();
  }

  private initializeAppRegistry(): void {
    // Initialize with app configurations
    this.appRegistry = new Map([
      ['vy-workflows', {
        id: 'vy-workflows',
        name: 'Vy Workflows',
        url: 'http://localhost:9992/workflows',
        allowedOrigins: ['http://localhost:9992'],
        authenticationMode: 'proxy' as const,
        sessionTimeout: 3600000, // 1 hour
        tokenRefreshThreshold: 300000, // 5 minutes
      }],
      ['postiz-dashboard', {
        id: 'postiz-dashboard',
        name: 'Postiz Dashboard',
        url: 'http://localhost:3000',
        allowedOrigins: ['http://localhost:3000'],
        authenticationMode: 'passthrough' as const,
        sessionTimeout: 7200000, // 2 hours
        tokenRefreshThreshold: 600000, // 10 minutes
      }],
      ['wan2gp-gradio', {
        id: 'wan2gp-gradio',
        name: 'Wan2GP Video Generation',
        url: 'http://localhost:7860',
        allowedOrigins: ['http://localhost:7860'],
        authenticationMode: 'none' as const,
        sessionTimeout: 1800000, // 30 minutes
        tokenRefreshThreshold: 300000, // 5 minutes
      }],
      ['turix-cards', {
        id: 'turix-cards',
        name: 'Turix Automation Cards',
        url: 'http://localhost:3003/cards',
        allowedOrigins: ['http://localhost:3003'],
        authenticationMode: 'proxy' as const,
        sessionTimeout: 3600000, // 1 hour
        tokenRefreshThreshold: 300000, // 5 minutes
      }],
    ]);
  }

  /**
   * Create a new iframe session for an embedded application
   */
  async createSession(
    appId: string,
    userId: string,
    parentToken: string,
    origin: string
  ): Promise<IframeSession> {
    const app = this.appRegistry.get(appId);
    if (!app) {
      throw new Error(`Unknown application: ${appId}`);
    }

    if (!app.allowedOrigins.includes(origin)) {
      throw new Error(`Origin ${origin} not allowed for app ${appId}`);
    }

    // Verify parent token
    const parentPayload = await this.verifyParentToken(parentToken);

    // Generate session-specific token
    const sessionId = this.generateSessionId();
    const sessionToken = await this.generateSessionToken(appId, userId, sessionId);

    const session: IframeSession = {
      sessionId,
      appId,
      userId,
      token: sessionToken,
      refreshToken: this.generateRefreshToken(),
      expiresAt: new Date(Date.now() + app.sessionTimeout),
      permissions: parentPayload.permissions || [],
      origin,
      createdAt: new Date(),
    };

    this.sessions.set(sessionId, session);

    // Set up automatic cleanup
    this.scheduleSessionCleanup(sessionId, app.sessionTimeout);

    return session;
  }

  /**
   * Get session by ID
   */
  getSession(sessionId: string): IframeSession | undefined {
    return this.sessions.get(sessionId);
  }

  /**
   * Refresh session token
   */
  async refreshSession(sessionId: string): Promise<IframeSession | null> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return null;
    }

    const app = this.appRegistry.get(session.appId);
    if (!app) {
      return null;
    }

    // Generate new token
    const newToken = await this.generateSessionToken(session.appId, session.userId, sessionId);

    session.token = newToken;
    session.expiresAt = new Date(Date.now() + app.sessionTimeout);

    return session;
  }

  /**
   * Validate session token and return claims
   */
  async validateSessionToken(token: string, appId: string): Promise<any> {
    try {
      const payload = jwt.verify(token, this.jwtSecret) as any;

      if (payload.appId !== appId) {
        throw new Error('Token app mismatch');
      }

      const session = this.getSession(payload.sessionId);
      if (!session || session.appId !== appId) {
        throw new Error('Invalid session');
      }

      // Check if token needs refresh
      const timeToExpiry = session.expiresAt.getTime() - Date.now();
      if (timeToExpiry < this.appRegistry.get(appId)!.tokenRefreshThreshold) {
        // Auto-refresh token
        await this.refreshSession(payload.sessionId);
      }

      return payload;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Token validation failed: ${errorMessage}`);
    }
  }

  /**
   * Destroy session
   */
  destroySession(sessionId: string): void {
    this.sessions.delete(sessionId);
  }

  /**
   * Get authentication headers for proxy requests
   */
  getAuthHeaders(sessionId: string): Record<string, string> {
    const session = this.getSession(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    return {
      'Authorization': `Bearer ${session.token}`,
      'X-Session-ID': sessionId,
      'X-App-ID': session.appId,
    };
  }

  /**
   * Handle authentication message from iframe
   */
  async handleAuthMessage(
    message: any,
    origin: string
  ): Promise<any> {
    const { type, appId, sessionId } = message;

    switch (type) {
      case 'auth:request':
        return await this.createSession(appId, message.userId, message.parentToken, origin);

      case 'auth:refresh':
        return await this.refreshSession(sessionId);

      case 'auth:validate':
        return await this.validateSessionToken(message.token, appId);

      case 'sso:login':
        return await this.handleSSOLogin(appId, message.sessionId, origin);

      case 'sso:request-token':
        return await this.requestCrossAppToken(message.sourceSessionId, appId, message.permissions);

      case 'sso:status':
        return this.getMultiAppAuthStatus(message.sessionId);

      case 'login:initiate':
        return await this.initiateLoginFlow(appId, origin, message.redirectUrl);

      default:
        throw new Error(`Unknown auth message type: ${type}`);
    }
  }

  private async verifyParentToken(token: string): Promise<any> {
    try {
      return jwt.verify(token, this.jwtSecret);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Parent token verification failed: ${errorMessage}`);
    }
  }

  private generateSessionId(): string {
    return crypto.randomUUID();
  }

  private generateRefreshToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  private async generateSessionToken(appId: string, userId: string, sessionId: string): Promise<string> {
    const payload = {
      appId,
      userId,
      sessionId,
      type: 'iframe-session',
      iat: Math.floor(Date.now() / 1000),
    };

    return jwt.sign(payload, this.jwtSecret, { expiresIn: '1h' });
  }

  private scheduleSessionCleanup(sessionId: string, timeout: number): void {
    setTimeout(() => {
      this.destroySession(sessionId);
    }, timeout);
  }

  /**
   * Clean up expired sessions
   */
  cleanupExpiredSessions(): void {
    const now = Date.now();
    for (const [sessionId, session] of this.sessions.entries()) {
      if (session.expiresAt.getTime() < now) {
        this.destroySession(sessionId);
      }
    }
  }

  /**
   * Create SSO context for cross-app authentication
   */
  async createSSOContext(sessionId: string, appIds: string[]): Promise<SSOContext> {
    const ssoContext = await this.authManager.createSSOContext(sessionId, appIds);
    this.ssoContexts.set(sessionId, ssoContext);
    return ssoContext;
  }

  /**
   * Get SSO context for session
   */
  async getSSOContext(sessionId: string): Promise<SSOContext | null> {
    const localContext = this.ssoContexts.get(sessionId);
    if (localContext) {
      return localContext;
    }
    return await this.authManager.getSSOContext(sessionId);
  }

  /**
   * Validate SSO token for embedded app
   */
  async validateSSOToken(sessionId: string, appId: string, token: string): Promise<any> {
    return this.authManager.validateSSOToken(sessionId, appId, token);
  }

  /**
   * Handle SSO login flow for embedded applications
   */
  async handleSSOLogin(
    appId: string,
    sessionId: string,
    origin: string
  ): Promise<IframeSession> {
    const app = this.appRegistry.get(appId);
    if (!app) {
      throw new Error(`Unknown application: ${appId}`);
    }

    if (!app.allowedOrigins.includes(origin)) {
      throw new Error(`Origin ${origin} not allowed for app ${appId}`);
    }

    // Get SSO context
    const ssoContext = await this.getSSOContext(sessionId);
    if (!ssoContext) {
      throw new Error('No SSO context found for session');
    }

    // Find the app in SSO context
    const ssoApp = ssoContext.apps.find((a: SSOApp) => a.appId === appId);
    if (!ssoApp) {
      throw new Error(`App ${appId} not authorized in SSO context`);
    }

    // Create iframe session with SSO token
    const iframeSession: IframeSession = {
      sessionId: crypto.randomUUID(),
      appId,
      userId: ssoContext.userId,
      token: ssoApp.token,
      refreshToken: crypto.randomBytes(32).toString('hex'),
      expiresAt: ssoApp.expiresAt,
      permissions: ssoApp.permissions,
      origin,
      createdAt: new Date(),
    };

    this.sessions.set(iframeSession.sessionId, iframeSession);

    // Set up automatic cleanup
    this.scheduleSessionCleanup(iframeSession.sessionId, app.sessionTimeout);

    return iframeSession;
  }

  /**
   * Handle login flow initiation from embedded app
   */
  async initiateLoginFlow(appId: string, origin: string, redirectUrl?: string): Promise<{ loginUrl: string; state: string }> {
    const app = this.appRegistry.get(appId);
    if (!app) {
      throw new Error(`Unknown application: ${appId}`);
    }

    if (!app.allowedOrigins.includes(origin)) {
      throw new Error(`Origin ${origin} not allowed for app ${appId}`);
    }

    // Generate state for CSRF protection
    const state = crypto.randomBytes(32).toString('hex');

    // Create login URL with state and redirect
    const loginUrl = `/auth/login?appId=${appId}&state=${state}${redirectUrl ? `&redirect=${encodeURIComponent(redirectUrl)}` : ''}`;

    // Store state temporarily (in production, use Redis)
    // For now, we'll validate state in the login completion

    return { loginUrl, state };
  }

  /**
   * Complete login flow and create SSO context
   */
  async completeLoginFlow(
    appId: string,
    userId: string,
    state: string,
    requestedApps?: string[]
  ): Promise<SSOContext> {
    const app = this.appRegistry.get(appId);
    if (!app) {
      throw new Error(`Unknown application: ${appId}`);
    }

    // Create session for user
    const session = await this.authManager.createUserSession(userId);

    // Create SSO context for requested apps (or all apps if not specified)
    const appIds = requestedApps || Array.from(this.appRegistry.keys());
    const ssoContext = await this.createSSOContext(session.id, appIds);

    return ssoContext;
  }

  /**
   * Handle cross-app token sharing request
   */
  async requestCrossAppToken(
    sourceSessionId: string,
    targetAppId: string,
    permissions?: string[]
  ): Promise<string> {
    const ssoContext = await this.getSSOContext(sourceSessionId);
    if (!ssoContext) {
      throw new Error('No SSO context found');
    }

    // Check if target app is already in SSO context
    let targetApp = ssoContext.apps.find((a: SSOApp) => a.appId === targetAppId);

    if (!targetApp) {
      // Generate new token for target app
      const user = this.authManager.getUser(ssoContext.userId);
      if (!user) {
        throw new Error('User not found');
      }

      const token = await this.generateAppToken(user.id, targetAppId);
      targetApp = {
        appId: targetAppId,
        token,
        permissions: permissions || user.permissions,
        grantedAt: new Date(),
        expiresAt: new Date(Date.now() + 60 * 60 * 1000) // 1 hour
      };

      ssoContext.apps.push(targetApp);
      this.ssoContexts.set(sourceSessionId, ssoContext);
    }

    return targetApp.token;
  }

  /**
   * Get authentication status for multiple apps
   */
  async getMultiAppAuthStatus(sessionId: string): Promise<Record<string, { authenticated: boolean; expiresAt?: Date }>> {
    const ssoContext = await this.getSSOContext(sessionId);
    const status: Record<string, { authenticated: boolean; expiresAt?: Date }> = {};

    for (const [appId, app] of this.appRegistry.entries()) {
      if (app.authenticationMode === 'none') {
        status[appId] = { authenticated: true };
        continue;
      }

      if (ssoContext) {
        const ssoApp = ssoContext.apps.find((a: SSOApp) => a.appId === appId);
        status[appId] = {
          authenticated: !!ssoApp && ssoApp.expiresAt > new Date(),
          expiresAt: ssoApp?.expiresAt
        };
      } else {
        status[appId] = { authenticated: false };
      }
    }

    return status;
  }

  /**
   * Get the app registry
   */
  getAppRegistry(): Map<string, EmbeddedApp> {
    return this.appRegistry;
  }

  private async generateAppToken(userId: string, appId: string): Promise<string> {
    const user = this.authManager.getUser(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const payload = {
      sub: user.id,
      appId,
      permissions: user.permissions,
      type: 'sso-app-token',
      iat: Math.floor(Date.now() / 1000),
    };

    return jwt.sign(payload, this.jwtSecret, { expiresIn: '1h' });
  }
}