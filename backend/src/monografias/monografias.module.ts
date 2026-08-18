import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MonografiasService } from './monografias.service';
import { MonografiasController } from './monografias.controller';
import { Monografia } from '../entities/Monografia';
import { Fraternidad } from '../entities/Fraternidad';
import { Usuario } from '../entities/Usuario';
import { Gestion } from '../entities/Gestion';
import { CronogramaActividad } from '../entities/CronogramaActividad';

@Module({
  imports: [TypeOrmModule.forFeature([Monografia, Fraternidad, Usuario, Gestion, CronogramaActividad])],
  controllers: [MonografiasController],
  providers: [MonografiasService],
  exports: [MonografiasService],
})
export class MonografiasModule {}
