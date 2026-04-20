import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Participante } from '../entities/Participante';
import { Fase } from '../entities/Fase';
import { Fraternidad } from '../entities/Fraternidad';

@Injectable()
export class ParticipantesService {
  constructor(
    @InjectRepository(Participante)
    private participanteRepo: Repository<Participante>,
    @InjectRepository(Fase)
    private faseRepo: Repository<Fase>,
    @InjectRepository(Fraternidad)
    private fratRepo: Repository<Fraternidad>,
  ) {}

  async findAllByFase(idFase: number) {
    return this.participanteRepo.find({
      where: { fase: { idFase } },
      relations: ['fraternidad'],
      order: { nombre: 'ASC' }
    });
  }

  async create(data: { nombre: string, tipo?: string, idFase: number, idFraternidad?: number }) {
    const { nombre, tipo, idFase, idFraternidad } = data;

    const fase = await this.faseRepo.findOne({ where: { idFase } });
    if (!fase) throw new NotFoundException('Fase no encontrada');

    let fraternidad = null;
    if (idFraternidad) {
      fraternidad = await this.fratRepo.findOne({ where: { idFraternidad } });
    }

    const nuevo = this.participanteRepo.create({
      nombre,
      tipo,
      fase,
      fraternidad
    });

    return this.participanteRepo.save(nuevo);
  }

  async update(id: number, data: { nombre?: string, tipo?: string, idFraternidad?: number }) {
    const p = await this.participanteRepo.findOne({ where: { idParticipante: id } });
    if (!p) throw new NotFoundException('Participante no encontrado');

    if (data.nombre !== undefined) p.nombre = data.nombre;
    if (data.tipo !== undefined) p.tipo = data.tipo;
    
    if (data.idFraternidad !== undefined) {
      if (data.idFraternidad === null) {
        p.fraternidad = null;
      } else {
        const frat = await this.fratRepo.findOne({ where: { idFraternidad: data.idFraternidad } });
        if (frat) p.fraternidad = frat;
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
