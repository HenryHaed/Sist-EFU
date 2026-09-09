import { Injectable, NotFoundException, BadRequestException, Logger, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, DataSource } from 'typeorm';
import { Usuario } from '../entities/Usuario';
import { Role } from '../entities/Role';
import { Jurado } from '../entities/Jurado';
import { Fraternidad } from '../entities/Fraternidad';
import { Gestion } from '../entities/Gestion';
import { Fase } from '../entities/Fase';
import { SolicitudInscripcion } from '../entities/SolicitudInscripcion';
import { CreateUsuarioDto, UpdateUsuarioDto } from './dto/usuario.dto';
import { normalizeEmail, validatePasswordPolicy } from '../common/password-policy';
import { MailService } from '../mail/mail.service';
import { FraternidadesService } from '../fraternidades/fraternidades.service';
import { validarCiUsuario } from '../common/ci-usuario.validation';
import { ensureSystemRoles } from '../common/system-roles';
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
    @InjectRepository(SolicitudInscripcion)
    private readonly solicitudRepo: Repository<SolicitudInscripcion>,
    private readonly mailService: MailService,
    private readonly fraternidadesService: FraternidadesService,
    private readonly dataSource: DataSource,
  ) { }

  async findAll() {
    return this.usuarioRepo.find({
      relations: ['rol', 'fraternidad', 'faseConcurso'],
      order: { idUsuario: 'DESC' },
    });
  }

  async findRoles() {
    try {
      await ensureSystemRoles(this.dataSource);
    } catch (err) {
      this.logger.warn(`No se pudieron asegurar roles del sistema: ${(err as Error)?.message || err}`);
    }
    return this.roleRepo.find({ order: { idRol: 'ASC' } });
  }

  private async resolverRol(idRol: unknown, nombreRol?: string) {
    try {
      await ensureSystemRoles(this.dataSource);
    } catch (err) {
      this.logger.warn(`No se pudieron asegurar roles del sistema: ${(err as Error)?.message || err}`);
    }

    const id = Number(idRol);
    if (Number.isFinite(id) && id > 0) {
      const byId = await this.roleRepo.findOne({ where: { idRol: id } });
      if (byId) return byId;
    }

    const nombre = String(nombreRol || '').trim().toLowerCase();
    if (nombre) {
      const todos = await this.roleRepo.find();
      const byName = todos.find((r) => String(r.nombre || '').trim().toLowerCase() === nombre);
      if (byName) return byName;
    }

    throw new BadRequestException(
      nombre
        ? `El rol «${nombre}» no existe en la base de datos.`
        : 'Debes seleccionar un rol válido.',
    );
  }

  async findOne(id: number) {
    const user = await this.usuarioRepo.findOne({
      where: { idUsuario: id },
      relations: ['rol', 'fraternidad', 'faseConcurso'],
    });
    if (!user) throw new NotFoundException(`Usuario con ID ${id} no encontrado`);
    return user;
  }

  private async resolverFaseConcurso(idFaseConcurso?: number | null) {
    if (idFaseConcurso === undefined || idFaseConcurso === null || idFaseConcurso === ('' as any)) {
      return null;
    }
    const id = Number(idFaseConcurso);
    if (!Number.isFinite(id) || id <= 0) return null;
    const fase = await this.faseRepo.findOne({ where: { idFase: id } });
    if (!fase) throw new BadRequestException('El concurso (fase) indicado no existe.');
    if (fase.tipoConcurso !== 'EXTERNO') {
      throw new BadRequestException('El concursante solo puede asignarse a un concurso externo (fase EXTERNO).');
    }
    if (String(fase.plantillaRequisitos || '').toLowerCase() === 'chacha_warmi') {
      throw new BadRequestException(
        'Chacha-Warmi lo inscribe el delegado de la fraternidad. Asigna al concursante un concurso de fotografía u otros.',
      );
    }
    return fase;
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
    /** Si el delegado ya tiene fraternidad, renombrar in-place en lugar de crear otra. */
    idFraternidadActual?: number | null;
  }): Promise<Fraternidad | null> {
    const { idFraternidad, nuevaFraternidad, excludeUsuarioId, idFraternidadActual } = opts;

    if (idFraternidad) {
      await this.assertFraternidadDisponibleParaDelegado(idFraternidad, excludeUsuarioId);
      const frat = await this.fraternidadRepo.findOne({ where: { idFraternidad } });
      if (!frat) throw new BadRequestException('La fraternidad seleccionada no existe.');
      return frat;
    }

    if (nuevaFraternidad?.trim()) {
      const nombreNorm = nuevaFraternidad.trim().toUpperCase();

      const existente = await this.fraternidadRepo
        .createQueryBuilder('f')
        .where('LOWER(TRIM(f.nombre)) = LOWER(:nombre)', { nombre: nombreNorm })
        .getOne();

      // Edición con fraternidad ya asignada
      if (idFraternidadActual) {
        // Mismo nombre o misma fila → sync y listo
        if (existente && existente.idFraternidad === idFraternidadActual) {
          await this.fraternidadesService.sincronizarNombreRelacionados(
            idFraternidadActual,
            existente.nombre,
          );
          return existente;
        }
        // El nombre ya pertenece a otra fraternidad → reasignar (no crear fantasma)
        if (existente) {
          await this.assertFraternidadDisponibleParaDelegado(
            existente.idFraternidad,
            excludeUsuarioId,
          );
          return existente;
        }
        // Nombre nuevo libre → renombrar in-place (conserva fichas/monografías por FK)
        return this.fraternidadesService.renombrarFraternidad(
          idFraternidadActual,
          nombreNorm,
        );
      }

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

  /** Alinea solicitudes del delegado a su fraternidad canónica (solo FK + nombre texto). */
  private async alinearSolicitudesDelegadoAFraternidad(
    idUsuario: number,
    frat: Fraternidad,
  ) {
    const solicitudes = await this.solicitudRepo.find({
      where: { delegado: { idUsuario } },
      relations: ['fraternidadCreada'],
    });
    for (const sol of solicitudes) {
      const idActual = sol.fraternidadCreada?.idFraternidad ?? null;
      if (idActual !== frat.idFraternidad) {
        sol.fraternidadCreada = frat;
      }
      sol.nombreFraternidad = frat.nombre;
      await this.solicitudRepo.save(sol);
    }
    // Sync fichas de la fraternidad canónica (solo columna nombre)
    await this.fraternidadesService.sincronizarNombreRelacionados(
      frat.idFraternidad,
      frat.nombre,
    );
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

  /** Evita QueryFailedError cuando el cliente manda idRol vacío (''). */
  private parseIdRolRequerido(idRol: unknown): number {
    if (idRol === undefined || idRol === null || String(idRol).trim() === '') {
      throw new BadRequestException('Debes seleccionar un rol válido.');
    }
    const id = Number(idRol);
    if (!Number.isFinite(id) || id <= 0) {
      throw new BadRequestException('Debes seleccionar un rol válido.');
    }
    return id;
  }

  async create(createDto: CreateUsuarioDto & {
    tipoJurado?: string;
    fasesEfuIds?: number[];
    fasesExternasIds?: number[];
    fasesIds?: number[];
    fraternidadesIds?: number[];
    idFraternidad?: number;
    idFaseConcurso?: number;
  }) {
    const { idRol, nombreRol, password, tipoJurado, fasesEfuIds, fasesExternasIds, fasesIds, fraternidadesIds, idFraternidad, nuevaFraternidad, idFaseConcurso, ...data } = createDto as any;

    const role = await this.resolverRol(idRol, nombreRol);

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

    if (role.nombre === 'concursante') {
      const fase = await this.resolverFaseConcurso(idFaseConcurso);
      if (!fase) {
        throw new BadRequestException(
          'El concursante debe estar asignado a un concurso externo. Crea primero la fase EXTERNO en Gestión de Fases.',
        );
      }
      newUser.faseConcurso = fase;
      // Fraternidad opcional para concursante
      if (idFraternidad || nuevaFraternidad) {
        newUser.fraternidad = await this.resolverFraternidadDelegado({ idFraternidad, nuevaFraternidad }) as any;
      }
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

    return this.findOne(savedUser.idUsuario);
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
    idFaseConcurso?: number;
  }) {
    const user = await this.findOne(id);
    const { idRol, password, tipoJurado, fasesEfuIds, fasesExternasIds, fasesIds, fraternidadesIds, idFraternidad, nuevaFraternidad, idFaseConcurso, ...data } = updateDto as any;

    const correoAnterior = user.correo ? String(user.correo).trim().toLowerCase() : null;
    const fraternidadAnteriorId = user.fraternidad?.idFraternidad ?? null;
    const ciAnterior = user.ci;
    const nombresAnterior = user.nombres;
    const paternoAnterior = user.primerApellido;
    const maternoAnterior = user.segundoApellido || '';
    const rolAnteriorId = user.rol?.idRol;

    let updateData: any = { ...data };
    delete updateData.esDecisor;
    delete updateData.es_decisor;
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
    if (idRol !== undefined && idRol !== null && String(idRol).trim() !== '') {
      const idRolNum = this.parseIdRolRequerido(idRol);
      rolActualizado = await this.roleRepo.findOne({ where: { idRol: idRolNum } });
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
      validatePasswordPolicy(password.trim(), String(updateData.ci || user.ci));
      updateData.password = await bcrypt.hash(password.trim(), 10);
      updateData.primerLogin = true;
      passwordCambiada = true;
      cambios.push('Contraseña actualizada por un administrador');
    }

    if (idFraternidad || nuevaFraternidad) {
      const frat = await this.resolverFraternidadDelegado({
        idFraternidad,
        nuevaFraternidad,
        excludeUsuarioId: id,
        idFraternidadActual: fraternidadAnteriorId,
      });
      if (frat) {
        const nombreAnterior = user.fraternidad?.nombre || '(ninguna)';
        if (frat.idFraternidad !== fraternidadAnteriorId) {
          cambios.push(`Fraternidad: ${nombreAnterior} → ${frat.nombre}`);
        } else if (
          String(frat.nombre || '').trim().toUpperCase() !==
          String(nombreAnterior || '').trim().toUpperCase()
        ) {
          cambios.push(`Nombre fraternidad: ${nombreAnterior} → ${frat.nombre}`);
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

    if (rolEvaluado?.nombre === 'concursante') {
      if (idFaseConcurso !== undefined) {
        const fase = await this.resolverFaseConcurso(idFaseConcurso);
        if (!fase) {
          throw new BadRequestException(
            'El concursante debe estar asignado a un concurso externo. Crea primero la fase EXTERNO en Gestión de Fases.',
          );
        }
        if (user.faseConcurso?.idFase !== fase.idFase) {
          cambios.push(
            `Concurso: ${user.faseConcurso?.nombre || '(ninguno)'} → ${fase.nombre}`,
          );
        }
        user.faseConcurso = fase;
      } else if (!user.faseConcurso) {
        throw new BadRequestException(
          'El concursante debe estar asignado a un concurso externo.',
        );
      }
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

    if (passwordCambiada) {
      await this.dataSource.query(
        `UPDATE password_reset_tokens SET used_at = NOW() WHERE id_usuario = $1 AND used_at IS NULL`,
        [savedUser.idUsuario],
      );
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

    // Propagar fraternidad canónica a solicitudes del delegado (solo FK + texto nombre)
    if (
      rolFinal?.nombre === 'delegado' &&
      savedUser.fraternidad?.idFraternidad &&
      (idFraternidad !== undefined || nuevaFraternidad !== undefined)
    ) {
      const frat =
        savedUser.fraternidad.nombre
          ? savedUser.fraternidad
          : await this.fraternidadRepo.findOne({
              where: { idFraternidad: savedUser.fraternidad.idFraternidad },
            });
      if (frat) {
        await this.alinearSolicitudesDelegadoAFraternidad(savedUser.idUsuario, frat);
      }
    }

    const notificacionCorreo = await Promise.race([
      this.notificarActualizacionUsuario({
        usuario: savedUser,
        correoAnterior,
        correoNuevo: correoNuevoNorm || savedUser.correo || null,
        correoCambio,
        cambios,
        passwordCambiada,
        rolNombre: rolFinal?.nombre || 'usuario',
      }),
      new Promise<{ enviado: boolean }>((resolve) =>
        setTimeout(() => resolve({ enviado: false }), 6000),
      ),
    ]);

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
    if (tipoJurado === 'EXTERNO') {
      perfil.fraternidadesHabilitadas = [];
    } else if (fraternidadesIds.length > 0) {
      perfil.fraternidadesHabilitadas = await this.fraternidadRepo.findBy({
        idFraternidad: In(fraternidadesIds),
        habilitadoEfu: true,
      });
    } else {
      // Vacío = sin restricción (puede calificar todas las fraternidades habilitadas)
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
      relations: ['usuario', 'fasesHabilitadas', 'fraternidadesHabilitadas'],
    });
    return jurados.map(j => ({
      idJurado: j.idJurado,
      tipoJurado: j.tipoJurado,
      fasesHabilitadas: (j.fasesHabilitadas || []).map((f) => ({
        idFase: f.idFase,
        nombre: f.nombre,
        tipoConcurso: f.tipoConcurso,
      })),
      cantidadFraternidades: j.fraternidadesHabilitadas?.length ?? 0,
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

  private mapDecisorPublico(u: Usuario | null) {
    if (!u) return null;
    return {
      idUsuario: u.idUsuario,
      nombres: [u.nombres, u.primerApellido, u.segundoApellido].filter(Boolean).join(' ').trim(),
      ci: u.ci,
      correo: u.correo || null,
    };
  }

  async getDecisorActual() {
    const u = await this.usuarioRepo.findOne({
      where: { esDecisor: true },
      relations: ['rol'],
    });
    return this.mapDecisorPublico(u);
  }

  private async assertEsAdmin(usuario: Usuario) {
    const rol = String(usuario.rol?.nombre || '').toLowerCase();
    if (rol !== 'admin') {
      throw new BadRequestException('Solo un administrador puede ser Decisor.');
    }
  }

  /** Superusuario otorga el permiso Decisor a un admin (quita al titular previo). */
  async otorgarDecisor(idUsuario: number, actor: { idUsuario: number; rol?: string }) {
    if (String(actor?.rol || '').toLowerCase() !== 'superusuario') {
      throw new ForbiddenException('Solo el superusuario puede otorgar el permiso Decisor.');
    }
    const target = await this.findOne(idUsuario);
    await this.assertEsAdmin(target);

    await this.dataSource.transaction(async (manager) => {
      await manager
        .createQueryBuilder()
        .update(Usuario)
        .set({ esDecisor: false })
        .where('es_decisor = true')
        .execute();
      await manager.update(Usuario, { idUsuario }, { esDecisor: true });
    });

    return {
      ok: true,
      mensaje: `Permiso Decisor otorgado a ${target.nombres}.`,
      decisor: this.mapDecisorPublico({ ...target, esDecisor: true } as Usuario),
    };
  }

  /** Admin solicita autoasignarse; falla si otro titular lo tiene. */
  async solicitarDecisor(actor: { idUsuario: number; rol?: string }) {
    const rol = String(actor?.rol || '').toLowerCase();
    if (rol !== 'admin') {
      throw new ForbiddenException('Solo un administrador puede solicitar el permiso Decisor.');
    }
    const me = await this.findOne(actor.idUsuario);
    await this.assertEsAdmin(me);

    if (me.esDecisor) {
      return {
        ok: true,
        mensaje: 'Ya eres el Decisor actual.',
        decisor: this.mapDecisorPublico(me),
      };
    }

    const actual = await this.usuarioRepo.findOne({
      where: { esDecisor: true },
      relations: ['rol'],
    });
    if (actual && actual.idUsuario !== me.idUsuario) {
      throw new BadRequestException(
        `Ya hay un Decisor activo (${[actual.nombres, actual.primerApellido].filter(Boolean).join(' ')}). Debe renunciar o un superusuario debe reasignar el permiso.`,
      );
    }

    me.esDecisor = true;
    await this.usuarioRepo.save(me);
    return {
      ok: true,
      mensaje: 'Permiso Decisor asignado. Eres responsable de resolver empates de Chacha-Warmi.',
      decisor: this.mapDecisorPublico(me),
    };
  }

  /** El Decisor actual renuncia; superusuario puede forzar renuncia de otro. */
  async renunciarDecisor(
    actor: { idUsuario: number; rol?: string },
    body?: { idUsuario?: number },
  ) {
    const rol = String(actor?.rol || '').toLowerCase();
    const forzarId = body?.idUsuario != null ? Number(body.idUsuario) : null;
    const esSuper = rol === 'superusuario';

    let target: Usuario | null = null;
    if (forzarId && Number.isFinite(forzarId)) {
      if (!esSuper) {
        throw new ForbiddenException('Solo el superusuario puede forzar la renuncia de otro Decisor.');
      }
      target = await this.findOne(forzarId);
    } else {
      target = await this.findOne(actor.idUsuario);
      if (!target.esDecisor && !esSuper) {
        throw new BadRequestException('No tienes el permiso Decisor para renunciar.');
      }
      if (!target.esDecisor) {
        const actual = await this.usuarioRepo.findOne({ where: { esDecisor: true } });
        if (!actual) {
          return { ok: true, mensaje: 'No hay Decisor activo.', decisor: null };
        }
        if (!esSuper) {
          throw new BadRequestException('No tienes el permiso Decisor para renunciar.');
        }
        target = actual;
      }
    }

    if (!target.esDecisor) {
      return { ok: true, mensaje: 'Ese usuario no es Decisor.', decisor: null };
    }

    target.esDecisor = false;
    await this.usuarioRepo.save(target);
    return {
      ok: true,
      mensaje: 'Permiso Decisor liberado.',
      decisor: null,
    };
  }
}
