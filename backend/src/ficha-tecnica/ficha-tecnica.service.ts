import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { join } from 'path';
import * as fs from 'fs';
import { Response } from 'express';
import {
  FichaTecnicaMonografia,
  EstadoFichaTecnica,
  PersonaFicha,
} from '../entities/FichaTecnicaMonografia';
import { Fraternidad } from '../entities/Fraternidad';
import { Usuario } from '../entities/Usuario';
import { Gestion } from '../entities/Gestion';
import { SolicitudInscripcion, EstadoSolicitud } from '../entities/SolicitudInscripcion';
import { findGestionActivaOrLatest } from '../common/gestion.utils';
import {
  resolveLogoPath,
  PDF_UMSA_BLUE,
  PDF_UMSA_RED,
} from '../common/pdf-layout';

const EMPTY_PERSONA = (): PersonaFicha => ({
  nombresApellidos: '',
  ci: '',
  matricula: '',
  celular: '',
});

function nombreCompletoSolicitud(s: Record<string, any>, prefix: string): string {
  return [s[`${prefix}Nombres`], s[`${prefix}PrimerApellido`], s[`${prefix}SegundoApellido`]]
    .filter((p) => p && String(p).trim())
    .join(' ')
    .trim();
}

@Injectable()
export class FichaTecnicaService {
  constructor(
    @InjectRepository(FichaTecnicaMonografia)
    private readonly fichaRepo: Repository<FichaTecnicaMonografia>,
    @InjectRepository(Fraternidad)
    private readonly fraternidadRepo: Repository<Fraternidad>,
    @InjectRepository(Usuario)
    private readonly usuarioRepo: Repository<Usuario>,
    @InjectRepository(Gestion)
    private readonly gestionRepo: Repository<Gestion>,
    @InjectRepository(SolicitudInscripcion)
    private readonly solicitudRepo: Repository<SolicitudInscripcion>,
  ) {}

  private ensureUploadDir(): string {
    const dir = join(process.cwd(), 'uploads', 'Doc_Ficha_Tecnica');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    return dir;
  }

  private deletePdfIfExists(urlPdf?: string | null) {
    if (!urlPdf) return;
    const filename = urlPdf.split('/').pop();
    if (!filename) return;
    const filePath = join(process.cwd(), 'uploads', 'Doc_Ficha_Tecnica', filename);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  }

  private normalizarPersonas(arr: any, n = 2): PersonaFicha[] {
    const list = Array.isArray(arr) ? arr : [];
    const out: PersonaFicha[] = [];
    for (let i = 0; i < n; i++) {
      const p = list[i] || {};
      out.push({
        nombresApellidos: String(p.nombresApellidos || '').trim(),
        ci: String(p.ci || '').trim(),
        matricula: String(p.matricula || '').trim(),
        celular: String(p.celular || '').trim(),
      });
    }
    return out;
  }

  private facultadCarreraLabel(frat: Fraternidad): string {
    const parts = [
      frat.facultad?.nombre,
      frat.carrera?.nombre,
      frat.institucionExterna?.nombre,
    ].filter(Boolean);
    return parts.join(' — ') || '';
  }

  private toResponse(
    ficha: FichaTecnicaMonografia,
    herencia?: ReturnType<FichaTecnicaService['herenciaDesdeSolicitud']> | null,
  ) {
    return {
      idFicha: ficha.idFicha,
      idFraternidad: ficha.fraternidad?.idFraternidad,
      nombreFraternidad: ficha.nombreFraternidad,
      categoria: ficha.categoria,
      instanciaRepresentacion:
        ficha.instanciaRepresentacion || herencia?.instanciaRepresentacion || '',
      facultadNombre: herencia?.facultadNombre || '',
      carreraNombre: herencia?.carreraNombre || '',
      institucionNombre: herencia?.institucionNombre || '',
      facultadCarrera: ficha.facultadCarrera,
      danza: ficha.danza,
      lugarOrigenDanza: ficha.lugarOrigenDanza,
      sinopsisDanza: ficha.sinopsisDanza,
      resenaHistorica: ficha.resenaHistorica,
      fechaFundacion: ficha.fechaFundacion,
      fundadores: ficha.fundadores,
      premios: ficha.premios,
      nombreFirmante: ficha.nombreFirmante,
      expositores: this.normalizarPersonas(ficha.expositores),
      representantesTraje: this.normalizarPersonas(ficha.representantesTraje),
      estado: ficha.estado,
      urlPdf: ficha.urlPdf,
      fechaGeneracion: ficha.fechaGeneracion,
      updatedAt: ficha.updatedAt,
      camposHeredadosBloqueados: true,
      desdeSolicitudAprobada: herencia?.desdeSolicitudAprobada ?? false,
      fraternidad: ficha.fraternidad
        ? { idFraternidad: ficha.fraternidad.idFraternidad, nombre: ficha.fraternidad.nombre }
        : null,
      actualizadoPor: ficha.actualizadoPor
        ? {
            idUsuario: ficha.actualizadoPor.idUsuario,
            nombres: ficha.actualizadoPor.nombres,
            primerApellido: ficha.actualizadoPor.primerApellido,
          }
        : null,
    };
  }

