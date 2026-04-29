import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Request, ParseIntPipe, Query, UseInterceptors, UploadedFile, UploadedFiles, BadRequestException } from '@nestjs/common';
import { FileInterceptor, FileFieldsInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import * as fs from 'fs';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { EvaluacionesService } from './evaluaciones.service';
import { Public } from '../auth/decorators/public.decorator';

const multerOptions = {
  storage: diskStorage({
    destination: (req, file, cb) => {
      const uploadPath = './uploads/img_Fases';
      if (!fs.existsSync(uploadPath)) {
        fs.mkdirSync(uploadPath, { recursive: true });
      }
      cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      cb(null, 'fase-' + uniqueSuffix + extname(file.originalname));
    },
  }),
  fileFilter: (req: any, file: any, cb: any) => {
    if (file.mimetype.match(/\/(jpg|jpeg|png)$/)) {
      cb(null, true);
    } else {
      cb(new BadRequestException('Solo se permiten imágenes JPG y PNG'), false);
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
};

const multerOptionsCriterios = {
  storage: diskStorage({
    destination: (req, file, cb) => {
      const uploadPath = './uploads/img_Criterios';
      if (!fs.existsSync(uploadPath)) {
        fs.mkdirSync(uploadPath, { recursive: true });
      }
      cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      cb(null, 'criterio-' + uniqueSuffix + extname(file.originalname));
    },
  }),
  fileFilter: (req: any, file: any, cb: any) => {
    if (file.mimetype.match(/\/(jpg|jpeg|png)$/)) {
      cb(null, true);
    } else {
      cb(new BadRequestException('Solo se permiten imágenes JPG y PNG'), false);
    }
  },
  limits: { fileSize: 5 * 1024 * 1024 },
};

const multerOptionsGestion = {
  storage: diskStorage({
    destination: (req, file, cb) => {
      const uploadPath = './uploads/img_Gestion';
      if (!fs.existsSync(uploadPath)) fs.mkdirSync(uploadPath, { recursive: true });
      cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      cb(null, 'gestion-' + uniqueSuffix + extname(file.originalname));
    },
  }),
  fileFilter: (req: any, file: any, cb: any) => {
    if (file.mimetype.match(/\/(jpg|jpeg|png)$/)) cb(null, true);
    else cb(new BadRequestException('Solo imágenes JPG/PNG'), false);
  },
};

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('evaluaciones')
export class EvaluacionesController {
  constructor(private readonly evaluacionesService: EvaluacionesService) {}

  @Get('fases-auth')
  getMisFases(@Request() req: any) {
    return this.evaluacionesService.getFasesJurado(req.user.idUsuario, req.user.rol);
  }

  @Get('fase/:idFase/fraternidades')
  getFraternidadesPorFase(
    @Request() req: any,
    @Param('idFase', ParseIntPipe) idFase: number
  ) {
    return this.evaluacionesService.getFraternidadesPorFase(req.user.idUsuario, req.user.rol, idFase);
  }

  @Get('fase/:idFase/criterios')
  getCriterios(@Param('idFase', ParseIntPipe) idFase: number) {
    return this.evaluacionesService.getCriteriosPorFase(idFase);
  }

  @Get('fase/:idFase/fraternidades/:idFraternidad/evaluacion')
  getEvaluacionExistenteFraternidad(
    @Request() req: any,
    @Param('idFase', ParseIntPipe) idFase: number,
    @Param('idFraternidad', ParseIntPipe) idFraternidad: number
  ) {
    return this.evaluacionesService.getEvaluacionActual(req.user.idUsuario, req.user.rol, idFase, { idFraternidad });
  }

  @Get('fase/:idFase/participante/:idParticipante/evaluacion')
  getEvaluacionExistenteParticipante(
    @Request() req: any,
    @Param('idFase', ParseIntPipe) idFase: number,
    @Param('idParticipante', ParseIntPipe) idParticipante: number
  ) {
    return this.evaluacionesService.getEvaluacionActual(req.user.idUsuario, req.user.rol, idFase, { idParticipante });
  }

  @Post('guardar')
  guardarEvaluacion(
    @Request() req: any,
    @Body() payload: { idFase: number, idFraternidad?: number, idParticipante?: number, criterios: any, finalizar: boolean }
  ) {
    return this.evaluacionesService.guardarEvaluacion(req.user.idUsuario, req.user.rol, payload);
  }

  @Public()
  @Get('estadisticas')
  getEstadisticas() {
    return this.evaluacionesService.getEstadisticasDashboard();
  }

  @Public()
  @Get('gestion-activa')
  getGestionActiva() {
    return this.evaluacionesService.getGestionActiva();
  }

  @Get('fases/:idFase/finalistas')
  @Roles('superusuario', 'admin')
  getFinalistasFase(@Param('idFase', ParseIntPipe) idFase: number) {
    return this.evaluacionesService.getFinalistasFase(idFase);
  }

  // --- CRUD ADMINISTRATIVO FASES ---
  @Get('gestiones')
  @Roles('superusuario', 'admin')
  getGestiones() {
    return this.evaluacionesService.getGestiones();
  }

  @Get('gestiones/:id')
  @Roles('superusuario', 'admin')
  getGestion(@Param('id', ParseIntPipe) id: number) {
    return this.evaluacionesService.getGestionById(id);
  }

  @Post('gestiones')
  @Roles('superusuario', 'admin')
  createGestion(@Body() data: any) {
    return this.evaluacionesService.createGestion(data);
  }

  @Put('gestiones/:id')
  @Roles('superusuario', 'admin')
  @UseInterceptors(FileFieldsInterceptor([
    { name: 'logo', maxCount: 1 },
    { name: 'banner', maxCount: 1 },
    { name: 'loginImg', maxCount: 1 },
  ], multerOptionsGestion))
  updateGestion(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: any,
    @UploadedFiles() files: { logo?: any[], banner?: any[], loginImg?: any[] }
  ) {
    const data = typeof body.data === 'string' ? JSON.parse(body.data) : body;
    if (files) {
      if (files.logo) data.urlLogo = `/api/v1/archivos/gestion/${files.logo[0].filename}`;
      if (files.banner) data.urlBanner = `/api/v1/archivos/gestion/${files.banner[0].filename}`;
      if (files.loginImg) data.urlImagenLogin = `/api/v1/archivos/gestion/${files.loginImg[0].filename}`;
    }
    return this.evaluacionesService.updateGestion(id, data);
  }

  @Delete('gestiones/:id')
  @Roles('superusuario', 'admin')
  deleteGestion(@Param('id', ParseIntPipe) id: number) {
    return this.evaluacionesService.deleteGestion(id);
  }

  @Get('gestiones/:id/fases')
  @Roles('superusuario', 'admin')
  getFasesPorGestion(@Param('id', ParseIntPipe) id: number) {
    return this.evaluacionesService.getFasesPorGestion(id);
  }

  @Get('jurados')
  @Roles('superusuario', 'admin')
  getJurados() {
    return this.evaluacionesService.getJuradosDisponibles();
  }

  @Post('fases')
  @Roles('superusuario', 'admin')
  @UseInterceptors(FileInterceptor('imagen', multerOptions))
  createFase(@Body() body: any, @UploadedFile() file: any) {
    const rawData = typeof body.data === 'string' ? JSON.parse(body.data) : body;
    if (file) {
      rawData.urlImagen = `/api/v1/archivos/fases/${file.filename}`;
    }
    return this.evaluacionesService.createFase(rawData);
  }

  @Put('fases/:id')
  @Roles('superusuario', 'admin')
  @UseInterceptors(FileInterceptor('imagen', multerOptions))
  updateFase(@Param('id', ParseIntPipe) id: number, @Body() body: any, @UploadedFile() file: any) {
    const rawData = typeof body.data === 'string' ? JSON.parse(body.data) : body;
    if (file) {
      rawData.urlImagen = `/api/v1/archivos/fases/${file.filename}`;
    }
    return this.evaluacionesService.updateFase(id, rawData);
  }

  @Delete('fases/:id')
  @Roles('superusuario', 'admin')
  removeFase(@Param('id', ParseIntPipe) id: number) {
    return this.evaluacionesService.deleteFase(id);
  }

  // --- CRUD ADMINISTRATIVO CRITERIOS ---
  @Post('criterios')
  @Roles('superusuario', 'admin')
  @UseInterceptors(FileInterceptor('imagen', multerOptionsCriterios))
  createCriterio(@Body() body: any, @UploadedFile() file: any) {
    const rawData = typeof body.data === 'string' ? JSON.parse(body.data) : body;
    if (file) {
      rawData.urlImagen = `/api/v1/archivos/criterios/${file.filename}`;
    }
    return this.evaluacionesService.createCriterio(rawData);
  }

  @Put('criterios/:id')
  @Roles('superusuario', 'admin')
  @UseInterceptors(FileInterceptor('imagen', multerOptionsCriterios))
  updateCriterio(@Param('id', ParseIntPipe) id: number, @Body() body: any, @UploadedFile() file: any) {
    const rawData = typeof body.data === 'string' ? JSON.parse(body.data) : body;
    if (file) {
      rawData.urlImagen = `/api/v1/archivos/criterios/${file.filename}`;
    }
    return this.evaluacionesService.updateCriterio(id, rawData);
  }

  @Delete('criterios/:id')
  @Roles('superusuario', 'admin')
  removeCriterio(@Param('id', ParseIntPipe) id: number) {
    return this.evaluacionesService.deleteCriterio(id);
  }
}
