import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, ParseIntPipe } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ParticipantesService } from './participantes.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('participantes')
export class ParticipantesController {
  constructor(private readonly service: ParticipantesService) {}

  @Get('fase/:idFase')
  @Roles('superusuario', 'admin', 'jurado')
  findAll(@Param('idFase', ParseIntPipe) idFase: number) {
    return this.service.findAllByFase(idFase);
  }

  @Post()
  @Roles('superusuario', 'admin')
  create(@Body() data: any) {
    return this.service.create(data);
  }

  @Put(':id')
  @Roles('superusuario', 'admin')
  update(@Param('id', ParseIntPipe) id: number, @Body() data: any) {
    return this.service.update(id, data);
  }

  @Delete(':id')
  @Roles('superusuario', 'admin')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}
