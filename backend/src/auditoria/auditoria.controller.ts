import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { AuditoriaService } from './auditoria.service';

@ApiTags('Auditoría del sistema')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('superusuario')
@Controller('auditoria')
export class AuditoriaController {
  constructor(private readonly auditoriaService: AuditoriaService) {}

  @Get('resumen')
  @ApiOperation({ summary: 'Resumen de sesiones y acciones agrupado por gestión' })
  getResumen() {
    return this.auditoriaService.getResumenPorGestion();
  }

  @Get('sesiones')
  @ApiOperation({ summary: 'Historial de inicios de sesión' })
  listarSesiones(
    @Query('idGestion') idGestion?: string,
    @Query('soloGlobal') soloGlobal?: string,
    @Query('idUsuario') idUsuario?: string,
    @Query('activas') activas?: string,
    @Query('desde') desde?: string,
    @Query('hasta') hasta?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.auditoriaService.listarSesiones({
      idGestion: idGestion && idGestion !== 'global' ? parseInt(idGestion, 10) : undefined,
      soloGlobal: idGestion === 'global' || soloGlobal === 'true',
      idUsuario: idUsuario ? parseInt(idUsuario, 10) : undefined,
      activas: activas === 'true',
      desde,
      hasta,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 25,
    });
  }

  @Get('acciones')
  @ApiOperation({ summary: 'Registro de cambios y mutaciones del sistema' })
  listarAcciones(
    @Query('idGestion') idGestion?: string,
    @Query('soloGlobal') soloGlobal?: string,
    @Query('idUsuario') idUsuario?: string,
    @Query('modulo') modulo?: string,
    @Query('metodo') metodo?: string,
    @Query('desde') desde?: string,
    @Query('hasta') hasta?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.auditoriaService.listarAcciones({
      idGestion: idGestion && idGestion !== 'global' ? parseInt(idGestion, 10) : undefined,
      soloGlobal: idGestion === 'global' || soloGlobal === 'true',
      idUsuario: idUsuario ? parseInt(idUsuario, 10) : undefined,
      modulo,
      metodo,
      desde,
      hasta,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 25,
    });
  }
}
