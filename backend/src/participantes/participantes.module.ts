import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ParticipantesService } from './participantes.service';
import { ParticipantesController } from './participantes.controller';
import { Participante } from '../entities/Participante';
import { Fase } from '../entities/Fase';
import { Fraternidad } from '../entities/Fraternidad';
import { Facultad } from '../entities/Facultad';
import { Carrera } from '../entities/Carrera';

@Module({
  imports: [
    TypeOrmModule.forFeature([Participante, Fase, Fraternidad, Facultad, Carrera])
  ],
  controllers: [ParticipantesController],
  providers: [ParticipantesService],
  exports: [ParticipantesService]
})
export class ParticipantesModule {}
