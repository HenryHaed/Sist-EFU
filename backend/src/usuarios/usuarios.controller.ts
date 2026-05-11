import { Controller, Get, Post, Body, Param, Put, Delete, UseGuards, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UsuariosService } from './usuarios.service';
import { CreateUsuarioDto, UpdateUsuarioDto } from './dto/usuario.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

import { Public } from '../auth/decorators/public.decorator';

@ApiTags('Usuarios')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('usuarios')
export class UsuariosController {
  constructor(private readonly usuariosService: UsuariosService) {}

  @Public()
  @Post('registrar-representante')
  @ApiOperation({ summary: 'Auto-registro para representantes de fraternidad' })
  registerRepresentante(@Body() body: any) {
    return this.usuariosService.registerRepresentante(body);
  }

  @Get('roles')
  @Roles('superusuario', 'admin')
  @ApiOperation({ summary: 'Obtener todos los roles disponibles' })
  findRoles() {
    return this.usuariosService.findRoles();
  }

  @Get('jurados')
  @Roles('superusuario', 'admin')
  @ApiOperation({ summary: 'Listar todos los perfiles de jurado disponibles' })
  findAllJurados() {
    return this.usuariosService.findAllJurados();
  }

  @Get('controladores')
  @Roles('superusuario', 'admin')
  @ApiOperation({ summary: 'Listar todos los controladores HCU disponibles' })
  findAllControladores() {
    return this.usuariosService.findAllControladores();
  }

  @Get()
  @Roles('superusuario', 'admin')
  @ApiOperation({ summary: 'Listar todos los usuarios disponibles' })
  findAll() {
    return this.usuariosService.findAll();
  }

  @Post()
  @Roles('superusuario', 'admin')
  @ApiOperation({ summary: 'Crear un usuario nuevo (Admin/Superusuario)' })
  create(@Body() body: any) {
    return this.usuariosService.create(body);
  }

  @Get(':id/perfil-jurado')
  @Roles('superusuario', 'admin')
  @ApiOperation({ summary: 'Obtener el perfil de jurado de un usuario' })
  findPerfilJurado(@Param('id') id: string) {
    return this.usuariosService.findPerfilJurado(+id);
  }

  @Post('fases/:idFase/jurados')
  @Roles('superusuario', 'admin')
  @ApiOperation({ summary: 'Asignar/desasignar jurados a una fase específica' })
  asignarJuradosAFase(
    @Param('idFase', ParseIntPipe) idFase: number,
    @Body() body: { juradoIds: number[], usuarioIds?: number[] }
  ) {
    return this.usuariosService.asignarJuradosAFase(idFase, body.juradoIds, body.usuarioIds);
  }

  @Put(':id')
  @Roles('superusuario', 'admin')
  @ApiOperation({ summary: 'Actualizar un usuario (Admin/Superusuario)' })
  update(@Param('id') id: string, @Body() body: any) {
    return this.usuariosService.update(+id, body);
  }

  @Delete(':id')
  @Roles('superusuario', 'admin')
  @ApiOperation({ summary: 'Eliminar un usuario (Solo Superusuario)' })
  remove(@Param('id') id: string) {
    return this.usuariosService.remove(+id);
  }
}
