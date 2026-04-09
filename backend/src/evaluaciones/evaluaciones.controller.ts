import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Request, ParseIntPipe } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { EvaluacionesService } from './evaluaciones.service';

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
  getEvaluacionExistente(
    @Request() req: any,
    @Param('idFase', ParseIntPipe) idFase: number,
    @Param('idFraternidad', ParseIntPipe) idFraternidad: number
  ) {
    return this.evaluacionesService.getEvaluacionActual(req.user.idUsuario, req.user.rol, idFase, idFraternidad);
  }

  @Post('guardar')
  guardarEvaluacion(
    @Request() req: any,
    @Body() payload: { idFase: number, idFraternidad: number, criterios: any, finalizar: boolean }
  ) {
    return this.evaluacionesService.guardarEvaluacion(req.user.idUsuario, req.user.rol, payload);
  }

  // --- CRUD ADMINISTRATIVO FASES ---
  @Get('gestiones')
  @Roles('superusuario', 'admin')
  getGestiones() {
    return this.evaluacionesService.getGestiones();
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
  createFase(@Body() body: any) {
    return this.evaluacionesService.createFase(body);
  }

  @Put('fases/:id')
  @Roles('superusuario', 'admin')
  updateFase(@Param('id', ParseIntPipe) id: number, @Body() body: any) {
    return this.evaluacionesService.updateFase(id, body);
  }

  @Delete('fases/:id')
  @Roles('superusuario', 'admin')
  removeFase(@Param('id', ParseIntPipe) id: number) {
    return this.evaluacionesService.deleteFase(id);
  }

  // --- CRUD ADMINISTRATIVO CRITERIOS ---
  @Post('criterios')
  @Roles('superusuario', 'admin')
  createCriterio(@Body() body: any) {
    return this.evaluacionesService.createCriterio(body);
  }

  @Put('criterios/:id')
  @Roles('superusuario', 'admin')
  updateCriterio(@Param('id', ParseIntPipe) id: number, @Body() body: any) {
    return this.evaluacionesService.updateCriterio(id, body);
  }

  @Delete('criterios/:id')
  @Roles('superusuario', 'admin')
  removeCriterio(@Param('id', ParseIntPipe) id: number) {
    return this.evaluacionesService.deleteCriterio(id);
  }
}
