import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, ParseIntPipe, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ParticipantesService } from './participantes.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('participantes')
export class ParticipantesController {
  constructor(private readonly service: ParticipantesService) {}

  @Get('fase/:idFase')
  @Roles('superusuario', 'admin', 'jurado', 'delegado')
  findAll(@Param('idFase', ParseIntPipe) idFase: number, @Request() req: any) {
    return this.service.findAllByFase(idFase, req.user);
  }

  @Post()
  @Roles('superusuario', 'admin', 'delegado')
  create(@Body() data: any, @Request() req: any) {
    return this.service.create(data, req.user);
  }

  @Put(':id')
  @Roles('superusuario', 'admin', 'delegado')
  update(@Param('id', ParseIntPipe) id: number, @Body() data: any, @Request() req: any) {
    return this.service.update(id, data, req.user);
  }

  @Delete(':id')
  @Roles('superusuario', 'admin', 'delegado')
  remove(@Param('id', ParseIntPipe) id: number, @Request() req: any) {
    return this.service.remove(id, req.user);
  }
}
