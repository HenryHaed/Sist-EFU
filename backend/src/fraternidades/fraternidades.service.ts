import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Fraternidad } from '../entities/Fraternidad';
import { CreateFraternidadDto, UpdateFraternidadDto } from './dto/fraternidad.dto';

@Injectable()
export class FraternidadesService {
  constructor(
    @InjectRepository(Fraternidad)
    private readonly fraternidadRepo: Repository<Fraternidad>,
  ) {}

  async findAll() {
    return this.fraternidadRepo.find({
      relations: ['facultad', 'carrera', 'institucionExterna', 'categoria'],
      order: { nombre: 'ASC' },
    });
  }

  async findOne(id: number) {
    const fraternidad = await this.fraternidadRepo.findOne({
      where: { idFraternidad: id },
      relations: ['facultad', 'carrera', 'institucionExterna', 'categoria'],
    });

    if (!fraternidad) {
      throw new NotFoundException(`Fraternidad con ID ${id} no encontrada`);
    }
    return fraternidad;
  }

  async create(createDto: CreateFraternidadDto) {
    const { idFacultad, idCarrera, idInstitucionExterna, idCategoria, ...data } = createDto;
    
    const fraternidad = this.fraternidadRepo.create({
      ...data,
      facultad: idFacultad ? { idFacultad } as any : null,
      carrera: idCarrera ? { idCarrera } as any : null,
      institucionExterna: idInstitucionExterna ? { idInstitucion: idInstitucionExterna } as any : null,
      categoria: { idCategoria } as any,
    });

    return this.fraternidadRepo.save(fraternidad);
  }

  async update(id: number, updateDto: UpdateFraternidadDto) {
    const fraternidad = await this.findOne(id);
    const { idFacultad, idCarrera, idInstitucionExterna, idCategoria, ...data } = updateDto;

    const updateData: any = { ...data };
    if (idFacultad !== undefined) updateData.facultad = idFacultad ? { idFacultad } : null;
    if (idCarrera !== undefined) updateData.carrera = idCarrera ? { idCarrera } : null;
    if (idInstitucionExterna !== undefined) updateData.institucionExterna = idInstitucionExterna ? { idInstitucion: idInstitucionExterna } : null;
    if (idCategoria !== undefined) updateData.categoria = { idCategoria };

    Object.assign(fraternidad, updateData);
    return this.fraternidadRepo.save(fraternidad);
  }

  async remove(id: number) {
    const fraternidad = await this.findOne(id);
    await this.fraternidadRepo.remove(fraternidad);
    return { message: 'Fraternidad eliminada con éxito' };
  }
}
