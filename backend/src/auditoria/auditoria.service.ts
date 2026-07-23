import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Request } from 'express';
import { SesionUsuario } from '../entities/SesionUsuario';
import { AuditoriaAccion } from '../entities/AuditoriaAccion';
import { Gestion } from '../entities/Gestion';
import { findGestionActivaOrLatest } from '../common/gestion.utils';
import { Usuario } from '../entities/Usuario';

const SENSITIVE_KEYS = new Set([
  'password',
  'newpassword',
  'confirmpassword',
  'oldpassword',
  'accesstoken',
  'access_token',
  'resettoken',
  'reset_token',
  'token',
  'smtp_pass',
  'smtp_user',
]);

const GLOBAL_MODULES = new Set([
  'auth',
  'usuarios',
  'organizacion',
  'mail',
  'auditoria',
]);

const GESTION_SCOPED_MODULES = new Set([
  'evaluaciones',
  'fraternidades',
  'inscripciones',
  'asistencias',
  'participantes',
  'monografias',
]);

@Injectable()
export class AuditoriaService {
  constructor(
    @InjectRepository(SesionUsuario)
    private readonly sesionRepo: Repository<SesionUsuario>,
    @InjectRepository(AuditoriaAccion)
    private readonly accionRepo: Repository<AuditoriaAccion>,
    @InjectRepository(Gestion)
    private readonly gestionRepo: Repository<Gestion>,
    @InjectRepository(Usuario)
    private readonly usuarioRepo: Repository<Usuario>,
  ) {}

  async getGestionActiva(): Promise<Gestion | null> {
    return findGestionActivaOrLatest(this.gestionRepo);
  }