  private async findSolicitudHerencia(idFraternidad: number): Promise<SolicitudInscripcion | null> {
    const base = () =>
      this.solicitudRepo
        .createQueryBuilder('s')
        .leftJoinAndSelect('s.categoria', 'categoria')
        .leftJoinAndSelect('s.facultad', 'facultad')
        .leftJoinAndSelect('s.carrera', 'carrera')
        .leftJoinAndSelect('s.institucionExterna', 'institucionExterna')
        .leftJoinAndSelect('s.tipoDanza', 'tipoDanza')
        .leftJoinAndSelect('s.fraternidadCreada', 'fraternidadCreada')
        .where('fraternidadCreada.id_fraternidad = :idFrat', { idFrat: idFraternidad })
        .andWhere('s.estado != :borrador', { borrador: EstadoSolicitud.BORRADOR })
        .orderBy('s.id_solicitud', 'DESC');

    const aprobada = await base()
      .andWhere('s.estado = :aprobado', { aprobado: EstadoSolicitud.APROBADO })
      .getOne();
    if (aprobada) return aprobada;
    return base().getOne();
  }

  private herenciaDesdeSolicitud(frat: Fraternidad, sol: SolicitudInscripcion | null) {
    const instancia =
      sol?.instanciaRepresentacion ||
      frat.nivelRepresentacion ||
      '';

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
        facultadCarrera = [facultadNombre, carreraNombre].filter(Boolean).join(' — ') || 'Carrera';
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
          this.facultadCarreraLabel(frat);
    }

    const presi = sol ? nombreCompletoSolicitud(sol as any, 'presi') : '';
    const titular = sol ? nombreCompletoSolicitud(sol as any, 'delTitular') : '';

