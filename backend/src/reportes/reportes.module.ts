import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReportesService } from './reportes.service';
import { ReportesController } from './reportes.controller';
import { Fraternidad } from '../entities/Fraternidad';
import { TipoDanza } from '../entities/TipoDanza';
import { Gestion } from '../entities/Gestion';
import { Facultad } from '../entities/Facultad';
import { Carrera } from '../entities/Carrera';
import { Categoria } from '../entities/Categoria';
import { SolicitudInscripcion } from '../entities/SolicitudInscripcion';
import { EvaluacionesModule } from '../evaluaciones/evaluaciones.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Fraternidad,
      TipoDanza,
      Gestion,
      Facultad,
      Carrera,
      Categoria,
      SolicitudInscripcion,
    ]),
    EvaluacionesModule,
  ],
  controllers: [ReportesController],
  providers: [ReportesService],
  exports: [ReportesService],
})
export class ReportesModule {}
