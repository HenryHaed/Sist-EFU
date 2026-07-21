import {
  BadRequestException,
  Injectable,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { Response } from 'express';
import { Fraternidad } from '../entities/Fraternidad';
import { TipoDanza } from '../entities/TipoDanza';
import { Gestion } from '../entities/Gestion';
import { Facultad } from '../entities/Facultad';
import { Carrera } from '../entities/Carrera';
import { Categoria } from '../entities/Categoria';
import { SolicitudInscripcion, EstadoSolicitud } from '../entities/SolicitudInscripcion';
import { ensureTiposDanzaDefault } from '../common/tipos-danza-default';
import { buildMiembrosDirectiva } from '../common/personas-directiva';
import { ConsultarReporteDto, TipoReporte } from './dto/consultar-reporte.dto';
import { EvaluacionesService } from '../evaluaciones/evaluaciones.service';
import { drawPdfInstitutionalHeader } from '../common/pdf-layout';
import { InstanciaRepresentacion } from '../entities/SolicitudInscripcion';

@Injectable()
export class ReportesService implements OnModuleInit {
  constructor(
    @InjectRepository(Fraternidad)
    private readonly fraternidadRepo: Repository<Fraternidad>,
    @InjectRepository(TipoDanza)
    private readonly tipoDanzaRepo: Repository<TipoDanza>,
    @InjectRepository(Gestion)
    private readonly gestionRepo: Repository<Gestion>,
    @InjectRepository(Facultad)
    private readonly facultadRepo: Repository<Facultad>,
    @InjectRepository(Carrera)
    private readonly carreraRepo: Repository<Carrera>,
    @InjectRepository(Categoria)
    private readonly categoriaRepo: Repository<Categoria>,
    @InjectRepository(SolicitudInscripcion)
    private readonly solicitudRepo: Repository<SolicitudInscripcion>,
    private readonly evaluacionesService: EvaluacionesService,
  ) {}

  async onModuleInit() {
    await ensureTiposDanzaDefault(this.tipoDanzaRepo);
  }

  async getTiposDanza() {
    await ensureTiposDanzaDefault(this.tipoDanzaRepo);
    return this.tipoDanzaRepo.find({
      where: { activo: true },
      order: { nombre: 'ASC' },
    });
  }

  async getOpcionesFiltro(idGestion?: number) {
    const gestiones = await this.gestionRepo.find({
      order: { anio: 'DESC' },
      select: ['idGestion', 'anio', 'lema', 'activa'],
    });
    const facultades = await this.facultadRepo.find({ order: { nombre: 'ASC' } });
    const carreras = await this.carreraRepo.find({
      relations: ['facultad'],
      order: { nombre: 'ASC' },
    });
    let categorias: Categoria[] = [];
    if (idGestion) {
      categorias = await this.categoriaRepo.find({
        where: { gestion: { idGestion } },
        order: { nombre: 'ASC' },
      });
    }
    const tiposDanza = await this.getTiposDanza();
    return {
      gestiones,
      facultades,
      carreras,
      categorias,
      tiposDanza,
      instancias: Object.values(InstanciaRepresentacion),
    };
  }

  private readonly INSTANCIAS_CENTRALES = ['UMSA', 'FEDSIDUMSA', 'STUMSA'];

  private buildFraternidadQuery(dto: ConsultarReporteDto): SelectQueryBuilder<Fraternidad> {
    const qb = this.fraternidadRepo
      .createQueryBuilder('f')
      .leftJoinAndSelect('f.tipoDanza', 'tipoDanza')
      .leftJoinAndSelect('f.categoria', 'categoria')
      .leftJoinAndSelect('f.facultad', 'facultad')
      .leftJoinAndSelect('f.carrera', 'carrera')
      .leftJoinAndSelect('f.institucionExterna', 'institucionExterna')
      .leftJoinAndSelect('f.gestion', 'gestion');

    const soloHabilitadas = dto.soloHabilitadas !== false;
    if (soloHabilitadas) {
      qb.andWhere('f.habilitado_efu = true');
    }

    const instancia = dto.instanciaRepresentacion;
    const esCentral = instancia && this.INSTANCIAS_CENTRALES.includes(instancia);
    const esExterno = instancia === 'Externo';
    const esFacultad = instancia === 'Facultad';
    const esCarrera = instancia === 'Carrera';

    if (dto.idGestion) {
      qb.andWhere('gestion.id_gestion = :idGestion', { idGestion: dto.idGestion });
    }
    if (dto.idTipoDanza) {
      qb.andWhere('tipoDanza.id_tipo_danza = :idTipoDanza', { idTipoDanza: dto.idTipoDanza });
    }
    const puedeFiltrarFacultad =
      !esCentral && !esExterno && (esFacultad || esCarrera || !instancia);
    if (dto.idFacultad && puedeFiltrarFacultad) {
      qb.andWhere('facultad.id_facultad = :idFacultad', { idFacultad: dto.idFacultad });
    }
    const puedeFiltrarCarrera = esCarrera || (!instancia && dto.idFacultad);
    if (dto.idCarrera && puedeFiltrarCarrera) {
      qb.andWhere('carrera.id_carrera = :idCarrera', { idCarrera: dto.idCarrera });
    }
    if (dto.idCategoria) {
      qb.andWhere('categoria.id_categoria = :idCategoria', { idCategoria: dto.idCategoria });
    }
    if (instancia) {
      qb.andWhere('f.nivel_representacion = :instancia', { instancia });
      if (esExterno) {
        qb.andWhere('institucionExterna.id_institucion_externa IS NOT NULL');
      }
      if (esCentral) {
        qb.andWhere('facultad.id_facultad IS NULL');
        qb.andWhere('carrera.id_carrera IS NULL');
      }
      if (esFacultad) {
        qb.andWhere('facultad.id_facultad IS NOT NULL');
      }
      if (esCarrera) {
        qb.andWhere('carrera.id_carrera IS NOT NULL');
      }
    }
    if (dto.busqueda?.trim()) {
      qb.andWhere(
        '(LOWER(f.nombre) LIKE LOWER(:q) OR LOWER(tipoDanza.nombre) LIKE LOWER(:q))',
        { q: `%${dto.busqueda.trim()}%` },
      );
    }

    const orden = dto.orden === 'DESC' ? 'DESC' : 'ASC';
    const ordenarPor = dto.ordenarPor || 'nombreFraternidad';
    const sortMap: Record<string, string> = {
      nombreFraternidad: 'f.nombre',
      tipoDanza: 'tipoDanza.nombre',
      facultad: 'facultad.nombre',
      categoria: 'categoria.nombre',
      gestion: 'gestion.anio',
    };
    qb.orderBy(sortMap[ordenarPor] || 'f.nombre', orden as 'ASC' | 'DESC');

    return qb;
  }

  private mapFraternidadRow(f: Fraternidad) {
    const pertenencia =
      f.facultad?.nombre ||
      f.carrera?.nombre ||
      f.institucionExterna?.nombre ||
      f.nivelRepresentacion ||
      '—';
    return {
      idFraternidad: f.idFraternidad,
      nombreFraternidad: f.nombre,
      tipoDanza: f.tipoDanza?.nombre || '—',
      idTipoDanza: f.tipoDanza?.idTipoDanza || null,
      categoria: f.categoria?.nombre || '—',
      instancia: f.nivelRepresentacion || '—',
      facultad: f.facultad?.nombre || null,
      carrera: f.carrera?.nombre || null,
      pertenencia,
      gestionAnio: f.gestion?.anio || null,
      idGestion: f.gestion?.idGestion || null,
      habilitadoEfu: f.habilitadoEfu,
      esExcedente: !!f.esExcedente,
      cupo: f.esExcedente ? 'EXCEDENTE' : 'Dentro de cupo',
    };
  }

  async consultar(dto: ConsultarReporteDto) {
    if (dto.tipoReporte === TipoReporte.CALIFICACIONES && !dto.idGestion) {
      throw new BadRequestException('La gestión es obligatoria para reportes de calificaciones.');
    }

    const page = dto.page || 1;
    const limit = Math.min(dto.limit || 50, 500);
    const skip = (page - 1) * limit;

    if (dto.tipoReporte === TipoReporte.COSTOS) {
      return this.consultarCostos(dto, page, limit, skip);
    }

    const fraternidades = await this.buildFraternidadQuery(dto).getMany();

    if (dto.tipoReporte === TipoReporte.FRATERNIDADES) {
      const rows = fraternidades.map((f) => this.mapFraternidadRow(f));
      const total = rows.length;
      const data = rows.slice(skip, skip + limit);
      return {
        tipoReporte: dto.tipoReporte,
        total,
        page,
        limit,
        filtros: dto,
        data,
      };
    }

    if (dto.tipoReporte === TipoReporte.DIRECTIVA) {
      const rows: any[] = [];
      for (const f of fraternidades) {
        const solicitud = await this.solicitudRepo.findOne({
          where: {
            fraternidadCreada: { idFraternidad: f.idFraternidad },
            estado: EstadoSolicitud.APROBADO,
          },
          order: { updatedAt: 'DESC' },
        });
        if (!solicitud) continue;
        const base = this.mapFraternidadRow(f);
        const miembros = buildMiembrosDirectiva(solicitud);
        for (const m of miembros) {
          rows.push({
            ...base,
            cargo: m.cargo,
            nombreIntegrante: m.nombre,
            ci: m.ci,
            celular: m.celular || '—',
          });
        }
      }
      const total = rows.length;
      return {
        tipoReporte: dto.tipoReporte,
        total,
        page,
        limit,
        filtros: dto,
        data: rows.slice(skip, skip + limit),
      };
    }

    // CALIFICACIONES
    const reporte = await this.evaluacionesService.getReporteHistorico(dto.idGestion!);
    const idsFiltrados = new Set(fraternidades.map((f) => f.idFraternidad));
    const ranking = reporte.rankingEfu
      .filter((r) => idsFiltrados.has(r.idFraternidad))
      .map((r) => {
        const frat = fraternidades.find((f) => f.idFraternidad === r.idFraternidad);
        return {
          ...this.mapFraternidadRow(frat!),
          puesto: r.puesto,
          promedioJurado: r.promedioJurado,
          impactoSanciones: r.impactoSanciones,
          puntajeFinal: r.puntajeFinal,
          fechaHoraCalificacion: r.fechaHoraCalificacion,
        };
      });

    if (dto.ordenarPor === 'puntajeFinal' || dto.ordenarPor === 'puesto') {
      const desc = dto.orden === 'DESC';
      ranking.sort((a, b) => {
        const va = dto.ordenarPor === 'puesto' ? a.puesto : a.puntajeFinal;
        const vb = dto.ordenarPor === 'puesto' ? b.puesto : b.puntajeFinal;
        return desc ? vb - va : va - vb;
      });
    }

    const total = ranking.length;
    return {
      tipoReporte: dto.tipoReporte,
      total,
      page,
      limit,
      filtros: dto,
      gestion: reporte.gestion,
      data: ranking.slice(skip, skip + limit),
    };
  }

  /**
   * Informe de costos desde preinscripción (solicitudes) + fraternidades inscritas.
   * Una fila por concepto/monto (costo único = 1 fila; variable = N filas).
   */
  private async consultarCostos(
    dto: ConsultarReporteDto,
    page: number,
    limit: number,
    skip: number,
  ) {
    const qb = this.solicitudRepo
      .createQueryBuilder('s')
      .leftJoinAndSelect('s.gestion', 'gestion')
      .leftJoinAndSelect('s.tipoDanza', 'tipoDanza')
      .leftJoinAndSelect('s.categoria', 'categoria')
      .leftJoinAndSelect('s.facultad', 'facultad')
      .leftJoinAndSelect('s.carrera', 'carrera')
      .leftJoinAndSelect('s.fraternidadCreada', 'fraternidadCreada')
      .where('s.estado != :borrador', { borrador: EstadoSolicitud.BORRADOR })
      .andWhere('s.costosParticipacion IS NOT NULL');

    if (dto.idGestion) {
      qb.andWhere('gestion.id_gestion = :idGestion', { idGestion: dto.idGestion });
    }
    if (dto.idTipoDanza) {
      qb.andWhere('tipoDanza.id_tipo_danza = :idTipoDanza', { idTipoDanza: dto.idTipoDanza });
    }
    if (dto.idCategoria) {
      qb.andWhere('categoria.id_categoria = :idCategoria', { idCategoria: dto.idCategoria });
    }
    if (dto.idFacultad) {
      qb.andWhere('facultad.id_facultad = :idFacultad', { idFacultad: dto.idFacultad });
    }
    if (dto.idCarrera) {
      qb.andWhere('carrera.id_carrera = :idCarrera', { idCarrera: dto.idCarrera });
    }
    if (dto.instanciaRepresentacion) {
      qb.andWhere('s.instancia_representacion = :inst', { inst: dto.instanciaRepresentacion });
    }
    if (dto.busqueda?.trim()) {
      const q = `%${dto.busqueda.trim().toLowerCase()}%`;
      qb.andWhere(
        '(LOWER(s.nombre_fraternidad) LIKE :q OR LOWER(tipoDanza.nombre) LIKE :q)',
        { q },
      );
    }

    qb.orderBy('s.nombre_fraternidad', 'ASC').addOrderBy('s.id_solicitud', 'ASC');
    const solicitudes = await qb.getMany();

    // Fraternidades con costos que no vinieran de solicitud listada (p.ej. creadas manualmente)
    const fratQb = this.fraternidadRepo
      .createQueryBuilder('f')
      .leftJoinAndSelect('f.gestion', 'gestion')
      .leftJoinAndSelect('f.tipoDanza', 'tipoDanza')
      .leftJoinAndSelect('f.categoria', 'categoria')
      .leftJoinAndSelect('f.facultad', 'facultad')
      .leftJoinAndSelect('f.carrera', 'carrera')
      .where('f.costosParticipacion IS NOT NULL');
    if (dto.idGestion) {
      fratQb.andWhere('gestion.id_gestion = :idGestion', { idGestion: dto.idGestion });
    }
    if (dto.idTipoDanza) {
      fratQb.andWhere('tipoDanza.id_tipo_danza = :idTipoDanza', { idTipoDanza: dto.idTipoDanza });
    }
    if (dto.idCategoria) {
      fratQb.andWhere('categoria.id_categoria = :idCategoria', { idCategoria: dto.idCategoria });
    }
    if (dto.busqueda?.trim()) {
      const q = `%${dto.busqueda.trim().toLowerCase()}%`;
      fratQb.andWhere('(LOWER(f.nombre) LIKE :q OR LOWER(tipoDanza.nombre) LIKE :q)', { q });
    }
    const fraternidades = await fratQb.getMany();
    const idsFratDesdeSolicitud = new Set(
      solicitudes
        .map((s) => s.fraternidadCreada?.idFraternidad)
        .filter((id): id is number => typeof id === 'number'),
    );

    type CostoRow = {
      nombreFraternidad: string;
      tipoDanza: string;
      categoria: string;
      instancia: string;
      estructura: string;
      concepto: string;
      monto: number;
      estadoSolicitud: string;
      esExcedente: boolean;
      fuente: string;
      gestionAnio: number | null;
    };

    const rows: CostoRow[] = [];

    const pushCostos = (
      costos: { multiple?: boolean; items?: Array<{ concepto?: string; monto?: number }> } | null,
      meta: Omit<CostoRow, 'estructura' | 'concepto' | 'monto'>,
    ) => {
      if (!costos?.items?.length) return;
      const multiple = Boolean(costos.multiple) || costos.items.length > 1;
      for (const item of costos.items) {
        const monto = Number(item?.monto);
        if (Number.isNaN(monto)) continue;
        rows.push({
          ...meta,
          estructura: multiple ? 'Variable' : 'Único',
          concepto: String(item?.concepto || (multiple ? '—' : 'Costo por participar')).trim() || '—',
          monto,
        });
      }
    };

    for (const s of solicitudes) {
      pushCostos(s.costosParticipacion, {
        nombreFraternidad: s.nombreFraternidad || s.fraternidadCreada?.nombre || '—',
        tipoDanza: s.tipoDanza?.nombre || '—',
        categoria: s.categoria?.nombre || '—',
        instancia: s.instanciaRepresentacion || '—',
        estadoSolicitud: s.estado,
        esExcedente: !!s.fraternidadCreada?.esExcedente,
        fuente: 'Preinscripción',
        gestionAnio: s.gestion?.anio ?? null,
      });
    }

    for (const f of fraternidades) {
      if (idsFratDesdeSolicitud.has(f.idFraternidad)) continue;
      pushCostos(f.costosParticipacion as any, {
        nombreFraternidad: f.nombre,
        tipoDanza: f.tipoDanza?.nombre || '—',
        categoria: f.categoria?.nombre || '—',
        instancia: f.nivelRepresentacion || '—',
        estadoSolicitud: 'INSCRITA',
        esExcedente: !!f.esExcedente,
        fuente: 'Fraternidad',
        gestionAnio: f.gestion?.anio ?? null,
      });
    }

    const ordenarPor = dto.ordenarPor || 'nombreFraternidad';
    const desc = dto.orden === 'DESC';
    rows.sort((a, b) => {
      let va: string | number = a.nombreFraternidad;
      let vb: string | number = b.nombreFraternidad;
      if (ordenarPor === 'monto') {
        va = a.monto;
        vb = b.monto;
      } else if (ordenarPor === 'tipoDanza') {
        va = a.tipoDanza;
        vb = b.tipoDanza;
      } else if (ordenarPor === 'concepto') {
        va = a.concepto;
        vb = b.concepto;
      } else if (ordenarPor === 'estructura') {
        va = a.estructura;
        vb = b.estructura;
      }
      if (typeof va === 'number' && typeof vb === 'number') {
        return desc ? vb - va : va - vb;
      }
      const cmp = String(va).localeCompare(String(vb), 'es');
      return desc ? -cmp : cmp;
    });

    let gestion: { anio?: number } | null = null;
    if (dto.idGestion) {
      gestion = await this.gestionRepo.findOne({
        where: { idGestion: dto.idGestion },
        select: ['idGestion', 'anio'],
      });
    }

    const totalMonto = rows.reduce((acc, r) => acc + (Number(r.monto) || 0), 0);
    const total = rows.length;

    return {
      tipoReporte: TipoReporte.COSTOS,
      total,
      page,
      limit,
      filtros: dto,
      gestion,
      resumen: {
        totalItems: total,
        totalMonto: Math.round(totalMonto * 100) / 100,
        fraternidadesUnicas: new Set(rows.map((r) => r.nombreFraternidad)).size,
      },
      data: rows.slice(skip, skip + limit),
    };
  }

  async generarPdfConsulta(dto: ConsultarReporteDto, res: Response) {
    const resultado = await this.consultar({ ...dto, page: 1, limit: 500 });
    const PDFDocument = require('pdfkit');
    const doc = new PDFDocument({ margin: 50, size: 'A4', autoFirstPage: true });

    const titulos: Record<string, string> = {
      fraternidades: 'REPORTE DE FRATERNIDADES',
      directiva: 'REPORTE DE DIRECTIVA',
      calificaciones: 'REPORTE DE CALIFICACIONES',
      costos: 'INFORME DE COSTOS DE PARTICIPACIÓN',
    };

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=Reporte_${dto.tipoReporte}_${Date.now()}.pdf`,
    );
    doc.pipe(res);

    const { contentStartY } = drawPdfInstitutionalHeader(
      doc,
      titulos[dto.tipoReporte] || 'REPORTE EFU',
      resultado.gestion?.anio ? `Gestión ${resultado.gestion.anio}` : undefined,
    );

    let y = contentStartY;
    doc.fontSize(9).fillColor('#64748b').font('Helvetica').text(
      `Generado: ${new Date().toLocaleString('es-BO')} · Total registros: ${resultado.total}`,
      50,
      y,
    );
    y += 20;

    const drawRow = (
      cells: string[],
      widths: number[],
      startY: number,
      bold = false,
      rowHeight = 14,
    ) => {
      let x = 50;
      doc.font(bold ? 'Helvetica-Bold' : 'Helvetica').fontSize(8).fillColor('#0f172a');
      cells.forEach((cell, i) => {
        doc.text(cell || '—', x + 2, startY + 4, {
          width: widths[i] - 4,
          height: rowHeight - 6,
          ellipsis: true,
        });
        x += widths[i];
      });
    };

    const getRowHeight = (cells: string[], widths: number[], minHeight = 14) => {
      let maxHeight = minHeight;
      doc.fontSize(8).font('Helvetica');
      cells.forEach((cell, i) => {
        const height = doc.heightOfString(cell || '—', { width: widths[i] - 4 });
        maxHeight = Math.max(maxHeight, Math.ceil(height) + 8);
      });
      return maxHeight;
    };

    if (dto.tipoReporte === TipoReporte.FRATERNIDADES) {
      const widths = [110, 85, 50, 70, 45, 55, 80];
      const headers = ['Fraternidad', 'Tipo de danza', 'Cat.', 'Pertenencia', 'Gestión', 'Cupo', 'Estado'];
      doc.save().rect(50, y, 495, 16).fill('#003399').restore();
      drawRow(headers, widths, y, true);
      doc.fillColor('#ffffff');
      y += 16;
      (resultado.data as any[]).forEach((row, i) => {
        const rowHeight = 14
        if (y + rowHeight > 720) {
          doc.addPage();
          y = 50;
        }
        if (i % 2 === 0) doc.save().rect(50, y, 495, 14).fill('#f8fafc').restore();
        drawRow(
          [
            row.nombreFraternidad,
            row.tipoDanza,
            row.categoria,
            row.pertenencia,
            String(row.gestionAnio || '—'),
            row.esExcedente ? 'EXCEDENTE' : 'Cupo OK',
            row.habilitadoEfu ? 'Activa' : 'Inactiva',
          ],
          widths,
          y,
        );
        y += 14;
      });
    } else if (dto.tipoReporte === TipoReporte.DIRECTIVA) {
      const widths = [82, 68, 78, 132, 55, 80];
      const headers = ['Fraternidad', 'Tipo danza', 'Cargo', 'Nombre', 'CI', 'Celular'];
      doc.save().rect(50, y, 495, 16).fill('#003399').restore();
      drawRow(headers, widths, y, true);
      y += 16;
      (resultado.data as any[]).forEach((row, i) => {
        const cells = [
          row.nombreFraternidad,
          row.tipoDanza,
          row.cargo,
          row.nombreIntegrante,
          row.ci,
          row.celular,
        ];
        const rowHeight = getRowHeight(cells, widths, 16);
        if (y > 720) {
          doc.addPage();
          y = 50;
        }
        if (i % 2 === 0) doc.save().rect(50, y, 495, rowHeight).fill('#f8fafc').restore();
        drawRow(cells, widths, y, false, rowHeight);
        y += rowHeight;
      });
    } else if (dto.tipoReporte === TipoReporte.COSTOS) {
      const resumen = (resultado as any).resumen;
      if (resumen) {
        doc.fontSize(9).fillColor('#334155').font('Helvetica')
          .text(
            `Fraternidades: ${resumen.fraternidadesUnicas || 0} · Ítems de costo: ${resumen.totalItems || 0} · Suma montos: ${Number(resumen.totalMonto || 0).toFixed(2)} Bs`,
            50,
            y,
            { width: 495 },
          );
        y += 18;
      }
      const widths = [120, 70, 50, 110, 55, 55];
      const headers = ['Fraternidad', 'Tipo danza', 'Estructura', 'Concepto', 'Monto Bs', 'Estado'];
      doc.save().rect(50, y, 495, 16).fill('#003399').restore();
      drawRow(headers, widths, y, true);
      y += 16;
      (resultado.data as any[]).forEach((row, i) => {
        if (y > 720) {
          doc.addPage();
          y = 50;
        }
        if (i % 2 === 0) doc.save().rect(50, y, 495, 14).fill('#f8fafc').restore();
        drawRow(
          [
            row.nombreFraternidad,
            row.tipoDanza,
            row.estructura,
            row.concepto,
            Number(row.monto).toFixed(2),
            row.estadoSolicitud || '—',
          ],
          widths,
          y,
        );
        y += 14;
      });
    } else {
      const widths = [30, 100, 80, 55, 70, 45, 45, 45];
      const headers = ['#', 'Fraternidad', 'Tipo danza', 'Cat.', 'Pertenencia', 'Jur.', 'Sanc.', 'Final'];
      doc.save().rect(50, y, 495, 16).fill('#003399').restore();
      drawRow(headers, widths, y, true);
      y += 16;
      (resultado.data as any[]).forEach((row, i) => {
        if (y > 720) {
          doc.addPage();
          y = 50;
        }
        if (i % 2 === 0) doc.save().rect(50, y, 495, 14).fill('#f8fafc').restore();
        drawRow(
          [
            String(row.puesto ?? '—'),
            row.nombreFraternidad,
            row.tipoDanza,
            row.categoria,
            row.pertenencia,
            String(row.promedioJurado ?? '—'),
            String(row.impactoSanciones ?? '—'),
            String(row.puntajeFinal ?? '—'),
          ],
          widths,
          y,
        );
        y += 14;
      });
    }

    doc.end();
  }
}
