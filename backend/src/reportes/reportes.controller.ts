import { Controller, Get, Post, Body, Query, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { ReportesService } from './reportes.service';
import { ConsultarReporteDto } from './dto/consultar-reporte.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('reportes')
export class ReportesController {
  constructor(private readonly reportesService: ReportesService) {}

  @Get('tipos-danza')
  @Roles('superusuario', 'admin', 'delegado', 'controladorhcu')
  getTiposDanza() {
    return this.reportesService.getTiposDanza();
  }

  @Get('opciones-filtro')
  @Roles('superusuario', 'admin')
  getOpcionesFiltro(@Query('idGestion') idGestion?: string) {
    const id = idGestion ? parseInt(idGestion, 10) : undefined;
    return this.reportesService.getOpcionesFiltro(Number.isNaN(id) ? undefined : id);
  }

  @Post('consultar')
  @Roles('superusuario', 'admin')
  consultar(@Body() dto: ConsultarReporteDto) {
    return this.reportesService.consultar(dto);
  }

  @Post('consultar/pdf')
  @Roles('superusuario', 'admin')
  async consultarPdf(@Body() dto: ConsultarReporteDto, @Res() res: Response) {
    return this.reportesService.generarPdfConsulta(dto, res);
  }
}
