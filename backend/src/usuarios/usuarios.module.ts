import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Usuario } from '../entities/Usuario';
import { Role } from '../entities/Role';
import { Jurado } from '../entities/Jurado';
import { Gestion } from '../entities/Gestion';
import { Fase } from '../entities/Fase';
import { Fraternidad } from '../entities/Fraternidad';
import { UsuariosService } from './usuarios.service';
import { UsuariosController } from './usuarios.controller';
import { MailModule } from '../mail/mail.module';

@Module({
  imports: [TypeOrmModule.forFeature([Usuario, Role, Jurado, Gestion, Fase, Fraternidad]), MailModule],
  controllers: [UsuariosController],
  providers: [UsuariosService],
  exports: [UsuariosService],
})
export class UsuariosModule {}

