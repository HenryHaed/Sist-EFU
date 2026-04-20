import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Usuario } from '../entities/Usuario';
import { Role } from '../entities/Role';
import { Jurado } from '../entities/Jurado';
import { Fraternidad } from '../entities/Fraternidad';
import { Gestion } from '../entities/Gestion';
import { Fase } from '../entities/Fase';
import { CreateUsuarioDto, UpdateUsuarioDto } from './dto/usuario.dto';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UsuariosService {
  constructor(
    @InjectRepository(Usuario)
    private readonly usuarioRepo: Repository<Usuario>,
    @InjectRepository(Role)
    private readonly roleRepo: Repository<Role>,
    @InjectRepository(Jurado)
    private readonly juradoRepo: Repository<Jurado>,
    @InjectRepository(Gestion)
    private readonly gestionRepo: Repository<Gestion>,
    @InjectRepository(Fase)
    private readonly faseRepo: Repository<Fase>,
    @InjectRepository(Fraternidad)
    private readonly fraternidadRepo: Repository<Fraternidad>,
  ) { }

  async findAll() {
    return this.usuarioRepo.find({
      relations: ['rol', 'fraternidad'],
      order: { idUsuario: 'DESC' },
    });
  }

  async findRoles() {
    return this.roleRepo.find({ order: { idRol: 'ASC' } });
  }

  async findOne(id: number) {
    const user = await this.usuarioRepo.findOne({
      where: { idUsuario: id },
      relations: ['rol'],
    });
    if (!user) throw new NotFoundException(`Usuario con ID ${id} no encontrado`);
    return user;
  }

  // Obtener perfil de jurado de un usuario (incluye fases y fraternidades habilitadas)
  async findPerfilJurado(idUsuario: number) {
    return this.juradoRepo.findOne({
      where: { usuario: { idUsuario } },
      relations: ['fasesHabilitadas', 'fraternidadesHabilitadas'],
    });
  }

  async create(createDto: CreateUsuarioDto & { tipoJurado?: string; fasesIds?: number[]; fraternidadesIds?: number[] }) {
    const { idRol, password, tipoJurado, fasesIds, fraternidadesIds, idFraternidad, ...data } = createDto as any;

    const role = await this.roleRepo.findOne({ where: { idRol } });
    if (!role) throw new BadRequestException('Rol no válido');

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new Usuario();
    Object.assign(newUser, data);
    newUser.password = hashedPassword;
    newUser.rol = role;

    if (role.nombre === 'delegado' && idFraternidad) {
      const frat = await this.fraternidadRepo.findOne({ where: { idFraternidad } });
      if (frat) newUser.fraternidad = frat;
    }

    let savedUser: Usuario;
    try {
      savedUser = (await this.usuarioRepo.save(newUser as any)) as unknown as Usuario;
    } catch (error) {
      if (error.code === '23505' || error.errno === 1062 || error.code === 'SQLITE_CONSTRAINT') {
        throw new BadRequestException('El CI ya se encuentra registrado');
      }
      throw error;
    }

    // Auto-crear perfil de Jurado si el rol es 'jurado'
    if (role.nombre === 'jurado') {
      await this.crearOActualizarPerfilJurado(savedUser, tipoJurado || 'EFU', fasesIds || [], fraternidadesIds || []);
    }

    return savedUser;
  }

  async update(id: number, updateDto: UpdateUsuarioDto & { tipoJurado?: string; fasesIds?: number[]; fraternidadesIds?: number[] }) {
    const user = await this.findOne(id);
    const { idRol, password, tipoJurado, fasesIds, fraternidadesIds, idFraternidad, ...data } = updateDto as any;

    let updateData: any = { ...data };

    let rolActualizado: Role | null = null;
    if (idRol) {
      rolActualizado = await this.roleRepo.findOne({ where: { idRol } });
      if (!rolActualizado) throw new BadRequestException('Rol no válido');
      updateData.rol = rolActualizado;
    }

    if (password && password.trim() !== '') {
      updateData.password = await bcrypt.hash(password, 10);
    }

    if (idFraternidad) {
      const frat = await this.fraternidadRepo.findOne({ where: { idFraternidad: idFraternidad } });
      if (frat) user.fraternidad = frat;
    } else if (idFraternidad === null) {
      user.fraternidad = null;
    }

    Object.assign(user, updateData);

    let savedUser: Usuario;
    try {
      savedUser = await this.usuarioRepo.save(user);
    } catch (error) {
      if (error.code === '23505' || error.errno === 1062 || error.code === 'SQLITE_CONSTRAINT') {
        throw new BadRequestException('El CI ya se encuentra registrado por otro usuario');
      }
      throw error;
    }

    // Si el rol resultante es jurado, actualizar o crear su perfil
    const rolFinal = rolActualizado || user.rol;
    if (rolFinal?.nombre === 'jurado' && (tipoJurado !== undefined || fasesIds !== undefined || fraternidadesIds !== undefined)) {
      await this.crearOActualizarPerfilJurado(savedUser, tipoJurado || 'EFU', fasesIds || [], fraternidadesIds || []);
    }

    return savedUser;
  }

  // HELPER: crea o actualiza el perfil Jurado para un usuario
  private async crearOActualizarPerfilJurado(usuario: Usuario, tipoJurado: string, fasesIds: number[], fraternidadesIds: number[]) {
    const gestion = await this.gestionRepo.findOne({ where: { activa: true } });
    if (!gestion) return; // Sin gestión activa no se puede asignar

    let perfil = await this.juradoRepo.findOne({
      where: { usuario: { idUsuario: usuario.idUsuario } },
      relations: ['fasesHabilitadas', 'fraternidadesHabilitadas'],
    });

    if (!perfil) {
      perfil = this.juradoRepo.create({
        usuario,
        gestion,
        tipoOrigen: 'Registro',
        tipoJurado,
        fasesHabilitadas: [],
        fraternidadesHabilitadas: [],
      }) as any;
    } else {
      perfil.tipoJurado = tipoJurado;
      perfil.gestion = gestion;
    }

    // Asignar fases habilitadas según los IDs recibidos
    if (fasesIds.length > 0) {
      perfil.fasesHabilitadas = await this.faseRepo.findBy({ idFase: In(fasesIds) });
    } else {
      perfil.fasesHabilitadas = [];
    }

    // Asignar fraternidades habilitadas según los IDs recibidos
    // REGLA: Si es jurado EXTERNO, no puede tener fraternidades asignadas
    if (tipoJurado !== 'EXTERNO' && fraternidadesIds.length > 0) {
      perfil.fraternidadesHabilitadas = await this.fraternidadRepo.findBy({ idFraternidad: In(fraternidadesIds) });
    } else {
      perfil.fraternidadesHabilitadas = [];
    }

    await this.juradoRepo.save(perfil);
  }

  async remove(id: number) {
    const user = await this.findOne(id);
    await this.usuarioRepo.remove(user);
    return { message: 'Usuario eliminado con éxito' };
  }
}
