import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { WsException } from '@nestjs/websockets';
import { AuthService } from './auth.service';
import { ROLES_KEY } from './auth.constants';
import type { AuthRole } from './auth.types';

type SocketWithAuth = {
  handshake: {
    auth?: { token?: string };
    headers?: Record<string, string | string[] | undefined>;
    query?: Record<string, string | string[] | undefined>;
  };
  data?: { user?: any };
};

@Injectable()
export class WsAuthGuard implements CanActivate {
  constructor(
    private readonly authService: AuthService,
    private readonly reflector: Reflector,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    if (!this.authService.isAuthEnabled()) {
      return true;
    }

    const client = context.switchToWs().getClient<SocketWithAuth>();
    const token = extractSocketToken(client);
    if (!token) {
      throw new WsException('Missing authentication token.');
    }

    let payload: any;
    try {
      payload = this.authService.verifyToken(token);
    } catch (error) {
      throw new WsException(
        error instanceof Error ? error.message : 'Invalid authentication token.',
      );
    }

    const requiredRoles = this.reflector.getAllAndOverride<AuthRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (requiredRoles && requiredRoles.length > 0) {
      if (payload.role !== 'admin' && !requiredRoles.includes(payload.role)) {
        throw new WsException('Insufficient permissions.');
      }
    }

    client.data = { ...client.data, user: payload };
    return true;
  }
}

function extractSocketToken(client: SocketWithAuth): string | null {
  const authToken = client.handshake.auth?.token;
  if (authToken) return authToken;

  const queryToken = client.handshake.query?.token;
  if (typeof queryToken === 'string' && queryToken.trim()) {
    return queryToken.trim();
  }

  const headerToken = client.handshake.headers?.authorization;
  if (typeof headerToken === 'string' && headerToken.startsWith('Bearer ')) {
    return headerToken.slice('Bearer '.length).trim();
  }

  return null;
}
