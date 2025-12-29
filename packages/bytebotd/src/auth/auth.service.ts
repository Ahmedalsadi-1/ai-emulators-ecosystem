import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import {
  AuthConfig,
  AuthRole,
  AuthSession,
  AuthTokenPayload,
  AuthUserPublic,
  AuthUserRecord,
} from './auth.types';
import { generateTokenId, hashPassword, signJwt, verifyJwt, verifyPassword } from './auth.utils';

type UserInput = {
  username: string;
  password: string;
  role?: AuthRole;
};

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly config: AuthConfig;
  private users: AuthUserRecord[] = [];
  private revokedTokens = new Set<string>();
  private sessions = new Map<string, AuthSession>();

  constructor(private readonly configService: ConfigService) {
    this.config = this.loadConfig();
    this.loadUsers();
  }

  private loadConfig(): AuthConfig {
    const enabled = this.configService.get<string>('BYTEBOT_AUTH_ENABLED') === 'true';
    const secret = this.configService.get<string>('BYTEBOT_AUTH_SECRET') || '';
    const tokenTtlSeconds = Number(this.configService.get<string>('BYTEBOT_AUTH_TTL_SECONDS') || 3600);
    const usersFile = this.configService.get<string>('BYTEBOT_AUTH_USERS_FILE');

    return {
      enabled,
      secret,
      tokenTtlSeconds,
      usersFile,
    };
  }

  private loadUsers(): void {
    const usersFile = this.config.usersFile;
    if (usersFile && existsSync(usersFile)) {
      try {
        const data = readFileSync(usersFile, 'utf8');
        const parsed = JSON.parse(data) as AuthUserRecord[];
        this.users = Array.isArray(parsed) ? parsed : [];
        this.logger.log(`Loaded ${this.users.length} auth users from file.`);
        return;
      } catch (error) {
        this.logger.error(`Failed to read auth users file: ${error.message}`);
      }
    }

    const usersEnv = this.configService.get<string>('BYTEBOT_AUTH_USERS');
    if (usersEnv) {
      try {
        const parsed = JSON.parse(usersEnv) as AuthUserRecord[];
        this.users = Array.isArray(parsed) ? parsed : [];
        this.logger.log(`Loaded ${this.users.length} auth users from environment.`);
        return;
      } catch (error) {
        this.logger.error(`Failed to parse BYTEBOT_AUTH_USERS: ${error.message}`);
      }
    }

    const bootstrapUser = this.configService.get<string>('BYTEBOT_AUTH_USER');
    const bootstrapPassword = this.configService.get<string>('BYTEBOT_AUTH_PASSWORD');
    if (bootstrapUser && bootstrapPassword) {
      const role =
        (this.configService.get<string>('BYTEBOT_AUTH_ROLE') as AuthRole) || 'admin';
      const now = new Date().toISOString();
      this.users = [
        {
          username: bootstrapUser,
          passwordHash: hashPassword(bootstrapPassword),
          role,
          createdAt: now,
        },
      ];
      this.logger.warn(
        'Loaded bootstrap auth user from environment (in-memory only).',
      );
      return;
    }

    this.users = [];
    if (this.config.enabled) {
      this.logger.warn(
        'Authentication is enabled but no users are configured. Login will fail until a user is added.',
      );
    }
  }

  private persistUsers(): void {
    if (!this.config.usersFile) {
      return;
    }

    const targetPath = this.config.usersFile;
    const resolvedPath = targetPath.startsWith('/')
      ? targetPath
      : join(process.cwd(), targetPath);
    writeFileSync(resolvedPath, JSON.stringify(this.users, null, 2), 'utf8');
  }

  isAuthEnabled(): boolean {
    return this.config.enabled;
  }

  getTokenTtlSeconds(): number {
    return this.config.tokenTtlSeconds;
  }

  listUsers(): AuthUserPublic[] {
    return this.users.map(({ username, role, createdAt, lastLogin }) => ({
      username,
      role,
      createdAt,
      lastLogin,
    }));
  }

  createUser(input: UserInput): AuthUserPublic {
    const existing = this.users.find((user) => user.username === input.username);
    const now = new Date().toISOString();
    const record: AuthUserRecord = {
      username: input.username,
      passwordHash: hashPassword(input.password),
      role: input.role || 'operator',
      createdAt: existing?.createdAt || now,
      lastLogin: existing?.lastLogin,
    };

    if (existing) {
      this.users = this.users.map((user) =>
        user.username === input.username ? record : user,
      );
    } else {
      this.users = [...this.users, record];
    }

    this.persistUsers();
    return {
      username: record.username,
      role: record.role,
      createdAt: record.createdAt,
      lastLogin: record.lastLogin,
    };
  }

  deleteUser(username: string): void {
    this.users = this.users.filter((user) => user.username !== username);
    this.persistUsers();
  }

  validateUser(username: string, password: string): AuthUserRecord | null {
    const user = this.users.find((u) => u.username === username);
    if (!user) {
      return null;
    }
    if (!verifyPassword(password, user.passwordHash)) {
      return null;
    }
    return user;
  }

  issueToken(user: AuthUserRecord): { token: string; payload: AuthTokenPayload } {
    if (!this.config.secret) {
      throw new Error('BYTEBOT_AUTH_SECRET is required when auth is enabled.');
    }

    const now = Math.floor(Date.now() / 1000);
    const payload: AuthTokenPayload = {
      sub: user.username,
      role: user.role,
      iat: now,
      exp: now + this.config.tokenTtlSeconds,
      jti: generateTokenId(),
    };

    const token = signJwt(payload, this.config.secret);
    this.sessions.set(payload.jti, {
      jti: payload.jti,
      username: user.username,
      expiresAt: payload.exp,
    });
    return { token, payload };
  }

  verifyToken(token: string): AuthTokenPayload {
    if (!this.config.secret) {
      throw new Error('BYTEBOT_AUTH_SECRET is required when auth is enabled.');
    }
    const payload = verifyJwt(token, this.config.secret);
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp < now) {
      throw new Error('Token expired');
    }
    if (this.revokedTokens.has(payload.jti)) {
      throw new Error('Token revoked');
    }
    return payload;
  }

  revokeToken(token: string): void {
    const payload = this.verifyToken(token);
    this.revokedTokens.add(payload.jti);
    this.sessions.delete(payload.jti);
  }

  updateLastLogin(username: string): void {
    this.users = this.users.map((user) =>
      user.username === username
        ? { ...user, lastLogin: new Date().toISOString() }
        : user,
    );
    this.persistUsers();
  }
}
