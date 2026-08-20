import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as fs from 'fs';
import * as path from 'path';
import {
  InscripcionConcurso,
  EstadoInscripcionConcurso,
} from '../entities/InscripcionConcurso';
import { InscripcionConcursoArchivo } from '../entities/InscripcionConcursoArchivo';
import { Usuario } from '../entities/Usuario';
import { Fase } from '../entities/Fase';
import { Gestion } from '../entities/Gestion';
import { Participante } from '../entities/Participante';
import { Fraternidad } from '../entities/Fraternidad';
import {
  SolicitudInscripcion,
  EstadoSolicitud,
} from '../entities/SolicitudInscripcion';
import { findGestionActivaOrLatest } from '../common/gestion.utils';
import {
  normalizarRequisitos,
  requisitosDesdePlantilla,
  esPlantillaChachaWarmi,
  esFaseChachaWarmi,
  esPlantillaParaConcursante,
  asegurarDocumentosChachaWarmi,
} from '../common/requisitos-concurso';

@Injectable()
export class InscripcionesConcursoService {
  constructor(
    @InjectRepository(InscripcionConcurso)
    private readonly inscRepo: Repository<InscripcionConcurso>,
    @InjectRepository(InscripcionConcursoArchivo)
    private readonly archivoRepo: Repository<InscripcionConcursoArchivo>,
    @InjectRepository(Usuario)
    private readonly usuarioRepo: Repository<Usuario>,
    @InjectRepository(Fase)
    private readonly faseRepo: Repository<Fase>,
    @InjectRepository(Gestion)
    private readonly gestionRepo: Repository<Gestion>,
    @InjectRepository(Participante)
    private readonly participanteRepo: Repository<Participante>,
    @InjectRepository(SolicitudInscripcion)
    private readonly solicitudRepo: Repository<SolicitudInscripcion>,
  ) {}

  private async getUsuarioConFase(idUsuario: number) {
    const usuario = await this.usuarioRepo.findOne({
      where: { idUsuario },
      relations: ['rol', 'faseConcurso', 'fraternidad', 'faseConcurso.gestion'],
    });
    if (!usuario) throw new NotFoundException('Usuario no encontrado');
    return usuario;
  }

  private requisitosDeFase(fase?: Fase | null) {
    if (!fase) {
      return requisitosDesdePlantilla('chacha_warmi');
    }
    let req = fase.requisitosInscripcion
      ? normalizarRequisitos(fase.requisitosInscripcion)
      : requisitosDesdePlantilla(fase.plantillaRequisitos || 'generico');
    if (esFaseChachaWarmi(fase)) {
      req = asegurarDocumentosChachaWarmi(req);
    }
    return req;
  }

  private assertEditable(estado: EstadoInscripcionConcurso) {
    if (
      ![
        EstadoInscripcionConcurso.BORRADOR,
        EstadoInscripcionConcurso.OBSERVADO,
      ].includes(estado)
    ) {
      throw new BadRequestException(
        'Solo puedes editar la inscripción en estado BORRADOR u OBSERVADO.',
      );
    }
  }

  private validarMime(docReq: { etiqueta: string; mime?: string[] }, file: Express.Multer.File) {
    if (!docReq.mime?.length) return;
    const ok = docReq.mime.some((m) => {
      const a = m.toLowerCase();
      const b = (file.mimetype || '').toLowerCase();
      return (
        a === b ||
        (a.includes('jpeg') && b.includes('jpeg')) ||
        (a.includes('mpeg') && b.includes('mpeg')) ||
        (a.includes('mp3') && (b.includes('mpeg') || b.includes('mp3')))
      );
    });
    if (!ok) {
      throw new BadRequestException(
        `Tipo de archivo no permitido para ${docReq.etiqueta}. Se espera: ${docReq.mime.join(', ')}`,
      );
    }
  }

  private toResponse(insc: InscripcionConcurso, extra: Record<string, any> = {}) {
    const usuario = insc.usuario
      ? {
          idUsuario: insc.usuario.idUsuario,
          nombres: insc.usuario.nombres,
          primerApellido: insc.usuario.primerApellido,
          segundoApellido: insc.usuario.segundoApellido,
          ci: insc.usuario.ci,
          correo: insc.usuario.correo,
        }
      : null;

    return {
      idInscripcion: insc.idInscripcion,
      estado: insc.estado,
      datos: insc.datos || {},
      observacionAdmin: insc.observacionAdmin,
      revisionChecklist: insc.revisionChecklist || {},
      createdAt: insc.createdAt,
      updatedAt: insc.updatedAt,
      fase: insc.fase
        ? {
            idFase: insc.fase.idFase,
            nombre: insc.fase.nombre,
            tipoConcurso: insc.fase.tipoConcurso,
            plantillaRequisitos: insc.fase.plantillaRequisitos,
          }
        : null,
      archivos: (insc.archivos || []).map((a) => ({
        idArchivo: a.idArchivo,
        claveDocumento: a.claveDocumento,
        nombreOriginal: a.nombreOriginal,
        mime: a.mime,
        url: a.url,
        orden: a.orden,
        createdAt: a.createdAt,
      })),
      gestion: insc.gestion
        ? { idGestion: insc.gestion.idGestion, anio: (insc.gestion as any).anio }
        : null,
      fraternidad: this.fraternidadResumen(insc.fraternidad),
      participante: insc.participante
        ? {
            idParticipante: insc.participante.idParticipante,
            nombre: insc.participante.nombre,
            tipo: insc.participante.tipo,
          }
        : null,
      participantePareja: insc.participantePareja
        ? {
            idParticipante: insc.participantePareja.idParticipante,
            nombre: insc.participantePareja.nombre,
            tipo: insc.participantePareja.tipo,
          }
        : null,
      usuario,
      requisitos: this.requisitosDeFase(insc.fase),
      ...extra,
    };
  }

