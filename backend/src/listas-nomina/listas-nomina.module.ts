import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ListasNominaService } from './listas-nomina.service';
import { ListasNominaController } from './listas-nomina.controller';
import { ListaNominaFraternidad } from '../entities/ListaNominaFraternidad';
import { MiembroNomina } from '../entities/MiembroNomina';
import { Fraternidad } from '../entities/Fraternidad';
import { Usuario } from '../entities/Usuario';
import { Gestion } from '../entities/Gestion';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ListaNominaFraternidad,
      MiembroNomina,
      Fraternidad,
      Usuario,
      Gestion,
    ]),
  ],
  controllers: [ListasNominaController],
  providers: [ListasNominaService],
  exports: [ListasNominaService],
})
export class ListasNominaModule {}
