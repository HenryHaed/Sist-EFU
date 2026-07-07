import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SesionUsuario } from '../entities/SesionUsuario';
import { AuditoriaAccion } from '../entities/AuditoriaAccion';
import { Gestion } from '../entities/Gestion';
import { Usuario } from '../entities/Usuario';
import { AuditoriaService } from './auditoria.service';
import { AuditoriaController } from './auditoria.controller';
import { AuditInterceptor } from './audit.interceptor';

@Module({
  imports: [TypeOrmModule.forFeature([SesionUsuario, AuditoriaAccion, Gestion, Usuario])],
  controllers: [AuditoriaController],
  providers: [
    AuditoriaService,
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditInterceptor,
    },
  ],
  exports: [AuditoriaService],
})
export class AuditoriaModule {}
