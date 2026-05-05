import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InscripcionesController } from './inscripciones.controller';
import { InscripcionesService } from './inscripciones.service';
import { SolicitudInscripcion } from '../entities/SolicitudInscripcion';
import { Gestion } from '../entities/Gestion';
import { CronogramaInscripcion } from '../entities/CronogramaInscripcion';
import { Categoria } from '../entities/Categoria';
import { Facultad } from '../entities/Facultad';
import { Carrera } from '../entities/Carrera';
import { InstitucionExterna } from '../entities/InstitucionExterna';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      SolicitudInscripcion,
      Gestion,
      CronogramaInscripcion,
      Categoria,
      Facultad,
      Carrera,
      InstitucionExterna
    ]),
  ],
  controllers: [InscripcionesController],
  providers: [InscripcionesService],
})
export class InscripcionesModule {}