    return {
      nombreFraternidad: frat.nombre || sol?.nombreFraternidad || '',
      categoria: sol?.categoria?.nombre || frat.categoria?.nombre || '',
      instanciaRepresentacion: instancia || '',
      facultadNombre,
      carreraNombre,
      institucionNombre,
      facultadCarrera: facultadCarrera || '',
      danza: sol?.tipoDanza?.nombre || frat.tipoDanza?.nombre || '',
      fechaFundacion: frat.fechaFundacion
        ? String(frat.fechaFundacion).slice(0, 10)
        : null,
      nombreFirmante: presi || titular || '',
      desdeSolicitudAprobada: sol?.estado === EstadoSolicitud.APROBADO,
    };
  }

  /** Fuerza los campos heredados de la solicitud aprobada / preinscripción. */
  private aplicarHerenciaForzada(
    ficha: FichaTecnicaMonografia,
    herencia: ReturnType<FichaTecnicaService['herenciaDesdeSolicitud']>,
  ) {
    ficha.nombreFraternidad = herencia.nombreFraternidad;
    ficha.categoria = herencia.categoria;
    ficha.instanciaRepresentacion = herencia.instanciaRepresentacion;
    ficha.facultadCarrera = herencia.facultadCarrera;
    ficha.danza = herencia.danza;
    if (!ficha.fechaFundacion && herencia.fechaFundacion) {
      ficha.fechaFundacion = herencia.fechaFundacion;
    }
    if (!String(ficha.nombreFirmante || '').trim() && herencia.nombreFirmante) {
      ficha.nombreFirmante = herencia.nombreFirmante;
    }
  }

  private assertAdmin(rol: string) {
    if (!['superusuario', 'admin'].includes(rol?.toLowerCase())) {
      throw new ForbiddenException('Solo administradores pueden ver el listado de fichas.');
    }
  }

  private async getDelegadoFraternidad(idUsuario: number) {
    const usuario = await this.usuarioRepo.findOne({
      where: { idUsuario },
      relations: [
        'rol',
        'fraternidad',
        'fraternidad.categoria',
        'fraternidad.facultad',
        'fraternidad.carrera',
        'fraternidad.institucionExterna',
        'fraternidad.tipoDanza',
        'fraternidad.gestion',
      ],
    });
    if (!usuario || usuario.rol?.nombre !== 'delegado') {
      throw new ForbiddenException('Solo el delegado puede gestionar su ficha técnica.');
    }
    if (!usuario.fraternidad) {
      throw new BadRequestException('No tienes fraternidad asignada.');
    }
    return usuario;
  }

  private static readonly MENSAJE_FICHA_NO_APROBADA =
    'Su fraternidad aún no fue aprobada. Corrija las observaciones pendientes o espere a que la Comisión de Culturas revise su solicitud para generar su ficha técnica.';

  private async findUltimaSolicitudDelegado(idUsuario: number) {
    return this.solicitudRepo.findOne({
      where: { delegado: { idUsuario } },
      order: { createdAt: 'DESC' },
      relations: ['fraternidadCreada'],
    });
  }

  private respuestaFichaBloqueada(estadoSolicitud: string | null = null) {
    return {
      accesoPermitido: false,
      estadoSolicitud,
      mensaje: FichaTecnicaService.MENSAJE_FICHA_NO_APROBADA,
    };
  }

  /** Solo inscripción APROBADA con fraternidad oficial puede usar ficha técnica. */
  private async assertAccesoFichaAprobada(idUsuario: number) {
    const usuario = await this.usuarioRepo.findOne({
      where: { idUsuario },
      relations: ['rol', 'fraternidad'],
    });
    if (!usuario || usuario.rol?.nombre !== 'delegado') {
      throw new ForbiddenException('Solo el delegado puede gestionar su ficha técnica.');
    }
    const ultima = await this.findUltimaSolicitudDelegado(idUsuario);
    if (!usuario.fraternidad) {
      throw new BadRequestException(FichaTecnicaService.MENSAJE_FICHA_NO_APROBADA);
    }
    const sol = await this.findSolicitudHerencia(usuario.fraternidad.idFraternidad);
    if (!sol || sol.estado !== EstadoSolicitud.APROBADO) {
      throw new BadRequestException(FichaTecnicaService.MENSAJE_FICHA_NO_APROBADA);
    }
    return { usuario, sol, ultima };
  }

  async getMiFicha(idUsuario: number) {
    const usuarioLite = await this.usuarioRepo.findOne({
      where: { idUsuario },
      relations: ['rol', 'fraternidad'],
    });
    if (!usuarioLite || usuarioLite.rol?.nombre !== 'delegado') {
      throw new ForbiddenException('Solo el delegado puede gestionar su ficha técnica.');
    }

    const ultimaSol = await this.findUltimaSolicitudDelegado(idUsuario);
    if (!usuarioLite.fraternidad) {
      return this.respuestaFichaBloqueada(ultimaSol?.estado || null);
    }

    const solCheck = await this.findSolicitudHerencia(usuarioLite.fraternidad.idFraternidad);
    if (!solCheck || solCheck.estado !== EstadoSolicitud.APROBADO) {
      return this.respuestaFichaBloqueada(solCheck?.estado || ultimaSol?.estado || null);
    }

    const usuario = await this.getDelegadoFraternidad(idUsuario);
    const frat = usuario.fraternidad;
    const sol = solCheck;
    const herencia = this.herenciaDesdeSolicitud(frat, sol);

    let ficha = await this.fichaRepo.findOne({
      where: { fraternidad: { idFraternidad: frat.idFraternidad } },
      relations: ['fraternidad', 'actualizadoPor', 'gestion'],
    });

    if (!ficha) {
      const gestion =
        frat.gestion || (await findGestionActivaOrLatest(this.gestionRepo));
      if (!gestion) throw new BadRequestException('No hay gestión activa.');

      ficha = this.fichaRepo.create({
        fraternidad: frat,
        gestion: { idGestion: (gestion as any).idGestion } as any,
        nombreFraternidad: herencia.nombreFraternidad,
        categoria: herencia.categoria,
        instanciaRepresentacion: herencia.instanciaRepresentacion,
        facultadCarrera: herencia.facultadCarrera,
        danza: herencia.danza,
        lugarOrigenDanza: '',
        sinopsisDanza: '',
        resenaHistorica: '',
        fechaFundacion: herencia.fechaFundacion,
        fundadores: '',
        premios: '',
        nombreFirmante: herencia.nombreFirmante,
        expositores: [EMPTY_PERSONA(), EMPTY_PERSONA()],
        representantesTraje: [EMPTY_PERSONA(), EMPTY_PERSONA()],
        estado: EstadoFichaTecnica.BORRADOR,
        actualizadoPor: usuario,
      });
      ficha = await this.fichaRepo.save(ficha);
      ficha = await this.fichaRepo.findOne({
        where: { idFicha: ficha.idFicha },
        relations: ['fraternidad', 'actualizadoPor', 'gestion'],
      });
    } else if (ficha.estado === EstadoFichaTecnica.BORRADOR) {
      this.aplicarHerenciaForzada(ficha, herencia);
      await this.fichaRepo.save(ficha);
    }

    return { accesoPermitido: true, ...this.toResponse(ficha, herencia) };
  }

  async guardarMiFicha(idUsuario: number, body: any) {
    await this.assertAccesoFichaAprobada(idUsuario);
    const usuario = await this.getDelegadoFraternidad(idUsuario);
    let ficha = await this.fichaRepo.findOne({
      where: { fraternidad: { idFraternidad: usuario.fraternidad.idFraternidad } },
      relations: ['fraternidad', 'actualizadoPor', 'gestion'],
    });
    if (!ficha) {
      await this.getMiFicha(idUsuario);
      ficha = await this.fichaRepo.findOne({
        where: { fraternidad: { idFraternidad: usuario.fraternidad.idFraternidad } },
        relations: ['fraternidad', 'actualizadoPor', 'gestion'],
      });
    }

    if (ficha.estado === EstadoFichaTecnica.GENERADA) {
      throw new BadRequestException(
        'La ficha ya fue generada. Usa «Corregir mi ficha técnica» para editarla de nuevo.',
      );
    }

    this.applyBody(ficha, body);
    // Reaplica heredados desde la solicitud aprobada (no editables por el delegado)
    const sol = await this.findSolicitudHerencia(usuario.fraternidad.idFraternidad);
    this.aplicarHerenciaForzada(ficha, this.herenciaDesdeSolicitud(usuario.fraternidad, sol));
    ficha.actualizadoPor = usuario;
    await this.fichaRepo.save(ficha);
    return this.getMiFicha(idUsuario);
  }

  private applyBody(ficha: FichaTecnicaMonografia, body: any) {
    // nombreFraternidad, categoria, instancia, facultadCarrera y danza son heredados (bloqueados)
    if (body.lugarOrigenDanza !== undefined) ficha.lugarOrigenDanza = String(body.lugarOrigenDanza || '').trim();
    if (body.sinopsisDanza !== undefined) ficha.sinopsisDanza = String(body.sinopsisDanza || '').trim();
    if (body.resenaHistorica !== undefined) ficha.resenaHistorica = String(body.resenaHistorica || '').trim();
    if (body.fechaFundacion !== undefined) {
      ficha.fechaFundacion = body.fechaFundacion ? String(body.fechaFundacion).slice(0, 10) : null;
    }
    if (body.fundadores !== undefined) ficha.fundadores = String(body.fundadores || '').trim();
    if (body.premios !== undefined) ficha.premios = String(body.premios || '').trim();
    if (body.nombreFirmante !== undefined) ficha.nombreFirmante = String(body.nombreFirmante || '').trim().toUpperCase();
    if (body.expositores !== undefined) ficha.expositores = this.normalizarPersonas(body.expositores);
    if (body.representantesTraje !== undefined) {
      ficha.representantesTraje = this.normalizarPersonas(body.representantesTraje);
    }
  }

  private personaVacia(p: PersonaFicha): boolean {
    return (
      !String(p?.nombresApellidos || '').trim() &&
      !String(p?.ci || '').trim() &&
      !String(p?.matricula || '').trim() &&
      !String(p?.celular || '').trim()
    );
  }

  private personaCompleta(p: PersonaFicha): boolean {
    return !!(
      String(p?.nombresApellidos || '').trim() &&
      String(p?.ci || '').trim() &&
      String(p?.matricula || '').trim() &&
      String(p?.celular || '').trim()
    );
  }

  /** Filas con datos útiles para PDF (omite vacías). */
  private personasParaPdf(arr: any): PersonaFicha[] {
    const list = this.normalizarPersonas(arr).filter((p) => !this.personaVacia(p));
    return list.length ? list : [EMPTY_PERSONA()];
  }

  private validarCompleta(ficha: FichaTecnicaMonografia) {
    const faltantes: string[] = [];
    const req = [
      ['nombreFraternidad', 'Nombre de la fraternidad'],
      ['categoria', 'Categoría'],
      ['facultadCarrera', 'Facultad, carrera u otros'],
      ['danza', 'Danza'],
      ['lugarOrigenDanza', 'Lugar de origen de la danza'],
      ['sinopsisDanza', 'Sinopsis de la danza'],
      ['resenaHistorica', 'Reseña histórica'],
      ['fechaFundacion', 'Fecha de fundación'],
      ['fundadores', 'Fundadores'],
      ['premios', 'Premios logrados'],
      ['nombreFirmante', 'Nombre de quien firma'],
    ] as const;
    for (const [key, label] of req) {
      if (!String((ficha as any)[key] || '').trim()) faltantes.push(label);
    }

    /**
     * Expositores / representantes: muy flexible.
     * - La misma persona (CI/datos) puede repetirse en ambas secciones.
     * - Filas vacías OK; si se empieza una fila, debe quedar completa.
     * - Basta con al menos 1 persona completa en expositores O en representantes
     *   (no se exige una por cada sección ni 2 por bloque).
     */
    const revisarFilas = (list: PersonaFicha[], titulo: string) => {
      let completas = 0;
      this.normalizarPersonas(list).forEach((p, i) => {
        if (this.personaVacia(p)) return;
        if (!this.personaCompleta(p)) {
          faltantes.push(
            `${titulo} #${i + 1}: completa nombre, CI, matrícula y celular, o deja la fila vacía`,
          );
          return;
        }
        completas += 1;
      });
      return completas;
    };

    const nExpositores = revisarFilas(
      this.normalizarPersonas(ficha.expositores),
      'Expositor defensa monografía',
    );
    const nRepresentantes = revisarFilas(
      this.normalizarPersonas(ficha.representantesTraje),
      'Representante traje típico',
    );

    if (nExpositores + nRepresentantes < 1) {
      faltantes.push(
        'Designa al menos 1 persona como expositor o como representante de traje (pueden ser la misma persona en ambos roles)',
      );
    }

    if (faltantes.length) {
      throw new BadRequestException(`Completa: ${faltantes.join('; ')}`);
    }
  }

  async generarMiPdf(idUsuario: number, res: Response) {
    await this.assertAccesoFichaAprobada(idUsuario);
    const usuario = await this.getDelegadoFraternidad(idUsuario);
    const ficha = await this.fichaRepo.findOne({
      where: { fraternidad: { idFraternidad: usuario.fraternidad.idFraternidad } },
      relations: ['fraternidad', 'gestion', 'actualizadoPor'],
    });
    if (!ficha) throw new NotFoundException('No hay ficha técnica. Guarda los datos primero.');
    if (ficha.estado === EstadoFichaTecnica.GENERADA && ficha.urlPdf) {
      return this.streamPdfFile(ficha, res);
    }

    const sol = await this.findSolicitudHerencia(usuario.fraternidad.idFraternidad);
    this.aplicarHerenciaForzada(
      ficha,
      this.herenciaDesdeSolicitud(usuario.fraternidad, sol),
    );
    await this.fichaRepo.save(ficha);

    this.validarCompleta(ficha);
    const gestion =
      ficha.gestion || (await findGestionActivaOrLatest(this.gestionRepo));
    const buffer = await this.buildPdfBuffer(ficha, gestion as Gestion);
    const dir = this.ensureUploadDir();
    const filename = `ficha-${ficha.fraternidad.idFraternidad}-${Date.now()}.pdf`;
    const filePath = join(dir, filename);
    fs.writeFileSync(filePath, buffer);

    this.deletePdfIfExists(ficha.urlPdf);
    ficha.urlPdf = `/uploads/Doc_Ficha_Tecnica/${filename}`;
    ficha.estado = EstadoFichaTecnica.GENERADA;
    ficha.fechaGeneracion = new Date();
    ficha.actualizadoPor = usuario;
    await this.fichaRepo.save(ficha);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="Ficha_Tecnica_${ficha.nombreFraternidad.replace(/[^\w\-]+/g, '_')}.pdf"`,
    );
    res.send(buffer);
  }

  async corregirMiFicha(idUsuario: number) {
    await this.assertAccesoFichaAprobada(idUsuario);
    const usuario = await this.getDelegadoFraternidad(idUsuario);
    const ficha = await this.fichaRepo.findOne({
      where: { fraternidad: { idFraternidad: usuario.fraternidad.idFraternidad } },
      relations: ['fraternidad', 'actualizadoPor'],
    });
    if (!ficha) throw new NotFoundException('No hay ficha técnica para corregir.');

    this.deletePdfIfExists(ficha.urlPdf);
    ficha.urlPdf = null;
    ficha.fechaGeneracion = null;
    ficha.estado = EstadoFichaTecnica.BORRADOR;
    ficha.actualizadoPor = usuario;
    await this.fichaRepo.save(ficha);
    return this.getMiFicha(idUsuario);
  }

  async listarAdmin(user: { rol: string }) {
    this.assertAdmin(user.rol);
    const gestion = await findGestionActivaOrLatest(this.gestionRepo);
    const where: any = {};
    if (gestion) where.gestion = { idGestion: (gestion as any).idGestion };

    const fichas = await this.fichaRepo.find({
      where,
      relations: ['fraternidad', 'actualizadoPor', 'gestion'],
      order: { updatedAt: 'DESC' },
    });

    return fichas.map((f) => this.toResponse(f));
  }

  async getAdminDetalle(user: { rol: string }, idFicha: number) {
    this.assertAdmin(user.rol);
    const ficha = await this.fichaRepo.findOne({
      where: { idFicha },
      relations: [
        'fraternidad',
        'fraternidad.facultad',
        'fraternidad.carrera',
        'fraternidad.institucionExterna',
        'fraternidad.categoria',
        'fraternidad.tipoDanza',
        'actualizadoPor',
        'gestion',
      ],
    });
    if (!ficha) throw new NotFoundException('Ficha no encontrada');
    const sol = ficha.fraternidad
      ? await this.findSolicitudHerencia(ficha.fraternidad.idFraternidad)
      : null;
    const herencia = ficha.fraternidad
      ? this.herenciaDesdeSolicitud(ficha.fraternidad, sol)
      : null;
    return this.toResponse(ficha, herencia);
  }

  async descargarAdmin(user: { rol: string }, idFicha: number, res: Response) {
    this.assertAdmin(user.rol);
    const ficha = await this.fichaRepo.findOne({
      where: { idFicha },
      relations: ['fraternidad', 'gestion'],
    });
    if (!ficha) throw new NotFoundException('Ficha no encontrada');
    if (ficha.estado !== EstadoFichaTecnica.GENERADA || !ficha.urlPdf) {
      throw new BadRequestException('Esta ficha aún no ha sido generada por el delegado.');
    }
    return this.streamPdfFile(ficha, res);
  }

  async descargarMiPdf(idUsuario: number, res: Response) {
    await this.assertAccesoFichaAprobada(idUsuario);
    const usuario = await this.getDelegadoFraternidad(idUsuario);
    const ficha = await this.fichaRepo.findOne({
      where: { fraternidad: { idFraternidad: usuario.fraternidad.idFraternidad } },
      relations: ['fraternidad'],
    });
    if (!ficha || ficha.estado !== EstadoFichaTecnica.GENERADA || !ficha.urlPdf) {
      throw new BadRequestException('Aún no hay una ficha generada. Completa y genera el PDF.');
    }
    return this.streamPdfFile(ficha, res);
  }

  private streamPdfFile(ficha: FichaTecnicaMonografia, res: Response) {
    const filename = ficha.urlPdf.split('/').pop();
    const filePath = join(process.cwd(), 'uploads', 'Doc_Ficha_Tecnica', filename);
    if (!fs.existsSync(filePath)) {
      throw new NotFoundException('El archivo PDF no se encuentra en el servidor.');
    }
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="Ficha_Tecnica_${(ficha.nombreFraternidad || 'fraternidad').replace(/[^\w\-]+/g, '_')}.pdf"`,
    );
    fs.createReadStream(filePath).pipe(res);
  }

  private buildPdfBuffer(ficha: FichaTecnicaMonografia, gestion: Gestion | null): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const PDFDocument = require('pdfkit');
        const doc = new PDFDocument({
          size: 'LETTER',
          margins: { top: 40, bottom: 50, left: 45, right: 45 },
        });
        const chunks: Buffer[] = [];
        doc.on('data', (c) => chunks.push(c));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        const pageWidth = 612;
        const margin = 45;
        const contentWidth = pageWidth - margin * 2;

        const edicion = gestion?.edicion
          ? `${String(gestion.edicion).toUpperCase()} ENTRADA FOLKLÓRICA UNIVERSITARIA ${gestion.anio || ''}`.trim()
          : `ENTRADA FOLKLÓRICA UNIVERSITARIA ${gestion?.anio || ''}`.trim();
        const lema = gestion?.lema || '';

        const logoPath = resolveLogoPath();
        const hasLogo = fs.existsSync(logoPath);
        if (hasLogo) {
          doc.image(logoPath, margin, 32, { width: 36 });
        }
        const hx = hasLogo ? margin + 48 : margin;
        doc
          .font('Helvetica-Bold')
          .fontSize(12)
          .fillColor(PDF_UMSA_BLUE)
          .text('UNIVERSIDAD MAYOR DE SAN ANDRÉS', hx, 36, { width: contentWidth - (hasLogo ? 48 : 0), align: 'center' });
        doc
          .font('Helvetica-Bold')
          .fontSize(9)
          .fillColor('#0f172a')
          .text('HONORABLE CONSEJO UNIVERSITARIO', hx, 52, { width: contentWidth - (hasLogo ? 48 : 0), align: 'center' });
        doc
          .font('Helvetica-Bold')
          .fontSize(9)
          .fillColor(PDF_UMSA_RED)
          .text(edicion, margin, 68, { width: contentWidth, align: 'center' });
        if (lema) {
          doc
            .font('Helvetica-Oblique')
            .fontSize(7.5)
            .fillColor('#475569')
            .text(`"${lema}"`, margin, 82, { width: contentWidth, align: 'center' });
        }
        doc
          .moveTo(margin, 98)
          .lineTo(margin + contentWidth, 98)
          .lineWidth(1.5)
          .strokeColor(PDF_UMSA_BLUE)
          .stroke();
        doc
          .moveTo(margin, 100.5)
          .lineTo(margin + contentWidth, 100.5)
          .lineWidth(0.75)
          .strokeColor(PDF_UMSA_RED)
          .stroke();

        let y = 112;
        doc
          .font('Helvetica-Bold')
          .fontSize(13)
          .fillColor(PDF_UMSA_BLUE)
          .text('FICHA TÉCNICA MONOGRAFÍA', margin, y, { width: contentWidth, align: 'center' });
        y = doc.y + 8;

        const ahora = new Date();
        const fechaGen = ahora.toLocaleString('es-BO', {
          day: '2-digit',
          month: 'long',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        });
        doc
          .font('Helvetica')
          .fontSize(8)
          .fillColor('#64748b')
          .text(`Reporte generado: ${fechaGen}`, margin, y, { width: contentWidth, align: 'right' });
        y = doc.y + 8;

        const drawFieldRow = (label: string, value: string, minH = 28) => {
          const labelW = 160;
          const valW = contentWidth - labelW;
          const labelH = doc.heightOfString(label, { width: labelW - 8 });
          const valueH = doc.heightOfString(value || '—', { width: valW - 8 });
          const rowH = Math.max(minH, labelH + 10, valueH + 10);

          if (y + rowH > 740) {
            doc.addPage();
            y = 50;
          }

          doc.rect(margin, y, contentWidth, rowH).strokeColor('#334155').lineWidth(0.6).stroke();
          doc
            .moveTo(margin + labelW, y)
            .lineTo(margin + labelW, y + rowH)
            .stroke();

          doc
            .font('Helvetica-Bold')
            .fontSize(7.5)
            .fillColor('#0f172a')
            .text(label, margin + 4, y + 5, { width: labelW - 8 });
          doc
            .font('Helvetica')
            .fontSize(8.5)
            .fillColor('#0f172a')
            .text(value || '—', margin + labelW + 4, y + 5, { width: valW - 8 });
          y += rowH;
        };

        drawFieldRow('NOMBRE DE LA FRATERNIDAD O TALLER CULTURAL', ficha.nombreFraternidad);
        drawFieldRow('CATEGORÍA', ficha.categoria || '');
        drawFieldRow('FACULTAD, CARRERA, OTROS A LA QUE PERTENECE', ficha.facultadCarrera || '');
        drawFieldRow('DANZA', ficha.danza || '');
        drawFieldRow('LUGAR DE ORIGEN DE LA DANZA', ficha.lugarOrigenDanza || '', 36);
        drawFieldRow('BREVE SINOPSIS DE LA DANZA', ficha.sinopsisDanza || '', 55);
        drawFieldRow('BREVE RESEÑA HISTÓRICA DE LA FRATERNIDAD', ficha.resenaHistorica || '', 55);
        drawFieldRow(
          'FECHA DE FUNDACIÓN DE LA FRATERNIDAD',
          ficha.fechaFundacion
            ? new Date(ficha.fechaFundacion + 'T12:00:00').toLocaleDateString('es-BO', {
                day: '2-digit',
                month: 'long',
                year: 'numeric',
              })
            : '',
        );
        drawFieldRow('FUNDADORES DE LA FRATERNIDAD', ficha.fundadores || '', 45);
        drawFieldRow('PREMIOS LOGRADOS DESDE LA FUNDACIÓN DE LA FRATERNIDAD', ficha.premios || '', 45);

        y += 10;
        const drawPersonTable = (titulo: string, personas: PersonaFicha[]) => {
          if (y > 620) {
            doc.addPage();
            y = 50;
          }
          doc
            .font('Helvetica-Bold')
            .fontSize(9)
            .fillColor(PDF_UMSA_RED)
            .text(titulo, margin, y, { width: contentWidth, align: 'center' });
          y = doc.y + 6;

          const cols = [
            { key: 'n', label: 'N°', w: 28 },
            { key: 'nombresApellidos', label: 'Nombre(s) y Apellidos', w: 180 },
            { key: 'ci', label: 'C. I.', w: 80 },
            { key: 'matricula', label: 'MATRICULA', w: 110 },
            { key: 'celular', label: 'Celular', w: contentWidth - 28 - 180 - 80 - 110 },
          ];

          const headerH = 18;
          doc.rect(margin, y, contentWidth, headerH).fillAndStroke('#e2e8f0', '#334155');
          let x = margin;
          cols.forEach((c) => {
            doc
              .font('Helvetica-Bold')
              .fontSize(7)
              .fillColor('#0f172a')
              .text(c.label, x + 3, y + 5, { width: c.w - 6 });
            x += c.w;
          });
          y += headerH;

          const rows = this.personasParaPdf(personas);
          rows.forEach((p, idx) => {
            const rowH = 22;
            doc.rect(margin, y, contentWidth, rowH).strokeColor('#334155').lineWidth(0.5).stroke();
            let cx = margin;
            const vals = [
              String(idx + 1),
              p.nombresApellidos || '',
              p.ci || '',
              p.matricula || '',
              p.celular || '',
            ];
            vals.forEach((v, i) => {
              doc
                .font('Helvetica')
                .fontSize(8)
                .fillColor('#0f172a')
                .text(v, cx + 3, y + 6, { width: cols[i].w - 6 });
              if (i < cols.length - 1) {
                doc
                  .moveTo(cx + cols[i].w, y)
                  .lineTo(cx + cols[i].w, y + rowH)
                  .strokeColor('#334155')
                  .stroke();
              }
              cx += cols[i].w;
            });
            y += rowH;
          });
          y += 12;
        };

        drawPersonTable('EXPOSITORES PARA LA DEFENSA DE MONOGRAFÍA', ficha.expositores);
        drawPersonTable('REPRESENTANTES PARA LA EXPOSICIÓN DE TRAJE TÍPICO', ficha.representantesTraje);

        // Espacio amplio entre última tabla y bloque de firma
        if (y > 600) {
          doc.addPage();
          y = 100;
        } else {
          y += 55;
        }

        const firmaX = margin + contentWidth / 2;
        // Espacio para firmar a mano → línea → nombre → cargo
        y += 28;
        doc
          .moveTo(firmaX - 120, y)
          .lineTo(firmaX + 120, y)
          .strokeColor('#0f172a')
          .lineWidth(0.8)
          .stroke();
        y += 8;
        const firmante = String(ficha.nombreFirmante || '').trim().toUpperCase();
        if (firmante) {
          doc
            .font('Helvetica-Bold')
            .fontSize(10)
            .fillColor('#0f172a')
            .text(firmante, margin, y, { width: contentWidth, align: 'center' });
          y = doc.y + 4;
        }
        doc
          .font('Helvetica-Bold')
          .fontSize(9)
          .fillColor('#0f172a')
          .text('Firma de Presidente o Delegado Titular', margin, y, {
            width: contentWidth,
            align: 'center',
          });
        y = doc.y + 3;
        doc
          .font('Helvetica')
          .fontSize(8)
          .fillColor('#475569')
          .text('Fraternidad o Taller Cultural', margin, y, { width: contentWidth, align: 'center' });
        y = doc.y + 3;
        doc
          .font('Helvetica-Bold')
          .fontSize(9)
          .fillColor(PDF_UMSA_BLUE)
          .text(ficha.nombreFraternidad || '', margin, y, { width: contentWidth, align: 'center' });

        doc.end();
      } catch (e) {
        reject(e);
      }
    });
  }
}
