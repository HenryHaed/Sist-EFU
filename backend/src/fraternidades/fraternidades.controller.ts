import { Controller, Get, Post, Body, Param, Put, Delete, UseGuards, UseInterceptors, UploadedFile, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { FraternidadesService } from './fraternidades.service';
import { CreateFraternidadDto, UpdateFraternidadDto } from './dto/fraternidad.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Fraternidades')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('fraternidades')
export class FraternidadesController {
  constructor(private readonly fraternidadesService: FraternidadesService) {}

  @Post('upload')
  @Roles('superusuario', 'admin')
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: './uploads/logos',
      filename: (req, file, cb) => {
        const randomName = Array(32).fill(null).map(() => (Math.round(Math.random() * 16)).toString(16)).join('');
        return cb(null, `${randomName}${extname(file.originalname)}`);
      }
    })
  }))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  @ApiOperation({ summary: 'Subir logo de fraternidad (Solo Admin/Superuser)' })
  uploadFile(@UploadedFile() file: Express.Multer.File) {
    return {
      url: `/uploads/logos/${file.filename}`
    };
  }

  @Get()
  @ApiOperation({ summary: 'Listar todas las fraternidades' })
  findAll() {
    return this.fraternidadesService.findAll();
  }

  @Get('buscar')
  @ApiOperation({ summary: 'Buscar fraternidades activas e históricas para autocompletado' })
  buscar(@Query('q') q?: string) {
    return this.fraternidadesService.buscar(q || '');
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener una fraternidad por ID' })
  findOne(@Param('id') id: string) {
    return this.fraternidadesService.findOne(+id);
  }

  @Post()
  @Roles('superusuario', 'admin')
  @ApiOperation({ summary: 'Crear nueva fraternidad (Solo Admin/Superuser)' })
  create(@Body() createDto: CreateFraternidadDto) {
    return this.fraternidadesService.create(createDto);
  }

  @Put(':id')
  @Roles('superusuario', 'admin')
  @ApiOperation({ summary: 'Actualizar una fraternidad (Solo Admin/Superuser)' })
  update(@Param('id') id: string, @Body() updateDto: UpdateFraternidadDto) {
    return this.fraternidadesService.update(+id, updateDto);
  }

  @Delete(':id')
  @Roles('superusuario', 'admin')
  @ApiOperation({ summary: 'Eliminar una fraternidad (Solo Admin/Superuser)' })
  remove(@Param('id') id: string) {
    return this.fraternidadesService.remove(+id);
  }
}
