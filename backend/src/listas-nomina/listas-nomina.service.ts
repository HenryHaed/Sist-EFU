import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  StreamableFile,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { createHmac, randomBytes } from 'crypto';
import { createReadStream, existsSync, mkdirSync, unlinkSync } from 'fs';
import { join, extname } from 'path';
import * as ExcelJS from 'exceljs';
import { ListaNominaFraternidad } from '../entities/ListaNominaFraternidad';
import { MiembroNomina } from '../entities/MiembroNomina';
import { Fraternidad } from '../entities/Fraternidad';
import { Usuario } from '../entities/Usuario';
import { Gestion } from '../entities/Gestion';
import { findGestionActivaOrLatest } from '../common/gestion.utils';

const UPLOAD_DIR = 'Doc_Nomina_Excel';
const MAX_PREVIEW_ROWS = 2000;
const MAX_MIEMBROS = 2000;
/** Filas editables precreadas (no se permiten insertar filas nuevas en la hoja protegida). */
const PLANTILLA_FILAS_VACIAS = 80;
const SHEET_PASSWORD = 'EFU-NOMINA-UMSA';
const META_SHEET = '_EFU_META';
const UMSA_BLUE = 'FF003399';
const UMSA_RED = 'FFC8102E';
const HEADER_ROW = 6;
const DATA_START = 7;

/** Encabezados de datos (Fraternidad y Tipo de danza van solo en la cabecera). */
export const NOMINA_HEADERS = [
  'Nombre',
  'Primer Apellido',
  'Segundo Apellido',
  'CI',
  'Tipo de Persona',
  'Número de celular',
  'Registro Universitario',
] as const;

const COL_COUNT = NOMINA_HEADERS.length;

/** Valores mostrados en el Excel (lista desplegable). */
export const TIPOS_PERSONA_LABELS = [
  'Estudiante',
  'Docente',
  'Administrativo',
  'Externo',
] as const;

export type TipoPersonaNomina = 'ESTUDIANTE' | 'DOCENTE' | 'ADMINISTRATIVO' | 'EXTERNO';

const TIPO_PERSONA_MAP: Record<string, TipoPersonaNomina> = {
  estudiante: 'ESTUDIANTE',
  docente: 'DOCENTE',
  administrativo: 'ADMINISTRATIVO',
  externo: 'EXTERNO',
};

const TIPO_PERSONA_LABEL: Record<TipoPersonaNomina, string> = {
  ESTUDIANTE: 'Estudiante',
  DOCENTE: 'Docente',
  ADMINISTRATIVO: 'Administrativo',
  EXTERNO: 'Externo',
};

@Injectable()
export class ListasNominaService {
  constructor(
    @InjectRepository(ListaNominaFraternidad)
    private readonly listaRepo: Repository<ListaNominaFraternidad>,
    @InjectRepository(MiembroNomina)
    private readonly miembroRepo: Repository<MiembroNomina>,
    @InjectRepository(Fraternidad)
    private readonly fraternidadRepo: Repository<Fraternidad>,
    @InjectRepository(Usuario)
    private readonly usuarioRepo: Repository<Usuario>,
    @InjectRepository(Gestion)
    private readonly gestionRepo: Repository<Gestion>,
    private readonly dataSource: DataSource,
    private readonly configService: ConfigService,
  ) {}

  static buildFilename(idFraternidad: number, originalname: string) {
    const ext = extname(originalname || '').toLowerCase() || '.xlsx';
    return `nomina_frat_${idFraternidad || 'x'}_${Date.now()}${ext}`;
  }

  private nominaSecret(): string {
    return (
      this.configService.get<string>('NOMINA_TOKEN_SECRET') ||
      this.configService.get<string>('JWT_SECRET') ||
      'efu_secret_key'
    );
  }

  private buildPlantillaToken(idFraternidad: number, idGestion: number) {
    const issuedAt = new Date().toISOString();
    const nonce = randomBytes(8).toString('hex');
    const payload = `${idFraternidad}|${idGestion}|${issuedAt}|${nonce}`;
    const sig = createHmac('sha256', this.nominaSecret()).update(payload).digest('hex').slice(0, 24);
    const plantillaId = `EFU-${idFraternidad}-${idGestion}-${sig}`;
    return { plantillaId, issuedAt, nonce };
  }

