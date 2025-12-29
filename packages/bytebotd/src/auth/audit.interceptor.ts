import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuditInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    if (process.env.BYTEBOT_AUDIT_ENABLED !== 'true') {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest();
    const method = request?.method || 'UNKNOWN';
    const url = request?.url || 'UNKNOWN';
    const user = request?.user?.sub || 'anonymous';
    const start = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          const duration = Date.now() - start;
          this.logger.log(
            `${method} ${url} by ${user} completed in ${duration}ms`,
          );
        },
        error: (error) => {
          const duration = Date.now() - start;
          this.logger.error(
            `${method} ${url} by ${user} failed in ${duration}ms: ${error?.message || error}`,
          );
        },
      }),
    );
  }
}
