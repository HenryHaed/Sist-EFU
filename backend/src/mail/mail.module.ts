import { Module } from '@nestjs/common';
import { MailerModule } from '@nestjs-modules/mailer';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MailService } from './mail.service';
import { MailMessagesService } from './mail-messages.service';
import { MailController } from './mail.controller';
import { Usuario } from '../entities/Usuario';

@Module({
  imports: [
    TypeOrmModule.forFeature([Usuario]),
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        transport: {
          host: configService.get<string>('SMTP_HOST', 'localhost'),
          port: configService.get<number>('SMTP_PORT', 587),
          secure: configService.get<string>('SMTP_SECURE', 'false') === 'true',
          auth: {
            user: configService.get<string>('SMTP_USER', ''),
            pass: configService.get<string>('SMTP_PASS', ''),
          },
        },
        defaults: {
          from: configService.get<string>('SMTP_FROM', 'EFU <noreply@efu.test>'),
        },
      }),
    }),
  ],
  controllers: [MailController],
  providers: [MailService, MailMessagesService],
  exports: [MailService, MailMessagesService],
})
export class MailModule {}
