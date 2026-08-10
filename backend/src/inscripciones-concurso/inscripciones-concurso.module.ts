import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InscripcionesConcursoService } from './inscripciones-concurso.service';
import { InscripcionesConcursoController } from './inscripciones-concurso.controller';
import { InscripcionConcurso } from '../entities/InscripcionConcurso';
import { InscripcionConcursoArchivo } from '../entities/InscripcionConcursoArchivo';
import { Usuario } from '../entities/Usuario';
import { Fase } from '../entities/Fase';
import { Gestion } from '../entities/Gestion';
import { Participante } from '../entities/Participante';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      InscripcionConcurso,
      InscripcionConcursoArchivo,
      Usuario,
      Fase,
      Gestion,
      Participante,
    ]),
  ],
  controllers: [InscripcionesConcursoController],
  providers: [InscripcionesConcursoService],
  exports: [InscripcionesConcursoService],
})
export class InscripcionesConcursoModule {}
