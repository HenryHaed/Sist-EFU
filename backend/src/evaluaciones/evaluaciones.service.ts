import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not, In, DataSource } from 'typeorm';
import { Evaluacion } from '../entities/Evaluacion';
import { Jurado } from '../entities/Jurado';
import { Fase } from '../entities/Fase';
import { Fraternidad } from '../entities/Fraternidad';
import { DocumentoFraternidad } from '../entities/DocumentoFraternidad';
import { Criterio } from '../entities/Criterio';
import { Gestion } from '../entities/Gestion';
import { Categoria } from '../entities/Categoria';
import { Participante } from '../entities/Participante';
import { DocumentoGestion } from '../entities/DocumentoGestion';
import { Incidencia } from '../entities/Incidencia';
import { Infraccion } from '../entities/Infraccion';
import { Usuario } from '../entities/Usuario';
import { SolicitudInscripcion, EstadoSolicitud } from '../entities/SolicitudInscripcion';
import { InscripcionConcurso } from '../entities/InscripcionConcurso';
import { DesempateFase, TipoDesempate, EstadoDesempate } from '../entities/DesempateFase';
import { DesempateCandidato, DecisionDesempate } from '../entities/DesempateCandidato';
import { findGestionActivaOrLatest } from '../common/gestion.utils';
import { ensureCategoriasDefault } from '../common/categorias-default';
import { drawPdfInstitutionalHeader } from '../common/pdf-layout';
import { recalcularExcedentesGestion } from '../common/cupo-fraternidades';
import { compareFechaAsc, compareTextoEs } from '../common/orden-por-fecha';
import { esFaseChachaWarmi } from '../common/requisitos-concurso';
import {
  actaDesdeEvaluacion,
  calcularScoresEfu,
  FORMULA_EFU_PROMEDIO,
  nombreJuradoDesdeUsuario,
  round2,
} from './efu-scoring';

@Injectable()
export class EvaluacionesService {
  constructor(
    @InjectRepository(Evaluacion)
    private readonly evaluacionRepo: Repository<Evaluacion>,
    @InjectRepository(Jurado)
    private readonly juradoRepo: Repository<Jurado>,
    @InjectRepository(Fase)
    private readonly faseRepo: Repository<Fase>,
    @InjectRepository(Fraternidad)
    private readonly fraternidadRepo: Repository<Fraternidad>,
    @InjectRepository(DocumentoFraternidad)
    private readonly documentoRepo: Repository<DocumentoFraternidad>,
    @InjectRepository(Criterio)
    private readonly criterioRepo: Repository<Criterio>,
    @InjectRepository(Gestion)
    private readonly gestionRepo: Repository<Gestion>,
    @InjectRepository(Categoria)
    private readonly categoriaRepo: Repository<Categoria>,
    @InjectRepository(Participante)
    private readonly participanteRepo: Repository<Participante>,
    @InjectRepository(DocumentoGestion)
    private readonly documentoGestionRepo: Repository<DocumentoGestion>,
    @InjectRepository(Incidencia)
    private readonly incidenciaRepo: Repository<Incidencia>,
    @InjectRepository(Infraccion)
    private readonly infraccionRepo: Repository<Infraccion>,
    @InjectRepository(Usuario)
    private readonly usuarioRepo: Repository<Usuario>,
    @InjectRepository(SolicitudInscripcion)
    private readonly solicitudRepo: Repository<SolicitudInscripcion>,
    @InjectRepository(InscripcionConcurso)
    private readonly inscConcursoRepo: Repository<InscripcionConcurso>,
    @InjectRepository(DesempateFase)
    private readonly desempateRepo: Repository<DesempateFase>,
    @InjectRepository(DesempateCandidato)
    private readonly desempateCandRepo: Repository<DesempateCandidato>,
    private readonly dataSource: DataSource,
  ) {}

  // 0. Obtener jurados para asignar fases
  async getJuradosDisponibles() {
      return this.juradoRepo.find({
          relations: ['usuario', 'usuario.rol']
      });
  }

  // 0b. Listar todas las gestiones para la vista maestro
  async getGestiones() {
    const gestiones = await this.gestionRepo.find({ order: { anio: 'DESC' } });
    const result = await Promise.all(gestiones.map(async (g) => {
      const fases = await this.faseRepo.find({ where: { gestion: { idGestion: g.idGestion } } });
      const pesoEFU = fases.filter(f => f.tipoConcurso === 'EFU').reduce((s, f) => s + Number(f.pesoPorcentaje), 0);
      return {
        ...g,
        cantidadFases: fases.length,
        fasesEFU: fases.filter(f => f.tipoConcurso === 'EFU').length,
        fasesExternas: fases.filter(f => f.tipoConcurso === 'EXTERNO').length,
        pesoEFUTotal: pesoEFU,
        disponibleEFU: Math.max(0, 100 - pesoEFU),
      };
    }));
    return result;
  }

  // 0c. Fases de una gestión con resumen EFU
  async getFasesPorGestion(idGestion: number) {
    const gestion = await this.gestionRepo.findOne({ where: { idGestion } });
    if (!gestion) throw new NotFoundException('Gestión no encontrada');

    const fases = await this.faseRepo.find({
      where: { gestion: { idGestion } },
      relations: ['fasePadre'],
      order: { idFase: 'ASC' }
    });

    const todosJurados = await this.juradoRepo.find({ relations: ['fasesHabilitadas', 'usuario', 'usuario.rol'] });
    fases.forEach(f => {
      (f as any).jurados = todosJurados.filter(j => j.fasesHabilitadas.some(hf => hf.idFase === f.idFase));
    });

    const pesoEFUTotal = fases.filter(f => f.tipoConcurso === 'EFU').reduce((s, f) => s + Number(f.pesoPorcentaje), 0);

    return {
      gestion: { idGestion: gestion.idGestion, anio: gestion.anio, activa: gestion.activa, lema: gestion.lema },
      pesoEFUTotal,
      disponibleEFU: Math.max(0, 100 - pesoEFUTotal),
      fases: fases.map(f => ({
        idFase: f.idFase,
        nombre: f.nombre,
        tipoConcurso: f.tipoConcurso || 'EFU',
        pesoPorcentaje: f.pesoPorcentaje,
        fechaInicio: f.fechaInicio,
        fechaFin: f.fechaFin,
        fechaInicioInscripcion: f.fechaInicioInscripcion || null,
        fechaFinInscripcion: f.fechaFinInscripcion || null,
        estaActiva: f.estaActiva,
        urlImagen: f.urlImagen,
        plantillaRequisitos: f.plantillaRequisitos || null,
        requisitosInscripcion: f.requisitosInscripcion || null,
        cupoFinalistas: f.cupoFinalistas ?? null,
        idFasePadre: f.fasePadre?.idFase ?? (f as any).idFasePadre ?? null,
        fasePadreNombre: f.fasePadre?.nombre ?? null,
        jurados: (f as any).jurados || [],
      }))
    };
  }

  // 1. Obtener Fases asignadas (para Jurado) o Todas (para Admin/SuperAdmin)
  async getFasesJurado(idUsuario: number, rol: string) {
    try {
      let fases: Fase[] = [];
      const ahora = new Date();

      if (rol === 'superusuario' || rol === 'admin') {
        const gestionActiva = await this.getGestionActiva();
        const whereFases: any = { estaActiva: true };
        if (gestionActiva) {
          whereFases.gestion = { idGestion: gestionActiva.idGestion };
        }
        fases = await this.faseRepo.find({
          where: whereFases,
          order: { idFase: 'ASC' },
          relations: ['gestion', 'fasePadre'],
        });
        const todosJurados = await this.juradoRepo.find({ 
          relations: ['fasesHabilitadas', 'usuario', 'usuario.rol'] 
        });
        fases.forEach(f => {
           (f as any).jurados = todosJurados
            .filter(j => j.fasesHabilitadas.some(hf => hf.idFase === f.idFase))
            .map(j => ({
              idJurado: j.idJurado,
              nombre: j.usuario ? `${j.usuario.nombres} ${j.usuario.primerApellido}` : 'Sin nombre',
              usuario: j.usuario
            }));
        });
      } else if (rol === 'delegado') {
        const gestionActiva = await this.getGestionActiva();
        if (gestionActiva) {
          fases = await this.faseRepo.find({
            where: { 
              gestion: { idGestion: gestionActiva.idGestion },
              tipoConcurso: 'EXTERNO',
              estaActiva: true 
            },
            order: { idFase: 'ASC' }
          });
        }
      } else if (rol === 'jurado' || rol === 'controladorhcu') {
        const gestionActiva = await this.getGestionActiva();
        const jurado = await this.juradoRepo.findOne({
          where: { usuario: { idUsuario } },
          relations: ['fasesHabilitadas', 'fasesHabilitadas.gestion'],
        });
        if (!jurado) return [];
        fases = jurado.fasesHabilitadas.filter((f) => {
          if (!f.estaActiva) return false;
          if (!gestionActiva) return true;
          return f.gestion?.idGestion === gestionActiva.idGestion;
        });
      }

      return fases.map(fase => {
        const isActivaGlobal = fase.estaActiva;
        const isVigente = (!fase.fechaInicio || new Date(fase.fechaInicio) <= ahora) && (!fase.fechaFin || new Date(fase.fechaFin) >= ahora);
        const adminAcceso = (rol === 'superusuario' || rol === 'admin');

        return {
          idFase: fase.idFase,
          nombre: fase.nombre,
          urlImagen: fase.urlImagen,
          pesoPorcentaje: fase.pesoPorcentaje,
          tipoConcurso: fase.tipoConcurso || 'EFU',
          categoriaEfu: fase.categoriaEfu || null,
          plantillaRequisitos: fase.plantillaRequisitos || null,
          cupoFinalistas: fase.cupoFinalistas ?? null,
          idFasePadre: fase.fasePadre?.idFase ?? null,
          fechaInicio: fase.fechaInicio,
          fechaFin: fase.fechaFin,
          jurados: (fase as any).jurados || [],
          accesible: adminAcceso ? true : (isActivaGlobal && isVigente),
          mensajeBloqueo: adminAcceso ? null : (!isActivaGlobal ? 'Fase inactiva.' : (!isVigente ? 'Fuera de fecha.' : null))
        };
      });
    } catch (e: any) {
      throw new Error("TRACE: " + e.message);
    }
  }

  private async getValidadorJurado(idUsuario: number, rol: string, idFase: number) {
    const isAdmin = (rol === 'superusuario' || rol === 'admin');
    let jurado = await this.juradoRepo.findOne({
      where: { usuario: { idUsuario } },
      relations: ['fasesHabilitadas', 'fraternidadesHabilitadas']
    });

    if (!jurado) {
      if (isAdmin) {
         const gestion = await this.gestionRepo.findOne({ where: { activa: true } });
         const nuevoJurado = this.juradoRepo.create({ usuario: { idUsuario }, tipoOrigen: 'Admin Bypass', gestion: gestion });
         jurado = await this.juradoRepo.save(nuevoJurado);
      } else throw new ForbiddenException('Perfil de jurado no encontrado.');
    }

    if (!isAdmin) {
       const fullJurado = await this.juradoRepo.findOne({ where: { idJurado: jurado.idJurado }, relations: ['fasesHabilitadas'] });
       if (!fullJurado || !fullJurado.fasesHabilitadas.some(f => f.idFase === idFase)) {
         throw new ForbiddenException('Sin permiso para esta fase.');
       }
    }
    return jurado;
  }