  private verifyPlantillaToken(
    plantillaId: string,
    idFraternidad: number,
    idGestion: number,
    issuedAt: string,
    nonce: string,
  ): boolean {
    if (!plantillaId || !issuedAt || !nonce) return false;
    const payload = `${idFraternidad}|${idGestion}|${issuedAt}|${nonce}`;
    const sig = createHmac('sha256', this.nominaSecret()).update(payload).digest('hex').slice(0, 24);
    return plantillaId === `EFU-${idFraternidad}-${idGestion}-${sig}`;
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

  private cellText(v: any): string {
    if (v == null) return '';
    if (typeof v === 'object' && v.text != null) return String(v.text).trim();
    if (typeof v === 'object' && v.result != null) return String(v.result).trim();
    if (v instanceof Date) return v.toLocaleDateString('es-BO');
    return String(v).trim();
  }

  private normalizeHeader(h: string): string {
    return String(h || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private normalizeCi(ci: string): string {
    // Solo dígitos: quita espacios, puntos y guiones de formato; letras no se aceptan
    return String(ci || '')
      .replace(/[\s.\-_/]/g, '')
      .trim();
  }

  /** CI solo dígitos (regla de planilla y de importación). */
  private isCiSoloNumeros(ci: string): boolean {
    return /^\d{4,15}$/.test(ci);
  }

  private normalizeCelular(v: string): string | null {
    const digits = String(v || '').replace(/[^\d]/g, '');
    return digits || null;
  }

  private isCelularOk(cel: string | null): boolean {
    if (!cel) return false;
    return /^\d{7,15}$/.test(cel);
  }

  private isRegistroUniversitarioOk(ru: string | null): boolean {
    if (!ru) return false;
    return ru.length >= 3 && ru.length <= 40;
  }

  private normalizeTipoPersona(raw: string): TipoPersonaNomina | null {
    const n = this.normalizeHeader(raw);
    return TIPO_PERSONA_MAP[n] || null;
  }

  private labelTipoPersona(tipo: string | null | undefined): string {
    const t = String(tipo || '').toUpperCase() as TipoPersonaNomina;
    return TIPO_PERSONA_LABEL[t] || tipo || '—';
  }

  private assertVentanaNomina(gestion: Gestion) {
    const inicio = gestion.nominaExcelInicio ? new Date(gestion.nominaExcelInicio) : null;
    const fin = gestion.nominaExcelFin ? new Date(gestion.nominaExcelFin) : null;
    if (!inicio || !fin) {
      throw new BadRequestException(
        'La carga de nómina Excel no está habilitada. El administrador debe definir el periodo de subida en Ajustes.',
      );
    }
    const now = new Date();
    if (now < inicio) {
      throw new BadRequestException(
        `La carga de nómina aún no inicia (abre el ${inicio.toLocaleString('es-BO')}).`,
      );
    }
    if (now > fin) {
      throw new BadRequestException(
        `El periodo de carga de nómina ya cerró (cerró el ${fin.toLocaleString('es-BO')}).`,
      );
    }
  }

  private ventanaNominaInfo(gestion: Gestion) {
    const inicio = gestion.nominaExcelInicio ? new Date(gestion.nominaExcelInicio) : null;
    const fin = gestion.nominaExcelFin ? new Date(gestion.nominaExcelFin) : null;
    const now = new Date();
    const abierta = !!(inicio && fin && now >= inicio && now <= fin);
    return {
      inicio: inicio?.toISOString() || null,
      fin: fin?.toISOString() || null,
      abierta,
      mensaje: !inicio || !fin
        ? 'El administrador aún no habilitó el periodo de subida.'
        : now < inicio
          ? `La carga abre el ${inicio.toLocaleString('es-BO')}.`
          : now > fin
            ? `La carga cerró el ${fin.toLocaleString('es-BO')}.`
            : `Puedes subir hasta el ${fin.toLocaleString('es-BO')}.`,
    };
  }

  private toResponse(lista: ListaNominaFraternidad, extras: Record<string, any> = {}) {
    return {
      idLista: lista.idLista,
      idFraternidad: lista.fraternidad?.idFraternidad ?? null,
      nombreFraternidad: lista.fraternidad?.nombre ?? null,
      categoria: lista.fraternidad?.categoria?.nombre ?? null,
      tipoDanza: (lista.fraternidad as any)?.tipoDanza?.nombre ?? null,
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
      ...extras,
    };
  }

  private toMiembroResponse(m: MiembroNomina) {
    return {
      idMiembro: m.idMiembro,
      nombres: m.nombres,
      apellidoPaterno: m.apellidoPaterno,
      apellidoMaterno: m.apellidoMaterno,
      primerApellido: m.apellidoPaterno,
      segundoApellido: m.apellidoMaterno,
      ci: m.ci,
      tipoPersona: m.tipoPersona || 'ESTUDIANTE',
      tipoPersonaLabel: this.labelTipoPersona(m.tipoPersona),
      celular: m.celular,
      registroUniversitario: m.registroUniversitario,
      tipoDanza: m.tipoDanza,
      nombreFraternidad: m.fraternidad?.nombre ?? null,
      createdAt: m.createdAt,
    };
  }

  private async getDelegadoConFraternidad(idUsuario: number) {
    const usuario = await this.usuarioRepo.findOne({
      where: { idUsuario },
      relations: [
        'fraternidad',
        'fraternidad.gestion',
        'fraternidad.tipoDanza',
        'fraternidad.categoria',
        'rol',
      ],
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

  private async countMiembros(idLista: number): Promise<number> {
    return this.miembroRepo.count({ where: { lista: { idLista } } });
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
      relations: [
        'fraternidad',
        'fraternidad.categoria',
        'fraternidad.tipoDanza',
        'gestion',
        'subidoPor',
      ],
    });
    const cantidadMiembros = lista ? await this.countMiembros(lista.idLista) : 0;
    const ventana = this.ventanaNominaInfo(gestion);
    return {
      fraternidad: {
        idFraternidad: frat.idFraternidad,
        nombre: frat.nombre,
        tipoDanza: frat.tipoDanza?.nombre || null,
        categoria: frat.categoria?.nombre || null,
      },
      gestion: { idGestion: gestion.idGestion, anio: gestion.anio },
      lista: lista ? this.toResponse(lista, { cantidadMiembros }) : null,
      cantidadMiembros,
      ventanaNomina: ventana,
    };
  }

  async generarPlantillaMi(idUsuario: number): Promise<{ buffer: Buffer; filename: string }> {
    const usuario = await this.getDelegadoConFraternidad(idUsuario);
    const frat = usuario.fraternidad;
    const gestion = await this.resolveGestion(frat);
    this.assertVentanaNomina(gestion);
    const nombreFrat = frat.nombre || 'Fraternidad';
    const tipoDanza = frat.tipoDanza?.nombre || '—';
    const anio = gestion.anio;
    const { plantillaId, issuedAt, nonce } = this.buildPlantillaToken(
      frat.idFraternidad,
      gestion.idGestion,
    );
    const lastCol = String.fromCharCode(64 + COL_COUNT);

    // Si ya hay fraternos registrados, la plantilla se descarga prellenada
    const listaExistente = await this.listaRepo.findOne({
      where: {
        fraternidad: { idFraternidad: frat.idFraternidad },
        gestion: { idGestion: gestion.idGestion },
      },
    });
    const miembrosExistentes = listaExistente
      ? await this.miembroRepo.find({
          where: { lista: { idLista: listaExistente.idLista } },
          order: { apellidoPaterno: 'ASC', nombres: 'ASC' },
        })
      : [];

    const wb = new ExcelJS.Workbook();
    wb.creator = 'Sistema EFU — UMSA';
    wb.company = 'Universidad Mayor de San Andrés';
    wb.created = new Date();
    wb.modified = new Date();
    (wb as any).keywords = `EFU,nomina,${plantillaId}`;
    (wb as any).description = `Planilla oficial EFU ${plantillaId}`;

    const meta = wb.addWorksheet(META_SHEET);
    meta.state = 'veryHidden';
    meta.getCell('A1').value = 'EFU_NOMINA_V4';
    meta.getCell('A2').value = frat.idFraternidad;
    meta.getCell('A3').value = gestion.idGestion;
    meta.getCell('A4').value = plantillaId;
    meta.getCell('A5').value = issuedAt;
    meta.getCell('A6').value = nonce;
    await meta.protect(SHEET_PASSWORD, {
      selectLockedCells: false,
      selectUnlockedCells: false,
    });

    const ws = wb.addWorksheet('Nómina', {
      views: [{ state: 'frozen', ySplit: HEADER_ROW }],
      properties: { defaultRowHeight: 18 },
    });

    ws.columns = [
      { key: 'nombres', width: 22 },
      { key: 'ap1', width: 16 },
      { key: 'ap2', width: 16 },
      { key: 'ci', width: 12 },
      { key: 'tipoPersona', width: 16 },
      { key: 'celular', width: 14 },
      { key: 'ru', width: 16 },
    ];

    ws.mergeCells(`A1:${lastCol}1`);
    ws.getCell('A1').value = 'UNIVERSIDAD MAYOR DE SAN ANDRÉS';
    ws.getCell('A1').font = { bold: true, size: 14, color: { argb: UMSA_BLUE }, name: 'Calibri' };
    ws.getCell('A1').alignment = { horizontal: 'center', vertical: 'middle' };
    ws.getRow(1).height = 24;

    ws.mergeCells(`A2:${lastCol}2`);
    ws.getCell('A2').value = 'COMISIÓN ORGANIZADORA DE LA ENTRADA UNIVERSITARIA';
    ws.getCell('A2').font = { size: 10, color: { argb: 'FF0F172A' }, name: 'Calibri' };
    ws.getCell('A2').alignment = { horizontal: 'center' };

    ws.mergeCells(`A3:${lastCol}3`);
    ws.getCell('A3').value = `PLANILLA DE NÓMINA DE FRATERNOS${anio ? ` · GESTIÓN ${anio}` : ''}`;
    ws.getCell('A3').font = { bold: true, size: 11, color: { argb: UMSA_RED }, name: 'Calibri' };
    ws.getCell('A3').alignment = { horizontal: 'center' };
    ws.getRow(3).border = { bottom: { style: 'medium', color: { argb: UMSA_BLUE } } };
    ws.getRow(4).border = { top: { style: 'thin', color: { argb: UMSA_RED } } };

    ws.mergeCells('A4:D4');
    ws.getCell('A4').value = `Fraternidad: ${nombreFrat}`;
    ws.getCell('A4').font = { bold: true, size: 10, color: { argb: 'FF0F172A' } };

    ws.mergeCells(`E4:${lastCol}4`);
    ws.getCell('E4').value = `Tipo de danza: ${tipoDanza}`;
    ws.getCell('E4').font = { bold: true, size: 10, color: { argb: 'FF0F172A' } };
    ws.getCell('E4').alignment = { horizontal: 'right' };

    ws.mergeCells(`A5:${lastCol}5`);
    ws.getCell('A5').value = miembrosExistentes.length
      ? `ID: ${plantillaId}  ·  ${miembrosExistentes.length} registro(s) prellenado(s)  ·  Filas CONTINUAS  ·  CI solo números  ·  RU obligatorio SOLO si Tipo = Estudiante`
      : `ID: ${plantillaId}  ·  Filas CONTINUAS  ·  CI SOLO NÚMEROS  ·  Obligatorios: Nombre, Primer Apellido, CI, Tipo de Persona, Celular  ·  RU solo si Estudiante  ·  Opcional: Segundo Apellido`;
    ws.getCell('A5').font = { italic: true, size: 8, color: { argb: 'FF64748B' } };

    NOMINA_HEADERS.forEach((h, i) => {
      const cell = ws.getCell(HEADER_ROW, i + 1);
      cell.value = h;
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 9, name: 'Calibri' };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: UMSA_BLUE } };
      cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
      cell.border = {
        top: { style: 'thin', color: { argb: UMSA_RED } },
        bottom: { style: 'thin', color: { argb: UMSA_RED } },
        left: { style: 'thin', color: { argb: 'FF94A3B8' } },
        right: { style: 'thin', color: { argb: 'FF94A3B8' } },
      };
    });
    ws.getRow(HEADER_ROW).height = 28;

    const filasVaciasExtra = PLANTILLA_FILAS_VACIAS;
    const totalFilasDatos = Math.max(miembrosExistentes.length + filasVaciasExtra, filasVaciasExtra);
    const dataEnd = DATA_START + totalFilasDatos - 1;

    for (let r = DATA_START; r <= dataEnd; r++) {
      const idx = r - DATA_START;
      const m = miembrosExistentes[idx];
      const zebra = idx % 2 === 0;
      const values = m
        ? [
            m.nombres,
            m.apellidoPaterno,
            m.apellidoMaterno || '',
            m.ci,
            this.labelTipoPersona(m.tipoPersona),
            m.celular || '',
            m.registroUniversitario || '',
          ]
        : null;

      for (let c = 1; c <= COL_COUNT; c++) {
        const cell = ws.getCell(r, c);
        cell.protection = { locked: false };
        if (values) cell.value = values[c - 1];
        cell.border = {
          top: { style: 'hair', color: { argb: 'FFE2E8F0' } },
          bottom: { style: 'hair', color: { argb: 'FFE2E8F0' } },
          left: { style: 'hair', color: { argb: 'FFE2E8F0' } },
          right: { style: 'hair', color: { argb: 'FFE2E8F0' } },
        };
        if (m) {
          // Filas ya registradas: fondo suave para distinguirlas
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFECFDF5' } };
        } else if (zebra) {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };
        }
      }
    }

    const validations = (ws as any).dataValidations;
    if (validations?.add) {
      validations.add(`D${DATA_START}:D${dataEnd}`, {
        type: 'whole',
        operator: 'greaterThanOrEqual',
        formulae: [0],
        allowBlank: true,
        showErrorMessage: true,
        showInputMessage: true,
        promptTitle: 'CI (solo números)',
        prompt: 'Solo dígitos. Sin letras ni símbolos.',
        errorTitle: 'CI inválido',
        error: 'El CI debe contener solo números.',
      });
      validations.add(`E${DATA_START}:E${dataEnd}`, {
        type: 'list',
        allowBlank: true,
        formulae: [`"${TIPOS_PERSONA_LABELS.join(',')}"`],
        showErrorMessage: true,
        showInputMessage: true,
        promptTitle: 'Tipo de Persona',
        prompt: 'Elija: Estudiante, Docente, Administrativo o Externo.',
        errorTitle: 'Tipo inválido',
        error: 'Seleccione un valor de la lista desplegable.',
      });
      validations.add(`F${DATA_START}:F${dataEnd}`, {
        type: 'whole',
        operator: 'greaterThanOrEqual',
        formulae: [0],
        allowBlank: true,
        showErrorMessage: true,
        promptTitle: 'Celular',
        prompt: 'Solo números.',
        errorTitle: 'Celular inválido',
        error: 'El celular debe contener solo dígitos.',
      });
    }

    for (let r = 1; r <= HEADER_ROW; r++) {
      for (let c = 1; c <= COL_COUNT; c++) {
        ws.getCell(r, c).protection = { locked: true };
      }
    }

    await ws.protect(SHEET_PASSWORD, {
      selectLockedCells: true,
      selectUnlockedCells: true,
      formatCells: false,
      formatColumns: false,
      formatRows: false,
      insertColumns: false,
      insertRows: false,
      deleteColumns: false,
      deleteRows: false,
      sort: false,
      autoFilter: false,
      pivotTables: false,
    });

    const ws2 = wb.addWorksheet('Instrucciones');
    ws2.getColumn(1).width = 95;
    const lines = [
      'PLANILLA OFICIAL DE NÓMINA — ENTRADA FOLCLÓRICA UNIVERSITARIA (UMSA)',
      '',
      `Identificador de planilla: ${plantillaId}`,
      `Fraternidad: ${nombreFrat} (dato heredado del sistema; no constituye una columna editable)`,
      `Tipo de danza: ${tipoDanza} (dato heredado del sistema; no constituye una columna editable)`,
      '',
      '══════════════════════════════════════════════════════════════════════',
      'CÓMO COMPLETAR ESTA PLANILLA (PASO A PASO)',
      '══════════════════════════════════════════════════════════════════════',
      '',
      '1) Utilice únicamente esta planilla oficial descargada desde el sistema.',
      '2) Registre a cada persona en una fila, de arriba hacia abajo, SIN dejar filas en blanco',
      '   entre registros. Ejemplo incorrecto: llenar 25 filas, saltar 3 vacías y continuar.',
      '   Ejemplo correcto: fila 1, 2, 3, 4… en secuencia continua.',
      '3) Campos OBLIGATORIOS en cada fila: Nombre, Primer Apellido, CI, Tipo de Persona',
      '   y Número de celular.',
      '4) Tipo de Persona: use la LISTA DESPLEGABLE (Estudiante, Docente, Administrativo, Externo).',
      '5) Registro Universitario: OBLIGATORIO solo si Tipo de Persona = Estudiante.',
      '   Si el tipo es Docente, Administrativo o Externo, puede dejar RU vacío.',
      '6) Campo OPCIONAL siempre: Segundo Apellido.',
      '7) El CI debe contener SOLO números (sin letras ni símbolos).',
      '8) El número de celular debe contener SOLO dígitos.',
      '9) No inserte columnas ni filas nuevas; use las filas ya preparadas en la hoja.',
      '10) Guarde el archivo y cárguelo en el sistema dentro del periodo habilitado.',
      '',
      '══════════════════════════════════════════════════════════════════════',
      'REGLAS DE CARGA Y SEGURIDAD DE DATOS',
      '══════════════════════════════════════════════════════════════════════',
      '',
      '• Si pierde esta planilla, descargue una nueva desde el sistema.',
      '• Si ya existen registros, la nueva descarga vendrá prellenada (filas en verde).',
      '• Al volver a subir, el sistema SOLO agrega fraternos con CI nuevo.',
      '• No se eliminan registros previos aunque suba un archivo con menos datos o vacío.',
      '• Si no aporta CIs nuevos, la carga será rechazada.',
      '• Los fraternos registrados NO reciben usuario ni acceso al sistema.',
      miembrosExistentes.length
        ? `• Esta descarga incluye ${miembrosExistentes.length} registro(s) ya existente(s) en el sistema.`
        : '',
    ].filter(Boolean);
    lines.forEach((t, i) => {
      const r = ws2.getRow(i + 1);
      r.getCell(1).value = t;
      if (i === 0) r.font = { bold: true, size: 12, color: { argb: UMSA_BLUE } };
      if (t.startsWith('Identificador')) r.font = { bold: true, size: 10, color: { argb: UMSA_RED } };
      if (t.includes('CÓMO COMPLETAR') || t.includes('REGLAS DE CARGA')) {
        r.font = { bold: true, size: 10, color: { argb: UMSA_BLUE } };
      }
    });
    await ws2.protect(SHEET_PASSWORD, {
      selectLockedCells: true,
      selectUnlockedCells: false,
      insertColumns: false,
      insertRows: false,
      deleteColumns: false,
      deleteRows: false,
    });

    const buffer = Buffer.from(await wb.xlsx.writeBuffer());
    const safeName = nombreFrat
      .replace(/[^\w\-áéíóúñÁÉÍÓÚÑ ]+/gi, '')
      .replace(/\s+/g, '_')
      .slice(0, 40);
    return {
      buffer,
      filename: `Plantilla_Nomina_${safeName || 'Fraternidad'}.xlsx`,
    };
  }

