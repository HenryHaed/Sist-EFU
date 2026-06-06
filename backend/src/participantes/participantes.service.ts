import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Participante } from '../entities/Participante';
import { Fase } from '../entities/Fase';
import { Fraternidad } from '../entities/Fraternidad';
import { Facultad } from '../entities/Facultad';
import { Carrera } from '../entities/Carrera';
import { Gestion } from '../entities/Gestion';

@Injectable()
export class ParticipantesService {
  constructor(
    @InjectRepository(Participante)
    private participanteRepo: Repository<Participante>,
    @InjectRepository(Fase)
    private faseRepo: Repository<Fase>,
    @InjectRepository(Fraternidad)
    private fratRepo: Repository<Fraternidad>,
    @InjectRepository(Facultad)
    private facultadRepo: Repository<Facultad>,
    @InjectRepository(Carrera)
    private carreraRepo: Repository<Carrera>,
    @InjectRepository(Gestion)
    private gestionRepo: Repository<Gestion>,
  ) {}

  async getGestionActiva() {
    let g = await this.gestionRepo.findOne({ where: { activa: true } });
    if (!g) g = await this.gestionRepo.findOne({ order: { anio: 'DESC' } });
    return g;
  }

  async findAllByFase(idFase: number) {
    return this.participanteRepo.find({
      where: { fase: { idFase } },
      relations: ['fraternidad', 'facultad', 'carrera'],
      order: { nombre: 'ASC' }
    });
  }

  async create(data: any) {
    const { nombre, tipo, idFase, idFraternidad, esUmsa, idFacultad, idCarrera, institucionExterna, perteneceFraternidad } = data;

    const fase = await this.faseRepo.findOne({ where: { idFase } });
    if (!fase) throw new NotFoundException('Fase no encontrada');

    const gestion = await this.getGestionActiva();

    const nuevo = this.participanteRepo.create({
      nombre,
      tipo,
      fase,
      esUmsa: !!esUmsa,
      institucionExterna,
      perteneceFraternidad: !!perteneceFraternidad,
      gestion: gestion ? { idGestion: gestion.idGestion } as any : null
    });

    if (idFraternidad) {
      const frat = await this.fratRepo.findOne({ where: { idFraternidad } });
      if (frat) nuevo.fraternidad = frat;
    }

    if (idFacultad) {
      const fac = await this.facultadRepo.findOne({ where: { idFacultad } });
      if (fac) nuevo.facultad = fac;
    }

    if (idCarrera) {
      const car = await this.carreraRepo.findOne({ where: { idCarrera } });
      if (car) nuevo.carrera = car;
    }

    return this.participanteRepo.save(nuevo);
  }

  async update(id: number, data: any) {
    const p = await this.participanteRepo.findOne({ where: { idParticipante: id } });
    if (!p) throw new NotFoundException('Participante no encontrado');

    if (data.nombre !== undefined) p.nombre = data.nombre;
    if (data.tipo !== undefined) p.tipo = data.tipo;
    if (data.esUmsa !== undefined) p.esUmsa = !!data.esUmsa;
    if (data.institucionExterna !== undefined) p.institucionExterna = data.institucionExterna;
    if (data.perteneceFraternidad !== undefined) p.perteneceFraternidad = !!data.perteneceFraternidad;
    
    if (data.idFraternidad !== undefined) {
      if (data.idFraternidad === null) {
        p.fraternidad = null;
      } else {
        const frat = await this.fratRepo.findOne({ where: { idFraternidad: data.idFraternidad } });
        if (frat) p.fraternidad = frat;
      }
    }

    if (data.idFacultad !== undefined) {
      if (data.idFacultad === null) {
        p.facultad = null;
      } else {
        const fac = await this.facultadRepo.findOne({ where: { idFacultad: data.idFacultad } });
        if (fac) p.facultad = fac;
      }
    }

    if (data.idCarrera !== undefined) {
      if (data.idCarrera === null) {
        p.carrera = null;
      } else {
        const car = await this.carreraRepo.findOne({ where: { idCarrera: data.idCarrera } });
        if (car) p.carrera = car;
      }
    }

    return this.participanteRepo.save(p);
  }

  async remove(id: number) {
    const p = await this.participanteRepo.findOne({ where: { idParticipante: id } });
    if (!p) throw new NotFoundException('Participante no encontrado');
    return this.participanteRepo.remove(p);
  }
}
