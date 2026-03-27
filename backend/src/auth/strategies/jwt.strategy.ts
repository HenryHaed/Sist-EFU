import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET', 'efu_secret_key'),
    });
  }

  // El payload que guardamos al hacer login: { sub, ci, rol }
  // Este objeto queda disponible como req.user en los controladores protegidos
  async validate(payload: { sub: number; ci: string; rol: string }) {
    return {
      idUsuario: payload.sub,
      ci: payload.ci,
      rol: payload.rol,
    };
  }
}
