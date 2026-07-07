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
import { Participante } from '../entities/Participante';
import { DocumentoGestion } from '../entities/DocumentoGestion';
import { Incidencia } from '../entities/Incidencia';
import { Infraccion } from '../entities/Infraccion';
import { Usuario } from '../entities/Usuario';
import { findGestionActivaOrLatest } from '../common/gestion.utils';

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
        estaActiva: f.estaActiva,
        urlImagen: f.urlImagen,
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
        fases = await this.faseRepo.find({ order: { idFase: 'ASC' }, relations: ['gestion'] });
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
        const jurado = await this.juradoRepo.findOne({
          where: { usuario: { idUsuario } },
          relations: ['fasesHabilitadas'],
        });
        if (!jurado) return []; // Retornar vacío si no tiene perfil aún, en lugar de error
        fases = jurado.fasesHabilitadas;
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
      relations: ['gestion']
    });
    if (!fase) throw new NotFoundException('Fase no encontrada');

    if (fase.tipoConcurso === 'EXTERNO') {
      const participantes = await this.participanteRepo.find({ where: { fase: { idFase } }, relations: ['fraternidad'], order: { nombre: 'ASC' } });
      const evaluaciones = await this.evaluacionRepo.find({ where: { jurado: { idJurado: jurado.idJurado }, fase: { idFase } }, relations: ['participante'] });
      const mapEv = new Map(evaluaciones.map(ev => [ev.participante?.idParticipante, ev]));

      return {
        fase: { idFase: fase.idFase, nombre: fase.nombre, tipoConcurso: 'EXTERNO', categoriaEfu: fase.categoriaEfu || null },
        listado: participantes.map(p => {
          const ev = mapEv.get(p.idParticipante);
          return { idParticipante: p.idParticipante, nombre: p.nombre, tipo: p.tipo, fraternidad: p.fraternidad?.nombre || 'EXTERNO', estadoEvaluacion: ev ? ev.estado : 'PENDIENTE', idEvaluacion: ev ? ev.idEvaluacion : null, puntajeActual: ev ? ev.puntajeTotal : 0 };
        })
      };
    }

    let fraternidades: Fraternidad[];
    const idGestionFase = fase.gestion?.idGestion || (await this.getGestionActiva())?.idGestion;
    if (jurado.fraternidadesHabilitadas && jurado.fraternidadesHabilitadas.length > 0) {
      fraternidades = jurado.fraternidadesHabilitadas;
    } else {
      fraternidades = await this.fraternidadRepo.find({
        where: {
          habilitadoEfu: true,
          ...(idGestionFase ? { gestion: { idGestion: idGestionFase } } : {}),
        },
        order: { nombre: 'ASC' },
      });
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
        fecha: inc.fechaHora
      });
    });

    return {
      fase: { idFase: fase.idFase, nombre: fase.nombre, tipoConcurso: 'EFU', categoriaEfu: fase.categoriaEfu || null },
      listado: fraternidades.map(frat => {
        const ev = mapEv.get(frat.idFraternidad);
        const penalties = mapInc.get(frat.idFraternidad) || [];
        const totalPenalties = penalties.reduce((acc, p) => acc + p.valor, 0);
        
        let score = ev?.puntajeTotal || 0;
        // Si hay una sanción de puntaje 0 (valor -30 o similar), forzamos a 0 si el impacto es grande
        // Pero el usuario dijo "descuenta", así que restamos.
        score = Math.max(0, Number(score) + totalPenalties);

        return { 
          idFraternidad: frat.idFraternidad, 
          nombre: frat.nombre, 
          idEvaluacion: ev?.idEvaluacion || null, 
          estadoEvaluacion: ev?.estado || 'PENDIENTE', 
          puntajeActual: score,
          penalizaciones: penalties
        };
      })
    };
  }

  async getCriteriosPorFase(idFase: number) {
    return this.criterioRepo.find({ where: { fase: { idFase } }, order: { idCriterio: 'ASC' } });
  }

  async getEvaluacionActual(idUsuario: number, rol: string, idFase: number, args: { idFraternidad?: number, idParticipante?: number }) {
    const jurado = await this.getValidadorJurado(idUsuario, rol, idFase);
    const where: any = { jurado: { idJurado: jurado.idJurado }, fase: { idFase } };
    if (args.idParticipante) where.participante = { idParticipante: args.idParticipante };
    else if (args.idFraternidad) where.fraternidad = { idFraternidad: args.idFraternidad };
    return this.evaluacionRepo.findOne({ where, relations: ['participante', 'fraternidad'] });
  }

  async guardarEvaluacion(idUsuario: number, rol: string, args: { idFase: number, idFraternidad?: number, idParticipante?: number, criterios: any, finalizar: boolean }) {
    const { idFase, idFraternidad, idParticipante, criterios, finalizar } = args;
    const jurado = await this.getValidadorJurado(idUsuario, rol, idFase);
    const fase = await this.faseRepo.findOne({ where: { idFase } });
    if (!fase || !fase.estaActiva) throw new ForbiddenException('Fase inactiva.');

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

    const frats = await this.fraternidadRepo.find({ where: { habilitadoEfu: true, origenFraternidad: Not('Externo') } });
    const evsEfu = await this.evaluacionRepo.find({
      where: [
        { estado: 'COMPLETADO', fase: { gestion: { idGestion: gestion.idGestion }, tipoConcurso: 'EFU' } },
        { estado: 'EN_PROGRESO', fase: { gestion: { idGestion: gestion.idGestion }, tipoConcurso: 'EFU' } }
      ],
      relations: ['fraternidad']
    });

    const incidencias = await this.incidenciaRepo.find({
      where: { gestion: { idGestion: gestion.idGestion } },
      relations: ['fraternidad', 'infraccion']
    });

    const evaluadasIds = new Set(evsEfu.map(e => e.fraternidad?.idFraternidad).filter(id => !!id));
    const progreso = frats.length > 0 ? Math.round((evaluadasIds.size / frats.length) * 100) : 0;

    const ranking = new Map<number, { nombre: string, tipo: string, sum: number, count: number, impactos: number }>();
    
    // Inicializar con todas las fraternidades habilitadas
    frats.forEach(f => {
      ranking.set(f.idFraternidad, { 
        nombre: f.nombre, 
        tipo: f.categoria?.nombre || 'General', 
        sum: 0, 
        count: 0,
        impactos: 0
      });
    });

    // Sumar evaluaciones de jurados
    evsEfu.forEach(e => {
        if (!e.fraternidad) return;
        const pts = Number(e.puntajeTotal) || 0;
        const ex = ranking.get(e.fraternidad.idFraternidad);
        if (ex) { ex.sum += pts; ex.count++; }
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
        const promedio = r.count > 0 ? r.sum / r.count : 0;
        const puntajeFinal = Math.max(0, promedio + r.impactos);
        return {
            nombre: r.nombre, 
            tipo: r.tipo, 
            puntaje: Number(puntajeFinal.toFixed(2))
        };
    }).sort((a, b) => b.puntaje - a.puntaje);

    return {
      basico: [
        { label: 'Total Fraternidades', valor: frats.length, badge: 'Habilitadas', progreso: 100 },
        { label: 'Evaluadas', valor: evaluadasIds.size, badge: `${progreso}% Avance`, progreso },
        { label: 'Ranking Top', valor: rankingSorted.length > 0 ? rankingSorted[0].nombre : '—', badge: 'Líder Actual', progreso: 100 }
      ],
      rankingEfu: rankingSorted,
      concursos: [],
      gestion: { anio: gestion.anio, edicion: 'XXXV' }
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
  async getFinalistasFase(idFase: number) {
    const fase = await this.faseRepo.findOne({ where: { idFase } });
    if (!fase) throw new NotFoundException('Fase no encontrada');

    const evs = await this.evaluacionRepo.find({
      where: { estado: 'COMPLETADO', fase: { idFase } },
      relations: ['participante', 'participante.fraternidad'],
      order: { puntajeTotal: 'DESC' }
    });

    // Calcular promedio por participante (puede haber múltiples jurados)
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

    const finalistas = Array.from(mapaParticipantes.values())
      .map(p => ({ ...p, puntajePromedio: Number((p.sum / p.count).toFixed(2)) }))
      .sort((a, b) => b.puntajePromedio - a.puntajePromedio)
      .slice(0, 3)
      .map((p, idx) => ({ ...p, posicion: idx + 1 }));

    return { fase: { idFase: fase.idFase, nombre: fase.nombre, tipoConcurso: fase.tipoConcurso }, finalistas };
  }

  async clonarGestion(idOrigen: number, idDestino: number, modules: string[]) {
    const origen = await this.gestionRepo.findOne({ where: { idGestion: idOrigen } });
    const destino = await this.gestionRepo.findOne({ where: { idGestion: idDestino } });
    if (!origen || !destino) throw new NotFoundException('Gestión de origen o destino no encontrada');

    const result = { fases: 0, criterios: 0, categorias: 0, infracciones: 0, fraternidadesExtra: 0 };

    if (modules.includes('fases_criterios')) {
      const fasesOrigen = await this.faseRepo.find({ where: { gestion: { idGestion: idOrigen } } });
      for (const fase of fasesOrigen) {
        const nf = this.faseRepo.create({
          nombre: fase.nombre, pesoPorcentaje: fase.pesoPorcentaje,
          urlImagen: fase.urlImagen, tipoConcurso: fase.tipoConcurso, gestion: { idGestion: idDestino } as any
        });
        const savedF = await this.faseRepo.save(nf);
        result.fases++;

        const criterios = await this.criterioRepo.find({ where: { fase: { idFase: fase.idFase } } });
        for (const crit of criterios) {
          const nc = this.criterioRepo.create({
            nombre: crit.nombre, puntajeMaximo: crit.puntajeMaximo, 
            urlImagen: crit.urlImagen, fase: { idFase: savedF.idFase } as any, gestion: { idGestion: idDestino } as any
          });
          await this.criterioRepo.save(nc);
          result.criterios++;
        }
      }
    }

    if (modules.includes('categorias')) {
      const cats = await this.dataSource.query(`SELECT * FROM categorias WHERE id_gestion = $1`, [idOrigen]);
      for (const cat of cats) {
        await this.dataSource.query(`INSERT INTO categorias(nombre, descripcion, requiere_institucion, id_gestion) VALUES($1, $2, $3, $4)`, 
          [cat.nombre, cat.descripcion, cat.requiere_institucion || false, idDestino]);
        result.categorias++;
      }
    }

    if (modules.includes('infracciones')) {
      const infrs = await this.infraccionRepo.find({ where: { gestion: { idGestion: idOrigen } } });
      for (const infr of infrs) {
        const ni = this.infraccionRepo.create({ nombre: infr.nombre, tipoImpacto: infr.tipoImpacto, valorImpacto: infr.valorImpacto, gestion: { idGestion: idDestino } as any });
        await this.infraccionRepo.save(ni);
        result.infracciones++;
      }
    }
    
    if (modules.includes('fraternidades_base')) {
      // Clonar datos básicos (sin actas, logos_url es opcional pero se puede llevar el actual)
      const frats = await this.fraternidadRepo.find({ 
        where: { gestion: { idGestion: idOrigen } },
        relations: ['facultad', 'carrera', 'institucionExterna', 'categoria']
      });
      
      // Map categorias antiguas a nuevas
      let mapCat = new Map();
      if (modules.includes('categorias')) {
        const destCats = await this.dataSource.query(`SELECT id_categoria, nombre FROM categorias WHERE id_gestion = $1`, [idDestino]);
        for (const dc of destCats) mapCat.set(dc.nombre, dc.id_categoria);
      }
      
      for (const fr of frats) {
        let idCatNueva = null;
        if (fr.categoria) {
            // Re-obtener la categoría antigua
            const oldCatData = await this.dataSource.query(`SELECT nombre FROM categorias WHERE id_categoria = $1`, [fr.categoria.idCategoria]);
            if (oldCatData.length > 0) idCatNueva = mapCat.get(oldCatData[0].nombre);
        }
        
        const nft = this.fraternidadRepo.create({
          nombre: fr.nombre,
          origenFraternidad: fr.origenFraternidad,
          nivelRepresentacion: fr.nivelRepresentacion,
          tipoOrganizacion: fr.tipoOrganizacion,
          fechaFundacion: fr.fechaFundacion,
          promedioBase: 0, 
          habilitadoEfu: false, // se debe volver a habilitar mediante inscripción
          gestion: { idGestion: idDestino } as any,
          facultad: fr.facultad ? { idFacultad: fr.facultad.idFacultad } as any : null,
          carrera: fr.carrera ? { idCarrera: fr.carrera.idCarrera } as any : null,
          institucionExterna: fr.institucionExterna ? { idInstitucion: fr.institucionExterna.idInstitucion } as any : null,
          categoria: idCatNueva ? { idCategoria: idCatNueva } as any : null,
        });
        await this.fraternidadRepo.save(nft);
        result.fraternidadesExtra++;
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
    return this.gestionRepo.save(this.gestionRepo.create(data));
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
    await this.gestionRepo.update({ idGestion: id }, data);
    return this.gestionRepo.findOne({ where: { idGestion: id } });
  }

  async deleteGestion(id: number) {
    const g = await this.gestionRepo.findOne({ where: { idGestion: id } });
    if (!g) throw new NotFoundException('Gestión no encontrada');
    // Eliminar imágenes asociadas
    if (g.urlLogo) this.eliminarImagenSiExiste(g.urlLogo);
    if (g.urlBanner) this.eliminarImagenSiExiste(g.urlBanner);
    if (g.urlImagenLogin) this.eliminarImagenSiExiste(g.urlImagenLogin);
    return this.gestionRepo.delete(id);
  }

  // --- CRUD HELPERS ---
  async createFase(data: any) {
    const gestion = data.gestionId ? await this.gestionRepo.findOne({ where: { idGestion: data.gestionId } }) : await this.getGestionActiva();
    if (!gestion) throw new NotFoundException('No gestion');
    const f = await this.faseRepo.save(this.faseRepo.create({ ...data, gestion }));
    if (data.juradosIds) {
      const jurados = await this.juradoRepo.find({ where: { idJurado: In(data.juradosIds) }, relations: ['fasesHabilitadas'] });
      for (const j of jurados) { j.fasesHabilitadas.push(f as any); await this.juradoRepo.save(j); }
    }
    return f;
  }

  async updateFase(id: number, data: any) {
    const f = await this.faseRepo.findOne({ where: { idFase: id } });
    if (!f) throw new NotFoundException('Fase no encontrada');
    if (data.urlImagen && f.urlImagen && data.urlImagen !== f.urlImagen) this.eliminarImagenSiExiste(f.urlImagen);
    Object.assign(f, data);
    return this.faseRepo.save(f);
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

  async getDocumentosGestion(idGestion?: number) {
    let gestion: any;
    if (idGestion) {
      gestion = await this.gestionRepo.findOne({ where: { idGestion } });
    } else {
      gestion = await this.gestionRepo.findOne({ where: { activa: true } });
    }
    if (!gestion) return [];
    return this.documentoGestionRepo.find({
      where: { gestion: { idGestion: gestion.idGestion } },
      order: { orden: 'ASC', createdAt: 'ASC' },
    });
  }

  async createDocumentoGestion(dto: { titulo: string; descripcion?: string; tipo?: string; urlPdf: string; orden?: number }, idGestion?: number) {
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

  async registrarPenalizacionDisciplina(idUsuario: number, idFase: number, idFraternidad: number, tipo: string, observacion?: string) {
    const gestion = await this.getGestionActiva();
    if (!gestion) throw new BadRequestException('No hay gestión activa.');

    const fraternidad = await this.fraternidadRepo.findOne({ where: { idFraternidad } });
    if (!fraternidad) throw new NotFoundException('Fraternidad no encontrada.');

    const usuario = await this.usuarioRepo.findOne({ where: { idUsuario } });

    // Definir valores de impacto
    let valorImpacto = 0;
    let nombreInfraccion = tipo;
    let tipoImpacto = 'RESTA_PUNTOS';

    switch (tipo) {
      case 'AMARILLA':
        valorImpacto = -1;
        nombreInfraccion = 'Bandera Amarilla - Disciplina';
        break;
      case 'ROJA':
        valorImpacto = -2;
        nombreInfraccion = 'Bandera Roja - Disciplina';
        break;
      case 'SANCION_ALCOHOL':
        valorImpacto = -30;
        nombreInfraccion = 'Sanción: Consumo de Bebidas Alcohólicas';
        break;
      case 'SANCION_AGRESION':
        valorImpacto = 0;
        nombreInfraccion = 'Sanción: Agresividad (Suspensión 1 Año)';
        tipoImpacto = 'SUSPENSION';
        fraternidad.habilitadoEfu = false;
        await this.fraternidadRepo.save(fraternidad);
        break;
      case 'SANCION_BANDA':
        valorImpacto = -30;
        nombreInfraccion = 'Sanción: Exceso de Bandas/Músicos';
        break;
      case 'SANCION_AJENO':
        valorImpacto = 0;
        nombreInfraccion = 'Sanción: Personal ajeno a la UMSA (Suspensión 1 Año)';
        tipoImpacto = 'SUSPENSION';
        fraternidad.habilitadoEfu = false;
        await this.fraternidadRepo.save(fraternidad);
        break;
    }

    // Buscar o crear la infracción
    let infraccion = await this.infraccionRepo.findOne({ where: { nombre: nombreInfraccion, gestion: { idGestion: gestion.idGestion } } });
    if (!infraccion) {
      infraccion = this.infraccionRepo.create({
        nombre: nombreInfraccion,
        tipoImpacto: tipoImpacto,
        valorImpacto: valorImpacto,
        gestion
      });
      infraccion = await this.infraccionRepo.save(infraccion);
    }

    const incidencia = this.incidenciaRepo.create({
      gestion,
      fraternidad,
      usuario,
      infraccion,
      observacion: observacion || `Registrado por controlador HCU`
    });

    return this.incidenciaRepo.save(incidencia);
  }

  async removerPenalizacion(idIncidencia: number) {
    const inc = await this.incidenciaRepo.findOne({ 
      where: { idIncidencia }, 
      relations: ['infraccion', 'fraternidad'] 
    });
    if (!inc) throw new NotFoundException('Penalización no encontrada');

    if (inc.infraccion?.tipoImpacto === 'SUSPENSION') {
      const frat = inc.fraternidad;
      frat.habilitadoEfu = true;
      await this.fraternidadRepo.save(frat);
    }

    return this.incidenciaRepo.delete(idIncidencia);
  }

  // --- REPORTES HISTORICOS ---
  async getReportesGestionesPublicas() {
    return this.gestionRepo.find({
      select: ['idGestion', 'anio', 'lema', 'activa'],
      order: { anio: 'DESC' }
    });
  }

  async getReporteHistorico(idGestion: number) {
    const gestion = await this.gestionRepo.findOne({ where: { idGestion } });
    if (!gestion) throw new NotFoundException('Gestión no encontrada');

    // 1. Fraternidades y Ranking EFU
    const frats = await this.fraternidadRepo.find({
      where: { habilitadoEfu: true, gestion: { idGestion }, origenFraternidad: Not('Externo') },
      relations: ['categoria', 'facultad', 'carrera', 'institucionExterna']
    });

    const evsEfu = await this.evaluacionRepo.find({
      where: { estado: 'COMPLETADO', fase: { gestion: { idGestion }, tipoConcurso: 'EFU' } },
      relations: ['fraternidad']
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
        origenFraternidad: f.origenFraternidad || 'Danza Pesada',
        categoria: f.categoria?.nombre || 'General',
        representacion,
        promedioJurado: 0,
        sumJurado: 0,
        countJurado: 0,
        impactoSanciones: 0,
        puntajeFinal: 0,
        fechaHoraCalificacion: null
      });
    });

    evsEfu.forEach(e => {
      if (!e.fraternidad) return;
      const ex = rankingMap.get(e.fraternidad.idFraternidad);
      if (ex) {
        ex.sumJurado += Number(e.puntajeTotal);
        ex.countJurado++;
        if (e.fechaCierre) {
          const date = new Date(e.fechaCierre);
          if (!ex.fechaHoraCalificacion || date > new Date(ex.fechaHoraCalificacion)) {
            ex.fechaHoraCalificacion = e.fechaCierre;
          }
        }
      }
    });

    incidencias.forEach(i => {
      if (!i.fraternidad || !i.infraccion) return;
      const ex = rankingMap.get(i.fraternidad.idFraternidad);
      if (ex) {
        ex.impactoSanciones += Number(i.infraccion.valorImpacto) || 0;
      }
    });

    const rankingEfu = Array.from(rankingMap.values()).map(r => {
      r.promedioJurado = r.countJurado > 0 ? Number((r.sumJurado / r.countJurado).toFixed(2)) : 0;
      r.puntajeFinal = Math.max(0, Number((r.promedioJurado + r.impactoSanciones).toFixed(2)));
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

    let logoPath = 'e:\\Entrada-Universitaria\\frontend\\src\\assets\\img\\Logo_Umsa.png';
    if (!fs.existsSync(logoPath)) {
      logoPath = path.join(process.cwd(), '..', 'frontend', 'src', 'assets', 'img', 'Logo_Umsa.png');
    }
    if (!fs.existsSync(logoPath)) {
      logoPath = path.join(process.cwd(), 'frontend', 'src', 'assets', 'img', 'Logo_Umsa.png');
    }

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

    // Cabecera con logo
    const hasLogo = fs.existsSync(logoPath);
    const headerX = hasLogo ? 110 : 50;

    if (hasLogo) {
      doc.image(logoPath, 50, 40, { width: 50 });
    }

    doc.fontSize(15).fillColor('#003399').font('Helvetica-Bold').text('UNIVERSIDAD MAYOR DE SAN ANDRÉS', headerX, 45);
    doc.fontSize(10).fillColor('#0f172a').font('Helvetica').text('COMISIÓN ORGANIZADORA DE LA ENTRADA UNIVERSITARIA', headerX, 63);
    doc.fontSize(10).fillColor('#c8102e').font('Helvetica-Bold').text(`REPORTE HISTÓRICO DE CALIFICACIONES - GESTIÓN ${reporte.gestion.anio}`, headerX, 76);
    if (reporte.gestion.lema) {
      doc.fontSize(8).fillColor('#475569').font('Helvetica-Oblique').text(`"${reporte.gestion.lema}"`, headerX, 89);
    }

    // Línea separadora
    doc.moveTo(50, 105).lineTo(545, 105).lineWidth(1.5).strokeColor('#003399').stroke();
    
    let currentY = 120;

    // Tabla Ranking EFU
    doc.fontSize(12).fillColor('#003399').font('Helvetica-Bold').text('RANKING OFICIAL - ENTRADA FOLKLÓRICA', 50, currentY);
    currentY += 18;

    // Header Tabla EFU
    const colWidths = {
      puesto: 20,
      frat: 125,
      danza: 70,
      cat: 45,
      pert: 75,
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
      doc.text('Tipo Danza', curX, y + 5, { width: colWidths.danza }); curX += colWidths.danza;
      doc.text('Cat.', curX, y + 5, { width: colWidths.cat }); curX += colWidths.cat;
      doc.text('Pertenencia', curX, y + 5, { width: colWidths.pert }); curX += colWidths.pert;
      doc.text('Jur.', curX, y + 5, { width: colWidths.prom, align: 'center' }); curX += colWidths.prom;
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
      // Danza
      doc.text(r.origenFraternidad, curX, currentY + 4, { width: colWidths.danza, height: 12, ellipsis: true }); curX += colWidths.danza;
      // Categoria
      doc.text(r.categoria, curX, currentY + 4, { width: colWidths.cat, height: 12, ellipsis: true }); curX += colWidths.cat;
      // Pertenencia
      doc.text(r.representacion, curX, currentY + 4, { width: colWidths.pert, height: 12, ellipsis: true }); curX += colWidths.pert;
      // Promedio jurado
      doc.text(`${r.promedioJurado}`, curX, currentY + 4, { width: colWidths.prom, align: 'center' }); curX += colWidths.prom;
      // Sanciones
      doc.fillColor(r.impactoSanciones < 0 ? '#c8102e' : '#0f172a');
      doc.text(`${r.impactoSanciones}`, curX, currentY + 4, { width: colWidths.sanc, align: 'center' }); curX += colWidths.sanc;
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
