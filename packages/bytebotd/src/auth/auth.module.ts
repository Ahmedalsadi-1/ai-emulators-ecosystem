import { Global, Module } from '@nestjs/common';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { AuthController } from './auth.controller';
import { AuthGuard } from './auth.guard';
import { AuthService } from './auth.service';
import { RolesGuard } from './roles.guard';
import { WsAuthGuard } from './ws-auth.guard';
import { AuditInterceptor } from './audit.interceptor';

@Global()
@Module({
  controllers: [AuthController],
  providers: [
    AuthService,
    WsAuthGuard,
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditInterceptor,
    },
  ],
  exports: [AuthService, WsAuthGuard],
})
export class AuthModule {}
