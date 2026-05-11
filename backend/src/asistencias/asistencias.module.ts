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

@Module({
  imports: [
    TypeOrmModule.forFeature([
      SolicitudInscripcion,
      Asistencia,
      Incidencia,
      Infraccion,
      Gestion,
      Fraternidad
    ]),
  ],
  controllers: [AsistenciasController],
  providers: [AsistenciasService],
  exports: [AsistenciasService],
})
export class AsistenciasModule {}
