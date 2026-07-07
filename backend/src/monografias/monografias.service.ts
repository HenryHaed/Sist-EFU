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

@Injectable()
export class MonografiasService {
  constructor(
    @InjectRepository(Monografia)
    private readonly monografiaRepo: Repository<Monografia>,
    @InjectRepository(Fraternidad)
    private readonly fraternidadRepo: Repository<Fraternidad>,
    @InjectRepository(Usuario)
    private readonly usuarioRepo: Repository<Usuario>,
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

  async getByFraternidad(
    idFraternidad: number,
    user: { rol: string },
  ) {
    const rol = user.rol?.toLowerCase();
    if (!['superusuario', 'admin', 'jurado'].includes(rol)) {
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
