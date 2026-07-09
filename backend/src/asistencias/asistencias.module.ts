import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AsistenciasController } from './asistencias.controller';
import { AsistenciasService } from './asistencias.service';
import { SolicitudInscripcion } from '../entities/SolicitudInscripcion';
import { Asistencia } from '../entities/Asistencia';
import { Incidencia } from '../entities/Incidencia';
import { Infraccion } from '../entities/Infraccion';
import { Gestion } from '../entities/Gestion';
import { Fraternidad } from '../entities/Fraternidad';
import { EventoControl } from '../entities/EventoControl';
import { Usuario } from '../entities/Usuario';
import { MailModule } from '../mail/mail.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      SolicitudInscripcion,
      Asistencia,
      Incidencia,
      Infraccion,
      Gestion,
      Fraternidad,
      EventoControl,
      Usuario,
    ]),
    MailModule,
  ],
  controllers: [AsistenciasController],
  providers: [AsistenciasService],
  exports: [AsistenciasService],
})
export class AsistenciasModule {}
