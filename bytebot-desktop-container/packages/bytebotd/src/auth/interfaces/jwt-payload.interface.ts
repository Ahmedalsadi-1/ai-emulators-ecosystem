export interface JwtPayload {
  sub: string; // user id
  sid: string; // session id
  roles?: string[];
  permissions?: string[];
  iat?: number;
  exp?: number;
}

export interface AuthUser {
  id: string;
  username: string;
  email: string;
  roles: string[];
  permissions: string[];
  sessionId: string;
}