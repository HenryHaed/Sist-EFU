import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Lee los roles que el decorador @Roles() declaró en la ruta
    const requiredRoles = this.reflector.getAllAndOverride<string[]>('roles', [
      context.getHandler(),
      context.getClass(),
    ]);

    // Si la ruta no tiene @Roles(), es accesible para cualquier usuario autenticado
    if (!requiredRoles) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    const userRol = (user?.rol || '').toLowerCase();
    return requiredRoles.some((role) => role.toLowerCase() === userRol);
  }
}
