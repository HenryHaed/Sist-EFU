import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not, IsNull } from 'typeorm';
import { SolicitudInscripcion, EstadoSolicitud } from '../entities/SolicitudInscripcion';
import { Asistencia } from '../entities/Asistencia';
import { Incidencia } from '../entities/Incidencia';
import { Infraccion } from '../entities/Infraccion';
import { Gestion } from '../entities/Gestion';
import { Fraternidad } from '../entities/Fraternidad';
import { EventoControl } from '../entities/EventoControl';
import { Usuario } from '../entities/Usuario';
import { MailService } from '../mail/mail.service';
import { findGestionActivaOrLatest } from '../common/gestion.utils';
import { CrearEventoDto } from './dto/crear-evento.dto';

/** 10% de la nota máxima de disciplina (30 pts) */
const PENALIZACION_INASISTENCIA_DEFAULT = 3;

@Injectable()
export class AsistenciasService {
  private readonly logger = new Logger(AsistenciasService.name);

  constructor(
    @InjectRepository(SolicitudInscripcion)
    private readonly solicitudRepo: Repository<SolicitudInscripcion>,
    @InjectRepository(Asistencia)
    private readonly asistenciaRepo: Repository<Asistencia>,
    @InjectRepository(Incidencia)
    private readonly incidenciaRepo: Repository<Incidencia>,
    @InjectRepository(Infraccion)
    private readonly infraccionRepo: Repository<Infraccion>,
    @InjectRepository(Gestion)
    private readonly gestionRepo: Repository<Gestion>,
    @InjectRepository(Fraternidad)
    private readonly fraternidadRepo: Repository<Fraternidad>,
    @InjectRepository(EventoControl)
    private readonly eventoRepo: Repository<EventoControl>,
    @InjectRepository(Usuario)
    private readonly usuarioRepo: Repository<Usuario>,
    private readonly mailService: MailService,
  ) {}

  private async getGestionActiva() {
    return findGestionActivaOrLatest(this.gestionRepo);
  }

  async getEventos() {
    return this.eventoRepo.find({ order: { fechaHora: 'DESC' } });
  }

  async crearEventoYCitarDelegados(dto: CrearEventoDto, remitenteNombre: string) {
    const nombre = dto.nombre?.trim();
    const ubicacion = dto.ubicacion?.trim();
    if (!nombre) throw new BadRequestException('Indica el nombre del evento.');
    if (!ubicacion) throw new BadRequestException('Indica la ubicación del evento.');

    const fechaHora = new Date(dto.fechaHora);
    if (Number.isNaN(fechaHora.getTime())) {
      throw new BadRequestException('Fecha y hora no válidas.');
    }

    const evento = await this.eventoRepo.save(
      this.eventoRepo.create({
        nombre,
        ubicacion,
        fechaHora,
        puntosPenalizacion: PENALIZACION_INASISTENCIA_DEFAULT,
      }),
    );

    const delegados = await this.usuarioRepo
      .createQueryBuilder('u')
      .innerJoin('u.rol', 'rol')
      .leftJoinAndSelect('u.fraternidad', 'fraternidad')
      .where('rol.nombre = :rol', { rol: 'delegado' })
      .andWhere('u.correo IS NOT NULL')
      .andWhere("TRIM(u.correo) != ''")
      .getMany();

    const elegibles = delegados.filter(
      (d) => !d.fraternidad || d.fraternidad.habilitadoEfu !== false,
    );

    if (elegibles.length === 0) {
      throw new BadRequestException(
        'No hay delegados con correo registrado en el sistema para enviar la citación.',
      );
    }

    let enviados = 0;
    const fallidos: string[] = [];

    for (const delegado of elegibles) {
      const nombreCompleto = [delegado.nombres, delegado.primerApellido, delegado.segundoApellido]
        .filter(Boolean)
        .join(' ')
        .trim();
      try {
        await this.mailService.sendConvocatoriaEventoDelegados(
          delegado.correo.trim(),
          nombreCompleto || 'Delegado',
          evento,
          remitenteNombre,
        );
        enviados++;
      } catch (error) {
        this.logger.warn(`Fallo citación a ${delegado.correo}: ${error?.message}`);
        fallidos.push(delegado.correo);
      }
    }

    return {
      evento,
      totalDestinatarios: elegibles.length,
      enviados,
      fallidos: fallidos.length,
      correosFallidos: fallidos.slice(0, 10),
    };
  }

