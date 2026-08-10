import {
  Controller,
  Get,
  Put,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  ParseIntPipe,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import * as fs from 'fs';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { InscripcionesConcursoService } from './inscripciones-concurso.service';

const uploadPath = './uploads/Doc_Inscripcion_Concurso';

@Controller('inscripciones-concurso')
@UseGuards(JwtAuthGuard, RolesGuard)
export class InscripcionesConcursoController {
  constructor(private readonly service: InscripcionesConcursoService) {}

  @Get('mi')
  @Roles('concursante')
  getMi(@Request() req) {
    return this.service.getMiInscripcion(req.user.idUsuario);
  }

  @Put('mi/datos')
  @Roles('concursante')
  guardarDatos(@Request() req, @Body() body: any) {
    return this.service.guardarDatos(req.user.idUsuario, body?.datos || body);
  }

  @Post('mi/archivos')
  @Roles('concursante')
  @UseInterceptors(
    FileInterceptor('archivo', {
      storage: diskStorage({
        destination: (_req, _file, cb) => {
          if (!fs.existsSync(uploadPath)) fs.mkdirSync(uploadPath, { recursive: true });
          cb(null, uploadPath);
        },
        filename: (_req, file, cb) => {
          const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, `insc-${unique}${extname(file.originalname)}`);
        },
      }),
      limits: { fileSize: 20 * 1024 * 1024 },
    }),
  )
  subirArchivo(
    @Request() req,
    @UploadedFile() file: Express.Multer.File,
    @Body('claveDocumento') claveDocumento: string,
  ) {
    if (!claveDocumento) throw new BadRequestException('claveDocumento es requerido');
    return this.service.subirArchivo(req.user.idUsuario, claveDocumento, file);
  }

  @Delete('mi/archivos/:id')
  @Roles('concursante')
  eliminarArchivo(@Request() req, @Param('id', ParseIntPipe) id: number) {
    return this.service.eliminarArchivo(req.user.idUsuario, id);
  }

  @Post('mi/enviar')
  @Roles('concursante')
  enviar(@Request() req) {
    return this.service.enviar(req.user.idUsuario);
  }

  @Get()
  @Roles('superusuario', 'admin')
  listar(@Query('idFase') idFase?: string) {
    return this.service.listarAdmin(idFase ? parseInt(idFase, 10) : undefined);
  }

  @Get(':id')
  @Roles('superusuario', 'admin')
  detalle(@Param('id', ParseIntPipe) id: number) {
    return this.service.getDetalleAdmin(id);
  }

  @Post(':id/revisar')
  @Roles('superusuario', 'admin')
  revisar(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { accion: 'aprobar' | 'observar' | 'rechazar'; observacion?: string },
  ) {
    if (!body?.accion) throw new BadRequestException('accion es requerida');
    return this.service.revisar(id, body.accion, body.observacion);
  }
}
