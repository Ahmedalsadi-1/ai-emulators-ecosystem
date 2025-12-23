import * as jwt from 'jsonwebtoken';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { AuthContext, TokenType, User, LoginCredentials, AuthTokens, Session, JWTPayload, SSOContext } from '../types';
import { RedisSessionStore } from './RedisSessionStore';

export class AuthenticationManager {
  private jwtSecret: string;
  private refreshTokenSecret: string;
  private sessionStore: RedisSessionStore;
  private users: Map<string, User> = new Map();

  constructor(
    jwtSecret: string = process.env.JWT_SECRET || 'default-jwt-secret',
    sessionStore?: RedisSessionStore
  ) {
    this.jwtSecret = jwtSecret;
    this.refreshTokenSecret = jwtSecret + '_refresh'; // Use different secret for refresh tokens

    // Use provided session store or create default in-memory store
    this.sessionStore = sessionStore || new RedisSessionStore({
      host: 'localhost',
      port: 6379,
      ttl: 86400
    });

    this.initializeDefaultUsers();
  }

  /**
   * Authenticate a user with credentials
   */
  async authenticateUser(credentials: LoginCredentials): Promise<AuthTokens> {
    const user = await this.findUserByUsername(credentials.username);
    if (!user || !user.isActive) {
      throw new Error('Invalid credentials');
    }

    const isValidPassword = await bcrypt.compare(credentials.password, user.passwordHash);
    if (!isValidPassword) {
      throw new Error('Invalid credentials');
    }

    // Update last login
    user.lastLoginAt = new Date();
    this.users.set(user.id, user);

    // Create session
    const session = await this.createSession(user.id);

    // Generate tokens
    const tokens = await this.generateTokens(user, session);

    return tokens;
  }

  /**
   * Validate JWT token and return auth context
   */
  async validateToken(token: string): Promise<AuthContext> {
    try {
      const payload = jwt.verify(token, this.jwtSecret) as JWTPayload;

      // Check if session is still active
      const session = await this.sessionStore.getSession(payload.sid);
      if (!session || !session.isActive || session.expiresAt < new Date()) {
        throw new Error('Session expired or invalid');
      }

      // Update session activity
      await this.sessionStore.updateSessionActivity(payload.sid);

      return {
        userId: payload.sub,
        sessionId: payload.sid,
        permissions: payload.permissions,
        tokenType: 'user',
        expiresAt: new Date(payload.exp * 1000),
        metadata: {
          token: token
        }
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Token validation failed: ${errorMessage}`);
    }
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshToken(refreshToken: string): Promise<AuthTokens> {
    try {
      const payload = jwt.verify(refreshToken, this.refreshTokenSecret) as any;

      const user = this.users.get(payload.sub);
      const session = await this.sessionStore.getSession(payload.sid);

      if (!user || !session || !session.isActive) {
        throw new Error('Invalid refresh token');
      }

      // Generate new tokens
      const tokens = await this.generateTokens(user, session);

      return tokens;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Token refresh failed: ${errorMessage}`);
    }
  }

  /**
   * Logout user and invalidate session
   */
  async logout(sessionId: string): Promise<void> {
    await this.sessionStore.deleteSession(sessionId);
  }

  /**
   * Create session for user (used by proxy)
   */
  async createUserSession(userId: string): Promise<Session> {
    return this.createSession(userId);
  }

  /**
   * Create SSO context for cross-app authentication
   */
  async createSSOContext(sessionId: string, appIds: string[]): Promise<SSOContext> {
    const session = await this.sessionStore.getSession(sessionId);
    if (!session || !session.isActive) {
      throw new Error('Invalid session');
    }

    const user = this.users.get(session.userId);
    if (!user) {
      throw new Error('User not found');
    }

    const ssoContext: SSOContext = {
      sessionId,
      userId: user.id,
      apps: [],
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
    };

    // Generate tokens for each requested app
    for (const appId of appIds) {
      const appToken = await this.generateAppToken(user, appId);
      ssoContext.apps.push({
        appId,
        token: appToken,
        permissions: user.permissions,
        grantedAt: new Date(),
        expiresAt: new Date(Date.now() + 60 * 60 * 1000) // 1 hour
      });
    }

    await this.sessionStore.storeSSOContext(ssoContext);
    return ssoContext;
  }

