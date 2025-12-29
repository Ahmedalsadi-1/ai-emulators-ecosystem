import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { AuthService } from './auth.service';
import { ROLES_KEY } from './auth.constants';
import type { AuthRole, AuthTokenPayload } from './auth.types';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly authService: AuthService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    if (!this.authService.isAuthEnabled()) {
      return true;
    }

    const requiredRoles = this.reflector.getAllAndOverride<AuthRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request & { user?: AuthTokenPayload }>();
    const user = request.user;
    if (!user) {
      return false;
    }

    if (user.role === 'admin') {
      return true;
    }

    return requiredRoles.includes(user.role);
  }
}