  // ── Concursante (fotografía / otros) ─────────────────────────────────────

  async getMiInscripcion(idUsuario: number) {
    const usuario = await this.getUsuarioConFase(idUsuario);
    if (usuario.rol?.nombre !== 'concursante') {
      throw new ForbiddenException('Solo concursantes pueden acceder a esta inscripción.');
    }
    if (!usuario.faseConcurso) {
      throw new BadRequestException('No tienes un concurso asignado. Contacta al administrador.');
    }
    if (esPlantillaChachaWarmi(usuario.faseConcurso.plantillaRequisitos)) {
      throw new BadRequestException(
        'Chacha-Warmi lo inscribe el delegado de la fraternidad, no el rol concursante.',
      );
    }
    if (!esPlantillaParaConcursante(usuario.faseConcurso.plantillaRequisitos)) {
      throw new BadRequestException(
        'Tu concurso asignado no admite inscripción por concursante. Contacta al administrador.',
      );
    }

    let insc = await this.inscRepo.findOne({
      where: {
        usuario: { idUsuario },
        fase: { idFase: usuario.faseConcurso.idFase },
      },
      relations: ['fase', 'archivos', 'gestion', 'participante', 'fraternidad'],
    });

    if (!insc) {
      const gestion =
        usuario.faseConcurso.gestion ||
        (await findGestionActivaOrLatest(this.gestionRepo));
      if (!gestion) throw new BadRequestException('No hay gestión activa.');

      insc = await this.inscRepo.save(
        this.inscRepo.create({
          usuario,
          fase: usuario.faseConcurso,
          gestion: { idGestion: (gestion as any).idGestion } as any,
          estado: EstadoInscripcionConcurso.BORRADOR,
          datos: {},
          fraternidad: usuario.fraternidad || null,
        }),
      );
      insc = await this.inscRepo.findOne({
        where: { idInscripcion: insc.idInscripcion },
        relations: ['fase', 'archivos', 'gestion', 'fraternidad'],
      });
    }

    return this.toResponse(insc, {
      fraternidad: this.fraternidadResumen(usuario.fraternidad || insc.fraternidad),
    });
  }

  async guardarDatos(idUsuario: number, datos: Record<string, any>) {
    const insc = await this.getMiInscripcionEditable(idUsuario);
    insc.datos = { ...(insc.datos || {}), ...(datos || {}) };
    await this.inscRepo.save(insc);
    return this.getMiInscripcion(idUsuario);
  }

  private async getMiInscripcionEditable(idUsuario: number) {
    const wrap = await this.getMiInscripcion(idUsuario);
    const insc = await this.inscRepo.findOne({
      where: { idInscripcion: wrap.idInscripcion },
      relations: ['fase', 'archivos', 'usuario'],
    });
    this.assertEditable(insc.estado);
    return insc;
  }

  async subirArchivo(
    idUsuario: number,
    claveDocumento: string,
    file: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException('Archivo requerido.');
    const insc = await this.getMiInscripcionEditable(idUsuario);
    return this.guardarArchivoEnInscripcion(insc, claveDocumento, file);
  }

  async eliminarArchivo(idUsuario: number, idArchivo: number) {
    const insc = await this.getMiInscripcionEditable(idUsuario);
    return this.borrarArchivoDeInscripcion(insc, idArchivo);
  }

  async enviar(idUsuario: number) {
    const wrap = await this.getMiInscripcion(idUsuario);
    const insc = await this.inscRepo.findOne({
      where: { idInscripcion: wrap.idInscripcion },
      relations: ['fase', 'archivos'],
    });
    this.validarYMarcarPendiente(insc);
    await this.inscRepo.save(insc);
    return this.getMiInscripcion(idUsuario);
  }

  // ── Delegado Chacha-Warmi ────────────────────────────────────────────────

