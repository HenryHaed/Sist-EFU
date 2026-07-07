import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { PasswordResetService } from './password-reset.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { Usuario } from '../entities/Usuario';
import { PasswordResetToken } from '../entities/PasswordResetToken';
import { MailModule } from '../mail/mail.module';
import { AuditoriaModule } from '../auditoria/auditoria.module';

@Module({
  imports: [
    PassportModule,
    MailModule,
    AuditoriaModule,
    TypeOrmModule.forFeature([Usuario, PasswordResetToken]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET', 'efu_secret_key'),
        signOptions: {
          expiresIn: configService.get<string>('JWT_EXPIRES_IN', '4h') as any,
        },
      }),
    }),
  ],
  providers: [AuthService, PasswordResetService, JwtStrategy],
  controllers: [AuthController],
  exports: [AuthService, JwtModule],
})
export class AuthModule {}
