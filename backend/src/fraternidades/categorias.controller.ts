import { Controller, Get, Post, Param, ParseIntPipe, Query, UseGuards } from '@nestjs/common';
import { Public } from '../auth/decorators/public.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CategoriasService } from './categorias.service';

@Controller('categorias')
export class CategoriasController {
  constructor(private readonly categoriasService: CategoriasService) {}

  @Public()
  @Get()
  findAll(@Query('idGestion') idGestion?: string) {
    const gid = idGestion ? parseInt(idGestion, 10) : NaN;
    return this.categoriasService.findByGestion(Number.isNaN(gid) ? undefined : gid);
  }

  @Post('asegurar/:idGestion')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('superusuario', 'admin')
  ensureDefault(@Param('idGestion', ParseIntPipe) idGestion: number) {
    return this.categoriasService.ensureDefaultForGestion(idGestion);
  }
}