  private async getDelegadoConFraternidad(idUsuario: number) {
    const id = Number(idUsuario);
    if (!Number.isFinite(id) || id <= 0) {
      throw new BadRequestException('Usuario delegado inválido.');
    }
    const usuario = await this.usuarioRepo.findOne({
      where: { idUsuario: id },
      relations: [
        'rol',
        'fraternidad',
        'fraternidad.gestion',
        'fraternidad.facultad',
        'fraternidad.carrera',
        'fraternidad.institucionExterna',
        'fraternidad.categoria',
        'fraternidad.tipoDanza',
      ],
    });
    const rolNombre = String(usuario?.rol?.nombre || '').trim().toLowerCase();
    if (!usuario || rolNombre !== 'delegado') {
      throw new ForbiddenException('Solo el delegado puede gestionar la inscripción Chacha-Warmi.');
    }
    if (!usuario.fraternidad) {
      throw new BadRequestException(
        'No tienes fraternidad asignada. La inscripción Chacha-Warmi se habilita cuando el administrador aprueba tu inscripción oficial.',
      );
    }
    return usuario;
  }

  private fraternidadResumen(frat: Fraternidad | null | undefined) {
    if (!frat) return null;
    return {
      idFraternidad: frat.idFraternidad,
      nombre: frat.nombre,
      habilitadoEfu: frat.habilitadoEfu,
    };
  }

  private async cargarInscripcionChacha(idInscripcion: number) {
    return this.inscRepo.findOne({
      where: { idInscripcion },
      relations: [
        'fase',
        'archivos',
        'gestion',
        'fraternidad',
        'participante',
        'participantePareja',
        'usuario',
      ],
    });
  }

  /** Busca inscripción Chacha por fraternidad o, en su defecto, por el delegado + fase. */
  private async findInscripcionChacha(opts: {
    idFraternidad: number;
    idFase: number;
    idUsuario: number;
  }) {
    const relations = [
      'fase',
      'archivos',
      'gestion',
      'fraternidad',
      'participante',
      'participantePareja',
      'usuario',
    ] as const;

    let insc = await this.inscRepo.findOne({
      where: {
        fraternidad: { idFraternidad: opts.idFraternidad },
        fase: { idFase: opts.idFase },
      },
      relations: [...relations],
    });
    if (insc) return insc;

    insc = await this.inscRepo.findOne({
      where: {
        usuario: { idUsuario: opts.idUsuario },
        fase: { idFase: opts.idFase },
      },
      relations: [...relations],
    });
    return insc;
  }

  private esConflictoUnico(err: unknown): boolean {
    const e = err as { code?: string; driverError?: { code?: string }; message?: string };
    const code = e?.code || e?.driverError?.code;
    const msg = String(e?.message || '');
    return (
      code === '23505' ||
      /duplicate key|unique constraint|llave duplicada/i.test(msg)
    );
  }

  /** Solicitud oficial APROBADA que creó la fraternidad del delegado. */
  private async findSolicitudAprobadaFraternidad(
    idFraternidad: number,
  ): Promise<SolicitudInscripcion | null> {
    return this.solicitudRepo
      .createQueryBuilder('s')
      .leftJoinAndSelect('s.categoria', 'categoria')
      .leftJoinAndSelect('s.facultad', 'facultad')
      .leftJoinAndSelect('s.carrera', 'carrera')
      .leftJoinAndSelect('s.institucionExterna', 'institucionExterna')
      .leftJoinAndSelect('s.tipoDanza', 'tipoDanza')
      .leftJoinAndSelect('s.fraternidadCreada', 'fraternidadCreada')
      .where('fraternidadCreada.id_fraternidad = :idFrat', { idFrat: idFraternidad })
      .andWhere('s.estado = :aprobado', { aprobado: EstadoSolicitud.APROBADO })
      .orderBy('s.id_solicitud', 'DESC')
      .getOne();
  }

  /**
   * Instancia (Facultad / Carrera / UMSA / …) heredada de la inscripción oficial
   * de la fraternidad, igual que en ficha técnica.
   */
  private herenciaInstanciaFraternidad(
    frat: Fraternidad,
    sol: SolicitudInscripcion | null,
  ) {
    const instancia =
      sol?.instanciaRepresentacion || frat.nivelRepresentacion || '';

    const facultadNombre = sol?.facultad?.nombre || frat.facultad?.nombre || '';
    const carreraNombre = sol?.carrera?.nombre || frat.carrera?.nombre || '';
    const institucionNombre =
      sol?.institucionExterna?.nombre ||
      sol?.nombreInstitucionExterna ||
      frat.institucionExterna?.nombre ||
      '';

    let facultadCarrera = '';
    switch (instancia) {
      case 'Facultad':
        facultadCarrera = facultadNombre || 'Facultad';
        break;
      case 'Carrera':
        facultadCarrera =
          [facultadNombre, carreraNombre].filter(Boolean).join(' — ') || 'Carrera';
        break;
      case 'UMSA':
        facultadCarrera = 'UMSA (Nivel Central)';
        break;
      case 'FEDSIDUMSA':
        facultadCarrera = 'FEDSIDUMSA';
        break;
      case 'STUMSA':
        facultadCarrera = 'STUMSA';
        break;
      case 'Externo':
        facultadCarrera = institucionNombre || 'Externo';
        break;
      default:
        facultadCarrera =
          [facultadNombre, carreraNombre, institucionNombre].filter(Boolean).join(' — ') ||
          instancia ||
          '';
    }

    return {
      nombreFraternidad: frat.nombre || sol?.nombreFraternidad || '',
      categoria: sol?.categoria?.nombre || frat.categoria?.nombre || '',
      instanciaRepresentacion: instancia || '',
      facultadNombre,
      carreraNombre,
      institucionNombre,
      facultadCarrera: facultadCarrera || '',
      danza: sol?.tipoDanza?.nombre || frat.tipoDanza?.nombre || '',
      desdeSolicitudAprobada: sol?.estado === EstadoSolicitud.APROBADO,
    };
  }

