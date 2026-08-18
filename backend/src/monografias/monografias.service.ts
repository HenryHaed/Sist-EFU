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
import { Monografia } from '../entities/Monografia';
import { Fraternidad } from '../entities/Fraternidad';
import { Usuario } from '../entities/Usuario';
import { Gestion } from '../entities/Gestion';
import { findGestionActivaOrLatest } from '../common/gestion.utils';
import { CronogramaActividad } from '../entities/CronogramaActividad';
import { estadoVentanaCronograma } from '../common/cronograma-actividad';

@Injectable()
export class MonografiasService {
  constructor(
    @InjectRepository(Monografia)
    private readonly monografiaRepo: Repository<Monografia>,
    @InjectRepository(Fraternidad)
    private readonly fraternidadRepo: Repository<Fraternidad>,
    @InjectRepository(Usuario)
    private readonly usuarioRepo: Repository<Usuario>,
    @InjectRepository(Gestion)
    private readonly gestionRepo: Repository<Gestion>,
    @InjectRepository(CronogramaActividad)
    private readonly cronogramaActividadRepo: Repository<CronogramaActividad>,
  ) {}

  private ensureUploadDir(): string {
    const dir = join(process.cwd(), 'uploads', 'Doc_Monografia');
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    return dir;
  }

  private deleteFileIfExists(urlArchivo: string) {
    if (!urlArchivo?.startsWith('/uploads/Doc_Monografia/')) return;
    const filename = urlArchivo.replace('/uploads/Doc_Monografia/', '');
    const filePath = join(process.cwd(), 'uploads', 'Doc_Monografia', filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }

  private toResponse(monografia: Monografia) {
    return {
      idMonografia: monografia.idMonografia,
      idFraternidad: monografia.fraternidad?.idFraternidad,
      nombreFraternidad: monografia.fraternidad?.nombre,
      urlArchivo: monografia.urlArchivo,
      nombreArchivo: monografia.nombreArchivo,
      fechaSubida: monografia.fechaSubida,
      subidoPor: monografia.subidoPor
        ? {
            idUsuario: monografia.subidoPor.idUsuario,
            nombres: monografia.subidoPor.nombres,
            ci: monografia.subidoPor.ci,
          }
        : null,
    };
  }

  async getMiMonografia(user: { idUsuario: number; rol: string; fraternidad?: { idFraternidad: number } | null }) {
    if (user.rol?.toLowerCase() !== 'delegado') {
      throw new ForbiddenException('Solo los delegados pueden acceder a su monografía.');
    }
    if (!user.fraternidad?.idFraternidad) {
      return null;
    }
    const monografia = await this.monografiaRepo.findOne({
      where: { fraternidad: { idFraternidad: user.fraternidad.idFraternidad } },
      relations: ['fraternidad', 'subidoPor'],
    });
    return monografia ? this.toResponse(monografia) : null;
  }

  private async resolverGestionIdFraternidad(idFraternidad: number): Promise<number | null> {
    const frat = await this.fraternidadRepo.findOne({
      where: { idFraternidad },
      relations: ['gestion'],
    });
    if (frat?.gestion?.idGestion) return frat.gestion.idGestion;
    const gestion = await findGestionActivaOrLatest(this.gestionRepo);
    return gestion?.idGestion ?? null;
  }

  async getEstadoCronogramaMonografia(idFraternidad?: number | null) {
    const idGestion = idFraternidad
      ? await this.resolverGestionIdFraternidad(idFraternidad)
      : (await findGestionActivaOrLatest(this.gestionRepo))?.idGestion;
    if (!idGestion) {
      return estadoVentanaCronograma('MONOGRAFIA', null, null);
    }
    const row = await this.cronogramaActividadRepo.findOne({
      where: { gestion: { idGestion }, tipo: 'MONOGRAFIA' },
    });
    return estadoVentanaCronograma('MONOGRAFIA', row?.fechaInicio, row?.fechaFin);
  }

  private async assertCronogramaMonografiaAbierto(idFraternidad: number) {
    const estado = await this.getEstadoCronogramaMonografia(idFraternidad);
    if (!estado.abierto) {
      throw new BadRequestException(estado.mensaje || 'No está en el cronograma respectivo.');
    }
  }

  /**
   * Listado de fraternidades de la gestión activa con estado de monografía.
   * Solo lectura — usado por veedores (y admin/superusuario).
   */
  async listadoFraternidadesConMonografia(user: { rol: string }) {
    const rol = user.rol?.toLowerCase();
    if (!['superusuario', 'admin', 'veedor'].includes(rol)) {
      throw new ForbiddenException('No tienes permiso para ver este listado.');
    }

    const gestion = await findGestionActivaOrLatest(this.gestionRepo);
    const fraternidades = await this.fraternidadRepo.find({
      where: {
        habilitadoEfu: true,
        ...(gestion ? { gestion: { idGestion: gestion.idGestion } } : {}),
      },
      relations: ['facultad', 'carrera', 'categoria', 'tipoDanza', 'institucionExterna'],
      order: { nombre: 'ASC' },
    });

    const monografias = await this.monografiaRepo.find({
      relations: ['fraternidad', 'subidoPor'],
    });
    const monoByFrat = new Map(
      monografias.map((m) => [m.fraternidad?.idFraternidad, m]),
    );

    return fraternidades.map((f) => {
      const mono = monoByFrat.get(f.idFraternidad);
      return {
        idFraternidad: f.idFraternidad,
        nombre: f.nombre,
        categoria: f.categoria?.nombre || null,
        tipoDanza: f.tipoDanza?.nombre || null,
        facultad: f.facultad?.nombre || null,
        carrera: f.carrera?.nombre || null,
        institucionExterna: f.institucionExterna?.nombre || null,
        tieneMonografia: !!mono,
        monografia: mono ? this.toResponse(mono) : null,
      };
    });
  }

  async getByFraternidad(
    idFraternidad: number,
    user: { rol: string },
  ) {
    const rol = user.rol?.toLowerCase();
    if (!['superusuario', 'admin', 'jurado', 'veedor'].includes(rol)) {
      throw new ForbiddenException('No tienes permiso para ver esta monografía.');
    }

    const fraternidad = await this.fraternidadRepo.findOne({ where: { idFraternidad } });
    if (!fraternidad) {
      throw new NotFoundException('Fraternidad no encontrada.');
    }

    const monografia = await this.monografiaRepo.findOne({
      where: { fraternidad: { idFraternidad } },
      relations: ['fraternidad', 'subidoPor'],
    });

    if (!monografia) {
      throw new NotFoundException('Esta fraternidad aún no ha subido su monografía.');
    }

    return this.toResponse(monografia);
  }

  async uploadMonografia(
    user: { idUsuario: number; rol: string; fraternidad?: { idFraternidad: number } | null },
    file: Express.Multer.File,
  ) {
    if (user.rol?.toLowerCase() !== 'delegado') {
      throw new ForbiddenException('Solo los delegados pueden subir monografías.');
    }
    if (!user.fraternidad?.idFraternidad) {
      throw new BadRequestException('No tienes una fraternidad asignada.');
    }
    if (!file) {
      throw new BadRequestException('Debe adjuntar un archivo PDF.');
    }

    const idFraternidad = user.fraternidad.idFraternidad;
    const fraternidad = await this.fraternidadRepo.findOne({ where: { idFraternidad } });
    if (!fraternidad) {
      throw new NotFoundException('Fraternidad no encontrada.');
    }

    await this.assertCronogramaMonografiaAbierto(idFraternidad);

    this.ensureUploadDir();

    const delegado = await this.usuarioRepo.findOne({ where: { idUsuario: user.idUsuario } });
    const urlArchivo = `/uploads/Doc_Monografia/${file.filename}`;

    let monografia = await this.monografiaRepo.findOne({
      where: { fraternidad: { idFraternidad } },
      relations: ['fraternidad', 'subidoPor'],
    });

    if (monografia) {
      this.deleteFileIfExists(monografia.urlArchivo);
      monografia.urlArchivo = urlArchivo;
      monografia.nombreArchivo = file.originalname;
      monografia.subidoPor = delegado!;
    } else {
      monografia = this.monografiaRepo.create({
        fraternidad,
        urlArchivo,
        nombreArchivo: file.originalname,
        subidoPor: delegado!,
      });
    }

    const saved = await this.monografiaRepo.save(monografia);
    const full = await this.monografiaRepo.findOne({
      where: { idMonografia: saved.idMonografia },
      relations: ['fraternidad', 'subidoPor'],
    });

    return this.toResponse(full!);
  }

  static buildFilename(idFraternidad: number, originalname: string): string {
    const ext = originalname.toLowerCase().endsWith('.pdf') ? '.pdf' : '.pdf';
    return `monografia-${idFraternidad}-${Date.now()}${ext}`;
  }
}
