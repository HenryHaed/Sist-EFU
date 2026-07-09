import { Injectable, UnauthorizedException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { Request } from 'express';
import { Usuario } from '../entities/Usuario';
import { LoginDto } from './dto/login.dto';
import { AuditoriaService } from '../auditoria/auditoria.service';
import {
  validatePasswordPolicy,
  assertPasswordNotReused,
} from '../common/password-policy';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Usuario)
    private readonly usuarioRepo: Repository<Usuario>,
    private readonly jwtService: JwtService,
    private readonly auditoriaService: AuditoriaService,
  ) {}

  async login(loginDto: LoginDto, req?: Request) {
    const { ci, password } = loginDto;

    // 1. Buscar el usuario por CI, cargando la relacion con el rol
    const usuario = await this.usuarioRepo.findOne({
      where: { ci },
      relations: ['rol', 'fraternidad', 'fraternidad.categoria', 'fraternidad.facultad', 'fraternidad.carrera', 'fraternidad.institucionExterna'],
    });

    if (!usuario) {
      throw new UnauthorizedException('Credenciales invalidas');
    }

    // 2. Comparar el password con el hash guardado en BD
    const passwordValido = await bcrypt.compare(password, usuario.password);
    if (!passwordValido) {
      throw new UnauthorizedException('Credenciales invalidas');
    }

    // 3. Construir el payload del JWT
    // sub = subject (convencion JWT para el ID del usuario)
    const payload = {
      sub: usuario.idUsuario,
      ci: usuario.ci,
      rol: usuario.rol.nombre,
      primerLogin: usuario.primerLogin,
    };

    // 4. Firmar y devolver el token junto con los datos basicos del usuario
    const ip = req?.ip || req?.headers['x-forwarded-for']?.toString().split(',')[0]?.trim() || null;
    const userAgent = req?.headers['user-agent'] || null;
    const sesion = await this.auditoriaService.crearSesion(usuario.idUsuario, ip || undefined, userAgent || undefined);

    return {
      access_token: this.jwtService.sign(payload),
      session_id: sesion.idSesion,
      usuario: {
        id: usuario.idUsuario,
        ci: usuario.ci,
        nombres: usuario.nombres,
        primerApellido: usuario.primerApellido,
        segundoApellido: usuario.segundoApellido,
        correo: usuario.correo,
        rol: usuario.rol.nombre,
        primerLogin: usuario.primerLogin,
        fraternidad: usuario.fraternidad ? {
          idFraternidad: usuario.fraternidad.idFraternidad,
          nombre: usuario.fraternidad.nombre,
          nivelRepresentacion: usuario.fraternidad.nivelRepresentacion,
          categoria: usuario.fraternidad.categoria ? { idCategoria: usuario.fraternidad.categoria.idCategoria, nombre: usuario.fraternidad.categoria.nombre } : null,
          facultad: usuario.fraternidad.facultad ? { idFacultad: usuario.fraternidad.facultad.idFacultad, nombre: usuario.fraternidad.facultad.nombre } : null,
          carrera: usuario.fraternidad.carrera ? { idCarrera: usuario.fraternidad.carrera.idCarrera, nombre: usuario.fraternidad.carrera.nombre } : null,
          institucionExterna: usuario.fraternidad.institucionExterna ? { idInstitucion: usuario.fraternidad.institucionExterna.idInstitucion, nombre: usuario.fraternidad.institucionExterna.nombre } : null,
        } : null,
      },
    };
  }

  // Metodo util para verificar un token desde otros modulos si fuera necesario
  verifyToken(token: string) {
    return this.jwtService.verify(token);
  }

  async changePassword(userId: number, newPassword: string) {
    const usuario = await this.usuarioRepo.findOne({ where: { idUsuario: userId } });
    if (!usuario) {
      throw new NotFoundException('Usuario no encontrado');
    }

    validatePasswordPolicy(newPassword, usuario.ci);
    await assertPasswordNotReused(newPassword, usuario.password);

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await this.usuarioRepo.update(userId, {
      password: hashedPassword,
      primerLogin: false,
    });
    return { message: 'Contraseña actualizada correctamente' };
  }
}
