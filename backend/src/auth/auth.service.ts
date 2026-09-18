import { Injectable, UnauthorizedException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import * as QRCode from 'qrcode';
import { Request, Response } from 'express';
import { Usuario } from '../entities/Usuario';
import { PasswordResetToken } from '../entities/PasswordResetToken';
import { LoginDto } from './dto/login.dto';
import { AuditoriaService } from '../auditoria/auditoria.service';
import {
  validatePasswordPolicy,
  assertPasswordNotReused,
} from '../common/password-policy';
import { resolveLogoPath, PDF_UMSA_BLUE, PDF_UMSA_RED } from '../common/pdf-layout';
import {
  etiquetaRolCredencial,
  puedeGenerarCredencial,
} from './credencial-labels';
import * as fs from 'fs';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Usuario)
    private readonly usuarioRepo: Repository<Usuario>,
    @InjectRepository(PasswordResetToken)
    private readonly resetTokenRepo: Repository<PasswordResetToken>,
    private readonly jwtService: JwtService,
    private readonly auditoriaService: AuditoriaService,
    private readonly configService: ConfigService,
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
        esDecisor: !!usuario.esDecisor,
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

  /** Perfil fresco desde BD (incluye nombre actual de fraternidad). */
  async getPerfil(userId: number) {
    const usuario = await this.usuarioRepo.findOne({
      where: { idUsuario: userId },
      relations: [
        'rol',
        'fraternidad',
        'fraternidad.categoria',
        'fraternidad.facultad',
        'fraternidad.carrera',
        'fraternidad.institucionExterna',
      ],
    });
    if (!usuario) throw new NotFoundException('Usuario no encontrado');
    return {
      id: usuario.idUsuario,
      idUsuario: usuario.idUsuario,
      ci: usuario.ci,
      nombres: usuario.nombres,
      primerApellido: usuario.primerApellido,
      segundoApellido: usuario.segundoApellido,
      correo: usuario.correo,
      rol: usuario.rol?.nombre,
      primerLogin: usuario.primerLogin,
      esDecisor: !!usuario.esDecisor,
      fraternidad: usuario.fraternidad
        ? {
            idFraternidad: usuario.fraternidad.idFraternidad,
            nombre: usuario.fraternidad.nombre,
            nivelRepresentacion: usuario.fraternidad.nivelRepresentacion,
            categoria: usuario.fraternidad.categoria
              ? {
                  idCategoria: usuario.fraternidad.categoria.idCategoria,
                  nombre: usuario.fraternidad.categoria.nombre,
                }
              : null,
            facultad: usuario.fraternidad.facultad
              ? {
                  idFacultad: usuario.fraternidad.facultad.idFacultad,
                  nombre: usuario.fraternidad.facultad.nombre,
                }
              : null,
            carrera: usuario.fraternidad.carrera
              ? {
                  idCarrera: usuario.fraternidad.carrera.idCarrera,
                  nombre: usuario.fraternidad.carrera.nombre,
                }
              : null,
            institucionExterna: usuario.fraternidad.institucionExterna
              ? {
                  idInstitucion: usuario.fraternidad.institucionExterna.idInstitucion,
                  nombre: usuario.fraternidad.institucionExterna.nombre,
                }
              : null,
          }
        : null,
    };
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

    await this.resetTokenRepo.update(
      { usuario: { idUsuario: userId }, usedAt: IsNull() },
      { usedAt: new Date() },
    );

    return { message: 'Contraseña actualizada correctamente' };
  }

  async generarCredencialPdf(userId: number, res: Response) {
    const usuario = await this.usuarioRepo.findOne({
      where: { idUsuario: userId },
      relations: ['rol'],
    });
    if (!usuario) throw new NotFoundException('Usuario no encontrado');

    const rol = usuario.rol?.nombre || '';
    if (!puedeGenerarCredencial(rol)) {
      throw new ForbiddenException(
        'Tu rol no tiene habilitada la generación de credencial del sistema.',
      );
    }

    const etiqueta = etiquetaRolCredencial(rol);
    const nombreCompleto = [usuario.nombres, usuario.primerApellido, usuario.segundoApellido]
      .filter(Boolean)
      .join(' ')
      .trim();

    const token = this.jwtService.sign(
      {
        sub: usuario.idUsuario,
        ci: usuario.ci,
        rol,
        purpose: 'credencial',
      },
      { expiresIn: '365d' },
    );

    const frontendUrl = this.configService.get<string>(
      'FRONTEND_URL',
      'http://localhost:5173',
    );
    const validateUrl = `${frontendUrl.replace(/\/$/, '')}/validar-credencial?t=${encodeURIComponent(token)}`;
    const qrDataUrl = await QRCode.toDataURL(validateUrl, {
      errorCorrectionLevel: 'M',
      margin: 1,
      width: 256,
      color: { dark: '#0f172a', light: '#ffffff' },
    });
    const qrBase64 = qrDataUrl.replace(/^data:image\/png;base64,/, '');
    const qrBuffer = Buffer.from(qrBase64, 'base64');

    const CM = 28.3464567;
    const W = 10 * CM;
    const H = 6 * CM;
    const PDFDocument = require('pdfkit');
    const doc = new PDFDocument({
      size: [W, H],
      margin: 0,
      autoFirstPage: false,
      info: {
        Title: `Credencial EFU — ${nombreCompleto}`,
        Author: 'Entrada Folklórica Universitaria UMSA',
      },
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="credencial-efu-${usuario.ci}.pdf"`,
    );
    doc.pipe(res);

    const logoPath = resolveLogoPath();
    const hasLogo = fs.existsSync(logoPath);
    const emitido = new Date().toLocaleDateString('es-BO', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
    const codigoCorto = `EFU-${String(usuario.idUsuario).padStart(5, '0')}`;

    // ── ANVERSO ──────────────────────────────────────────────
    doc.addPage({ size: [W, H], margin: 0 });

    doc.rect(0, 0, W, H).fill('#ffffff');
    doc.rect(0, 0, W, 22).fill(PDF_UMSA_BLUE);
    doc.rect(0, H - 14, W, 14).fill(PDF_UMSA_BLUE);
    doc.rect(0, 22, 4, H - 36).fill(PDF_UMSA_RED);

    if (hasLogo) {
      try {
        doc.image(logoPath, 10, 3.5, { height: 15 });
      } catch {
        /* ignore */
      }
    }

    doc
      .fillColor('#ffffff')
      .font('Helvetica-Bold')
      .fontSize(7)
      .text('UMSA · ENTRADA FOLKLÓRICA UNIVERSITARIA', hasLogo ? 30 : 10, 5, {
        width: W - (hasLogo ? 40 : 20),
      });
    doc
      .font('Helvetica')
      .fontSize(5.5)
      .text('CREDENCIAL DEL SISTEMA', hasLogo ? 30 : 10, 13, {
        width: W - (hasLogo ? 40 : 20),
      });

    // Avatar circle
    const ax = 18;
    const ay = 42;
    const ar = 16;
    doc.circle(ax + ar, ay + ar, ar).fill('#e2e8f0');
    doc
      .fillColor(PDF_UMSA_BLUE)
      .font('Helvetica-Bold')
      .fontSize(14)
      .text(
        (usuario.nombres || '?').charAt(0).toUpperCase(),
        ax,
        ay + ar - 6,
        { width: ar * 2, align: 'center' },
      );

    const tx = 56;
    doc
      .fillColor('#0f172a')
      .font('Helvetica-Bold')
      .fontSize(9)
      .text(nombreCompleto || '—', tx, 36, { width: W - tx - 12 });

    doc
      .fillColor('#64748b')
      .font('Helvetica')
      .fontSize(6)
      .text('CÉDULA DE IDENTIDAD', tx, 52);
    doc
      .fillColor('#0f172a')
      .font('Helvetica-Bold')
      .fontSize(8)
      .text(usuario.ci || '—', tx, 60);

    doc
      .fillColor('#64748b')
      .font('Helvetica')
      .fontSize(6)
      .text('ROL EN EL SISTEMA', tx, 74);
    doc
      .fillColor(PDF_UMSA_BLUE)
      .font('Helvetica-Bold')
      .fontSize(9)
      .text(etiqueta.titulo, tx, 82);
    doc
      .fillColor(PDF_UMSA_RED)
      .font('Helvetica-Oblique')
      .fontSize(6.5)
      .text(etiqueta.subtitulo, tx, 93, { width: W - tx - 12 });

    if (usuario.correo) {
      doc
        .fillColor('#64748b')
        .font('Helvetica')
        .fontSize(5.5)
        .text(usuario.correo, tx, 106, { width: W - tx - 12 });
    }

    doc
      .fillColor('#ffffff')
      .font('Helvetica')
      .fontSize(5.5)
      .text(`Código ${codigoCorto}  ·  Emitida ${emitido}  ·  ANVERSO`, 10, H - 10, {
        width: W - 20,
      });

    // ── REVERSO ──────────────────────────────────────────────
    doc.addPage({ size: [W, H], margin: 0 });
    doc.rect(0, 0, W, H).fill('#ffffff');
    doc.rect(0, 0, W, 18).fill(PDF_UMSA_BLUE);
    doc.rect(0, H - 14, W, 14).fill(PDF_UMSA_BLUE);
    doc.rect(W - 4, 18, 4, H - 32).fill(PDF_UMSA_RED);

    doc
      .fillColor('#ffffff')
      .font('Helvetica-Bold')
      .fontSize(7)
      .text('VALIDACIÓN DE CREDENCIAL', 12, 6, { width: W - 24 });

    const qrSize = 78;
    const qrX = 16;
    const qrY = 28;
    doc.image(qrBuffer, qrX, qrY, { width: qrSize, height: qrSize });

    const rx = qrX + qrSize + 12;
    doc
      .fillColor('#0f172a')
      .font('Helvetica-Bold')
      .fontSize(8)
      .text('Escanea el código QR', rx, 32, { width: W - rx - 14 });
    doc
      .fillColor('#475569')
      .font('Helvetica')
      .fontSize(6)
      .text(
        'Para verificar la autenticidad de esta credencial ante el sistema oficial de la Entrada Folklórica Universitaria.',
        rx,
        44,
        { width: W - rx - 14, lineGap: 1.5 },
      );

    doc
      .fillColor('#64748b')
      .font('Helvetica')
      .fontSize(5.5)
      .text('TITULAR', rx, 72);
    doc
      .fillColor('#0f172a')
      .font('Helvetica-Bold')
      .fontSize(7)
      .text(nombreCompleto, rx, 80, { width: W - rx - 14 });

    doc
      .fillColor('#64748b')
      .font('Helvetica')
      .fontSize(5.5)
      .text('ROL', rx, 94);
    doc
      .fillColor(PDF_UMSA_BLUE)
      .font('Helvetica-Bold')
      .fontSize(7.5)
      .text(etiqueta.titulo, rx, 102);
    if (rol === 'superusuario') {
      doc
        .fillColor(PDF_UMSA_RED)
        .font('Helvetica-Oblique')
        .fontSize(6)
        .text('Desarrollador del Sistema', rx, 112);
    }

    doc
      .fillColor('#ffffff')
      .font('Helvetica')
      .fontSize(5.5)
      .text(`Código ${codigoCorto}  ·  Uso exclusivo del evento  ·  REVERSO`, 10, H - 10, {
        width: W - 20,
      });

    doc.end();
  }

  async validarCredencial(token: string) {
    if (!token?.trim()) {
      throw new UnauthorizedException('Token de credencial requerido');
    }
    let payload: any;
    try {
      payload = this.jwtService.verify(token);
    } catch {
      throw new UnauthorizedException('Credencial inválida o expirada');
    }
    if (payload?.purpose !== 'credencial') {
      throw new UnauthorizedException('Token no corresponde a una credencial');
    }

    const usuario = await this.usuarioRepo.findOne({
      where: { idUsuario: payload.sub },
      relations: ['rol'],
    });
    if (!usuario) {
      throw new NotFoundException('Usuario de la credencial no encontrado');
    }

    const rol = usuario.rol?.nombre || payload.rol;
    const etiqueta = etiquetaRolCredencial(rol);
    const nombreCompleto = [usuario.nombres, usuario.primerApellido, usuario.segundoApellido]
      .filter(Boolean)
      .join(' ')
      .trim();

    return {
      valido: true,
      codigo: `EFU-${String(usuario.idUsuario).padStart(5, '0')}`,
      ci: usuario.ci,
      nombreCompleto,
      rol,
      rolTitulo: etiqueta.titulo,
      rolSubtitulo: etiqueta.subtitulo,
      correo: usuario.correo || null,
    };
  }
}

