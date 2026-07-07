import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Brackets } from 'typeorm';
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

const PERSONAS_DIRECTIVA = [
    { prefix: 'presi', checklist: 'Presidente', hasCelular: true },
    { prefix: 'vice', checklist: 'Vicepresidente', hasCelular: true },
    { prefix: 'secGen', checklist: 'Secretario General', hasCelular: false },
    { prefix: 'secHaci', checklist: 'Secretario de Hacienda', hasCelular: false },
    { prefix: 'secActas', checklist: 'Secretario de Actas', hasCelular: false },
    { prefix: 'secPrensa', checklist: 'Secretario de Prensa', hasCelular: false },
    { prefix: 'vocal', checklist: 'Vocal', hasCelular: false },
    { prefix: 'delCogob', checklist: 'Delegado a Co-Gobierno', hasCelular: true },
    { prefix: 'delTitular', checklist: 'Delegado Titular', hasCelular: true },
    { prefix: 'delSuplente', checklist: 'Delegado Suplente', hasCelular: true },
] as const;

const CAMPOS_NOMBRE_PERSONA = PERSONAS_DIRECTIVA.flatMap((p) => [
    `${p.prefix}Nombres`,
    `${p.prefix}PrimerApellido`,
    `${p.prefix}SegundoApellido`,
]);

function buildMapDelegadoKeyToAdmin(): Record<string, string> {
    const map: Record<string, string> = {};
    for (const p of PERSONAS_DIRECTIVA) {
        map[`${p.prefix}Nombres`] = `${p.checklist}-nombres`;
        map[`${p.prefix}PrimerApellido`] = `${p.checklist}-paterno`;
        map[`${p.prefix}SegundoApellido`] = `${p.checklist}-materno`;
        map[`${p.prefix}Ci`] = `${p.checklist}-ci`;
        if (p.hasCelular) map[`${p.prefix}Celular`] = `${p.checklist}-celular`;
        map[`${p.prefix}Nombre`] = `${p.checklist}-nombre`;
    }
    return map;
}

function docFileKeyFromPrefix(prefix: string): string {
    return `ciMatricula${prefix.charAt(0).toUpperCase()}${prefix.slice(1)}`;
}

function docUrlFieldFromPrefix(prefix: string): string {
    return `urlCiMatricula${prefix.charAt(0).toUpperCase()}${prefix.slice(1)}`;
}

const DOCUMENTOS_CI_MATRICULA = PERSONAS_DIRECTIVA.map((p) => ({
    prefix: p.prefix,
    fileKey: docFileKeyFromPrefix(p.prefix),
    urlField: docUrlFieldFromPrefix(p.prefix),
}));

const CAMPOS_CI_DIRECTIVA = PERSONAS_DIRECTIVA.map((p) => `${p.prefix}Ci`);

function encontrarCargoPorCi(solicitud: SolicitudInscripcion, ci: string): string | null {
    const ciNorm = ci.trim();
    for (const p of PERSONAS_DIRECTIVA) {
        const valor = String((solicitud as any)[`${p.prefix}Ci`] || '').trim();
        if (valor && valor === ciNorm) return p.checklist;
    }
    return null;
}

const MAP_DELEGADO_KEY_TO_ADMIN = buildMapDelegadoKeyToAdmin();

