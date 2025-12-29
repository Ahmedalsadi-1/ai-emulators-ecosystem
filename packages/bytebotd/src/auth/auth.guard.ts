import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { AuthService } from './auth.service';
import { IS_PUBLIC_KEY } from './auth.constants';

@Injectable()
export class AuthGuard implements CanActivate {
  private readonly publicPrefixes = ['/health', '/vnc', '/novnc', '/websockify'];

  constructor(
    private readonly authService: AuthService,
    private readonly reflector: Reflector,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    if (!this.authService.isAuthEnabled()) {
      return true;
    }

    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const url = request.url || '';
    if (request.method === 'OPTIONS') {
      return true;
    }
    if (this.publicPrefixes.some((prefix) => url.startsWith(prefix))) {
      return true;
    }

    const token = extractToken(request);
    if (!token) {
      throw new UnauthorizedException('Missing authentication token.');
    }

    try {
      const payload = this.authService.verifyToken(token);
      (request as Request & { user?: typeof payload }).user = payload;
      return true;
    } catch (error) {
      throw new UnauthorizedException(
        error instanceof Error ? error.message : 'Invalid authentication token.',
      );
    }
  }
}

function extractToken(request: Request): string | null {
  const authHeader = request.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.slice('Bearer '.length).trim();
  }

  const tokenHeader = request.headers['x-bytebot-token'];
  if (typeof tokenHeader === 'string' && tokenHeader.trim()) {
    return tokenHeader.trim();
  }

  return null;
}