  private aplicarHerenciaEnDatos(
    datos: Record<string, any> | null | undefined,
    herencia: ReturnType<InscripcionesConcursoService['herenciaInstanciaFraternidad']>,
  ) {
    const next = { ...(datos || {}) };
    if (herencia.facultadCarrera) {
      next.facultadCarrera = herencia.facultadCarrera;
      next.facultadCarreraPareja = herencia.facultadCarrera;
    }
    if (herencia.instanciaRepresentacion) {
      next.instanciaRepresentacion = herencia.instanciaRepresentacion;
    }
    return next;
  }

  /**
   * Fase EXTERNO Chacha-Warmi de la gestión (plantilla o nombre).
   * Solo fases activas: el admin debe activarla en Gestión de Fases para habilitar a delegados.
   */
  private async findFaseChachaActiva(gestionId: number): Promise<Fase | null> {
    const fases = await this.faseRepo
      .createQueryBuilder('f')
      .leftJoinAndSelect('f.gestion', 'gestion')
      .where('gestion.id_gestion = :gid', { gid: gestionId })
      .andWhere('f.tipo_concurso = :tipo', { tipo: 'EXTERNO' })
      .andWhere('f.esta_activa = true')
      .orderBy('f.id_fase', 'DESC')
      .getMany();

    const match = fases.find((f) => esFaseChachaWarmi(f)) || null;
    // Si el admin la creó por nombre pero sin plantilla, normalizamos para el resto del flujo.
    if (match && !esPlantillaChachaWarmi(match.plantillaRequisitos)) {
      match.plantillaRequisitos = 'chacha_warmi';
      if (!match.requisitosInscripcion) {
        match.requisitosInscripcion = requisitosDesdePlantilla('chacha_warmi');
      }
      await this.faseRepo.save(match);
    }
    return match;
  }

  async getMiChacha(idUsuario: number) {
    const usuario = await this.getDelegadoConFraternidad(idUsuario);
    const frat = usuario.fraternidad;

    const solicitudAprobada = await this.findSolicitudAprobadaFraternidad(
      frat.idFraternidad,
    );
    if (!solicitudAprobada) {
      return {
        sinFase: false,
        fraternidadNoAprobada: true,
        mensaje:
          'La inscripción Chacha-Warmi solo está disponible cuando tu fraternidad ha sido aprobada oficialmente por el administrador. Completa primero la inscripción de fraternidad y espera la aprobación.',
        requisitos: null,
        insc: null,
        fraternidad: {
          idFraternidad: frat.idFraternidad,
          nombre: frat.nombre,
          habilitadoEfu: frat.habilitadoEfu,
        },
      };
    }

    if (frat.habilitadoEfu === false) {
      return {
        sinFase: false,
        fraternidadNoAprobada: true,
        mensaje:
          'Tu fraternidad no está habilitada para la EFU. Contacta al administrador para habilitarla antes de inscribir Chacha-Warmi.',
        requisitos: null,
        insc: null,
        fraternidad: {
          idFraternidad: frat.idFraternidad,
          nombre: frat.nombre,
          habilitadoEfu: false,
        },
      };
    }

    const herencia = this.herenciaInstanciaFraternidad(frat, solicitudAprobada);

    // Preferir gestión activa (donde el admin crea la fase Chacha-Warmi).
    const gestionActiva = await findGestionActivaOrLatest(this.gestionRepo);
    const gestion =
      gestionActiva ||
      frat.gestion ||
      null;
    if (!gestion) throw new BadRequestException('No hay gestión activa.');

    const fase = await this.findFaseChachaActiva((gestion as any).idGestion);
    if (!fase) {
      return {
        sinFase: true,
        fraternidadNoAprobada: false,
        mensaje:
          'Aún no hay fase Chacha-Warmi activa en esta gestión. El administrador debe crearla y activarla en Gestión de Fases (plantilla Chacha Warmi).',
        requisitos: null,
        insc: null,
        herencia,
      };
    }

    let insc = await this.findInscripcionChacha({
      idFraternidad: frat.idFraternidad,
      idFase: fase.idFase,
      idUsuario: usuario.idUsuario,
    });

    const datosConHerencia = this.aplicarHerenciaEnDatos(insc?.datos, herencia);

    if (!insc) {
      try {
        const created = await this.inscRepo.save(
          this.inscRepo.create({
            // Solo PKs: evitar cascadas/conflictos al persistir el grafo del usuario cargado.
            usuario: { idUsuario: usuario.idUsuario } as Usuario,
            fase: { idFase: fase.idFase } as Fase,
            gestion: { idGestion: (gestion as any).idGestion } as Gestion,
            fraternidad: { idFraternidad: frat.idFraternidad } as Fraternidad,
            estado: EstadoInscripcionConcurso.BORRADOR,
            datos: datosConHerencia,
          }),
        );
        insc = await this.cargarInscripcionChacha(created.idInscripcion);
      } catch (err) {
        // Doble carga del GET (p. ej. remount Vue) puede chocar con UNIQUE(usuario,fase).
        if (!this.esConflictoUnico(err)) throw err;
        insc = await this.findInscripcionChacha({
          idFraternidad: frat.idFraternidad,
          idFase: fase.idFase,
          idUsuario: usuario.idUsuario,
        });
      }
    }

    if (!insc) {
      throw new BadRequestException(
        'No se pudo crear ni recuperar la inscripción Chacha-Warmi. Intenta de nuevo.',
      );
    }

    // Si existía por usuario+fase sin fraternidad (o con otra), alinear a la fraternidad del delegado.
    if (!insc.fraternidad || insc.fraternidad.idFraternidad !== frat.idFraternidad) {
      try {
        insc.fraternidad = { idFraternidad: frat.idFraternidad } as Fraternidad;
        await this.inscRepo.save(insc);
        insc = (await this.cargarInscripcionChacha(insc.idInscripcion)) || insc;
      } catch (err) {
        if (!this.esConflictoUnico(err)) throw err;
        // Ya hay inscripción de esta fraternidad en la fase: usar esa.
        const porFrat = await this.findInscripcionChacha({
          idFraternidad: frat.idFraternidad,
          idFase: fase.idFase,
          idUsuario: usuario.idUsuario,
        });
        if (porFrat) insc = porFrat;
      }
    }

    if (
      insc.datos?.facultadCarrera !== herencia.facultadCarrera ||
      insc.datos?.facultadCarreraPareja !== herencia.facultadCarrera ||
      insc.datos?.instanciaRepresentacion !== herencia.instanciaRepresentacion
    ) {
      insc.datos = datosConHerencia;
      await this.inscRepo.save(insc);
      insc = (await this.cargarInscripcionChacha(insc.idInscripcion)) || insc;
    }

    return this.toResponse(insc, {
      sinFase: false,
      fraternidadNoAprobada: false,
      fraternidad: this.fraternidadResumen(frat),
      herencia,
      camposHeredados: ['facultadCarrera', 'facultadCarreraPareja', 'instanciaRepresentacion'],
    });
  }

