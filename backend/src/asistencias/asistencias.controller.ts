import { Controller, Get, Post, Body, UseGuards, Request } from '@nestjs/common';
import { AsistenciasService } from './asistencias.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { CrearEventoDto } from './dto/crear-evento.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('asistencias')
export class AsistenciasController {
  constructor(private readonly asistenciasService: AsistenciasService) {}

  @Public()
  @Get('eventos-publicos')
  getEventosPublicos() {
    return this.asistenciasService.getEventosPublicos();
  }

  @Get('mis-citas')
  @Roles('delegado')
  getMisCitas() {
    return this.asistenciasService.getMisCitasDelegado();
  }

  @Get('delegados')
  @Roles('superusuario', 'admin', 'controladorhcu')
  getDelegados() {
    return this.asistenciasService.getDelegados();
  }

  @Get('eventos')
  @Roles('superusuario', 'admin', 'controladorhcu')
  getEventos() {
    return this.asistenciasService.getEventos();
  }

  @Post('eventos')
  @Roles('superusuario', 'admin', 'controladorhcu')
  crearEvento(@Body() dto: CrearEventoDto, @Request() req) {
    const remitente = [req.user?.nombres, req.user?.primerApellido].filter(Boolean).join(' ').trim()
      || req.user?.ci
      || 'Administración EFU';
    return this.asistenciasService.crearEventoYCitarDelegados(dto, remitente);
  }

  @Post('registrar')
  @Roles('superusuario', 'admin', 'controladorhcu')
  registrarAsistencia(@Body() data: any, @Request() req) {
    return this.asistenciasService.registrarAsistencia({
      ...data,
      usuarioId: req.user.idUsuario,
    });
  }

  @Post('inasistencia')
  @Roles('superusuario', 'admin', 'controladorhcu')
  registrarInasistencia(@Body() data: any, @Request() req) {
    return this.asistenciasService.registrarInasistencia({
      ...data,
      usuarioId: req.user.idUsuario
    });
  }
}
