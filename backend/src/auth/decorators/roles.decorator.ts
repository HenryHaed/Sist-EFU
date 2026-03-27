import { SetMetadata } from '@nestjs/common';

// Uso: @Roles('superusuario', 'admin')
export const Roles = (...roles: string[]) => SetMetadata('roles', roles);
