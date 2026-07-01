import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import { Usuario } from '../../entities/Usuario';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    @InjectRepository(Usuario)
    private readonly usuarioRepo: Repository<Usuario>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET', 'efu_secret_key'),
    });
  }

  // El payload que guardamos al hacer login: { sub, ci, rol }
  // Este objeto queda disponible como req.user en los controladores protegidos
  async validate(payload: { sub: number; ci: string; rol: string; primerLogin: boolean }) {
    const usuario = await this.usuarioRepo.findOne({
      where: { idUsuario: payload.sub },
      relations: ['rol', 'fraternidad', 'fraternidad.categoria', 'fraternidad.facultad', 'fraternidad.carrera', 'fraternidad.institucionExterna'],
    });

    if (!usuario) {
      return {
        idUsuario: payload.sub,
        ci: payload.ci,
        rol: payload.rol,
        primerLogin: payload.primerLogin,
      };
    }

    return {
      idUsuario: usuario.idUsuario,
      ci: usuario.ci,
      rol: usuario.rol?.nombre || payload.rol,
      primerLogin: usuario.primerLogin,
      fraternidad: usuario.fraternidad ? {
        idFraternidad: usuario.fraternidad.idFraternidad,
        nombre: usuario.fraternidad.nombre,
        origenFraternidad: usuario.fraternidad.origenFraternidad,
        nivelRepresentacion: usuario.fraternidad.nivelRepresentacion,
        categoria: usuario.fraternidad.categoria ? { idCategoria: usuario.fraternidad.categoria.idCategoria, nombre: usuario.fraternidad.categoria.nombre } : null,
        facultad: usuario.fraternidad.facultad ? { idFacultad: usuario.fraternidad.facultad.idFacultad, nombre: usuario.fraternidad.facultad.nombre } : null,
        carrera: usuario.fraternidad.carrera ? { idCarrera: usuario.fraternidad.carrera.idCarrera, nombre: usuario.fraternidad.carrera.nombre } : null,
        institucionExterna: usuario.fraternidad.institucionExterna ? { idInstitucion: usuario.fraternidad.institucionExterna.idInstitucion, nombre: usuario.fraternidad.institucionExterna.nombre } : null,
      } : null,
    };
  }
}