  async getFraternidadesPorFase(idUsuario: number, rol: string, idFase: number) {
    const jurado = await this.getValidadorJurado(idUsuario, rol, idFase);
    const fase = await this.faseRepo.findOne({ 
      where: { idFase },
      relations: ['gestion', 'fasePadre'],
    });
    if (!fase) throw new NotFoundException('Fase no encontrada');

    if (fase.tipoConcurso === 'EXTERNO') {
      const esChacha = esFaseChachaWarmi(fase);

      // Chacha-Warmi: calificación por fraternidad (una nota por pareja)
      if (esChacha) {
        const participantes = await this.participanteRepo.find({
          where: { fase: { idFase } },
          relations: ['fraternidad'],
          order: { nombre: 'ASC' },
        });
        const evaluaciones = await this.evaluacionRepo.find({
          where: { jurado: { idJurado: jurado.idJurado }, fase: { idFase } },
          relations: ['fraternidad'],
        });
        const mapEv = new Map(
          evaluaciones
            .filter((ev) => ev.fraternidad?.idFraternidad)
            .map((ev) => [ev.fraternidad!.idFraternidad, ev]),
        );

        const inscs = await this.inscConcursoRepo.find({
          where: { fase: { idFase } },
          relations: ['fraternidad', 'participante', 'participantePareja'],
        });
        const metaPorFrat = new Map<
          number,
          { fechaSolicitud: Date | null; instancia: string | null; nombres: string[] }
        >();
        for (const insc of inscs) {
          const fid = insc.fraternidad?.idFraternidad;
          if (!fid) continue;
          const nombres = [
            insc.participante?.nombre,
            insc.participantePareja?.nombre,
          ].filter(Boolean) as string[];
          metaPorFrat.set(fid, {
            fechaSolicitud: insc.fechaEnvio || insc.createdAt || null,
            instancia: insc.fraternidad?.nivelRepresentacion || null,
            nombres,
          });
        }

        const byFrat = new Map<
          number,
          {
            idFraternidad: number;
            nombre: string;
            nombresPareja: string[];
            instanciaRepresentacion: string | null;
            fechaSolicitud: Date | null;
          }
        >();
        for (const p of participantes) {
          const fid = p.fraternidad?.idFraternidad;
          if (!fid) continue;
          if (!byFrat.has(fid)) {
            const meta = metaPorFrat.get(fid);
            byFrat.set(fid, {
              idFraternidad: fid,
              nombre: p.fraternidad!.nombre,
              nombresPareja: meta?.nombres?.length
                ? [...meta.nombres]
                : [],
              instanciaRepresentacion:
                meta?.instancia || p.fraternidad?.nivelRepresentacion || null,
              fechaSolicitud: meta?.fechaSolicitud || p.createdAt || null,
            });
          }
          const g = byFrat.get(fid)!;
          if (p.nombre && !g.nombresPareja.includes(p.nombre)) {
            g.nombresPareja.push(p.nombre);
          }
        }

        const listado = Array.from(byFrat.values()).map((g) => {
          const ev = mapEv.get(g.idFraternidad);
          return {
            idFraternidad: g.idFraternidad,
            nombre: g.nombre,
            nombresPareja: g.nombresPareja,
            instanciaRepresentacion: g.instanciaRepresentacion,
            fechaSolicitud: g.fechaSolicitud,
            modoCalificacion: 'fraternidad' as const,
            estadoEvaluacion: ev ? ev.estado : 'PENDIENTE',
            idEvaluacion: ev ? ev.idEvaluacion : null,
            puntajeActual: ev ? ev.puntajeTotal : 0,
            fechaApertura: ev?.fechaApertura || null,
            fechaCierre: ev?.fechaCierre || null,
          };
        });

        listado.sort((a, b) => {
          const byFecha = compareFechaAsc(a.fechaSolicitud, b.fechaSolicitud);
          if (byFecha !== 0) return byFecha;
          const byNombre = compareTextoEs(a.nombre, b.nombre);
          if (byNombre !== 0) return byNombre;
          return a.idFraternidad - b.idFraternidad;
        });

        return {
          fase: {
            idFase: fase.idFase,
            nombre: fase.nombre,
            tipoConcurso: 'EXTERNO',
            categoriaEfu: fase.categoriaEfu || null,
            plantillaRequisitos: fase.plantillaRequisitos || null,
            cupoFinalistas: fase.cupoFinalistas ?? null,
            idFasePadre: (fase as any).fasePadre?.idFase ?? null,
            modoCalificacion: 'fraternidad',
          },
          listado,
        };
      }

      const participantes = await this.participanteRepo.find({
        where: { fase: { idFase } },
        relations: ['fraternidad'],
        order: { nombre: 'ASC' },
      });
      const evaluaciones = await this.evaluacionRepo.find({
        where: { jurado: { idJurado: jurado.idJurado }, fase: { idFase } },
        relations: ['participante'],
      });
      const mapEv = new Map(evaluaciones.map(ev => [ev.participante?.idParticipante, ev]));

      const inscs = await this.inscConcursoRepo.find({
        where: { fase: { idFase } },
        relations: ['participante', 'participantePareja', 'fraternidad'],
      });
      const metaPorParticipante = new Map<
        number,
        { fechaSolicitud: Date | null; instancia: string | null }
      >();
      for (const insc of inscs) {
        const fecha = insc.fechaEnvio || insc.createdAt || null;
        const instancia =
          insc.fraternidad?.nivelRepresentacion ||
          (insc.datos as any)?.instanciaRepresentacion ||
          null;
        const ids = [
          insc.participante?.idParticipante,
          insc.participantePareja?.idParticipante,
        ].filter(Boolean) as number[];
        for (const pid of ids) {
          if (!metaPorParticipante.has(pid)) {
            metaPorParticipante.set(pid, { fechaSolicitud: fecha, instancia });
          }
        }
      }

      const listado = participantes.map(p => {
        const ev = mapEv.get(p.idParticipante);
        const meta = metaPorParticipante.get(p.idParticipante);
        return {
          idParticipante: p.idParticipante,
          nombre: p.nombre,
          tipo: p.tipo,
          idFraternidad: p.fraternidad?.idFraternidad ?? null,
          fraternidad: p.fraternidad?.nombre || 'Sin fraternidad',
          instanciaRepresentacion:
            meta?.instancia || p.fraternidad?.nivelRepresentacion || null,
          fechaSolicitud: meta?.fechaSolicitud || p.createdAt || null,
          modoCalificacion: 'participante' as const,
          estadoEvaluacion: ev ? ev.estado : 'PENDIENTE',
          idEvaluacion: ev ? ev.idEvaluacion : null,
          puntajeActual: ev ? ev.puntajeTotal : 0,
          fechaApertura: ev?.fechaApertura || null,
          fechaCierre: ev?.fechaCierre || null,
        };
      });

      listado.sort((a, b) => {
        const byFecha = compareFechaAsc(a.fechaSolicitud, b.fechaSolicitud);
        if (byFecha !== 0) return byFecha;
        const byNombre = compareTextoEs(a.nombre, b.nombre);
        if (byNombre !== 0) return byNombre;
        return a.idParticipante - b.idParticipante;
      });

      return {
        fase: {
          idFase: fase.idFase,
          nombre: fase.nombre,
          tipoConcurso: 'EXTERNO',
          categoriaEfu: fase.categoriaEfu || null,
          plantillaRequisitos: fase.plantillaRequisitos || null,
          modoCalificacion: 'participante',
        },
        listado,
      };
    }

    let fraternidades: Fraternidad[];
    const idGestionFase = fase.gestion?.idGestion || (await this.getGestionActiva())?.idGestion;
    if (jurado.fraternidadesHabilitadas && jurado.fraternidadesHabilitadas.length > 0) {
      // Releer desde BD para no servir nombres stale de la relación M2M en memoria
      const ids = jurado.fraternidadesHabilitadas.map((f) => f.idFraternidad);
      fraternidades = await this.fraternidadRepo.find({
        where: { idFraternidad: In(ids), habilitadoEfu: true },
        relations: ['categoria'],
        order: { nombre: 'ASC' },
      });
    } else {
      fraternidades = await this.fraternidadRepo.find({
        where: {
          habilitadoEfu: true,
          ...(idGestionFase ? { gestion: { idGestion: idGestionFase } } : {}),
        },
        relations: ['categoria'],
        order: { nombre: 'ASC' },
      });
    }

    const idsFrat = fraternidades.map((f) => f.idFraternidad);
    const metaPorFrat = new Map<
      number,
      { fechaSolicitud: Date; instanciaRepresentacion: string | null }
    >();
    if (idsFrat.length) {
      const solicitudes = await this.solicitudRepo.find({
        where: {
          estado: EstadoSolicitud.APROBADO,
          fraternidadCreada: { idFraternidad: In(idsFrat) },
        },
        relations: ['fraternidadCreada'],
        order: { createdAt: 'ASC' },
      });
      for (const sol of solicitudes) {
        const fid = sol.fraternidadCreada?.idFraternidad;
        if (!fid || metaPorFrat.has(fid)) continue;
        metaPorFrat.set(fid, {
          fechaSolicitud: sol.createdAt,
          instanciaRepresentacion: sol.instanciaRepresentacion || null,
        });
      }
    }

    const evaluadas = await this.evaluacionRepo.find({ where: { jurado: { idJurado: jurado.idJurado }, fase: { idFase } }, relations: ['fraternidad'] });
    const mapEv = new Map(evaluadas.map(ev => [ev.fraternidad?.idFraternidad, ev]));

    // Obtener incidencias/penalizaciones
    const idGestion = fase.gestion?.idGestion || (await this.getGestionActiva())?.idGestion;
    const incidencias = await this.incidenciaRepo.find({
      where: { 
        gestion: { idGestion },
        fraternidad: In(fraternidades.map(f => f.idFraternidad))
      },
      relations: ['fraternidad', 'infraccion']
    });

    const mapInc = new Map<number, any[]>();
    incidencias.forEach(inc => {
      const fid = inc.fraternidad.idFraternidad;
      if (!mapInc.has(fid)) mapInc.set(fid, []);
      mapInc.get(fid).push({
        idIncidencia: inc.idIncidencia,
        nombre: inc.infraccion?.nombre,
        valor: Number(inc.infraccion?.valorImpacto || 0),
        tipoImpacto: inc.infraccion?.tipoImpacto || 'RESTA_PUNTOS',
        fecha: inc.fechaHora
      });
    });

    const listado = fraternidades.map(frat => {
      const ev = mapEv.get(frat.idFraternidad);
      const penalties = mapInc.get(frat.idFraternidad) || [];
      const totalPenalties = penalties.reduce((acc, p) => acc + p.valor, 0);
      const meta = metaPorFrat.get(frat.idFraternidad);
      
      let score = ev?.puntajeTotal || 0;
      score = Math.max(0, Number(score) + totalPenalties);

      return { 
        idFraternidad: frat.idFraternidad, 
        nombre: frat.nombre,
        categoria: (frat as any).categoria?.nombre || null,
        instanciaRepresentacion:
          meta?.instanciaRepresentacion || frat.nivelRepresentacion || null,
        fechaSolicitud: meta?.fechaSolicitud || frat.createdAt || null,
        idEvaluacion: ev?.idEvaluacion || null, 
        estadoEvaluacion: ev?.estado || 'PENDIENTE', 
        puntajeActual: score,
        penalizaciones: penalties,
        suspendida: penalties.some((p) => p.tipoImpacto === 'SUSPENSION'),
        fechaApertura: ev?.fechaApertura || null,
        fechaCierre: ev?.fechaCierre || null,
      };
    });

    listado.sort((a, b) => {
      const byFecha = compareFechaAsc(a.fechaSolicitud, b.fechaSolicitud);
      if (byFecha !== 0) return byFecha;
      const byNombre = compareTextoEs(a.nombre, b.nombre);
      if (byNombre !== 0) return byNombre;
      return a.idFraternidad - b.idFraternidad;
    });

    return {
      fase: { idFase: fase.idFase, nombre: fase.nombre, tipoConcurso: 'EFU', categoriaEfu: fase.categoriaEfu || null },
      listado,
    };
  }

  async getCriteriosPorFase(idFase: number) {
    return this.criterioRepo.find({ where: { fase: { idFase } }, order: { idCriterio: 'ASC' } });
  }

  async getEvaluacionActual(idUsuario: number, rol: string, idFase: number, args: { idFraternidad?: number, idParticipante?: number }) {
    const jurado = await this.getValidadorJurado(idUsuario, rol, idFase);
    if (args.idFraternidad) {
      const frat = await this.fraternidadRepo.findOne({ where: { idFraternidad: args.idFraternidad } });
      if (!frat?.habilitadoEfu) {
        throw new ForbiddenException('Esta fraternidad aún no está habilitada para calificación.');
      }
    }
    const where: any = { jurado: { idJurado: jurado.idJurado }, fase: { idFase } };
    if (args.idParticipante) where.participante = { idParticipante: args.idParticipante };
    else if (args.idFraternidad) where.fraternidad = { idFraternidad: args.idFraternidad };
    return this.evaluacionRepo.findOne({ where, relations: ['participante', 'fraternidad'] });
  }

  private esCalificadorAdmin(jurado?: Jurado | null): boolean {
    const rol = String(jurado?.usuario?.rol?.nombre || '').toLowerCase();
    if (rol === 'admin' || rol === 'superusuario') return true;
    const origen = String(jurado?.tipoOrigen || '').toLowerCase();
    if (origen.includes('admin') || origen.includes('bypass')) return true;
    return false;
  }

  /**
   * Resumen de todas las actas de una fraternidad o participante en una fase (solo admin/super).
   */
  async getResumenCalificacionesAdmin(
    idFase: number,
    opts: { idFraternidad?: number; idParticipante?: number },
  ) {
    const { idFraternidad, idParticipante } = opts;
    if ((!idFraternidad && !idParticipante) || (idFraternidad && idParticipante)) {
      throw new BadRequestException('Indica idFraternidad o idParticipante, no ambos.');
    }

    const fase = await this.faseRepo.findOne({ where: { idFase } });
    if (!fase) throw new NotFoundException('Fase no encontrada');

    const criterios = await this.getCriteriosPorFase(idFase);
    const mapCriterio = new Map(criterios.map((c) => [c.idCriterio, c]));

    let sujeto: Record<string, any>;
    const where: any = { fase: { idFase } };

    if (idParticipante) {
      const participante = await this.participanteRepo.findOne({
        where: { idParticipante },
        relations: ['fraternidad'],
      });
      if (!participante) throw new NotFoundException('Participante no encontrado');
      sujeto = {
        tipo: 'participante',
        idParticipante: participante.idParticipante,
        nombre: participante.nombre,
        tipoParticipante: participante.tipo || null,
        fraternidad: participante.fraternidad?.nombre || null,
        idFraternidad: participante.fraternidad?.idFraternidad ?? null,
      };
      where.participante = { idParticipante };
    } else {
      const frat = await this.fraternidadRepo.findOne({
        where: { idFraternidad },
        relations: ['categoria'],
      });
      if (!frat) throw new NotFoundException('Fraternidad no encontrada');
      sujeto = {
        tipo: 'fraternidad',
        idFraternidad: frat.idFraternidad,
        nombre: frat.nombre,
        categoria: frat.categoria?.nombre || null,
      };
      where.fraternidad = { idFraternidad };
    }

    const evaluaciones = await this.evaluacionRepo.find({
      where,
      relations: ['jurado', 'jurado.usuario', 'jurado.usuario.rol'],
      order: { puntajeTotal: 'DESC', updatedAt: 'DESC' },
    });

    const calificaciones = evaluaciones.map((ev) => {
      const esAdmin = this.esCalificadorAdmin(ev.jurado);
      const rolNombre = String(ev.jurado?.usuario?.rol?.nombre || '').toLowerCase();
      const criteriosDetalle = Object.entries(ev.criteriosEvaluados || {}).map(([id, valor]) => {
        const crit = mapCriterio.get(Number(id));
        return {
          idCriterio: Number(id),
          nombre: crit?.nombre || `Criterio #${id}`,
          puntaje: Number(valor) || 0,
          puntajeMaximo: crit?.puntajeMaximo != null ? Number(crit.puntajeMaximo) : null,
        };
      });

      return {
        idEvaluacion: ev.idEvaluacion,
        idJurado: ev.jurado?.idJurado ?? null,
        idUsuario: ev.jurado?.usuario?.idUsuario ?? null,
        juradoNombre: nombreJuradoDesdeUsuario(ev.jurado),
        ci: ev.jurado?.usuario?.ci || null,
        rolUsuario: rolNombre || null,
        tipoCalificador: esAdmin ? 'admin' : 'jurado',
        esAdmin,
        puntajeTotal: round2(Number(ev.puntajeTotal) || 0),
        estado: ev.estado,
        criterios: criteriosDetalle,
        fechaApertura: ev.fechaApertura,
        fechaCierre: ev.fechaCierre,
        updatedAt: ev.updatedAt,
      };
    });

    const selladas = calificaciones.filter((c) => c.estado === 'COMPLETADO');
    const promedio =
      selladas.length > 0
        ? round2(selladas.reduce((s, c) => s + c.puntajeTotal, 0) / selladas.length)
        : null;

    return {
      fase: {
        idFase: fase.idFase,
        nombre: fase.nombre,
        tipoConcurso: fase.tipoConcurso || 'EFU',
      },
      sujeto,
      criterios: criterios.map((c) => ({
        idCriterio: c.idCriterio,
        nombre: c.nombre,
        puntajeMaximo: Number(c.puntajeMaximo),
      })),
      calificaciones,
      resumen: {
        totalCalificadores: calificaciones.length,
        totalJurados: calificaciones.filter((c) => !c.esAdmin).length,
        totalAdmins: calificaciones.filter((c) => c.esAdmin).length,
        completadas: selladas.length,
        promedioSellado: promedio,
      },
    };
  }

  /**
   * Listado de fraternidades o participantes de una fase con resumen de calificaciones (admin).
   */
  async getListadoCalificacionesAdmin(idFase: number) {
    const fase = await this.faseRepo.findOne({
      where: { idFase },
      relations: ['gestion'],
    });
    if (!fase) throw new NotFoundException('Fase no encontrada');

    const evaluaciones = await this.evaluacionRepo.find({
      where: { fase: { idFase } },
      relations: ['jurado', 'jurado.usuario', 'jurado.usuario.rol', 'fraternidad', 'participante'],
    });

    const faseInfo = {
      idFase: fase.idFase,
      nombre: fase.nombre,
      tipoConcurso: fase.tipoConcurso || 'EFU',
    };

    if (fase.tipoConcurso === 'EXTERNO') {
      if (esFaseChachaWarmi(fase)) {
        const participantes = await this.participanteRepo.find({
          where: { fase: { idFase } },
          relations: ['fraternidad'],
          order: { nombre: 'ASC' },
        });
        const byFrat = new Map<number, { idFraternidad: number; nombre: string; nombres: string[] }>();
        for (const p of participantes) {
          const fid = p.fraternidad?.idFraternidad;
          if (!fid) continue;
          if (!byFrat.has(fid)) {
            byFrat.set(fid, {
              idFraternidad: fid,
              nombre: p.fraternidad!.nombre,
              nombres: [],
            });
          }
          if (p.nombre) byFrat.get(fid)!.nombres.push(p.nombre);
        }

        const mapEv = new Map<number, typeof evaluaciones>();
        for (const ev of evaluaciones) {
          const id = ev.fraternidad?.idFraternidad;
          if (!id) continue;
          if (!mapEv.has(id)) mapEv.set(id, []);
          mapEv.get(id)!.push(ev);
        }

        const sujetos = Array.from(byFrat.values()).map((g) => {
          const evs = mapEv.get(g.idFraternidad) || [];
          const selladas = evs.filter((e) => e.estado === 'COMPLETADO');
          const promedio =
            selladas.length > 0
              ? round2(
                  selladas.reduce((s, e) => s + Number(e.puntajeTotal || 0), 0) / selladas.length,
                )
              : null;
          return {
            idFraternidad: g.idFraternidad,
            nombre: g.nombre,
            nombresPareja: g.nombres,
            cantidadCalificadores: evs.length,
            cantidadCompletadas: selladas.length,
            cantidadPendientes: evs.filter((e) => e.estado !== 'COMPLETADO').length,
            promedioSellado: promedio,
            todasSelladas: evs.length > 0 && evs.every((e) => e.estado === 'COMPLETADO'),
          };
        });

        return { fase: { ...faseInfo, modoCalificacion: 'fraternidad' }, sujetos };
      }

      const participantes = await this.participanteRepo.find({
        where: { fase: { idFase } },
        relations: ['fraternidad'],
        order: { nombre: 'ASC' },
      });

      const mapEv = new Map<number, typeof evaluaciones>();
      for (const ev of evaluaciones) {
        const id = ev.participante?.idParticipante;
        if (!id) continue;
        if (!mapEv.has(id)) mapEv.set(id, []);
        mapEv.get(id)!.push(ev);
      }

      const sujetos = participantes.map((p) => {
        const evs = mapEv.get(p.idParticipante) || [];
        const selladas = evs.filter((e) => e.estado === 'COMPLETADO');
        const promedio =
          selladas.length > 0
            ? round2(
                selladas.reduce((s, e) => s + Number(e.puntajeTotal || 0), 0) / selladas.length,
              )
            : null;
        return {
          idParticipante: p.idParticipante,
          nombre: p.nombre,
          tipoParticipante: p.tipo || null,
          fraternidad: p.fraternidad?.nombre || null,
          cantidadCalificadores: evs.length,
          cantidadCompletadas: selladas.length,
          cantidadPendientes: evs.filter((e) => e.estado !== 'COMPLETADO').length,
          promedioSellado: promedio,
          todasSelladas: evs.length > 0 && evs.every((e) => e.estado === 'COMPLETADO'),
        };
      });

      return { fase: faseInfo, sujetos };
    }

    const idGestionFase = fase.gestion?.idGestion || (await this.getGestionActiva())?.idGestion;
    const fraternidades = await this.fraternidadRepo.find({
      where: {
        habilitadoEfu: true,
        ...(idGestionFase ? { gestion: { idGestion: idGestionFase } } : {}),
      },
      relations: ['categoria'],
      order: { nombre: 'ASC' },
    });

    const mapEv = new Map<number, typeof evaluaciones>();
    for (const ev of evaluaciones) {
      const id = ev.fraternidad?.idFraternidad;
      if (!id) continue;
      if (!mapEv.has(id)) mapEv.set(id, []);
      mapEv.get(id)!.push(ev);
    }

    const sujetos = fraternidades.map((frat) => {
      const evs = mapEv.get(frat.idFraternidad) || [];
      const selladas = evs.filter((e) => e.estado === 'COMPLETADO');
      const promedio =
        selladas.length > 0
          ? round2(
              selladas.reduce((s, e) => s + Number(e.puntajeTotal || 0), 0) / selladas.length,
            )
          : null;
      return {
        idFraternidad: frat.idFraternidad,
        nombre: frat.nombre,
        categoria: frat.categoria?.nombre || null,
        cantidadCalificadores: evs.length,
        cantidadCompletadas: selladas.length,
        cantidadPendientes: evs.filter((e) => e.estado !== 'COMPLETADO').length,
        promedioSellado: promedio,
        todasSelladas: evs.length > 0 && evs.every((e) => e.estado === 'COMPLETADO'),
      };
    });

    return { fase: faseInfo, sujetos };
  }

