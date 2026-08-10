import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FichaTecnicaMonografia } from '../entities/FichaTecnicaMonografia';
import { Fraternidad } from '../entities/Fraternidad';
import { Usuario } from '../entities/Usuario';
import { Gestion } from '../entities/Gestion';
import { SolicitudInscripcion } from '../entities/SolicitudInscripcion';
import { FichaTecnicaService } from './ficha-tecnica.service';
import { FichaTecnicaController } from './ficha-tecnica.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      FichaTecnicaMonografia,
      Fraternidad,
      Usuario,
      Gestion,
      SolicitudInscripcion,
    ]),
  ],
  controllers: [FichaTecnicaController],
  providers: [FichaTecnicaService],
  exports: [FichaTecnicaService],
})
export class FichaTecnicaModule {}
