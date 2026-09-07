import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  StreamableFile,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { createReadStream, existsSync, mkdirSync, unlinkSync } from 'fs';
import { join, extname } from 'path';
import * as ExcelJS from 'exceljs';
import { ListaNominaFraternidad } from '../entities/ListaNominaFraternidad';
import { Fraternidad } from '../entities/Fraternidad';
import { Usuario } from '../entities/Usuario';
import { Gestion } from '../entities/Gestion';
import { findGestionActivaOrLatest } from '../common/gestion.utils';

const UPLOAD_DIR = 'Doc_Nomina_Excel';
const MAX_PREVIEW_ROWS = 2000;

@Injectable()
export class ListasNominaService {
  constructor(
    @InjectRepository(ListaNominaFraternidad)
    private readonly listaRepo: Repository<ListaNominaFraternidad>,
    @InjectRepository(Fraternidad)
    private readonly fraternidadRepo: Repository<Fraternidad>,
    @InjectRepository(Usuario)
    private readonly usuarioRepo: Repository<Usuario>,
    @InjectRepository(Gestion)
    private readonly gestionRepo: Repository<Gestion>,
  ) {}

  static buildFilename(idFraternidad: number, originalname: string) {
    const ext = extname(originalname || '').toLowerCase() || '.xlsx';
    return `nomina_frat_${idFraternidad}_${Date.now()}${ext}`;
  }

  private ensureUploadDir(): string {
    const dir = join(process.cwd(), 'uploads', UPLOAD_DIR);
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    return dir;
  }

  private absolutePathFromUrl(urlArchivo: string): string | null {
    if (!urlArchivo?.startsWith(`/uploads/${UPLOAD_DIR}/`)) return null;
    const filename = urlArchivo.replace(`/uploads/${UPLOAD_DIR}/`, '');
    return join(process.cwd(), 'uploads', UPLOAD_DIR, filename);
  }

  private deleteFileIfExists(urlArchivo: string) {
    const filePath = this.absolutePathFromUrl(urlArchivo);
    if (filePath && existsSync(filePath)) unlinkSync(filePath);
  }

  private toResponse(lista: ListaNominaFraternidad) {
    return {
      idLista: lista.idLista,
      idFraternidad: lista.fraternidad?.idFraternidad ?? null,
      nombreFraternidad: lista.fraternidad?.nombre ?? null,
      categoria: lista.fraternidad?.categoria?.nombre ?? null,
      idGestion: lista.gestion?.idGestion ?? null,
      gestionAnio: lista.gestion?.anio ?? null,
      nombreOriginal: lista.nombreOriginal,
      urlArchivo: lista.urlArchivo,
      mimeType: lista.mimeType,
      tamanoBytes: lista.tamanoBytes != null ? Number(lista.tamanoBytes) : null,
      createdAt: lista.createdAt,
      updatedAt: lista.updatedAt,
      subidoPor: lista.subidoPor
        ? {
            idUsuario: lista.subidoPor.idUsuario,
            nombres: [lista.subidoPor.nombres, lista.subidoPor.primerApellido]
              .filter(Boolean)
              .join(' '),
            ci: lista.subidoPor.ci,
          }
        : null,
    };
  }

  private async getDelegadoConFraternidad(idUsuario: number) {
    const usuario = await this.usuarioRepo.findOne({
      where: { idUsuario },
      relations: ['fraternidad', 'fraternidad.gestion', 'rol'],
    });
    if (!usuario) throw new NotFoundException('Usuario no encontrado');
    if (String(usuario.rol?.nombre || '').toLowerCase() !== 'delegado') {
      throw new ForbiddenException('Solo los delegados pueden gestionar la nómina de su fraternidad.');
    }
    if (!usuario.fraternidad?.idFraternidad) {
      throw new BadRequestException(
        'No tienes una fraternidad asignada. Completa tu inscripción antes de subir la nómina.',
      );
    }
    return usuario;
  }

  private async resolveGestion(frat: Fraternidad): Promise<Gestion> {
    if (frat.gestion?.idGestion) return frat.gestion;
    const gestion = await findGestionActivaOrLatest(this.gestionRepo);
    if (!gestion) throw new BadRequestException('No hay gestión activa.');
    return gestion;
  }