  /**
   * Sella actas en la fase indicada.
   * - Con idFraternidad o idParticipante: solo ese sujeto.
   * - Sin sujeto: todas las actas abiertas de la fase (todos los jurados/admins y sujetos).
   */
  async cerrarActasAdmin(
    idFase: number,
    opts: { idFraternidad?: number; idParticipante?: number } = {},
  ) {
    const { idFraternidad, idParticipante } = opts;
    if (idFraternidad && idParticipante) {
      throw new BadRequestException('Indica idFraternidad o idParticipante, no ambos.');
    }

    const fase = await this.faseRepo.findOne({ where: { idFase } });
    if (!fase) throw new NotFoundException('Fase no encontrada');

    const where: any = { fase: { idFase } };
    if (idParticipante) where.participante = { idParticipante };
    else if (idFraternidad) where.fraternidad = { idFraternidad };

    const evaluaciones = await this.evaluacionRepo.find({ where });
    const pendientes = evaluaciones.filter((e) => e.estado !== 'COMPLETADO');

    if (!pendientes.length) {
      const alcance = idParticipante || idFraternidad
        ? 'para el sujeto seleccionado'
        : 'en esta fase';
      return {
        cerradas: 0,
        mensaje: `No hay actas pendientes de cierre ${alcance}.`,
      };
    }

    const ahora = new Date();
    for (const ev of pendientes) {
      ev.estado = 'COMPLETADO';
      if (!ev.fechaApertura) ev.fechaApertura = ahora;
      ev.fechaCierre = ahora;
    }
    await this.evaluacionRepo.save(pendientes);

    const alcanceMsg = idParticipante || idFraternidad
      ? `para el sujeto indicado en la fase "${fase.nombre}"`
      : `de toda la fase "${fase.nombre}"`;

    return {
      cerradas: pendientes.length,
      mensaje: `Se cerraron ${pendientes.length} acta(s) ${alcanceMsg}.`,
    };
  }

  async guardarEvaluacion(idUsuario: number, rol: string, args: { idFase: number, idFraternidad?: number, idParticipante?: number, criterios: any, finalizar: boolean }) {
    const { idFase, idFraternidad, idParticipante, criterios, finalizar } = args;
    const jurado = await this.getValidadorJurado(idUsuario, rol, idFase);
    const fase = await this.faseRepo.findOne({ where: { idFase } });
    if (!fase || !fase.estaActiva) throw new ForbiddenException('Fase inactiva.');

    const esChacha = esFaseChachaWarmi(fase);
    if (esChacha) {
      if (!idFraternidad || idParticipante) {
        throw new BadRequestException(
          'Chacha-Warmi se califica por fraternidad (pareja). Envía solo idFraternidad.',
        );
      }
    }

    if (idFraternidad) {
      const frat = await this.fraternidadRepo.findOne({ where: { idFraternidad } });
      if (!frat?.habilitadoEfu) {
        throw new ForbiddenException('Esta fraternidad aún no está habilitada para calificación (inscripción pendiente de aprobación).');
      }
      if (esChacha) {
        const tienePareja = await this.participanteRepo.count({
          where: { fase: { idFase }, fraternidad: { idFraternidad } },
        });
        if (!tienePareja) {
          throw new BadRequestException(
            'No hay pareja Chacha-Warmi registrada para esta fraternidad en la fase.',
          );
        }
      }
    }

    const where: any = { jurado: { idJurado: jurado.idJurado }, fase: { idFase } };
    if (idParticipante) where.participante = { idParticipante };
    else if (idFraternidad) where.fraternidad = { idFraternidad };

    let ev = await this.evaluacionRepo.findOne({ where });
    if (ev && ev.estado === 'COMPLETADO') throw new ForbiddenException('Evaluación ya finalizada.');

    let pts = 0;
    if (criterios) Object.values(criterios).forEach(v => pts += Number(v) || 0);

    if (!ev) {
      ev = this.evaluacionRepo.create({
        jurado: { idJurado: jurado.idJurado }, fase: { idFase },
        fraternidad: idFraternidad ? { idFraternidad } : null,
        participante: idParticipante ? { idParticipante } : null,
        criteriosEvaluados: criterios, puntajeTotal: pts,
        estado: finalizar ? 'COMPLETADO' : 'EN_PROGRESO',
        fechaApertura: new Date(), fechaCierre: finalizar ? new Date() : null
      });
    } else {
      ev.criteriosEvaluados = criterios; ev.puntajeTotal = pts;
      ev.estado = finalizar ? 'COMPLETADO' : 'EN_PROGRESO';
      if (finalizar) ev.fechaCierre = new Date();
    }
    return this.evaluacionRepo.save(ev);
  }

  async getEstadisticasDashboard() {
    const gestion = await this.getGestionActiva();
    if (!gestion) throw new NotFoundException('No hay gestión activa');

    // Fraternidades oficialmente aprobadas en la gestión activa
    // (tienen solicitud APROBADO que las creó).
    const totalFraternidadesRaw = await this.fraternidadRepo
      .createQueryBuilder('f')
      .innerJoin(
        'solicitudes_inscripcion',
        's',
        's.id_fraternidad_creada = f.id_fraternidad AND s.estado = :aprobado',
        { aprobado: 'APROBADO' },
      )
      .where('f.id_gestion = :gid', { gid: gestion.idGestion })
      .select('COUNT(DISTINCT f.id_fraternidad)', 'cnt')
      .getRawOne();
    const totalFraternidades = Number(totalFraternidadesRaw?.cnt || 0);

    const frats = await this.fraternidadRepo.find({
      where: {
        habilitadoEfu: true,
        gestion: { idGestion: gestion.idGestion },
        nivelRepresentacion: Not('Externo'),
      },
      relations: ['categoria'],
    });
    const evsEfu = await this.evaluacionRepo.find({
      where: [
        { estado: 'COMPLETADO', fase: { gestion: { idGestion: gestion.idGestion }, tipoConcurso: 'EFU' } },
        { estado: 'EN_PROGRESO', fase: { gestion: { idGestion: gestion.idGestion }, tipoConcurso: 'EFU' } }
      ],
      relations: ['fraternidad', 'jurado'],
    });

    const incidencias = await this.incidenciaRepo.find({
      where: { gestion: { idGestion: gestion.idGestion } },
      relations: ['fraternidad', 'infraccion']
    });

    const evaluadasIds = new Set(evsEfu.map(e => e.fraternidad?.idFraternidad).filter(id => !!id));
    const progreso = frats.length > 0 ? Math.round((evaluadasIds.size / frats.length) * 100) : 0;

    const ranking = new Map<number, { nombre: string, tipo: string, promedio: number, impactos: number }>();
    
    // Inicializar con todas las fraternidades habilitadas
    frats.forEach(f => {
      ranking.set(f.idFraternidad, { 
        nombre: f.nombre, 
        tipo: f.categoria?.nombre || 'General', 
        promedio: 0,
        impactos: 0
      });
    });

    const scoresEfu = calcularScoresEfu(
      evsEfu.map((e) => actaDesdeEvaluacion(e)).filter((a): a is NonNullable<typeof a> => !!a),
    );
    scoresEfu.forEach((score, idFrat) => {
      const ex = ranking.get(idFrat);
      if (ex) ex.promedio = score.promedioFinal;
    });

    // Aplicar impactos de sanciones/puntos extra (HCU)
    incidencias.forEach(i => {
        if (!i.fraternidad || !i.infraccion) return;
        const ex = ranking.get(i.fraternidad.idFraternidad);
        if (ex) {
            ex.impactos += Number(i.infraccion.valorImpacto) || 0;
        }
    });

    const rankingSorted = Array.from(ranking.values()).map(r => {
        const puntajeFinal = Math.max(0, r.promedio + r.impactos);
        return {
            nombre: r.nombre, 
            tipo: r.tipo, 
            puntaje: round2(puntajeFinal)
        };
    }).sort((a, b) => b.puntaje - a.puntaje);

    const evsExt = await this.evaluacionRepo.find({
      where: [
        { estado: 'COMPLETADO', fase: { gestion: { idGestion: gestion.idGestion }, tipoConcurso: 'EXTERNO' } },
        { estado: 'EN_PROGRESO', fase: { gestion: { idGestion: gestion.idGestion }, tipoConcurso: 'EXTERNO' } },
      ],
      relations: ['participante', 'participante.fraternidad', 'fase'],
    });

    const concursosMap = new Map<number, { idFase: number; nombreConcurso: string; participantesMap: Map<number, any> }>();

    evsExt.forEach((e) => {
      if (!e.participante || !e.fase) return;

      const idFase = e.fase.idFase;
      if (!concursosMap.has(idFase)) {
        concursosMap.set(idFase, {
          idFase,
          nombreConcurso: e.fase.nombre,
          participantesMap: new Map<number, any>(),
        });
      }

      const concurso = concursosMap.get(idFase)!;
      const idPart = e.participante.idParticipante;
      const pts = Number(e.puntajeTotal) || 0;

      if (!concurso.participantesMap.has(idPart)) {
        concurso.participantesMap.set(idPart, {
          nombre: e.participante.nombre,
          tipo: e.participante.tipo || 'Participante',
          fraternidad: e.participante.fraternidad?.nombre || e.participante.institucionExterna || 'Independiente',
          sum: 0,
          count: 0,
        });
      }

      const participante = concurso.participantesMap.get(idPart);
      participante.sum += pts;
      participante.count++;
    });

    const concursos = Array.from(concursosMap.values())
      .map((concurso) => ({
        idFase: concurso.idFase,
        nombreConcurso: concurso.nombreConcurso,
        participantes: Array.from(concurso.participantesMap.values())
          .map((p) => ({
            nombre: p.nombre,
            tipo: p.tipo,
            fraternidad: p.fraternidad,
            puntajeFinal: Number((p.sum / p.count).toFixed(2)),
          }))
          .sort((a, b) => b.puntajeFinal - a.puntajeFinal)
          .slice(0, 3)
          .map((p, index) => ({ ...p, puesto: index + 1 })),
      }))
      .sort((a, b) => a.nombreConcurso.localeCompare(b.nombreConcurso, 'es'));

    return {
      basico: [
        {
          label: 'Fraternidades Aprobadas',
          valor: totalFraternidades,
          badge: 'Gestión activa',
          progreso: 100,
        },
        { label: 'Evaluadas', valor: evaluadasIds.size, badge: `${progreso}% Avance`, progreso },
        { clave: 'rankingTop', label: 'Ranking Top', valor: rankingSorted.length > 0 ? rankingSorted[0].nombre : '—', badge: 'Líder Actual', progreso: 100 }
      ],
      rankingEfu: rankingSorted,
      concursos,
      totalFraternidades,
      gestion: {
        anio: gestion.anio,
        edicion: gestion.edicion,
        mostrarRanking: gestion.mostrarRanking !== false,
        mostrarRankingEstadisticas: gestion.mostrarRankingEstadisticas !== false,
        mostrarRankingConcursosExternos: gestion.mostrarRankingConcursosExternos !== false,
        rankingConcursosOcultos: Array.isArray(gestion.rankingConcursosOcultos)
          ? gestion.rankingConcursosOcultos
          : [],
      }
    };
  }

  /**
   * Auditoría de calificaciones: desglose por fraternidad (EFU) o concurso (EXTERNO).
   * EFU: Promedio Final = suma(NotaFraternidad de cada jurado) / N jurados.
   * NotaFraternidad = suma de las fases que ese jurado sí calificó (sin reescalar).
   */
  async getAuditoriaCalificaciones(ambito: 'EFU' | 'EXTERNO' = 'EFU', idGestion?: number) {
    const gestion = idGestion
      ? await this.gestionRepo.findOne({ where: { idGestion } })
      : await this.getGestionActiva();
    if (!gestion) throw new NotFoundException('No hay gestión activa');

    const nombreJurado = (j?: Jurado | null) => nombreJuradoDesdeUsuario(j);

    if (ambito === 'EXTERNO') {
      const evsExt = await this.evaluacionRepo.find({
        where: [
          { estado: 'COMPLETADO', fase: { gestion: { idGestion: gestion.idGestion }, tipoConcurso: 'EXTERNO' } },
          { estado: 'EN_PROGRESO', fase: { gestion: { idGestion: gestion.idGestion }, tipoConcurso: 'EXTERNO' } },
        ],
        relations: ['participante', 'participante.fraternidad', 'fase', 'jurado', 'jurado.usuario'],
        order: { fechaCierre: 'DESC', createdAt: 'DESC' },
      });

      const concursosMap = new Map<number, {
        idFase: number;
        nombreConcurso: string;
        participantesMap: Map<number, any>;
      }>();

      for (const e of evsExt) {
        if (!e.participante || !e.fase) continue;
        const idFase = e.fase.idFase;
        if (!concursosMap.has(idFase)) {
          concursosMap.set(idFase, {
            idFase,
            nombreConcurso: e.fase.nombre,
            participantesMap: new Map(),
          });
        }
        const concurso = concursosMap.get(idFase)!;
        const idPart = e.participante.idParticipante;
        if (!concurso.participantesMap.has(idPart)) {
          concurso.participantesMap.set(idPart, {
            idParticipante: idPart,
            nombre: e.participante.nombre,
            tipo: e.participante.tipo || 'Participante',
            fraternidad: e.participante.fraternidad?.nombre || e.participante.institucionExterna || 'Independiente',
            sum: 0,
            count: 0,
            calificaciones: [] as any[],
          });
        }
        const part = concurso.participantesMap.get(idPart)!;
        const pts = Number(e.puntajeTotal) || 0;
        part.sum += pts;
        part.count++;
        part.calificaciones.push({
          idEvaluacion: e.idEvaluacion,
          idJurado: e.jurado?.idJurado ?? null,
          juradoNombre: nombreJurado(e.jurado),
          idFase: e.fase.idFase,
          faseNombre: e.fase.nombre,
          puntajeTotal: Number(pts.toFixed(2)),
          estado: e.estado,
          fechaCierre: e.fechaCierre || e.updatedAt || null,
          criteriosEvaluados: e.criteriosEvaluados || null,
        });
      }

      const concursos = Array.from(concursosMap.values())
        .map((c) => ({
          idFase: c.idFase,
          nombreConcurso: c.nombreConcurso,
          participantes: Array.from(c.participantesMap.values())
            .map((p) => {
              const promedioJurado = p.count > 0 ? Number((p.sum / p.count).toFixed(2)) : 0;
              return {
                idParticipante: p.idParticipante,
                nombre: p.nombre,
                tipo: p.tipo,
                fraternidad: p.fraternidad,
                cantidadJurados: p.count,
                promedioJurado,
                puntajeFinal: promedioJurado,
                calificaciones: p.calificaciones.sort(
                  (a: any, b: any) => Number(b.puntajeTotal) - Number(a.puntajeTotal),
                ),
              };
            })
            .sort((a, b) => b.puntajeFinal - a.puntajeFinal),
        }))
        .sort((a, b) => a.nombreConcurso.localeCompare(b.nombreConcurso, 'es'));

      return {
        gestion: { idGestion: gestion.idGestion, anio: gestion.anio },
        ambito: 'EXTERNO',
        formula: 'promedio = suma(notas de jurados) / N jurados',
        concursos,
      };
    }

    // EFU — fraternidades
    const frats = await this.fraternidadRepo.find({
      where: {
        habilitadoEfu: true,
        gestion: { idGestion: gestion.idGestion },
        nivelRepresentacion: Not('Externo'),
      },
      relations: ['categoria'],
      order: { nombre: 'ASC' },
    });

    const evsEfu = await this.evaluacionRepo.find({
      where: [
        { estado: 'COMPLETADO', fase: { gestion: { idGestion: gestion.idGestion }, tipoConcurso: 'EFU' } },
        { estado: 'EN_PROGRESO', fase: { gestion: { idGestion: gestion.idGestion }, tipoConcurso: 'EFU' } },
      ],
      relations: ['fraternidad', 'fase', 'jurado', 'jurado.usuario'],
      order: { fechaCierre: 'DESC', createdAt: 'DESC' },
    });

    const incidencias = await this.incidenciaRepo.find({
      where: { gestion: { idGestion: gestion.idGestion } },
      relations: ['fraternidad', 'infraccion'],
    });

    const impactos = new Map<number, number>();
    const sancionesPorFrat = new Map<number, { nombre: string; valor: number; tipoImpacto: string }[]>();
    incidencias.forEach((i) => {
      if (!i.fraternidad || !i.infraccion) return;
      const id = i.fraternidad.idFraternidad;
      impactos.set(id, (impactos.get(id) || 0) + (Number(i.infraccion.valorImpacto) || 0));
      if (!sancionesPorFrat.has(id)) sancionesPorFrat.set(id, []);
      sancionesPorFrat.get(id).push({
        nombre: i.infraccion.nombre,
        valor: Number(i.infraccion.valorImpacto) || 0,
        tipoImpacto: i.infraccion.tipoImpacto || 'RESTA_PUNTOS',
      });
    });

    const scores = calcularScoresEfu(
      evsEfu.map((e) => actaDesdeEvaluacion(e)).filter((a): a is NonNullable<typeof a> => !!a),
    );

    type ItemMeta = { idFraternidad: number; nombre: string; categoria: string };
    const metas = new Map<number, ItemMeta>();
    frats.forEach((f) => {
      metas.set(f.idFraternidad, {
        idFraternidad: f.idFraternidad,
        nombre: f.nombre,
        categoria: f.categoria?.nombre || 'General',
      });
    });
    evsEfu.forEach((e) => {
      const id = e.fraternidad?.idFraternidad;
      if (!id || metas.has(id)) return;
      metas.set(id, {
        idFraternidad: id,
        nombre: e.fraternidad.nombre,
        categoria: 'General',
      });
    });

    const items = Array.from(metas.values())
      .map((meta) => {
        const score = scores.get(meta.idFraternidad);
        const promedioFinal = score?.promedioFinal ?? 0;
        const impactoSanciones = round2(impactos.get(meta.idFraternidad) || 0);
        const sanciones = sancionesPorFrat.get(meta.idFraternidad) || [];
        const puntajeFinal = Math.max(0, round2(promedioFinal + impactoSanciones));
        const jurados = (score?.jurados || []).map((j) => ({
          idJurado: j.idJurado,
          juradoNombre: j.juradoNombre,
          notaFraternidad: j.notaFraternidad,
          fasesCalificadas: j.fasesCalificadas,
          fases: j.fases,
        }));
        return {
          idFraternidad: meta.idFraternidad,
          nombre: meta.nombre,
          categoria: meta.categoria,
          cantidadJurados: score?.cantidadJurados ?? 0,
          promedioFinal,
          promedioJurado: promedioFinal,
          impactoSanciones,
          sanciones,
          suspendida: sanciones.some((s) => s.tipoImpacto === 'SUSPENSION'),
          puntajeFinal,
          jurados,
        };
      })
      .sort((a, b) => b.puntajeFinal - a.puntajeFinal);

    return {
      gestion: { idGestion: gestion.idGestion, anio: gestion.anio },
      ambito: 'EFU',
      formula: `${FORMULA_EFU_PROMEDIO}; final = max(0, Promedio Final + sanciones)`,
      items,
    };
  }