  private async getMiChachaEditable(idUsuario: number) {
    const wrap = await this.getMiChacha(idUsuario);
    if ((wrap as any).fraternidadNoAprobada) {
      throw new BadRequestException(
        (wrap as any).mensaje ||
          'La fraternidad aún no está aprobada para inscribir Chacha-Warmi.',
      );
    }
    if ((wrap as any).sinFase || !(wrap as any).idInscripcion) {
      throw new BadRequestException(
        (wrap as any).mensaje || 'No hay fase Chacha-Warmi disponible.',
      );
    }
    const insc = await this.inscRepo.findOne({
      where: { idInscripcion: (wrap as any).idInscripcion },
      relations: ['fase', 'archivos', 'usuario', 'fraternidad'],
    });
    this.assertEditable(insc.estado);
    return insc;
  }

  async guardarDatosChacha(idUsuario: number, datos: Record<string, any>) {
    const insc = await this.getMiChachaEditable(idUsuario);
    const usuario = await this.getDelegadoConFraternidad(idUsuario);
    const sol = await this.findSolicitudAprobadaFraternidad(
      usuario.fraternidad.idFraternidad,
    );
    const herencia = this.herenciaInstanciaFraternidad(usuario.fraternidad, sol);
    insc.datos = this.aplicarHerenciaEnDatos(
      { ...(insc.datos || {}), ...(datos || {}) },
      herencia,
    );
    await this.inscRepo.save(insc);
    return this.getMiChacha(idUsuario);
  }

  async subirArchivoChacha(
    idUsuario: number,
    claveDocumento: string,
    file: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException('Archivo requerido.');
    const insc = await this.getMiChachaEditable(idUsuario);
    await this.guardarArchivoEnInscripcion(insc, claveDocumento, file);
    return this.getMiChacha(idUsuario);
  }

  async eliminarArchivoChacha(idUsuario: number, idArchivo: number) {
    const insc = await this.getMiChachaEditable(idUsuario);
    await this.borrarArchivoDeInscripcion(insc, idArchivo);
    return this.getMiChacha(idUsuario);
  }

  async enviarChacha(idUsuario: number) {
    const wrap = await this.getMiChacha(idUsuario);
    if ((wrap as any).fraternidadNoAprobada) {
      throw new BadRequestException(
        (wrap as any).mensaje ||
          'La fraternidad aún no está aprobada para inscribir Chacha-Warmi.',
      );
    }
    if ((wrap as any).sinFase || !(wrap as any).idInscripcion) {
      throw new BadRequestException(
        (wrap as any).mensaje || 'No hay fase Chacha-Warmi disponible.',
      );
    }
    const insc = await this.inscRepo.findOne({
      where: { idInscripcion: (wrap as any).idInscripcion },
      relations: [
        'fase',
        'fase.gestion',
        'archivos',
        'fraternidad',
        'usuario',
        'usuario.fraternidad',
        'participante',
        'participantePareja',
        'gestion',
      ],
    });
    this.validarYMarcarPendiente(insc);
    // Al enviar, ya se registran Chacha + Warmi para Concursantes y calificación.
    if (esFaseChachaWarmi(insc.fase)) {
      await this.upsertParejaChachaWarmi(insc);
    }
    await this.inscRepo.save(insc);
    return this.getMiChacha(idUsuario);
  }

