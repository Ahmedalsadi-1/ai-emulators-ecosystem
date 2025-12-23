import { Session, SSOContext, User } from '../types';

export interface RedisConfig {
  host: string;
  port: number;
  password?: string;
  db?: number;
  keyPrefix?: string;
  ttl?: number; // Default TTL in seconds
}

// Note: This is a simplified in-memory session store for development.
// For production, replace with actual Redis implementation.
export class RedisSessionStore {
  private config: Required<RedisConfig>;
  private sessions: Map<string, Session> = new Map();
  private ssoContexts: Map<string, SSOContext> = new Map();
  private users: Map<string, User> = new Map();
  private expiryTimers: Map<string, NodeJS.Timeout> = new Map();

  constructor(config: RedisConfig) {
    this.config = {
      host: config.host,
      port: config.port,
      password: config.password || '',
      db: config.db || 0,
      keyPrefix: config.keyPrefix || 'auth:',
      ttl: config.ttl || 86400 // 24 hours default
    };

    console.log('Initialized in-memory session store (Redis placeholder)');

    // Start cleanup interval
    setInterval(() => this.cleanup(), 60000); // Clean up every minute
  }

  /**
   * Store a session
   */
  async storeSession(session: Session): Promise<void> {
    this.sessions.set(session.id, session);

    // Set expiry timer
    const ttl = Math.floor((session.expiresAt.getTime() - Date.now()) / 1000);
    const timer = setTimeout(() => {
      this.sessions.delete(session.id);
      this.expiryTimers.delete(session.id);
    }, ttl * 1000);

    this.expiryTimers.set(session.id, timer);
  }

  /**
   * Retrieve a session
   */
  async getSession(sessionId: string): Promise<Session | null> {
    return this.sessions.get(sessionId) || null;
  }

  /**
   * Update session activity timestamp
   */
  async updateSessionActivity(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.lastActivity = new Date();
      this.sessions.set(sessionId, session);
    }
  }

  /**
   * Delete a session
   */
  async deleteSession(sessionId: string): Promise<void> {
    this.sessions.delete(sessionId);
    const timer = this.expiryTimers.get(sessionId);
    if (timer) {
      clearTimeout(timer);
      this.expiryTimers.delete(sessionId);
    }
  }

  /**
   * Check if session exists and is active
   */
  async isSessionActive(sessionId: string): Promise<boolean> {
    const session = this.sessions.get(sessionId);
    return session ? session.isActive && session.expiresAt > new Date() : false;
  }

  /**
   * Store SSO context
   */
  async storeSSOContext(ssoContext: SSOContext): Promise<void> {
    this.ssoContexts.set(ssoContext.sessionId, ssoContext);

    // Set expiry timer
    const ttl = Math.floor((ssoContext.expiresAt.getTime() - Date.now()) / 1000);
    const timer = setTimeout(() => {
      this.ssoContexts.delete(ssoContext.sessionId);
      this.expiryTimers.delete(`sso:${ssoContext.sessionId}`);
    }, ttl * 1000);

    this.expiryTimers.set(`sso:${ssoContext.sessionId}`, timer);
  }

  /**
   * Retrieve SSO context
   */
  async getSSOContext(sessionId: string): Promise<SSOContext | null> {
    return this.ssoContexts.get(sessionId) || null;
  }

  /**
   * Delete SSO context
   */
  async deleteSSOContext(sessionId: string): Promise<void> {
    this.ssoContexts.delete(sessionId);
    const timer = this.expiryTimers.get(`sso:${sessionId}`);
    if (timer) {
      clearTimeout(timer);
      this.expiryTimers.delete(`sso:${sessionId}`);
    }
  }

  /**
   * Store user data
   */
  async storeUser(user: User): Promise<void> {
    this.users.set(user.id, user);
  }

  /**
   * Retrieve user data
   */
  async getUser(userId: string): Promise<User | null> {
    return this.users.get(userId) || null;
  }

  /**
   * Delete user from cache
   */
  async deleteUser(userId: string): Promise<void> {
    this.users.delete(userId);
  }

  /**
   * Clean up expired sessions and contexts
   */
  public cleanup(): void {
    const now = new Date();

    // Clean up expired sessions
    for (const [sessionId, session] of this.sessions.entries()) {
      if (session.expiresAt < now || !session.isActive) {
        this.sessions.delete(sessionId);
        const timer = this.expiryTimers.get(sessionId);
        if (timer) {
          clearTimeout(timer);
          this.expiryTimers.delete(sessionId);
        }
      }
    }

    // Clean up expired SSO contexts
    for (const [sessionId, ssoContext] of this.ssoContexts.entries()) {
      if (ssoContext.expiresAt < now) {
        this.ssoContexts.delete(sessionId);
        const timer = this.expiryTimers.get(`sso:${sessionId}`);
        if (timer) {
          clearTimeout(timer);
          this.expiryTimers.delete(`sso:${sessionId}`);
        }
      }
    }
  }

  /**
   * Get session count (for monitoring)
   */
  async getSessionCount(): Promise<number> {
    return this.sessions.size;
  }

  /**
   * Get SSO context count (for monitoring)
   */
  async getSSOContextCount(): Promise<number> {
    return this.ssoContexts.size;
  }

  /**
   * Close store (no-op for in-memory)
   */
  async close(): Promise<void> {
    // Clear all timers
    for (const timer of this.expiryTimers.values()) {
      clearTimeout(timer);
    }
    this.expiryTimers.clear();
    this.sessions.clear();
    this.ssoContexts.clear();
    this.users.clear();
  }
}