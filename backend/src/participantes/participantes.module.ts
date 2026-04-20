import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ParticipantesService } from './participantes.service';
import { ParticipantesController } from './participantes.controller';
import { Participante } from '../entities/Participante';
import { Fase } from '../entities/Fase';
import { Fraternidad } from '../entities/Fraternidad';

@Module({
  imports: [
    TypeOrmModule.forFeature([Participante, Fase, Fraternidad])
  ],
  controllers: [ParticipantesController],
  providers: [ParticipantesService],
  exports: [ParticipantesService]
})
export class ParticipantesModule {}