  async getDelegados() {
    const gestion = await this.getGestionActiva();

    const solicitudes = await this.solicitudRepo.find({
      where: {
        gestion: gestion ? { idGestion: gestion.idGestion } : undefined,
        estado: EstadoSolicitud.APROBADO,
        fraternidadCreada: Not(IsNull()),
      },
      relations: ['fraternidadCreada', 'categoria'],
      order: { createdAt: 'DESC' },
    });

    const fraternidadesMap = new Map<number, any>();

    solicitudes.forEach(sol => {
      const idFrat = sol.fraternidadCreada?.idFraternidad;
      if (!idFrat) return;

      if (!fraternidadesMap.has(idFrat)) {
        fraternidadesMap.set(idFrat, {
          idSolicitud: sol.idSolicitud,
          idFraternidad: idFrat,
          nombreFraternidad: sol.fraternidadCreada?.nombre || sol.nombreFraternidad,
          categoria: sol.categoria?.nombre,
          titular: null,
          suplente: null,
        });
      }

      const entry = fraternidadesMap.get(idFrat);

      const nombreTitular = [sol.delTitularNombres, sol.delTitularPrimerApellido, sol.delTitularSegundoApellido]
        .filter((part) => part?.trim())
        .join(' ')
        .trim();
      const nombreSuplente = [sol.delSuplenteNombres, sol.delSuplentePrimerApellido, sol.delSuplenteSegundoApellido]
        .filter((part) => part?.trim())
        .join(' ')
        .trim();

      if (nombreTitular) {
        entry.titular = {
          nombre: nombreTitular,
          ci: sol.delTitularCi,
          celular: sol.delTitularCelular,
        };
      }
      if (nombreSuplente) {
        entry.suplente = {
          nombre: nombreSuplente,
          ci: sol.delSuplenteCi,
          celular: sol.delSuplenteCelular,
        };
      }
    });

    return Array.from(fraternidadesMap.values()).filter(e => e.titular || e.suplente);
  }

  async registrarAsistencia(data: {
    idFraternidad: number;
    idEvento: number;
    titularAsistio: boolean;
    suplenteAsistio: boolean;
    usuarioId: number;
    motivo?: string;
  }) {
    const gestion = await this.getGestionActiva();
    if (!gestion) throw new NotFoundException('No hay una gestión activa');

    const fraternidad = await this.fraternidadRepo.findOne({ where: { idFraternidad: data.idFraternidad } });
    if (!fraternidad) throw new NotFoundException('Fraternidad no encontrada');

    const evento = await this.eventoRepo.findOne({ where: { idEvento: data.idEvento } });
    if (!evento) throw new NotFoundException('Evento no encontrado');

    const algunoAsistio = data.titularAsistio || data.suplenteAsistio;

    const existente = await this.asistenciaRepo.findOne({
      where: {
        fraternidad: { idFraternidad: data.idFraternidad },
        eventoControl: { idEvento: data.idEvento },
        gestion: { idGestion: gestion.idGestion },
      },
    });

    const observaciones = `Titular: ${data.titularAsistio ? 'Presente' : 'Ausente'} | Suplente: ${data.suplenteAsistio ? 'Presente' : 'Ausente'}`;

    if (existente) {
      existente.asistio = algunoAsistio;
      existente.observaciones = observaciones;
      await this.asistenciaRepo.save(existente);
    } else {
      await this.asistenciaRepo.save(
        this.asistenciaRepo.create({
          gestion,
          fraternidad,
          usuario: { idUsuario: data.usuarioId } as any,
          eventoControl: evento,
          asistio: algunoAsistio,
          observaciones,
        }),
      );
    }

    if (!algunoAsistio) {
      const incidencia = await this.registrarInasistenciaFraternidad({
        idFraternidad: data.idFraternidad,
        idEvento: data.idEvento,
        usuarioId: data.usuarioId,
        motivo: data.motivo,
      });
      return { asistio: false, sancion: true, incidencia };
    }

    await this.removerInasistenciaFraternidad(data.idFraternidad, data.idEvento, gestion.idGestion);

    return { asistio: true, sancion: false };
  }

