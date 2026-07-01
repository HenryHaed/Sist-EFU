import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Participante } from '../entities/Participante';
import { Fase } from '../entities/Fase';
import { Fraternidad } from '../entities/Fraternidad';
import { Facultad } from '../entities/Facultad';
import { Carrera } from '../entities/Carrera';
import { Gestion } from '../entities/Gestion';
import { Usuario } from '../entities/Usuario';

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
    @InjectRepository(Usuario)
    private usuarioRepo: Repository<Usuario>,
  ) {}

  async getGestionActiva() {
    let g = await this.gestionRepo.findOne({ where: { activa: true } });
    if (!g) g = await this.gestionRepo.findOne({ order: { anio: 'DESC' } });
    return g;
  }

  private async getDelegadoFraternidad(user: { idUsuario: number; rol: string }) {
    if (user.rol !== 'delegado') return null;

    const usuario = await this.usuarioRepo.findOne({
      where: { idUsuario: user.idUsuario },
      relations: ['fraternidad'],
    });

    if (!usuario?.fraternidad) {
      throw new ForbiddenException('No tienes una fraternidad asignada para gestionar participantes.');
    }

    return usuario.fraternidad;
  }

  private async assertDelegadoPuedeGestionar(participante: Participante, user?: { idUsuario: number; rol: string }) {
    if (!user || user.rol !== 'delegado') return;

    const frat = await this.getDelegadoFraternidad(user);
    if (participante.fraternidad?.idFraternidad !== frat.idFraternidad) {
      throw new ForbiddenException('No puedes gestionar participantes de otra fraternidad.');
    }
  }

  async findAllByFase(idFase: number, user?: { idUsuario: number; rol: string }) {
    const where: any = { fase: { idFase } };

    if (user?.rol === 'delegado') {
      const frat = await this.getDelegadoFraternidad(user);
      where.fraternidad = { idFraternidad: frat.idFraternidad };
    }

    return this.participanteRepo.find({
      where,
      relations: ['fraternidad', 'facultad', 'carrera'],
      order: { nombre: 'ASC' },
    });
  }

  async create(data: any, user?: { idUsuario: number; rol: string }) {
    const { nombre, tipo, idFase, idFraternidad, esUmsa, idFacultad, idCarrera, institucionExterna, perteneceFraternidad } = data;

    const fase = await this.faseRepo.findOne({ where: { idFase } });
    if (!fase) throw new NotFoundException('Fase no encontrada');

    if (user?.rol === 'delegado') {
      if (fase.tipoConcurso !== 'EXTERNO') {
        throw new ForbiddenException('Solo puedes inscribir participantes en concursos externos.');
      }
    }

    const gestion = await this.getGestionActiva();

    const nuevo = this.participanteRepo.create({
      nombre,
      tipo,
      fase,
      esUmsa: !!esUmsa,
      institucionExterna,
      perteneceFraternidad: !!perteneceFraternidad,
      gestion: gestion ? ({ idGestion: gestion.idGestion } as any) : null,
    });

    if (user?.rol === 'delegado') {
      const frat = await this.getDelegadoFraternidad(user);
      nuevo.fraternidad = frat;
      nuevo.perteneceFraternidad = true;
    } else if (idFraternidad) {
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

  async update(id: number, data: any, user?: { idUsuario: number; rol: string }) {
    const p = await this.participanteRepo.findOne({
      where: { idParticipante: id },
      relations: ['fraternidad', 'fase'],
    });
    if (!p) throw new NotFoundException('Participante no encontrado');

    await this.assertDelegadoPuedeGestionar(p, user);

    if (data.nombre !== undefined) p.nombre = data.nombre;
    if (data.tipo !== undefined) p.tipo = data.tipo;
    if (data.esUmsa !== undefined) p.esUmsa = !!data.esUmsa;
    if (data.institucionExterna !== undefined) p.institucionExterna = data.institucionExterna;

    if (user?.rol === 'delegado') {
      p.perteneceFraternidad = true;
    } else if (data.perteneceFraternidad !== undefined) {
      p.perteneceFraternidad = !!data.perteneceFraternidad;
    }

    if (user?.rol !== 'delegado' && data.idFraternidad !== undefined) {
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

  async remove(id: number, user?: { idUsuario: number; rol: string }) {
    const p = await this.participanteRepo.findOne({
      where: { idParticipante: id },
      relations: ['fraternidad'],
    });
    if (!p) throw new NotFoundException('Participante no encontrado');

    await this.assertDelegadoPuedeGestionar(p, user);

    return this.participanteRepo.remove(p);
  }
}
