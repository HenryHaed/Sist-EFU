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

  // Obtener perfil de jurado (incluye fases EFU y EXTERNAS separadas)
  async findPerfilJurado(idUsuario: number) {
    const perfil = await this.juradoRepo.findOne({
      where: { usuario: { idUsuario } },
      relations: ['fasesHabilitadas', 'fraternidadesHabilitadas'],
    });
    if (!perfil) return null;

    // Separar fases por tipo para el frontend
    const fasesEfu = perfil.fasesHabilitadas?.filter(f => f.tipoConcurso === 'EFU') || [];
    const fasesExternas = perfil.fasesHabilitadas?.filter(f => f.tipoConcurso === 'EXTERNO') || [];

    return {
      ...perfil,
      fasesEfu,
      fasesExternas,
      esEfu: fasesEfu.length > 0 || perfil.tipoJurado === 'EFU' || perfil.tipoJurado === 'AMBOS',
      esExterno: fasesExternas.length > 0 || perfil.tipoJurado === 'EXTERNO' || perfil.tipoJurado === 'AMBOS',
    };
  }

  async create(createDto: CreateUsuarioDto & {
    tipoJurado?: string;
    fasesEfuIds?: number[];
    fasesExternasIds?: number[];
    fasesIds?: number[];
    fraternidadesIds?: number[];
    idFraternidad?: number;
  }) {
    const { idRol, password, tipoJurado, fasesEfuIds, fasesExternasIds, fasesIds, fraternidadesIds, idFraternidad, ...data } = createDto as any;

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
      if (error.code === '23505' || error.errno === 1062) {
        throw new BadRequestException('El CI ya se encuentra registrado');
      }
      throw error;
    }

    // Auto-crear perfil de Jurado si el rol es 'jurado'
    if (role.nombre === 'jurado') {
      const allFasesIds = this.mergeAndDedupe(fasesEfuIds || [], fasesExternasIds || [], fasesIds || []);
      const resolvedTipo = this.resolvetipoJurado(tipoJurado, fasesEfuIds || [], fasesExternasIds || []);
      await this.crearOActualizarPerfilJurado(savedUser, resolvedTipo, allFasesIds, fraternidadesIds || []);
    }

    return savedUser;
  }

  async update(id: number, updateDto: UpdateUsuarioDto & {
    tipoJurado?: string;
    fasesEfuIds?: number[];
    fasesExternasIds?: number[];
    fasesIds?: number[];
    fraternidadesIds?: number[];
    idFraternidad?: number;
  }) {
    const user = await this.findOne(id);
    const { idRol, password, tipoJurado, fasesEfuIds, fasesExternasIds, fasesIds, fraternidadesIds, idFraternidad, ...data } = updateDto as any;

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
      const frat = await this.fraternidadRepo.findOne({ where: { idFraternidad } });
      if (frat) user.fraternidad = frat;
    } else if (idFraternidad === null) {
      user.fraternidad = null;
    }

    Object.assign(user, updateData);

    let savedUser: Usuario;
    try {
      savedUser = await this.usuarioRepo.save(user);
    } catch (error) {
      if (error.code === '23505' || error.errno === 1062) {
        throw new BadRequestException('El CI ya se encuentra registrado por otro usuario');
      }
      throw error;
    }

    // Si el rol resultante es jurado, actualizar o crear su perfil
    const rolFinal = rolActualizado || user.rol;
    const tieneUpdateJurado = tipoJurado !== undefined || fasesEfuIds !== undefined || fasesExternasIds !== undefined || fasesIds !== undefined || fraternidadesIds !== undefined;
    if (rolFinal?.nombre === 'jurado' && tieneUpdateJurado) {
      const allFasesIds = this.mergeAndDedupe(fasesEfuIds || [], fasesExternasIds || [], fasesIds || []);
      const resolvedTipo = this.resolvetipoJurado(tipoJurado, fasesEfuIds || [], fasesExternasIds || []);
      await this.crearOActualizarPerfilJurado(savedUser, resolvedTipo, allFasesIds, fraternidadesIds || []);
    }

    return savedUser;
  }

  // HELPER: Determinar el tipo correcto según las fases seleccionadas
  private resolvetipoJurado(tipoJurado: string | undefined, fasesEfuIds: number[], fasesExternasIds: number[]): string {
    const tieneEfu = fasesEfuIds.length > 0;
    const tieneExternas = fasesExternasIds.length > 0;
    if (tieneEfu && tieneExternas) return 'AMBOS';
    if (tieneExternas) return 'EXTERNO';
    if (tieneEfu) return 'EFU';
    return tipoJurado || 'EFU';
  }

  // HELPER: Combinar y deduplicar arrays de IDs
  private mergeAndDedupe(...arrays: number[][]): number[] {
    return [...new Set(arrays.flat())];
  }

  // HELPER: crea o actualiza el perfil Jurado para un usuario
  private async crearOActualizarPerfilJurado(
    usuario: Usuario,
    tipoJurado: string,
    fasesIds: number[],
    fraternidadesIds: number[]
  ) {
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
        tipoOrigen: 'Registro Administrativo',
        tipoJurado,
        fasesHabilitadas: [],
        fraternidadesHabilitadas: [],
      }) as any;
    } else {
      perfil.tipoJurado = tipoJurado;
      perfil.gestion = gestion;
    }

    // Asignar TODAS las fases habilitadas (EFU + EXTERNAS juntas)
    if (fasesIds.length > 0) {
      perfil.fasesHabilitadas = await this.faseRepo.findBy({ idFase: In(fasesIds) });
    } else {
      perfil.fasesHabilitadas = [];
    }

    // Solo asignar fraternidades para jurados EFU o AMBOS
    if (tipoJurado !== 'EXTERNO' && fraternidadesIds.length > 0) {
      perfil.fraternidadesHabilitadas = await this.fraternidadRepo.findBy({ idFraternidad: In(fraternidadesIds) });
    } else if (tipoJurado === 'EXTERNO') {
      perfil.fraternidadesHabilitadas = [];
    }

    await this.juradoRepo.save(perfil);
  }

  // Asignar jurados directamente a una fase (llamado desde GestionFasesView)
  async asignarJuradosAFase(idFase: number, juradoIds: number[]) {
    const fase = await this.faseRepo.findOne({ where: { idFase } });
    if (!fase) throw new NotFoundException('Fase no encontrada');

    const todosJurados = await this.juradoRepo.find({
      relations: ['fasesHabilitadas'],
    });

    for (const jurado of todosJurados) {
      const debeTener = juradoIds.includes(jurado.idJurado);
      const tieneFase = jurado.fasesHabilitadas.some(f => f.idFase === idFase);

      if (debeTener && !tieneFase) {
        jurado.fasesHabilitadas.push(fase);
        await this.juradoRepo.save(jurado);
      } else if (!debeTener && tieneFase) {
        jurado.fasesHabilitadas = jurado.fasesHabilitadas.filter(f => f.idFase !== idFase);
        await this.juradoRepo.save(jurado);
      }
    }

    return { success: true, fase: idFase, juradosAsignados: juradoIds.length };
  }

  // Obtener todos los jurados disponibles (para asignación en fases)
  async findAllJurados() {
    const jurados = await this.juradoRepo.find({
      relations: ['usuario', 'fasesHabilitadas'],
    });
    return jurados.map(j => ({
      idJurado: j.idJurado,
      tipoJurado: j.tipoJurado,
      fasesHabilitadas: j.fasesHabilitadas,
      nombre: j.usuario ? `${j.usuario.nombres} ${j.usuario.primerApellido}` : 'Sin usuario',
      ci: j.usuario?.ci || '',
    }));
  }

  async remove(id: number) {
    const user = await this.findOne(id);
    await this.usuarioRepo.remove(user);
    return { message: 'Usuario eliminado con éxito' };
  }

  async registerRepresentante(data: { ci: string; nombres: string; primerApellido: string; segundoApellido?: string; password: string }) {
    // 1. Verificar si la inscripción pública está habilitada
    const gestionActiva = await this.gestionRepo.findOne({ where: { activa: true } });
    if (!gestionActiva || !gestionActiva.permiteInscripcionPublica) {
        throw new BadRequestException('El registro de fraternidades no está habilitado en este momento.');
    }

    // 2. Buscar el rol 'representante'
    let roleRepresentante = await this.roleRepo.findOne({ where: { nombre: 'representante' } });
    if (!roleRepresentante) {
        roleRepresentante = await this.roleRepo.save({
            nombre: 'representante',
            descripcion: 'Rol para inscripción de fraternidades'
        });
    }

    // 3. Crear el usuario
    const hashedPassword = await bcrypt.hash(data.password, 10);
    const newUser = this.usuarioRepo.create({
        ...data,
        password: hashedPassword,
        rol: roleRepresentante,
        primerLogin: true
    });

    try {
        const savedUser = await this.usuarioRepo.save(newUser);
        const { password, ...result } = savedUser as any;
        return result;
    } catch (error) {
        if (error.code === '23505' || error.errno === 1062) {
            throw new BadRequestException('El CI ya se encuentra registrado.');
        }
        throw error;
    }
  }
}
