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

  /**
   * Aviso cuando un administrador actualiza datos del perfil (sin cambio de correo).
   */
  async sendAccountUpdatedNotification(
    email: string,
    nombre: string,
    cambios: string[],
    opciones?: { passwordRestablecida?: boolean; ci?: string },
  ): Promise<void> {
    const from = this.configService.get<string>('SMTP_FROM', 'EFU <noreply@efu.test>');
    const frontendUrl = this.configService.get<string>('FRONTEND_URL', 'http://localhost:5173');
    const listaCambios = (cambios.length ? cambios : ['Datos de perfil'])
      .map((c) => `<li style="margin-bottom:4px;">${escapeHtml(c)}</li>`)
      .join('');

    const bloques: string[] = [
      emailParagraph(`Hola <strong>${escapeHtml(nombre)}</strong>,`),
      emailParagraph(
        'Un administrador actualizó datos de tu cuenta en el <strong>sistema de la Entrada Folklórica Universitaria</strong>.',
      ),
      emailHighlightBox(
        [emailLabel('Datos modificados'), `<ul style="margin:8px 0 0;padding-left:20px;font-size:14px;color:#1e293b;">${listaCambios}</ul>`].join(''),
      ),
    ];

    if (opciones?.passwordRestablecida && opciones.ci) {
      bloques.push(
        emailHighlightBox(
          [
            emailLabel('Acceso actualizado'),
            `<p style="margin: 0 0 8px; font-size: 15px; color: #1e293b;"><strong>Usuario (CI):</strong> ${escapeHtml(opciones.ci)}</p>`,
            `<p style="margin: 0; font-size: 15px; color: #1e293b;"><strong>Contraseña temporal:</strong> la indicada por el administrador (o tu CI si se restableció al valor inicial).</p>`,
          ].join(''),
        ),
      );
      bloques.push(
        emailParagraph(
          'Si no conoces la nueva contraseña, contacta a La Comisión o usa “Olvidé mi contraseña” en el portal.',
        ),
      );
    }

    bloques.push(emailButton(`${frontendUrl}/login`, 'Ir al portal de acceso'));
    bloques.push(emailMutedNote('Si no reconoces este cambio, contacta de inmediato al administrador del sistema.'));

    try {
      await this.mailerService.sendMail({
        to: email,
        from,
        subject: 'Actualización de tu cuenta — EFU UMSA',
        html: buildEmailLayout({
          title: 'Datos de cuenta actualizados',
          contentHtml: bloques.join(''),
          frontendUrl,
        }),
      });
    } catch (error) {
      this.logger.error(`Error al enviar correo de actualización a ${email}`, error?.stack || error);
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

  async sendConvocatoriaEventoDelegados(
    email: string,
    nombreDestinatario: string,
    evento: { nombre: string; fechaHora: Date; ubicacion: string; puntosPenalizacion?: number },
    remitente: string,
  ): Promise<void> {
    const from = this.configService.get<string>('SMTP_FROM', 'EFU <noreply@efu.test>');
    const frontendUrl = this.configService.get<string>('FRONTEND_URL', 'http://localhost:5173');
    const fecha = evento.fechaHora.toLocaleString('es-BO', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
    const penalizacion = Number(evento.puntosPenalizacion ?? 3);

    const detalleHtml = [
      emailLabel('Detalle del evento'),
      `<p style="margin: 0 0 6px; font-size: 15px; color: #1e293b;"><strong>Evento:</strong> ${escapeHtml(evento.nombre)}</p>`,
      `<p style="margin: 0 0 6px; font-size: 15px; color: #1e293b;"><strong>Fecha y hora:</strong> ${escapeHtml(fecha)}</p>`,
      `<p style="margin: 0; font-size: 15px; color: #1e293b;"><strong>Ubicación:</strong> ${escapeHtml(evento.ubicacion)}</p>`,
    ].join('');

    const contentHtml = [
      emailParagraph(`Hola <strong>${escapeHtml(nombreDestinatario)}</strong>,`),
      emailParagraph(
        'Se te <strong>cita oficialmente</strong> a un evento de la Entrada Folklórica Universitaria. Debe asistir <strong>al menos un delegado por fraternidad</strong> (titular o suplente registrado en el directorio).',
      ),
      emailHighlightBox(detalleHtml),
      emailParagraph(
        `La inasistencia de ambos delegados (titular y suplente) puede ser sancionada con <strong>−${penalizacion} puntos</strong> en la nota de disciplina (10% sobre 30 pts).`,
      ),
      emailButton(`${frontendUrl}/login`, 'Ingresar al sistema EFU'),
      emailMutedNote(`Convocatoria emitida por <strong>${escapeHtml(remitente)}</strong> desde el Directorio de Delegados.`),
    ].join('');

    try {
      await this.mailerService.sendMail({
        to: email,
        from,
        subject: `Citación oficial — ${evento.nombre} | EFU UMSA`,
        html: buildEmailLayout({
          title: 'Citación a delegados',
          contentHtml,
          frontendUrl,
        }),
      });
    } catch (error) {
      this.logger.error(`Error al enviar citación de evento a ${email}`, error?.stack || error);
      throw error;
    }
  }

  async sendResultadoSolicitudInscripcion(
    email: string,
    nombreDestinatario: string,
    solicitud: {
      nombreFraternidad: string;
      estado: 'OBSERVADO' | 'APROBADO' | 'RECHAZADO';
    },
    observaciones?: string,
    itemsObservados?: string[],
  ): Promise<void> {
    const from = this.configService.get<string>('SMTP_FROM', 'EFU <noreply@efu.test>');
    const frontendUrl = this.configService.get<string>('FRONTEND_URL', 'http://localhost:5173');
    const comision = 'La Comisión de la Entrada Folklórica Universitaria';

    const configs: Record<
      string,
      { subject: string; title: string; intro: string; cta?: string; ctaLabel?: string }
    > = {
      OBSERVADO: {
        subject: `Observaciones en tu solicitud — ${solicitud.nombreFraternidad} | EFU UMSA`,
        title: 'Solicitud observada',
        intro: `${comision} ha <strong>observado</strong> tu solicitud de preinscripción para la fraternidad <strong>${escapeHtml(solicitud.nombreFraternidad)}</strong>. Debes ingresar al sistema y corregir únicamente los datos señalados.`,
        cta: `${frontendUrl}/dashboard`,
        ctaLabel: 'Corregir mi solicitud',
      },
      APROBADO: {
        subject: `Solicitud aprobada — ${solicitud.nombreFraternidad} | EFU UMSA`,
        title: 'Solicitud aprobada',
        intro: `${comision} ha <strong>aprobado</strong> tu solicitud de preinscripción para la fraternidad <strong>${escapeHtml(solicitud.nombreFraternidad)}</strong>. Tu fraternidad queda habilitada para continuar el proceso de inscripción oficial.`,
        cta: `${frontendUrl}/dashboard`,
        ctaLabel: 'Ingresar al sistema EFU',
      },
      RECHAZADO: {
        subject: `Solicitud anulada — ${solicitud.nombreFraternidad} | EFU UMSA`,
        title: 'Solicitud rechazada y anulada',
        intro: `${comision} ha <strong>rechazado y anulado</strong> tu solicitud de preinscripción para la fraternidad <strong>${escapeHtml(solicitud.nombreFraternidad)}</strong>. <strong>No tienes derecho a corregir ni reenviar</strong> esta inscripción en la gestión vigente.`,
      },
    };

    const cfg = configs[solicitud.estado];
    if (!cfg) return;

    const bloques: string[] = [
      emailParagraph(`Hola <strong>${escapeHtml(nombreDestinatario)}</strong>,`),
      emailParagraph(
        `Como <strong>delegado de fraternidad</strong> registrado en el sistema EFU, te informamos el estado actual de tu solicitud de preinscripción.`,
      ),
      emailParagraph(cfg.intro),
    ];

    if (solicitud.estado === 'OBSERVADO' && itemsObservados?.length) {
      const lista = itemsObservados
        .slice(0, 25)
        .map((item) => `<li style="margin-bottom:4px;">${escapeHtml(item)}</li>`)
        .join('');
      bloques.push(
        emailHighlightBox(
          [
            emailLabel('Datos a corregir'),
            `<ul style="margin:8px 0 0;padding-left:20px;font-size:14px;color:#1e293b;">${lista}</ul>`,
          ].join(''),
        ),
      );
    }

    if (observaciones?.trim()) {
      const etiqueta =
        solicitud.estado === 'RECHAZADO'
          ? 'Motivo del rechazo'
          : solicitud.estado === 'OBSERVADO'
            ? 'Observaciones de La Comisión'
            : 'Mensaje de La Comisión';
      bloques.push(
        emailHighlightBox(
          [
            emailLabel(etiqueta),
            `<p style="margin:0;font-size:14px;color:#1e293b;line-height:1.6;">${nl2br(observaciones.trim())}</p>`,
          ].join(''),
        ),
      );
    }

    if (cfg.cta && cfg.ctaLabel) {
      bloques.push(emailButton(cfg.cta, cfg.ctaLabel));
    }

    bloques.push(
      emailMutedNote(
        `Comunicado oficial emitido por <strong>${comision}</strong>. Ante dudas, contacta directamente a La Comisión.`,
      ),
    );

    try {
      await this.mailerService.sendMail({
        to: email,
        from,
        subject: cfg.subject,
        html: buildEmailLayout({
          title: cfg.title,
          contentHtml: bloques.join(''),
          frontendUrl,
        }),
      });
    } catch (error) {
      this.logger.error(
        `Error al enviar resultado de solicitud (${solicitud.estado}) a ${email}`,
        error?.stack || error,
      );
      throw error;
    }
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
