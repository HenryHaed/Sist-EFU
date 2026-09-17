import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Request,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import * as fs from 'fs';
import { Response } from 'express';
import { ApiBearerAuth, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ListasNominaService } from './listas-nomina.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Listas nómina Excel')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('listas-nomina')
export class ListasNominaController {
  constructor(private readonly service: ListasNominaService) {}

  @Get('mi')
  @Roles('delegado')
  @ApiOperation({ summary: 'Nómina Excel de la fraternidad del delegado' })
  getMi(@Request() req: any) {
    return this.service.getMi(req.user.idUsuario);
  }

  @Get('mi/plantilla')
  @Roles('delegado')
  @ApiOperation({
    summary:
      'Descargar plantilla Excel prellenada con fraternidad y tipo de danza del delegado',
  })
  async plantillaMi(@Request() req: any, @Res() res: Response) {
    const { buffer, filename } = await this.service.generarPlantillaMi(req.user.idUsuario);
    res.set({
      'Content-Type':
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${encodeURIComponent(filename)}"`,
      'Content-Length': buffer.length,
    });
    res.send(buffer);
  }

  @Get('mi/miembros')
  @Roles('delegado')
  @ApiOperation({ summary: 'Listado de fraternos importados de la nómina del delegado' })
  getMiembrosMi(@Request() req: any) {
    return this.service.getMiembrosMi(req.user.idUsuario);
  }

  @Post('mi')
  @Roles('delegado')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (req, file, cb) => {
          const path = join(process.cwd(), 'uploads', 'Doc_Nomina_Excel');
          if (!fs.existsSync(path)) fs.mkdirSync(path, { recursive: true });
          cb(null, path);
        },
        filename: (req: any, file, cb) => {
          const idFrat = req.user?.idFraternidad || req.user?.fraternidad?.idFraternidad || 0;
          cb(null, ListasNominaService.buildFilename(Number(idFrat) || 0, file.originalname));
        },
      }),
      fileFilter: (req, file, cb) => {
        if (!file.originalname.match(/\.(xlsx|xls)$/i)) {
          return cb(
            new BadRequestException('Solo se permiten archivos Excel (.xlsx o .xls).') as any,
            false,
          );
        }
        cb(null, true);
      },
      limits: { fileSize: 15 * 1024 * 1024 },
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Subir Excel, importar fraternos a BD (sin crear usuarios)' })
  uploadMi(@UploadedFile() file: Express.Multer.File, @Request() req: any) {
    return this.service.uploadMi(req.user.idUsuario, file);
  }

  @Delete('mi')
  @Roles('delegado')
  @ApiOperation({ summary: 'Eliminar la nómina del delegado' })
  deleteMi(@Request() req: any) {
    return this.service.deleteMi(req.user.idUsuario);
  }

  @Get('mi/archivo')
  @Roles('delegado')
  @ApiOperation({ summary: 'Descargar la nómina del delegado' })
  async downloadMi(@Request() req: any, @Res({ passthrough: true }) res: Response) {
    const { file, filename, mime } = await this.service.streamMiArchivo(req.user.idUsuario);
    res.set({
      'Content-Type': mime,
      'Content-Disposition': `attachment; filename="${encodeURIComponent(filename)}"`,
    });
    return file;
  }

  @Get()
  @Roles('superusuario', 'admin')
  @ApiOperation({ summary: 'Listado de nóminas por fraternidad (gestión activa)' })
  listar() {
    return this.service.listarAdmin();
  }

  @Get(':id/miembros')
  @Roles('superusuario', 'admin')
  @ApiOperation({ summary: 'Fraternos registrados de una nómina' })
  getMiembrosAdmin(@Param('id', ParseIntPipe) id: number) {
    return this.service.getMiembrosAdmin(id);
  }

  @Patch('miembros/:idMiembro/asegurado')
  @Roles('superusuario', 'admin')
  @ApiOperation({ summary: 'Otorgar o retirar seguro de un fraterno (solo admin)' })
  setAsegurado(
    @Param('idMiembro', ParseIntPipe) idMiembro: number,
    @Body() body: { asegurado?: boolean },
  ) {
    if (typeof body?.asegurado !== 'boolean') {
      throw new BadRequestException('El campo asegurado (boolean) es obligatorio.');
    }
    return this.service.setAseguradoMiembro(idMiembro, body.asegurado);
  }

  @Get(':id/preview')
  @Roles('superusuario', 'admin')
  @ApiOperation({ summary: 'Vista tabular de la primera hoja del Excel' })
  preview(@Param('id', ParseIntPipe) id: number) {
    return this.service.preview(id);
  }

  @Get(':id/archivo')
  @Roles('superusuario', 'admin')
  @ApiOperation({ summary: 'Descargar archivo de nómina' })
  async download(
    @Param('id', ParseIntPipe) id: number,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { file, filename, mime } = await this.service.streamArchivo(id);
    res.set({
      'Content-Type': mime,
      'Content-Disposition': `attachment; filename="${encodeURIComponent(filename)}"`,
    });
    return file;
  }

  @Delete(':id')
  @Roles('superusuario', 'admin')
  @ApiOperation({ summary: 'Eliminar nómina (admin)' })
  deleteAdmin(@Param('id', ParseIntPipe) id: number) {
    return this.service.deleteAdmin(id);
  }
}