  /**
   * Crea o actualiza los dos participantes (Chacha + Warmi) ligados a la inscripción.
   * Se usa al enviar (delegado) y al aprobar (admin) para que Concursantes / calificación se actualicen.
   */
  private async upsertParejaChachaWarmi(insc: InscripcionConcurso) {
    const frat = insc.fraternidad || insc.usuario?.fraternidad || null;
    const gestion = insc.fase?.gestion || insc.gestion;
    if (!insc.fase) {
      throw new BadRequestException('La inscripción no tiene fase asociada.');
    }

    const nombreChacha =
      String(insc.datos?.nombreCompleto || '').trim() ||
      (insc.usuario
        ? `${insc.usuario.nombres || ''} ${insc.usuario.primerApellido || ''}`.trim()
        : '') ||
      'Chacha';
    const nombreWarmi = String(insc.datos?.nombreCompletoPareja || '').trim();
    if (!nombreWarmi) {
      throw new BadRequestException(
        'La inscripción Chacha-Warmi debe incluir el nombre del segundo postulante (Warmi).',
      );
    }

    if (!esPlantillaChachaWarmi(insc.fase.plantillaRequisitos)) {
      insc.fase.plantillaRequisitos = 'chacha_warmi';
      await this.faseRepo.save(insc.fase);
    }

    let chacha = insc.participante;
    if (!chacha) {
      chacha = this.participanteRepo.create({
        nombre: nombreChacha,
        tipo: 'Chacha',
        fase: insc.fase,
        gestion,
        perteneceFraternidad: !!frat,
        fraternidad: frat,
        esUmsa: true,
      });
    } else {
      chacha.nombre = nombreChacha;
      chacha.tipo = 'Chacha';
      chacha.fraternidad = frat;
      chacha.perteneceFraternidad = !!frat;
      chacha.fase = insc.fase;
      if (gestion) chacha.gestion = gestion;
    }
    chacha = await this.participanteRepo.save(chacha);

    let warmi = insc.participantePareja;
    if (!warmi) {
      warmi = this.participanteRepo.create({
        nombre: nombreWarmi,
        tipo: 'Warmi',
        fase: insc.fase,
        gestion,
        perteneceFraternidad: !!frat,
        fraternidad: frat,
        esUmsa: true,
      });
    } else {
      warmi.nombre = nombreWarmi;
      warmi.tipo = 'Warmi';
      warmi.fraternidad = frat;
      warmi.perteneceFraternidad = !!frat;
      warmi.fase = insc.fase;
      if (gestion) warmi.gestion = gestion;
    }
    warmi = await this.participanteRepo.save(warmi);

    insc.participante = chacha;
    insc.participantePareja = warmi;
    return { chacha, warmi };
  }

  // ── Shared file / validate ───────────────────────────────────────────────

  private async guardarArchivoEnInscripcion(
    insc: InscripcionConcurso,
    claveDocumento: string,
    file: Express.Multer.File,
  ) {
    const requisitos = this.requisitosDeFase(insc.fase);
    const docReq = requisitos.documentos.find((d) => d.clave === claveDocumento);
    if (!docReq) {
      throw new BadRequestException(
        `El documento "${claveDocumento}" no es requerido en este concurso.`,
      );
    }
    this.validarMime(docReq, file);

    const existentes = (insc.archivos || []).filter((a) => a.claveDocumento === claveDocumento);
    if (existentes.length >= (docReq.maxArchivos || 1)) {
      if ((docReq.maxArchivos || 1) === 1 && existentes[0]) {
        this.borrarArchivoFisico(existentes[0].url);
        await this.archivoRepo.delete(existentes[0].idArchivo);
      } else {
        throw new BadRequestException(
          `Ya alcanzaste el máximo de archivos para ${docReq.etiqueta}.`,
        );
      }
    }

    const url = `/api/v1/archivos/doc-inscripcion-concurso/${file.filename}`;
    return this.archivoRepo.save(
      this.archivoRepo.create({
        inscripcion: insc,
        claveDocumento,
        url,
        mime: file.mimetype,
        nombreOriginal: file.originalname,
        orden: existentes.length,
      }),
    );
  }

  private async borrarArchivoDeInscripcion(insc: InscripcionConcurso, idArchivo: number) {
    const archivo = await this.archivoRepo.findOne({
      where: { idArchivo, inscripcion: { idInscripcion: insc.idInscripcion } },
    });
    if (!archivo) throw new NotFoundException('Archivo no encontrado');
    this.borrarArchivoFisico(archivo.url);
    await this.archivoRepo.delete(idArchivo);
    return { ok: true };
  }