  // --- GESTIONES (AJUSTES) ---
  async getGestionActiva() {
    return findGestionActivaOrLatest(this.gestionRepo);
  }

  async getGestionById(id: number) {
    const g = await this.gestionRepo.findOne({ where: { idGestion: id } });
    if (!g) throw new NotFoundException('Gestión no encontrada');
    return g;
  }

  // Top 3 finalistas para fase EXTERNO (Chacha-Warmi, etc.)
  /**
   * Ranking de fraternidades Chacha por promedio de actas COMPLETADO (por fraternidad).
   * Orden: nota DESC; fecha solo como orden estable secundario (no decide cupo).
   */
  private async rankingChachaPorFraternidad(idFase: number) {
    const participantes = await this.participanteRepo.find({
      where: { fase: { idFase } },
      relations: ['fraternidad'],
    });
    const evs = await this.evaluacionRepo.find({
      where: { estado: 'COMPLETADO', fase: { idFase } },
      relations: ['fraternidad'],
    });
    const inscs = await this.inscConcursoRepo.find({
      where: { fase: { idFase } },
      relations: ['fraternidad'],
    });
    const fechaPorFrat = new Map<number, Date | null>();
    for (const insc of inscs) {
      const fid = insc.fraternidad?.idFraternidad;
      if (!fid) continue;
      fechaPorFrat.set(fid, insc.fechaEnvio || insc.createdAt || null);
    }

    const nombresPorFrat = new Map<number, string[]>();
    const nombreFrat = new Map<number, string>();
    for (const p of participantes) {
      const fid = p.fraternidad?.idFraternidad;
      if (!fid) continue;
      nombreFrat.set(fid, p.fraternidad!.nombre);
      if (!nombresPorFrat.has(fid)) nombresPorFrat.set(fid, []);
      if (p.nombre && !nombresPorFrat.get(fid)!.includes(p.nombre)) {
        nombresPorFrat.get(fid)!.push(p.nombre);
      }
    }

    const acc = new Map<number, { sum: number; count: number }>();
    for (const ev of evs) {
      const fid = ev.fraternidad?.idFraternidad;
      if (!fid) continue;
      const cur = acc.get(fid) || { sum: 0, count: 0 };
      cur.sum += Number(ev.puntajeTotal) || 0;
      cur.count++;
      acc.set(fid, cur);
    }

    const rows = Array.from(nombreFrat.entries()).map(([idFraternidad, nombre]) => {
      const a = acc.get(idFraternidad);
      const nota = a && a.count > 0 ? round2(a.sum / a.count) : null;
      return {
        idFraternidad,
        nombre,
        nombresPareja: nombresPorFrat.get(idFraternidad) || [],
        nota,
        fechaSolicitud: fechaPorFrat.get(idFraternidad) || null,
      };
    });

    rows.sort((a, b) => {
      const na = a.nota == null ? -1 : a.nota;
      const nb = b.nota == null ? -1 : b.nota;
      if (nb !== na) return nb - na;
      const byFecha = compareFechaAsc(a.fechaSolicitud, b.fechaSolicitud);
      if (byFecha !== 0) return byFecha;
      return a.idFraternidad - b.idFraternidad;
    });

    return rows;
  }

  /** Análisis de corte Top N sin desempate automático por fecha. */
  private analizarCorteCupo(
    ranking: Array<{ idFraternidad: number; nombre: string; nombresPareja: string[]; nota: number | null }>,
    cupo: number,
  ) {
    const conNota = ranking.filter((r) => r.nota != null);
    if (!conNota.length || cupo < 1) {
      return {
        hayEmpate: false,
        cupo,
        plazasLibres: 0,
        notaUmbral: null as number | null,
        seguras: [] as typeof conNota,
        candidatas: [] as typeof conNota,
        finalistasAutomaticos: [] as typeof conNota,
      };
    }

    if (conNota.length <= cupo) {
      return {
        hayEmpate: false,
        cupo,
        plazasLibres: 0,
        notaUmbral: null as number | null,
        seguras: conNota,
        candidatas: [] as typeof conNota,
        finalistasAutomaticos: conNota,
      };
    }

    const notaUmbral = Number(conNota[cupo - 1].nota);
    const seguras = conNota.filter((r) => Number(r.nota) > notaUmbral);
    const candidatas = conNota.filter((r) => Number(r.nota) === notaUmbral);
    const plazasLibres = cupo - seguras.length;
    const hayEmpate = candidatas.length > plazasLibres;

    return {
      hayEmpate,
      cupo,
      plazasLibres,
      notaUmbral,
      seguras,
      candidatas,
      finalistasAutomaticos: hayEmpate ? seguras : [...seguras, ...candidatas].slice(0, cupo),
    };
  }

  /** Empate de podio 1°–3°: notas iguales en zona de medallas. */
  private analizarPodio(
    ranking: Array<{ idFraternidad: number; nombre: string; nombresPareja: string[]; nota: number | null }>,
  ) {
    const conNota = ranking.filter((r) => r.nota != null);
    const cupo = 3;
    if (conNota.length < 2) {
      return {
        hayEmpate: false,
        cupo,
        plazasLibres: 0,
        seguras: [] as typeof conNota,
        candidatas: [] as typeof conNota,
      };
    }

    const limite = Math.min(cupo, conNota.length);
    const notaUmbral = Number(conNota[limite - 1].nota);
    const enZona = conNota.filter((r) => Number(r.nota) >= notaUmbral);
    const notasZona = enZona.map((r) => Number(r.nota));
    const hayDuplicado = new Set(notasZona).size < notasZona.length;
    const hayEmpate = enZona.length > cupo || hayDuplicado;

    if (!hayEmpate) {
      return {
        hayEmpate: false,
        cupo,
        plazasLibres: 0,
        seguras: enZona.slice(0, cupo),
        candidatas: [] as typeof conNota,
      };
    }

    // Candidatas = grupos con nota duplicada dentro de la zona ampliada
    const countByNota = new Map<number, number>();
    for (const n of notasZona) countByNota.set(n, (countByNota.get(n) || 0) + 1);
    const candidatas = enZona.filter((r) => (countByNota.get(Number(r.nota)) || 0) > 1);
    // Si la zona se expandió por cupo (>3 con misma nota umbral), todos en umbral son candidatas
    const umbralGroup = enZona.filter((r) => Number(r.nota) === notaUmbral);
    const pool =
      candidatas.length > 0
        ? candidatas
        : umbralGroup.length > cupo - enZona.filter((r) => Number(r.nota) > notaUmbral).length
          ? umbralGroup
          : enZona;

    const seguras = enZona.filter(
      (r) => !pool.some((c) => c.idFraternidad === r.idFraternidad),
    );

    return {
      hayEmpate: true,
      cupo,
      plazasLibres: Math.max(0, cupo - seguras.length),
      seguras,
      candidatas: pool,
    };
  }

  private async syncDesempateTipo(
    idFase: number,
    tipo: TipoDesempate,
    analisis: {
      hayEmpate: boolean;
      cupo: number;
      plazasLibres: number;
      candidatas: Array<{ idFraternidad: number; nota: number | null }>;
    },
  ) {
    const existentes = await this.desempateRepo.find({
      where: { fase: { idFase }, tipo },
      relations: ['candidatos', 'candidatos.fraternidad', 'decisor'],
      order: { idDesempate: 'DESC' },
      take: 1,
    });
    let des = existentes[0] || null;

    if (!analisis.hayEmpate) {
      if (des && des.estado === EstadoDesempate.PENDIENTE) {
        await this.desempateCandRepo.delete({ desempate: { idDesempate: des.idDesempate } });
        await this.desempateRepo.remove(des);
        des = null;
      }
      return des;
    }

    const idsActuales = new Set(analisis.candidatas.map((c) => c.idFraternidad));
    const idsPrev = new Set((des?.candidatos || []).map((c) => c.fraternidad?.idFraternidad).filter(Boolean));
    const mismoSet =
      idsPrev.size === idsActuales.size && [...idsActuales].every((id) => idsPrev.has(id));

    if (des?.estado === EstadoDesempate.RESUELTO && mismoSet) {
      return des;
    }

    if (des?.estado === EstadoDesempate.PENDIENTE && mismoSet) {
      des.cupo = analisis.cupo;
      des.plazasLibres = analisis.plazasLibres;
      for (const c of des.candidatos || []) {
        const src = analisis.candidatas.find((x) => x.idFraternidad === c.fraternidad?.idFraternidad);
        if (src) c.nota = src.nota as any;
      }
      await this.desempateRepo.save(des);
      if (des.candidatos?.length) await this.desempateCandRepo.save(des.candidatos);
      return des;
    }

    if (des?.estado === EstadoDesempate.PENDIENTE) {
      await this.desempateCandRepo.delete({ desempate: { idDesempate: des.idDesempate } });
      des.cupo = analisis.cupo;
      des.plazasLibres = analisis.plazasLibres;
      des = await this.desempateRepo.save(des);
    } else {
      des = this.desempateRepo.create({
        fase: { idFase } as any,
        tipo,
        estado: EstadoDesempate.PENDIENTE,
        cupo: analisis.cupo,
        plazasLibres: analisis.plazasLibres,
        decisor: null,
      });
      des = await this.desempateRepo.save(des);
    }

    const cands = analisis.candidatas.map((c, idx) =>
      this.desempateCandRepo.create({
        desempate: { idDesempate: des!.idDesempate } as any,
        fraternidad: { idFraternidad: c.idFraternidad } as any,
        nota: c.nota,
        puestoProvisional: idx + 1,
        decision: DecisionDesempate.PENDIENTE,
        ordenPodio: null,
      }),
    );
    await this.desempateCandRepo.save(cands);

    return this.desempateRepo.findOne({
      where: { idDesempate: des.idDesempate },
      relations: ['candidatos', 'candidatos.fraternidad', 'decisor'],
    });
  }

  private serializeDesempate(des: DesempateFase | null) {
    if (!des) return null;
    return {
      idDesempate: des.idDesempate,
      tipo: des.tipo,
      estado: des.estado,
      cupo: des.cupo,
      plazasLibres: des.plazasLibres,
      decisor: des.decisor
        ? {
            idUsuario: des.decisor.idUsuario,
            nombres: [des.decisor.nombres, des.decisor.primerApellido].filter(Boolean).join(' '),
          }
        : null,
      candidatos: (des.candidatos || []).map((c) => ({
        idCandidato: c.idCandidato,
        idFraternidad: c.fraternidad?.idFraternidad,
        nombre: c.fraternidad?.nombre,
        nota: c.nota != null ? Number(c.nota) : null,
        puestoProvisional: c.puestoProvisional,
        decision: c.decision,
        ordenPodio: c.ordenPodio,
      })),
    };
  }

  async getEstadoPromocion(idFase: number) {
    const fase = await this.faseRepo.findOne({ where: { idFase } });
    if (!fase) throw new NotFoundException('Fase no encontrada');
    if (!esFaseChachaWarmi(fase)) {
      throw new BadRequestException('Solo aplica a fases Chacha-Warmi.');
    }

    const cupo = Number(fase.cupoFinalistas);
    const hijas = await this.faseRepo.find({
      where: { fasePadre: { idFase } },
      relations: ['gestion'],
    });

    const ranking = await this.rankingChachaPorFraternidad(idFase);
    const corte =
      Number.isFinite(cupo) && cupo >= 1
        ? this.analizarCorteCupo(ranking, cupo)
        : {
            hayEmpate: false,
            cupo: 0,
            plazasLibres: 0,
            notaUmbral: null,
            seguras: [],
            candidatas: [],
            finalistasAutomaticos: [],
          };
    const podio = this.analizarPodio(ranking);

    const desCorte = await this.syncDesempateTipo(idFase, TipoDesempate.CORTE_FINALISTAS, corte);
    const desPodio = await this.syncDesempateTipo(idFase, TipoDesempate.PODIO, podio);

    const cortePendiente = desCorte?.estado === EstadoDesempate.PENDIENTE;
    const podioPendiente = desPodio?.estado === EstadoDesempate.PENDIENTE;

    let finalistasConfirmados = corte.finalistasAutomaticos.map((r) => ({
      ...r,
      nombresPareja: r.nombresPareja || [],
    }));
    if (corte.hayEmpate && desCorte?.estado === EstadoDesempate.RESUELTO) {
      const pasan = (desCorte.candidatos || [])
        .filter((c) => c.decision === DecisionDesempate.PASA)
        .map((c) => {
          const fromRank = ranking.find((r) => r.idFraternidad === c.fraternidad.idFraternidad);
          return {
            idFraternidad: c.fraternidad.idFraternidad,
            nombre: c.fraternidad.nombre,
            nombresPareja: fromRank?.nombresPareja || [],
            nota: c.nota != null ? Number(c.nota) : null,
          };
        });
      finalistasConfirmados = [...corte.seguras, ...pasan];
    }
    if (finalistasConfirmados.length > cupo) {
      finalistasConfirmados = finalistasConfirmados.slice(0, cupo);
    }

    const decisor = await this.usuarioRepo.findOne({
      where: { esDecisor: true },
      relations: ['rol'],
    });

    const puedePromover =
      Number.isFinite(cupo) &&
      cupo >= 1 &&
      hijas.length > 0 &&
      !cortePendiente &&
      finalistasConfirmados.length > 0 &&
      finalistasConfirmados.length <= cupo;

    return {
      fase: {
        idFase: fase.idFase,
        nombre: fase.nombre,
        cupoFinalistas: Number.isFinite(cupo) ? cupo : null,
      },
      fasesHijas: hijas.map((h) => ({ idFase: h.idFase, nombre: h.nombre })),
      puedePromover,
      empateCorte: !!corte.hayEmpate,
      empatePodio: !!podio.hayEmpate,
      cortePendiente,
      podioPendiente,
      plazasLibresCorte: corte.plazasLibres,
      notaUmbral: corte.notaUmbral,
      seguras: corte.seguras,
      candidatas: corte.candidatas,
      finalistasConfirmados,
      desempateCorte: this.serializeDesempate(desCorte),
      desempatePodio: this.serializeDesempate(desPodio),
      decisorActual: decisor
        ? {
            idUsuario: decisor.idUsuario,
            nombres: [decisor.nombres, decisor.primerApellido].filter(Boolean).join(' '),
            ci: decisor.ci,
          }
        : null,
    };
  }

