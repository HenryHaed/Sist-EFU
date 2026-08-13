import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not, IsNull } from 'typeorm';
import { Response } from 'express';
import { SolicitudInscripcion, EstadoSolicitud } from '../entities/SolicitudInscripcion';
import { Asistencia } from '../entities/Asistencia';
import { Incidencia } from '../entities/Incidencia';
import { Infraccion } from '../entities/Infraccion';
import { Gestion } from '../entities/Gestion';
import { Fraternidad } from '../entities/Fraternidad';
import { EventoControl } from '../entities/EventoControl';
import { Usuario } from '../entities/Usuario';
import { MailService } from '../mail/mail.service';
import { findGestionActivaOrLatest } from '../common/gestion.utils';
import { drawPdfInstitutionalHeader } from '../common/pdf-layout';
import { CrearEventoDto } from './dto/crear-evento.dto';

/** 10% de la nota máxima de disciplina (30 pts) */
const PENALIZACION_INASISTENCIA_DEFAULT = 3;

@Injectable()
export class AsistenciasService {
  private readonly logger = new Logger(AsistenciasService.name);

  constructor(
    @InjectRepository(SolicitudInscripcion)
    private readonly solicitudRepo: Repository<SolicitudInscripcion>,
    @InjectRepository(Asistencia)
    private readonly asistenciaRepo: Repository<Asistencia>,
    @InjectRepository(Incidencia)
    private readonly incidenciaRepo: Repository<Incidencia>,
    @InjectRepository(Infraccion)
    private readonly infraccionRepo: Repository<Infraccion>,
    @InjectRepository(Gestion)
    private readonly gestionRepo: Repository<Gestion>,
    @InjectRepository(Fraternidad)
    private readonly fraternidadRepo: Repository<Fraternidad>,
    @InjectRepository(EventoControl)
    private readonly eventoRepo: Repository<EventoControl>,
    @InjectRepository(Usuario)
    private readonly usuarioRepo: Repository<Usuario>,
    private readonly mailService: MailService,
  ) {}

  private async getGestionActiva() {
    return findGestionActivaOrLatest(this.gestionRepo);
  }

  async getEventos() {
    return this.eventoRepo.find({ order: { fechaHora: 'DESC' } });
  }

  /** Eventos públicos para el landing (próximos primero; incluye recientes). */
  async getEventosPublicos() {
    const desde = new Date();
    desde.setDate(desde.getDate() - 7);

    return this.eventoRepo
      .createQueryBuilder('e')
      .where('e.esPublico = :publico', { publico: true })
      .andWhere('e.fechaHora >= :desde', { desde })
      .orderBy('e.fechaHora', 'ASC')
      .take(20)
      .getMany();
  }

  /** Citaciones privadas próximas para el delegado autenticado. */
  async getMisCitasDelegado() {
    const ahora = new Date();
    return this.eventoRepo
      .createQueryBuilder('e')
      .where('e.esPublico = :publico', { publico: false })
      .andWhere('e.fechaHora >= :ahora', { ahora })
      .orderBy('e.fechaHora', 'ASC')
      .take(10)
      .getMany();
  }