  /**
   * Get SSO context for session
   */
  async getSSOContext(sessionId: string): Promise<SSOContext | null> {
    return await this.sessionStore.getSSOContext(sessionId);
  }



  /**
   * Validate SSO token for specific app
   */
  async validateSSOToken(sessionId: string, appId: string, token: string): Promise<AuthContext> {
    const ssoContext = await this.sessionStore.getSSOContext(sessionId);
    if (!ssoContext || ssoContext.expiresAt < new Date()) {
      throw new Error('SSO context expired or invalid');
    }

    const app = ssoContext.apps.find((a: any) => a.appId === appId);
    if (!app || app.token !== token || app.expiresAt < new Date()) {
      throw new Error('Invalid SSO token for app');
    }

    const user = this.users.get(ssoContext.userId);
    if (!user) {
      throw new Error('User not found');
    }

    return {
      userId: user.id,
      sessionId,
      permissions: app.permissions,
      tokenType: 'user',
      expiresAt: app.expiresAt,
      metadata: {
        sso: true,
        appId
      }
    };
  }

  /**
   * Get user by ID
   */
  getUser(userId: string): User | undefined {
    return this.users.get(userId);
  }

  /**
   * Get session by ID
   */
  async getSession(sessionId: string): Promise<Session | null> {
    return await this.sessionStore.getSession(sessionId);
  }

  /**
   * Clean up expired sessions and SSO contexts
   */
  async cleanup(): Promise<void> {
    await this.sessionStore.cleanup();
  }

  // Legacy method for backward compatibility
  async authenticate(token: string): Promise<AuthContext> {
    return this.validateToken(token);
  }

  private async findUserByUsername(username: string): Promise<User | undefined> {
    for (const user of this.users.values()) {
      if (user.username === username || user.email === username) {
        return user;
      }
    }
    return undefined;
  }

  private async createSession(userId: string): Promise<Session> {
    const session: Session = {
      id: crypto.randomUUID(),
      userId,
      isActive: true,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      lastActivity: new Date()
    };

    await this.sessionStore.storeSession(session);
    return session;
  }

  private async generateTokens(user: User, session: Session): Promise<AuthTokens> {
    const accessToken = jwt.sign({
      sub: user.id,
      sid: session.id,
      permissions: user.permissions,
      roles: user.roles
    }, this.jwtSecret, {
      expiresIn: '1h'
    });

    const refreshToken = jwt.sign({
      sub: user.id,
      sid: session.id
    }, this.refreshTokenSecret, {
      expiresIn: '7d'
    });

    return {
      accessToken,
      refreshToken,
      tokenType: 'Bearer',
      expiresIn: 3600, // 1 hour
      expiresAt: new Date(Date.now() + 3600 * 1000)
    };
  }

  private async generateAppToken(user: User, appId: string): Promise<string> {
    return jwt.sign({
      sub: user.id,
      appId,
      permissions: user.permissions,
      type: 'sso-app-token'
    }, this.jwtSecret, {
      expiresIn: '1h'
    });
  }

  private async initializeDefaultUsers(): Promise<void> {
    // Create default admin user for development
    const adminPassword = await bcrypt.hash('admin123', 10);
    const adminUser: User = {
      id: 'admin-user-id',
      username: 'admin',
      email: 'admin@futureapp.com',
      passwordHash: adminPassword,
      roles: ['admin'],
      permissions: ['*'],
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      profile: {
        firstName: 'Admin',
        lastName: 'User',
        preferences: {}
      }
    };

    // Create default user
    const userPassword = await bcrypt.hash('user123', 10);
    const defaultUser: User = {
      id: 'default-user-id',
      username: 'user',
      email: 'user@futureapp.com',
      passwordHash: userPassword,
      roles: ['user'],
      permissions: ['read', 'write'],
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      profile: {
        firstName: 'Default',
        lastName: 'User',
        preferences: {}
      }
    };

    this.users.set(adminUser.id, adminUser);
    this.users.set(defaultUser.id, defaultUser);
  }
}