  private validarYMarcarPendiente(insc: InscripcionConcurso) {
    if (
      ![
        EstadoInscripcionConcurso.BORRADOR,
        EstadoInscripcionConcurso.OBSERVADO,
      ].includes(insc.estado)
    ) {
      throw new BadRequestException('La inscripción ya fue enviada.');
    }

    const requisitos = this.requisitosDeFase(insc.fase);
    const faltantes: string[] = [];
    for (const campo of requisitos.campos.filter((c) => c.obligatorio)) {
      const val = insc.datos?.[campo.clave];
      if (val === undefined || val === null || String(val).trim() === '') {
        faltantes.push(campo.etiqueta);
      }
    }
    for (const doc of requisitos.documentos.filter((d) => d.obligatorio)) {
      const tiene = (insc.archivos || []).some((a) => a.claveDocumento === doc.clave);
      if (!tiene) faltantes.push(doc.etiqueta);
    }
    if (faltantes.length) {
      throw new BadRequestException(
        `Completa los requisitos obligatorios: ${faltantes.join(', ')}`,
      );
    }

    insc.estado = EstadoInscripcionConcurso.PENDIENTE;
    insc.observacionAdmin = null;
  }

  // ── Admin ────────────────────────────────────────────────────────────────

  async listarAdmin(idFase?: number) {
    const where: any = {};
    if (idFase) where.fase = { idFase };
    return this.inscRepo.find({
      where,
      relations: [
        'usuario',
        'usuario.fraternidad',
        'fraternidad',
        'fase',
        'archivos',
        'gestion',
        'participante',
        'participantePareja',
      ],
      order: { updatedAt: 'DESC' },
    });
  }

  async getDetalleAdmin(idInscripcion: number) {
    const insc = await this.inscRepo.findOne({
      where: { idInscripcion },
      relations: [
        'usuario',
        'usuario.fraternidad',
        'fraternidad',
        'fase',
        'archivos',
        'gestion',
        'participante',
        'participantePareja',
      ],
    });
    if (!insc) throw new NotFoundException('Inscripción no encontrada');
    return this.toResponse(insc);
  }

  private extraerItemsObservados(
    checklist: Record<string, { estado?: string; label?: string; comentario?: string }> = {},
  ) {
    return Object.entries(checklist)
      .filter(([, item]) => item?.estado === 'X')
      .map(([, item]) => {
        const etiqueta = item?.label || 'Dato observado';
        const motivo = item?.comentario?.trim();
        return motivo ? `${etiqueta}: ${motivo}` : etiqueta;
      })
      .filter(Boolean);
  }

  async guardarProgresoRevision(idInscripcion: number, revisionChecklist: any) {
    const insc = await this.inscRepo.findOne({ where: { idInscripcion } });
    if (!insc) throw new NotFoundException('Inscripción no encontrada');
    if (insc.estado === EstadoInscripcionConcurso.BORRADOR) {
      throw new BadRequestException('No se puede guardar progreso en un borrador.');
    }
    if (insc.estado === EstadoInscripcionConcurso.RECHAZADO) {
      throw new BadRequestException('No se puede guardar progreso en una inscripción rechazada.');
    }
    if (revisionChecklist === undefined || revisionChecklist === null) {
      throw new BadRequestException('El checklist de revisión es obligatorio.');
    }
    if (typeof revisionChecklist !== 'object' || Array.isArray(revisionChecklist)) {
      throw new BadRequestException('El checklist de revisión debe ser un objeto.');
    }
    insc.revisionChecklist = revisionChecklist;
    await this.inscRepo.save(insc);
    return this.getDetalleAdmin(idInscripcion);
  }

