import {
  Controller,
  Get,
  Post,
  Param,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Request,
  ParseIntPipe,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import * as fs from 'fs';
import { ApiBearerAuth, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { MonografiasService } from './monografias.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Monografías')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('monografias')
export class MonografiasController {
  constructor(private readonly monografiasService: MonografiasService) {}

  @Get('mi-fraternidad')
  @Roles('delegado')
  @ApiOperation({ summary: 'Obtener la monografía de la fraternidad del delegado' })
  getMiMonografia(@Request() req: any) {
    return this.monografiasService.getMiMonografia(req.user);
  }

  @Get('fraternidad/:idFraternidad')
  @Roles('superusuario', 'admin', 'jurado')
  @ApiOperation({ summary: 'Obtener la monografía de una fraternidad (jurado/admin)' })
  getByFraternidad(
    @Param('idFraternidad', ParseIntPipe) idFraternidad: number,
    @Request() req: any,
  ) {
    return this.monografiasService.getByFraternidad(idFraternidad, req.user);
  }

  @Post('upload')
  @Roles('delegado')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (req, file, cb) => {
          const path = join(process.cwd(), 'uploads', 'Doc_Monografia');
          if (!fs.existsSync(path)) {
            fs.mkdirSync(path, { recursive: true });
          }
          cb(null, path);
        },
        filename: (req: any, file, cb) => {
          const idFraternidad = req.user?.fraternidad?.idFraternidad;
          if (!idFraternidad) {
            return cb(new BadRequestException('No tienes una fraternidad asignada.') as any, '');
          }
          const name = MonografiasService.buildFilename(idFraternidad, file.originalname);
          cb(null, name);
        },
      }),
      fileFilter: (req, file, cb) => {
        if (!file.originalname.match(/\.pdf$/i)) {
          return cb(new BadRequestException('Solo se permiten archivos PDF.') as any, false);
        }
        cb(null, true);
      },
      limits: { fileSize: 20 * 1024 * 1024 },
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Subir o reemplazar la monografía de la fraternidad del delegado' })
  uploadMonografia(@UploadedFile() file: Express.Multer.File, @Request() req: any) {
    return this.monografiasService.uploadMonografia(req.user, file);
  }
}
