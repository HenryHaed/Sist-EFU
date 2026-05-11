import { Controller, Get, Post, Body, UseGuards, Request } from '@nestjs/common';
import { AsistenciasService } from './asistencias.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('asistencias')
export class AsistenciasController {
  constructor(private readonly asistenciasService: AsistenciasService) {}

  @Get('delegados')
  @Roles('superusuario', 'admin', 'controladorhcu')
  getDelegados() {
    return this.asistenciasService.getDelegados();
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