function campoEditableEnReedicion(clave: string, checklist: Record<string, any>): boolean {
    const dbClave = MAP_DELEGADO_KEY_TO_ADMIN[clave] || clave;
    if (checklist[dbClave]?.estado === 'X') return true;
    for (const p of PERSONAS_DIRECTIVA) {
        if (
            clave === `${p.prefix}Nombres` ||
            clave === `${p.prefix}PrimerApellido` ||
            clave === `${p.prefix}SegundoApellido`
        ) {
            if (checklist[`${p.checklist}-nombre`]?.estado === 'X') return true;
        }
    }
    return false;
}

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

    private aMayusculas(valor: any): string | null | undefined {
        if (valor === null || valor === undefined) return valor;
        if (typeof valor !== 'string') return valor;
        const trimmed = valor.trim();
        return trimmed ? trimmed.toUpperCase() : trimmed;
    }

    private normalizarSolicitudInscripcion(solicitud: SolicitudInscripcion) {
        const camposTexto = [
            'nombreFraternidad',
            'origenFraternidad',
            'nombreInstitucionExterna',
            ...CAMPOS_NOMBRE_PERSONA,
        ] as const;

        for (const campo of camposTexto) {
            const valor = solicitud[campo];
            if (typeof valor === 'string' && valor) {
                (solicitud as any)[campo] = this.aMayusculas(valor);
            }
        }
    }

    async verificarCiDirectiva(ci: string, excludeSolicitudId?: number) {
        const ciNorm = String(ci || '').trim();
        if (!ciNorm) return { disponible: true };

        const qb = this.solicitudRepo
            .createQueryBuilder('s')
            .leftJoinAndSelect('s.fraternidadCreada', 'fraternidadCreada')
            .where('s.estado IN (:...estados)', {
                estados: [EstadoSolicitud.APROBADO, EstadoSolicitud.PENDIENTE],
            });

        if (excludeSolicitudId) {
            qb.andWhere('s.idSolicitud != :excludeId', { excludeId: excludeSolicitudId });
        }

        qb.andWhere(
            new Brackets((sub) => {
                for (const p of PERSONAS_DIRECTIVA) {
                    sub.orWhere(`TRIM(s.${p.prefix}Ci) = :ciNorm`, { ciNorm });
                }
            }),
        );

        const conflicto = await qb.getOne();
        if (!conflicto) return { disponible: true };

        const cargo = encontrarCargoPorCi(conflicto, ciNorm);
        const nombreFraternidad =
            conflicto.fraternidadCreada?.nombre || conflicto.nombreFraternidad || 'Otra fraternidad';

        return {
            disponible: false,
            nombreFraternidad,
            cargo,
            idSolicitud: conflicto.idSolicitud,
            estado: conflicto.estado,
        };
    }

    private async assertCisDirectivaUnicos(data: any, excludeSolicitudId?: number) {
        const cisIngresados: { ci: string; cargo: string }[] = [];

        for (const p of PERSONAS_DIRECTIVA) {
            const ci = String(data[`${p.prefix}Ci`] || '').trim();
            if (!ci) continue;

            const duplicadoEnFormulario = cisIngresados.find((item) => item.ci === ci);
            if (duplicadoEnFormulario) {
                throw new BadRequestException(
                    `El CI ${ci} está repetido en ${p.checklist} y ${duplicadoEnFormulario.cargo}. Una persona no puede ocupar dos cargos en la misma directiva.`,
                );
            }
            cisIngresados.push({ ci, cargo: p.checklist });
        }

        for (const { ci, cargo } of cisIngresados) {
            const resultado = await this.verificarCiDirectiva(ci, excludeSolicitudId);
            if (!resultado.disponible) {
                throw new BadRequestException(
                    `El CI ${ci} (${cargo}) ya figura como ${resultado.cargo} en la fraternidad "${resultado.nombreFraternidad}". Una persona no puede integrar la directiva de más de una fraternidad.`,
                );
            }
        }
    }

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

        const idCategoria = parseInt(data.idCategoria || existente?.categoria?.idCategoria);
        if (isNaN(idCategoria)) throw new BadRequestException('La categoría es requerida.');

        let checklistReedicion = existente?.revisionChecklist || {};
        if (typeof checklistReedicion === 'string') {
            try { checklistReedicion = JSON.parse(checklistReedicion); } catch { checklistReedicion = {}; }
        }

        const conservarSiNoRechazado = (clave: string, valorNuevo: any, valorExistente: any = undefined) => {
            if (!puedeReeditar || !existente) return valorNuevo;

            // Si el campo estaba vacío originalmente en la solicitud, siempre aceptamos el nuevo valor
            if (valorExistente === null || valorExistente === undefined || valorExistente === '') {
                return valorNuevo;
            }

            return campoEditableEnReedicion(clave, checklistReedicion)
                ? valorNuevo
                : (valorExistente ?? valorNuevo);
        };

        const camposDirectiva: Record<string, any> = {};
        for (const p of PERSONAS_DIRECTIVA) {
            camposDirectiva[`${p.prefix}Nombres`] = conservarSiNoRechazado(
                `${p.prefix}Nombres`,
                data[`${p.prefix}Nombres`],
                existente?.[`${p.prefix}Nombres`],
            );
            camposDirectiva[`${p.prefix}PrimerApellido`] = conservarSiNoRechazado(
                `${p.prefix}PrimerApellido`,
                data[`${p.prefix}PrimerApellido`],
                existente?.[`${p.prefix}PrimerApellido`],
            );
            camposDirectiva[`${p.prefix}SegundoApellido`] = conservarSiNoRechazado(
                `${p.prefix}SegundoApellido`,
                data[`${p.prefix}SegundoApellido`],
                existente?.[`${p.prefix}SegundoApellido`],
            );
            camposDirectiva[`${p.prefix}Ci`] = conservarSiNoRechazado(
                `${p.prefix}Ci`,
                data[`${p.prefix}Ci`],
                existente?.[`${p.prefix}Ci`],
            );
            if (p.hasCelular) {
                camposDirectiva[`${p.prefix}Celular`] = conservarSiNoRechazado(
                    `${p.prefix}Celular`,
                    data[`${p.prefix}Celular`],
                    existente?.[`${p.prefix}Celular`],
                );
            }
        }

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
            ...camposDirectiva,
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
            for (const doc of DOCUMENTOS_CI_MATRICULA) {
                (solicitud as any)[doc.urlField] = conservarArchivo(
                    doc.fileKey,
                    files[doc.fileKey],
                    (existente as any)?.[doc.urlField],
                );
            }
            solicitud.urlCartaCompromiso = conservarArchivo('cartaCompromiso', files.cartaCompromiso, existente?.urlCartaCompromiso);
            solicitud.urlResolucion = conservarArchivo('resolucion', files.resolucion, existente?.urlResolucion);
            solicitud.urlActaDirectiva = conservarArchivo('actaDirectiva', files.actaDirectiva, existente?.urlActaDirectiva);
            solicitud.urlSinDeudasFraternidad = conservarArchivo(
                'sinDeudasFraternidad',
                files.sinDeudasFraternidad,
                existente?.urlSinDeudasFraternidad,
            );
            solicitud.urlSinDeudasAreas = conservarArchivo(
                'sinDeudasAreas',
                files.sinDeudasAreas,
                existente?.urlSinDeudasAreas,
            );
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

        await this.assertCisDirectivaUnicos(data, puedeReeditar ? existente?.idSolicitud : undefined);

        this.normalizarSolicitudInscripcion(solicitud);

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
        fraternidad.nombre = this.aMayusculas((data?.nombre || solicitud.nombreFraternidad)?.trim()) as string;
        fraternidad.origenFraternidad = this.aMayusculas(data?.origenFraternidad || solicitud.origenFraternidad || 'General') as string;
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