  async resolverDesempate(
    idDesempate: number,
    body: {
      decisiones?: Array<{ idFraternidad: number; decision: string }>;
      ordenesPodio?: Array<{ idFraternidad: number; ordenPodio: number }>;
    },
    actor: { idUsuario: number; rol?: string; esDecisor?: boolean },
  ) {
    const des = await this.desempateRepo.findOne({
      where: { idDesempate },
      relations: ['fase', 'candidatos', 'candidatos.fraternidad'],
    });
    if (!des) throw new NotFoundException('Desempate no encontrado');

    const esSuper = String(actor?.rol || '').toLowerCase() === 'superusuario';
    if (!actor?.esDecisor && !esSuper) {
      throw new ForbiddenException('Solo el Decisor (o superusuario) puede resolver empates.');
    }

    if (des.estado === EstadoDesempate.RESUELTO) {
      throw new BadRequestException('Este desempate ya fue resuelto.');
    }

    const decisorUser = await this.usuarioRepo.findOne({ where: { idUsuario: actor.idUsuario } });
    des.decisor = decisorUser;

    if (des.tipo === TipoDesempate.CORTE_FINALISTAS) {
      const decisiones = body?.decisiones || [];
      const map = new Map(decisiones.map((d) => [Number(d.idFraternidad), String(d.decision).toUpperCase()]));
      let pasaCount = 0;
      for (const c of des.candidatos || []) {
        const d = map.get(c.fraternidad.idFraternidad);
        if (!d || ![DecisionDesempate.PASA, DecisionDesempate.NO_PASA].includes(d as DecisionDesempate)) {
          throw new BadRequestException(
            'Debes marcar PASA o NO_PASA para cada fraternidad empatada.',
          );
        }
        c.decision = d as DecisionDesempate;
        if (c.decision === DecisionDesempate.PASA) pasaCount++;
      }
      if (pasaCount !== des.plazasLibres) {
        throw new BadRequestException(
          `Debes marcar exactamente ${des.plazasLibres} fraternidad(es) como PASA (cupo restante). Marcaste ${pasaCount}.`,
        );
      }
      await this.desempateCandRepo.save(des.candidatos);
      des.estado = EstadoDesempate.RESUELTO;
      await this.desempateRepo.save(des);
      return {
        ok: true,
        mensaje: `Desempate de corte resuelto: ${pasaCount} pasan de ${des.candidatos.length} empatadas.`,
        desempate: this.serializeDesempate(
          await this.desempateRepo.findOne({
            where: { idDesempate },
            relations: ['candidatos', 'candidatos.fraternidad', 'decisor'],
          }),
        ),
      };
    }

    // PODIO: el Decisor asigna orden 1..plazasLibres (únicos) entre empatadas; no puede superar plazas.
    const ordenes = body?.ordenesPodio || [];
    const needed = des.plazasLibres > 0 ? des.plazasLibres : Math.min(3, (des.candidatos || []).length);
    const asignados = ordenes.filter((o) => {
      const ord = Number(o.ordenPodio);
      return Number.isFinite(ord) && ord >= 1 && ord <= needed;
    });
    if (asignados.length !== needed) {
      throw new BadRequestException(
        `Debes asignar exactamente ${needed} puesto(s) de podio (1–${needed}) entre las fraternidades empatadas.`,
      );
    }
    const ordSet = new Set(asignados.map((o) => Number(o.ordenPodio)));
    if (ordSet.size !== needed) {
      throw new BadRequestException('Los puestos de podio deben ser únicos.');
    }
    const idSet = new Set(asignados.map((o) => Number(o.idFraternidad)));
    if (idSet.size !== needed) {
      throw new BadRequestException('Cada puesto debe asignarse a una fraternidad distinta.');
    }
    const mapOrd = new Map(asignados.map((o) => [Number(o.idFraternidad), Number(o.ordenPodio)]));
    const candIds = new Set((des.candidatos || []).map((c) => c.fraternidad.idFraternidad));
    for (const id of idSet) {
      if (!candIds.has(id)) {
        throw new BadRequestException('Solo puedes asignar podio a fraternidades empatadas.');
      }
    }
    for (const c of des.candidatos || []) {
      const ord = mapOrd.get(c.fraternidad.idFraternidad);
      if (ord != null) {
        c.ordenPodio = ord;
        c.decision = DecisionDesempate.PASA;
      } else {
        c.ordenPodio = null;
        c.decision = DecisionDesempate.NO_PASA;
      }
    }

    await this.desempateCandRepo.save(des.candidatos);
    des.estado = EstadoDesempate.RESUELTO;
    await this.desempateRepo.save(des);
    return {
      ok: true,
      mensaje: 'Desempate de podio resuelto.',
      desempate: this.serializeDesempate(
        await this.desempateRepo.findOne({
          where: { idDesempate },
          relations: ['candidatos', 'candidatos.fraternidad', 'decisor'],
        }),
      ),
    };
  }

  async getFinalistasFase(idFase: number) {
    const fase = await this.faseRepo.findOne({ where: { idFase } });
    if (!fase) throw new NotFoundException('Fase no encontrada');

    if (esFaseChachaWarmi(fase)) {
      const cupo = Number(fase.cupoFinalistas) > 0 ? Number(fase.cupoFinalistas) : 10;
      const estado = await this.getEstadoPromocion(idFase);
      const finalistas = (estado.finalistasConfirmados || []).map((r: any, idx: number) => ({
        idFraternidad: r.idFraternidad,
        nombre: r.nombre,
        nombresPareja: r.nombresPareja,
        fraternidad: r.nombre,
        puntajePromedio: r.nota,
        posicion: idx + 1,
        tipo: 'Pareja',
      }));
      return {
        fase: {
          idFase: fase.idFase,
          nombre: fase.nombre,
          tipoConcurso: fase.tipoConcurso,
          plantillaRequisitos: fase.plantillaRequisitos,
          cupoFinalistas: cupo,
          modoCalificacion: 'fraternidad',
        },
        finalistas,
      };
    }

    const evs = await this.evaluacionRepo.find({
      where: { estado: 'COMPLETADO', fase: { idFase } },
      relations: ['participante', 'participante.fraternidad'],
      order: { puntajeTotal: 'DESC' }
    });

    const mapaParticipantes = new Map<number, { id: number, nombre: string, tipo: string, fraternidad: string, sum: number, count: number }>();

    evs.forEach(ev => {
      if (!ev.participante) return;
      const id = ev.participante.idParticipante;
      const pts = Number(ev.puntajeTotal) || 0;
      const ex = mapaParticipantes.get(id);
      if (ex) { ex.sum += pts; ex.count++; }
      else mapaParticipantes.set(id, {
        id,
        nombre: ev.participante.nombre,
        tipo: ev.participante.tipo || 'Competidor',
        fraternidad: (ev.participante as any).fraternidad?.nombre || 'Independiente',
        sum: pts,
        count: 1
      });
    });

    const cupo = Number(fase.cupoFinalistas) > 0 ? Number(fase.cupoFinalistas) : 3;
    const finalistas = Array.from(mapaParticipantes.values())
      .map(p => ({ ...p, puntajePromedio: Number((p.sum / p.count).toFixed(2)) }))
      .sort((a, b) => b.puntajePromedio - a.puntajePromedio)
      .slice(0, cupo)
      .map((p, idx) => ({ ...p, posicion: idx + 1 }));

    return { fase: { idFase: fase.idFase, nombre: fase.nombre, tipoConcurso: fase.tipoConcurso }, finalistas };
  }

  /**
   * Copia finalistas confirmados (seguras + PASA del Decisor) a fases hijas.
   * Bloquea si hay desempate de corte PENDIENTE. Nunca supera el cupo.
   */
  async promoverFinalistas(idFase: number) {
    const fase = await this.faseRepo.findOne({
      where: { idFase },
      relations: ['gestion'],
    });
    if (!fase) throw new NotFoundException('Fase no encontrada');
    if (!esFaseChachaWarmi(fase)) {
      throw new BadRequestException('Solo se pueden promover finalistas desde una fase Chacha-Warmi.');
    }
    const cupo = Number(fase.cupoFinalistas);
    if (!Number.isFinite(cupo) || cupo < 1) {
      throw new BadRequestException(
        'Configura el cupo de finalistas en la fase padre (Gestión de fases) antes de promover.',
      );
    }

    const hijas = await this.faseRepo.find({
      where: { fasePadre: { idFase } },
      relations: ['gestion'],
    });
    if (!hijas.length) {
      throw new BadRequestException(
        'No hay fases hijas enlazadas a esta fase. En Gestión de fases, crea/edita la fase 2 y selecciónala como hija.',
      );
    }

    const estado = await this.getEstadoPromocion(idFase);
    if (estado.cortePendiente) {
      throw new BadRequestException(
        'Hay empate en el cupo de finalistas pendiente de resolución del Decisor. No se puede promover aún.',
      );
    }

    const finalistas = (estado.finalistasConfirmados || []).slice(0, cupo);
    if (!finalistas.length) {
      throw new BadRequestException('No hay fraternidades con calificación completada para promover.');
    }
    if (finalistas.length > cupo) {
      throw new BadRequestException(`La lista de finalistas (${finalistas.length}) supera el cupo (${cupo}).`);
    }

    const origenParts = await this.participanteRepo.find({
      where: { fase: { idFase } },
      relations: ['fraternidad', 'facultad', 'carrera', 'gestion'],
    });

    let creados = 0;
    let yaExistentes = 0;
    const detalleHijas: Array<{ idFase: number; nombre: string; agregados: number }> = [];

    for (const hija of hijas) {
      let agregadosHija = 0;
      for (const fin of finalistas) {
        const origenes = origenParts.filter(
          (p) => p.fraternidad?.idFraternidad === fin.idFraternidad,
        );
        for (const src of origenes) {
          const existe = await this.participanteRepo.findOne({
            where: {
              fase: { idFase: hija.idFase },
              fraternidad: { idFraternidad: fin.idFraternidad },
              tipo: src.tipo || undefined,
              nombre: src.nombre,
            },
          });
          if (existe) {
            yaExistentes++;
            continue;
          }
          const nuevo = this.participanteRepo.create({
            nombre: src.nombre,
            tipo: src.tipo,
            esUmsa: src.esUmsa,
            institucionExterna: src.institucionExterna,
            perteneceFraternidad: src.perteneceFraternidad,
            fraternidad: src.fraternidad ? { idFraternidad: src.fraternidad.idFraternidad } as any : null,
            facultad: src.facultad ? ({ idFacultad: (src.facultad as any).idFacultad } as any) : null,
            carrera: src.carrera ? ({ idCarrera: (src.carrera as any).idCarrera } as any) : null,
            fase: { idFase: hija.idFase } as any,
            gestion: hija.gestion
              ? ({ idGestion: hija.gestion.idGestion } as any)
              : fase.gestion
                ? ({ idGestion: fase.gestion.idGestion } as any)
                : null,
          });
          await this.participanteRepo.save(nuevo);
          creados++;
          agregadosHija++;
        }
      }
      detalleHijas.push({
        idFase: hija.idFase,
        nombre: hija.nombre,
        agregados: agregadosHija,
      });
    }

    return {
      cupo,
      promovidos: finalistas.length,
      finalistas: finalistas.map((f: any, i: number) => ({
        posicion: i + 1,
        idFraternidad: f.idFraternidad,
        nombre: f.nombre,
        nota: f.nota,
        nombresPareja: f.nombresPareja,
      })),
      participantesCreados: creados,
      participantesYaExistentes: yaExistentes,
      fasesHijas: detalleHijas,
      mensaje: `Se promovieron ${finalistas.length} fraternidad(es) a ${hijas.length} fase(s) hija(s).`,
    };
  }

  async clonarGestion(idOrigen: number, idDestino: number, modules: string[]) {
    const origen = await this.gestionRepo.findOne({ where: { idGestion: idOrigen } });
    const destino = await this.gestionRepo.findOne({ where: { idGestion: idDestino } });
    if (!origen || !destino) throw new NotFoundException('Gestión de origen o destino no encontrada');
    if (idOrigen === idDestino) throw new BadRequestException('El origen y destino no pueden ser la misma gestión');

    const result = { fases: 0, criterios: 0, categorias: 0, infracciones: 0, fraternidadesExtra: 0 };

    if (modules.includes('fases_criterios')) {
      const fasesDestino = await this.faseRepo.find({ where: { gestion: { idGestion: idDestino } } });
      for (const fase of fasesDestino) {
        await this.criterioRepo.delete({ fase: { idFase: fase.idFase } });
      }
      await this.faseRepo.delete({ gestion: { idGestion: idDestino } });

      const fasesOrigen = await this.faseRepo.find({ where: { gestion: { idGestion: idOrigen } } });
      for (const fase of fasesOrigen) {
        const nf = this.faseRepo.create({
          nombre: fase.nombre,
          pesoPorcentaje: fase.pesoPorcentaje,
          urlImagen: fase.urlImagen,
          tipoConcurso: fase.tipoConcurso,
          categoriaEfu: fase.categoriaEfu,
          esPrecalificacion: fase.esPrecalificacion,
          fechaInicio: fase.fechaInicio,
          fechaFin: fase.fechaFin,
          fechaInicioInscripcion: fase.fechaInicioInscripcion,
          fechaFinInscripcion: fase.fechaFinInscripcion,
          plantillaRequisitos: fase.plantillaRequisitos,
          cupoFinalistas: fase.cupoFinalistas,
          fasePadre: null,
          estaActiva: false,
          gestion: { idGestion: idDestino } as any,
        });
        const savedF = await this.faseRepo.save(nf);
        result.fases++;

        const criterios = await this.criterioRepo.find({ where: { fase: { idFase: fase.idFase } } });
        for (const crit of criterios) {
          const nc = this.criterioRepo.create({
            nombre: crit.nombre,
            puntajeMaximo: crit.puntajeMaximo,
            urlImagen: crit.urlImagen,
            fase: { idFase: savedF.idFase } as any,
            gestion: { idGestion: idDestino } as any,
          });
          await this.criterioRepo.save(nc);
          result.criterios++;
        }
      }
    }

    if (modules.includes('categorias')) {
      const catsOrigen = await this.categoriaRepo.find({ where: { gestion: { idGestion: idOrigen } } });
      const catsDestino = await this.categoriaRepo.find({ where: { gestion: { idGestion: idDestino } } });
      const destByName = new Map(catsDestino.map((c) => [c.nombre.trim().toUpperCase(), c]));

      for (const cat of catsOrigen) {
        const key = cat.nombre.trim().toUpperCase();
        const existing = destByName.get(key);
        if (existing) {
          existing.descripcion = cat.descripcion;
          await this.categoriaRepo.save(existing);
        } else {
          const nueva = await this.categoriaRepo.save(
            this.categoriaRepo.create({
              nombre: cat.nombre,
              descripcion: cat.descripcion,
              gestion: { idGestion: idDestino } as any,
            }),
          );
          destByName.set(key, nueva);
        }
        result.categorias++;
      }
    }

    if (modules.includes('infracciones')) {
      await this.infraccionRepo.delete({ gestion: { idGestion: idDestino } });
      const infrs = await this.infraccionRepo.find({ where: { gestion: { idGestion: idOrigen } } });
      for (const infr of infrs) {
        const ni = this.infraccionRepo.create({
          nombre: infr.nombre,
          tipoImpacto: infr.tipoImpacto,
          valorImpacto: infr.valorImpacto,
          gestion: { idGestion: idDestino } as any,
        });
        await this.infraccionRepo.save(ni);
        result.infracciones++;
      }
    }

    if (modules.includes('fraternidades_base')) {
      const existentesDestino = await this.fraternidadRepo.count({ where: { gestion: { idGestion: idDestino } } });
      if (existentesDestino > 0) {
        // Evita duplicar fraternidades si la gestión destino ya fue clonada o configurada
      } else {
        const frats = await this.fraternidadRepo.find({
          where: { gestion: { idGestion: idOrigen } },
          relations: ['facultad', 'carrera', 'institucionExterna', 'categoria'],
        });

        const mapCat = new Map<string, number>();
        const destCats = await this.categoriaRepo.find({ where: { gestion: { idGestion: idDestino } } });
        for (const dc of destCats) mapCat.set(dc.nombre.trim().toUpperCase(), dc.idCategoria);

        for (const fr of frats) {
          let idCatNueva: number | null = null;
          if (fr.categoria) {
            const catOrigen = await this.categoriaRepo.findOne({ where: { idCategoria: fr.categoria.idCategoria } });
            if (catOrigen) idCatNueva = mapCat.get(catOrigen.nombre.trim().toUpperCase()) ?? null;
          }

          const nombreClone = `${fr.nombre} (${destino.anio})`;
          const existeNombre = await this.fraternidadRepo.findOne({ where: { nombre: nombreClone } });
          if (existeNombre) continue;

          const nft = this.fraternidadRepo.create({
            nombre: nombreClone,
            nivelRepresentacion: fr.nivelRepresentacion,
            tipoOrganizacion: fr.tipoOrganizacion,
            fechaFundacion: fr.fechaFundacion,
            promedioBase: 0,
            habilitadoEfu: false,
            gestion: { idGestion: idDestino } as any,
            facultad: fr.facultad ? ({ idFacultad: fr.facultad.idFacultad } as any) : null,
            carrera: fr.carrera ? ({ idCarrera: fr.carrera.idCarrera } as any) : null,
            institucionExterna: fr.institucionExterna ? ({ idInstitucion: fr.institucionExterna.idInstitucion } as any) : null,
            categoria: idCatNueva ? ({ idCategoria: idCatNueva } as any) : null,
          });
          await this.fraternidadRepo.save(nft);
          result.fraternidadesExtra++;
        }
      }
    }

    return { success: true, message: 'Elementos clonados con éxito', result };
  }

  async createGestion(data: any) {
    if (data.activa) {
      await this.gestionRepo
        .createQueryBuilder()
        .update(Gestion)
        .set({ activa: false })
        .execute();
    }
    if (data.edicion !== undefined) {
      data.edicion = String(data.edicion || '').trim().toUpperCase().slice(0, 20) || null;
    }
    const nuevaGestion = this.gestionRepo.create(data);
    const saved = await this.gestionRepo.save(nuevaGestion);
    const gestion = Array.isArray(saved) ? saved[0] : saved;
    await ensureCategoriasDefault(this.categoriaRepo, gestion.idGestion);
    return gestion;
  }

