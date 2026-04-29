import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not, In } from 'typeorm';
import { Evaluacion } from '../entities/Evaluacion';
import { Jurado } from '../entities/Jurado';
import { Fase } from '../entities/Fase';
import { Fraternidad } from '../entities/Fraternidad';
import { DocumentoFraternidad } from '../entities/DocumentoFraternidad';
import { Criterio } from '../entities/Criterio';
import { Gestion } from '../entities/Gestion';
import { Participante } from '../entities/Participante';

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
  ) {}

  // 0. Obtener jurados para asignar fases
  async getJuradosDisponibles() {
      return this.juradoRepo.find({
          relations: ['usuario']
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

    const todosJurados = await this.juradoRepo.find({ relations: ['fasesHabilitadas', 'usuario'] });
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
        fases = await this.faseRepo.find({ order: { idFase: 'ASC' } });
        const todosJurados = await this.juradoRepo.find({ relations: ['fasesHabilitadas', 'usuario'] });
        fases.forEach(f => {
           (f as any).jurados = todosJurados.filter(j => j.fasesHabilitadas.some(hf => hf.idFase === f.idFase));
        });
      } else {
        const jurado = await this.juradoRepo.findOne({
          where: { usuario: { idUsuario } },
          relations: ['fasesHabilitadas'],
        });
        if (!jurado) throw new NotFoundException('El usuario no está registrado como Jurado.');
        fases = jurado.fasesHabilitadas;
      }

      return fases.map(fase => {
        const isActivaGlobal = fase.estaActiva;
        const isVigente = fase.fechaInicio <= ahora && (fase.fechaFin ? fase.fechaFin >= ahora : true);
        const adminAcceso = (rol === 'superusuario' || rol === 'admin');

        return {
          idFase: fase.idFase,
          nombre: fase.nombre,
          urlImagen: fase.urlImagen,
          pesoPorcentaje: fase.pesoPorcentaje,
          tipoConcurso: fase.tipoConcurso || 'EFU',
          fechaInicio: fase.fechaInicio,
          fechaFin: fase.fechaFin,
          jurados: (fase as any).jurados || [],
          accesible: adminAcceso ? true : (isActivaGlobal && isVigente),
          mensajeBloqueo: adminAcceso ? null : (!isActivaGlobal ? 'Fase inactiva.' : (!isVigente ? 'Fuera de fecha.' : null))
        };
      });
    } catch (e) {
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
    const fase = await this.faseRepo.findOne({ where: { idFase } });
    if (!fase) throw new NotFoundException('Fase no encontrada');

    if (fase.tipoConcurso === 'EXTERNO') {
      const participantes = await this.participanteRepo.find({ where: { fase: { idFase } }, relations: ['fraternidad'], order: { nombre: 'ASC' } });
      const evaluaciones = await this.evaluacionRepo.find({ where: { jurado: { idJurado: jurado.idJurado }, fase: { idFase } }, relations: ['participante'] });
      const mapEv = new Map(evaluaciones.map(ev => [ev.participante?.idParticipante, ev]));

      return {
        fase: { idFase: fase.idFase, nombre: fase.nombre, tipoConcurso: 'EXTERNO' },
        listado: participantes.map(p => {
          const ev = mapEv.get(p.idParticipante);
          return { idParticipante: p.idParticipante, nombre: p.nombre, tipo: p.tipo, fraternidad: p.fraternidad?.nombre || 'EXTERNO', estadoEvaluacion: ev ? ev.estado : 'PENDIENTE', idEvaluacion: ev ? ev.idEvaluacion : null, puntajeActual: ev ? ev.puntajeTotal : 0 };
        })
      };
    }

    let fraternidades: Fraternidad[];
    if (jurado.fraternidadesHabilitadas && jurado.fraternidadesHabilitadas.length > 0) {
      fraternidades = jurado.fraternidadesHabilitadas;
    } else {
      fraternidades = await this.fraternidadRepo.find({ where: { habilitadoEfu: true }, order: { nombre: 'ASC' } });
    }

    const evaluadas = await this.evaluacionRepo.find({ where: { jurado: { idJurado: jurado.idJurado }, fase: { idFase } }, relations: ['fraternidad'] });
    const mapEv = new Map(evaluadas.map(ev => [ev.fraternidad?.idFraternidad, ev]));

    return {
      fase: { idFase: fase.idFase, nombre: fase.nombre, tipoConcurso: 'EFU' },
      listado: fraternidades.map(frat => {
        const ev = mapEv.get(frat.idFraternidad);
        return { idFraternidad: frat.idFraternidad, nombre: frat.nombre, idEvaluacion: ev?.idEvaluacion || null, estadoEvaluacion: ev?.estado || 'PENDIENTE', puntajeActual: ev?.puntajeTotal || 0 };
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

    const frats = await this.fraternidadRepo.find({ where: { habilitadoEfu: true } });
    const evsEfu = await this.evaluacionRepo.find({
      where: { estado: 'COMPLETADO', fase: { gestion: { idGestion: gestion.idGestion }, tipoConcurso: 'EFU' } },
      relations: ['fraternidad']
    });

    const evaluadasIds = new Set(evsEfu.map(e => e.fraternidad?.idFraternidad).filter(id => !!id));
    const progreso = frats.length > 0 ? Math.round((evaluadasIds.size / frats.length) * 100) : 0;

    const ranking = new Map<number, { nombre: string, tipo: string, sum: number, count: number }>();
    evsEfu.forEach(e => {
        if (!e.fraternidad) return;
        const pts = Number(e.puntajeTotal) || 0;
        const ex = ranking.get(e.fraternidad.idFraternidad);
        if (ex) { ex.sum += pts; ex.count++; }
        else ranking.set(e.fraternidad.idFraternidad, { nombre: e.fraternidad.nombre, tipo: e.fraternidad.categoria?.nombre || 'General', sum: pts, count: 1 });
    });

    const rankingSorted = Array.from(ranking.values()).map(r => ({
        nombre: r.nombre, tipo: r.tipo, puntaje: Number((r.sum / r.count).toFixed(2))
    })).sort((a, b) => b.puntaje - a.puntaje);

    const evsExt = await this.evaluacionRepo.find({
      where: { estado: 'COMPLETADO', fase: { gestion: { idGestion: gestion.idGestion }, tipoConcurso: 'EXTERNO' } },
      relations: ['participante', 'fase', 'fraternidad']
    });

    const concMap = new Map<number, { nombre: string, parts: any[] }>();
    evsExt.forEach(e => {
        if (!e.fase || !e.participante) return;
        let c = concMap.get(e.fase.idFase);
        if (!c) { c = { nombre: e.fase.nombre, parts: [] }; concMap.set(e.fase.idFase, c); }
        const p = c.parts.find(x => x.id === e.participante.idParticipante);
        if (p) { p.sum += Number(e.puntajeTotal); p.count++; p.puntaje = Number((p.sum / p.count).toFixed(2)); }
        else c.parts.push({ id: e.participante.idParticipante, nombre: e.participante.nombre, fraternidad: e.fraternidad?.nombre || 'Ext', puntaje: Number(e.puntajeTotal), sum: Number(e.puntajeTotal), count: 1 });
    });

    return {
      basico: [
        { label: 'Total Fraternidades', valor: frats.length, badge: 'Habilitadas', progreso: 100 },
        { label: 'Evaluadas', valor: evaluadasIds.size, badge: `${progreso}% Avance`, progreso },
        { label: 'Ranking Top', valor: rankingSorted.length > 0 ? rankingSorted[0].nombre : '—', badge: 'Líder Actual', progreso: 100 }
      ],
      rankingEfu: rankingSorted,
      concursos: Array.from(concMap.values()).map(c => ({ nombre: c.nombre, top: c.parts.sort((a,b) => b.puntaje - a.puntaje).slice(0,5) })),
      gestion: { anio: gestion.anio, edicion: 'XXXV' }
    };
  }

  // --- GESTIONES (AJUSTES) ---
  async getGestionActiva() {
    return this.gestionRepo.findOne({ where: { activa: true } }) || this.gestionRepo.findOne({ order: { anio: 'DESC' } });
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

  async createGestion(data: any) {
    if (data.activa) await this.gestionRepo.update({}, { activa: false });
    return this.gestionRepo.save(this.gestionRepo.create(data));
  }

  async updateGestion(id: number, data: any) {
    if (data.activa) await this.gestionRepo.update({ idGestion: Not(id) }, { activa: false });
    await this.gestionRepo.update(id, data);
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

  private eliminarImagenSiExiste(url: string) {
    try { const p = path.join(process.cwd(), url.replace('/api/v1/archivos/', 'uploads/')); if (fs.existsSync(p)) fs.unlinkSync(p); } catch (e) {}
  }
}