  private async registrarInasistenciaFraternidad(data: {
    idFraternidad: number;
    idEvento: number;
    usuarioId: number;
    motivo?: string;
  }) {
    const gestion = await this.getGestionActiva();
    if (!gestion) throw new NotFoundException('No hay una gestión activa');

    const yaExiste = await this.incidenciaRepo
      .createQueryBuilder('i')
      .innerJoin('i.infraccion', 'inf')
      .where('i.id_fraternidad = :idFrat', { idFrat: data.idFraternidad })
      .andWhere('i.id_gestion = :idGestion', { idGestion: gestion.idGestion })
      .andWhere('inf.nombre = :nombre', { nombre: 'INASISTENCIA DE DELEGADO' })
      .andWhere('i.observacion LIKE :pat', { pat: `%evento #${data.idEvento}%` })
      .getOne();

    if (yaExiste) return yaExiste;

    const evento = await this.eventoRepo.findOne({ where: { idEvento: data.idEvento } });
    const penalizacion = -Math.abs(
      Number(evento?.puntosPenalizacion ?? PENALIZACION_INASISTENCIA_DEFAULT),
    );

    let infraccion = await this.infraccionRepo.findOne({
      where: { nombre: 'INASISTENCIA DE DELEGADO', gestion: { idGestion: gestion.idGestion } },
    });

    if (!infraccion) {
      infraccion = await this.infraccionRepo.save({
        nombre: 'INASISTENCIA DE DELEGADO',
        tipoImpacto: 'DESCUENTO_DISCIPLINA',
        valorImpacto: penalizacion,
        gestion,
      });
    } else if (Number(infraccion.valorImpacto) !== penalizacion) {
      infraccion.valorImpacto = penalizacion;
      infraccion = await this.infraccionRepo.save(infraccion);
    }

    return this.incidenciaRepo.save(
      this.incidenciaRepo.create({
        gestion,
        fraternidad: { idFraternidad: data.idFraternidad } as any,
        usuario: { idUsuario: data.usuarioId } as any,
        infraccion,
        observacion: `Ningún delegado (titular ni suplente) asistió al evento #${data.idEvento}. ${data.motivo || ''}`.trim(),
      }),
    );
  }

  private async removerInasistenciaFraternidad(idFraternidad: number, idEvento: number, idGestion: number) {
    const incidencias = await this.incidenciaRepo.find({
      where: {
        gestion: { idGestion },
        fraternidad: { idFraternidad },
        infraccion: { nombre: 'INASISTENCIA DE DELEGADO' },
      },
      relations: ['infraccion'],
    });

    for (const inc of incidencias) {
      if (inc.observacion?.includes(`evento #${idEvento}`)) {
        await this.incidenciaRepo.remove(inc);
      }
    }
  }

  async registrarInasistencia(data: { idFraternidad: number, nombreDelegado: string, motivo?: string, usuarioId: number }) {
    return this.registrarInasistenciaFraternidad({
      idFraternidad: data.idFraternidad,
      idEvento: 0,
      usuarioId: data.usuarioId,
      motivo: data.motivo || `Inasistencia del delegado: ${data.nombreDelegado}`,
    });
  }
}
