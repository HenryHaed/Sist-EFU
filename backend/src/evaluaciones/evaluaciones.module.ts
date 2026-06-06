import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EvaluacionesService } from './evaluaciones.service';
import { EvaluacionesController } from './evaluaciones.controller';
import { ArchivosController } from './archivos.controller';
import { Evaluacion } from '../entities/Evaluacion';
import { Fase } from '../entities/Fase';
import { Jurado } from '../entities/Jurado';
import { Fraternidad } from '../entities/Fraternidad';
import { DocumentoFraternidad } from '../entities/DocumentoFraternidad';
import { Criterio } from '../entities/Criterio';
import { Gestion } from '../entities/Gestion';
import { Categoria } from '../entities/Categoria';

import { Participante } from '../entities/Participante';
import { DocumentoGestion } from '../entities/DocumentoGestion';
import { Incidencia } from '../entities/Incidencia';
import { Infraccion } from '../entities/Infraccion';
import { Usuario } from '../entities/Usuario';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Evaluacion, Jurado, Fase, Fraternidad, DocumentoFraternidad, Criterio, Gestion, Participante, DocumentoGestion,
      Incidencia, Infraccion, Usuario, Categoria
    ])
  ],
  controllers: [EvaluacionesController, ArchivosController],
  providers: [EvaluacionesService],
  exports: [EvaluacionesService],
})
export class EvaluacionesModule {}