  private readMetaFromWorkbook(workbook: ExcelJS.Workbook) {
    const meta = workbook.getWorksheet(META_SHEET);
    if (!meta) return null;
    const ver = this.cellText(meta.getCell('A1').value);
    if (ver !== 'EFU_NOMINA_V2' && ver !== 'EFU_NOMINA_V3' && ver !== 'EFU_NOMINA_V4') return null;
    const idFraternidad = Number(meta.getCell('A2').value);
    const idGestion = Number(meta.getCell('A3').value);
    const plantillaId = this.cellText(meta.getCell('A4').value);
    const issuedAt = this.cellText(meta.getCell('A5').value);
    const nonce = this.cellText(meta.getCell('A6').value);
    if (!Number.isFinite(idFraternidad) || !Number.isFinite(idGestion) || !plantillaId) return null;
    return { idFraternidad, idGestion, plantillaId, issuedAt, nonce };
  }

  private findHeaderRow(sheet: ExcelJS.Worksheet) {
    const aliases: Record<string, string[]> = {
      nombres: ['nombre', 'nombres', 'nombre completo'],
      apellidoPaterno: ['primer apellido', 'apellido paterno', 'ap paterno', 'apellido_paterno'],
      apellidoMaterno: ['segundo apellido', 'apellido materno', 'ap materno', 'apellido_materno'],
      ci: ['ci', 'carnet', 'cedula', 'cédula', 'documento'],
      tipoPersona: [
        'tipo de persona',
        'tipo persona',
        'tipo',
        'categoria persona',
        'categoría persona',
      ],
      celular: [
        'numero de celular',
        'número de celular',
        'celular',
        'telefono',
        'teléfono',
        'movil',
        'móvil',
        'whatsapp',
      ],
      registroUniversitario: [
        'registro universitario',
        'ru',
        'registro',
        'nro registro',
        'numero de registro',
      ],
    };

    let found: { rowNumber: number; mapIdx: Record<string, number> } | null = null;
    sheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
      if (found || rowNumber > 20) return;
      const mapIdx: Record<string, number> = {};
      row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
        const n = this.normalizeHeader(this.cellText(cell.value));
        for (const [key, list] of Object.entries(aliases)) {
          if (list.includes(n)) mapIdx[key] = colNumber - 1;
        }
      });
      if (mapIdx.nombres != null && mapIdx.apellidoPaterno != null && mapIdx.ci != null) {
        found = { rowNumber, mapIdx };
      }
    });
    return found;
  }

  private async parseMiembrosDesdeArchivo(
    filePath: string,
    frat: Fraternidad,
    gestion: Gestion,
  ) {
    if (extname(filePath).toLowerCase() === '.xls') {
      throw new BadRequestException(
        'Para importar use la plantilla oficial .xlsx descargada del sistema.',
      );
    }

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(filePath);

    const meta = this.readMetaFromWorkbook(workbook);
    if (!meta) {
      throw new BadRequestException(
        'Planilla no válida o alterada: falta el identificador único. Descargue de nuevo la plantilla oficial.',
      );
    }
    if (meta.idFraternidad !== frat.idFraternidad) {
      throw new BadRequestException(
        'Esta planilla pertenece a otra fraternidad. Descargue la de su fraternidad.',
      );
    }
    if (meta.idGestion !== gestion.idGestion) {
      throw new BadRequestException(
        'Esta planilla es de otra gestión. Descargue la plantilla actualizada.',
      );
    }
    if (
      !this.verifyPlantillaToken(
        meta.plantillaId,
        meta.idFraternidad,
        meta.idGestion,
        meta.issuedAt,
        meta.nonce,
      )
    ) {
      throw new BadRequestException(
        'El identificador de la planilla no es válido (archivo alterado). Descargue la plantilla del sistema.',
      );
    }

    const sheet =
      workbook.getWorksheet('Nómina') ||
      workbook.worksheets.find((s) => s.name !== META_SHEET && s.state !== 'veryHidden') ||
      workbook.worksheets[0];
    if (!sheet) throw new BadRequestException('El Excel no tiene la hoja de nómina.');

    const header = this.findHeaderRow(sheet);
    if (!header) {
      throw new BadRequestException(
        `No se encontraron los encabezados. Use la plantilla oficial (${NOMINA_HEADERS.join(', ')}).`,
      );
    }
    if (header.mapIdx.tipoPersona == null) {
      throw new BadRequestException(
        'La planilla no incluye la columna «Tipo de Persona». Descargue de nuevo la plantilla oficial actualizada.',
      );
    }

    const tipoDanzaFrat = frat.tipoDanza?.nombre || null;
    const rows: Array<{
      nombres: string;
      apellidoPaterno: string;
      apellidoMaterno: string | null;
      ci: string;
      tipoPersona: TipoPersonaNomina;
      celular: string | null;
      registroUniversitario: string | null;
      tipoDanza: string | null;
    }> = [];
    const cisVistos = new Set<string>();
    const errores: string[] = [];
    const filasConDatos: number[] = [];
    let huboFilaVaciaTrasDatos = false;
    let filaHuecoEjemplo: number | null = null;

    const maxRow = Math.min(
      Math.max(Number(sheet.rowCount) || 0, header.rowNumber + 1),
      header.rowNumber + MAX_MIEMBROS + 100,
    );
    for (let rowNumber = header.rowNumber + 1; rowNumber <= maxRow; rowNumber++) {
      if (rows.length >= MAX_MIEMBROS) break;

      const row = sheet.getRow(rowNumber);
      const get = (key: string) => {
        const idx = header.mapIdx[key];
        if (idx == null) return '';
        return this.cellText(row.getCell(idx + 1).value);
      };

      const nombres = get('nombres');
      const apellidoPaterno = get('apellidoPaterno');
      const apellidoMaterno = get('apellidoMaterno') || null;
      const ciRaw = get('ci');
      const ci = this.normalizeCi(ciRaw);
      const tipoPersonaRaw = get('tipoPersona');
      const celular = this.normalizeCelular(get('celular'));
      const registroUniversitarioRaw = get('registroUniversitario').trim() || null;

      const filaVacia =
        !nombres &&
        !apellidoPaterno &&
        !ci &&
        !apellidoMaterno &&
        !tipoPersonaRaw &&
        !celular &&
        !registroUniversitarioRaw;

      if (filaVacia) {
        if (filasConDatos.length > 0) {
          huboFilaVaciaTrasDatos = true;
          if (filaHuecoEjemplo == null) filaHuecoEjemplo = rowNumber;
        }
        continue;
      }

      // Hay datos después de una o más filas vacías intermedias → no permitido
      if (huboFilaVaciaTrasDatos) {
        errores.push(
          `No se permiten filas vacías intercaladas. Hay espacio(s) vacío(s) (p. ej. fila ${filaHuecoEjemplo}) ` +
            `antes de la fila ${rowNumber}. Complete las filas de forma continua, sin saltos.`,
        );
        break;
      }

      if (!nombres || !apellidoPaterno || !ci) {
        errores.push(
          `Fila ${rowNumber}: faltan Nombre, Primer Apellido o CI (solo el Segundo Apellido es opcional).`,
        );
        continue;
      }

      const tipoPersona = this.normalizeTipoPersona(tipoPersonaRaw);
      if (!tipoPersona) {
        errores.push(
          `Fila ${rowNumber}: Tipo de Persona obligatorio. Use la lista: Estudiante, Docente, Administrativo o Externo.` +
            (tipoPersonaRaw ? ` Valor: "${tipoPersonaRaw}".` : ''),
        );
        continue;
      }

      if (!celular) {
        errores.push(`Fila ${rowNumber}: el Número de celular es obligatorio.`);
        continue;
      }
      if (!this.isCiSoloNumeros(ci)) {
        errores.push(
          `Fila ${rowNumber}: el CI debe contener únicamente números (sin letras ni símbolos). Valor: "${ciRaw}".`,
        );
        continue;
      }
      if (!this.isCelularOk(celular)) {
        errores.push(
          `Fila ${rowNumber}: el número de celular no es válido (solo dígitos, entre 7 y 15).`,
        );
        continue;
      }

      let registroUniversitario: string | null = null;
      if (tipoPersona === 'ESTUDIANTE') {
        if (!registroUniversitarioRaw || !this.isRegistroUniversitarioOk(registroUniversitarioRaw)) {
          errores.push(
            `Fila ${rowNumber}: el Registro Universitario es obligatorio e inválido cuando Tipo de Persona = Estudiante.`,
          );
          continue;
        }
        registroUniversitario = registroUniversitarioRaw;
      } else {
        // Docente / Administrativo / Externo: RU opcional; se guarda null si viene vacío
        registroUniversitario = null;
      }

      if (cisVistos.has(ci)) {
        errores.push(`Fila ${rowNumber}: el CI ${ci} está duplicado en la planilla.`);
        continue;
      }
      cisVistos.add(ci);
      filasConDatos.push(rowNumber);

      rows.push({
        nombres,
        apellidoPaterno,
        apellidoMaterno,
        ci,
        tipoPersona,
        celular,
        registroUniversitario,
        tipoDanza: tipoDanzaFrat,
      });
    }

    // Verificación adicional: las filas con datos deben ser consecutivas
    if (filasConDatos.length > 1) {
      const primera = filasConDatos[0];
      const ultima = filasConDatos[filasConDatos.length - 1];
      if (ultima - primera + 1 !== filasConDatos.length) {
        errores.push(
          'Las filas de fraternos deben completarse de forma continua (sin dejar filas en blanco entre registros).',
        );
      }
    }

    if (errores.length) {
      throw new BadRequestException(
        `No se pudo importar:\n• ${errores.slice(0, 8).join('\n• ')}` +
          (errores.length > 8 ? `\n… y ${errores.length - 8} más.` : ''),
      );
    }
    if (!rows.length) {
      throw new BadRequestException(
        'No hay filas de fraternos. Complete Nombre, Primer Apellido, CI, Tipo de Persona y Número de celular de forma continua.',
      );
    }
    return rows;
  }

  async uploadMi(idUsuario: number, file: Express.Multer.File) {
    if (!file) throw new BadRequestException('Archivo requerido.');
    const usuario = await this.getDelegadoConFraternidad(idUsuario);
    const frat = await this.fraternidadRepo.findOne({
      where: { idFraternidad: usuario.fraternidad.idFraternidad },
      relations: ['gestion', 'categoria', 'tipoDanza'],
    });
    if (!frat) throw new NotFoundException('Fraternidad no encontrada');
    const gestion = await this.resolveGestion(frat);
    this.assertVentanaNomina(gestion);

    const filePath = file.path;
    if (!filePath || !existsSync(filePath)) {
      throw new BadRequestException('No se pudo leer el archivo subido.');
    }

    let parsed: Awaited<ReturnType<typeof this.parseMiembrosDesdeArchivo>>;
    try {
      parsed = await this.parseMiembrosDesdeArchivo(filePath, frat, gestion);
    } catch (e) {
      try {
        unlinkSync(filePath);
      } catch {
        /* ignore */
      }
      throw e;
    }

    this.ensureUploadDir();
    const urlArchivo = `/uploads/${UPLOAD_DIR}/${file.filename}`;
    const qr = this.dataSource.createQueryRunner();
    await qr.connect();
    await qr.startTransaction();
    try {
      let lista = await qr.manager.findOne(ListaNominaFraternidad, {
        where: {
          fraternidad: { idFraternidad: frat.idFraternidad },
          gestion: { idGestion: gestion.idGestion },
        },
        relations: ['fraternidad', 'gestion'],
      });

      const existentes = lista
        ? await qr.manager.find(MiembroNomina, {
            where: { lista: { idLista: lista.idLista } },
            select: ['ci'],
          })
        : [];
      const cisExistentes = new Set(existentes.map((m) => this.normalizeCi(m.ci)));

      // Escaneo fila por fila: solo CIs que aún no están en BD
      const nuevos = parsed.filter((r) => !cisExistentes.has(r.ci));
      const yaRegistrados = parsed.length - nuevos.length;

      if (!nuevos.length) {
        throw new BadRequestException(
          lista
            ? `No hay fraternos nuevos para agregar. Los ${parsed.length} CI del Excel ya están registrados. No se reemplaza ni se borra la nómina existente.`
            : 'No se pudo registrar: el archivo no aportó fraternos nuevos.',
        );
      }

      if (lista) {
        // Conservar archivo previo como respaldo; actualizar metadata del último envío
        if (lista.urlArchivo !== urlArchivo) this.deleteFileIfExists(lista.urlArchivo);
        lista.nombreOriginal = file.originalname;
        lista.urlArchivo = urlArchivo;
        lista.mimeType = file.mimetype || null;
        lista.tamanoBytes = file.size || null;
        lista.subidoPor = usuario;
        await qr.manager.save(lista);
        // NUNCA borrar miembros existentes
      } else {
        lista = qr.manager.create(ListaNominaFraternidad, {
          fraternidad: frat,
          gestion,
          nombreOriginal: file.originalname,
          urlArchivo,
          mimeType: file.mimetype || null,
          tamanoBytes: file.size || null,
          subidoPor: usuario,
        });
        lista = await qr.manager.save(lista);
      }

      const entities = nuevos.map((r) =>
        qr.manager.create(MiembroNomina, {
          lista,
          fraternidad: frat,
          gestion,
          nombres: r.nombres,
          apellidoPaterno: r.apellidoPaterno,
          apellidoMaterno: r.apellidoMaterno,
          ci: r.ci,
          tipoPersona: r.tipoPersona,
          correo: null,
          celular: r.celular,
          registroUniversitario: r.registroUniversitario,
          tipoDanza: r.tipoDanza,
        }),
      );
      await qr.manager.save(entities);
      await qr.commitTransaction();

      const total = await this.countMiembros(lista.idLista);
      const full = await this.listaRepo.findOne({
        where: { idLista: lista.idLista },
        relations: [
          'fraternidad',
          'fraternidad.categoria',
          'fraternidad.tipoDanza',
          'gestion',
          'subidoPor',
        ],
      });
      return this.toResponse(full!, {
        cantidadMiembros: total,
        agregados: entities.length,
        yaRegistrados,
        plantillaValidada: true,
        mergeSeguro: true,
      });
    } catch (e) {
      await qr.rollbackTransaction();
      try {
        unlinkSync(filePath);
      } catch {
        /* ignore */
      }
      throw e;
    } finally {
      await qr.release();
    }
  }

  async getMiembrosMi(idUsuario: number) {
    const wrap = await this.getMi(idUsuario);
    if (!wrap.lista?.idLista) return { ...wrap, miembros: [] };
    const miembros = await this.miembroRepo.find({
      where: { lista: { idLista: wrap.lista.idLista } },
      relations: ['fraternidad'],
      order: { apellidoPaterno: 'ASC', nombres: 'ASC' },
    });
    return { ...wrap, miembros: miembros.map((m) => this.toMiembroResponse(m)) };
  }

  async getMiembrosAdmin(idLista: number) {
    const lista = await this.findListaOrFail(idLista);
    const miembros = await this.miembroRepo.find({
      where: { lista: { idLista } },
      relations: ['fraternidad'],
      order: { apellidoPaterno: 'ASC', nombres: 'ASC' },
    });
    return {
      lista: this.toResponse(lista, { cantidadMiembros: miembros.length }),
      miembros: miembros.map((m) => this.toMiembroResponse(m)),
    };
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
      relations: ['categoria', 'gestion', 'tipoDanza'],
      order: { nombre: 'ASC' },
    });

    const listas = gestion
      ? await this.listaRepo.find({
          where: { gestion: { idGestion: gestion.idGestion } },
          relations: [
            'fraternidad',
            'fraternidad.categoria',
            'fraternidad.tipoDanza',
            'gestion',
            'subidoPor',
          ],
        })
      : [];
    const byFrat = new Map(listas.map((l) => [l.fraternidad?.idFraternidad, l]));
    const counts =
      listas.length > 0
        ? await this.miembroRepo
            .createQueryBuilder('m')
            .select('m.id_lista', 'idLista')
            .addSelect('COUNT(*)', 'cnt')
            .where('m.id_lista IN (:...ids)', { ids: listas.map((l) => l.idLista) })
            .groupBy('m.id_lista')
            .getRawMany()
        : [];
    const countByLista = new Map(counts.map((c) => [Number(c.idLista), Number(c.cnt)]));

    return {
      gestion: gestion ? { idGestion: gestion.idGestion, anio: gestion.anio } : null,
      items: fraternidades.map((f) => {
        const lista = byFrat.get(f.idFraternidad);
        const cantidadMiembros = lista ? countByLista.get(lista.idLista) || 0 : 0;
        return {
          idFraternidad: f.idFraternidad,
          nombreFraternidad: f.nombre,
          categoria: f.categoria?.nombre || null,
          tipoDanza: f.tipoDanza?.nombre || null,
          tieneArchivo: !!lista,
          cantidadMiembros,
          lista: lista ? this.toResponse(lista, { cantidadMiembros }) : null,
        };
      }),
    };
  }

  private async findListaOrFail(idLista: number) {
    const lista = await this.listaRepo.findOne({
      where: { idLista },
      relations: [
        'fraternidad',
        'fraternidad.categoria',
        'fraternidad.tipoDanza',
        'gestion',
        'subidoPor',
      ],
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
    if (extname(lista.nombreOriginal || lista.urlArchivo).toLowerCase() === '.xls') {
      throw new BadRequestException('El visor soporta .xlsx.');
    }

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(filePath);
    const sheet =
      workbook.getWorksheet('Nómina') ||
      workbook.worksheets.find((s) => s.name !== META_SHEET) ||
      workbook.worksheets[0];
    if (!sheet) {
      return { ...this.toResponse(lista), hoja: null, headers: [], rows: [], totalFilas: 0, truncado: false };
    }

    const matrix: any[][] = [];
    sheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
      if (rowNumber > MAX_PREVIEW_ROWS + 1) return;
      const values = row.values as any[];
      matrix.push(values.slice(1).map((v) => this.cellText(v)));
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

  async streamArchivo(idLista: number) {
    const lista = await this.findListaOrFail(idLista);
    const filePath = this.absolutePathFromUrl(lista.urlArchivo);
    if (!filePath || !existsSync(filePath)) {
      throw new NotFoundException('El archivo no está disponible en el servidor.');
    }
    return {
      file: new StreamableFile(createReadStream(filePath)),
      filename: lista.nombreOriginal || `nomina_${lista.idLista}.xlsx`,
      mime:
        lista.mimeType ||
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    };
  }

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
