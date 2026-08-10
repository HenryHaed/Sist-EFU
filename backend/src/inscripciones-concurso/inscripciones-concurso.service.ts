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
import { findGestionActivaOrLatest } from '../common/gestion.utils';
import { normalizarRequisitos, requisitosDesdePlantilla } from '../common/requisitos-concurso';

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
  ) {}

  private async getUsuarioConFase(idUsuario: number) {
    const usuario = await this.usuarioRepo.findOne({
      where: { idUsuario },
      relations: ['rol', 'faseConcurso', 'fraternidad', 'faseConcurso.gestion'],
    });
    if (!usuario) throw new NotFoundException('Usuario no encontrado');
    return usuario;
  }

  private requisitosDeFase(fase: Fase) {
    if (fase.requisitosInscripcion) return normalizarRequisitos(fase.requisitosInscripcion);
    return requisitosDesdePlantilla(fase.plantillaRequisitos || 'generico');
  }

  async getMiInscripcion(idUsuario: number) {
    const usuario = await this.getUsuarioConFase(idUsuario);
    if (usuario.rol?.nombre !== 'concursante') {
      throw new ForbiddenException('Solo concursantes pueden acceder a esta inscripción.');
    }
    if (!usuario.faseConcurso) {
      throw new BadRequestException('No tienes un concurso asignado. Contacta al administrador.');
    }

    let insc = await this.inscRepo.findOne({
      where: {
        usuario: { idUsuario },
        fase: { idFase: usuario.faseConcurso.idFase },
      },
      relations: ['fase', 'archivos', 'gestion', 'participante'],
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
        }),
      );
      insc = await this.inscRepo.findOne({
        where: { idInscripcion: insc.idInscripcion },
        relations: ['fase', 'archivos', 'gestion'],
      });
    }

    return {
      ...insc,
      requisitos: this.requisitosDeFase(insc.fase),
      fraternidad: usuario.fraternidad || null,
    };
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
    if (
      ![
        EstadoInscripcionConcurso.BORRADOR,
        EstadoInscripcionConcurso.OBSERVADO,
      ].includes(insc.estado)
    ) {
      throw new BadRequestException(
        'Solo puedes editar la inscripción en estado BORRADOR u OBSERVADO.',
      );
    }
    return insc;
  }

  async subirArchivo(
    idUsuario: number,
    claveDocumento: string,
    file: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException('Archivo requerido.');
    const insc = await this.getMiInscripcionEditable(idUsuario);
    const requisitos = this.requisitosDeFase(insc.fase);
    const docReq = requisitos.documentos.find((d) => d.clave === claveDocumento);
    if (!docReq) {
      throw new BadRequestException(`El documento "${claveDocumento}" no es requerido en este concurso.`);
    }
    if (docReq.mime?.length && !docReq.mime.includes(file.mimetype) && !docReq.mime.some((m) => file.mimetype?.includes(m.split('/')[1]))) {
      // permitir image/jpeg vs image/jpg
      const ok = docReq.mime.some((m) => {
        const a = m.toLowerCase();
        const b = (file.mimetype || '').toLowerCase();
        return a === b || (a.includes('jpeg') && b.includes('jpeg')) || (a.includes('mpeg') && b.includes('mpeg')) || (a.includes('mp3') && (b.includes('mpeg') || b.includes('mp3')));
      });
      if (!ok) {
        throw new BadRequestException(`Tipo de archivo no permitido para ${docReq.etiqueta}. Se espera: ${docReq.mime.join(', ')}`);
      }
    }

    const existentes = (insc.archivos || []).filter((a) => a.claveDocumento === claveDocumento);
    if (existentes.length >= (docReq.maxArchivos || 1)) {
      // reemplazar el primero si max=1
      if ((docReq.maxArchivos || 1) === 1 && existentes[0]) {
        this.borrarArchivoFisico(existentes[0].url);
        await this.archivoRepo.delete(existentes[0].idArchivo);
      } else {
        throw new BadRequestException(`Ya alcanzaste el máximo de archivos para ${docReq.etiqueta}.`);
      }
    }

    const url = `/api/v1/archivos/doc-inscripcion-concurso/${file.filename}`;
    const archivo = await this.archivoRepo.save(
      this.archivoRepo.create({
        inscripcion: insc,
        claveDocumento,
        url,
        mime: file.mimetype,
        nombreOriginal: file.originalname,
        orden: existentes.length,
      }),
    );
    return archivo;
  }

  async eliminarArchivo(idUsuario: number, idArchivo: number) {
    const insc = await this.getMiInscripcionEditable(idUsuario);
    const archivo = await this.archivoRepo.findOne({
      where: { idArchivo, inscripcion: { idInscripcion: insc.idInscripcion } },
    });
    if (!archivo) throw new NotFoundException('Archivo no encontrado');
    this.borrarArchivoFisico(archivo.url);
    await this.archivoRepo.delete(idArchivo);
    return { ok: true };
  }

  async enviar(idUsuario: number) {
    const wrap = await this.getMiInscripcion(idUsuario);
    const insc = await this.inscRepo.findOne({
      where: { idInscripcion: wrap.idInscripcion },
      relations: ['fase', 'archivos'],
    });
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
      throw new BadRequestException(`Completa los requisitos obligatorios: ${faltantes.join(', ')}`);
    }

    insc.estado = EstadoInscripcionConcurso.PENDIENTE;
    insc.observacionAdmin = null;
    await this.inscRepo.save(insc);
    return this.getMiInscripcion(idUsuario);
  }

  async listarAdmin(idFase?: number) {
    const where: any = {};
    if (idFase) where.fase = { idFase };
    return this.inscRepo.find({
      where,
      relations: ['usuario', 'usuario.fraternidad', 'fase', 'archivos', 'gestion'],
      order: { updatedAt: 'DESC' },
    });
  }

  async getDetalleAdmin(idInscripcion: number) {
    const insc = await this.inscRepo.findOne({
      where: { idInscripcion },
      relations: ['usuario', 'usuario.fraternidad', 'fase', 'archivos', 'gestion', 'participante'],
    });
    if (!insc) throw new NotFoundException('Inscripción no encontrada');
    return {
      ...insc,
      requisitos: this.requisitosDeFase(insc.fase),
    };
  }

  async revisar(
    idInscripcion: number,
    accion: 'aprobar' | 'observar' | 'rechazar',
    observacion?: string,
  ) {
    const insc = await this.inscRepo.findOne({
      where: { idInscripcion },
      relations: ['usuario', 'usuario.fraternidad', 'fase', 'fase.gestion', 'participante', 'archivos'],
    });
    if (!insc) throw new NotFoundException('Inscripción no encontrada');

    if (accion === 'observar') {
      if (!observacion?.trim()) {
        throw new BadRequestException('Indica la observación para el concursante.');
      }
      insc.estado = EstadoInscripcionConcurso.OBSERVADO;
      insc.observacionAdmin = observacion.trim();
      await this.inscRepo.save(insc);
      return this.getDetalleAdmin(idInscripcion);
    }

    if (accion === 'rechazar') {
      insc.estado = EstadoInscripcionConcurso.RECHAZADO;
      insc.observacionAdmin = observacion?.trim() || insc.observacionAdmin;
      await this.inscRepo.save(insc);
      return this.getDetalleAdmin(idInscripcion);
    }

    // aprobar → sync participante
    insc.estado = EstadoInscripcionConcurso.APROBADO;
    insc.observacionAdmin = observacion?.trim() || null;

    const nombre =
      String(insc.datos?.nombreCompleto || '').trim() ||
      `${insc.usuario.nombres} ${insc.usuario.primerApellido}`.trim();

    let participante = insc.participante;
    if (!participante) {
      participante = this.participanteRepo.create({
        nombre,
        tipo: insc.fase.plantillaRequisitos || 'Participante',
        fase: insc.fase,
        gestion: insc.fase.gestion || insc.gestion,
        perteneceFraternidad: !!insc.usuario.fraternidad,
        fraternidad: insc.usuario.fraternidad || null,
        esUmsa: true,
      });
    } else {
      participante.nombre = nombre;
      participante.fraternidad = insc.usuario.fraternidad || null;
      participante.perteneceFraternidad = !!insc.usuario.fraternidad;
    }
    participante = await this.participanteRepo.save(participante);
    insc.participante = participante;
    await this.inscRepo.save(insc);

    return this.getDetalleAdmin(idInscripcion);
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
