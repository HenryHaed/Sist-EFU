import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Facultad } from '../entities/Facultad';
import { Carrera } from '../entities/Carrera';
import { InstitucionExterna } from '../entities/InstitucionExterna';

@Injectable()
export class OrganizacionService {
  constructor(
    @InjectRepository(Facultad)
    private readonly facultadRepo: Repository<Facultad>,
    @InjectRepository(Carrera)
    private readonly carreraRepo: Repository<Carrera>,
    @InjectRepository(InstitucionExterna)
    private readonly institucionRepo: Repository<InstitucionExterna>,
  ) {}

  // --- FACULTADES ---
  async findAllFacultades() {
    return this.facultadRepo.find({ order: { nombre: 'ASC' } });
  }

  async createFacultad(data: { nombre: string, sigla?: string }) {
    const facultad = this.facultadRepo.create(data);
    return this.facultadRepo.save(facultad);
  }

  async updateFacultad(id: number, data: { nombre?: string, sigla?: string }) {
    await this.facultadRepo.update(id, data);
    return this.facultadRepo.findOne({ where: { idFacultad: id } });
  }

  async removeFacultad(id: number) {
    await this.facultadRepo.delete(id);
    return { success: true };
  }

  // --- CARRERAS ---
  async findCarrerasByFacultad(idFacultad: number) {
    return this.carreraRepo.find({
      where: { facultad: { idFacultad } },
      order: { nombre: 'ASC' }
    });
  }

  async createCarrera(idFacultad: number, data: { nombre: string }) {
    const carrera = this.carreraRepo.create({
      ...data,
      facultad: { idFacultad } as any
    });
    return this.carreraRepo.save(carrera);
  }

  async updateCarrera(id: number, data: { nombre: string }) {
    await this.carreraRepo.update(id, data);
    return this.carreraRepo.findOne({ where: { idCarrera: id } });
  }

  async removeCarrera(id: number) {
    await this.carreraRepo.delete(id);
    return { success: true };
  }

  // --- INSTITUCIONES EXTERNAS ---
  async findAllInstituciones() {
    return this.institucionRepo.find({ order: { nombre: 'ASC' } });
  }

  async createInstitucion(data: { nombre: string, sigla?: string }) {
    const inst = this.institucionRepo.create(data);
    return this.institucionRepo.save(inst);
  }

  async updateInstitucion(id: number, data: { nombre?: string, sigla?: string }) {
    await this.institucionRepo.update(id, data);
    return this.institucionRepo.findOne({ where: { idInstitucion: id } });
  }

  async removeInstitucion(id: number) {
    await this.institucionRepo.delete(id);
    return { success: true };
  }
}