  async updateGestion(id: number, data: any) {
    if (data.activa) {
      await this.gestionRepo
        .createQueryBuilder()
        .update(Gestion)
        .set({ activa: false })
        .where('id_gestion != :id', { id })
        .execute();
    }

    const payload: Partial<Gestion> = {};
    const allowed = [
      'anio', 'edicion', 'lema', 'activa', 'nombreSitio', 'tituloPrincipal', 'subtituloPrincipal',
      'urlBanner', 'urlLogo', 'urlImagenLogin', 'urlMapaUbicacion',
      'modoMantenimiento', 'mostrarRanking', 'mostrarHistorico',
      'mostrarRankingEstadisticas', 'mostrarRankingConcursosExternos', 'rankingConcursosOcultos',
      'permiteInscripcionPublica',
      'limiteFraternidadesPorDanza',
      'landingFraternidades',
    ] as const;

    for (const key of allowed) {
      if (data[key] !== undefined) {
        (payload as any)[key] = data[key];
      }
    }

    if (payload.limiteFraternidadesPorDanza !== undefined) {
      const n = Number.parseInt(String(payload.limiteFraternidadesPorDanza), 10);
      payload.limiteFraternidadesPorDanza = Number.isNaN(n) || n < 1 ? 6 : Math.min(n, 999);
    }

    if (payload.edicion !== undefined) {
      payload.edicion = String(payload.edicion || '').trim().toUpperCase().slice(0, 20) || null;
    }

    if (payload.landingFraternidades !== undefined) {
      const raw = payload.landingFraternidades;
      const list = Array.isArray(raw) ? raw : [];
      payload.landingFraternidades = list.slice(0, 3).map((item: any) => ({
        titulo: String(item?.titulo || '').trim().slice(0, 120),
        subtitulo: String(item?.subtitulo || '').trim().slice(0, 120),
        descripcion: String(item?.descripcion || '').trim().slice(0, 500),
        urlImagen: String(item?.urlImagen || '').trim().slice(0, 500),
      }));
    }

    if (payload.rankingConcursosOcultos !== undefined) {
      const raw = payload.rankingConcursosOcultos;
      const list = Array.isArray(raw) ? raw : [];
      payload.rankingConcursosOcultos = [...new Set(
        list
          .map((id: any) => Number.parseInt(String(id), 10))
          .filter((id: number) => Number.isFinite(id) && id > 0),
      )];
    }

    await this.gestionRepo.update({ idGestion: id }, payload);
    const updated = await this.gestionRepo.findOne({ where: { idGestion: id } });
    if (updated && payload.limiteFraternidadesPorDanza !== undefined) {
      await recalcularExcedentesGestion(
        this.fraternidadRepo,
        id,
        updated.limiteFraternidadesPorDanza ?? 6,
      );
    }
    return updated;
  }

  async deleteGestion(id: number) {
    const g = await this.gestionRepo.findOne({ where: { idGestion: id } });
    if (!g) throw new NotFoundException('Gestión no encontrada');
    if (g.activa) {
      throw new BadRequestException('No se puede eliminar la gestión activa. Activa otra gestión primero.');
    }

    // Eliminar imágenes asociadas
    if (g.urlLogo) this.eliminarImagenSiExiste(g.urlLogo);
    if (g.urlBanner) this.eliminarImagenSiExiste(g.urlBanner);
    if (g.urlImagenLogin) this.eliminarImagenSiExiste(g.urlImagenLogin);

    const qr = this.dataSource.createQueryRunner();
    await qr.connect();
    await qr.startTransaction();
    try {
      // 1. Evaluaciones e incidencias / asistencias de la gestión
      await qr.query(`DELETE FROM evaluaciones WHERE id_gestion = $1`, [id]);
      await qr.query(`DELETE FROM incidencias WHERE id_gestion = $1`, [id]);
      await qr.query(`DELETE FROM asistencias WHERE id_gestion = $1`, [id]);

      // 2. Participantes de concursos
      await qr.query(`DELETE FROM participantes_concurso WHERE id_gestion = $1`, [id]);

      // 3. Criterios de la gestión
      await qr.query(`DELETE FROM criterios WHERE id_gestion = $1`, [id]);

      // 4. Desligar jurados de fases/fraternidades de esta gestión
      await qr.query(`
        DELETE FROM jurado_fases
        WHERE id_fase IN (SELECT id_fase FROM fases WHERE id_gestion = $1)
      `, [id]);
      await qr.query(`
        DELETE FROM jurado_fraternidades
        WHERE id_fraternidad IN (SELECT id_fraternidad FROM fraternidades WHERE id_gestion = $1)
      `, [id]);

      // 5. Fases de la gestión
      await qr.query(`DELETE FROM fases WHERE id_gestion = $1`, [id]);

      // 6. Monografías y documentos de fraternidades de la gestión
      await qr.query(`
        DELETE FROM monografias
        WHERE id_fraternidad IN (SELECT id_fraternidad FROM fraternidades WHERE id_gestion = $1)
      `, [id]);
      await qr.query(`
        DELETE FROM documentos_fraternidad
        WHERE id_fraternidad IN (SELECT id_fraternidad FROM fraternidades WHERE id_gestion = $1)
      `, [id]);

      // 7. Solicitudes y cronogramas
      await qr.query(`UPDATE usuarios SET id_fraternidad = NULL WHERE id_fraternidad IN (
        SELECT id_fraternidad FROM fraternidades WHERE id_gestion = $1
      )`, [id]);
      await qr.query(`UPDATE solicitudes_inscripcion SET id_fraternidad_creada = NULL WHERE id_gestion = $1`, [id]);
      await qr.query(`DELETE FROM solicitudes_inscripcion WHERE id_gestion = $1`, [id]);
      await qr.query(`DELETE FROM cronograma_inscripciones WHERE id_gestion = $1`, [id]);
      await qr.query(`DELETE FROM cronogramas_actividad WHERE id_gestion = $1`, [id]);

      // 8. Fraternidades, infracciones, categorías, documentos
      await qr.query(`DELETE FROM fraternidades WHERE id_gestion = $1`, [id]);
      await qr.query(`DELETE FROM infracciones WHERE id_gestion = $1`, [id]);
      await qr.query(`DELETE FROM categorias WHERE id_gestion = $1`, [id]);
      await qr.query(`DELETE FROM documentos_gestion WHERE id_gestion = $1`, [id]);

      // 9. Jurados de la gestión (si no tienen más vínculo crítico)
      await qr.query(`DELETE FROM jurados WHERE id_gestion = $1`, [id]);

      // 10. Desligar auditoría/sesiones (opcional)
      try {
        await qr.query(`UPDATE sesiones_usuario SET id_gestion = NULL WHERE id_gestion = $1`, [id]);
      } catch { /* ignore */ }
      try {
        await qr.query(`UPDATE auditoria_acciones SET id_gestion = NULL WHERE id_gestion = $1`, [id]);
      } catch { /* ignore */ }

      await qr.query(`DELETE FROM gestiones WHERE id_gestion = $1`, [id]);

      await qr.commitTransaction();
      return { success: true, message: `Gestión ${g.anio} eliminada correctamente` };
    } catch (err: any) {
      await qr.rollbackTransaction();
      const detail = err?.driverError?.detail || err?.message || 'Error desconocido';
      throw new BadRequestException(`No se pudo eliminar la gestión: ${detail}`);
    } finally {
      await qr.release();
    }
  }

  // --- CRUD HELPERS ---
  private normalizarFechasFase(payload: any) {
    const toDateOrNull = (v: unknown) => {
      if (v === undefined) return undefined;
      if (v === null || v === '') return null;
      const d = new Date(String(v));
      return Number.isNaN(d.getTime()) ? null : d;
    };
    if ('fechaInicio' in payload) payload.fechaInicio = toDateOrNull(payload.fechaInicio);
    if ('fechaFin' in payload) payload.fechaFin = toDateOrNull(payload.fechaFin);
    if ('fechaInicioInscripcion' in payload) {
      payload.fechaInicioInscripcion = toDateOrNull(payload.fechaInicioInscripcion);
    }
    if ('fechaFinInscripcion' in payload) {
      payload.fechaFinInscripcion = toDateOrNull(payload.fechaFinInscripcion);
    }

    const iniCal = payload.fechaInicio ?? undefined;
    const finCal = payload.fechaFin ?? undefined;
    if (iniCal && finCal && finCal < iniCal) {
      throw new BadRequestException('La fecha fin de calificación debe ser posterior al inicio.');
    }

    const iniIns = payload.fechaInicioInscripcion ?? undefined;
    const finIns = payload.fechaFinInscripcion ?? undefined;
    if ((iniIns && !finIns) || (!iniIns && finIns)) {
      throw new BadRequestException('Debes indicar inicio y fin de inscripción, o ninguno.');
    }
    if (iniIns && finIns && finIns < iniIns) {
      throw new BadRequestException('La fecha fin de inscripción debe ser posterior al inicio.');
    }
  }

  /** Normaliza enlace padre/cupo en fases EXTERNO. */
  private async aplicarEnlaceYCupoFase(
    payload: any,
    opts: { idGestion: number; idFaseActual?: number; faseActual?: Fase },
  ) {
    const tipo = String(payload.tipoConcurso || opts.faseActual?.tipoConcurso || 'EFU');
    if (tipo !== 'EXTERNO') {
      payload.fasePadre = null;
      payload.cupoFinalistas = null;
      delete payload.idFasePadre;
      return;
    }

    if ('cupoFinalistas' in payload) {
      const raw = payload.cupoFinalistas;
      if (raw === null || raw === '' || raw === undefined) {
        payload.cupoFinalistas = null;
      } else {
        const n = Number.parseInt(String(raw), 10);
        if (!Number.isFinite(n) || n < 1) {
          throw new BadRequestException('El cupo de finalistas debe ser un entero ≥ 1.');
        }
        payload.cupoFinalistas = n;
      }
    }

    if ('idFasePadre' in payload) {
      const idPadre = payload.idFasePadre == null || payload.idFasePadre === ''
        ? null
        : Number.parseInt(String(payload.idFasePadre), 10);
      delete payload.idFasePadre;

      if (!idPadre) {
        payload.fasePadre = null;
      } else {
        if (opts.idFaseActual && idPadre === opts.idFaseActual) {
          throw new BadRequestException('Una fase no puede enlazarse a sí misma.');
        }
        const padre = await this.faseRepo.findOne({
          where: { idFase: idPadre },
          relations: ['gestion', 'fasePadre'],
        });
        if (!padre) throw new NotFoundException('Fase padre no encontrada.');
        if (padre.tipoConcurso !== 'EXTERNO') {
          throw new BadRequestException('La fase padre debe ser un concurso externo.');
        }
        if (padre.gestion?.idGestion !== opts.idGestion) {
          throw new BadRequestException('La fase padre debe pertenecer a la misma gestión.');
        }
        // Evitar ciclos: caminar ancestros
        let cursor: Fase | null = padre;
        const visited = new Set<number>([opts.idFaseActual || 0].filter(Boolean));
        while (cursor) {
          if (visited.has(cursor.idFase)) {
            throw new BadRequestException('El enlace de fases formaría un ciclo.');
          }
          visited.add(cursor.idFase);
          if (!cursor.fasePadre?.idFase) break;
          cursor = await this.faseRepo.findOne({
            where: { idFase: cursor.fasePadre.idFase },
            relations: ['fasePadre'],
          });
        }
        payload.fasePadre = { idFase: idPadre } as Fase;
        // Hija no abre inscripción propia
        payload.fechaInicioInscripcion = null;
        payload.fechaFinInscripcion = null;
      }
    }
  }

  async createFase(data: any) {
    const gestion = data.gestionId ? await this.gestionRepo.findOne({ where: { idGestion: data.gestionId } }) : await this.getGestionActiva();
    if (!gestion) throw new NotFoundException('No gestion');

    const { gestionId, juradosIds, clavesCampos, clavesDocumentos, ...rest } = data;
    const payload: any = { ...rest, gestion };
    this.normalizarFechasFase(payload);

    if (payload.tipoConcurso === 'EXTERNO') {
      const { buildRequisitosFromSeleccion, normalizarRequisitos } = await import('../common/requisitos-concurso');
      const plantilla = String(payload.plantillaRequisitos || 'generico').toLowerCase();
      if (!['fotografia', 'chacha_warmi', 'generico'].includes(plantilla)) {
        throw new BadRequestException(
          'Plantilla inválida. Usa: fotografia, chacha_warmi u otros (generico).',
        );
      }
      payload.plantillaRequisitos = plantilla;
      if (payload.requisitosInscripcion) {
        payload.requisitosInscripcion = normalizarRequisitos(payload.requisitosInscripcion);
      } else {
        payload.requisitosInscripcion = buildRequisitosFromSeleccion(
          plantilla,
          clavesCampos,
          clavesDocumentos,
        );
      }
    } else {
      payload.plantillaRequisitos = null;
      payload.requisitosInscripcion = null;
      payload.fechaInicioInscripcion = null;
      payload.fechaFinInscripcion = null;
    }

    await this.aplicarEnlaceYCupoFase(payload, { idGestion: gestion.idGestion });

    const created = this.faseRepo.create(payload);
    const nuevaFase = Array.isArray(created) ? created[0] : created;
    const f = await this.faseRepo.save(nuevaFase);
    if (juradosIds?.length) {
      await this.syncJuradosFase(f, juradosIds);
    }
    return this.faseRepo.findOne({ where: { idFase: f.idFase }, relations: ['fasePadre', 'gestion'] });
  }

  async updateFase(id: number, data: any) {
    const f = await this.faseRepo.findOne({
      where: { idFase: id },
      relations: ['gestion', 'fasePadre'],
    });
    if (!f) throw new NotFoundException('Fase no encontrada');
    if (data.urlImagen && f.urlImagen && data.urlImagen !== f.urlImagen) this.eliminarImagenSiExiste(f.urlImagen);

    const { gestionId, juradosIds, clavesCampos, clavesDocumentos, ...rest } = data;
    const payload: any = { ...rest };
    this.normalizarFechasFase(payload);

    if ((payload.tipoConcurso || f.tipoConcurso) === 'EXTERNO') {
      const { buildRequisitosFromSeleccion, normalizarRequisitos } = await import('../common/requisitos-concurso');
      if (payload.requisitosInscripcion) {
        payload.requisitosInscripcion = normalizarRequisitos(payload.requisitosInscripcion);
      } else if (clavesCampos || clavesDocumentos || payload.plantillaRequisitos) {
        payload.requisitosInscripcion = buildRequisitosFromSeleccion(
          payload.plantillaRequisitos || f.plantillaRequisitos || 'generico',
          clavesCampos,
          clavesDocumentos,
        );
      }
    } else if (payload.tipoConcurso === 'EFU') {
      payload.plantillaRequisitos = null;
      payload.requisitosInscripcion = null;
      payload.fechaInicioInscripcion = null;
      payload.fechaFinInscripcion = null;
    }

    await this.aplicarEnlaceYCupoFase(payload, {
      idGestion: f.gestion?.idGestion,
      idFaseActual: f.idFase,
      faseActual: f,
    });

    Object.assign(f, payload);
    const saved = await this.faseRepo.save(f);

    if (juradosIds !== undefined) {
      await this.syncJuradosFase(saved, Array.isArray(juradosIds) ? juradosIds : []);
    }

    return this.faseRepo.findOne({ where: { idFase: saved.idFase }, relations: ['fasePadre', 'gestion'] });
  }

  /** Sincroniza qué jurados tienen habilitada una fase (crear/editar fase o modal de asignación). */
  private async syncJuradosFase(fase: Fase, juradoIds: number[]) {
    const target = new Set(juradoIds.filter((id) => Number.isFinite(id)));
    const jurados = await this.juradoRepo.find({ relations: ['fasesHabilitadas'] });

    for (const jurado of jurados) {
      const tieneFase = jurado.fasesHabilitadas.some((hf) => hf.idFase === fase.idFase);
      const debeTener = target.has(jurado.idJurado);

      if (debeTener && !tieneFase) {
        jurado.fasesHabilitadas.push(fase);
        await this.juradoRepo.save(jurado);
      } else if (!debeTener && tieneFase) {
        jurado.fasesHabilitadas = jurado.fasesHabilitadas.filter((hf) => hf.idFase !== fase.idFase);
        await this.juradoRepo.save(jurado);
      }
    }
  }

  async deleteFase(id: number) {
    const f = await this.faseRepo.findOne({ where: { idFase: id } });
    if (f && f.urlImagen) this.eliminarImagenSiExiste(f.urlImagen);
    return this.faseRepo.delete(id);
  }

  async createCriterio(data: any) { return this.criterioRepo.save(this.criterioRepo.create(data)); }
  async updateCriterio(id: number, data: any) { await this.criterioRepo.update(id, data); return this.criterioRepo.findOne({ where: { idCriterio: id } }); }
  async deleteCriterio(id: number) { return this.criterioRepo.delete(id); }

  // ── Documentos de Gestión (Reglamentos, circulares, etc.) ──────────────────

  async getDocumentosGestion(idGestion?: number, soloPublicos?: boolean) {
    let gestion: any;
    if (idGestion) {
      gestion = await this.gestionRepo.findOne({ where: { idGestion } });
    } else {
      gestion = await this.gestionRepo.findOne({ where: { activa: true } });
    }
    if (!gestion) return [];
    const where: any = { gestion: { idGestion: gestion.idGestion } };
    if (soloPublicos) where.esPublico = true;
    return this.documentoGestionRepo.find({
      where,
      order: { orden: 'ASC', createdAt: 'ASC' },
    });
  }

