import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrganizacionService } from './organizacion.service';
import { OrganizacionController } from './organizacion.controller';
import { Facultad } from '../entities/Facultad';
import { Carrera } from '../entities/Carrera';
import { InstitucionExterna } from '../entities/InstitucionExterna';

@Module({
  imports: [
    TypeOrmModule.forFeature([Facultad, Carrera, InstitucionExterna])
  ],
  controllers: [OrganizacionController],
  providers: [OrganizacionService],
  exports: [OrganizacionService],
})
export class OrganizacionModule {}
