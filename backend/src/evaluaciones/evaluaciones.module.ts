import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EvaluacionesService } from './evaluaciones.service';
import { EvaluacionesController } from './evaluaciones.controller';
import { Evaluacion } from '../entities/Evaluacion';
import { Fase } from '../entities/Fase';
import { Jurado } from '../entities/Jurado';
import { Fraternidad } from '../entities/Fraternidad';
import { DocumentoFraternidad } from '../entities/DocumentoFraternidad';
import { Criterio } from '../entities/Criterio';
import { Gestion } from '../entities/Gestion';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Evaluacion, Jurado, Fase, Fraternidad, DocumentoFraternidad, Criterio, Gestion
    ])
  ],
  controllers: [EvaluacionesController],
  providers: [EvaluacionesService],
  exports: [EvaluacionesService],
})
export class EvaluacionesModule {}
