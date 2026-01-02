import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { AuthService } from '../services/auth.service';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(
    private reflector: Reflector,
    private authService: AuthService,
  ) {
    super();
  }

  canActivate(context: ExecutionContext) {
    // Check if route is public
    const isPublic = this.reflector.getAllAndOverride<boolean>('isPublic', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    // Check if user has required roles
    const requiredRoles = this.reflector.getAllAndOverride<string[]>('roles', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (requiredRoles) {
      const request = context.switchToHttp().getRequest();
      const user = request.user;

      if (!user || !this.hasRequiredRoles(user.roles, requiredRoles)) {
        throw new UnauthorizedException('Insufficient permissions');
      }
    }

    // Check if user has required permissions
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>('permissions', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (requiredPermissions) {
      const request = context.switchToHttp().getRequest();
      const user = request.user;

      if (!user || !this.hasRequiredPermissions(user.permissions, requiredPermissions)) {
        throw new UnauthorizedException('Insufficient permissions');
      }
    }

    return super.canActivate(context);
  }

  private hasRequiredRoles(userRoles: string[], requiredRoles: string[]): boolean {
    return requiredRoles.some(role => userRoles.includes(role));
  }

  private hasRequiredPermissions(userPermissions: string[], requiredPermissions: string[]): boolean {
    return requiredPermissions.every(permission =>
      userPermissions.includes(permission) || userPermissions.includes('*')
    );
  }
}