  async createDocumentoGestion(dto: { titulo: string; descripcion?: string; tipo?: string; urlPdf: string; orden?: number; esPublico?: boolean }, idGestion?: number) {
    let gestion: any;
    if (idGestion) {
      gestion = await this.gestionRepo.findOne({ where: { idGestion } });
    } else {
      gestion = await this.gestionRepo.findOne({ where: { activa: true } });
    }
    if (!gestion) throw new BadRequestException('No hay gestión activa.');
    const doc = this.documentoGestionRepo.create({ ...dto, gestion });
    return this.documentoGestionRepo.save(doc);
  }

  async updateDocumentoGestion(id: number, dto: any) {
    await this.documentoGestionRepo.update(id, dto);
    return this.documentoGestionRepo.findOne({ where: { idDocumento: id } });
  }

  async deleteDocumentoGestion(id: number) {
    const doc = await this.documentoGestionRepo.findOne({ where: { idDocumento: id } });
    if (!doc) throw new NotFoundException('Documento no encontrado');
    // Eliminar archivo físico
    try {
      const filename = doc.urlPdf.split('/').pop();
      const filePath = path.join(process.cwd(), 'uploads', 'Doc_Gestion', filename);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    } catch (e) {}
    return this.documentoGestionRepo.delete(id);
  }

  private eliminarImagenSiExiste(url: string) {
    try { const p = path.join(process.cwd(), url.replace('/api/v1/archivos/', 'uploads/')); if (fs.existsSync(p)) fs.unlinkSync(p); } catch (e) {}
  }

  /** Presets de infracciones por gestión (no sobrescribe valores ya guardados en producción). */
  static readonly PRESETS_INFRACCION: Array<{
    codigo: string;
    nombre: string;
    valorImpacto: number;
    tipoImpacto: string;
  }> = [
    { codigo: 'AMARILLA', nombre: 'Bandera Amarilla - Disciplina', valorImpacto: -1, tipoImpacto: 'RESTA_PUNTOS' },
    { codigo: 'ROJA', nombre: 'Bandera Roja - Disciplina', valorImpacto: -2, tipoImpacto: 'RESTA_PUNTOS' },
    { codigo: 'SANCION_ALCOHOL', nombre: 'Sanción: Consumo de Bebidas Alcohólicas', valorImpacto: -30, tipoImpacto: 'RESTA_PUNTOS' },
    { codigo: 'SANCION_AGRESION', nombre: 'Sanción: Agresividad (Suspensión 1 Año)', valorImpacto: 0, tipoImpacto: 'SUSPENSION' },
    { codigo: 'SANCION_BANDA', nombre: 'Sanción: Exceso de Bandas/Músicos', valorImpacto: -30, tipoImpacto: 'RESTA_PUNTOS' },
    { codigo: 'SANCION_AJENO', nombre: 'Sanción: Personal ajeno a la UMSA (Suspensión 1 Año)', valorImpacto: 0, tipoImpacto: 'SUSPENSION' },
  ];

  async ensureInfraccionesPreset(idGestion: number) {
    const gestion = await this.gestionRepo.findOne({ where: { idGestion } });
    if (!gestion) throw new NotFoundException('Gestión no encontrada');
    const creadas: Infraccion[] = [];
    for (const p of EvaluacionesService.PRESETS_INFRACCION) {
      let inf = await this.infraccionRepo.findOne({
        where: { nombre: p.nombre, gestion: { idGestion } },
      });
      if (!inf) {
        inf = await this.infraccionRepo.save(
          this.infraccionRepo.create({
            nombre: p.nombre,
            tipoImpacto: p.tipoImpacto,
            valorImpacto: p.valorImpacto,
            gestion,
          }),
        );
        creadas.push(inf);
      }
    }
    return { gestion: { idGestion: gestion.idGestion, anio: gestion.anio }, creadas: creadas.length };
  }

  async listarInfracciones(idGestion?: number) {
    const gestion = idGestion
      ? await this.gestionRepo.findOne({ where: { idGestion } })
      : await this.getGestionActiva();
    if (!gestion) throw new NotFoundException('No hay gestión activa');
    await this.ensureInfraccionesPreset(gestion.idGestion);
    const items = await this.infraccionRepo.find({
      where: { gestion: { idGestion: gestion.idGestion } },
      order: { nombre: 'ASC' },
    });
    return {
      gestion: { idGestion: gestion.idGestion, anio: gestion.anio },
      items: items.map((i) => ({
        idInfraccion: i.idInfraccion,
        nombre: i.nombre,
        tipoImpacto: i.tipoImpacto || 'RESTA_PUNTOS',
        valorImpacto: Number(i.valorImpacto) || 0,
        codigoPreset:
          EvaluacionesService.PRESETS_INFRACCION.find((p) => p.nombre === i.nombre)?.codigo || null,
      })),
    };
  }

  async crearInfraccion(data: {
    idGestion?: number;
    nombre: string;
    tipoImpacto?: string;
    valorImpacto?: number;
  }) {
    const gestion = data.idGestion
      ? await this.gestionRepo.findOne({ where: { idGestion: data.idGestion } })
      : await this.getGestionActiva();
    if (!gestion) throw new NotFoundException('No hay gestión activa');
    const nombre = String(data.nombre || '').trim();
    if (!nombre) throw new BadRequestException('El nombre de la infracción es obligatorio.');
    const existe = await this.infraccionRepo.findOne({
      where: { nombre, gestion: { idGestion: gestion.idGestion } },
    });
    if (existe) {
      throw new BadRequestException('Ya existe una infracción con ese nombre en esta gestión.');
    }
    const tipoImpacto =
      data.tipoImpacto === 'SUSPENSION' ? 'SUSPENSION' : 'RESTA_PUNTOS';
    const valorImpacto = Number(data.valorImpacto) || 0;
    const saved = await this.infraccionRepo.save(
      this.infraccionRepo.create({
        nombre,
        tipoImpacto,
        valorImpacto,
        gestion,
      }),
    );
    return {
      idInfraccion: saved.idInfraccion,
      nombre: saved.nombre,
      tipoImpacto: saved.tipoImpacto,
      valorImpacto: Number(saved.valorImpacto) || 0,
    };
  }

  async actualizarInfraccion(
    idInfraccion: number,
    data: { nombre?: string; tipoImpacto?: string; valorImpacto?: number },
  ) {
    const inf = await this.infraccionRepo.findOne({
      where: { idInfraccion },
      relations: ['gestion'],
    });
    if (!inf) throw new NotFoundException('Infracción no encontrada');
    if (data.nombre !== undefined) {
      const nombre = String(data.nombre || '').trim();
      if (!nombre) throw new BadRequestException('Nombre inválido.');
      const dup = await this.infraccionRepo.findOne({
        where: { nombre, gestion: { idGestion: inf.gestion.idGestion } },
      });
      if (dup && dup.idInfraccion !== idInfraccion) {
        throw new BadRequestException('Ya existe otra infracción con ese nombre.');
      }
      inf.nombre = nombre;
    }
    if (data.tipoImpacto !== undefined) {
      inf.tipoImpacto = data.tipoImpacto === 'SUSPENSION' ? 'SUSPENSION' : 'RESTA_PUNTOS';
    }
    if (data.valorImpacto !== undefined) {
      inf.valorImpacto = Number(data.valorImpacto) || 0;
    }
    const saved = await this.infraccionRepo.save(inf);
    return {
      idInfraccion: saved.idInfraccion,
      nombre: saved.nombre,
      tipoImpacto: saved.tipoImpacto,
      valorImpacto: Number(saved.valorImpacto) || 0,
    };
  }

  async eliminarInfraccion(idInfraccion: number) {
    const inf = await this.infraccionRepo.findOne({ where: { idInfraccion } });
    if (!inf) throw new NotFoundException('Infracción no encontrada');
    const usadas = await this.incidenciaRepo.count({
      where: { infraccion: { idInfraccion } },
    });
    if (usadas > 0) {
      throw new BadRequestException(
        `No se puede eliminar: hay ${usadas} incidencia(s) que usan esta infracción. Puedes editar su valor para futuros casos.`,
      );
    }
    await this.infraccionRepo.delete(idInfraccion);
    return { ok: true };
  }

  async registrarPenalizacionDisciplina(
    idUsuario: number,
    idFase: number,
    idFraternidad: number,
    tipo: string,
    observacion?: string,
    idInfraccion?: number,
  ) {
    const gestion = await this.getGestionActiva();
    if (!gestion) throw new BadRequestException('No hay gestión activa.');

    const fraternidad = await this.fraternidadRepo.findOne({ where: { idFraternidad } });
    if (!fraternidad) throw new NotFoundException('Fraternidad no encontrada.');
    if (!fraternidad.habilitadoEfu) {
      throw new ForbiddenException('Esta fraternidad aún no está habilitada para sanciones o calificación.');
    }

    const usuario = await this.usuarioRepo.findOne({ where: { idUsuario } });

    await this.ensureInfraccionesPreset(gestion.idGestion);

    let infraccion: Infraccion | null = null;

    if (idInfraccion) {
      infraccion = await this.infraccionRepo.findOne({
        where: { idInfraccion, gestion: { idGestion: gestion.idGestion } },
      });
      if (!infraccion) {
        throw new NotFoundException('Infracción no encontrada en la gestión activa.');
      }
    } else {
      const preset = EvaluacionesService.PRESETS_INFRACCION.find(
        (p) => p.codigo === tipo || p.nombre === tipo,
      );
      const nombreInfraccion = preset?.nombre || String(tipo || '').trim();
      if (!nombreInfraccion) {
        throw new BadRequestException('Indica el tipo de sanción o el id de infracción.');
      }
      infraccion = await this.infraccionRepo.findOne({
        where: { nombre: nombreInfraccion, gestion: { idGestion: gestion.idGestion } },
      });
      if (!infraccion && preset) {
        infraccion = await this.infraccionRepo.save(
          this.infraccionRepo.create({
            nombre: preset.nombre,
            tipoImpacto: preset.tipoImpacto,
            valorImpacto: preset.valorImpacto,
            gestion,
          }),
        );
      }
      if (!infraccion) {
        throw new BadRequestException(
          'Infracción no encontrada. Crea el tipo en el catálogo de infracciones o usa un preset válido.',
        );
      }
    }

    const incidencia = this.incidenciaRepo.create({
      gestion,
      fraternidad,
      usuario,
      infraccion,
      observacion: observacion || `Registrado por controlador HCU`,
    });

    return this.incidenciaRepo.save(incidencia);
  }

  async removerPenalizacion(idIncidencia: number) {
    const inc = await this.incidenciaRepo.findOne({ where: { idIncidencia } });
    if (!inc) throw new NotFoundException('Penalización no encontrada');

    return this.incidenciaRepo.delete(idIncidencia);
  }

  // --- REPORTES HISTORICOS ---
  async getReportesGestionesPublicas() {
    return this.gestionRepo.find({
      select: ['idGestion', 'anio', 'lema', 'activa'],
      order: { anio: 'DESC' }
    });
  }

  /**
   * Matriz de calificaciones EFU: por fraternidad → jurados (notas por fase) +
   * promedio final + sanciones dinámicas + nota Chacha-Warmi (1 pareja).
   */
  async getMatrizCalificaciones(idGestion: number) {
    const gestion = await this.gestionRepo.findOne({ where: { idGestion } });
    if (!gestion) throw new NotFoundException('Gestión no encontrada');

    const fasesEfu = await this.faseRepo.find({
      where: { gestion: { idGestion }, tipoConcurso: 'EFU' },
      order: { idFase: 'ASC' },
    });
    const fasesEfuMeta = fasesEfu.map((f) => ({
      idFase: f.idFase,
      nombre: f.nombre,
      categoriaEfu: f.categoriaEfu || null,
    }));

    const frats = await this.fraternidadRepo.find({
      where: {
        habilitadoEfu: true,
        gestion: { idGestion },
        nivelRepresentacion: Not('Externo'),
      },
      relations: ['categoria', 'facultad', 'carrera', 'institucionExterna', 'tipoDanza'],
      order: { nombre: 'ASC' },
    });

    const evsEfu = await this.evaluacionRepo.find({
      where: {
        estado: 'COMPLETADO',
        fase: { gestion: { idGestion }, tipoConcurso: 'EFU' },
      },
      relations: ['fraternidad', 'fase', 'jurado', 'jurado.usuario'],
    });

    const incidencias = await this.incidenciaRepo.find({
      where: { gestion: { idGestion } },
      relations: ['fraternidad', 'infraccion'],
    });

    const scores = calcularScoresEfu(
      evsEfu.map((e) => actaDesdeEvaluacion(e)).filter((a): a is NonNullable<typeof a> => !!a),
    );

    // Chacha-Warmi: promedio de actas por fraternidad (nota de la pareja)
    const evsChacha = await this.evaluacionRepo
      .createQueryBuilder('e')
      .leftJoinAndSelect('e.fraternidad', 'fr')
      .leftJoinAndSelect('e.fase', 'fase')
      .leftJoin('fase.gestion', 'g')
      .where('e.estado = :est', { est: 'COMPLETADO' })
      .andWhere('g.id_gestion = :idGestion', { idGestion })
      .andWhere('fase.tipo_concurso = :tipo', { tipo: 'EXTERNO' })
      .andWhere(
        `(fase.plantilla_requisitos = :plant OR LOWER(fase.nombre) LIKE :nom)`,
        { plant: 'chacha_warmi', nom: '%chacha%' },
      )
      .andWhere('e.id_fraternidad IS NOT NULL')
      .getMany();

    const partsChacha = await this.participanteRepo
      .createQueryBuilder('p')
      .leftJoinAndSelect('p.fraternidad', 'pf')
      .leftJoinAndSelect('p.fase', 'fase')
      .leftJoin('fase.gestion', 'g')
      .where('g.id_gestion = :idGestion', { idGestion })
      .andWhere('fase.tipo_concurso = :tipo', { tipo: 'EXTERNO' })
      .andWhere(
        `(fase.plantilla_requisitos = :plant OR LOWER(fase.nombre) LIKE :nom)`,
        { plant: 'chacha_warmi', nom: '%chacha%' },
      )
      .getMany();

    const chachaPorFrat = new Map<
      number,
      { sum: number; count: number; nombres: string[]; idFase: number | null; nombreFase: string | null }
    >();
    for (const e of evsChacha) {
      const idFrat = e.fraternidad?.idFraternidad;
      if (!idFrat) continue;
      let acc = chachaPorFrat.get(idFrat);
      if (!acc) {
        acc = {
          sum: 0,
          count: 0,
          nombres: [],
          idFase: e.fase?.idFase ?? null,
          nombreFase: e.fase?.nombre ?? null,
        };
        chachaPorFrat.set(idFrat, acc);
      }
      acc.sum += Number(e.puntajeTotal) || 0;
      acc.count++;
    }
    for (const p of partsChacha) {
      const idFrat = p.fraternidad?.idFraternidad;
      if (!idFrat) continue;
      let acc = chachaPorFrat.get(idFrat);
      if (!acc) {
        acc = {
          sum: 0,
          count: 0,
          nombres: [],
          idFase: p.fase?.idFase ?? null,
          nombreFase: p.fase?.nombre ?? null,
        };
        chachaPorFrat.set(idFrat, acc);
      }
      if (p.nombre && !acc.nombres.includes(p.nombre)) acc.nombres.push(p.nombre);
    }

    const grupos = frats.map((f) => {
      const score = scores.get(f.idFraternidad);
      const sanciones = incidencias
        .filter((i) => i.fraternidad?.idFraternidad === f.idFraternidad && i.infraccion)
        .map((i) => ({
          nombre: i.infraccion.nombre,
          valor: Number(i.infraccion.valorImpacto) || 0,
          tipoImpacto: i.infraccion.tipoImpacto || 'RESTA_PUNTOS',
        }));
      const impactoSanciones = round2(
        sanciones.reduce((s, x) => s + (Number(x.valor) || 0), 0),
      );
      const promedioFinal = score?.promedioFinal ?? 0;
      const puntajeFinal = Math.max(0, round2(promedioFinal + impactoSanciones));
      const suspendida = sanciones.some((s) => s.tipoImpacto === 'SUSPENSION');

      const jurados = (score?.jurados || []).map((j) => {
        const notasPorFase: Record<number, number | null> = {};
        for (const fase of fasesEfuMeta) {
          const acta = j.fases.find((x) => x.idFase === fase.idFase);
          notasPorFase[fase.idFase] = acta ? round2(acta.puntajeTotal) : null;
        }
        return {
          idJurado: j.idJurado,
          juradoNombre: j.juradoNombre,
          notasPorFase,
          totalEfu: j.notaFraternidad,
          fasesCalificadas: j.fasesCalificadas,
        };
      });

      const chachaAcc = chachaPorFrat.get(f.idFraternidad);
      const chachaWarmi = chachaAcc && chachaAcc.count > 0
        ? {
            nota: round2(chachaAcc.sum / chachaAcc.count),
            nombres: chachaAcc.nombres,
            idFase: chachaAcc.idFase,
            nombreFase: chachaAcc.nombreFase,
          }
        : null;

      const pertenencia =
        f.facultad?.nombre ||
        f.carrera?.nombre ||
        f.institucionExterna?.nombre ||
        f.nivelRepresentacion ||
        '—';

      return {
        idFraternidad: f.idFraternidad,
        nombreFraternidad: f.nombre,
        categoria: f.categoria?.nombre || 'General',
        tipoDanza: f.tipoDanza?.nombre || '—',
        pertenencia,
        cantidadJurados: score?.cantidadJurados ?? 0,
        jurados,
        promedioFinal,
        promedioJurado: promedioFinal,
        impactoSanciones,
        detalleSanciones: sanciones.map((s) => s.nombre).join(' · ') || '—',
        sanciones,
        suspendida,
        puntajeFinal,
        chachaWarmi,
      };
    });

    // Orden por puntaje final (ranking)
    grupos.sort((a, b) => b.puntajeFinal - a.puntajeFinal);
    grupos.forEach((g, i) => {
      (g as any).puesto = i + 1;
      (g as any).nro = i + 1;
    });

    return {
      gestion: {
        idGestion: gestion.idGestion,
        anio: gestion.anio,
        lema: gestion.lema,
        activa: gestion.activa,
      },
      fasesEfu: fasesEfuMeta,
      formula: `${FORMULA_EFU_PROMEDIO}; final = max(0, Promedio Final + sanciones); fases no calificadas no restan`,
      grupos,
    };
  }