  async getMi(idUsuario: number) {
    const usuario = await this.getDelegadoConFraternidad(idUsuario);
    const frat = usuario.fraternidad;
    const gestion = await this.resolveGestion(frat);
    const lista = await this.listaRepo.findOne({
      where: {
        fraternidad: { idFraternidad: frat.idFraternidad },
        gestion: { idGestion: gestion.idGestion },
      },
      relations: ['fraternidad', 'fraternidad.categoria', 'gestion', 'subidoPor'],
    });
    return {
      fraternidad: {
        idFraternidad: frat.idFraternidad,
        nombre: frat.nombre,
      },
      gestion: { idGestion: gestion.idGestion, anio: gestion.anio },
      lista: lista ? this.toResponse(lista) : null,
    };
  }

  async uploadMi(idUsuario: number, file: Express.Multer.File) {
    if (!file) throw new BadRequestException('Archivo requerido.');
    const usuario = await this.getDelegadoConFraternidad(idUsuario);
    const frat = await this.fraternidadRepo.findOne({
      where: { idFraternidad: usuario.fraternidad.idFraternidad },
      relations: ['gestion', 'categoria'],
    });
    if (!frat) throw new NotFoundException('Fraternidad no encontrada');
    const gestion = await this.resolveGestion(frat);

    this.ensureUploadDir();
    const urlArchivo = `/uploads/${UPLOAD_DIR}/${file.filename}`;

    let lista = await this.listaRepo.findOne({
      where: {
        fraternidad: { idFraternidad: frat.idFraternidad },
        gestion: { idGestion: gestion.idGestion },
      },
      relations: ['fraternidad', 'fraternidad.categoria', 'gestion', 'subidoPor'],
    });

    if (lista) {
      if (lista.urlArchivo !== urlArchivo) {
        this.deleteFileIfExists(lista.urlArchivo);
      }
      lista.nombreOriginal = file.originalname;
      lista.urlArchivo = urlArchivo;
      lista.mimeType = file.mimetype || null;
      lista.tamanoBytes = file.size || null;
      lista.subidoPor = usuario;
    } else {
      lista = this.listaRepo.create({
        fraternidad: frat,
        gestion,
        nombreOriginal: file.originalname,
        urlArchivo,
        mimeType: file.mimetype || null,
        tamanoBytes: file.size || null,
        subidoPor: usuario,
      });
    }

    const saved = await this.listaRepo.save(lista);
    const full = await this.listaRepo.findOne({
      where: { idLista: saved.idLista },
      relations: ['fraternidad', 'fraternidad.categoria', 'gestion', 'subidoPor'],
    });
    return this.toResponse(full!);
  }

  async deleteMi(idUsuario: number) {
    const usuario = await this.getDelegadoConFraternidad(idUsuario);
    const frat = usuario.fraternidad;
    const gestion = await this.resolveGestion(frat);
    const lista = await this.listaRepo.findOne({
      where: {
        fraternidad: { idFraternidad: frat.idFraternidad },
        gestion: { idGestion: gestion.idGestion },
      },
    });
    if (!lista) throw new NotFoundException('No hay nómina cargada.');
    this.deleteFileIfExists(lista.urlArchivo);
    await this.listaRepo.delete(lista.idLista);
    return { ok: true };
  }

  async listarAdmin() {
    const gestion = await findGestionActivaOrLatest(this.gestionRepo);
    const fraternidades = await this.fraternidadRepo.find({
      where: {
        habilitadoEfu: true,
        ...(gestion ? { gestion: { idGestion: gestion.idGestion } } : {}),
      },
      relations: ['categoria', 'gestion'],
      order: { nombre: 'ASC' },
    });

    const listas = gestion
      ? await this.listaRepo.find({
          where: { gestion: { idGestion: gestion.idGestion } },
          relations: ['fraternidad', 'fraternidad.categoria', 'gestion', 'subidoPor'],
        })
      : [];
    const byFrat = new Map(listas.map((l) => [l.fraternidad?.idFraternidad, l]));

    return {
      gestion: gestion
        ? { idGestion: gestion.idGestion, anio: gestion.anio }
        : null,
      items: fraternidades.map((f) => {
        const lista = byFrat.get(f.idFraternidad);
        return {
          idFraternidad: f.idFraternidad,
          nombreFraternidad: f.nombre,
          categoria: f.categoria?.nombre || null,
          tieneArchivo: !!lista,
          lista: lista ? this.toResponse(lista) : null,
        };
      }),
    };
  }

