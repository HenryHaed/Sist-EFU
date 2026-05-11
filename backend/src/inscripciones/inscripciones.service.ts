import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SolicitudInscripcion, EstadoSolicitud } from '../entities/SolicitudInscripcion';
import { Gestion } from '../entities/Gestion';
import { CronogramaInscripcion } from '../entities/CronogramaInscripcion';
import { Usuario } from '../entities/Usuario';
import { Categoria } from '../entities/Categoria';
import { Facultad } from '../entities/Facultad';
import { Carrera } from '../entities/Carrera';
import { InstitucionExterna } from '../entities/InstitucionExterna';

@Injectable()
export class InscripcionesService {
    constructor(
        @InjectRepository(SolicitudInscripcion)
        private readonly solicitudRepo: Repository<SolicitudInscripcion>,
        @InjectRepository(Gestion)
        private readonly gestionRepo: Repository<Gestion>,
        @InjectRepository(CronogramaInscripcion)
        private readonly cronogramaRepo: Repository<CronogramaInscripcion>,
        @InjectRepository(Categoria)
        private readonly categoriaRepo: Repository<Categoria>,
        @InjectRepository(Facultad)
        private readonly facultadRepo: Repository<Facultad>,
        @InjectRepository(Carrera)
        private readonly carreraRepo: Repository<Carrera>,
        @InjectRepository(InstitucionExterna)
        private readonly institucionRepo: Repository<InstitucionExterna>,
    ) {}

    async createSolicitud(data: any, usuario: Usuario, files: any) {
        // 1. Obtener Gestión Activa
        const gestion = await this.gestionRepo.findOne({ where: { activa: true } });
        if (!gestion) throw new BadRequestException('No hay una gestión activa configurada.');

        // 2. Verificar si el usuario ya tiene una solicitud pendiente o aprobada para esta gestión
        const existente = await this.solicitudRepo.findOne({
            where: { 
                representante: { idUsuario: usuario.idUsuario },
                gestion: { idGestion: gestion.idGestion }
            }
        });
        if (existente && existente.estado !== EstadoSolicitud.RECHAZADO) {
            throw new BadRequestException('Ya tienes una solicitud de inscripción en proceso para esta gestión.');
        }

        // 3. Validar Cronograma según Categoría
        const idCategoria = parseInt(data.idCategoria);
        if (isNaN(idCategoria)) throw new BadRequestException('La categoría es requerida.');

        const cronograma = await this.cronogramaRepo.findOne({
            where: { 
                gestion: { idGestion: gestion.idGestion },
                categoria: { idCategoria: idCategoria }
            }
        });

        if (!cronograma) {
            throw new BadRequestException('No se ha definido un cronograma para esta categoría.');
        }

        const ahora = new Date();
        if (ahora < cronograma.fechaInicio) {
            throw new BadRequestException(`El periodo de inscripción para esta categoría inicia el ${cronograma.fechaInicio.toLocaleDateString()}`);
        }
        if (ahora > cronograma.fechaFin) {
            throw new BadRequestException(`El periodo de inscripción para esta categoría finalizó el ${cronograma.fechaFin.toLocaleDateString()}`);
        }

        // 4. Preparar la entidad
        const solicitud = this.solicitudRepo.create({
            nombreFraternidad: data.nombreFraternidad,
            instanciaRepresentacion: data.instanciaRepresentacion,
            nombreInstitucionExterna: data.nombreInstitucionExterna,
            gestion,
            representante: usuario,
            categoria: { idCategoria } as any,
            estado: EstadoSolicitud.PENDIENTE,
            // Datos de la directiva
            presiNombre: data.presiNombre,
            presiCi: data.presiCi,
            presiCelular: data.presiCelular,
            viceNombre: data.viceNombre,
            viceCi: data.viceCi,
            viceCelular: data.viceCelular,
            secGenNombre: data.secGenNombre,
            secGenCi: data.secGenCi,
            secHaciNombre: data.secHaciNombre,
            secHaciCi: data.secHaciCi,
            secActasNombre: data.secActasNombre,
            secActasCi: data.secActasCi,
            secPrensaNombre: data.secPrensaNombre,
            secPrensaCi: data.secPrensaCi,
            vocalNombre: data.vocalNombre,
            vocalCi: data.vocalCi,
            delCogobNombre: data.delCogobNombre,
            delCogobCi: data.delCogobCi,
            delCogobCelular: data.delCogobCelular,
            delTitularNombre: data.delTitularNombre,
            delTitularCi: data.delTitularCi,
            delTitularCelular: data.delTitularCelular,
            delSuplenteNombre: data.delSuplenteNombre,
            delSuplenteCi: data.delSuplenteCi,
            delSuplenteCelular: data.delSuplenteCelular,
        });

        // Relaciones opcionales con validación de ID
        if (data.idFacultad && !isNaN(parseInt(data.idFacultad))) {
            solicitud.facultad = { idFacultad: parseInt(data.idFacultad) } as any;
        }
        if (data.idCarrera && !isNaN(parseInt(data.idCarrera))) {
            solicitud.carrera = { idCarrera: parseInt(data.idCarrera) } as any;
        }
        if (data.idInstitucionExterna && !isNaN(parseInt(data.idInstitucionExterna))) {
            solicitud.institucionExterna = { idInstitucionExterna: parseInt(data.idInstitucionExterna) } as any;
        }

        // 5. Asignar URLs de archivos
        if (files) {
            if (files.ciRepresentante) solicitud.urlCiRepresentante = `/uploads/Docs_Registro/${files.ciRepresentante[0].filename}`;
            if (files.matriculaBoleta) solicitud.urlMatriculaBoleta = `/uploads/Docs_Registro/${files.matriculaBoleta[0].filename}`;
            if (files.cartaCompromiso) solicitud.urlCartaCompromiso = `/uploads/Docs_Registro/${files.cartaCompromiso[0].filename}`;
            if (files.resolucion) solicitud.urlResolucion = `/uploads/Docs_Registro/${files.resolucion[0].filename}`;
            if (files.actaDirectiva) solicitud.urlActaDirectiva = `/uploads/Docs_Registro/${files.actaDirectiva[0].filename}`;
        }

        return await this.solicitudRepo.save(solicitud);
    }

