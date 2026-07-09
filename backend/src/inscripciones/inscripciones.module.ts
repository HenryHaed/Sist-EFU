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
import { TipoDanza } from '../entities/TipoDanza';
import { Fraternidad } from '../entities/Fraternidad';
import { Usuario } from '../entities/Usuario';
import { Evaluacion } from '../entities/Evaluacion';
import { Incidencia } from '../entities/Incidencia';
import { Asistencia } from '../entities/Asistencia';
import { MailModule } from '../mail/mail.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      SolicitudInscripcion,
      Gestion,
      CronogramaInscripcion,
      Categoria,
      Facultad,
      Carrera,
      InstitucionExterna,
      TipoDanza,
      Fraternidad,
      Usuario,
      Evaluacion,
      Incidencia,
      Asistencia,
    ]),
    MailModule,
  ],
  controllers: [InscripcionesController],
  providers: [InscripcionesService],
})
export class InscripcionesModule {}