  private async findListaOrFail(idLista: number) {
    const lista = await this.listaRepo.findOne({
      where: { idLista },
      relations: ['fraternidad', 'fraternidad.categoria', 'gestion', 'subidoPor'],
    });
    if (!lista) throw new NotFoundException('Nómina no encontrada');
    return lista;
  }

  async preview(idLista: number) {
    const lista = await this.findListaOrFail(idLista);
    const filePath = this.absolutePathFromUrl(lista.urlArchivo);
    if (!filePath || !existsSync(filePath)) {
      throw new NotFoundException('El archivo no está disponible en el servidor.');
    }

    const ext = extname(lista.nombreOriginal || lista.urlArchivo).toLowerCase();
    if (ext === '.xls') {
      throw new BadRequestException(
        'El visor soporta .xlsx. Descarga el archivo .xls o vuelve a subirlo como .xlsx.',
      );
    }

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(filePath);
    const sheet = workbook.worksheets[0];
    if (!sheet) {
      return {
        ...this.toResponse(lista),
        hoja: null,
        headers: [],
        rows: [],
        totalFilas: 0,
        truncado: false,
      };
    }

    const matrix: any[][] = [];
    sheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
      if (rowNumber > MAX_PREVIEW_ROWS + 1) return;
      const values = row.values as any[];
      // exceljs: values[0] is unused; 1-based
      const cells = values.slice(1).map((v) => {
        if (v == null) return '';
        if (typeof v === 'object' && v.text != null) return String(v.text);
        if (typeof v === 'object' && v.result != null) return String(v.result);
        if (v instanceof Date) return v.toLocaleDateString('es-BO');
        return String(v);
      });
      matrix.push(cells);
    });

    const truncado = sheet.rowCount > MAX_PREVIEW_ROWS + 1;
    const headers = matrix[0] || [];
    const rows = matrix.slice(1);
    const colCount = Math.max(headers.length, ...rows.map((r) => r.length), 0);
    const normalize = (arr: string[]) => {
      const next = [...arr];
      while (next.length < colCount) next.push('');
      return next.slice(0, colCount);
    };

    return {
      ...this.toResponse(lista),
      hoja: sheet.name,
      headers: normalize(headers.map(String)),
      rows: rows.map((r) => normalize(r.map(String))),
      totalFilas: rows.length,
      truncado,
    };
  }

  async streamArchivo(idLista: number): Promise<{ file: StreamableFile; filename: string; mime: string }> {
    const lista = await this.findListaOrFail(idLista);
    const filePath = this.absolutePathFromUrl(lista.urlArchivo);
    if (!filePath || !existsSync(filePath)) {
      throw new NotFoundException('El archivo no está disponible en el servidor.');
    }
    const mime =
      lista.mimeType ||
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    return {
      file: new StreamableFile(createReadStream(filePath)),
      filename: lista.nombreOriginal || `nomina_${lista.idLista}.xlsx`,
      mime,
    };
  }

  /** Delegado puede descargar solo la de su fraternidad. */
  async streamMiArchivo(idUsuario: number) {
    const wrap = await this.getMi(idUsuario);
    if (!wrap.lista?.idLista) throw new NotFoundException('No hay nómina cargada.');
    return this.streamArchivo(wrap.lista.idLista);
  }

  async deleteAdmin(idLista: number) {
    const lista = await this.findListaOrFail(idLista);
    this.deleteFileIfExists(lista.urlArchivo);
    await this.listaRepo.delete(lista.idLista);
    return { ok: true };
  }
}