  async getReporteHistorico(idGestion: number) {
    const gestion = await this.gestionRepo.findOne({ where: { idGestion } });
    if (!gestion) throw new NotFoundException('Gestión no encontrada');

    // 1. Fraternidades y Ranking EFU
    const frats = await this.fraternidadRepo.find({
      where: { habilitadoEfu: true, gestion: { idGestion }, nivelRepresentacion: Not('Externo') },
      relations: ['categoria', 'facultad', 'carrera', 'institucionExterna']
    });

    const evsEfu = await this.evaluacionRepo.find({
      where: { estado: 'COMPLETADO', fase: { gestion: { idGestion }, tipoConcurso: 'EFU' } },
      relations: ['fraternidad', 'jurado']
    });

    const incidencias = await this.incidenciaRepo.find({
      where: { gestion: { idGestion } },
      relations: ['fraternidad', 'infraccion']
    });

    const rankingMap = new Map<number, any>();
    frats.forEach(f => {
      let representacion = f.facultad?.nombre || f.carrera?.nombre || f.institucionExterna?.nombre || f.nivelRepresentacion || 'General';
      rankingMap.set(f.idFraternidad, {
        idFraternidad: f.idFraternidad,
        nombre: f.nombre,
        categoria: f.categoria?.nombre || 'General',
        representacion,
        promedioJurado: 0,
        promedioFinal: 0,
        cantidadJurados: 0,
        impactoSanciones: 0,
        sanciones: [] as { nombre: string; valor: number; tipoImpacto: string }[],
        suspendida: false,
        puntajeFinal: 0,
        fechaHoraCalificacion: null
      });
    });

    const scoresHist = calcularScoresEfu(
      evsEfu.map((e) => actaDesdeEvaluacion(e)).filter((a): a is NonNullable<typeof a> => !!a),
    );
    scoresHist.forEach((score, idFrat) => {
      const ex = rankingMap.get(idFrat);
      if (ex) {
        ex.promedioJurado = score.promedioFinal;
        ex.promedioFinal = score.promedioFinal;
        ex.cantidadJurados = score.cantidadJurados;
      }
    });

    evsEfu.forEach(e => {
      if (!e.fraternidad) return;
      const ex = rankingMap.get(e.fraternidad.idFraternidad);
      if (ex && e.fechaCierre) {
        const date = new Date(e.fechaCierre);
        if (!ex.fechaHoraCalificacion || date > new Date(ex.fechaHoraCalificacion)) {
          ex.fechaHoraCalificacion = e.fechaCierre;
        }
      }
    });

    incidencias.forEach(i => {
      if (!i.fraternidad || !i.infraccion) return;
      const ex = rankingMap.get(i.fraternidad.idFraternidad);
      if (ex) {
        const valor = Number(i.infraccion.valorImpacto) || 0;
        const tipoImpacto = i.infraccion.tipoImpacto || 'RESTA_PUNTOS';
        ex.impactoSanciones += valor;
        ex.sanciones.push({
          nombre: i.infraccion.nombre,
          valor,
          tipoImpacto,
        });
        if (tipoImpacto === 'SUSPENSION') ex.suspendida = true;
      }
    });

    const rankingEfu = Array.from(rankingMap.values()).map(r => {
      r.impactoSanciones = round2(r.impactoSanciones || 0);
      r.puntajeFinal = Math.max(0, round2((r.promedioFinal || r.promedioJurado || 0) + r.impactoSanciones));
      r.promedioJurado = round2(r.promedioJurado || 0);
      r.promedioFinal = round2(r.promedioFinal || r.promedioJurado || 0);
      return r;
    }).sort((a, b) => b.puntajeFinal - a.puntajeFinal)
      .map((r, index) => ({ ...r, puesto: index + 1 }));

    // 2. Concursos Externos (Chacha Warmi, etc.)
    const evsExt = await this.evaluacionRepo.find({
      where: { estado: 'COMPLETADO', fase: { gestion: { idGestion }, tipoConcurso: 'EXTERNO' } },
      relations: ['participante', 'participante.fraternidad', 'fase']
    });

    const concursosMap = new Map<number, { nombreConcurso: string, participantesMap: Map<number, any> }>();

    evsExt.forEach(e => {
      if (!e.participante || !e.fase) return;
      
      const idFase = e.fase.idFase;
      const nombreConcurso = e.fase.nombre;
      
      if (!concursosMap.has(idFase)) {
        concursosMap.set(idFase, {
          nombreConcurso,
          participantesMap: new Map<number, any>()
        });
      }
      
      const concurso = concursosMap.get(idFase);
      const idPart = e.participante.idParticipante;
      const pts = Number(e.puntajeTotal) || 0;
      
      if (!concurso.participantesMap.has(idPart)) {
        concurso.participantesMap.set(idPart, {
          idParticipante: idPart,
          nombre: e.participante.nombre,
          tipo: e.participante.tipo || 'Participante',
          fraternidad: e.participante.fraternidad?.nombre || e.participante.institucionExterna || 'Independiente',
          sum: 0,
          count: 0,
          fechaHoraCalificacion: null
        });
      }
      
      const part = concurso.participantesMap.get(idPart);
      part.sum += pts;
      part.count++;
      
      if (e.fechaCierre) {
        const date = new Date(e.fechaCierre);
        if (!part.fechaHoraCalificacion || date > new Date(part.fechaHoraCalificacion)) {
          part.fechaHoraCalificacion = e.fechaCierre;
        }
      }
    });

    const concursosExternos = Array.from(concursosMap.entries()).map(([idFase, data]) => {
      const participantes = Array.from(data.participantesMap.values()).map(p => ({
        nombre: p.nombre,
        tipo: p.tipo,
        fraternidad: p.fraternidad,
        puntajeFinal: Number((p.sum / p.count).toFixed(2)),
        fechaHoraCalificacion: p.fechaHoraCalificacion
      })).sort((a, b) => b.puntajeFinal - a.puntajeFinal)
        .map((p, index) => ({ ...p, puesto: index + 1 }));

      return {
        idFase,
        nombreConcurso: data.nombreConcurso,
        participantes
      };
    });

    return {
      gestion: {
        idGestion: gestion.idGestion,
        anio: gestion.anio,
        lema: gestion.lema,
        activa: gestion.activa,
        fechaGeneracion: new Date()
      },
      formula: `${FORMULA_EFU_PROMEDIO}; final = max(0, Promedio Final + sanciones)`,
      rankingEfu,
      concursosExternos
    };
  }

  async generarPdfReporteHistorico(idGestion: number, res: any) {
    const PDFDocument = require('pdfkit');
    const doc = new PDFDocument({ margin: 50, size: 'A4', autoFirstPage: true });

    const reporte = await this.getReporteHistorico(idGestion);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=Reporte_EFU_${reporte.gestion.anio}.pdf`);
    doc.pipe(res);

    const formatDate = (d: any) => {
      if (!d) return 'N/A';
      const date = new Date(d);
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      return `${day}/${month}/${year} ${hours}:${minutes}`;
    };

    let pageCount = 1;

    const drawFooter = (page: number) => {
      doc.save();
      doc.fontSize(8).fillColor('#64748b');
      doc.moveTo(50, 765).lineTo(545, 765).lineWidth(0.5).strokeColor('#cbd5e1').stroke();
      doc.text('UMSA - Entrada Universitaria - Reporte Oficial de Calificaciones', 50, 770, { width: 300 });
      doc.text(`Página ${page}`, 450, 770, { width: 95, align: 'right' });
      doc.restore();
    };

    const lemaSubtitle = reporte.gestion.lema ? `"${reporte.gestion.lema}"` : undefined;
    const { contentStartY } = drawPdfInstitutionalHeader(
      doc,
      `REPORTE HISTÓRICO DE CALIFICACIONES - GESTIÓN ${reporte.gestion.anio}`,
      lemaSubtitle,
    );

    let currentY = contentStartY;

    if (reporte.formula) {
      doc.fontSize(7).fillColor('#64748b').font('Helvetica').text(reporte.formula, 50, currentY, { width: 495 });
      currentY += 14;
    }

    // Tabla Ranking EFU
    doc.fontSize(12).fillColor('#003399').font('Helvetica-Bold').text('RANKING OFICIAL - ENTRADA FOLKLÓRICA', 50, currentY);
    currentY += 18;

    // Header Tabla EFU
    const colWidths = {
      puesto: 20,
      frat: 170,
      cat: 55,
      pert: 95,
      prom: 35,
      sanc: 30,
      final: 35,
      fecha: 60
    };

    const drawEfuTableHeader = (y: number) => {
      doc.save();
      doc.rect(50, y, 495, 18).fill('#003399');
      doc.fontSize(8).fillColor('#ffffff').font('Helvetica-Bold');
      let curX = 52;
      doc.text('#', curX, y + 5, { width: colWidths.puesto, align: 'center' }); curX += colWidths.puesto;
      doc.text('Fraternidad', curX, y + 5, { width: colWidths.frat }); curX += colWidths.frat;
      doc.text('Cat.', curX, y + 5, { width: colWidths.cat }); curX += colWidths.cat;
      doc.text('Pertenencia', curX, y + 5, { width: colWidths.pert }); curX += colWidths.pert;
      doc.text('Prom.', curX, y + 5, { width: colWidths.prom, align: 'center' }); curX += colWidths.prom;
      doc.text('Sanc.', curX, y + 5, { width: colWidths.sanc, align: 'center' }); curX += colWidths.sanc;
      doc.text('Fin.', curX, y + 5, { width: colWidths.final, align: 'center' }); curX += colWidths.final;
      doc.text('Fecha/Hora', curX, y + 5, { width: colWidths.fecha });
      doc.restore();
    };

    drawEfuTableHeader(currentY);
    currentY += 18;

    reporte.rankingEfu.forEach((r, i) => {
      // Paginación
      if (currentY > 730) {
        drawFooter(pageCount);
        doc.addPage();
        pageCount++;
        // Draw small header on subsequent pages
        doc.fontSize(9).fillColor('#003399').font('Helvetica-Bold').text(`REPORTE DE CALIFICACIONES GESTIÓN ${reporte.gestion.anio}`, 50, 40);
        doc.moveTo(50, 52).lineTo(545, 52).lineWidth(0.5).strokeColor('#003399').stroke();
        currentY = 65;
        drawEfuTableHeader(currentY);
        currentY += 18;
      }

      // Zebra striping
      if (i % 2 === 0) {
        doc.save().rect(50, currentY, 495, 16).fill('#f8fafc').restore();
      }

      doc.fontSize(7.5).fillColor('#0f172a').font('Helvetica');
      let curX = 52;

      // Puesto
      doc.text(`${r.puesto}`, curX, currentY + 4, { width: colWidths.puesto, align: 'center' }); curX += colWidths.puesto;
      // Nombre
      doc.font('Helvetica-Bold').text(r.nombre, curX, currentY + 4, { width: colWidths.frat, height: 12, ellipsis: true }); curX += colWidths.frat;
      doc.font('Helvetica');
      doc.text(r.categoria, curX, currentY + 4, { width: colWidths.cat, height: 12, ellipsis: true }); curX += colWidths.cat;
      // Pertenencia
      doc.text(r.representacion, curX, currentY + 4, { width: colWidths.pert, height: 12, ellipsis: true }); curX += colWidths.pert;
      // Promedio Final
      doc.text(`${r.promedioFinal ?? r.promedioJurado}`, curX, currentY + 4, { width: colWidths.prom, align: 'center' }); curX += colWidths.prom;
      // Sanciones
      doc.fillColor(r.suspendida || r.impactoSanciones < 0 ? '#c8102e' : '#0f172a');
      doc.text(r.suspendida && !(r.impactoSanciones < 0) ? 'SUSP.' : `${r.impactoSanciones}`, curX, currentY + 4, { width: colWidths.sanc, align: 'center' }); curX += colWidths.sanc;
      doc.fillColor('#0f172a');
      // Puntaje final
      doc.font('Helvetica-Bold').text(`${r.puntajeFinal}`, curX, currentY + 4, { width: colWidths.final, align: 'center' }); curX += colWidths.final;
      // Fecha/Hora
      doc.font('Helvetica').text(formatDate(r.fechaHoraCalificacion), curX, currentY + 4, { width: colWidths.fecha });

      currentY += 16;
    });

    currentY += 20;

    // Concursos Externos
    if (reporte.concursosExternos && reporte.concursosExternos.length > 0) {
      reporte.concursosExternos.forEach((conc) => {
        // Chequeo si cabe el título y cabecera (aprox 60 pt)
        if (currentY > 700) {
          drawFooter(pageCount);
          doc.addPage();
          pageCount++;
          doc.fontSize(9).fillColor('#003399').font('Helvetica-Bold').text(`REPORTE DE CALIFICACIONES GESTIÓN ${reporte.gestion.anio}`, 50, 40);
          doc.moveTo(50, 52).lineTo(545, 52).lineWidth(0.5).strokeColor('#003399').stroke();
          currentY = 65;
          // drawExtTableHeader(currentY); // will be drawn below
        }

        doc.fontSize(12).fillColor('#003399').font('Helvetica-Bold').text(`CONCURSO: ${conc.nombreConcurso.toUpperCase()}`, 50, currentY);
        currentY += 18;

        const colWidthsExt = {
          puesto: 25,
          nombre: 155,
          tipo: 80,
          frat: 115,
          puntaje: 50,
          fecha: 70
        };

        const drawExtTableHeader = (y: number) => {
          doc.save();
          doc.rect(50, y, 495, 18).fill('#c8102e');
          doc.fontSize(8).fillColor('#ffffff').font('Helvetica-Bold');
          let curX = 52;
          doc.text('#', curX, y + 5, { width: colWidthsExt.puesto, align: 'center' }); curX += colWidthsExt.puesto;
          doc.text('Participante', curX, y + 5, { width: colWidthsExt.nombre }); curX += colWidthsExt.nombre;
          doc.text('Rol / Tipo', curX, y + 5, { width: colWidthsExt.tipo }); curX += colWidthsExt.tipo;
          doc.text('Fraternidad / Institución', curX, y + 5, { width: colWidthsExt.frat }); curX += colWidthsExt.frat;
          doc.text('Puntaje', curX, y + 5, { width: colWidthsExt.puntaje, align: 'center' }); curX += colWidthsExt.puntaje;
          doc.text('Fecha/Hora', curX, y + 5, { width: colWidthsExt.fecha });
          doc.restore();
        };

        drawExtTableHeader(currentY);
        currentY += 18;

        conc.participantes.forEach((p, idx) => {
          if (currentY > 730) {
            drawFooter(pageCount);
            doc.addPage();
            pageCount++;
            doc.fontSize(9).fillColor('#003399').font('Helvetica-Bold').text(`REPORTE DE CALIFICACIONES GESTIÓN ${reporte.gestion.anio}`, 50, 40);
            doc.moveTo(50, 52).lineTo(545, 52).lineWidth(0.5).strokeColor('#003399').stroke();
            currentY = 65;
            drawExtTableHeader(currentY);
            currentY += 18;
          }

          if (idx % 2 === 0) {
            doc.save().rect(50, currentY, 495, 16).fill('#f8fafc').restore();
          }

          doc.fontSize(7.5).fillColor('#0f172a').font('Helvetica');
          let curX = 52;

          doc.text(`${p.puesto}`, curX, currentY + 4, { width: colWidthsExt.puesto, align: 'center' }); curX += colWidthsExt.puesto;
          doc.font('Helvetica-Bold').text(p.nombre, curX, currentY + 4, { width: colWidthsExt.nombre, height: 12, ellipsis: true }); curX += colWidthsExt.nombre;
          doc.font('Helvetica');
          doc.text(p.tipo, curX, currentY + 4, { width: colWidthsExt.tipo, height: 12, ellipsis: true }); curX += colWidthsExt.tipo;
          doc.text(p.fraternidad, curX, currentY + 4, { width: colWidthsExt.frat, height: 12, ellipsis: true }); curX += colWidthsExt.frat;
          doc.font('Helvetica-Bold').text(`${p.puntajeFinal}`, curX, currentY + 4, { width: colWidthsExt.puntaje, align: 'center' }); curX += colWidthsExt.puntaje;
          doc.font('Helvetica').text(formatDate(p.fechaHoraCalificacion), curX, currentY + 4, { width: colWidthsExt.fecha });

          currentY += 16;
        });

        currentY += 20;
      });
    }

    drawFooter(pageCount);
    doc.end();
  }
}
