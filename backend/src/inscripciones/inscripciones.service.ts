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
import { DataSource } from 'typeorm';
import { Fraternidad } from '../entities/Fraternidad';
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
        private readonly dataSource: DataSource,
    ) {}

    async createSolicitud(data: any, usuario: Usuario, files: any) {
        // 1. Obtener Gestión Activa
        const gestion = await this.gestionRepo.findOne({ where: { activa: true } });
        if (!gestion) throw new BadRequestException('No hay una gestión activa configurada.');

        // 2. Verificar si el usuario ya tiene una solicitud para esta gestión
        const existente = await this.solicitudRepo.findOne({
            where: { 
                delegado: { idUsuario: usuario.idUsuario },
                gestion: { idGestion: gestion.idGestion }
            },
            relations: ['categoria']
        });
        const puedeReeditar = existente && existente.estado === EstadoSolicitud.RECHAZADO;
        if (existente && !puedeReeditar) {
            throw new BadRequestException('Ya tienes una solicitud de inscripción en proceso para esta gestión.');
        }

                const MAP_DELEGADO_KEY_TO_ADMIN = {
            'presiNombre': 'Presidente-nombre',
            'presiCi': 'Presidente-ci',
            'presiCelular': 'Presidente-celular',
            
            'viceNombre': 'Vicepresidente-nombre',
            'viceCi': 'Vicepresidente-ci',
            'viceCelular': 'Vicepresidente-celular',
            
            'secGenNombre': 'Secretario General-nombre',
            'secGenCi': 'Secretario General-ci',
            
            'secHaciNombre': 'Secretario de Hacienda-nombre',
            'secHaciCi': 'Secretario de Hacienda-ci',
            
            'secActasNombre': 'Secretario de Actas-nombre',
            'secActasCi': 'Secretario de Actas-ci',
            
            'secPrensaNombre': 'Secretario de Prensa-nombre',
            'secPrensaCi': 'Secretario de Prensa-ci',
            
            'vocalNombre': 'Vocal-nombre',
            'vocalCi': 'Vocal-ci',
            
            'delCogobNombre': 'Delegado a Co-Gobierno-nombre',
            'delCogobCi': 'Delegado a Co-Gobierno-ci',
            'delCogobCelular': 'Delegado a Co-Gobierno-celular',
            
            'delTitularNombre': 'Delegado Titular-nombre',
            'delTitularCi': 'Delegado Titular-ci',
            'delTitularCelular': 'Delegado Titular-celular',
            
            'delSuplenteNombre': 'Delegado Suplente-nombre',
            'delSuplenteCi': 'Delegado Suplente-ci',
            'delSuplenteCelular': 'Delegado Suplente-celular',
        };

        const idCategoria = parseInt(data.idCategoria || existente?.categoria?.idCategoria);
        if (isNaN(idCategoria)) throw new BadRequestException('La categoría es requerida.');

        let checklistReedicion = existente?.revisionChecklist || {};
        if (typeof checklistReedicion === 'string') {
            try { checklistReedicion = JSON.parse(checklistReedicion); } catch { checklistReedicion = {}; }
        }

        const conservarSiNoRechazado = (clave: string, valorNuevo: any, valorExistente: any = undefined) => {
            if (!puedeReeditar || !existente) return valorNuevo;
            const dbClave = MAP_DELEGADO_KEY_TO_ADMIN[clave] || clave;
            
            // Si el campo estaba vacío originalmente en la solicitud, siempre aceptamos el nuevo valor
            if (valorExistente === null || valorExistente === undefined || valorExistente === '') {
                return valorNuevo;
            }
            
            return checklistReedicion[dbClave]?.estado === 'X' ? valorNuevo : (valorExistente ?? valorNuevo);
        };

        // 3. Validar Cronograma según Categoría, salvo cuando se trata de una corrección de una solicitud ya rechazada/observada
        if (!puedeReeditar) {
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
        }

        // 4. Preparar o reutilizar la entidad
        const solicitud = puedeReeditar ? existente : this.solicitudRepo.create({
            gestion,
            delegado: usuario,
            estado: EstadoSolicitud.PENDIENTE,
            revisionChecklist: {},
        });

        Object.assign(solicitud, {
            nombreFraternidad: conservarSiNoRechazado('nombreFraternidad', data.nombreFraternidad, existente?.nombreFraternidad),
            origenFraternidad: conservarSiNoRechazado('origenFraternidad', data.origenFraternidad || 'General', existente?.origenFraternidad || 'General'),
            instanciaRepresentacion: conservarSiNoRechazado('instancia', data.instanciaRepresentacion, existente?.instanciaRepresentacion),
            nombreInstitucionExterna: conservarSiNoRechazado('institucionExterna', data.nombreInstitucionExterna, existente?.nombreInstitucionExterna),
            categoria: { idCategoria: conservarSiNoRechazado('categoria', idCategoria, existente?.categoria?.idCategoria) } as any,
            // Datos de la directiva
            presiNombre: conservarSiNoRechazado('presiNombre', data.presiNombre, existente?.presiNombre),
            presiCi: conservarSiNoRechazado('presiCi', data.presiCi, existente?.presiCi),
            presiCelular: conservarSiNoRechazado('presiCelular', data.presiCelular, existente?.presiCelular),
            viceNombre: conservarSiNoRechazado('viceNombre', data.viceNombre, existente?.viceNombre),
            viceCi: conservarSiNoRechazado('viceCi', data.viceCi, existente?.viceCi),
            viceCelular: conservarSiNoRechazado('viceCelular', data.viceCelular, existente?.viceCelular),
            secGenNombre: conservarSiNoRechazado('secGenNombre', data.secGenNombre, existente?.secGenNombre),
            secGenCi: conservarSiNoRechazado('secGenCi', data.secGenCi, existente?.secGenCi),
            secHaciNombre: conservarSiNoRechazado('secHaciNombre', data.secHaciNombre, existente?.secHaciNombre),
            secHaciCi: conservarSiNoRechazado('secHaciCi', data.secHaciCi, existente?.secHaciCi),
            secActasNombre: conservarSiNoRechazado('secActasNombre', data.secActasNombre, existente?.secActasNombre),
            secActasCi: conservarSiNoRechazado('secActasCi', data.secActasCi, existente?.secActasCi),
            secPrensaNombre: conservarSiNoRechazado('secPrensaNombre', data.secPrensaNombre, existente?.secPrensaNombre),
            secPrensaCi: conservarSiNoRechazado('secPrensaCi', data.secPrensaCi, existente?.secPrensaCi),
            vocalNombre: conservarSiNoRechazado('vocalNombre', data.vocalNombre, existente?.vocalNombre),
            vocalCi: conservarSiNoRechazado('vocalCi', data.vocalCi, existente?.vocalCi),
            delCogobNombre: conservarSiNoRechazado('delCogobNombre', data.delCogobNombre, existente?.delCogobNombre),
            delCogobCi: conservarSiNoRechazado('delCogobCi', data.delCogobCi, existente?.delCogobCi),
            delCogobCelular: conservarSiNoRechazado('delCogobCelular', data.delCogobCelular, existente?.delCogobCelular),
            delTitularNombre: conservarSiNoRechazado('delTitularNombre', data.delTitularNombre, existente?.delTitularNombre),
            delTitularCi: conservarSiNoRechazado('delTitularCi', data.delTitularCi, existente?.delTitularCi),
            delTitularCelular: conservarSiNoRechazado('delTitularCelular', data.delTitularCelular, existente?.delTitularCelular),
            delSuplenteNombre: conservarSiNoRechazado('delSuplenteNombre', data.delSuplenteNombre, existente?.delSuplenteNombre),
            delSuplenteCi: conservarSiNoRechazado('delSuplenteCi', data.delSuplenteCi, existente?.delSuplenteCi),
            delSuplenteCelular: conservarSiNoRechazado('delSuplenteCelular', data.delSuplenteCelular, existente?.delSuplenteCelular),
            gestion,
            delegado: usuario,
            estado: EstadoSolicitud.PENDIENTE,
        });

        // Relaciones opcionales con validación de ID o conservación
        if (puedeReeditar && existente?.facultad && checklistReedicion['facultad']?.estado !== 'X') {
            solicitud.facultad = existente.facultad;
        } else {
            solicitud.facultad = (data.idFacultad && !isNaN(parseInt(data.idFacultad))) ? { idFacultad: parseInt(data.idFacultad) } as any : null;
        }

        if (puedeReeditar && existente?.carrera && checklistReedicion['carrera']?.estado !== 'X') {
            solicitud.carrera = existente.carrera;
        } else {
            solicitud.carrera = (data.idCarrera && !isNaN(parseInt(data.idCarrera))) ? { idCarrera: parseInt(data.idCarrera) } as any : null;
        }

        if (puedeReeditar && existente?.institucionExterna && checklistReedicion['institucionExterna']?.estado !== 'X') {
            solicitud.institucionExterna = existente.institucionExterna;
        } else {
            solicitud.institucionExterna = (data.idInstitucionExterna && !isNaN(parseInt(data.idInstitucionExterna))) ? { idInstitucionExterna: parseInt(data.idInstitucionExterna) } as any : null;
        }

        // 5. Asignar URLs de archivos o conservar las existentes al corregir una solicitud
        const conservarArchivo = (campo: string, archivoSubido: any, urlExistente: string) => {
            if (archivoSubido) {
                if (!puedeReeditar || !urlExistente || checklistReedicion[campo]?.estado === 'X') {
                    return `/uploads/Docs_Registro/${archivoSubido[0].filename}`;
                }
            }
            return urlExistente || null;
        };

        if (files) {
            solicitud.urlCiMatriculaPreViceDel = conservarArchivo('ciMatriculaPreViceDel', files.ciMatriculaPreViceDel, existente?.urlCiMatriculaPreViceDel);
            solicitud.urlCiMatriculaSecVocDel = conservarArchivo('ciMatriculaSecVocDel', files.ciMatriculaSecVocDel, existente?.urlCiMatriculaSecVocDel);
            solicitud.urlCartaCompromiso = conservarArchivo('cartaCompromiso', files.cartaCompromiso, existente?.urlCartaCompromiso);
            solicitud.urlResolucion = conservarArchivo('resolucion', files.resolucion, existente?.urlResolucion);
            solicitud.urlActaDirectiva = conservarArchivo('actaDirectiva', files.actaDirectiva, existente?.urlActaDirectiva);
        }

        if (puedeReeditar) {
            solicitud.estado = EstadoSolicitud.PENDIENTE;
            
            // Restablecer los elementos de revisión que estaban con X a PENDIENTE,
            // ya que el delegado los acaba de corregir.
            let updatedChecklist = solicitud.revisionChecklist || {};
            if (typeof updatedChecklist === 'string') {
                try { updatedChecklist = JSON.parse(updatedChecklist); } catch { updatedChecklist = {}; }
            }
            for (const key of Object.keys(updatedChecklist)) {
                if (updatedChecklist[key]?.estado === 'X') {
                    updatedChecklist[key].estado = 'PENDIENTE';
                    if (updatedChecklist[key].comentario) {
                        delete updatedChecklist[key].comentario;
                    }
                }
            }
            solicitud.revisionChecklist = updatedChecklist;
        }

        return await this.solicitudRepo.save(solicitud);
    }

    async getMisSolicitudes(idUsuario: number) {
        return await this.solicitudRepo.find({
            where: { delegado: { idUsuario } },
            relations: ['gestion', 'categoria', 'facultad', 'carrera', 'fraternidadCreada'],
            order: { createdAt: 'DESC' }
        });
    }

    async getSolicitudById(id: number) {
        const sol = await this.solicitudRepo.findOne({
            where: { idSolicitud: id },
            relations: ['gestion', 'categoria', 'facultad', 'carrera', 'institucionExterna', 'delegado', 'fraternidadCreada']
        });
        if (!sol) throw new NotFoundException('Solicitud no encontrada');
        return sol;
    }

    async getAllSolicitudes(estado?: string) {
        const where: any = {};
        if (estado) where.estado = estado;
        return await this.solicitudRepo.find({
            where,
            relations: ['gestion', 'categoria', 'facultad', 'carrera', 'institucionExterna', 'delegado', 'fraternidadCreada'],
            order: { createdAt: 'DESC' }
        });
    }

    async updateEstadoSolicitud(id: number, estado: string, observaciones?: string, revisionChecklist?: any) {
        const sol = await this.solicitudRepo.findOne({
            where: { idSolicitud: id },
            relations: ['fraternidadCreada'],
        });
        if (!sol) throw new NotFoundException('Solicitud no encontrada');

        const estadoAnterior = sol.estado;
        const checklistNormalizado = revisionChecklist || sol.revisionChecklist || {};
        if (estado === EstadoSolicitud.APROBADO) {
            const items = Object.values(checklistNormalizado);
            const todosOk = items.length > 0 && items.every((item: any) => item?.estado === 'OK');
            if (!todosOk) {
                throw new BadRequestException('Solo se puede aprobar una solicitud cuando todos los datos revisados están marcados como correctos.');
            }
        }
        const estadosPermitidos = [EstadoSolicitud.PENDIENTE, EstadoSolicitud.APROBADO, EstadoSolicitud.RECHAZADO];
        if (!estadosPermitidos.includes(estado as EstadoSolicitud)) {
            throw new BadRequestException(`El estado '${estado}' no es válido. Se permite: PENDIENTE, APROBADO, RECHAZADO.`);
        }
        sol.estado = estado as EstadoSolicitud;
        if (observaciones !== undefined) sol.observaciones = observaciones;
        if (revisionChecklist !== undefined) sol.revisionChecklist = revisionChecklist || {};
        await this.solicitudRepo.save(sol);

        if (estado === EstadoSolicitud.APROBADO && !sol.fraternidadCreada) {
            try {
                await this.inscribirDesdeSolicitud(id);
            } catch (error) {
                sol.estado = estadoAnterior;
                await this.solicitudRepo.save(sol);
                throw error;
            }
        }

        return this.getSolicitudById(id);
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

    // ── Inscripción Oficial Transaccional (Llamado por Administrador) ──────────────────────────────────
    private aplicarDatosFraternidad(
        fraternidad: Fraternidad,
        solicitud: SolicitudInscripcion,
        data?: any,
    ) {
        fraternidad.nombre = (data?.nombre || solicitud.nombreFraternidad)?.trim();
        fraternidad.origenFraternidad = data?.origenFraternidad || solicitud.origenFraternidad || 'General';
        fraternidad.nivelRepresentacion = data?.nivelRepresentacion || solicitud.instanciaRepresentacion;

        if (data?.categoria?.idCategoria) {
            fraternidad.categoria = { idCategoria: data.categoria.idCategoria } as any;
        } else if (solicitud.categoria) {
            fraternidad.categoria = solicitud.categoria;
        }

        if (data?.idFacultad) {
            fraternidad.facultad = { idFacultad: data.idFacultad } as any;
        } else if (solicitud.facultad) {
            fraternidad.facultad = solicitud.facultad;
        }

        if (data?.idCarrera) {
            fraternidad.carrera = { idCarrera: data.idCarrera } as any;
        } else if (solicitud.carrera) {
            fraternidad.carrera = solicitud.carrera;
        }

        if (data?.idInstitucionExterna) {
            fraternidad.institucionExterna = { idInstitucion: data.idInstitucionExterna } as any;
        } else if (solicitud.institucionExterna) {
            fraternidad.institucionExterna = solicitud.institucionExterna;
        }

        if (solicitud.gestion) {
            fraternidad.gestion = solicitud.gestion;
        }

        if (data?.habilitadoEfu !== undefined) {
            fraternidad.habilitadoEfu = data.habilitadoEfu;
        } else if (fraternidad.habilitadoEfu === undefined || fraternidad.habilitadoEfu === null) {
            fraternidad.habilitadoEfu = true;
        }
    }

    async inscribirDesdeSolicitud(idSolicitud: number, data?: any) {
        const solicitud = await this.solicitudRepo.findOne({
            where: { idSolicitud },
            relations: ['delegado', 'fraternidadCreada', 'categoria', 'facultad', 'carrera', 'institucionExterna', 'gestion', 'delegado.fraternidad']
        });

        if (!solicitud) {
            throw new NotFoundException('Solicitud no encontrada.');
        }

        if (solicitud.estado !== EstadoSolicitud.APROBADO) {
            throw new BadRequestException('La solicitud debe estar APROBADA para realizar la inscripción oficial.');
        }

        if (solicitud.fraternidadCreada) {
            return {
                message: 'Inscripción Oficial completada exitosamente.',
                fraternidad: solicitud.fraternidadCreada,
            };
        }

        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            const nombreFraternidad = (data?.nombre || solicitud.nombreFraternidad)?.trim();
            if (!nombreFraternidad) {
                throw new BadRequestException('La solicitud no tiene un nombre de fraternidad válido.');
            }

            let fraternidad = solicitud.delegado?.fraternidad
                ? await queryRunner.manager.findOne(Fraternidad, {
                    where: { idFraternidad: solicitud.delegado.fraternidad.idFraternidad },
                })
                : null;

            if (!fraternidad) {
                fraternidad = await queryRunner.manager
                    .createQueryBuilder(Fraternidad, 'f')
                    .where('LOWER(TRIM(f.nombre)) = LOWER(:nombre)', { nombre: nombreFraternidad })
                    .getOne();
            }

            if (fraternidad) {
                this.aplicarDatosFraternidad(fraternidad, solicitud, data);
            } else {
                fraternidad = new Fraternidad();
                this.aplicarDatosFraternidad(fraternidad, solicitud, data);
                if (!fraternidad.gestion) {
                    const gestionActiva = await this.gestionRepo.findOne({ where: { activa: true } });
                    if (gestionActiva) fraternidad.gestion = gestionActiva;
                }
            }

            const savedFraternidad = await queryRunner.manager.save(Fraternidad, fraternidad);

            solicitud.fraternidadCreada = savedFraternidad;
            await queryRunner.manager.save(SolicitudInscripcion, solicitud);

            if (solicitud.delegado) {
                const del = await queryRunner.manager.findOne(Usuario, { where: { idUsuario: solicitud.delegado.idUsuario } });
                if (del) {
                    del.fraternidad = savedFraternidad;
                    await queryRunner.manager.save(Usuario, del);
                }
            }

            await queryRunner.commitTransaction();
            return { message: 'Inscripción Oficial completada exitosamente.', fraternidad: savedFraternidad };
        } catch (error) {
            await queryRunner.rollbackTransaction();
            console.error('Transaction Error:', error);

            if (error.code === '23505' || error.errno === 1062) {
                throw new BadRequestException(
                    `Ya existe una fraternidad registrada con el nombre "${(data?.nombre || solicitud.nombreFraternidad)?.trim()}". Verifique el listado de fraternidades.`,
                );
            }

            if (error instanceof BadRequestException || error instanceof NotFoundException) {
                throw error;
            }

            throw new BadRequestException('Error al procesar la inscripción oficial: ' + error.message);
        } finally {
            await queryRunner.release();
        }
    }
}
