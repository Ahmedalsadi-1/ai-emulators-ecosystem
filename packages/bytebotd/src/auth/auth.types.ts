export type AuthRole = 'admin' | 'operator' | 'viewer';

export interface AuthUserRecord {
  username: string;
  passwordHash: string;
  role: AuthRole;
  createdAt: string;
  lastLogin?: string;
}

export interface AuthUserPublic {
  username: string;
  role: AuthRole;
  createdAt: string;
  lastLogin?: string;
}

export interface AuthTokenPayload {
  sub: string;
  role: AuthRole;
  iat: number;
  exp: number;
  jti: string;
}

export interface AuthSession {
  jti: string;
  username: string;
  expiresAt: number;
}

export interface AuthConfig {
  enabled: boolean;
  secret: string;
  tokenTtlSeconds: number;
  usersFile?: string;
}
