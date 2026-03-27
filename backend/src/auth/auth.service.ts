import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { Usuario } from '../entities/Usuario';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Usuario)
    private readonly usuarioRepo: Repository<Usuario>,
    private readonly jwtService: JwtService,
  ) {}

  async login(loginDto: LoginDto) {
    const { ci, password } = loginDto;

    // 1. Buscar el usuario por CI, cargando la relacion con el rol
    const usuario = await this.usuarioRepo.findOne({
      where: { ci },
      relations: ['rol'],
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
    };

    // 4. Firmar y devolver el token junto con los datos basicos del usuario
    return {
      access_token: this.jwtService.sign(payload),
      usuario: {
        id: usuario.idUsuario,
        ci: usuario.ci,
        nombres: usuario.nombres,
        primerApellido: usuario.primerApellido,
        segundoApellido: usuario.segundoApellido,
        rol: usuario.rol.nombre,
      },
    };
  }

  // Metodo util para verificar un token desde otros modulos si fuera necesario
  verifyToken(token: string) {
    return this.jwtService.verify(token);
  }
}