  async crearSesion(
    idUsuario: number,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<SesionUsuario> {
    // Cerrar sesiones huérfanas del mismo usuario (p.ej. cierre de pestaña sin logout)
    await this.sesionRepo
      .createQueryBuilder()
      .update()
      .set({ finSesion: new Date() })
      .where('id_usuario = :idUsuario', { idUsuario })
      .andWhere('fin_sesion IS NULL')
      .execute();

    const gestionActiva = await this.getGestionActiva();
    const sesion = this.sesionRepo.create({
      usuario: { idUsuario } as Usuario,
      gestion: gestionActiva ? ({ idGestion: gestionActiva.idGestion } as Gestion) : null,
      inicioSesion: new Date(),
      ipAddress: ipAddress || null,
      userAgent: userAgent || null,
    });
    return this.sesionRepo.save(sesion);
  }

  async cerrarSesion(idSesion: number): Promise<void> {
    const sesion = await this.sesionRepo.findOne({ where: { idSesion } });
    if (!sesion || sesion.finSesion) return;
    sesion.finSesion = new Date();
    await this.sesionRepo.save(sesion);
  }

  async cerrarSesionPorHeader(sessionIdHeader?: string): Promise<void> {
    const id = this.parseSessionId(sessionIdHeader);
    if (id) await this.cerrarSesion(id);
  }

  parseSessionId(header?: string | string[]): number | null {
    const raw = Array.isArray(header) ? header[0] : header;
    if (!raw) return null;
    const id = parseInt(raw, 10);
    return Number.isFinite(id) && id > 0 ? id : null;
  }

  private sanitizeBody(body: unknown): Record<string, unknown> | null {
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return null;
    }
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(body as Record<string, unknown>)) {
      if (SENSITIVE_KEYS.has(key.toLowerCase())) continue;
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        result[key] = this.sanitizeBody(value);
      } else if (typeof value !== 'string' || value.length <= 2000) {
        result[key] = value;
      } else {
        result[key] = '[contenido truncado]';
      }
    }
    return Object.keys(result).length ? result : null;
  }

  private extractModulo(path: string): string | null {
    const clean = path.replace(/^\/api\/v1\/?/, '').replace(/^\//, '');
    const segment = clean.split('/')[0];
    return segment || null;
  }

  private extractIdGestionFromRequest(req: Request): number | null {
    const header = req.headers['x-gestion-id'];
    const fromHeader = this.parseSessionId(header);
    if (fromHeader) return fromHeader;

    const sources = [
      req.params?.idGestion,
      req.params?.gestionId,
      req.query?.idGestion,
      req.query?.gestionId,
      (req.body as any)?.idGestion,
      (req.body as any)?.gestionId,
      (req.body as any)?.id_gestion,
    ];

    for (const src of sources) {
      const val = Array.isArray(src) ? src[0] : src;
      const id = parseInt(String(val ?? ''), 10);
      if (Number.isFinite(id) && id > 0) return id;
    }

    const pathMatch = req.path.match(/\/gestiones\/(\d+)/i);
    if (pathMatch) {
      const id = parseInt(pathMatch[1], 10);
      if (Number.isFinite(id)) return id;
    }

    return null;
  }

  private async resolveGestionForRequest(req: Request): Promise<Gestion | null> {
    const modulo = this.extractModulo(req.path);
    if (modulo && GLOBAL_MODULES.has(modulo)) {
      return null;
    }

    const explicitId = this.extractIdGestionFromRequest(req);
    if (explicitId) {
      return this.gestionRepo.findOne({ where: { idGestion: explicitId } });
    }

    if (modulo && GESTION_SCOPED_MODULES.has(modulo)) {
      return this.getGestionActiva();
    }

    return null;
  }

  private buildDescripcion(metodo: string, ruta: string, modulo: string | null): string {
    const verbo: Record<string, string> = {
      POST: 'Creó',
      PUT: 'Actualizó',
      PATCH: 'Modificó',
      DELETE: 'Eliminó',
    };
    const accion = verbo[metodo] || metodo;
    return `${accion} en ${modulo || 'sistema'}: ${ruta}`;
  }

  async registrarAccion(
    req: Request,
    statusCode: number,
    bodyOverride?: unknown,
  ): Promise<void> {
    const metodo = req.method.toUpperCase();
    if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(metodo)) return;

    const path = req.path || req.url?.split('?')[0] || '';
    if (path.includes('/auditoria')) return;

    const modulo = this.extractModulo(path);
    const user = (req as any).user;
    const idSesion = this.parseSessionId(req.headers['x-session-id']);
    const gestion = await this.resolveGestionForRequest(req);

    const body = bodyOverride !== undefined ? bodyOverride : req.body;
    const cuerpo = this.sanitizeBody(body);

    const accion = this.accionRepo.create({
      sesion: idSesion ? ({ idSesion } as SesionUsuario) : null,
      usuario: user?.idUsuario ? ({ idUsuario: user.idUsuario } as Usuario) : null,
      gestion: gestion ? ({ idGestion: gestion.idGestion } as Gestion) : null,
      metodo,
      ruta: path,
      modulo,
      descripcion: this.buildDescripcion(metodo, path, modulo),
      cuerpoSolicitud: cuerpo,
      codigoRespuesta: statusCode,
    });

    await this.accionRepo.save(accion);
  }

  async listarSesiones(filters: {
    idGestion?: number;
    soloGlobal?: boolean;
    idUsuario?: number;
    activas?: boolean;
    desde?: string;
    hasta?: string;
    page?: number;
    limit?: number;
  }) {
    const page = Math.max(1, filters.page || 1);
    const limit = Math.min(100, Math.max(1, filters.limit || 25));
    const skip = (page - 1) * limit;

    const qb = this.sesionRepo
      .createQueryBuilder('s')
      .leftJoinAndSelect('s.usuario', 'u')
      .leftJoinAndSelect('u.rol', 'rol')
      .leftJoinAndSelect('s.gestion', 'g')
      .orderBy('s.inicioSesion', 'DESC');

    if (filters.soloGlobal) {
      qb.andWhere('s.id_gestion IS NULL');
    } else if (filters.idGestion) {
      qb.andWhere('g.idGestion = :idGestion', { idGestion: filters.idGestion });
    }
    if (filters.idUsuario) {
      qb.andWhere('u.idUsuario = :idUsuario', { idUsuario: filters.idUsuario });
    }
    if (filters.activas) {
      qb.andWhere('s.finSesion IS NULL');
    }
    if (filters.desde) {
      qb.andWhere('s.inicioSesion >= :desde', { desde: filters.desde });
    }
    if (filters.hasta) {
      qb.andWhere('s.inicioSesion <= :hasta', { hasta: filters.hasta });
    }

    const [items, total] = await qb.skip(skip).take(limit).getManyAndCount();

    return {
      items: items.map((s) => this.mapSesion(s)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async listarAcciones(filters: {
    idGestion?: number;
    soloGlobal?: boolean;
    idUsuario?: number;
    modulo?: string;
    metodo?: string;
    desde?: string;
    hasta?: string;
    page?: number;
    limit?: number;
  }) {
    const page = Math.max(1, filters.page || 1);
    const limit = Math.min(100, Math.max(1, filters.limit || 25));
    const skip = (page - 1) * limit;

    const qb = this.accionRepo
      .createQueryBuilder('a')
      .leftJoinAndSelect('a.usuario', 'u')
      .leftJoinAndSelect('u.rol', 'rol')
      .leftJoinAndSelect('a.gestion', 'g')
      .leftJoinAndSelect('a.sesion', 's')
      .orderBy('a.createdAt', 'DESC');

    if (filters.soloGlobal) {
      qb.andWhere('a.id_gestion IS NULL');
    } else if (filters.idGestion) {
      qb.andWhere('g.idGestion = :idGestion', { idGestion: filters.idGestion });
    }
    if (filters.idUsuario) {
      qb.andWhere('u.idUsuario = :idUsuario', { idUsuario: filters.idUsuario });
    }
    if (filters.modulo) {
      qb.andWhere('a.modulo = :modulo', { modulo: filters.modulo });
    }
    if (filters.metodo) {
      qb.andWhere('a.metodo = :metodo', { metodo: filters.metodo.toUpperCase() });
    }
    if (filters.desde) {
      qb.andWhere('a.createdAt >= :desde', { desde: filters.desde });
    }
    if (filters.hasta) {
      qb.andWhere('a.createdAt <= :hasta', { hasta: filters.hasta });
    }

    const [items, total] = await qb.skip(skip).take(limit).getManyAndCount();

    return {
      items: items.map((a) => this.mapAccion(a)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getResumenPorGestion() {
    const gestiones = await this.gestionRepo.find({ order: { anio: 'DESC' } });

    const resumen = await Promise.all(
      gestiones.map(async (g) => {
        const sesiones = await this.sesionRepo.count({
          where: { gestion: { idGestion: g.idGestion } },
        });
        const acciones = await this.accionRepo.count({
          where: { gestion: { idGestion: g.idGestion } },
        });
        return {
          idGestion: g.idGestion,
          anio: g.anio,
          lema: g.lema,
          activa: g.activa,
          totalSesiones: sesiones,
          totalAcciones: acciones,
        };
      }),
    );

    const sinGestionSesiones = await this.sesionRepo
      .createQueryBuilder('s')
      .where('s.id_gestion IS NULL')
      .getCount();

    const sinGestionAcciones = await this.accionRepo
      .createQueryBuilder('a')
      .where('a.id_gestion IS NULL')
      .getCount();

    return {
      porGestion: resumen,
      global: {
        idGestion: null,
        anio: null,
        lema: 'Sistema global (usuarios, organización, correos)',
        activa: false,
        totalSesiones: sinGestionSesiones,
        totalAcciones: sinGestionAcciones,
      },
    };
  }

  private mapSesion(s: SesionUsuario) {
    const inicio = s.inicioSesion ? new Date(s.inicioSesion) : null;
    const fin = s.finSesion ? new Date(s.finSesion) : null;
    const duracionMs = inicio && fin ? fin.getTime() - inicio.getTime() : null;

    return {
      idSesion: s.idSesion,
      inicioSesion: s.inicioSesion,
      finSesion: s.finSesion,
      activa: !s.finSesion,
      duracionMinutos: duracionMs != null ? Math.round(duracionMs / 60000) : null,
      ipAddress: s.ipAddress,
      userAgent: s.userAgent,
      gestion: s.gestion
        ? { idGestion: s.gestion.idGestion, anio: s.gestion.anio, lema: s.gestion.lema }
        : null,
      usuario: s.usuario
        ? {
            idUsuario: s.usuario.idUsuario,
            ci: s.usuario.ci,
            nombres: s.usuario.nombres,
            primerApellido: s.usuario.primerApellido,
            rol: (s.usuario as any).rol?.nombre || null,
          }
        : null,
    };
  }

  private mapAccion(a: AuditoriaAccion) {
    return {
      idRegistro: a.idRegistro,
      metodo: a.metodo,
      ruta: a.ruta,
      modulo: a.modulo,
      descripcion: a.descripcion,
      cuerpoSolicitud: a.cuerpoSolicitud,
      codigoRespuesta: a.codigoRespuesta,
      createdAt: a.createdAt,
      idSesion: a.sesion?.idSesion || null,
      gestion: a.gestion
        ? { idGestion: a.gestion.idGestion, anio: a.gestion.anio }
        : null,
      usuario: a.usuario
        ? {
            idUsuario: a.usuario.idUsuario,
            ci: a.usuario.ci,
            nombres: a.usuario.nombres,
            primerApellido: a.usuario.primerApellido,
            rol: (a.usuario as any).rol?.nombre || null,
          }
        : null,
    };
  }
}
