import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MailService } from './mail.service';
import { Usuario } from '../entities/Usuario';
import {
  EnviarComunicadoDto,
  EnviarMensajeIndividualDto,
  ROLES_COMUNICADO,
  RolComunicado,
} from './dto/send-message.dto';

const ROLES_ADMIN = ['controladorhcu', 'delegado', 'jurado'] as const;

@Injectable()
export class MailMessagesService {
  private readonly logger = new Logger(MailMessagesService.name);

  constructor(
    private readonly mailService: MailService,
    @InjectRepository(Usuario)
    private readonly usuarioRepo: Repository<Usuario>,
  ) {}

  private rolesPermitidosPara(callerRol: string): RolComunicado[] {
    const rol = (callerRol || '').toLowerCase();
    if (rol === 'superusuario') {
      return [...ROLES_COMUNICADO];
    }
    if (rol === 'admin') {
      return [...ROLES_ADMIN];
    }
    return [];
  }

  private validarRolDestinatario(rolDestinatario: RolComunicado, callerRol: string) {
    const permitidos = this.rolesPermitidosPara(callerRol);
    if (!permitidos.includes(rolDestinatario)) {
      throw new ForbiddenException('No tienes permiso para enviar mensajes a ese grupo de usuarios.');
    }
  }

  async getEstadisticasCorreos(callerRol: string) {
    const roles = this.rolesPermitidosPara(callerRol);
    const porRol: Record<string, number> = {};

    for (const rol of roles) {
      porRol[rol] = await this.contarCorreosPorRol(rol);
    }

    return { porRol };
  }

  private async contarCorreosPorRol(rolNombre: string): Promise<number> {
    return this.usuarioRepo
      .createQueryBuilder('u')
      .innerJoin('u.rol', 'rol')
      .where('rol.nombre = :rol', { rol: rolNombre })
      .andWhere('u.correo IS NOT NULL')
      .andWhere("TRIM(u.correo) != ''")
      .getCount();
  }

  async buscarCorreos(q: string) {
    const term = (q || '').trim().toLowerCase();
    if (term.length < 2) {
      return [];
    }

    const usuarios = await this.usuarioRepo
      .createQueryBuilder('u')
      .leftJoinAndSelect('u.rol', 'rol')
      .where('u.correo IS NOT NULL')
      .andWhere("TRIM(u.correo) != ''")
      .andWhere(
        '(LOWER(u.correo) LIKE :q OR LOWER(u.nombres) LIKE :q OR LOWER(u.primer_apellido) LIKE :q)',
        { q: `%${term}%` },
      )
      .orderBy('u.correo', 'ASC')
      .take(12)
      .getMany();

    return usuarios.map((u) => ({
      idUsuario: u.idUsuario,
      correo: u.correo,
      nombreCompleto: [u.nombres, u.primerApellido, u.segundoApellido].filter(Boolean).join(' '),
      rol: u.rol?.nombre || null,
    }));
  }

  private async obtenerCorreosPorRol(rolNombre: string): Promise<string[]> {
    const rows = await this.usuarioRepo
      .createQueryBuilder('u')
      .innerJoin('u.rol', 'rol')
      .select('DISTINCT LOWER(TRIM(u.correo))', 'correo')
      .where('rol.nombre = :rol', { rol: rolNombre })
      .andWhere('u.correo IS NOT NULL')
      .andWhere("TRIM(u.correo) != ''")
      .getRawMany<{ correo: string }>();

    return rows.map((r) => r.correo).filter(Boolean);
  }

  async enviarComunicadoGeneral(dto: EnviarComunicadoDto, remitente: string, callerRol: string) {
    this.validarRolDestinatario(dto.rolDestinatario, callerRol);

    const correos = await this.obtenerCorreosPorRol(dto.rolDestinatario);
    if (correos.length === 0) {
      throw new BadRequestException(
        `No hay usuarios del rol seleccionado con correo electrónico registrado.`,
      );
    }

    let enviados = 0;
    const fallidos: string[] = [];

    for (const correo of correos) {
      try {
        await this.mailService.sendComunicado(correo, dto.asunto, dto.mensaje, remitente);
        enviados++;
      } catch (error) {
        this.logger.warn(`Fallo envío comunicado a ${correo}`, error?.message);
        fallidos.push(correo);
      }
    }

    return {
      rolDestinatario: dto.rolDestinatario,
      totalDestinatarios: correos.length,
      enviados,
      fallidos: fallidos.length,
      correosFallidos: fallidos.slice(0, 10),
    };
  }

  async enviarMensajeIndividual(dto: EnviarMensajeIndividualDto, remitente: string) {
    const correoNorm = dto.correo.trim().toLowerCase();

    const usuario = await this.usuarioRepo
      .createQueryBuilder('u')
      .leftJoinAndSelect('u.rol', 'rol')
      .where('LOWER(TRIM(u.correo)) = :correo', { correo: correoNorm })
      .getOne();

    const nombre = usuario
      ? [usuario.nombres, usuario.primerApellido].filter(Boolean).join(' ')
      : undefined;

    await this.mailService.sendComunicado(correoNorm, dto.asunto, dto.mensaje, remitente, nombre);

    return {
      correo: correoNorm,
      nombre: nombre || null,
      rol: usuario?.rol?.nombre || null,
      registrado: !!usuario,
    };
  }
}
