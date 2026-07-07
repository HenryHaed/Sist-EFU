import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Fraternidad } from '../entities/Fraternidad';
import { Gestion } from '../entities/Gestion';
import { Usuario } from '../entities/Usuario';
import { SolicitudInscripcion } from '../entities/SolicitudInscripcion';
import { CreateFraternidadDto, UpdateFraternidadDto } from './dto/fraternidad.dto';
import { findGestionActivaOrLatest } from '../common/gestion.utils';

@Injectable()
export class FraternidadesService {
  constructor(
    @InjectRepository(Fraternidad)
    private readonly fraternidadRepo: Repository<Fraternidad>,
    @InjectRepository(Gestion)
    private readonly gestionRepo: Repository<Gestion>,
    @InjectRepository(Usuario)
    private readonly usuarioRepo: Repository<Usuario>,
    @InjectRepository(SolicitudInscripcion)
    private readonly solicitudRepo: Repository<SolicitudInscripcion>,
  ) {}

  async getGestionActiva() {
    return findGestionActivaOrLatest(this.gestionRepo);
  }

  async findAll() {
    const gestion = await this.getGestionActiva();
    return this.fraternidadRepo.find({
      where: gestion ? { gestion: { idGestion: gestion.idGestion } } : {},
      relations: ['facultad', 'carrera', 'institucionExterna', 'categoria'],
      order: { nombre: 'ASC' },
    });
  }

  async buscar(q: string) {
    const query = q.trim();
    const qb = this.fraternidadRepo
      .createQueryBuilder('fraternidad')
      .leftJoinAndSelect('fraternidad.gestion', 'gestion')
      .leftJoinAndSelect('fraternidad.facultad', 'facultad')
      .leftJoinAndSelect('fraternidad.carrera', 'carrera')
      .leftJoinAndSelect('carrera.facultad', 'carreraFacultad')
      .leftJoinAndSelect('fraternidad.institucionExterna', 'institucionExterna')
      .leftJoinAndSelect('fraternidad.categoria', 'categoria');

    if (query.length > 0) {
      qb.where(
        'LOWER(fraternidad.nombre) LIKE LOWER(:q) OR LOWER(fraternidad.origenFraternidad) LIKE LOWER(:q) OR LOWER(fraternidad.nivelRepresentacion) LIKE LOWER(:q) OR LOWER(facultad.nombre) LIKE LOWER(:q) OR LOWER(carrera.nombre) LIKE LOWER(:q) OR LOWER(institucionExterna.nombre) LIKE LOWER(:q)',
        { q: `%${query}%` }
      );
    }

    const fraternidades = await qb
      .orderBy('gestion.activa', 'DESC')
      .addOrderBy('gestion.anio', 'DESC')
      .addOrderBy('fraternidad.nombre', 'ASC')
      .take(20)
      .getMany();

    return fraternidades.map(fraternidad => ({
      idFraternidad: fraternidad.idFraternidad,
      nombre: fraternidad.nombre,
      nivelRepresentacion: fraternidad.nivelRepresentacion,
      origenFraternidad: fraternidad.origenFraternidad,
      gestionAnio: fraternidad.gestion?.anio || null,
      gestionActiva: !!fraternidad.gestion?.activa,
      etiqueta: this.formatearEtiquetaFraternidad(fraternidad),
    }));
  }

  private formatearEtiquetaFraternidad(fraternidad: Fraternidad) {
    const nivel = (fraternidad.nivelRepresentacion || '').trim();
    const facultad = fraternidad.facultad?.nombre?.trim();
    const carrera = fraternidad.carrera?.nombre?.trim();
    const institucion = fraternidad.institucionExterna?.nombre?.trim();

    if (nivel === 'Carrera') {
      const partes = [facultad || 'Facultad no definida', carrera || 'Carrera no definida'];
      return partes.join(' - ');
    }

    if (nivel === 'Facultad') {
      return facultad || 'Facultad no definida';
    }

    if (nivel === 'UMSA') {
      return 'Nivel UMSA';
    }

    if (nivel === 'Externo') {
      return institucion ? `Externo - ${institucion}` : 'Externo';
    }

    if (nivel) {
      return nivel;
    }

    if (facultad && carrera) {
      return `${facultad} - ${carrera}`;
    }

    if (facultad) {
      return facultad;
    }

    if (institucion) {
      return `Externo - ${institucion}`;
    }

    return fraternidad.origenFraternidad || 'General';
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
    const gestion = await this.getGestionActiva();

    const fraternidad = this.fraternidadRepo.create({
      ...data,
      facultad: idFacultad ? { idFacultad } as any : null,
      carrera: idCarrera ? { idCarrera } as any : null,
      institucionExterna: idInstitucionExterna ? { idInstitucion: idInstitucionExterna } as any : null,
      categoria: { idCategoria } as any,
      gestion: gestion ? { idGestion: gestion.idGestion } as any : null
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

    // 1. Desligar usuarios que apuntan a esta fraternidad
    await this.usuarioRepo
      .createQueryBuilder()
      .update()
      .set({ fraternidad: null })
      .where('id_fraternidad = :id', { id })
      .execute();

    // 2. Desligar solicitudes de inscripcion que referencian esta fraternidad como creada
    await this.solicitudRepo
      .createQueryBuilder()
      .update()
      .set({ fraternidadCreada: null })
      .where('id_fraternidad_creada = :id', { id })
      .execute();

    await this.fraternidadRepo.remove(fraternidad);
    return { message: 'Fraternidad eliminada con exito' };
  }
}
