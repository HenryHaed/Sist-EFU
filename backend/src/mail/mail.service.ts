import { Injectable, Logger } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { ConfigService } from '@nestjs/config';

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

    try {
      await this.mailerService.sendMail({
        to: email,
        from,
        subject: 'Código de recuperación de contraseña - EFU',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto;">
            <h2 style="color: #1e3a5f;">Recuperación de contraseña</h2>
            <p>Hola <strong>${nombre}</strong>,</p>
            <p>Recibimos una solicitud para restablecer tu contraseña en el sistema EFU.</p>
            <p style="font-size: 28px; letter-spacing: 6px; font-weight: bold; color: #1e3a5f; text-align: center; padding: 16px; background: #f0f4f8; border-radius: 8px;">
              ${code}
            </p>
            <p>Este código expira en <strong>15 minutos</strong>. Si no solicitaste este cambio, ignora este correo.</p>
            <p style="color: #666; font-size: 12px;">Portal: ${frontendUrl}</p>
          </div>
        `,
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

    try {
      await this.mailerService.sendMail({
        to: email,
        from,
        subject: 'Tu cuenta en el sistema de la Entrada Folklórica Universitaria',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; color: #1e293b;">
            <h2 style="color: #1e3a5f; margin-bottom: 8px;">Bienvenido al sistema EFU</h2>
            <p style="color: #64748b; font-size: 14px; margin-top: 0;">Entrada Folklórica Universitaria — UMSA</p>
            <p>Hola <strong>${nombre}</strong>,</p>
            <p>
              Te informamos que se ha creado tu cuenta en el
              <strong>sistema de gestión de la Entrada Folklórica Universitaria</strong>
              con el rol de <strong>${rolEtiqueta}</strong>.
            </p>
            <div style="background: #f0f4f8; border-radius: 12px; padding: 20px; margin: 24px 0; border: 1px solid #e2e8f0;">
              <p style="margin: 0 0 12px; font-size: 12px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.08em; color: #475569;">
                Datos de inicio de sesión
              </p>
              <p style="margin: 0 0 8px;"><strong>Usuario (CI):</strong> ${ci}</p>
              <p style="margin: 0;"><strong>Contraseña inicial:</strong> ${ci}</p>
            </div>
            <p>
              Ingresa al portal con tu <strong>Carnet de Identidad (CI)</strong> como usuario y contraseña.
              En tu <strong>primer inicio de sesión</strong>, el sistema te pedirá cambiar la contraseña por una personal y segura.
            </p>
            <p style="text-align: center; margin: 28px 0;">
              <a href="${frontendUrl}/login"
                style="display: inline-block; background: #003399; color: #ffffff; text-decoration: none; font-weight: bold; padding: 14px 28px; border-radius: 10px;">
                Ir al portal de acceso
              </a>
            </p>
            <p style="color: #64748b; font-size: 12px; margin-bottom: 0;">
              Si no esperabas este correo, contacta al administrador del sistema.
            </p>
          </div>
        `,
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
    const saludo = nombreDestinatario ? `Hola <strong>${nombreDestinatario}</strong>,` : 'Estimado usuario,';
    const mensajeHtml = mensaje
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\n/g, '<br/>');

    try {
      await this.mailerService.sendMail({
        to: email,
        from,
        subject: asunto,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1e293b;">
            <div style="background: #003399; color: #ffffff; padding: 20px 24px; border-radius: 12px 12px 0 0;">
              <h2 style="margin: 0; font-size: 18px;">Comunicado Oficial — EFU UMSA</h2>
              <p style="margin: 6px 0 0; font-size: 12px; opacity: 0.9;">Entrada Folklórica Universitaria</p>
            </div>
            <div style="padding: 24px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 12px 12px; background: #ffffff;">
              <p>${saludo}</p>
              <div style="background: #f8fafc; border-left: 4px solid #c8102e; padding: 16px 20px; margin: 20px 0; border-radius: 0 8px 8px 0; line-height: 1.6;">
                ${mensajeHtml}
              </div>
              <p style="color: #64748b; font-size: 12px; margin-bottom: 0;">
                Mensaje enviado por <strong>${remitente}</strong> desde el sistema de gestión EFU.
              </p>
            </div>
          </div>
        `,
      });
    } catch (error) {
      this.logger.error(`Error al enviar comunicado a ${email}`, error?.stack || error);
      throw error;
    }
  }
}
