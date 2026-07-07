import { Injectable, Logger } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { ConfigService } from '@nestjs/config';
import {
  buildEmailLayout,
  emailButton,
  emailCodeDisplay,
  emailHighlightBox,
  emailLabel,
  emailMutedNote,
  emailParagraph,
  escapeHtml,
  nl2br,
} from './email-layout';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  constructor(
    private readonly mailerService: MailerService,
    private readonly configService: ConfigService,
  ) {}

  async sendPasswordResetCode(email: string, nombre: string, code: string): Promise<void> {
    const from = this.configService.get<string>('SMTP_FROM', 'EFU <noreply@efu.test>');
    const frontendUrl = this.configService.get<string>('FRONTEND_URL', 'http://localhost:5173');

    const contentHtml = [
      emailParagraph(`Hola <strong>${escapeHtml(nombre)}</strong>,`),
      emailParagraph(
        'Recibimos una solicitud para restablecer tu contraseña en el sistema de la Entrada Folklórica Universitaria.',
      ),
      emailCodeDisplay(code),
      emailParagraph('Este código expira en <strong>15 minutos</strong>. Si no solicitaste este cambio, ignora este correo.'),
      emailMutedNote('Por tu seguridad, no compartas este código con nadie.'),
    ].join('');

    try {
      await this.mailerService.sendMail({
        to: email,
        from,
        subject: 'Código de recuperación de contraseña - EFU UMSA',
        html: buildEmailLayout({
          title: 'Recuperación de contraseña',
          contentHtml,
          frontendUrl,
        }),
      });
    } catch (error) {
      this.logger.error(`Error al enviar correo de recuperación a ${email}`, error?.stack || error);
      throw error;
    }
  }

  async sendAccountCreatedNotification(
    email: string,
    nombre: string,
    ci: string,
    rolNombre: string,
  ): Promise<void> {
    const from = this.configService.get<string>('SMTP_FROM', 'EFU <noreply@efu.test>');
    const frontendUrl = this.configService.get<string>('FRONTEND_URL', 'http://localhost:5173');
    const rolEtiqueta = this.formatRolLabel(rolNombre);

    const credencialesHtml = [
      emailLabel('Datos de inicio de sesión'),
      `<p style="margin: 0 0 8px; font-size: 15px; color: #1e293b;"><strong>Usuario (CI):</strong> ${escapeHtml(ci)}</p>`,
      `<p style="margin: 0; font-size: 15px; color: #1e293b;"><strong>Contraseña inicial:</strong> ${escapeHtml(ci)}</p>`,
    ].join('');

    const contentHtml = [
      emailParagraph(`Hola <strong>${escapeHtml(nombre)}</strong>,`),
      emailParagraph(
        `Te informamos que se ha creado tu cuenta en el <strong>sistema de gestión de la Entrada Folklórica Universitaria</strong> con el rol de <strong>${escapeHtml(rolEtiqueta)}</strong>.`,
      ),
      emailHighlightBox(credencialesHtml),
      emailParagraph(
        'Ingresa al portal con tu <strong>Carnet de Identidad (CI)</strong> como usuario y contraseña. En tu <strong>primer inicio de sesión</strong>, el sistema te pedirá cambiar la contraseña por una personal y segura.',
      ),
      emailButton(`${frontendUrl}/login`, 'Ir al portal de acceso'),
      emailMutedNote('Si no esperabas este correo, contacta al administrador del sistema.'),
    ].join('');

    try {
      await this.mailerService.sendMail({
        to: email,
        from,
        subject: 'Tu cuenta en el sistema de la Entrada Folklórica Universitaria',
        html: buildEmailLayout({
          title: 'Bienvenido al sistema EFU',
          contentHtml,
          frontendUrl,
        }),
      });
    } catch (error) {
      this.logger.error(`Error al enviar correo de bienvenida a ${email}`, error?.stack || error);
      throw error;
    }
  }

  private formatRolLabel(rolNombre: string): string {
    const labels: Record<string, string> = {
      superusuario: 'Superusuario',
      admin: 'Administrador',
      controladorhcu: 'Controlador HCU',
      delegado: 'Delegado',
      jurado: 'Jurado',
    };
    return labels[rolNombre] || rolNombre;
  }

  async sendComunicado(
    email: string,
    asunto: string,
    mensaje: string,
    remitente: string,
    nombreDestinatario?: string,
  ): Promise<void> {
    const from = this.configService.get<string>('SMTP_FROM', 'EFU <noreply@efu.test>');
    const frontendUrl = this.configService.get<string>('FRONTEND_URL', 'http://localhost:5173');
    const saludo = nombreDestinatario
      ? `Hola <strong>${escapeHtml(nombreDestinatario)}</strong>,`
      : 'Estimado usuario,';

    const contentHtml = [
      emailParagraph(saludo),
      emailHighlightBox(nl2br(mensaje)),
      emailMutedNote(`Mensaje enviado por <strong>${escapeHtml(remitente)}</strong> desde el sistema de gestión EFU.`),
    ].join('');

    try {
      await this.mailerService.sendMail({
        to: email,
        from,
        subject: asunto,
        html: buildEmailLayout({
          title: asunto,
          contentHtml,
          frontendUrl,
        }),
      });
    } catch (error) {
      this.logger.error(`Error al enviar comunicado a ${email}`, error?.stack || error);
      throw error;
    }
  }
}
