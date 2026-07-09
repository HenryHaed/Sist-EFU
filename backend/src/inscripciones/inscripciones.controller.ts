import { Controller, Post, Get, Put, Body, Param, Query, UseInterceptors, UploadedFiles, UseGuards, Request, ParseIntPipe, BadRequestException } from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import * as fs from 'fs';
import { InscripcionesService } from './inscripciones.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

const storage = diskStorage({
  destination: (req, file, cb) => {
    const path = join(process.cwd(), 'uploads', 'Docs_Registro');
    if (!fs.existsSync(path)) {
      fs.mkdirSync(path, { recursive: true });
    }
    cb(null, path);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `${file.fieldname}-${uniqueSuffix}${extname(file.originalname)}`);
  },
});

const PERSONA_PREFIXES = [
  'Presi', 'Vice', 'SecGen', 'SecHaci', 'SecActas', 'SecPrensa',
  'Vocal', 'DelCogob', 'DelTitular', 'DelSuplente',
];
const DOC_FILE_PREFIXES = ['ci', 'matricula', 'sinDeudasFraternidad', 'sinDeudasAreas'];

const PERSONA_DOC_FILE_FIELDS = PERSONA_PREFIXES.flatMap((prefix) =>
  DOC_FILE_PREFIXES.map((doc) => ({ name: `${doc}${prefix}`, maxCount: 1 })),
);

const INSTITUCIONAL_FILE_FIELDS = [
  { name: 'cartaCompromiso', maxCount: 1 },
  { name: 'resolucion', maxCount: 1 },
  { name: 'actaDirectiva', maxCount: 1 },
];

@Controller('inscripciones')
@UseGuards(JwtAuthGuard, RolesGuard)
export class InscripcionesController {
  constructor(private readonly inscripcionesService: InscripcionesService) {}

  @Post()
  @Roles('delegado', 'superusuario', 'admin')
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        ...PERSONA_DOC_FILE_FIELDS,
        ...INSTITUCIONAL_FILE_FIELDS,
      ],
      {
        storage,
        fileFilter: (req, file, cb) => {
          if (!file.originalname.match(/\.pdf$/i)) {
            return cb(new BadRequestException('Solo se permiten archivos PDF.'), false);
          }
          cb(null, true);
        },
        limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
      },
    ),
  )
  async submitSolicitud(@Body() body: any, @UploadedFiles() files: any, @Request() req: any) {
    // Parsear data si viene como string JSON (común en FormData)
    const data = typeof body.data === 'string' ? JSON.parse(body.data) : body;
    return this.inscripcionesService.createSolicitud(data, req.user, files);
  }

  @Get('verificar-ci-directiva')
  @Roles('delegado', 'superusuario', 'admin')
  async verificarCiDirectiva(
    @Query('ci') ci: string,
    @Query('complemento') complemento?: string,
    @Query('excludeSolicitudId') excludeSolicitudId?: string,
  ) {
    const excludeId = excludeSolicitudId ? parseInt(excludeSolicitudId, 10) : undefined;
    return this.inscripcionesService.verificarCiDirectiva(
      ci,
      complemento,
      Number.isNaN(excludeId) ? undefined : excludeId,
    );
  }

  @Get('mis-solicitudes')
  @Roles('delegado', 'superusuario', 'admin')
  async getMisSolicitudes(@Request() req: any) {
    return this.inscripcionesService.getMisSolicitudes(req.user.idUsuario);
  }

  @Get(':id')
  @Roles('delegado', 'superusuario', 'admin')
  async getSolicitud(@Param('id', ParseIntPipe) id: number) {
    return this.inscripcionesService.getSolicitudById(id);
  }

  // ── Admin: Ver todas las solicitudes ─────────────────────────────────────

  @Get('admin/todas')
  @Roles('superusuario', 'admin')
  async getAllSolicitudes(@Query('estado') estado?: string) {
    return this.inscripcionesService.getAllSolicitudes(estado);
  }

  @Put(':id/estado')
  @Roles('superusuario', 'admin')
  async updateEstado(
    @Param('id', ParseIntPipe) id: number,
    @Body('estado') estado: string,
    @Body('observaciones') observaciones?: string,
    @Body('revisionChecklist') revisionChecklist?: any,
  ) {
    return this.inscripcionesService.updateEstadoSolicitud(id, estado, observaciones, revisionChecklist);
  }

  @Put(':id/admin-datos')
  @Roles('superusuario', 'admin')
  async updateSolicitudAdmin(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: Record<string, any>,
  ) {
    return this.inscripcionesService.updateSolicitudAdmin(id, body);
  }

  // ── Cronogramas ──────────────────────────────────────────────────────────

  @Get('cronogramas/:idGestion')
  @Roles('superusuario', 'admin', 'delegado')
  async getCronogramas(@Param('idGestion', ParseIntPipe) idGestion: number) {
    return this.inscripcionesService.getCronogramasByGestion(idGestion);
  }

  @Post('cronogramas')
  @Roles('superusuario', 'admin')
  async upsertCronograma(@Body() data: any) {
    return this.inscripcionesService.upsertCronograma(data);
  }

  // ── Inscripción Oficial (Fraternidad) ────────────────────────────────────

  @Post('inscribir-desde-solicitud/:idSolicitud')
  @Roles('superusuario', 'admin')
  async inscribirDesdeSolicitud(
    @Param('idSolicitud', ParseIntPipe) idSolicitud: number,
    @Body() data: any
  ) {
    return this.inscripcionesService.inscribirDesdeSolicitud(idSolicitud, data);
  }
}
