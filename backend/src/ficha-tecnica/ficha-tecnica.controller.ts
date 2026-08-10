import {
  Controller,
  Get,
  Put,
  Post,
  Body,
  Param,
  ParseIntPipe,
  UseGuards,
  Request,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { FichaTecnicaService } from './ficha-tecnica.service';

@Controller('ficha-tecnica')
@UseGuards(JwtAuthGuard, RolesGuard)
export class FichaTecnicaController {
  constructor(private readonly service: FichaTecnicaService) {}

  @Get('mi')
  @Roles('delegado')
  getMi(@Request() req) {
    return this.service.getMiFicha(req.user.idUsuario);
  }

  @Put('mi')
  @Roles('delegado')
  guardarMi(@Request() req, @Body() body: any) {
    return this.service.guardarMiFicha(req.user.idUsuario, body);
  }

  @Post('mi/generar')
  @Roles('delegado')
  generarMi(@Request() req, @Res() res: Response) {
    return this.service.generarMiPdf(req.user.idUsuario, res);
  }

  @Get('mi/pdf')
  @Roles('delegado')
  descargarMi(@Request() req, @Res() res: Response) {
    return this.service.descargarMiPdf(req.user.idUsuario, res);
  }

  @Post('mi/corregir')
  @Roles('delegado')
  corregirMi(@Request() req) {
    return this.service.corregirMiFicha(req.user.idUsuario);
  }

  @Get()
  @Roles('superusuario', 'admin')
  listar(@Request() req) {
    return this.service.listarAdmin(req.user);
  }

  @Get(':id')
  @Roles('superusuario', 'admin')
  detalle(@Request() req, @Param('id', ParseIntPipe) id: number) {
    return this.service.getAdminDetalle(req.user, id);
  }

  @Get(':id/pdf')
  @Roles('superusuario', 'admin')
  descargarAdmin(@Request() req, @Param('id', ParseIntPipe) id: number, @Res() res: Response) {
    return this.service.descargarAdmin(req.user, id, res);
  }
}
