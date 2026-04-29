import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FraternidadesService } from './fraternidades.service';
import { FraternidadesController } from './fraternidades.controller';
import { Fraternidad } from '../entities/Fraternidad';
import { Categoria } from '../entities/Categoria';
import { CategoriasController } from './categorias.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Fraternidad, Categoria])],
  controllers: [FraternidadesController, CategoriasController],
  providers: [FraternidadesService],
  exports: [FraternidadesService],
})
export class FraternidadesModule {}
