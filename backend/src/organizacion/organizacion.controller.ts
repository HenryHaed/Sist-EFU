import { Controller, Get, Post, Put, Delete, Body, Param, ParseIntPipe, UseGuards } from '@nestjs/common';
import { OrganizacionService } from './organizacion.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('organizacion')
export class OrganizacionController {
  constructor(private readonly organizacionService: OrganizacionService) {}

  // FACULTADES
  @Get('facultades')
  getFacultades() {
    return this.organizacionService.findAllFacultades();
  }

  @Roles('admin', 'superusuario')
  @Post('facultades')
  createFacultad(@Body() data: { nombre: string, sigla?: string }) {
    return this.organizacionService.createFacultad(data);
  }

  @Roles('admin', 'superusuario')
  @Put('facultades/:id')
  updateFacultad(@Param('id', ParseIntPipe) id: number, @Body() data: { nombre?: string, sigla?: string }) {
    return this.organizacionService.updateFacultad(id, data);
  }

  @Roles('admin', 'superusuario')
  @Delete('facultades/:id')
  deleteFacultad(@Param('id', ParseIntPipe) id: number) {
    return this.organizacionService.removeFacultad(id);
  }

  // CARRERAS
  @Get('facultades/:idFacultad/carreras')
  getCarreras(@Param('idFacultad', ParseIntPipe) idFacultad: number) {
    return this.organizacionService.findCarrerasByFacultad(idFacultad);
  }

  @Roles('admin', 'superusuario')
  @Post('facultades/:idFacultad/carreras')
  createCarrera(@Param('idFacultad', ParseIntPipe) idFacultad: number, @Body() data: { nombre: string }) {
    return this.organizacionService.createCarrera(idFacultad, data);
  }

  @Roles('admin', 'superusuario')
  @Put('carreras/:id')
  updateCarrera(@Param('id', ParseIntPipe) id: number, @Body() data: { nombre: string }) {
    return this.organizacionService.updateCarrera(id, data);
  }

  @Roles('admin', 'superusuario')
  @Delete('carreras/:id')
  deleteCarrera(@Param('id', ParseIntPipe) id: number) {
    return this.organizacionService.removeCarrera(id);
  }

  // INSTITUCIONES
  @Get('instituciones')
  getInstituciones() {
    return this.organizacionService.findAllInstituciones();
  }

  @Roles('admin', 'superusuario')
  @Post('instituciones')
  createInstitucion(@Body() data: { nombre: string, sigla?: string }) {
    return this.organizacionService.createInstitucion(data);
  }

  @Roles('admin', 'superusuario')
  @Put('instituciones/:id')
  updateInstitucion(@Param('id', ParseIntPipe) id: number, @Body() data: { nombre?: string, sigla?: string }) {
    return this.organizacionService.updateInstitucion(id, data);
  }

  @Roles('admin', 'superusuario')
  @Delete('instituciones/:id')
  deleteInstitucion(@Param('id', ParseIntPipe) id: number) {
    return this.organizacionService.removeInstitucion(id);
  }
}
