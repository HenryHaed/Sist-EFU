import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FraternidadesService } from './fraternidades.service';
import { FraternidadesController } from './fraternidades.controller';
import { Fraternidad } from '../entities/Fraternidad';

@Module({
  imports: [TypeOrmModule.forFeature([Fraternidad])],
  controllers: [FraternidadesController],
  providers: [FraternidadesService],
  exports: [FraternidadesService],
})
export class FraternidadesModule {}
