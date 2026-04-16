import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Evaluacion } from '../entities/Evaluacion';
import { Jurado } from '../entities/Jurado';
import { Fase } from '../entities/Fase';
import { Fraternidad } from '../entities/Fraternidad';
import { DocumentoFraternidad } from '../entities/DocumentoFraternidad';
import { Criterio } from '../entities/Criterio';
import { Gestion } from '../entities/Gestion';
import { In } from 'typeorm';

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
    // Enriquecer con conteo de fases por gestión
    const result = await Promise.all(gestiones.map(async (g) => {
      const fases = await this.faseRepo.find({ where: { gestion: { idGestion: g.idGestion } } });
      const pesoEFU = fases.filter(f => f.tipoConcurso === 'EFU').reduce((s, f) => s + Number(f.pesoPorcentaje), 0);
      return {
        idGestion: g.idGestion,
        anio: g.anio,
        lema: g.lema,
        activa: g.activa,
        modoMantenimiento: g.modoMantenimiento,
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

    // Cargar jurados por fase manualmente
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
        // Los administradores ven todas las fases de gestiones activas
        fases = await this.faseRepo.find({
          order: { idFase: 'ASC' }
        });
        
        // Cargar jurados manualmente sin depender de la bidireccionalidad de TypeORM
        const todosJurados = await this.juradoRepo.find({ relations: ['fasesHabilitadas', 'usuario'] });
        fases.forEach(f => {
           (f as any).jurados = todosJurados.filter(j => j.fasesHabilitadas.some(hf => hf.idFase === f.idFase));
        });
      } else {
        // El jurado solo ve lo que tiene permitido
        const jurado = await this.juradoRepo.findOne({
          where: { usuario: { idUsuario } },
          relations: ['fasesHabilitadas'],
        });

        if (!jurado) {
          throw new NotFoundException('El usuario no está registrado como Jurado.');
        }
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
          categoriaEfu: fase.categoriaEfu || null,
          fechaInicio: fase.fechaInicio,
          fechaFin: fase.fechaFin,
          jurados: (fase as any).jurados || [],
          accesible: adminAcceso ? true : (isActivaGlobal && isVigente),
          mensajeBloqueo: adminAcceso ? null : (!isActivaGlobal ? 'Fase inactiva administrativamente.' : (!isVigente ? 'Fuera del periodo de evaluación.' : null))
        };
      });
    } catch (e) {
      throw new Error("TRACE: " + e.message + " " + (e.stack || ""));
    }
  }

  // HELPER Administrativo: Bypass y Creación de Perfil en caliente
  private async getValidadorJurado(idUsuario: number, rol: string, idFase: number) {
    const isAdmin = (rol === 'superusuario' || rol === 'admin');
    
    let jurado = await this.juradoRepo.findOne({
      where: { usuario: { idUsuario } },
      relations: ['fasesHabilitadas', 'fraternidadesHabilitadas']
    });

    if (!jurado) {
      if (isAdmin) {
         const nuevoJurado = this.juradoRepo.create({
            usuario: { idUsuario },
            tipoOrigen: 'Administrador (Bypass)',
            gestion: await this.gestionRepo.findOne({ where: { activa: true } }),
         });
         jurado = await this.juradoRepo.save(nuevoJurado);
      } else {
         throw new ForbiddenException('Perfil de jurado no encontrado.');
      }
    }

    if (!isAdmin) {
       // Only enforce strict Phase binding if not admin
       // Since Fase relation is detached from Fase.ts, let's load explicit jurados
       const fullJurado = await this.juradoRepo.findOne({ where: { idJurado: jurado.idJurado }, relations: ['fasesHabilitadas', 'fraternidadesHabilitadas'] });
       const tienePermiso = fullJurado && fullJurado.fasesHabilitadas.some(f => f.idFase === idFase);
       if (!tienePermiso) {
         throw new ForbiddenException('No tienes permiso para calificar esta FASE.');
       }
    }

    return jurado;
  }

  // 2. Obtener las Fraternidades por Fase para el Jurado actual con su estado respectivo
  async getFraternidadesPorFase(idUsuario: number, rol: string, idFase: number) {
    const jurado = await this.getValidadorJurado(idUsuario, rol, idFase);

    const faseConsultada = await this.faseRepo.findOne({ where: { idFase } });

    // 2. Obtener fraternidades habilitadas (filtrar si el jurado tiene asignadas específicas)
    let fraternidades: Fraternidad[];
    if (jurado.fraternidadesHabilitadas && jurado.fraternidadesHabilitadas.length > 0) {
      fraternidades = jurado.fraternidadesHabilitadas;
      // Re-ordenar por nombre ya que viene de la relación
      fraternidades.sort((a, b) => a.nombre.localeCompare(b.nombre));
    } else {
      fraternidades = await this.fraternidadRepo.find({
        where: { habilitadoEfu: true },
        order: { nombre: 'ASC' }
      });
    }

    // 3. Obtener documentos tipo MONOGRAFÍA para integrar visor PDF
    const documentos = await this.documentoRepo.find({
      where: { tipoDocumento: 'MONOGRAFIA' },
      relations: ['fraternidad']
    });

    const mapDocumentos = new Map();
    documentos.forEach(doc => {
      if (doc.fraternidad) {
        mapDocumentos.set(doc.fraternidad.idFraternidad, doc.urlArchivo)
      }
    });

    // 4. Obtener las evaluaciones de ÉSTE jurado en ÉSTA fase
    const evaluaciones = await this.evaluacionRepo.find({
      where: { jurado: { idJurado: jurado.idJurado }, fase: { idFase } },
      relations: ['fraternidad']
    });

    const mapEvaluaciones = new Map();
    evaluaciones.forEach(ev => {
      mapEvaluaciones.set(ev.fraternidad.idFraternidad, ev);
    });

    // 5. Cruzar información
    return {
      fase: {
        idFase: faseConsultada.idFase,
        nombre: faseConsultada.nombre,
        fechaInicio: faseConsultada.fechaInicio,
        fechaFin: faseConsultada.fechaFin
      },
      listado: fraternidades.map(frat => {
        const ev = mapEvaluaciones.get(frat.idFraternidad);
        const urlPdf = mapDocumentos.get(frat.idFraternidad);
        
        return {
          idFraternidad: frat.idFraternidad,
          nombre: frat.nombre,
          categoria: frat.categoria ? frat.categoria.nombre : null,
          participantesConcurso: frat.participantesConcurso || null,
          urlPdf: urlPdf || null,
          // Propiedades del estado de evaluación
          idEvaluacion: ev ? ev.idEvaluacion : null,
          estadoEvaluacion: ev ? ev.estado : 'PENDIENTE',
          fechaApertura: ev?.fechaApertura || null,
          fechaCierre: ev?.fechaCierre || null,
          puntajeActual: ev?.puntajeTotal || 0,
        };
      })
    };
  }

  // 3. Obtener Criterios de la Fase 
  async getCriteriosPorFase(idFase: number) {
    return this.criterioRepo.find({
      where: { fase: { idFase } },
      order: { idCriterio: 'ASC' }
    });
  }

  // 4. Cargar evaluación actual (para continuar 'EN_PROGRESO')
  async getEvaluacionActual(idUsuario: number, rol: string, idFase: number, idFraternidad: number, participanteNombre?: string) {
    const jurado = await this.getValidadorJurado(idUsuario, rol, idFase);

    const whereClause: any = {
      jurado: { idJurado: jurado.idJurado },
      fase: { idFase },
      fraternidad: { idFraternidad }
    };

    if (participanteNombre) {
      whereClause.participanteNombre = participanteNombre;
    }

    return this.evaluacionRepo.findOne({
      where: whereClause
    });
  }

  // 5. Guardar Evaluación (Parcial o Completado)
  async guardarEvaluacion(idUsuario: number, rol: string, args: { idFase: number, idFraternidad: number, criterios: any, finalizar: boolean, participanteNombre?: string, participanteTipo?: string }) {
    const { idFase, idFraternidad, criterios, finalizar, participanteNombre, participanteTipo } = args;

    const jurado = await this.getValidadorJurado(idUsuario, rol, idFase);

    // Validar fase vigencia
    const fase = await this.faseRepo.findOne({ where: { idFase } });
    if (!fase || !fase.estaActiva) throw new ForbiddenException('La fase no está habilitada.');
    
    const ahora = new Date();
    if (fase.fechaInicio > ahora || fase.fechaFin < ahora) {
      throw new ForbiddenException('Fuera del límite de tiempo para evaluación.');
    }

    const whereClause: any = {
      jurado: { idJurado: jurado.idJurado },
      fase: { idFase },
      fraternidad: { idFraternidad }
    };
    if (participanteNombre) {
      whereClause.participanteNombre = participanteNombre;
    }

    let evaluacion = await this.evaluacionRepo.findOne({
      where: whereClause
    });

    if (evaluacion && evaluacion.estado === 'COMPLETADO') {
      throw new ForbiddenException('Esta evaluación ya ha finalizado y no puede ser modificada.');
    }

    // Calcular puntaje total parcial o total
    let puntajeTotal = 0;
    if (criterios) {
      for (const key of Object.keys(criterios)) {
        puntajeTotal += (Number(criterios[key]) || 0);
      }
    }

    if (!evaluacion) {
      // Create new
      evaluacion = this.evaluacionRepo.create({
        jurado: { idJurado: jurado.idJurado },
        fase: { idFase },
        fraternidad: { idFraternidad },
        criteriosEvaluados: criterios,
        puntajeTotal,
        estado: finalizar ? 'COMPLETADO' : 'EN_PROGRESO',
        participanteNombre: participanteNombre || null,
        participanteTipo: participanteTipo || null,
        fechaApertura: new Date(),
        fechaCierre: finalizar ? new Date() : null
      });
    } else {
      // Update existing
      evaluacion.criteriosEvaluados = criterios;
      evaluacion.puntajeTotal = puntajeTotal;
      evaluacion.estado = finalizar ? 'COMPLETADO' : 'EN_PROGRESO';
      if (finalizar) evaluacion.fechaCierre = new Date();
    }

    return this.evaluacionRepo.save(evaluacion);
  }

  // --- HELPER: Validar presupuesto EFU ---
  private async validarPresupuestoEFU(gestionId: number, pesoNuevo: number, excluirFaseId?: number) {
    const fasesEfu = await this.faseRepo.find({ where: { gestion: { idGestion: gestionId }, tipoConcurso: 'EFU' } });
    const pesoActual = fasesEfu
      .filter(f => !excluirFaseId || f.idFase !== excluirFaseId)
      .reduce((sum, f) => sum + Number(f.pesoPorcentaje), 0);
    if (pesoActual + Number(pesoNuevo) > 100) {
      const disponible = (100 - pesoActual).toFixed(2);
      throw new BadRequestException(`El total de fases EFU superaría el 100%. Porcentaje disponible: ${disponible}%`);
    }
  }

  async validarPresupuestoCriterios(idFase: number, nuevoPuntaje: number, idCriterioExclude?: number) {
    const fase = await this.faseRepo.findOne({ where: { idFase } });
    if (!fase) throw new NotFoundException('Fase no encontrada');

    // REGLA DE ORO: EFU hereda el peso de la fase, Externo usa 100%
    const limite = fase.tipoConcurso === 'EFU' ? Number(fase.pesoPorcentaje) : 100;

    const criterios = await this.criterioRepo.find({
      where: { fase: { idFase } },
    });

    const puntajeActual = criterios
      .filter(c => c.idCriterio !== idCriterioExclude)
      .reduce((sum, c) => sum + Number(c.puntajeMaximo), 0);

    if (puntajeActual + nuevoPuntaje > limite) {
      const disponible = (limite - puntajeActual).toFixed(2);
      const msg = fase.tipoConcurso === 'EFU' 
        ? `El total de los criterios no puede exceder el peso de la fase (${limite}%). Disponible: ${disponible}%`
        : `El total de los criterios no puede exceder el 100%. Disponible: ${disponible}%`;
      throw new BadRequestException(msg);
    }
  }

  // --- CRUD GESTIÓN DE FASES ---
  async createFase(data: any) {
    let gestion: Gestion;
    if (data.gestionId) {
      gestion = await this.gestionRepo.findOne({ where: { idGestion: data.gestionId } });
      if (!gestion) throw new NotFoundException('Gestión no encontrada');
    } else {
      gestion = await this.gestionRepo.findOne({ where: { activa: true } });
    }
    if (!gestion) throw new NotFoundException('No hay una Gestión activa configurada');

    if (data.pesoPorcentaje === undefined || data.pesoPorcentaje <= 0) {
      throw new BadRequestException('El porcentaje de ponderación debe ser mayor a 0 y no puede estar vacío.');
    }

    if (data.fechaInicio && data.fechaFin) {
      const start = new Date(data.fechaInicio);
      const end = new Date(data.fechaFin);
      if (end < start) {
        throw new BadRequestException('La fecha de fin debe ser posterior o igual a la fecha de inicio.');
      }
    }

    // Validar presupuesto EFU si aplica
    const tipoConcurso = data.tipoConcurso || 'EFU';
    if (tipoConcurso === 'EFU') {
      await this.validarPresupuestoEFU(gestion.idGestion, data.pesoPorcentaje || 0);
    }

    const faseData: any = {
      ...data,
      tipoConcurso,
      categoriaEfu: tipoConcurso === 'EFU' ? (data.categoriaEfu || null) : null,
      fechaInicio: data.fechaInicio || null,
      fechaFin: data.fechaFin || null,
      gestion: gestion
    };

    const faseGuardada = (await this.faseRepo.save(this.faseRepo.create(faseData) as any)) as unknown as Fase;

    // Asignación manual de relación (Para evitar dependencias circulares)
    if (data.juradosIds && Array.isArray(data.juradosIds) && data.juradosIds.length > 0) {
       const juradosDestino = await this.juradoRepo.find({
          where: { idJurado: In(data.juradosIds) },
          relations: ['fasesHabilitadas']
       });
       for (const jurado of juradosDestino) {
          jurado.fasesHabilitadas.push(faseGuardada);
          await this.juradoRepo.save(jurado);
       }
    }

    return faseGuardada;
  }

  async updateFase(id: number, data: any) {
    const fase = await this.faseRepo.findOne({ where: { idFase: id } });
    if (!fase) throw new NotFoundException('Fase no encontrada');

    if (data.juradosIds !== undefined) {
      // Remover permisos viejos y asignar a los nuevos.
      // Como no tenemos entidad inversa nativa, buscamos qué jurados debemos actualizar
      const todosJurados = await this.juradoRepo.find({ relations: ['fasesHabilitadas'] });
      
      for (const jurado of todosJurados) {
         const teniaPermiso = jurado.fasesHabilitadas.some(f => f.idFase === id);
         const deberiaTenerPermiso = data.juradosIds.includes(jurado.idJurado);
         
         if (teniaPermiso && !deberiaTenerPermiso) {
            jurado.fasesHabilitadas = jurado.fasesHabilitadas.filter(f => f.idFase !== id);
            await this.juradoRepo.save(jurado);
         } else if (!teniaPermiso && deberiaTenerPermiso) {
            jurado.fasesHabilitadas.push(fase as Fase);
            await this.juradoRepo.save(jurado);
         }
      }
    }
    if (data.pesoPorcentaje !== undefined && data.pesoPorcentaje <= 0) {
      throw new BadRequestException('El porcentaje de ponderación debe ser mayor a 0.');
    }

    const start = data.fechaInicio !== undefined ? (data.fechaInicio ? new Date(data.fechaInicio) : null) : fase.fechaInicio;
    const end = data.fechaFin !== undefined ? (data.fechaFin ? new Date(data.fechaFin) : null) : fase.fechaFin;

    if (start && end && end < start) {
      throw new BadRequestException('La fecha de fin debe ser posterior o igual a la fecha de inicio.');
    }

    // Validar presupuesto EFU si aplica
    const tipoConcurso = data.tipoConcurso !== undefined ? data.tipoConcurso : fase.tipoConcurso;
    const nuevoPeso = data.pesoPorcentaje !== undefined ? data.pesoPorcentaje : fase.pesoPorcentaje;
    if (tipoConcurso === 'EFU') {
      const gestion = await this.gestionRepo.findOne({ where: { activa: true } });
      if (gestion) await this.validarPresupuestoEFU(gestion.idGestion, nuevoPeso, id);
    }

    // Asignar el resto de valores numéricos o texto manualmente
    if (data.nombre !== undefined) fase.nombre = data.nombre;
    if (data.pesoPorcentaje !== undefined) fase.pesoPorcentaje = data.pesoPorcentaje;
    if (data.tipoConcurso !== undefined) fase.tipoConcurso = data.tipoConcurso;
    if (data.categoriaEfu !== undefined) fase.categoriaEfu = tipoConcurso === 'EFU' ? data.categoriaEfu : null;
    if (data.fechaInicio !== undefined) fase.fechaInicio = data.fechaInicio || null;
    if (data.fechaFin !== undefined) fase.fechaFin = data.fechaFin || null;
    if (data.estaActiva !== undefined) fase.estaActiva = data.estaActiva;
    if (data.urlImagen !== undefined) fase.urlImagen = data.urlImagen;
    if (data.esPrecalificacion !== undefined) fase.esPrecalificacion = data.esPrecalificacion;

    return this.faseRepo.save(fase);
  }

  async deleteFase(id: number) {
    return this.faseRepo.delete(id);
  }

  // --- CRUD GESTIÓN DE CRITERIOS ---
  async createCriterio(data: any) {
    if (!data.fase || !data.fase.idFase) throw new BadRequestException('Debe especificar una fase válida');
    
    const puntaje = Number(data.puntajeMaximo || 0);
    if (puntaje <= 0) throw new BadRequestException('El puntaje máximo debe ser mayor a 0');

    await this.validarPresupuestoCriterios(data.fase.idFase, puntaje);

    const criterio = this.criterioRepo.create(data);
    return this.criterioRepo.save(criterio);
  }

  async updateCriterio(id: number, data: any) {
    const criterio = await this.criterioRepo.findOne({ where: { idCriterio: id }, relations: ['fase'] });
    if (!criterio) throw new NotFoundException('Criterio no encontrado');

    const nuevoPuntaje = data.puntajeMaximo !== undefined ? Number(data.puntajeMaximo) : Number(criterio.puntajeMaximo);
    
    if (nuevoPuntaje <= 0) throw new BadRequestException('El puntaje máximo debe ser mayor a 0');

    const idFase = data.fase?.idFase || criterio.fase.idFase;
    await this.validarPresupuestoCriterios(idFase, nuevoPuntaje, id);

    Object.assign(criterio, data);
    return this.criterioRepo.save(criterio);
  }

  async deleteCriterio(id: number) {
    return this.criterioRepo.delete(id);
  }
}
