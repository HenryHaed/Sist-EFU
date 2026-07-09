import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Categoria } from '../entities/Categoria';
import { Gestion } from '../entities/Gestion';
import { ensureCategoriasDefault } from '../common/categorias-default';

@Injectable()
export class CategoriasService {
  constructor(
    @InjectRepository(Categoria)
    private readonly categoriaRepo: Repository<Categoria>,
    @InjectRepository(Gestion)
    private readonly gestionRepo: Repository<Gestion>,
  ) {}

  async findByGestion(idGestion?: number) {
    if (idGestion) {
      return this.categoriaRepo.find({
        where: { gestion: { idGestion } },
        order: { idCategoria: 'ASC' },
      });
    }
    return this.categoriaRepo.find({ order: { idCategoria: 'ASC' } });
  }

  async ensureDefaultForGestion(idGestion: number) {
    const gestion = await this.gestionRepo.findOne({ where: { idGestion } });
    if (!gestion) throw new NotFoundException('Gestión no encontrada');
    return ensureCategoriasDefault(this.categoriaRepo, idGestion);
  }
}
