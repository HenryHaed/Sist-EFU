import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FraternidadesService } from './fraternidades.service';
import { FraternidadesController } from './fraternidades.controller';
import { Fraternidad } from '../entities/Fraternidad';
import { Categoria } from '../entities/Categoria';
import { Gestion } from '../entities/Gestion';
import { Usuario } from '../entities/Usuario';
import { SolicitudInscripcion } from '../entities/SolicitudInscripcion';
import { FichaTecnicaMonografia } from '../entities/FichaTecnicaMonografia';
import { CategoriasController } from './categorias.controller';
import { CategoriasService } from './categorias.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Fraternidad,
      Categoria,
      Gestion,
      Usuario,
      SolicitudInscripcion,
      FichaTecnicaMonografia,
    ]),
  ],
  controllers: [FraternidadesController, CategoriasController],
  providers: [FraternidadesService, CategoriasService],
  exports: [FraternidadesService, CategoriasService],
})
export class FraternidadesModule {}