  async crearEventoYCitarDelegados(dto: CrearEventoDto, remitenteNombre: string) {
    const nombre = dto.nombre?.trim();
    const ubicacion = dto.ubicacion?.trim();
    const descripcion = dto.descripcion?.trim() || null;
    const esPublico = dto.esPublico === true;

    if (!nombre) throw new BadRequestException('Indica el nombre del evento.');
    if (!ubicacion) throw new BadRequestException('Indica la ubicación del evento.');

    const fechaHora = new Date(dto.fechaHora);
    if (Number.isNaN(fechaHora.getTime())) {
      throw new BadRequestException('Fecha y hora no válidas.');
    }

    const evento = await this.eventoRepo.save(
      this.eventoRepo.create({
        nombre,
        ubicacion,
        descripcion,
        esPublico,
        fechaHora,
        puntosPenalizacion: PENALIZACION_INASISTENCIA_DEFAULT,
      }),
    );

    // Público: visible en landing, sin citación por correo
    if (esPublico) {
      return {
        evento,
        modo: 'publico',
        totalDestinatarios: 0,
        enviados: 0,
        fallidos: 0,
        correosFallidos: [],
      };
    }

    // Privado: citación por correo a delegados
    const delegados = await this.usuarioRepo
      .createQueryBuilder('u')
      .innerJoin('u.rol', 'rol')
      .leftJoinAndSelect('u.fraternidad', 'fraternidad')
      .where('rol.nombre = :rol', { rol: 'delegado' })
      .andWhere('u.correo IS NOT NULL')
      .andWhere("TRIM(u.correo) != ''")
      .getMany();

    const elegibles = delegados.filter(
      (d) => !d.fraternidad || d.fraternidad.habilitadoEfu !== false,
    );

    if (elegibles.length === 0) {
      throw new BadRequestException(
        'No hay delegados con correo registrado en el sistema para enviar la citación.',
      );
    }

    let enviados = 0;
    const fallidos: string[] = [];

    for (const delegado of elegibles) {
      const nombreCompleto = [delegado.nombres, delegado.primerApellido, delegado.segundoApellido]
        .filter(Boolean)
        .join(' ')
        .trim();
      try {
        await this.mailService.sendConvocatoriaEventoDelegados(
          delegado.correo.trim(),
          nombreCompleto || 'Delegado',
          evento,
          remitenteNombre,
        );
        enviados++;
      } catch (error) {
        this.logger.warn(`Fallo citación a ${delegado.correo}: ${error?.message}`);
        fallidos.push(delegado.correo);
      }
    }

    return {
      evento,
      modo: 'privado',
      totalDestinatarios: elegibles.length,
      enviados,
      fallidos: fallidos.length,
      correosFallidos: fallidos.slice(0, 10),
    };
  }

  async getDelegados() {
    const gestion = await this.getGestionActiva();

    const solicitudes = await this.solicitudRepo.find({
      where: {
        gestion: gestion ? { idGestion: gestion.idGestion } : undefined,
        estado: EstadoSolicitud.APROBADO,
        fraternidadCreada: Not(IsNull()),
      },
      relations: ['fraternidadCreada', 'categoria'],
      order: { createdAt: 'DESC' },
    });

    const fraternidadesMap = new Map<number, any>();

    solicitudes.forEach(sol => {
      const idFrat = sol.fraternidadCreada?.idFraternidad;
      if (!idFrat) return;

      if (!fraternidadesMap.has(idFrat)) {
        fraternidadesMap.set(idFrat, {
          idSolicitud: sol.idSolicitud,
          idFraternidad: idFrat,
          nombreFraternidad: sol.fraternidadCreada?.nombre || sol.nombreFraternidad,
          categoria: sol.categoria?.nombre,
          titular: null,
          suplente: null,
        });
      }

      const entry = fraternidadesMap.get(idFrat);

      const nombreTitular = [sol.delTitularNombres, sol.delTitularPrimerApellido, sol.delTitularSegundoApellido]
        .filter((part) => part?.trim())
        .join(' ')
        .trim();
      const nombreSuplente = [sol.delSuplenteNombres, sol.delSuplentePrimerApellido, sol.delSuplenteSegundoApellido]
        .filter((part) => part?.trim())
        .join(' ')
        .trim();

      if (nombreTitular) {
        entry.titular = {
          nombre: nombreTitular,
          ci: sol.delTitularCi,
          celular: sol.delTitularCelular,
        };
      }
      if (nombreSuplente) {
        entry.suplente = {
          nombre: nombreSuplente,
          ci: sol.delSuplenteCi,
          celular: sol.delSuplenteCelular,
        };
      }
    });

    return Array.from(fraternidadesMap.values()).filter(e => e.titular || e.suplente);
  }

  /**
   * PDF: directorio de fraternidades con delegado titular y suplente + celulares.
   */
  async generarReporteDirectorioDelegadosPdf(res: Response) {
    const gestion = await this.getGestionActiva();
    const listado = await this.getDelegados();
    listado.sort((a, b) =>
      String(a.nombreFraternidad || '').localeCompare(String(b.nombreFraternidad || ''), 'es'),
    );

    const PDFDocument = require('pdfkit');
    const doc = new PDFDocument({
      margin: 36,
      size: 'A4',
      layout: 'landscape',
      autoFirstPage: true,
    });

    const anio = (gestion as any)?.anio || new Date().getFullYear();
    const nombreArchivo = `Directorio_Delegados_EFU_${anio}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${nombreArchivo}"`);
    doc.pipe(res);

    const pageWidth = 841.89;
    const margin = 36;
    const contentWidth = pageWidth - margin * 2;

