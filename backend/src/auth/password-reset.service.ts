import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan, IsNull } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { randomInt, randomUUID } from 'crypto';
import { Usuario } from '../entities/Usuario';
import { PasswordResetToken } from '../entities/PasswordResetToken';
import { MailService } from '../mail/mail.service';
import {
  validatePasswordPolicy,
  assertPasswordNotReused,
} from '../common/password-policy';

const OTP_EXPIRY_MINUTES = 15;
const MAX_ATTEMPTS = 5;
const MAX_REQUESTS_PER_HOUR = 3;
const RESET_TOKEN_EXPIRY = '10m';

const GENERIC_FORGOT_MESSAGE =
  'Si tu cuenta tiene un correo registrado, recibirás un código de verificación en los próximos minutos.';

@Injectable()
export class PasswordResetService {
  private readonly logger = new Logger(PasswordResetService.name);

  constructor(
    @InjectRepository(Usuario)
    private readonly usuarioRepo: Repository<Usuario>,
    @InjectRepository(PasswordResetToken)
    private readonly resetTokenRepo: Repository<PasswordResetToken>,
    private readonly mailService: MailService,
    private readonly jwtService: JwtService,
  ) {}

  async forgotPassword(ci: string) {
    const usuario = await this.usuarioRepo.findOne({ where: { ci: ci.trim() } });

    if (!usuario?.correo) {
      return { message: GENERIC_FORGOT_MESSAGE };
    }

    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentCount = await this.resetTokenRepo.count({
      where: {
        usuario: { idUsuario: usuario.idUsuario },
        createdAt: MoreThan(oneHourAgo),
      },
    });

    if (recentCount >= MAX_REQUESTS_PER_HOUR) {
      return { message: GENERIC_FORGOT_MESSAGE };
    }

    await this.resetTokenRepo.update(
      { usuario: { idUsuario: usuario.idUsuario }, usedAt: IsNull() },
      { usedAt: new Date() },
    );

    const code = String(randomInt(100000, 1000000));
    const codeHash = await bcrypt.hash(code, 10);
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

    const token = this.resetTokenRepo.create({
      usuario,
      codeHash,
      expiresAt,
      attempts: 0,
    });
    await this.resetTokenRepo.save(token);

    try {
      const nombre = `${usuario.nombres} ${usuario.primerApellido}`.trim();
      await this.mailService.sendPasswordResetCode(usuario.correo, nombre, code);
    } catch {
      this.logger.warn(`No se pudo enviar correo de recuperación para CI ${ci}`);
    }

    return { message: GENERIC_FORGOT_MESSAGE };
  }

  async verifyResetCode(ci: string, code: string) {
    const usuario = await this.usuarioRepo.findOne({ where: { ci: ci.trim() } });
    if (!usuario) {
      throw new BadRequestException('Código inválido o expirado.');
    }

    const token = await this.resetTokenRepo.findOne({
      where: {
        usuario: { idUsuario: usuario.idUsuario },
        usedAt: IsNull(),
      },
      order: { createdAt: 'DESC' },
      relations: ['usuario'],
    });

    if (!token || token.expiresAt < new Date()) {
      throw new BadRequestException('Código inválido o expirado.');
    }

    if (token.attempts >= MAX_ATTEMPTS) {
      token.usedAt = new Date();
      await this.resetTokenRepo.save(token);
      throw new BadRequestException('Código inválido o expirado.');
    }

    const codeValid = await bcrypt.compare(code.trim(), token.codeHash);
    if (!codeValid) {
      token.attempts += 1;
      if (token.attempts >= MAX_ATTEMPTS) {
        token.usedAt = new Date();
      }
      await this.resetTokenRepo.save(token);
      throw new BadRequestException('Código inválido o expirado.');
    }

    const sessionId = randomUUID();
    token.resetSessionId = sessionId;
    await this.resetTokenRepo.save(token);

    const resetToken = this.jwtService.sign(
      {
        sub: usuario.idUsuario,
        ci: usuario.ci,
        purpose: 'password_reset',
        sessionId,
        tokenId: token.idToken,
      },
      { expiresIn: RESET_TOKEN_EXPIRY },
    );

    return { resetToken };
  }

  async resetPassword(resetToken: string, newPassword: string) {
    let payload: {
      sub: number;
      ci: string;
      purpose: string;
      sessionId: string;
      tokenId: number;
    };

    try {
      payload = this.jwtService.verify(resetToken);
    } catch {
      throw new UnauthorizedException('El enlace de recuperación no es válido o ha expirado.');
    }

    if (payload.purpose !== 'password_reset' || !payload.sessionId || !payload.tokenId) {
      throw new UnauthorizedException('El enlace de recuperación no es válido o ha expirado.');
    }

    const token = await this.resetTokenRepo.findOne({
      where: {
        idToken: payload.tokenId,
        resetSessionId: payload.sessionId,
        usedAt: IsNull(),
      },
      relations: ['usuario'],
    });

    if (!token || token.expiresAt < new Date()) {
      throw new UnauthorizedException('El enlace de recuperación no es válido o ha expirado.');
    }

    const usuario = token.usuario;
    validatePasswordPolicy(newPassword, usuario.ci);
    await assertPasswordNotReused(newPassword, usuario.password);

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await this.usuarioRepo.update(usuario.idUsuario, {
      password: hashedPassword,
      primerLogin: false,
    });

    token.usedAt = new Date();
    await this.resetTokenRepo.save(token);

    await this.resetTokenRepo.update(
      { usuario: { idUsuario: usuario.idUsuario }, usedAt: IsNull() },
      { usedAt: new Date() },
    );

    return { message: 'Contraseña restablecida correctamente.' };
  }
}
