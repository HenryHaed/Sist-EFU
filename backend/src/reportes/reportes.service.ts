import {
  BadRequestException,
  Injectable,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder, In } from 'typeorm';
import { Response } from 'express';
import { Fraternidad } from '../entities/Fraternidad';
import { TipoDanza } from '../entities/TipoDanza';
import { Gestion } from '../entities/Gestion';
import { Facultad } from '../entities/Facultad';
import { Carrera } from '../entities/Carrera';
import { Categoria } from '../entities/Categoria';
import { SolicitudInscripcion, EstadoSolicitud } from '../entities/SolicitudInscripcion';
import { ensureTiposDanzaDefault } from '../common/tipos-danza-default';
import { buildMiembrosDirectiva, PERSONAS_DIRECTIVA } from '../common/personas-directiva';
import {
  ConsultarReporteDto,
  TipoReporte,
  AlcanceListadoFraternidades,
  TipoIncidenciaReporte,
  PlantillaConcursoExterno,
} from './dto/consultar-reporte.dto';
import { Incidencia } from '../entities/Incidencia';
import { Participante } from '../entities/Participante';
import { Fase } from '../entities/Fase';
import { InscripcionConcurso } from '../entities/InscripcionConcurso';
import { FORMULA_EFU_PROMEDIO } from '../evaluaciones/efu-scoring';
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
    @InjectRepository(Incidencia)
    private readonly incidenciaRepo: Repository<Incidencia>,
    @InjectRepository(Participante)
    private readonly participanteRepo: Repository<Participante>,
    @InjectRepository(Fase)
    private readonly faseRepo: Repository<Fase>,
    @InjectRepository(InscripcionConcurso)
    private readonly inscConcursoRepo: Repository<InscripcionConcurso>,
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
    let fasesExternas: Array<{
      idFase: number;
      nombre: string;
      plantillaRequisitos: string | null;
      idGestion: number | null;
    }> = [];
    if (idGestion) {
      const fases = await this.faseRepo.find({
        where: { gestion: { idGestion }, tipoConcurso: 'EXTERNO' },
        relations: ['gestion'],
        order: { nombre: 'ASC' },
      });
      fasesExternas = fases.map((f) => ({
        idFase: f.idFase,
        nombre: f.nombre,
        plantillaRequisitos: f.plantillaRequisitos || 'generico',
        idGestion: f.gestion?.idGestion ?? idGestion,
      }));
    }
    return {
      gestiones,
      facultades,
      carreras,
      categorias,
      tiposDanza,
      instancias: Object.values(InstanciaRepresentacion),
      fasesExternas,
      plantillasExternas: [
        { id: PlantillaConcursoExterno.TODOS, label: 'Todos los concursos externos' },
        { id: PlantillaConcursoExterno.CHACHA_WARMI, label: 'Solo Chacha-Warmi' },
        { id: PlantillaConcursoExterno.FOTOGRAFIA, label: 'Solo Fotografía' },
        { id: PlantillaConcursoExterno.GENERICO, label: 'Otros concursos' },
      ],
    };
  }

  private readonly INSTANCIAS_CENTRALES = ['UMSA', 'FEDSIDUMSA', 'STUMSA'];

  private clasificarInfraccion(inf?: {
    nombre?: string;
    tipoImpacto?: string;
    valorImpacto?: number;
  } | null): string {
    const n = (inf?.nombre || '').toLowerCase();
    const tipo = (inf?.tipoImpacto || '').toUpperCase();
    if (n.includes('amarilla')) return 'AMARILLA';
    if (n.includes('roja')) return 'ROJA';
    if (n.includes('alcohol')) return 'SANCION_ALCOHOL';
    if (n.includes('agresiv')) return 'SANCION_AGRESION';
    if (n.includes('banda') || n.includes('músico') || n.includes('musico')) return 'SANCION_BANDA';
    if (n.includes('ajeno')) return 'SANCION_AJENO';
    if (tipo === 'SUSPENSION') return 'SANCION_AGRESION';
    return 'OTRA';
  }

  private etiquetaIncidencia(clave: string, nombreOriginal?: string): string {
    const labels: Record<string, string> = {
      AMARILLA: 'Bandera Amarilla',
      ROJA: 'Bandera Roja',
      SANCION_ALCOHOL: 'Sanción: Alcohol',
      SANCION_AGRESION: 'Sanción: Agresividad (suspensión 1 año)',
      SANCION_BANDA: 'Sanción: Exceso de bandas',
      SANCION_AJENO: 'Sanción: Personal ajeno a la UMSA',
      OTRA: nombreOriginal || 'Incidencia',
    };
    return labels[clave] || nombreOriginal || clave;
  }

  private coincideTipoIncidencia(clave: string, filtro?: TipoIncidenciaReporte): boolean {
    if (!filtro || filtro === TipoIncidenciaReporte.TODOS) return true;
    if (filtro === TipoIncidenciaReporte.BANDERAS) return clave === 'AMARILLA' || clave === 'ROJA';
    if (filtro === TipoIncidenciaReporte.SANCIONES_GRAVES) return clave.startsWith('SANCION_');
    return clave === filtro;
  }

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
      fechaSolicitud: null as string | Date | null,
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
      nombreFraternidad: s.fraternidadCreada?.nombre || s.nombreFraternidad,
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
      fechaSolicitud: s.createdAt || null,
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
        '(LOWER(s.nombre_fraternidad) LIKE LOWER(:q) OR LOWER(fraternidadCreada.nombre) LIKE LOWER(:q) OR LOWER(tipoDanza.nombre) LIKE LOWER(:q))',
        { q: `%${dto.busqueda.trim()}%` },
      );
    }

    const orden = dto.orden === 'DESC' ? 'DESC' : 'ASC';
    const ordenarPor = dto.ordenarPor || 'nombreFraternidad';
    const sortMap: Record<string, string> = {
      nombreFraternidad: 'COALESCE(fraternidadCreada.nombre, s.nombre_fraternidad)',
      tipoDanza: 'tipoDanza.nombre',
      facultad: 'facultad.nombre',
      categoria: 'categoria.nombre',
      gestion: 'gestion.anio',
      fechaSolicitud: 's.created_at',
    };
    qb.orderBy(sortMap[ordenarPor] || 'COALESCE(fraternidadCreada.nombre, s.nombre_fraternidad)', orden as 'ASC' | 'DESC');

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
      await this.adjuntarFechaSolicitudFraternidades(rows);
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
      if (key === 'fechaSolicitud') {
        const ta = a.fechaSolicitud ? new Date(a.fechaSolicitud as any).getTime() : 0;
        const tb = b.fechaSolicitud ? new Date(b.fechaSolicitud as any).getTime() : 0;
        return (ta - tb) * orden;
      }
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

  /** Fecha de la solicitud aprobada más reciente por fraternidad inscrita. */
  private async adjuntarFechaSolicitudFraternidades(
    rows: Array<{ idFraternidad?: number | null; fechaSolicitud?: string | Date | null }>,
  ) {
    const ids = [
      ...new Set(rows.map((r) => r.idFraternidad).filter((id): id is number => !!id)),
    ];
    if (!ids.length) return;
    const sols = await this.solicitudRepo.find({
      where: {
        fraternidadCreada: { idFraternidad: In(ids) },
        estado: EstadoSolicitud.APROBADO,
      },
      relations: ['fraternidadCreada'],
      order: { createdAt: 'ASC' },
    });
    const porFrat = new Map<number, Date>();
    for (const s of sols) {
      const id = s.fraternidadCreada?.idFraternidad;
      if (!id) continue;
      // Primera (más antigua) = fecha original de solicitud
      if (!porFrat.has(id) && s.createdAt) porFrat.set(id, s.createdAt);
    }
    for (const row of rows) {
      if (row.idFraternidad && porFrat.has(row.idFraternidad)) {
        row.fechaSolicitud = porFrat.get(row.idFraternidad) || null;
      }
    }
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

    if (dto.tipoReporte === TipoReporte.CONCURSANTES_EXTERNOS) {
      return this.consultarConcursantesExternos(dto, page, limit, skip);
    }

    if (dto.tipoReporte === TipoReporte.FRATERNIDADES) {
      return this.consultarListadoFraternidades(dto, page, limit, skip);
    }

    if (dto.tipoReporte === TipoReporte.DISCIPLINA) {
      return this.consultarDisciplina(dto, page, limit, skip);
    }

    const fraternidades = await this.buildFraternidadQuery(dto).getMany();

    if (dto.tipoReporte === TipoReporte.DIRECTIVA) {
      const cargoFiltro = String(dto.cargoDirectiva || 'todos').trim();
      const prefijoValido =
        cargoFiltro !== 'todos'
          ? PERSONAS_DIRECTIVA.find((p) => p.prefix === cargoFiltro)
          : null;
      if (cargoFiltro !== 'todos' && !prefijoValido) {
        throw new BadRequestException(
          `Cargo de directiva inválido. Usa: ${PERSONAS_DIRECTIVA.map((p) => p.prefix).join(', ')} o todos.`,
        );
      }

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
        const base = {
          ...this.mapFraternidadRow(f),
          fechaSolicitud: solicitud.createdAt || null,
        };
        let miembros = buildMiembrosDirectiva(solicitud);
        if (prefijoValido) {
          // Una fila por fraternidad del cargo elegido (aunque esté vacío)
          const m = miembros.find((x) => x.prefix === prefijoValido.prefix);
          rows.push({
            ...base,
            cargo: prefijoValido.label,
            cargoPrefix: prefijoValido.prefix,
            nombreIntegrante: m?.nombre || '—',
            ci: m?.ci && m.ci !== '—' ? m.ci : '—',
          });
        } else {
          for (const m of miembros) {
            rows.push({
              ...base,
              cargo: m.cargo,
              cargoPrefix: m.prefix,
              nombreIntegrante: m.nombre || '—',
              ci: m.ci || '—',
            });
          }
        }
      }
      const ordenDir = dto.orden === 'DESC' ? -1 : 1;
      const keyDir = dto.ordenarPor || 'nombreFraternidad';
      rows.sort((a, b) => {
        if (keyDir === 'fechaSolicitud') {
          const ta = a.fechaSolicitud ? new Date(a.fechaSolicitud).getTime() : 0;
          const tb = b.fechaSolicitud ? new Date(b.fechaSolicitud).getTime() : 0;
          const cmp = (ta - tb) * ordenDir;
          if (cmp !== 0) return cmp;
          return String(a.nombreFraternidad || '').localeCompare(String(b.nombreFraternidad || ''), 'es');
        }
        const av = String(a[keyDir] ?? a.nombreFraternidad ?? '').toLowerCase();
        const bv = String(b[keyDir] ?? b.nombreFraternidad ?? '').toLowerCase();
        const cmp = av.localeCompare(bv, 'es') * ordenDir;
        if (cmp !== 0) return cmp;
        return String(a.cargo || '').localeCompare(String(b.cargo || ''), 'es');
      });
      const total = rows.length;
      return {
        tipoReporte: dto.tipoReporte,
        total,
        page,
        limit,
        filtros: dto,
        cargoDirectiva: prefijoValido?.prefix || 'todos',
        cargoDirectivaLabel: prefijoValido?.label || 'Todos los cargos',
        data: rows.slice(skip, skip + limit),
      };
    }

    // CALIFICACIONES — matriz por fraternidad / jurado / fase
    const matriz = await this.evaluacionesService.getMatrizCalificaciones(dto.idGestion!);
    const idsFiltrados = new Set(fraternidades.map((f) => f.idFraternidad));
    let grupos: any[] = matriz.grupos
      .filter((g) => idsFiltrados.has(g.idFraternidad))
      .filter((g) => {
        if (!dto.tipoIncidencia || dto.tipoIncidencia === TipoIncidenciaReporte.TODOS) return true;
        const claves = (g.sanciones || []).map((s: any) => this.clasificarInfraccion(s));
        return claves.some((c) => this.coincideTipoIncidencia(c, dto.tipoIncidencia));
      })
      .map((g) => {
        const frat = fraternidades.find((f) => f.idFraternidad === g.idFraternidad);
        const base = frat ? this.mapFraternidadRow(frat) : {};
        return {
          ...base,
          ...g,
          nombreFraternidad: g.nombreFraternidad || (base as any).nombreFraternidad,
          categoria: g.categoria || (base as any).categoria,
          tipoDanza: g.tipoDanza || (base as any).tipoDanza,
        };
      });

    if (dto.ordenarPor === 'puntajeFinal' || dto.ordenarPor === 'puesto') {
      const desc = dto.orden === 'DESC';
      grupos.sort((a, b) => {
        const va = dto.ordenarPor === 'puesto' ? a.puesto : a.puntajeFinal;
        const vb = dto.ordenarPor === 'puesto' ? b.puesto : b.puntajeFinal;
        return desc ? vb - va : va - vb;
      });
    } else if (dto.ordenarPor === 'nombre' || dto.ordenarPor === 'nombreFraternidad') {
      const desc = dto.orden === 'DESC';
      grupos.sort((a, b) => {
        const cmp = String(a.nombreFraternidad || '').localeCompare(String(b.nombreFraternidad || ''), 'es');
        return desc ? -cmp : cmp;
      });
    }

    // Renumerar nro tras filtros/orden
    grupos.forEach((g, i) => {
      g.nro = i + 1;
    });

    const total = grupos.length;
    return {
      tipoReporte: dto.tipoReporte,
      total,
      page,
      limit,
      filtros: dto,
      gestion: matriz.gestion,
      fasesEfu: matriz.fasesEfu,
      formula: matriz.formula,
      data: grupos.slice(skip, skip + limit),
    };
  }

  /**
   * Una fila por incidencia (bandera o sanción) para listar todos los casos.
   */
  private async consultarDisciplina(
    dto: ConsultarReporteDto,
    page: number,
    limit: number,
    skip: number,
  ) {
    const qb = this.incidenciaRepo
      .createQueryBuilder('i')
      .leftJoinAndSelect('i.fraternidad', 'f')
      .leftJoinAndSelect('f.tipoDanza', 'tipoDanza')
      .leftJoinAndSelect('f.categoria', 'categoria')
      .leftJoinAndSelect('f.facultad', 'facultad')
      .leftJoinAndSelect('f.carrera', 'carrera')
      .leftJoinAndSelect('f.institucionExterna', 'institucionExterna')
      .leftJoinAndSelect('f.gestion', 'gestionFrat')
      .leftJoinAndSelect('i.infraccion', 'infraccion')
      .leftJoinAndSelect('i.gestion', 'gestion')
      .orderBy('i.fecha_hora', 'DESC');

    if (dto.idGestion) {
      qb.andWhere('gestion.id_gestion = :idGestion', { idGestion: dto.idGestion });
    }
    if (dto.idTipoDanza) {
      qb.andWhere('tipoDanza.id_tipo_danza = :idTipoDanza', { idTipoDanza: dto.idTipoDanza });
    }
    if (dto.idFacultad) {
      qb.andWhere('facultad.id_facultad = :idFacultad', { idFacultad: dto.idFacultad });
    }
    if (dto.idCarrera) {
      qb.andWhere('carrera.id_carrera = :idCarrera', { idCarrera: dto.idCarrera });
    }
    if (dto.idCategoria) {
      qb.andWhere('categoria.id_categoria = :idCategoria', { idCategoria: dto.idCategoria });
    }
    if (dto.instanciaRepresentacion) {
      qb.andWhere('f.nivel_representacion = :instancia', {
        instancia: dto.instanciaRepresentacion,
      });
    }
    if (dto.busqueda?.trim()) {
      qb.andWhere(
        '(LOWER(f.nombre) LIKE LOWER(:q) OR LOWER(infraccion.nombre) LIKE LOWER(:q))',
        { q: `%${dto.busqueda.trim()}%` },
      );
    }

    const incidencias = await qb.getMany();
    let rows = incidencias
      .filter((inc) => inc.fraternidad && inc.infraccion)
      .map((inc) => {
        const clave = this.clasificarInfraccion(inc.infraccion);
        const frat = inc.fraternidad;
        return {
          idIncidencia: inc.idIncidencia,
          idFraternidad: frat.idFraternidad,
          nombreFraternidad: frat.nombre,
          tipoDanza: frat.tipoDanza?.nombre || '—',
          categoria: frat.categoria?.nombre || '—',
          instancia: frat.nivelRepresentacion || '—',
          pertenencia:
            frat.facultad?.nombre ||
            frat.carrera?.nombre ||
            frat.institucionExterna?.nombre ||
            frat.nivelRepresentacion ||
            '—',
          gestionAnio: inc.gestion?.anio || frat.gestion?.anio || null,
          tipoIncidencia: clave,
          tipoLabel: this.etiquetaIncidencia(clave, inc.infraccion.nombre),
          detalle: inc.infraccion.nombre,
          valorImpacto: Number(inc.infraccion.valorImpacto) || 0,
          tipoImpacto: inc.infraccion.tipoImpacto || 'RESTA_PUNTOS',
          observacion: inc.observacion || '—',
          fechaHora: inc.fechaHora,
        };
      })
      .filter((row) => this.coincideTipoIncidencia(row.tipoIncidencia, dto.tipoIncidencia));

    const orden = dto.orden === 'ASC' ? 1 : -1;
    const key = dto.ordenarPor || 'fechaHora';
    rows.sort((a, b) => {
      if (key === 'fechaHora') {
        return (new Date(a.fechaHora).getTime() - new Date(b.fechaHora).getTime()) * orden;
      }
      if (key === 'valorImpacto') {
        return (a.valorImpacto - b.valorImpacto) * orden;
      }
      const av = String((a as any)[key] ?? a.nombreFraternidad ?? '').toLowerCase();
      const bv = String((b as any)[key] ?? b.nombreFraternidad ?? '').toLowerCase();
      return av.localeCompare(bv, 'es') * orden;
    });

    let gestion: { anio?: number } | null = null;
    if (dto.idGestion) {
      const g = await this.gestionRepo.findOne({ where: { idGestion: dto.idGestion } });
      if (g) gestion = { anio: g.anio };
    }

    const total = rows.length;
    return {
      tipoReporte: dto.tipoReporte,
      tipoIncidencia: dto.tipoIncidencia || TipoIncidenciaReporte.TODOS,
      total,
      page,
      limit,
      filtros: dto,
      gestion,
      data: rows.slice(skip, skip + limit),
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
        nombreFraternidad: s.fraternidadCreada?.nombre || s.nombreFraternidad || '—',
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

  /**
   * Reporte de concursantes de fases EXTERNO (Chacha-Warmi, Fotografía u otros).
   * Usa Fraternidad.nombre canónico cuando hay vínculo.
   */
  private async consultarConcursantesExternos(
    dto: ConsultarReporteDto,
    page: number,
    limit: number,
    skip: number,
  ) {
    const qb = this.participanteRepo
      .createQueryBuilder('p')
      .leftJoinAndSelect('p.fase', 'fase')
      .leftJoinAndSelect('fase.gestion', 'gestionFase')
      .leftJoinAndSelect('p.gestion', 'gestion')
      .leftJoinAndSelect('p.fraternidad', 'frat')
      .leftJoinAndSelect('frat.facultad', 'fratFacultad')
      .leftJoinAndSelect('frat.carrera', 'fratCarrera')
      .leftJoinAndSelect('frat.tipoDanza', 'fratTipoDanza')
      .leftJoinAndSelect('frat.categoria', 'fratCategoria')
      .leftJoinAndSelect('frat.institucionExterna', 'fratInstitucion')
      .leftJoinAndSelect('p.facultad', 'facultad')
      .leftJoinAndSelect('p.carrera', 'carrera')
      .andWhere('fase.tipo_concurso = :tipoExt', { tipoExt: 'EXTERNO' });

    if (dto.idGestion) {
      qb.andWhere(
        '(gestion.id_gestion = :idGestion OR gestionFase.id_gestion = :idGestion)',
        { idGestion: dto.idGestion },
      );
    }
    if (dto.idFase) {
      qb.andWhere('fase.id_fase = :idFase', { idFase: dto.idFase });
    } else if (
      dto.plantillaRequisitos &&
      dto.plantillaRequisitos !== PlantillaConcursoExterno.TODOS
    ) {
      qb.andWhere('LOWER(COALESCE(fase.plantilla_requisitos, :gen)) = :plantilla', {
        plantilla: dto.plantillaRequisitos,
        gen: 'generico',
      });
    }

    const instancia = dto.instanciaRepresentacion;
    const esCentral = instancia && this.INSTANCIAS_CENTRALES.includes(instancia);
    const esExterno = instancia === 'Externo';
    const esFacultad = instancia === 'Facultad';
    const esCarrera = instancia === 'Carrera';

    if (instancia) {
      qb.andWhere(
        '(LOWER(COALESCE(frat.nivel_representacion, \'\')) = LOWER(:instancia) OR (frat.id_fraternidad IS NULL AND :instancia = \'Externo\'))',
        { instancia },
      );
    }
    const puedeFiltrarFacultad =
      !esCentral && !esExterno && (esFacultad || esCarrera || !instancia);
    if (dto.idFacultad && puedeFiltrarFacultad) {
      qb.andWhere(
        '(facultad.id_facultad = :idFacultad OR fratFacultad.id_facultad = :idFacultad)',
        { idFacultad: dto.idFacultad },
      );
    }
    const puedeFiltrarCarrera = esCarrera || (!instancia && dto.idFacultad);
    if (dto.idCarrera && puedeFiltrarCarrera) {
      qb.andWhere(
        '(carrera.id_carrera = :idCarrera OR fratCarrera.id_carrera = :idCarrera)',
        { idCarrera: dto.idCarrera },
      );
    }
    if (dto.idCategoria) {
      qb.andWhere('fratCategoria.id_categoria = :idCategoria', {
        idCategoria: dto.idCategoria,
      });
    }
    if (dto.idTipoDanza) {
      qb.andWhere('fratTipoDanza.id_tipo_danza = :idTipoDanza', {
        idTipoDanza: dto.idTipoDanza,
      });
    }
    if (dto.busqueda?.trim()) {
      qb.andWhere(
        '(LOWER(p.nombre) LIKE LOWER(:q) OR LOWER(frat.nombre) LIKE LOWER(:q) OR LOWER(COALESCE(p.institucion_externa, \'\')) LIKE LOWER(:q))',
        { q: `%${dto.busqueda.trim()}%` },
      );
    }

    const ordenarPor = dto.ordenarPor || 'nombre';
    const orden = dto.orden === 'DESC' ? 'DESC' : 'ASC';
    // Chacha: priorizar fraternidad (+ tipo) en SQL para no separar la pareja
    if (
      dto.plantillaRequisitos === PlantillaConcursoExterno.CHACHA_WARMI ||
      ordenarPor === 'nombreFraternidad'
    ) {
      qb.orderBy('frat.nombre', orden).addOrderBy('p.tipo', 'ASC').addOrderBy('p.nombre', 'ASC');
    } else {
      const orderMap: Record<string, string> = {
        nombre: 'p.nombre',
        nombreFraternidad: 'frat.nombre',
        tipo: 'p.tipo',
        concurso: 'fase.nombre',
        tipoDanza: 'fratTipoDanza.nombre',
        categoria: 'fratCategoria.nombre',
        facultad: 'fratFacultad.nombre',
      };
      qb.orderBy(orderMap[ordenarPor] || 'p.nombre', orden);
    }

    const participantes = await qb.getMany();

    // Inscripciones de las fases involucradas (datos personales)
    const faseIds = [...new Set(participantes.map((p) => p.fase?.idFase).filter(Boolean))];
    const inscs =
      faseIds.length > 0
        ? await this.inscConcursoRepo.find({
            where: { fase: { idFase: In(faseIds as number[]) } },
            relations: ['fraternidad', 'participante', 'participantePareja', 'fase'],
          })
        : [];

    const inscPorParticipante = new Map<number, InscripcionConcurso>();
    for (const insc of inscs) {
      if (insc.participante?.idParticipante) {
        inscPorParticipante.set(insc.participante.idParticipante, insc);
      }
      if (insc.participantePareja?.idParticipante) {
        inscPorParticipante.set(insc.participantePareja.idParticipante, insc);
      }
    }

    const rankTipoPareja = (tipo: string) => {
      const t = String(tipo || '').toLowerCase();
      if (t.includes('chacha')) return 0;
      if (t.includes('warmi') || t.includes('pareja')) return 1;
      return 2;
    };

    const rows = participantes.map((p) => {
      const insc = inscPorParticipante.get(p.idParticipante);
      const datos = (insc?.datos || {}) as Record<string, any>;
      const plantilla = String(p.fase?.plantillaRequisitos || 'generico').toLowerCase();
      const esChacha = plantilla === 'chacha_warmi';
      const esPareja = /warmi|pareja/i.test(String(p.tipo || ''));
      const nombreFraternidad =
        p.fraternidad?.nombre || insc?.fraternidad?.nombre || '—';
      const ci = esPareja ? datos.ciPareja || datos.ci : datos.ci;
      const celular = esPareja ? datos.celularPareja || datos.celular : datos.celular;
      const correo = esPareja ? datos.correoPareja || datos.correo : datos.correo;
      const facultadCarrera =
        (esPareja ? datos.facultadCarreraPareja || datos.facultadCarrera : datos.facultadCarrera) ||
        [p.facultad?.nombre || p.fraternidad?.facultad?.nombre, p.carrera?.nombre || p.fraternidad?.carrera?.nombre]
          .filter(Boolean)
          .join(' — ') ||
        p.institucionExterna ||
        p.fraternidad?.institucionExterna?.nombre ||
        '—';
      const instancia =
        datos.instanciaRepresentacion ||
        p.fraternidad?.nivelRepresentacion ||
        (p.esUmsa ? 'UMSA' : '—');

      return {
        idParticipante: p.idParticipante,
        idInscripcion: insc?.idInscripcion ?? null,
        idFraternidad: p.fraternidad?.idFraternidad || insc?.fraternidad?.idFraternidad || null,
        nombre: p.nombre,
        tipo: p.tipo || 'Participante',
        nombreFraternidad,
        concurso: p.fase?.nombre || '—',
        plantillaRequisitos: plantilla,
        esChacha,
        ci: ci || '—',
        celular: celular || '—',
        correo: correo || '—',
        facultadCarrera,
        instancia,
        tipoDanza: p.fraternidad?.tipoDanza?.nombre || '—',
        categoria: p.fraternidad?.categoria?.nombre || '—',
        estamento: datos.estamento || '—',
        descripcionConceptual: datos.descripcionConceptual || '—',
        institucionExterna:
          p.institucionExterna || p.fraternidad?.institucionExterna?.nombre || '—',
        estadoInscripcion: insc?.estado || '—',
        gestionAnio: p.gestion?.anio || p.fase?.gestion?.anio || null,
        fechaSolicitud: insc?.fechaEnvio || insc?.createdAt || null,
      };
    });

    const gestion = dto.idGestion
      ? await this.gestionRepo.findOne({ where: { idGestion: dto.idGestion } })
      : null;

    // Detectar si el resultado es predominantemente Chacha (para columnas UI/PDF)
    const esReporteChacha =
      dto.plantillaRequisitos === PlantillaConcursoExterno.CHACHA_WARMI ||
      (dto.idFase
        ? rows.length > 0 && rows.every((r) => r.esChacha)
        : rows.length > 0 && rows.every((r) => r.esChacha));

    const tsFecha = (v: any) => (v ? new Date(v).getTime() : 0);
    const desc = orden === 'DESC';

    // Chacha-Warmi: mantener cada pareja junta
    if (esReporteChacha && rows.length > 1) {
      rows.sort((a, b) => {
        if (ordenarPor === 'fechaSolicitud') {
          const fechaCmp = (tsFecha(a.fechaSolicitud) - tsFecha(b.fechaSolicitud)) * (desc ? -1 : 1);
          if (fechaCmp !== 0) return fechaCmp;
        } else {
          const concursoCmp = String(a.concurso || '').localeCompare(String(b.concurso || ''), 'es');
          if (concursoCmp !== 0) return concursoCmp;

          const fratCmp = String(a.nombreFraternidad || '').localeCompare(
            String(b.nombreFraternidad || ''),
            'es',
          );
          if (fratCmp !== 0) return desc ? -fratCmp : fratCmp;
        }

        const idA = a.idInscripcion ?? a.idFraternidad ?? a.idParticipante;
        const idB = b.idInscripcion ?? b.idFraternidad ?? b.idParticipante;
        if (idA !== idB) {
          if (ordenarPor === 'fechaSolicitud') {
            // misma fecha: agrupar por inscripción
            return Number(idA) - Number(idB);
          }
          return Number(idA) - Number(idB);
        }

        const tipoCmp = rankTipoPareja(a.tipo) - rankTipoPareja(b.tipo);
        if (tipoCmp !== 0) return tipoCmp;

        return String(a.nombre || '').localeCompare(String(b.nombre || ''), 'es');
      });
    } else if (ordenarPor === 'fechaSolicitud' && rows.length > 1) {
      rows.sort((a, b) => {
        const cmp = (tsFecha(a.fechaSolicitud) - tsFecha(b.fechaSolicitud)) * (desc ? -1 : 1);
        if (cmp !== 0) return cmp;
        return String(a.nombre || '').localeCompare(String(b.nombre || ''), 'es');
      });
    }

    return {
      tipoReporte: dto.tipoReporte,
      total: rows.length,
      page,
      limit,
      filtros: dto,
      gestion,
      variante: esReporteChacha ? 'chacha_warmi' : 'general',
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
      bufferPages: true,
    });

    const pageW = 841.89;
    const pageH = 595.28;
    const margin = 36;
    const contentW = pageW - margin * 2;
    /** Reserva fija para el pie de página (evita que PDFKit cree hojas en blanco). */
    const footerReserve = 32;
    const bottomLimit = pageH - margin - footerReserve;

    const titulos: Record<string, string> = {
      fraternidades: 'REPORTE DE FRATERNIDADES',
      directiva: 'REPORTE DE DIRECTIVA',
      calificaciones: 'REPORTE DE CALIFICACIONES Y ASIGNACIONES DE NOTAS DE JURADOS',
      disciplina: 'REPORTE DE DISCIPLINA Y SANCIONES',
      costos: 'INFORME DE COSTOS DE PARTICIPACIÓN',
      concursantes_externos: 'REPORTE DE CONCURSANTES EXTERNOS',
    };

    if (dto.tipoReporte === TipoReporte.DIRECTIVA) {
      const cargoLabel = (resultado as any).cargoDirectivaLabel;
      if (cargoLabel && (resultado as any).cargoDirectiva !== 'todos') {
        titulos.directiva = `REPORTE DE DIRECTIVA — ${String(cargoLabel).toUpperCase()}`;
      }
    }

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

    const incidenciaLabel: Record<string, string> = {
      todos: 'Todos los casos',
      AMARILLA: 'Bandera Amarilla',
      ROJA: 'Bandera Roja',
      SANCION_ALCOHOL: 'Sanción: Alcohol',
      SANCION_AGRESION: 'Sanción: Agresividad',
      SANCION_BANDA: 'Sanción: Bandas',
      SANCION_AJENO: 'Sanción: Personal ajeno',
      BANDERAS: 'Banderas (amarilla y roja)',
      SANCIONES_GRAVES: 'Sanciones graves',
    };

    const subtitleParts = [
      (resultado as any).gestion?.anio ? `Gestión ${(resultado as any).gestion.anio}` : null,
      dto.tipoReporte === TipoReporte.FRATERNIDADES && dto.alcanceListado
        ? `Alcance: ${alcanceLabel[dto.alcanceListado] || dto.alcanceListado}`
        : null,
      (dto.tipoReporte === TipoReporte.DISCIPLINA || dto.tipoReporte === TipoReporte.CALIFICACIONES) &&
      dto.tipoIncidencia
        ? `Filtro: ${incidenciaLabel[dto.tipoIncidencia] || dto.tipoIncidencia}`
        : null,
      dto.tipoReporte === TipoReporte.CONCURSANTES_EXTERNOS
        ? (resultado as any).variante === 'chacha_warmi'
          ? 'Chacha-Warmi'
          : dto.plantillaRequisitos && dto.plantillaRequisitos !== PlantillaConcursoExterno.TODOS
            ? `Plantilla: ${dto.plantillaRequisitos}`
            : 'Concursos externos'
        : null,
    ].filter(Boolean);
    const subtitle = subtitleParts.length ? subtitleParts.join(' · ') : undefined;

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
        { width: contentW, lineBreak: false },
      );
    y += 12;
    if (dto.tipoReporte === TipoReporte.CALIFICACIONES) {
      doc
        .fontSize(7)
        .fillColor('#334155')
        .font('Helvetica-Oblique')
        .text(FORMULA_EFU_PROMEDIO + '; final = max(0, Promedio Final + sanciones)', margin, y, {
          width: contentW,
        });
      y += 12;
    }

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
      return Math.min(maxH, 48);
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
          ellipsis: true,
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
          height: rowH - 4,
          align: i === 0 ? 'center' : 'left',
          ellipsis: true,
        });
        x += widths[i];
      });
      drawCellBorders(margin, startY, widths, rowH);
      return rowH;
    };

    const ensureSpace = (needed: number, headers: string[], widths: number[]) => {
      if (y + needed <= bottomLimit) return;
      doc.addPage({ size: 'A4', layout: 'landscape', margin });
      ({ contentStartY } = drawDocHeader());
      y = contentStartY + 4;
      doc
        .fontSize(6.5)
        .fillColor('#64748b')
        .font('Helvetica-Oblique')
        .text(`Continuación — ${titulos[dto.tipoReporte] || 'REPORTE'}`, margin, y, {
          width: contentW,
          lineBreak: false,
        });
      y += 12;
      y += drawTableHeader(headers, widths, y);
    };

    const renderTable = (headers: string[], widths: number[], tableRows: string[][]) => {
      const sum = widths.reduce((a, b) => a + b, 0) || 1;
      const scaled = widths.map((w) => (w / sum) * contentW);

      y += drawTableHeader(headers, scaled, y);
      tableRows.forEach((cells, i) => {
        const previewH = measureRowHeight(cells, scaled, 12);
        ensureSpace(previewH + 2, headers, scaled);
        y += drawDataRow(cells, scaled, y, i % 2 === 0);
      });
    };

    const rows = (resultado.data as any[]) || [];
    const extras = new Set(
      (Array.isArray(dto.columnasOpcionales) ? dto.columnasOpcionales : [])
        .map((c) => String(c || '').toLowerCase().trim())
        .filter(Boolean),
    );

    if (dto.tipoReporte === TipoReporte.FRATERNIDADES) {
      const colDefs: Array<{ key: string; header: string; width: number; cell: (row: any, i: number) => string }> = [
        { key: 'n', header: 'N°', width: 28, cell: (_r, i) => String(i + 1) },
        {
          key: 'nombreFraternidad',
          header: 'Fraternidad',
          width: 170,
          cell: (row) => row.nombreFraternidad || '—',
        },
        {
          key: 'tipoDanza',
          header: 'Tipo de danza',
          width: 120,
          cell: (row) => row.tipoDanza || '—',
        },
        {
          key: 'categoria',
          header: 'Categoría',
          width: 80,
          cell: (row) => row.categoria || '—',
        },
        {
          key: 'pertenencia',
          header: 'Pertenencia',
          width: 180,
          cell: (row) => row.pertenencia || '—',
        },
      ];
      if (extras.has('gestion')) {
        colDefs.push({
          key: 'gestion',
          header: 'Gestión',
          width: 48,
          cell: (row) => String(row.gestionAnio || '—'),
        });
      }
      if (extras.has('cupo')) {
        colDefs.push({
          key: 'cupo',
          header: 'Cupo',
          width: 58,
          cell: (row) =>
            row.estadoInscripcion === 'INSCRITA'
              ? row.esExcedente
                ? 'EXCEDENTE'
                : 'Cupo OK'
              : '—',
        });
      }
      if (extras.has('estado')) {
        colDefs.push({
          key: 'estado',
          header: 'Estado',
          width: 72,
          cell: (row) => row.estadoLabel || row.estadoInscripcion || '—',
        });
      }
      const headers = colDefs.map((c) => c.header);
      const widths = colDefs.map((c) => c.width);
      const dataRows = rows.map((row, i) => colDefs.map((c) => c.cell(row, i)));
      renderTable(headers, widths, dataRows);
    } else if (dto.tipoReporte === TipoReporte.DIRECTIVA) {
      const cargoUnico = (resultado as any).cargoDirectiva && (resultado as any).cargoDirectiva !== 'todos';
      const headers = cargoUnico
        ? ['N°', 'Fraternidad', 'Categoría', `Directiva (${(resultado as any).cargoDirectivaLabel})`, 'CI']
        : ['N°', 'Fraternidad', 'Categoría', 'Cargo', 'Nombre completo', 'CI'];
      const widths = cargoUnico
        ? [28, 160, 110, 220, 90]
        : [28, 140, 100, 110, 180, 80];
      const dataRows = rows.map((row, i) =>
        cargoUnico
          ? [
              String(i + 1),
              row.nombreFraternidad || '—',
              row.categoria || '—',
              row.nombreIntegrante || '—',
              row.ci || '—',
            ]
          : [
              String(i + 1),
              row.nombreFraternidad || '—',
              row.categoria || '—',
              row.cargo || '—',
              row.nombreIntegrante || '—',
              row.ci || '—',
            ],
      );
      renderTable(headers, widths, dataRows);
    } else if (dto.tipoReporte === TipoReporte.DISCIPLINA) {
      const headers = ['N°', 'Fraternidad', 'Tipo', 'Detalle', 'Impacto', 'Fecha', 'Gestión'];
      const widths = [28, 140, 120, 160, 50, 90, 45];
      const dataRows = rows.map((row, i) => [
        String(i + 1),
        row.nombreFraternidad || '—',
        row.tipoLabel || '—',
        row.detalle || '—',
        row.tipoImpacto === 'SUSPENSION' ? 'SUSP.' : String(row.valorImpacto ?? '—'),
        row.fechaHora ? new Date(row.fechaHora).toLocaleString('es-BO') : '—',
        String(row.gestionAnio || '—'),
      ]);
      renderTable(headers, widths, dataRows);
    } else if (dto.tipoReporte === TipoReporte.CONCURSANTES_EXTERNOS) {
      const esChacha = (resultado as any).variante === 'chacha_warmi';
      if (esChacha) {
        const headers = [
          'N°',
          'Concurso',
          'Fraternidad',
          'Rol',
          'Nombre',
          'CI',
          'Celular',
          'Correo',
          'Facultad/Carrera',
        ];
        const widths = [24, 90, 120, 50, 120, 55, 60, 90, 110];
        const dataRows = rows.map((row, i) => [
          String(i + 1),
          row.concurso || '—',
          row.nombreFraternidad || '—',
          row.tipo || '—',
          row.nombre || '—',
          row.ci || '—',
          row.celular || '—',
          row.correo || '—',
          row.facultadCarrera || '—',
        ]);
        renderTable(headers, widths, dataRows);
      } else {
        const headers = [
          'N°',
          'Concurso',
          'Nombre',
          'Tipo',
          'CI',
          'Celular',
          'Correo',
          'Facultad/Carrera',
          'Estamento',
        ];
        const widths = [24, 100, 130, 60, 55, 60, 90, 110, 60];
        const dataRows = rows.map((row, i) => [
          String(i + 1),
          row.concurso || '—',
          row.nombre || '—',
          row.tipo || '—',
          row.ci || '—',
          row.celular || '—',
          row.correo || '—',
          row.facultadCarrera || '—',
          row.estamento || '—',
        ]);
        renderTable(headers, widths, dataRows);
      }
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
    } else if (dto.tipoReporte === TipoReporte.CALIFICACIONES) {
      const fasesEfu: Array<{ idFase: number; nombre: string }> =
        (resultado as any).fasesEfu || [];
      const faseHeaders = fasesEfu.map((f) =>
        String(f.nombre || 'Fase')
          .toUpperCase()
          .slice(0, 14),
      );
      const headers = [
        'NRO',
        'CATEGORIA',
        'FRATERNIDAD',
        'DANZA',
        'JURADO',
        ...faseHeaders,
        'SANCIONES',
        'TOTAL EFU',
        'CHACHA WARMI',
      ];
      // Anchos relativos; se escalan a contentW
      const baseW = [28, 42, 95, 70, 90, ...fasesEfu.map(() => 48), 48, 50, 52];
      const sumW = baseW.reduce((a, b) => a + b, 0) || 1;
      const widths = baseW.map((w) => (w / sumW) * contentW);

      const fmtNota = (v: any) =>
        v === null || v === undefined || v === '' ? '—' : Number(v).toFixed(2);

      const drawMatrixRow = (
        cells: string[],
        startY: number,
        opts: { highlight?: boolean; bold?: boolean } = {},
      ) => {
        const rowH = measureRowHeight(cells, widths, 11);
        if (opts.highlight) {
          doc.save().rect(margin, startY, contentW, rowH).fill('#fef08a').restore();
        }
        let x = margin;
        doc
          .font(opts.bold || opts.highlight ? 'Helvetica-Bold' : 'Helvetica')
          .fontSize(fontSize)
          .fillColor('#0f172a');
        cells.forEach((cell, i) => {
          doc.text(String(cell ?? '—'), x + 2, startY + 2, {
            width: widths[i] - 4,
            height: rowH - 3,
            align: i === 0 ? 'center' : 'left',
            ellipsis: true,
          });
          x += widths[i];
        });
        drawCellBorders(margin, startY, widths, rowH);
        return rowH;
      };

      y += drawTableHeader(headers, widths, y);

      for (const grupo of rows) {
        const jurados = Array.isArray(grupo.jurados) ? grupo.jurados : [];
        const filasJurado = jurados.length ? jurados : [null];

        for (let ji = 0; ji < filasJurado.length; ji++) {
          const j = filasJurado[ji];
          const primera = ji === 0;
          const notasFase = fasesEfu.map((f) =>
            j ? fmtNota(j.notasPorFase?.[f.idFase]) : '—',
          );
          const cells = [
            primera ? String(grupo.nro ?? grupo.puesto ?? '—') : '',
            primera ? String(grupo.categoria || '—') : '',
            primera ? String(grupo.nombreFraternidad || '—') : '',
            primera ? String(grupo.tipoDanza || '—') : '',
            j ? String(j.juradoNombre || '—') : '—',
            ...notasFase,
            '',
            j ? fmtNota(j.totalEfu) : '—',
            '',
          ];
          const previewH = measureRowHeight(cells, widths, 11);
          ensureSpace(previewH + 14, headers, widths);
          y += drawMatrixRow(cells, y, {});
        }

        const resumenCells = [
          '',
          '',
          '',
          '',
          'PROMEDIO FINAL',
          ...fasesEfu.map(() => ''),
          grupo.suspendida
            ? 'SUSP.'
            : fmtNota(grupo.impactoSanciones),
          fmtNota(grupo.promedioFinal),
          grupo.chachaWarmi?.nota != null ? fmtNota(grupo.chachaWarmi.nota) : '—',
        ];
        const previewResumen = measureRowHeight(resumenCells, widths, 11);
        ensureSpace(previewResumen + 4, headers, widths);
        y += drawMatrixRow(resumenCells, y, { highlight: true, bold: true });

        if (grupo.detalleSanciones && grupo.detalleSanciones !== '—') {
          const detalle = `Sanciones: ${grupo.detalleSanciones} · Final: ${fmtNota(grupo.puntajeFinal)}`;
          const detH = 10;
          ensureSpace(detH + 2, headers, widths);
          doc
            .fontSize(5.5)
            .fillColor('#64748b')
            .font('Helvetica-Oblique')
            .text(detalle, margin + 2, y, { width: contentW - 4, lineBreak: false });
          y += detH;
        }
      }
    } else {
      const headers = [
        'N°',
        'Puesto',
        'Fraternidad',
        'Tipo de danza',
        'Categoría',
        'Pertenencia',
        'Prom. Final',
        'Sanciones',
        'Final',
      ];
      const widths = [28, 36, 130, 95, 65, 130, 55, 70, 45];
      const dataRows = rows.map((row, i) => [
        String(i + 1),
        String(row.puesto ?? '—'),
        row.nombreFraternidad || '—',
        row.tipoDanza || '—',
        row.categoria || '—',
        row.pertenencia || '—',
        String(row.promedioFinal ?? row.promedioJurado ?? '—'),
        row.suspendida
          ? `SUSP. ${row.detalleSanciones && row.detalleSanciones !== '—' ? row.detalleSanciones : ''}`.trim()
          : String(row.impactoSanciones ?? '—'),
        String(row.puntajeFinal ?? '—'),
      ]);
      renderTable(headers, widths, dataRows);
    }

    // Numeración al final sobre páginas reales (sin hojas fantasma).
    const range = doc.bufferedPageRange();
    for (let i = 0; i < range.count; i++) {
      doc.switchToPage(range.start + i);
      doc
        .fontSize(7)
        .fillColor('#94a3b8')
        .font('Helvetica')
        .text(`Página ${i + 1} de ${range.count}`, margin, pageH - margin - 12, {
          width: contentW,
          align: 'center',
          lineBreak: false,
        });
    }

    doc.end();
  }

  /** Excel (.xlsx) de la misma consulta (hasta 5000 filas). */
  async generarExcelConsulta(dto: ConsultarReporteDto, res: Response) {
    const resultado = await this.consultar({ ...dto, page: 1, limit: 500 });
    const ExcelJS = require('exceljs');
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Entrada Universitaria EFU';
    workbook.created = new Date();

    const sheetName =
      dto.tipoReporte === TipoReporte.DIRECTIVA
        ? (resultado as any).cargoDirectiva !== 'todos'
          ? String((resultado as any).cargoDirectivaLabel || 'Directiva').slice(0, 28)
          : 'Directiva'
        : String(dto.tipoReporte).slice(0, 28);
    const sheet = workbook.addWorksheet(sheetName || 'Reporte');
    const rows = resultado.data || [];

    if (dto.tipoReporte === TipoReporte.DIRECTIVA) {
      const cargoUnico = (resultado as any).cargoDirectiva && (resultado as any).cargoDirectiva !== 'todos';
      const cargoLabel = (resultado as any).cargoDirectivaLabel || 'Cargo';
      if (cargoUnico) {
        sheet.columns = [
          { header: 'N°', key: 'n', width: 6 },
          { header: 'Fraternidad', key: 'fraternidad', width: 36 },
          { header: 'Categoría', key: 'categoria', width: 18 },
          { header: `Directiva (${cargoLabel})`, key: 'nombre', width: 40 },
          { header: 'CI', key: 'ci', width: 16 },
        ];
        rows.forEach((row: any, i: number) => {
          sheet.addRow({
            n: i + 1,
            fraternidad: row.nombreFraternidad || '—',
            categoria: row.categoria || '—',
            nombre: row.nombreIntegrante || '—',
            ci: row.ci || '—',
          });
        });
      } else {
        sheet.columns = [
          { header: 'N°', key: 'n', width: 6 },
          { header: 'Fraternidad', key: 'fraternidad', width: 32 },
          { header: 'Categoría', key: 'categoria', width: 16 },
          { header: 'Cargo', key: 'cargo', width: 22 },
          { header: 'Nombre completo', key: 'nombre', width: 36 },
          { header: 'CI', key: 'ci', width: 16 },
        ];
        rows.forEach((row: any, i: number) => {
          sheet.addRow({
            n: i + 1,
            fraternidad: row.nombreFraternidad || '—',
            categoria: row.categoria || '—',
            cargo: row.cargo || '—',
            nombre: row.nombreIntegrante || '—',
            ci: row.ci || '—',
          });
        });
      }
    } else {
      // Genérico: exportar claves de la primera fila
      const sample = rows[0] || {};
      const keys = Object.keys(sample).filter((k) => typeof sample[k] !== 'object');
      sheet.columns = [
        { header: 'N°', key: '__n', width: 6 },
        ...keys.map((k) => ({ header: k, key: k, width: 18 })),
      ];
      rows.forEach((row: any, i: number) => {
        const out: any = { __n: i + 1 };
        for (const k of keys) out[k] = row[k] == null || row[k] === '' ? '—' : String(row[k]);
        sheet.addRow(out);
      });
    }

    const headerRow = sheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF003399' },
    };
    headerRow.alignment = { vertical: 'middle', wrapText: true };

    const cargoSuffix =
      dto.tipoReporte === TipoReporte.DIRECTIVA && (resultado as any).cargoDirectiva !== 'todos'
        ? `_${(resultado as any).cargoDirectiva}`
        : '';
    const filename = `Reporte_${dto.tipoReporte}${cargoSuffix}_${Date.now()}.xlsx`;
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
    await workbook.xlsx.write(res);
    res.end();
  }
}