    const { contentStartY } = drawPdfInstitutionalHeader(
      doc,
      'DIRECTORIO DE DELEGADOS POR FRATERNIDAD',
      `Gestión ${anio} · Titular y suplente con celular de contacto`,
      { pageWidth, margin, compact: true },
    );

    let y = contentStartY + 4;
    doc
      .fontSize(8)
      .fillColor('#64748b')
      .font('Helvetica')
      .text(
        `Total fraternidades: ${listado.length}  ·  Generado: ${new Date().toLocaleString('es-BO')}`,
        margin,
        y,
        { width: contentWidth },
      );
    y += 16;

    const cols = [
      { key: 'n', label: 'N°', w: 28 },
      { key: 'frat', label: 'Fraternidad', w: 175 },
      { key: 'cat', label: 'Categoría', w: 70 },
      { key: 'titNombre', label: 'Delegado titular', w: 155 },
      { key: 'titCel', label: 'Celular titular', w: 78 },
      { key: 'supNombre', label: 'Delegado suplente', w: 155 },
      { key: 'supCel', label: 'Celular suplente', w: contentWidth - 28 - 175 - 70 - 155 - 78 - 155 },
    ];

    const rowH = 22;
    const headerH = 20;

    const drawHeader = (startY: number) => {
      doc.save();
      doc.rect(margin, startY, contentWidth, headerH).fill('#003399');
      let x = margin;
      doc.fontSize(7).fillColor('#ffffff').font('Helvetica-Bold');
      cols.forEach((c) => {
        doc.text(c.label, x + 3, startY + 6, { width: c.w - 6 });
        x += c.w;
      });
      doc.restore();
      return startY + headerH;
    };

    y = drawHeader(y);

    if (!listado.length) {
      doc
        .fontSize(10)
        .fillColor('#64748b')
        .font('Helvetica-Oblique')
        .text('No hay fraternidades con delegados registrados en la gestión activa.', margin, y + 20);
      doc.end();
      return;
    }

    listado.forEach((f, idx) => {
      if (y + rowH > 560) {
        doc.addPage({ size: 'A4', layout: 'landscape', margin: 36 });
        y = 40;
        doc
          .fontSize(9)
          .fillColor('#003399')
          .font('Helvetica-Bold')
          .text(`Directorio de Delegados — Gestión ${anio} (continuación)`, margin, y);
        y += 18;
        y = drawHeader(y);
      }

      const bg = idx % 2 === 0 ? '#f8fafc' : '#ffffff';
      doc.save();
      doc.rect(margin, y, contentWidth, rowH).fill(bg);
      doc.restore();

      const vals = [
        String(idx + 1),
        String(f.nombreFraternidad || '—'),
        String(f.categoria || '—'),
        String(f.titular?.nombre || '—'),
        String(f.titular?.celular || '—'),
        String(f.suplente?.nombre || '—'),
        String(f.suplente?.celular || '—'),
      ];

      let x = margin;
      vals.forEach((v, i) => {
        doc
          .fontSize(i === 1 || i === 3 || i === 5 ? 7.5 : 7)
          .fillColor('#0f172a')
          .font(i === 1 ? 'Helvetica-Bold' : 'Helvetica')
          .text(v, x + 3, y + 6, { width: cols[i].w - 6, ellipsis: true, lineBreak: false });
        x += cols[i].w;
      });

      doc
        .moveTo(margin, y + rowH)
        .lineTo(margin + contentWidth, y + rowH)
        .strokeColor('#e2e8f0')
        .lineWidth(0.5)
        .stroke();

      y += rowH;
    });