  async revisar(
    idInscripcion: number,
    accion: 'aprobar' | 'observar' | 'rechazar',
    observacion?: string,
    revisionChecklist?: any,
  ) {
    const insc = await this.inscRepo.findOne({
      where: { idInscripcion },
      relations: [
        'usuario',
        'usuario.fraternidad',
        'fraternidad',
        'fase',
        'fase.gestion',
        'participante',
        'participantePareja',
        'archivos',
        'gestion',
      ],
    });
    if (!insc) throw new NotFoundException('Inscripción no encontrada');

    const checklistNormalizado =
      revisionChecklist !== undefined && revisionChecklist !== null
        ? revisionChecklist
        : insc.revisionChecklist || {};

    if (revisionChecklist !== undefined && revisionChecklist !== null) {
      if (typeof revisionChecklist !== 'object' || Array.isArray(revisionChecklist)) {
        throw new BadRequestException('El checklist de revisión debe ser un objeto.');
      }
      insc.revisionChecklist = revisionChecklist;
    }

    if (accion === 'observar') {
      const itemsObservados = Object.values(checklistNormalizado).filter(
        (item: any) => item?.estado === 'X',
      );
      if (!itemsObservados.length && !observacion?.trim()) {
        throw new BadRequestException(
          'Marca con ✕ al menos un dato o documento, o escribe una observación.',
        );
      }
      const sinMotivo = itemsObservados.filter((item: any) => !item?.comentario?.trim());
      if (sinMotivo.length) {
        throw new BadRequestException(
          'Indica el motivo en cada dato o documento marcado con ✕.',
        );
      }
      const desdeChecklist = this.extraerItemsObservados(checklistNormalizado);
      const texto =
        observacion?.trim() ||
        (desdeChecklist.length
          ? `Observaciones:\n• ${desdeChecklist.join('\n• ')}`
          : '');
      if (!texto) {
        throw new BadRequestException('Indica la observación para el inscrito.');
      }
      insc.estado = EstadoInscripcionConcurso.OBSERVADO;
      insc.observacionAdmin = texto;
      await this.inscRepo.save(insc);
      return this.getDetalleAdmin(idInscripcion);
    }

    if (accion === 'rechazar') {
      if (!observacion?.trim()) {
        throw new BadRequestException(
          'Indica el motivo del rechazo. La inscripción quedará anulada.',
        );
      }
      insc.estado = EstadoInscripcionConcurso.RECHAZADO;
      insc.observacionAdmin = observacion.trim();
      // Quitar de Concursantes / calificación si aún no hay evaluaciones cerradas.
      await this.retirarParticipantesSiSinEvaluacion(insc);
      await this.inscRepo.save(insc);
      return this.getDetalleAdmin(idInscripcion);
    }

    // aprobar: todos los campos y documentos del concurso deben estar ✓
    const requisitos = this.requisitosDeFase(insc.fase);
    const clavesEsperadas = [
      ...requisitos.campos.map((c) => c.clave),
      ...requisitos.documentos.map((d) => d.clave),
    ];
    if (!clavesEsperadas.length) {
      // sin plantilla de requisitos: exigir checklist no vacío y todo OK
      const items = Object.values(checklistNormalizado || {});
      if (!items.length || !items.every((item: any) => item?.estado === 'OK')) {
        throw new BadRequestException(
          'Marca todos los datos y documentos con ✓ antes de aprobar.',
        );
      }
    } else {
      const incompletos = clavesEsperadas.filter(
        (clave) => (checklistNormalizado as any)?.[clave]?.estado !== 'OK',
      );
      if (incompletos.length) {
        throw new BadRequestException(
          'Marca todos los datos y documentos del expediente con ✓ antes de aprobar.',
        );
      }
      const hayX = Object.values(checklistNormalizado || {}).some(
        (item: any) => item?.estado === 'X',
      );
      if (hayX) {
        throw new BadRequestException(
          'No se puede aprobar mientras haya ítems marcados con ✕. Observa o corrige el checklist.',
        );
      }
    }

    insc.estado = EstadoInscripcionConcurso.APROBADO;
    insc.observacionAdmin = observacion?.trim() || null;

    const frat = insc.fraternidad || insc.usuario?.fraternidad || null;
    const gestion = insc.fase.gestion || insc.gestion;

    if (esFaseChachaWarmi(insc.fase)) {
      await this.upsertParejaChachaWarmi(insc);
    } else {
      const nombre =
        String(insc.datos?.nombreCompleto || '').trim() ||
        `${insc.usuario.nombres} ${insc.usuario.primerApellido}`.trim();

      const plantilla = String(insc.fase.plantillaRequisitos || '').toLowerCase();
      const tipoParticipante =
        plantilla === 'fotografia'
          ? 'Fotógrafo'
          : plantilla === 'generico'
            ? 'Participante'
            : insc.fase.plantillaRequisitos || 'Participante';

      let participante = insc.participante;
      if (!participante) {
        participante = this.participanteRepo.create({
          nombre,
          tipo: tipoParticipante,
          fase: insc.fase,
          gestion,
          perteneceFraternidad: !!frat,
          fraternidad: frat,
          esUmsa: true,
        });
      } else {
        participante.nombre = nombre;
        participante.tipo = tipoParticipante;
        participante.fraternidad = frat;
        participante.perteneceFraternidad = !!frat;
      }
      participante = await this.participanteRepo.save(participante);
      insc.participante = participante;
    }

    await this.inscRepo.save(insc);
    return this.getDetalleAdmin(idInscripcion);
  }

  /** Al rechazar, desliga y elimina Chacha/Warmi si no hay evaluaciones. */
  private async retirarParticipantesSiSinEvaluacion(insc: InscripcionConcurso) {
    const ids = [
      insc.participante?.idParticipante,
      insc.participantePareja?.idParticipante,
    ].filter((id): id is number => Number.isFinite(id) && id > 0);

    insc.participante = null;
    insc.participantePareja = null;
    await this.inscRepo.save(insc);

    for (const id of ids) {
      try {
        await this.participanteRepo.delete(id);
      } catch {
        // Si tiene evaluaciones u otra FK, se deja el registro desligado.
      }
    }
  }

  private borrarArchivoFisico(url: string) {
    try {
      const filename = url.split('/').pop();
      const filePath = path.join(process.cwd(), 'uploads', 'Doc_Inscripcion_Concurso', filename);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    } catch {
      /* ignore */
    }
  }
}
