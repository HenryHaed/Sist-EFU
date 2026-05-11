import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { SolicitudInscripcion, EstadoSolicitud } from '../entities/SolicitudInscripcion';
import { Asistencia } from '../entities/Asistencia';
import { Incidencia } from '../entities/Incidencia';
import { Infraccion } from '../entities/Infraccion';
import { Gestion } from '../entities/Gestion';
import { Fraternidad } from '../entities/Fraternidad';

@Injectable()
export class AsistenciasService {
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
  ) {}

  private async getGestionActiva() {
    let g = await this.gestionRepo.findOne({ where: { activa: true } });
    if (!g) g = await this.gestionRepo.findOne({ order: { anio: 'DESC' } });
    return g;
  }

  async getDelegados() {
    const gestion = await this.getGestionActiva();
    
    const solicitudes = await this.solicitudRepo.find({
      where: { 
        gestion: gestion ? { idGestion: gestion.idGestion } : undefined,
        estado: In([EstadoSolicitud.APROBADO, EstadoSolicitud.PENDIENTE, EstadoSolicitud.OBSERVADO])
      },
      relations: ['fraternidadCreada', 'categoria'],
      order: { createdAt: 'DESC' }
    });

    const delegados = [];
    solicitudes.forEach(sol => {
      // Delegado a Co-Gobierno
      if (sol.delCogobNombre && sol.delCogobNombre.trim() !== '') {
        delegados.push({
          idSolicitud: sol.idSolicitud,
          idFraternidad: sol.fraternidadCreada?.idFraternidad,
          nombreFraternidad: sol.nombreFraternidad,
          nombreDelegado: sol.delCogobNombre,
          ciDelegado: sol.delCogobCi,
          celularDelegado: sol.delCogobCelular,
          tipo: 'CO-GOBIERNO',
          categoria: sol.categoria?.nombre
        });
      }
      // Delegado Titular
      if (sol.delTitularNombre && sol.delTitularNombre.trim() !== '') {
        delegados.push({
          idSolicitud: sol.idSolicitud,
          idFraternidad: sol.fraternidadCreada?.idFraternidad,
          nombreFraternidad: sol.nombreFraternidad,
          nombreDelegado: sol.delTitularNombre,
          ciDelegado: sol.delTitularCi,
          celularDelegado: sol.delTitularCelular,
          tipo: 'TITULAR',
          categoria: sol.categoria?.nombre
        });
      }
      // Delegado Suplente
      if (sol.delSuplenteNombre && sol.delSuplenteNombre.trim() !== '') {
        delegados.push({
          idSolicitud: sol.idSolicitud,
          idFraternidad: sol.fraternidadCreada?.idFraternidad,
          nombreFraternidad: sol.nombreFraternidad,
          nombreDelegado: sol.delSuplenteNombre,
          ciDelegado: sol.delSuplenteCi,
          celularDelegado: sol.delSuplenteCelular,
          tipo: 'SUPLENTE',
          categoria: sol.categoria?.nombre
        });
      }
    });

    return delegados;
  }

  async registrarInasistencia(data: { idFraternidad: number, nombreDelegado: string, motivo?: string, usuarioId: number }) {
    const gestion = await this.getGestionActiva();
    if (!gestion) throw new NotFoundException('No hay una gestión activa');

    // 1. Buscar o crear la infracción por inasistencia
    let infraccion = await this.infraccionRepo.findOne({ 
      where: { nombre: 'INASISTENCIA DE DELEGADO', gestion: { idGestion: gestion.idGestion } } 
    });

    if (!infraccion) {
      infraccion = await this.infraccionRepo.save({
        nombre: 'INASISTENCIA DE DELEGADO',
        tipoImpacto: 'DESCUENTO_DISCIPLINA',
        valorImpacto: 10,
        gestion
      });
    }

    // 2. Crear la incidencia
    const incidencia = this.incidenciaRepo.create({
      gestion,
      fraternidad: { idFraternidad: data.idFraternidad } as any,
      usuario: { idUsuario: data.usuarioId } as any,
      infraccion,
      observacion: `Inasistencia del delegado: ${data.nombreDelegado}. ${data.motivo || ''}`
    });

    return await this.incidenciaRepo.save(incidencia);
  }
}