    doc.end();
  }

  async registrarAsistencia(data: {
    idFraternidad: number;
    idEvento: number;
    titularAsistio: boolean;
    suplenteAsistio: boolean;
    usuarioId: number;
    motivo?: string;
  }) {
    const gestion = await this.getGestionActiva();
    if (!gestion) throw new NotFoundException('No hay una gestión activa');

    const fraternidad = await this.fraternidadRepo.findOne({ where: { idFraternidad: data.idFraternidad } });
    if (!fraternidad) throw new NotFoundException('Fraternidad no encontrada');

    const evento = await this.eventoRepo.findOne({ where: { idEvento: data.idEvento } });
    if (!evento) throw new NotFoundException('Evento no encontrado');

    const algunoAsistio = data.titularAsistio || data.suplenteAsistio;

    const existente = await this.asistenciaRepo.findOne({
      where: {
        fraternidad: { idFraternidad: data.idFraternidad },
        eventoControl: { idEvento: data.idEvento },
        gestion: { idGestion: gestion.idGestion },
      },
    });

    const observaciones = `Titular: ${data.titularAsistio ? 'Presente' : 'Ausente'} | Suplente: ${data.suplenteAsistio ? 'Presente' : 'Ausente'}`;

    if (existente) {
      existente.asistio = algunoAsistio;
      existente.observaciones = observaciones;
      await this.asistenciaRepo.save(existente);
    } else {
      await this.asistenciaRepo.save(
        this.asistenciaRepo.create({
          gestion,
          fraternidad,
          usuario: { idUsuario: data.usuarioId } as any,
          eventoControl: evento,
          asistio: algunoAsistio,
          observaciones,
        }),
      );
    }

    if (!algunoAsistio) {
      const incidencia = await this.registrarInasistenciaFraternidad({
        idFraternidad: data.idFraternidad,
        idEvento: data.idEvento,
        usuarioId: data.usuarioId,
        motivo: data.motivo,
      });
      return { asistio: false, sancion: true, incidencia };
    }

    await this.removerInasistenciaFraternidad(data.idFraternidad, data.idEvento, gestion.idGestion);

    return { asistio: true, sancion: false };
  }

  private async registrarInasistenciaFraternidad(data: {
    idFraternidad: number;
    idEvento: number;
    usuarioId: number;
    motivo?: string;
  }) {
    const gestion = await this.getGestionActiva();
    if (!gestion) throw new NotFoundException('No hay una gestión activa');

    const yaExiste = await this.incidenciaRepo
      .createQueryBuilder('i')
      .innerJoin('i.infraccion', 'inf')
      .where('i.id_fraternidad = :idFrat', { idFrat: data.idFraternidad })
      .andWhere('i.id_gestion = :idGestion', { idGestion: gestion.idGestion })
      .andWhere('inf.nombre = :nombre', { nombre: 'INASISTENCIA DE DELEGADO' })
      .andWhere('i.observacion LIKE :pat', { pat: `%evento #${data.idEvento}%` })
      .getOne();

    if (yaExiste) return yaExiste;

    const evento = await this.eventoRepo.findOne({ where: { idEvento: data.idEvento } });
    const penalizacion = -Math.abs(
      Number(evento?.puntosPenalizacion ?? PENALIZACION_INASISTENCIA_DEFAULT),
    );

    let infraccion = await this.infraccionRepo.findOne({
      where: { nombre: 'INASISTENCIA DE DELEGADO', gestion: { idGestion: gestion.idGestion } },
    });

    if (!infraccion) {
      infraccion = await this.infraccionRepo.save({
        nombre: 'INASISTENCIA DE DELEGADO',
        tipoImpacto: 'DESCUENTO_DISCIPLINA',
        valorImpacto: penalizacion,
        gestion,
      });
    } else if (Number(infraccion.valorImpacto) !== penalizacion) {
      infraccion.valorImpacto = penalizacion;
      infraccion = await this.infraccionRepo.save(infraccion);
    }

    return this.incidenciaRepo.save(
      this.incidenciaRepo.create({
        gestion,
        fraternidad: { idFraternidad: data.idFraternidad } as any,
        usuario: { idUsuario: data.usuarioId } as any,
        infraccion,
        observacion: `Ningún delegado (titular ni suplente) asistió al evento #${data.idEvento}. ${data.motivo || ''}`.trim(),
      }),
    );
  }

  private async removerInasistenciaFraternidad(idFraternidad: number, idEvento: number, idGestion: number) {
    const incidencias = await this.incidenciaRepo.find({
      where: {
        gestion: { idGestion },
        fraternidad: { idFraternidad },
        infraccion: { nombre: 'INASISTENCIA DE DELEGADO' },
      },
      relations: ['infraccion'],
    });

    for (const inc of incidencias) {
      if (inc.observacion?.includes(`evento #${idEvento}`)) {
        await this.incidenciaRepo.remove(inc);
      }
    }
  }

  async registrarInasistencia(data: { idFraternidad: number, nombreDelegado: string, motivo?: string, usuarioId: number }) {
    return this.registrarInasistenciaFraternidad({
      idFraternidad: data.idFraternidad,
      idEvento: 0,
      usuarioId: data.usuarioId,
      motivo: data.motivo || `Inasistencia del delegado: ${data.nombreDelegado}`,
    });
  }
}
