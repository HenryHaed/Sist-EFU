import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { Request, Response } from 'express';
import { AuditoriaService } from './auditoria.service';

const EXCLUDED_PATHS = [
  '/api/v1/auth/login',
  '/api/v1/auth/forgot-password',
  '/api/v1/auth/verify-reset-code',
  '/api/v1/auth/reset-password',
];

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private readonly auditoriaService: AuditoriaService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const ctx = context.switchToHttp();
    const req = ctx.getRequest<Request>();
    const res = ctx.getResponse<Response>();
    const metodo = req.method.toUpperCase();

    if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(metodo)) {
      return next.handle();
    }

    const path = req.path || '';
    if (EXCLUDED_PATHS.some((p) => path.startsWith(p))) {
      return next.handle();
    }

    const bodySnapshot = req.body ? JSON.parse(JSON.stringify(req.body)) : undefined;

    return next.handle().pipe(
      tap({
        next: () => {
          const status = res.statusCode;
          if (status >= 200 && status < 300) {
            this.auditoriaService
              .registrarAccion(req, status, bodySnapshot)
              .catch(() => undefined);
          }
        },
      }),
    );
  }
}
