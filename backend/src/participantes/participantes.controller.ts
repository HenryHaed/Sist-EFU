import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, ParseIntPipe, Request, Res } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ParticipantesService } from './participantes.service';
import type { Response } from 'express';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('participantes')
export class ParticipantesController {
  constructor(private readonly service: ParticipantesService) {}

  @Get('fase/:idFase')
  @Roles('superusuario', 'admin', 'jurado', 'delegado')
  findAll(@Param('idFase', ParseIntPipe) idFase: number, @Request() req: any) {
    return this.service.findAllByFase(idFase, req.user);
  }

  @Get('fase/:idFase/audios-zip')
  @Roles('superusuario', 'admin')
  async downloadAudiosZip(
    @Param('idFase', ParseIntPipe) idFase: number,
    @Res() res: Response,
  ) {
    const { buffer, filename } = await this.service.buildAudiosZipChacha(idFase);
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', String(buffer.length));
    res.send(buffer);
  }

  @Post()
  @Roles('superusuario', 'admin')
  create(@Body() data: any, @Request() req: any) {
    return this.service.create(data, req.user);
  }

  @Put(':id')
  @Roles('superusuario', 'admin')
  update(@Param('id', ParseIntPipe) id: number, @Body() data: any, @Request() req: any) {
    return this.service.update(id, data, req.user);
  }

  @Delete(':id')
  @Roles('superusuario', 'admin')
  remove(@Param('id', ParseIntPipe) id: number, @Request() req: any) {
    return this.service.remove(id, req.user);
  }
}
