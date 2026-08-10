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
import { ConsultarReporteDto, TipoReporte, AlcanceListadoFraternidades } from './dto/consultar-reporte.dto';
import { EvaluacionesService } from '../evaluaciones/evaluaciones.service';
import { drawPdfInstitutionalHeader, PDF_UMSA_BLUE, PDF_UMSA_RED } from '../common/pdf-layout';
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
      idSolicitud: null as number | null,
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
      estadoInscripcion: 'INSCRITA',
      estadoLabel: 'Inscrita',
    };
  }

  private mapSolicitudListadoRow(s: SolicitudInscripcion) {
    const pertenencia =
      s.facultad?.nombre ||
      s.carrera?.nombre ||
      s.institucionExterna?.nombre ||
      s.nombreInstitucionExterna ||
      s.instanciaRepresentacion ||
      '—';
    const estado = s.estado;
    return {
      idFraternidad: s.fraternidadCreada?.idFraternidad || null,
      idSolicitud: s.idSolicitud,
      nombreFraternidad: s.nombreFraternidad,
      tipoDanza: s.tipoDanza?.nombre || '—',
      idTipoDanza: s.tipoDanza?.idTipoDanza || null,
      categoria: s.categoria?.nombre || '—',
      instancia: s.instanciaRepresentacion || '—',
      facultad: s.facultad?.nombre || null,
      carrera: s.carrera?.nombre || null,
      pertenencia,
      gestionAnio: s.gestion?.anio || null,
      idGestion: s.gestion?.idGestion || null,
      habilitadoEfu: null as boolean | null,
      esExcedente: false,
      cupo: '—',
      estadoInscripcion: estado,
      estadoLabel:
        estado === EstadoSolicitud.PENDIENTE
          ? 'Pendiente'
          : estado === EstadoSolicitud.OBSERVADO
            ? 'Observada'
            : String(estado),
    };
  }

  private buildSolicitudListadoQuery(
    dto: ConsultarReporteDto,
    estados: EstadoSolicitud[],
  ): SelectQueryBuilder<SolicitudInscripcion> {
    const qb = this.solicitudRepo
      .createQueryBuilder('s')
      .leftJoinAndSelect('s.tipoDanza', 'tipoDanza')
      .leftJoinAndSelect('s.categoria', 'categoria')
      .leftJoinAndSelect('s.facultad', 'facultad')
      .leftJoinAndSelect('s.carrera', 'carrera')
      .leftJoinAndSelect('s.institucionExterna', 'institucionExterna')
      .leftJoinAndSelect('s.gestion', 'gestion')
      .leftJoinAndSelect('s.fraternidadCreada', 'fraternidadCreada')
      .andWhere('s.estado IN (:...estados)', { estados });

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
      qb.andWhere('s.instancia_representacion = :instancia', { instancia });
    }
    if (dto.busqueda?.trim()) {
      qb.andWhere(
        '(LOWER(s.nombre_fraternidad) LIKE LOWER(:q) OR LOWER(tipoDanza.nombre) LIKE LOWER(:q))',
        { q: `%${dto.busqueda.trim()}%` },
      );
    }

    const orden = dto.orden === 'DESC' ? 'DESC' : 'ASC';
    const ordenarPor = dto.ordenarPor || 'nombreFraternidad';
    const sortMap: Record<string, string> = {
      nombreFraternidad: 's.nombre_fraternidad',
      tipoDanza: 'tipoDanza.nombre',
      facultad: 'facultad.nombre',
      categoria: 'categoria.nombre',
      gestion: 'gestion.anio',
    };
    qb.orderBy(sortMap[ordenarPor] || 's.nombre_fraternidad', orden as 'ASC' | 'DESC');

    return qb;
  }

  private async consultarListadoFraternidades(
    dto: ConsultarReporteDto,
    page: number,
    limit: number,
    skip: number,
  ) {
    const alcance = dto.alcanceListado || AlcanceListadoFraternidades.INSCRITAS;
    let rows: ReturnType<ReportesService['mapFraternidadRow']>[] = [];

    if (
      alcance === AlcanceListadoFraternidades.INSCRITAS ||
      alcance === AlcanceListadoFraternidades.TODOS
    ) {
      const fraternidades = await this.buildFraternidadQuery(dto).getMany();
      rows = rows.concat(fraternidades.map((f) => this.mapFraternidadRow(f)));
    }

    if (alcance === AlcanceListadoFraternidades.PENDIENTES) {
      const solicitudes = await this.buildSolicitudListadoQuery(dto, [
        EstadoSolicitud.PENDIENTE,
      ]).getMany();
      rows = solicitudes.map((s) => this.mapSolicitudListadoRow(s));
    } else if (alcance === AlcanceListadoFraternidades.OBSERVADAS) {
      const solicitudes = await this.buildSolicitudListadoQuery(dto, [
        EstadoSolicitud.OBSERVADO,
      ]).getMany();
      rows = solicitudes.map((s) => this.mapSolicitudListadoRow(s));
    } else if (alcance === AlcanceListadoFraternidades.TODOS) {
      const solicitudes = await this.buildSolicitudListadoQuery(dto, [
        EstadoSolicitud.PENDIENTE,
        EstadoSolicitud.OBSERVADO,
      ]).getMany();
      rows = rows.concat(solicitudes.map((s) => this.mapSolicitudListadoRow(s)));
    }

    const orden = dto.orden === 'DESC' ? -1 : 1;
    const key = dto.ordenarPor || 'nombreFraternidad';
    rows.sort((a, b) => {
      const av = String((a as any)[key] ?? a.nombreFraternidad ?? '').toLowerCase();
      const bv = String((b as any)[key] ?? b.nombreFraternidad ?? '').toLowerCase();
      return av.localeCompare(bv, 'es') * orden;
    });

    const total = rows.length;
    const data = rows.slice(skip, skip + limit);
    let gestion: { anio?: number } | null = null;
    if (dto.idGestion) {
      const g = await this.gestionRepo.findOne({ where: { idGestion: dto.idGestion } });
      if (g) gestion = { anio: g.anio };
    }
    return {
      tipoReporte: dto.tipoReporte,
      alcanceListado: alcance,
      total,
      page,
      limit,
      filtros: dto,
      gestion,
      data,
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

    if (dto.tipoReporte === TipoReporte.FRATERNIDADES) {
      return this.consultarListadoFraternidades(dto, page, limit, skip);
    }

    const fraternidades = await this.buildFraternidadQuery(dto).getMany();

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
      facultad: string;
      carrera: string;
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
        facultad: s.facultad?.nombre || '—',
        carrera: s.carrera?.nombre || '—',
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
        facultad: f.facultad?.nombre || '—',
        carrera: f.carrera?.nombre || '—',
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
    const montos = rows.map((r) => Number(r.monto) || 0);
    const montoMin = montos.length ? Math.min(...montos) : 0;
    const montoMax = montos.length ? Math.max(...montos) : 0;
    const promedioGeneral = total ? Math.round((totalMonto / total) * 100) / 100 : 0;

    const rowMin = rows.find((r) => Number(r.monto) === montoMin) || null;
    const rowMax = rows.find((r) => Number(r.monto) === montoMax) || null;

    const promedioPorGrupo = (campo: 'facultad' | 'carrera') => {
      const map = new Map<string, number[]>();
      for (const r of rows) {
        const key = String(r[campo] || '—').trim() || '—';
        if (key === '—') continue;
        if (!map.has(key)) map.set(key, []);
        map.get(key)!.push(Number(r.monto) || 0);
      }
      return Array.from(map.entries())
        .map(([nombre, vals]) => {
          const sum = vals.reduce((a, b) => a + b, 0);
          return {
            nombre,
            cantidad: vals.length,
            promedio: Math.round((sum / vals.length) * 100) / 100,
            minimo: Math.min(...vals),
            maximo: Math.max(...vals),
          };
        })
        .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
    };

    return {
      tipoReporte: TipoReporte.COSTOS,
      total,
      page,
      limit,
      filtros: dto,
      gestion,
      resumen: {
        totalItems: total,
        fraternidadesUnicas: new Set(rows.map((r) => r.nombreFraternidad)).size,
        promedioGeneral,
        montoMin: Math.round(montoMin * 100) / 100,
        montoMax: Math.round(montoMax * 100) / 100,
        fraternidadMenorCosto: rowMin
          ? { nombre: rowMin.nombreFraternidad, monto: rowMin.monto, concepto: rowMin.concepto }
          : null,
        fraternidadMayorCosto: rowMax
          ? { nombre: rowMax.nombreFraternidad, monto: rowMax.monto, concepto: rowMax.concepto }
          : null,
        promedioPorFacultad: promedioPorGrupo('facultad'),
        promedioPorCarrera: promedioPorGrupo('carrera'),
      },
      data: rows.slice(skip, skip + limit),
    };
  }

  async generarPdfConsulta(dto: ConsultarReporteDto, res: Response) {
    const resultado = await this.consultar({ ...dto, page: 1, limit: 500 });
    const PDFDocument = require('pdfkit');

    const doc = new PDFDocument({
      margin: 36,
      size: 'A4',
      layout: 'landscape',
      autoFirstPage: true,
    });

    const pageW = 841.89;
    const pageH = 595.28;
    const margin = 36;
    const contentW = pageW - margin * 2;
    const bottomLimit = pageH - 40;

    const titulos: Record<string, string> = {
      fraternidades: 'REPORTE DE FRATERNIDADES',
      directiva: 'REPORTE DE DIRECTIVA',
      calificaciones: 'REPORTE DE CALIFICACIONES',
      costos: 'INFORME DE COSTOS DE PARTICIPACIÓN',
    };

    const alcanceLabel: Record<string, string> = {
      inscritas: 'Inscritas',
      pendientes: 'Pendientes',
      observadas: 'Observadas',
      todos: 'Todos los casos',
    };

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=Reporte_${dto.tipoReporte}_${Date.now()}.pdf`,
    );
    doc.pipe(res);

    const subtitleParts = [
      (resultado as any).gestion?.anio ? `Gestión ${(resultado as any).gestion.anio}` : null,
      dto.tipoReporte === TipoReporte.FRATERNIDADES && dto.alcanceListado
        ? `Alcance: ${alcanceLabel[dto.alcanceListado] || dto.alcanceListado}`
        : null,
    ].filter(Boolean);
    const subtitle = subtitleParts.length ? subtitleParts.join(' · ') : undefined;

    let pageNum = 1;

    const drawDocHeader = () =>
      drawPdfInstitutionalHeader(doc, titulos[dto.tipoReporte] || 'REPORTE EFU', subtitle, {
        pageWidth: pageW,
        margin,
        compact: true,
      });

    let { contentStartY } = drawDocHeader();
    let y = contentStartY;

    doc
      .fontSize(7)
      .fillColor('#64748b')
      .font('Helvetica')
      .text(
        `Generado: ${new Date().toLocaleString('es-BO')}  |  Total registros: ${resultado.total}  |  Formato: horizontal`,
        margin,
        y,
        { width: contentW },
      );
    y += 14;

    const fontSize = 6.5;
    const headerFontSize = 7;

    const measureRowHeight = (cells: string[], widths: number[], minH = 12) => {
      let maxH = minH;
      doc.font('Helvetica').fontSize(fontSize);
      cells.forEach((cell, i) => {
        const h = doc.heightOfString(String(cell ?? '—'), {
          width: Math.max(8, widths[i] - 4),
        });
        maxH = Math.max(maxH, Math.ceil(h) + 6);
      });
      return Math.min(maxH, 80);
    };

    const drawCellBorders = (
      startX: number,
      startY: number,
      widths: number[],
      rowH: number,
    ) => {
      let x = startX;
      doc.save().lineWidth(0.35).strokeColor('#94a3b8');
      widths.forEach((w) => {
        doc.rect(x, startY, w, rowH).stroke();
        x += w;
      });
      doc.restore();
    };

    const drawTableHeader = (headers: string[], widths: number[], startY: number) => {
      const rowH = Math.max(14, measureRowHeight(headers, widths, 14));
      doc.save().rect(margin, startY, contentW, rowH).fill(PDF_UMSA_BLUE).restore();
      doc
        .save()
        .moveTo(margin, startY + rowH - 1)
        .lineTo(margin + contentW, startY + rowH - 1)
        .lineWidth(1.2)
        .strokeColor(PDF_UMSA_RED)
        .stroke()
        .restore();

      let x = margin;
      doc.font('Helvetica-Bold').fontSize(headerFontSize).fillColor('#ffffff');
      headers.forEach((cell, i) => {
        doc.text(cell, x + 2, startY + 3, {
          width: widths[i] - 4,
          height: rowH - 4,
          align: i === 0 ? 'center' : 'left',
        });
        x += widths[i];
      });
      drawCellBorders(margin, startY, widths, rowH);
      return rowH;
    };

    const drawDataRow = (
      cells: string[],
      widths: number[],
      startY: number,
      stripe: boolean,
    ) => {
      const rowH = measureRowHeight(cells, widths, 12);
      if (stripe) {
        doc.save().rect(margin, startY, contentW, rowH).fill('#f1f5f9').restore();
      }
      let x = margin;
      doc.font('Helvetica').fontSize(fontSize).fillColor('#0f172a');
      cells.forEach((cell, i) => {
        doc.text(String(cell ?? '—'), x + 2, startY + 3, {
          width: widths[i] - 4,
          align: i === 0 ? 'center' : 'left',
        });
        x += widths[i];
      });
      drawCellBorders(margin, startY, widths, rowH);
      return rowH;
    };

    const ensureSpace = (needed: number, headers: string[], widths: number[]) => {
      if (y + needed <= bottomLimit) return;
      doc
        .fontSize(6)
        .fillColor('#94a3b8')
        .font('Helvetica')
        .text(`Página ${pageNum}`, margin, pageH - 28, {
          width: contentW,
          align: 'center',
        });
      doc.addPage({ size: 'A4', layout: 'landscape', margin });
      pageNum += 1;
      ({ contentStartY } = drawDocHeader());
      y = contentStartY + 4;
      doc
        .fontSize(6.5)
        .fillColor('#64748b')
        .font('Helvetica-Oblique')
        .text(`Continuación — ${titulos[dto.tipoReporte] || 'REPORTE'}`, margin, y, {
          width: contentW,
        });
      y += 12;
      y += drawTableHeader(headers, widths, y);
    };

    const renderTable = (headers: string[], widths: number[], tableRows: string[][]) => {
      const sum = widths.reduce((a, b) => a + b, 0);
      const scaled = widths.map((w) => (w / sum) * contentW);

      y += drawTableHeader(headers, scaled, y);
      tableRows.forEach((cells, i) => {
        const previewH = measureRowHeight(cells, scaled, 12);
        ensureSpace(previewH + 2, headers, scaled);
        y += drawDataRow(cells, scaled, y, i % 2 === 0);
      });
    };

    const rows = (resultado.data as any[]) || [];

    if (dto.tipoReporte === TipoReporte.FRATERNIDADES) {
      const headers = ['N°', 'Fraternidad', 'Tipo de danza', 'Categoría', 'Pertenencia', 'Gestión', 'Cupo', 'Estado'];
      const widths = [28, 150, 110, 70, 160, 45, 55, 70];
      const dataRows = rows.map((row, i) => [
        String(i + 1),
        row.nombreFraternidad || '—',
        row.tipoDanza || '—',
        row.categoria || '—',
        row.pertenencia || '—',
        String(row.gestionAnio || '—'),
        row.estadoInscripcion === 'INSCRITA'
          ? row.esExcedente
            ? 'EXCEDENTE'
            : 'Cupo OK'
          : '—',
        row.estadoLabel || row.estadoInscripcion || '—',
      ]);
      renderTable(headers, widths, dataRows);
    } else if (dto.tipoReporte === TipoReporte.DIRECTIVA) {
      const headers = ['N°', 'Fraternidad', 'Tipo de danza', 'Cargo', 'Nombre completo', 'CI', 'Celular'];
      const widths = [28, 130, 95, 100, 180, 70, 80];
      const dataRows = rows.map((row, i) => [
        String(i + 1),
        row.nombreFraternidad || '—',
        row.tipoDanza || '—',
        row.cargo || '—',
        row.nombreIntegrante || '—',
        row.ci || '—',
        row.celular || '—',
      ]);
      renderTable(headers, widths, dataRows);
    } else if (dto.tipoReporte === TipoReporte.COSTOS) {
      const resumen = (resultado as any).resumen;
      if (resumen) {
        const lineas = [
          `Fraternidades: ${resumen.fraternidadesUnicas || 0} · Ítems: ${resumen.totalItems || 0}`,
          `Promedio general: ${Number(resumen.promedioGeneral || 0).toFixed(2)} Bs · Mín: ${Number(resumen.montoMin || 0).toFixed(2)} Bs · Máx: ${Number(resumen.montoMax || 0).toFixed(2)} Bs`,
        ];
        if (resumen.fraternidadMenorCosto) {
          lineas.push(
            `Menor: ${resumen.fraternidadMenorCosto.nombre} (${Number(resumen.fraternidadMenorCosto.monto).toFixed(2)} Bs)`,
          );
        }
        if (resumen.fraternidadMayorCosto) {
          lineas.push(
            `Mayor: ${resumen.fraternidadMayorCosto.nombre} (${Number(resumen.fraternidadMayorCosto.monto).toFixed(2)} Bs)`,
          );
        }
        doc
          .fontSize(7)
          .fillColor('#334155')
          .font('Helvetica')
          .text(lineas.join('  ·  '), margin, y, { width: contentW });
        y += 14;

        const facs = resumen.promedioPorFacultad || [];
        if (facs.length) {
          doc
            .fontSize(7)
            .fillColor(PDF_UMSA_BLUE)
            .font('Helvetica-Bold')
            .text('Promedio por facultad:', margin, y, { width: contentW });
          y += 10;
          doc.font('Helvetica').fillColor('#334155').fontSize(6.5);
          for (const f of facs.slice(0, 12)) {
            doc.text(
              `• ${f.nombre}: prom. ${Number(f.promedio).toFixed(2)} Bs (n=${f.cantidad}, min ${Number(f.minimo).toFixed(2)}, máx ${Number(f.maximo).toFixed(2)})`,
              margin,
              y,
              { width: contentW },
            );
            y += 9;
            if (y > bottomLimit - 80) break;
          }
          y += 4;
        }

        const cars = resumen.promedioPorCarrera || [];
        if (cars.length && y < bottomLimit - 60) {
          doc
            .fontSize(7)
            .fillColor(PDF_UMSA_BLUE)
            .font('Helvetica-Bold')
            .text('Promedio por carrera:', margin, y, { width: contentW });
          y += 10;
          doc.font('Helvetica').fillColor('#334155').fontSize(6.5);
          for (const c of cars.slice(0, 12)) {
            doc.text(
              `• ${c.nombre}: prom. ${Number(c.promedio).toFixed(2)} Bs (n=${c.cantidad}, min ${Number(c.minimo).toFixed(2)}, máx ${Number(c.maximo).toFixed(2)})`,
              margin,
              y,
              { width: contentW },
            );
            y += 9;
            if (y > bottomLimit - 50) break;
          }
          y += 6;
        }
      }
      const headers = ['N°', 'Fraternidad', 'Facultad', 'Carrera', 'Tipo danza', 'Concepto', 'Monto Bs'];
      const widths = [26, 130, 110, 110, 90, 150, 55];
      const dataRows = rows.map((row, i) => [
        String(i + 1),
        row.nombreFraternidad || '—',
        row.facultad || '—',
        row.carrera || '—',
        row.tipoDanza || '—',
        row.concepto || '—',
        Number(row.monto).toFixed(2),
      ]);
      renderTable(headers, widths, dataRows);
    } else {
      const headers = [
        'N°',
        'Puesto',
        'Fraternidad',
        'Tipo de danza',
        'Categoría',
        'Pertenencia',
        'Jurado',
        'Sanciones',
        'Final',
      ];
      const widths = [28, 36, 140, 100, 70, 150, 45, 50, 45];
      const dataRows = rows.map((row, i) => [
        String(i + 1),
        String(row.puesto ?? '—'),
        row.nombreFraternidad || '—',
        row.tipoDanza || '—',
        row.categoria || '—',
        row.pertenencia || '—',
        String(row.promedioJurado ?? '—'),
        String(row.impactoSanciones ?? '—'),
        String(row.puntajeFinal ?? '—'),
      ]);
      renderTable(headers, widths, dataRows);
    }

    doc
      .fontSize(6)
      .fillColor('#94a3b8')
      .font('Helvetica')
      .text(`Página ${pageNum}`, margin, pageH - 28, {
        width: contentW,
        align: 'center',
      });

    doc.end();
  }
}
