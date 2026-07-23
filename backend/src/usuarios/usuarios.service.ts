import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, DataSource } from 'typeorm';
import { Usuario } from '../entities/Usuario';
import { Role } from '../entities/Role';
import { Jurado } from '../entities/Jurado';
import { Fraternidad } from '../entities/Fraternidad';
import { Gestion } from '../entities/Gestion';
import { Fase } from '../entities/Fase';
import { CreateUsuarioDto, UpdateUsuarioDto } from './dto/usuario.dto';
import { normalizeEmail } from '../common/password-policy';
import { MailService } from '../mail/mail.service';
import { validarCiUsuario } from '../common/ci-usuario.validation';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UsuariosService {
  private readonly logger = new Logger(UsuariosService.name);

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
    private readonly mailService: MailService,
    private readonly dataSource: DataSource,
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
      relations: ['rol', 'fraternidad'],
    });
    if (!user) throw new NotFoundException(`Usuario con ID ${id} no encontrado`);
    return user;
  }

  private async assertFraternidadDisponibleParaDelegado(idFraternidad: number, excludeUsuarioId?: number) {
    const roleDelegado = await this.roleRepo.findOne({ where: { nombre: 'delegado' } });
    if (!roleDelegado) return;

    const qb = this.usuarioRepo.createQueryBuilder('u')
      .innerJoin('u.rol', 'r')
      .where('r.idRol = :idRol', { idRol: roleDelegado.idRol })
      .andWhere('u.id_fraternidad = :idFrat', { idFrat: idFraternidad });

    if (excludeUsuarioId) {
      qb.andWhere('u.id_usuario != :exclude', { exclude: excludeUsuarioId });
    }

    const existente = await qb.getOne();
    if (existente) {
      const frat = await this.fraternidadRepo.findOne({ where: { idFraternidad } });
      throw new BadRequestException(
        `Ya existe un delegado asignado a la fraternidad "${frat?.nombre || 'seleccionada'}". No se puede crear otro delegado para la misma fraternidad.`,
      );
    }
  }

  private async resolverFraternidadDelegado(opts: {
    idFraternidad?: number;
    nuevaFraternidad?: string;
    excludeUsuarioId?: number;
  }): Promise<Fraternidad | null> {
    const { idFraternidad, nuevaFraternidad, excludeUsuarioId } = opts;

    if (idFraternidad) {
      await this.assertFraternidadDisponibleParaDelegado(idFraternidad, excludeUsuarioId);
      return this.fraternidadRepo.findOne({ where: { idFraternidad } });
    }

    if (nuevaFraternidad?.trim()) {
      const nombreNorm = nuevaFraternidad.trim().toUpperCase();
      const existente = await this.fraternidadRepo
        .createQueryBuilder('f')
        .where('LOWER(TRIM(f.nombre)) = LOWER(:nombre)', { nombre: nombreNorm })
        .getOne();

      if (existente) {
        await this.assertFraternidadDisponibleParaDelegado(existente.idFraternidad, excludeUsuarioId);
        return existente;
      }

      const gestionActiva = await this.gestionRepo.findOne({ where: { activa: true } });
      const frat = new Fraternidad();
      frat.nombre = nombreNorm;
      frat.nivelRepresentacion = 'UMSA';
      frat.habilitadoEfu = false;
      if (gestionActiva) frat.gestion = gestionActiva;
      return this.fraternidadRepo.save(frat);
    }

    return null;
  }

  private async assertCorreoUnico(correo: string | undefined | null, excludeUsuarioId?: number) {
    if (!correo) return;
    const normalized = normalizeEmail(correo);
    const qb = this.usuarioRepo.createQueryBuilder('u')
      .where('LOWER(TRIM(u.correo)) = :correo', { correo: normalized });
    if (excludeUsuarioId) {
      qb.andWhere('u.id_usuario != :exclude', { exclude: excludeUsuarioId });
    }
    const existente = await qb.getOne();
    if (existente) {
      throw new BadRequestException('El correo ya se encuentra registrado');
    }
  }

  private prepareCorreo(correo?: string | null): string | undefined {
    if (correo === undefined || correo === null) return undefined;
    const trimmed = correo.trim();
    if (!trimmed) return undefined;
    return normalizeEmail(trimmed);
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
    const { idRol, password, tipoJurado, fasesEfuIds, fasesExternasIds, fasesIds, fraternidadesIds, idFraternidad, nuevaFraternidad, ...data } = createDto as any;

    const role = await this.roleRepo.findOne({ where: { idRol } });
    if (!role) throw new BadRequestException('Rol no válido');

    const correoNorm = this.prepareCorreo(data.correo);
    if (!correoNorm) {
      throw new BadRequestException('El correo es obligatorio');
    }
    await this.assertCorreoUnico(correoNorm);

    const ciNorm = validarCiUsuario(data.ci);
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new Usuario();
    Object.assign(newUser, { ...data, ci: ciNorm, correo: correoNorm });
    newUser.password = hashedPassword;
    newUser.rol = role;

    if (role.nombre === 'delegado') {
      newUser.fraternidad = await this.resolverFraternidadDelegado({ idFraternidad, nuevaFraternidad }) as any;
    }

    if (role.nombre === 'delegado' && !newUser.fraternidad) {
      throw new BadRequestException('El delegado debe estar asociado a una fraternidad o proveer el nombre de una nueva.');
    }

    let savedUser: Usuario;
    try {
      savedUser = (await this.usuarioRepo.save(newUser as any)) as unknown as Usuario;
    } catch (error) {
      if (error.code === '23505' || error.errno === 1062) {
        if (error.detail?.includes('correo') || error.constraint?.includes('correo')) {
          throw new BadRequestException('El correo ya se encuentra registrado');
        }
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

    await this.enviarCorreoCuentaCreada(savedUser, role.nombre);

    return savedUser;
  }

  private async enviarCorreoCuentaCreada(usuario: Usuario, rolNombre: string) {
    if (!usuario.correo) return;

    const nombre = `${usuario.nombres} ${usuario.primerApellido}`.trim();
    try {
      await this.mailService.sendAccountCreatedNotification(
        usuario.correo,
        nombre,
        usuario.ci,
        rolNombre,
      );
    } catch {
      this.logger.warn(`No se pudo enviar correo de bienvenida al usuario CI ${usuario.ci}`);
    }
  }

  private async notificarActualizacionUsuario(params: {
    usuario: Usuario;
    correoAnterior: string | null;
    correoNuevo: string | null;
    correoCambio: boolean;
    cambios: string[];
    passwordCambiada: boolean;
    rolNombre: string;
  }): Promise<{ enviado: boolean; tipo?: 'bienvenida' | 'actualizacion'; correo?: string; error?: string }> {
    const { usuario, correoAnterior, correoNuevo, correoCambio, cambios, passwordCambiada, rolNombre } = params;
    const nombre = `${usuario.nombres} ${usuario.primerApellido}`.trim();

    // Cambio de correo → tratar como cuenta nueva en el correo destino
    if (correoCambio && correoNuevo) {
      try {
        await this.mailService.sendAccountCreatedNotification(
          correoNuevo,
          nombre,
          usuario.ci,
          rolNombre,
        );
        return { enviado: true, tipo: 'bienvenida', correo: correoNuevo };
      } catch (error) {
        this.logger.warn(
          `No se pudo enviar correo de bienvenida (cambio de correo) a ${correoNuevo}: ${error?.message}`,
        );
        return { enviado: false, tipo: 'bienvenida', correo: correoNuevo, error: error?.message };
      }
    }

    const destino = correoNuevo || correoAnterior;
    if (!destino || !cambios.length) {
      return { enviado: false };
    }

    try {
      await this.mailService.sendAccountUpdatedNotification(destino, nombre, cambios, {
        passwordRestablecida: passwordCambiada,
        ci: usuario.ci,
      });
      return { enviado: true, tipo: 'actualizacion', correo: destino };
    } catch (error) {
      this.logger.warn(`No se pudo enviar correo de actualización a ${destino}: ${error?.message}`);
      return { enviado: false, tipo: 'actualizacion', correo: destino, error: error?.message };
    }
  }

  async update(id: number, updateDto: UpdateUsuarioDto & {
    tipoJurado?: string;
    fasesEfuIds?: number[];
    fasesExternasIds?: number[];
    fasesIds?: number[];
    fraternidadesIds?: number[];
    idFraternidad?: number;
    nuevaFraternidad?: string;
  }) {
    const user = await this.findOne(id);
    const { idRol, password, tipoJurado, fasesEfuIds, fasesExternasIds, fasesIds, fraternidadesIds, idFraternidad, nuevaFraternidad, ...data } = updateDto as any;

    const correoAnterior = user.correo ? String(user.correo).trim().toLowerCase() : null;
    const fraternidadAnteriorId = user.fraternidad?.idFraternidad ?? null;
    const ciAnterior = user.ci;
    const nombresAnterior = user.nombres;
    const paternoAnterior = user.primerApellido;
    const maternoAnterior = user.segundoApellido || '';
    const rolAnteriorId = user.rol?.idRol;

    let updateData: any = { ...data };
    const cambios: string[] = [];
    let correoCambio = false;
    let passwordCambiada = false;
    let correoNuevoNorm: string | null = correoAnterior;

    if (data.ci !== undefined && data.ci !== null && String(data.ci).trim() !== '') {
      updateData.ci = validarCiUsuario(data.ci);
      if (String(updateData.ci) !== String(ciAnterior)) {
        cambios.push(`CI: ${ciAnterior} → ${updateData.ci}`);
      }
    }

    if (data.nombres !== undefined && String(data.nombres).trim() !== String(nombresAnterior || '').trim()) {
      cambios.push(`Nombres: ${nombresAnterior} → ${String(data.nombres).trim()}`);
    }
    if (
      data.primerApellido !== undefined &&
      String(data.primerApellido).trim() !== String(paternoAnterior || '').trim()
    ) {
      cambios.push(`Apellido paterno: ${paternoAnterior} → ${String(data.primerApellido).trim()}`);
    }
    if (data.segundoApellido !== undefined) {
      const nuevoMaterno = String(data.segundoApellido || '').trim();
      if (nuevoMaterno !== String(maternoAnterior).trim()) {
        cambios.push(`Apellido materno: ${maternoAnterior || '(vacío)'} → ${nuevoMaterno || '(vacío)'}`);
      }
    }

    if (data.correo !== undefined) {
      const correoNorm = this.prepareCorreo(data.correo);
      if (correoNorm) {
        await this.assertCorreoUnico(correoNorm, id);
        updateData.correo = correoNorm;
        correoNuevoNorm = correoNorm;
        if (correoNorm !== correoAnterior) {
          correoCambio = true;
          cambios.push(
            `Correo: ${correoAnterior || '(sin correo)'} → ${correoNorm}`,
          );
        }
      } else if (correoAnterior) {
        // No permitir vaciar correo si ya tenía uno (mantener)
        delete updateData.correo;
        correoNuevoNorm = correoAnterior;
      }
    }

    let rolActualizado: Role | null = null;
    if (idRol) {
      rolActualizado = await this.roleRepo.findOne({ where: { idRol } });
      if (!rolActualizado) throw new BadRequestException('Rol no válido');
      updateData.rol = rolActualizado;
      if (rolActualizado.idRol !== rolAnteriorId) {
        cambios.push(`Rol: ${user.rol?.nombre || '?'} → ${rolActualizado.nombre}`);
      }
    }

    // Cambio de correo = cuenta nueva: restablecer contraseña al CI (como alta de usuario)
    if (correoCambio) {
      const ciAcceso = String(updateData.ci || user.ci);
      updateData.password = await bcrypt.hash(ciAcceso, 10);
      updateData.primerLogin = true;
      passwordCambiada = true;
      if (!cambios.some((c) => c.toLowerCase().includes('contraseña'))) {
        cambios.push('Contraseña restablecida al CI (cuenta nueva)');
      }
    } else if (password && password.trim() !== '') {
      updateData.password = await bcrypt.hash(password, 10);
      passwordCambiada = true;
      cambios.push('Contraseña actualizada por un administrador');
    }

    if (idFraternidad || nuevaFraternidad) {
      const frat = await this.resolverFraternidadDelegado({
        idFraternidad,
        nuevaFraternidad,
        excludeUsuarioId: id,
      });
      if (frat) {
        if (frat.idFraternidad !== fraternidadAnteriorId) {
          cambios.push(
            `Fraternidad: ${user.fraternidad?.nombre || '(ninguna)'} → ${frat.nombre}`,
          );
        }
        user.fraternidad = frat;
      }
    } else if (idFraternidad === null && !nuevaFraternidad) {
      if (fraternidadAnteriorId) {
        cambios.push(`Fraternidad: ${user.fraternidad?.nombre || fraternidadAnteriorId} → (ninguna)`);
      }
      user.fraternidad = null;
    }

    const rolEvaluado = rolActualizado || user.rol;
    if (rolEvaluado?.nombre === 'delegado' && !user.fraternidad) {
      throw new BadRequestException('El delegado debe estar asociado a una fraternidad o proveer el nombre de una nueva.');
    }

    Object.assign(user, updateData);

    let savedUser: Usuario;
    try {
      savedUser = await this.usuarioRepo.save(user);
    } catch (error) {
      if (error.code === '23505' || error.errno === 1062) {
        if (error.detail?.includes('correo') || error.constraint?.includes('correo')) {
          throw new BadRequestException('El correo ya se encuentra registrado');
        }
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
      if (!cambios.some((c) => c.toLowerCase().includes('jurado'))) {
        cambios.push('Perfil / asignaciones de jurado actualizadas');
      }
    }

    const notificacionCorreo = await this.notificarActualizacionUsuario({
      usuario: savedUser,
      correoAnterior,
      correoNuevo: correoNuevoNorm || savedUser.correo || null,
      correoCambio,
      cambios,
      passwordCambiada,
      rolNombre: rolFinal?.nombre || 'usuario',
    });

    return { ...savedUser, notificacionCorreo };
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
      perfil.fraternidadesHabilitadas = await this.fraternidadRepo.findBy({
        idFraternidad: In(fraternidadesIds),
        habilitadoEfu: true,
      });
    } else if (tipoJurado === 'EXTERNO') {
      perfil.fraternidadesHabilitadas = [];
    }

    await this.juradoRepo.save(perfil);
  }

  // Asignar jurados directamente a una fase (llamado desde GestionFasesView)
  async asignarJuradosAFase(idFase: number, juradoIds: number[], usuarioIds?: number[]) {
    const fase = await this.faseRepo.findOne({ where: { idFase } });
    if (!fase) throw new NotFoundException('Fase no encontrada');

    // Si recibimos usuarioIds (de controladores), aseguramos su perfil de jurado primero
    if (usuarioIds && usuarioIds.length > 0) {
      for (const uid of usuarioIds) {
        const perfil = await this.asegurarPerfilJurado(uid);
        if (!juradoIds.includes(perfil.idJurado)) {
          juradoIds.push(perfil.idJurado);
        }
      }
    }

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

  // Obtener todos los controladores HCU (para la fase de disciplina)
  async findAllControladores() {
    const roleControlador = await this.roleRepo.findOne({ where: { nombre: 'controladorhcu' } });
    if (!roleControlador) return [];

    const controladores = await this.usuarioRepo.find({
      where: { rol: { idRol: roleControlador.idRol } },
      relations: ['jurados', 'jurados.fasesHabilitadas'],
    });

    return controladores.map(c => {
      const j = c.jurados && c.jurados.length > 0 ? c.jurados[0] : null;
      return {
        idUsuario: c.idUsuario,
        idJurado: j ? j.idJurado : null,
        nombre: `${c.nombres} ${c.primerApellido}`,
        ci: c.ci,
        fasesHabilitadas: j ? j.fasesHabilitadas : [],
      };
    });
  }

  // Asegurar perfil de jurado para un usuario (útil para controladores asignados a disciplina)
  async asegurarPerfilJurado(idUsuario: number) {
    const user = await this.usuarioRepo.findOne({ where: { idUsuario }, relations: ['rol'] });
    if (!user) throw new NotFoundException('Usuario no encontrado');

    const gestion = await this.gestionRepo.findOne({ where: { activa: true } });
    if (!gestion) throw new BadRequestException('No hay gestión activa');

    let perfil = await this.juradoRepo.findOne({ where: { usuario: { idUsuario: user.idUsuario } } });
    if (!perfil) {
      perfil = this.juradoRepo.create({
        usuario: user,
        gestion,
        tipoOrigen: 'Asignación Automática HCU',
        tipoJurado: 'EFU',
      }) as any;
      perfil = await this.juradoRepo.save(perfil);
    }
    return perfil;
  }

  async remove(id: number) {
    const user = await this.findOne(id);
    if (!user) throw new NotFoundException('Usuario no encontrado');

    if (user.rol?.nombre === 'superusuario') {
      const totalSuper = await this.usuarioRepo
        .createQueryBuilder('u')
        .innerJoin('u.rol', 'rol')
        .where('rol.nombre = :rol', { rol: 'superusuario' })
        .getCount();
      if (totalSuper <= 1) {
        throw new BadRequestException('No se puede eliminar el único superusuario del sistema.');
      }
    }

    const qr = this.dataSource.createQueryRunner();
    await qr.connect();
    await qr.startTransaction();
    try {
      // Solicitudes de inscripción del delegado
      await qr.query(`DELETE FROM solicitudes_inscripcion WHERE id_usuario_delegado = $1`, [id]);

      // Tokens de recuperación
      await qr.query(`DELETE FROM password_reset_tokens WHERE id_usuario = $1`, [id]);

      // Auditoría / sesiones (si existen)
      try {
        await qr.query(
          `UPDATE auditoria_acciones SET id_usuario = NULL WHERE id_usuario = $1`,
          [id],
        );
      } catch { /* ignore */ }
      try {
        await qr.query(`DELETE FROM sesiones_usuario WHERE id_usuario = $1`, [id]);
      } catch { /* ignore */ }

      // Monografías referenciadas como subido por
      try {
        await qr.query(`UPDATE monografias SET id_usuario_subio = NULL WHERE id_usuario_subio = $1`, [id]);
      } catch { /* ignore */ }

      // Incidencias y asistencias registradas por el usuario
      await qr.query(`DELETE FROM incidencias WHERE id_usuario = $1`, [id]);
      await qr.query(`DELETE FROM asistencias WHERE id_usuario = $1`, [id]);

      // Perfiles de jurado (evaluaciones + vinculaciones)
      const jurados: Array<{ id_jurado: number }> = await qr.query(
        `SELECT id_jurado FROM jurados WHERE id_usuario = $1`,
        [id],
      );
      for (const j of jurados) {
        await qr.query(`DELETE FROM evaluaciones WHERE id_jurado = $1`, [j.id_jurado]);
        await qr.query(`DELETE FROM jurado_fases WHERE id_jurado = $1`, [j.id_jurado]);
        await qr.query(`DELETE FROM jurado_fraternidades WHERE id_jurado = $1`, [j.id_jurado]);
      }
      await qr.query(`DELETE FROM jurados WHERE id_usuario = $1`, [id]);

      // Finalmente el usuario (la fraternidad queda; solo se desliga)
      await qr.query(`DELETE FROM usuarios WHERE id_usuario = $1`, [id]);

      await qr.commitTransaction();
      return {
        message: `Usuario ${user.nombres} ${user.primerApellido} eliminado con éxito`,
      };
    } catch (err: any) {
      await qr.rollbackTransaction();
      const detail = err?.driverError?.detail || err?.message || 'Error desconocido';
      throw new BadRequestException(`No se pudo eliminar al usuario: ${detail}`);
    } finally {
      await qr.release();
    }
  }

  async registerDelegado(data: { ci: string; nombres: string; primerApellido: string; segundoApellido?: string; correo: string; password?: string }) {
    // 1. Verificar si la inscripción pública está habilitada
    const gestionActiva = await this.gestionRepo.findOne({ where: { activa: true } });
    if (!gestionActiva || !gestionActiva.permiteInscripcionPublica) {
        throw new BadRequestException('El registro de fraternidades no está habilitado en este momento.');
    }

    // 2. Buscar el rol 'delegado'
    let roleDelegado = await this.roleRepo.findOne({ where: { nombre: 'delegado' } });
    if (!roleDelegado) {
        roleDelegado = await this.roleRepo.save({
            nombre: 'delegado',
            descripcion: 'Rol para inscripción de fraternidades y delegados'
        });
    }

    // 3. Crear el usuario
    const correoNorm = this.prepareCorreo(data.correo);
    if (!correoNorm) {
      throw new BadRequestException('El correo es obligatorio');
    }
    await this.assertCorreoUnico(correoNorm);

    const ciNorm = validarCiUsuario(data.ci);
    const rawPassword = data.password || ciNorm;
    const hashedPassword = await bcrypt.hash(rawPassword, 10);
    const { correo: _c, password: _p, ...rest } = data;
    const newUser = this.usuarioRepo.create({
        ...rest,
        ci: ciNorm,
        correo: correoNorm,
        password: hashedPassword,
        rol: roleDelegado,
        primerLogin: true
    });

    try {
        const savedUser = await this.usuarioRepo.save(newUser);
        const { password, ...result } = savedUser as any;
        return result;
    } catch (error) {
        if (error.detail?.includes('correo') || error.constraint?.includes('correo')) {
            throw new BadRequestException('El correo ya se encuentra registrado.');
        }
        if (error.code === '23505' || error.errno === 1062) {
            throw new BadRequestException('El CI ya se encuentra registrado.');
        }
        throw error;
    }
  }
}