    async getMisSolicitudes(idUsuario: number) {
        return await this.solicitudRepo.find({
            where: { representante: { idUsuario } },
            relations: ['gestion', 'categoria', 'facultad', 'carrera', 'fraternidadCreada'],
            order: { createdAt: 'DESC' }
        });
    }

    async getSolicitudById(id: number) {
        const sol = await this.solicitudRepo.findOne({
            where: { idSolicitud: id },
            relations: ['gestion', 'categoria', 'facultad', 'carrera', 'institucionExterna', 'representante']
        });
        if (!sol) throw new NotFoundException('Solicitud no encontrada');
        return sol;
    }

    async getAllSolicitudes(estado?: string) {
        const where: any = {};
        if (estado) where.estado = estado;
        return await this.solicitudRepo.find({
            where,
            relations: ['gestion', 'categoria', 'facultad', 'carrera', 'institucionExterna', 'representante'],
            order: { createdAt: 'DESC' }
        });
    }

    async updateEstadoSolicitud(id: number, estado: string, observaciones?: string) {
        const sol = await this.solicitudRepo.findOne({ where: { idSolicitud: id } });
        if (!sol) throw new NotFoundException('Solicitud no encontrada');
        sol.estado = estado as EstadoSolicitud;
        if (observaciones !== undefined) sol.observaciones = observaciones;
        return this.solicitudRepo.save(sol);
    }

    // ── Cronograma Management ──────────────────────────────────────────────

    async getCronogramasByGestion(idGestion: number) {
        return await this.cronogramaRepo.find({
            where: { gestion: { idGestion } },
            relations: ['categoria']
        });
    }

    async upsertCronograma(data: { idGestion: number, idCategoria: number, fechaInicio: Date, fechaFin: Date }) {
        let cronograma = await this.cronogramaRepo.findOne({
            where: { 
                gestion: { idGestion: data.idGestion },
                categoria: { idCategoria: data.idCategoria }
            }
        });

        if (cronograma) {
            cronograma.fechaInicio = new Date(data.fechaInicio);
            cronograma.fechaFin = new Date(data.fechaFin);
        } else {
            cronograma = this.cronogramaRepo.create({
                gestion: { idGestion: data.idGestion } as any,
                categoria: { idCategoria: data.idCategoria } as any,
                fechaInicio: new Date(data.fechaInicio),
                fechaFin: new Date(data.fechaFin)
            });
        }

        return await this.cronogramaRepo.save(cronograma);
    }
}
