import { Injectable, BadRequestException, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Brackets, ILike } from 'typeorm';
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
import { TipoDanza } from '../entities/TipoDanza';
import { MailService } from '../mail/mail.service';
import { Evaluacion } from '../entities/Evaluacion';
import { Incidencia } from '../entities/Incidencia';
import { Asistencia } from '../entities/Asistencia';

const PERSONAS_DIRECTIVA = [
    { prefix: 'presi', checklist: 'Presidente', hasCelular: true, required: true },
    { prefix: 'vice', checklist: 'Vicepresidente', hasCelular: true, required: true },
    { prefix: 'secGen', checklist: 'Secretario General', hasCelular: false, required: false },
    { prefix: 'secHaci', checklist: 'Secretario de Hacienda', hasCelular: false, required: true },
    { prefix: 'secActas', checklist: 'Secretario de Actas', hasCelular: false, required: false },
    { prefix: 'secPrensa', checklist: 'Secretario de Prensa', hasCelular: false, required: false },
    { prefix: 'vocal', checklist: 'Vocal', hasCelular: false, required: false },
    { prefix: 'delCogob', checklist: 'Delegado a Co-Gobierno', hasCelular: true, required: true },
    { prefix: 'delTitular', checklist: 'Delegado Titular', hasCelular: true, required: true },
    { prefix: 'delSuplente', checklist: 'Delegado Suplente', hasCelular: true, required: true },
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
        map[`${p.prefix}CiComplemento`] = `${p.checklist}-ci-complemento`;
        if (p.hasCelular) map[`${p.prefix}Celular`] = `${p.checklist}-celular`;
        map[`${p.prefix}Nombre`] = `${p.checklist}-nombre`;
    }
    return map;
}

const TIPOS_DOCUMENTO_PERSONA = [
    { type: 'ci', filePrefix: 'ci', urlInfix: 'Ci', label: 'CI' },
    { type: 'matricula', filePrefix: 'matricula', urlInfix: 'Matricula', label: 'Matrícula' },
    { type: 'deudaFrat', filePrefix: 'sinDeudasFraternidad', urlInfix: 'SinDeudasFraternidad', label: 'No deudas fraternidad' },
    { type: 'deudaAreas', filePrefix: 'sinDeudasAreas', urlInfix: 'SinDeudasAreas', label: 'No deudas áreas' },
] as const;

function capitalizePrefix(prefix: string): string {
    return `${prefix.charAt(0).toUpperCase()}${prefix.slice(1)}`;
}

function docFileKey(prefix: string, type: typeof TIPOS_DOCUMENTO_PERSONA[number]['type']): string {
    const doc = TIPOS_DOCUMENTO_PERSONA.find((d) => d.type === type)!;
    return `${doc.filePrefix}${capitalizePrefix(prefix)}`;
}

function docUrlField(prefix: string, type: typeof TIPOS_DOCUMENTO_PERSONA[number]['type']): string {
    const doc = TIPOS_DOCUMENTO_PERSONA.find((d) => d.type === type)!;
    return `url${doc.urlInfix}${capitalizePrefix(prefix)}`;
}

const DOCUMENTOS_POR_PERSONA = PERSONAS_DIRECTIVA.flatMap((p) =>
    TIPOS_DOCUMENTO_PERSONA.map((doc) => ({
        prefix: p.prefix,
        checklist: p.checklist,
        required: p.required,
        type: doc.type,
        label: doc.label,
        fileKey: docFileKey(p.prefix, doc.type),
        urlField: docUrlField(p.prefix, doc.type),
    })),
);

const DOCUMENTOS_INSTITUCIONALES = [
    { key: 'cartaCompromiso', label: 'Carta de Compromiso', url: 'urlCartaCompromiso' as const },
    { key: 'resolucion', label: 'Resolución HCU/HCF/HCC', url: 'urlResolucion' as const },
    { key: 'actaDirectiva', label: 'Acta de Conformación', url: 'urlActaDirectiva' as const },
];

const CAMPOS_CI_DIRECTIVA = PERSONAS_DIRECTIVA.flatMap((p) => [`${p.prefix}Ci`, `${p.prefix}CiComplemento`]);

function normalizarComplementoCi(val?: string | null): string {
    return String(val || '').trim().toUpperCase().replace(/\s/g, '');
}

function ciIdentificador(ci: string, complemento?: string | null): string {
    const base = String(ci || '').trim();
    const comp = normalizarComplementoCi(complemento);
    return `${base}|${comp}`;
}

function encontrarCargoPorCi(solicitud: SolicitudInscripcion, ci: string, complemento?: string | null): string | null {
    const idBuscado = ciIdentificador(ci, complemento);
    for (const p of PERSONAS_DIRECTIVA) {
        const valor = ciIdentificador(
            String((solicitud as any)[`${p.prefix}Ci`] || ''),
            (solicitud as any)[`${p.prefix}CiComplemento`],
        );
        if (valor.replace(/^\|/, '') && valor === idBuscado) return p.checklist;
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
            clave === `${p.prefix}SegundoApellido` ||
            clave === `${p.prefix}Ci` ||
            clave === `${p.prefix}CiComplemento`
        ) {
            if (checklist[`${p.checklist}-nombre`]?.estado === 'X') return true;
        }
    }
    return false;
}

@Injectable()
export class InscripcionesService {
    private readonly logger = new Logger(InscripcionesService.name);

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
        @InjectRepository(TipoDanza)
        private readonly tipoDanzaRepo: Repository<TipoDanza>,
        @InjectRepository(Fraternidad)
        private readonly fraternidadRepo: Repository<Fraternidad>,
        @InjectRepository(Usuario)
        private readonly usuarioRepo: Repository<Usuario>,
        @InjectRepository(Evaluacion)
        private readonly evaluacionRepo: Repository<Evaluacion>,
        @InjectRepository(Incidencia)
        private readonly incidenciaRepo: Repository<Incidencia>,
        @InjectRepository(Asistencia)
        private readonly asistenciaRepo: Repository<Asistencia>,
        private readonly dataSource: DataSource,
        private readonly mailService: MailService,
    ) {}

    private async resolverTipoDanza(idTipoDanza: unknown, tipoDanzaOtro?: unknown): Promise<TipoDanza> {
        if (String(idTipoDanza).toLowerCase() !== 'otro') {
            const id = Number.parseInt(String(idTipoDanza), 10);
            if (Number.isNaN(id)) {
                throw new BadRequestException('El tipo de danza es requerido.');
            }
            const tipo = await this.tipoDanzaRepo.findOne({ where: { idTipoDanza: id, activo: true } });
            if (!tipo) {
                throw new BadRequestException('El tipo de danza seleccionado no es válido.');
            }
            return tipo;
        }

        const nombre = String(tipoDanzaOtro || '').trim().replace(/\s+/g, ' ');
        if (nombre.length < 2 || nombre.length > 120 || nombre.toLocaleLowerCase('es') === 'otro') {
            throw new BadRequestException('Ingresa un tipo de danza válido (2 a 120 caracteres).');
        }

        const existente = await this.tipoDanzaRepo.findOne({ where: { nombre: ILike(nombre) } });
        if (existente) {
            if (!existente.activo) {
                existente.activo = true;
                await this.tipoDanzaRepo.save(existente);
            }
            return existente;
        }

        return this.tipoDanzaRepo.save(
            this.tipoDanzaRepo.create({ nombre, orden: 1000, activo: true }),
        );
    }

    private async eliminarFraternidadVinculada(idFraternidad: number) {
        await this.evaluacionRepo.delete({ fraternidad: { idFraternidad } });
        await this.incidenciaRepo.delete({ fraternidad: { idFraternidad } });
        await this.asistenciaRepo.delete({ fraternidad: { idFraternidad } });
        await this.usuarioRepo
            .createQueryBuilder()
            .update()
            .set({ fraternidad: null })
            .where('id_fraternidad = :id', { id: idFraternidad })
            .execute();
        await this.solicitudRepo
            .createQueryBuilder()
            .update()
            .set({ fraternidadCreada: null })
            .where('id_fraternidad_creada = :id', { id: idFraternidad })
            .execute();
        await this.fraternidadRepo.delete(idFraternidad);
    }

    private aMayusculas(valor: any): string | null | undefined {
        if (valor === null || valor === undefined) return valor;
        if (typeof valor !== 'string') return valor;
        const trimmed = valor.trim();
        return trimmed ? trimmed.toUpperCase() : trimmed;
    }

    private normalizarSolicitudInscripcion(solicitud: SolicitudInscripcion) {
        const camposTexto = [
            'nombreFraternidad',
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

    async verificarCiDirectiva(ci: string, complemento?: string, excludeSolicitudId?: number) {
        const ciNorm = String(ci || '').trim();
        if (!ciNorm) return { disponible: true };
        const compNorm = normalizarComplementoCi(complemento);

        const qb = this.solicitudRepo
            .createQueryBuilder('s')
            .leftJoinAndSelect('s.fraternidadCreada', 'fraternidadCreada')
            .where('s.estado IN (:...estados)', {
                estados: [EstadoSolicitud.APROBADO, EstadoSolicitud.PENDIENTE, EstadoSolicitud.OBSERVADO],
            });

        if (excludeSolicitudId) {
            qb.andWhere('s.idSolicitud != :excludeId', { excludeId: excludeSolicitudId });
        }

        qb.andWhere(
            new Brackets((sub) => {
                for (const p of PERSONAS_DIRECTIVA) {
                    sub.orWhere(
                        `TRIM(s.${p.prefix}Ci) = :ciNorm AND COALESCE(UPPER(REPLACE(TRIM(s.${p.prefix}CiComplemento), ' ', '')), '') = :compNorm`,
                        { ciNorm, compNorm },
                    );
                }
            }),
        );

        const conflicto = await qb.getOne();
        if (!conflicto) return { disponible: true };

        const cargo = encontrarCargoPorCi(conflicto, ciNorm, compNorm);
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
        // Una misma persona PUEDE ocupar varios cargos dentro de la misma fraternidad.
        // Lo que no se permite es figurar en la directiva de OTRA fraternidad.
        const cisUnicos = new Map<string, string>();

        for (const p of PERSONAS_DIRECTIVA) {
            const ci = String(data[`${p.prefix}Ci`] || '').trim();
            if (!ci) continue;
            const complemento = normalizarComplementoCi(data[`${p.prefix}CiComplemento`]);
            const id = ciIdentificador(ci, complemento);
            if (!cisUnicos.has(id)) cisUnicos.set(id, p.checklist);
        }

        for (const [id, cargo] of cisUnicos.entries()) {
            const [ci, complemento = ''] = id.split('|');
            const resultado = await this.verificarCiDirectiva(ci, complemento, excludeSolicitudId);
            if (!resultado.disponible) {
                throw new BadRequestException(
                    `El CI ${ci}${complemento ? ` ${complemento}` : ''} (${cargo}) ya figura como ${resultado.cargo} en la fraternidad "${resultado.nombreFraternidad}". Una persona no puede integrar la directiva de más de una fraternidad.`,
                );
            }
        }
    }

    private assertCargosObligatorios(data: any) {
        const faltantes: string[] = [];
        for (const p of PERSONAS_DIRECTIVA) {
            if (!p.required) continue;
            const nombres = String(data[`${p.prefix}Nombres`] || '').trim();
            const paterno = String(data[`${p.prefix}PrimerApellido`] || '').trim();
            const ci = String(data[`${p.prefix}Ci`] || '').trim();
            if (!nombres || !paterno || !ci) {
                faltantes.push(p.checklist);
                continue;
            }
            if (p.hasCelular) {
                const celular = String(data[`${p.prefix}Celular`] || '').trim();
                if (!celular) faltantes.push(`${p.checklist} (celular)`);
            }
        }
        if (faltantes.length) {
            throw new BadRequestException(
                `Completa los cargos obligatorios: ${faltantes.join(', ')}.`,
            );
        }
    }

    private assertDocumentosObligatorios(solicitud: SolicitudInscripcion, files: any, existente: SolicitudInscripcion | null) {
        const faltantes: string[] = [];
        for (const doc of DOCUMENTOS_POR_PERSONA) {
            if (!doc.required) continue;
            const tiene =
                Boolean(files?.[doc.fileKey]) ||
                Boolean((solicitud as any)[doc.urlField]) ||
                Boolean(existente && (existente as any)[doc.urlField]);
            if (!tiene) faltantes.push(`${doc.label} de ${doc.checklist}`);
        }
        for (const doc of DOCUMENTOS_INSTITUCIONALES) {
            const tiene =
                Boolean(files?.[doc.key]) ||
                Boolean((solicitud as any)[doc.url]) ||
                Boolean(existente && (existente as any)[doc.url]);
            if (!tiene) faltantes.push(doc.label);
        }
        if (faltantes.length) {
            throw new BadRequestException(`Faltan documentos obligatorios: ${faltantes.join(', ')}.`);
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
            relations: ['categoria', 'tipoDanza']
        });
        const puedeReeditar = existente && existente.estado === EstadoSolicitud.OBSERVADO;
        if (existente && !puedeReeditar) {
            const msgEstado =
                existente.estado === EstadoSolicitud.RECHAZADO
                    ? 'Tu solicitud fue rechazada y anulada por La Comisión. No puedes reenviarla en esta gestión.'
                    : 'Ya tienes una solicitud de inscripción en proceso para esta gestión.';
            throw new BadRequestException(msgEstado);
        }

        const idCategoria = parseInt(data.idCategoria || existente?.categoria?.idCategoria);
        if (isNaN(idCategoria)) throw new BadRequestException('La categoría es requerida.');

        const tipoDanza = await this.resolverTipoDanza(
            data.idTipoDanza ?? existente?.tipoDanza?.idTipoDanza,
            data.tipoDanzaOtro,
        );
        const idTipoDanza = tipoDanza.idTipoDanza;

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
            camposDirectiva[`${p.prefix}CiComplemento`] = conservarSiNoRechazado(
                `${p.prefix}CiComplemento`,
                data[`${p.prefix}CiComplemento`] || '',
                existente?.[`${p.prefix}CiComplemento`],
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
            instanciaRepresentacion: conservarSiNoRechazado('instancia', data.instanciaRepresentacion, existente?.instanciaRepresentacion),
            nombreInstitucionExterna: conservarSiNoRechazado('institucionExterna', data.nombreInstitucionExterna, existente?.nombreInstitucionExterna),
            categoria: { idCategoria: conservarSiNoRechazado('categoria', idCategoria, existente?.categoria?.idCategoria) } as any,
            tipoDanza: {
                idTipoDanza: conservarSiNoRechazado(
                    'tipoDanza',
                    idTipoDanza,
                    existente?.tipoDanza?.idTipoDanza,
                ),
            } as any,
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
            for (const doc of DOCUMENTOS_POR_PERSONA) {
                (solicitud as any)[doc.urlField] = conservarArchivo(
                    doc.fileKey,
                    files[doc.fileKey],
                    (existente as any)?.[doc.urlField],
                );
            }
            for (const doc of DOCUMENTOS_INSTITUCIONALES) {
                (solicitud as any)[doc.url] = conservarArchivo(
                    doc.key,
                    files[doc.key],
                    (existente as any)?.[doc.url],
                );
            }
        }

        if (puedeReeditar) {
            solicitud.estado = EstadoSolicitud.PENDIENTE;
            solicitud.observaciones = null;

            // Restablecer los elementos corregidos: quitar marca X y motivo asociado.
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

        await this.assertCargosObligatorios(data);
        await this.assertCisDirectivaUnicos(data, puedeReeditar ? existente?.idSolicitud : undefined);
        this.assertDocumentosObligatorios(solicitud, files, puedeReeditar ? existente : null);

        this.normalizarSolicitudInscripcion(solicitud);

        return await this.solicitudRepo.save(solicitud);
    }

    async getMisSolicitudes(idUsuario: number) {
        return await this.solicitudRepo.find({
            where: { delegado: { idUsuario } },
            relations: ['gestion', 'categoria', 'tipoDanza', 'facultad', 'carrera', 'fraternidadCreada'],
            order: { createdAt: 'DESC' }
        });
    }

    async getSolicitudById(id: number) {
        const sol = await this.solicitudRepo.findOne({
            where: { idSolicitud: id },
            relations: ['gestion', 'categoria', 'tipoDanza', 'facultad', 'carrera', 'institucionExterna', 'delegado', 'fraternidadCreada']
        });
        if (!sol) throw new NotFoundException('Solicitud no encontrada');
        return sol;
    }

    async getAllSolicitudes(estado?: string) {
        const where: any = {};
        if (estado) where.estado = estado;
        return await this.solicitudRepo.find({
            where,
            relations: ['gestion', 'categoria', 'tipoDanza', 'facultad', 'carrera', 'institucionExterna', 'delegado', 'fraternidadCreada'],
            order: { createdAt: 'DESC' }
        });
    }

    private extraerItemsObservados(
        checklist: Record<string, { estado?: string; label?: string; comentario?: string }> = {},
    ) {
        return Object.entries(checklist)
            .filter(([, item]) => item?.estado === 'X')
            .map(([, item]) => {
                const etiqueta = item?.label || 'Dato observado';
                const motivo = item?.comentario?.trim();
                return motivo ? `${etiqueta}: ${motivo}` : etiqueta;
            })
            .filter(Boolean);
    }

    private async notificarDelegadoEstadoSolicitud(
        sol: SolicitudInscripcion,
        estado: EstadoSolicitud,
        observaciones?: string,
    ): Promise<{ enviado: boolean; correo?: string; error?: string }> {
        if (![EstadoSolicitud.OBSERVADO, EstadoSolicitud.APROBADO, EstadoSolicitud.RECHAZADO].includes(estado)) {
            return { enviado: false };
        }

        const delegado = sol.delegado;
        const correo = delegado?.correo?.trim();
        if (!correo) {
            this.logger.warn(
                `Delegado sin correo (solicitud #${sol.idSolicitud}). No se pudo notificar estado ${estado}.`,
            );
            return { enviado: false, error: 'El delegado no tiene correo registrado en el sistema.' };
        }

        const nombre = [delegado.nombres, delegado.primerApellido, delegado.segundoApellido]
            .filter(Boolean)
            .join(' ')
            .trim() || 'Delegado';

        try {
            await this.mailService.sendResultadoSolicitudInscripcion(
                correo,
                nombre,
                {
                    nombreFraternidad: sol.nombreFraternidad,
                    estado: estado as 'OBSERVADO' | 'APROBADO' | 'RECHAZADO',
                },
                observaciones,
                estado === EstadoSolicitud.OBSERVADO
                    ? this.extraerItemsObservados(sol.revisionChecklist || {})
                    : undefined,
            );
            this.logger.log(`Correo de estado ${estado} enviado al delegado ${correo} (solicitud #${sol.idSolicitud}).`);
            return { enviado: true, correo };
        } catch (error) {
            const msg = error?.message || 'Error al enviar el correo';
            this.logger.warn(`No se pudo notificar por correo al delegado ${correo}: ${msg}`);
            return { enviado: false, correo, error: msg };
        }
    }

    async updateEstadoSolicitud(id: number, estado: string, observaciones?: string, revisionChecklist?: any) {
        const sol = await this.solicitudRepo.findOne({
            where: { idSolicitud: id },
            relations: ['fraternidadCreada', 'delegado'],
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

        if (estado === EstadoSolicitud.OBSERVADO) {
            const itemsObservados = Object.values(checklistNormalizado).filter(
                (item: any) => item?.estado === 'X',
            );
            if (!itemsObservados.length) {
                throw new BadRequestException(
                    'Marca con ✕ al menos un dato o documento incorrecto antes de observar la solicitud.',
                );
            }
            const sinMotivo = itemsObservados.filter(
                (item: any) => !item?.comentario?.trim(),
            );
            if (sinMotivo.length) {
                throw new BadRequestException(
                    'Indica el motivo de rechazo en cada dato o documento marcado con ✕.',
                );
            }
        }

        if (estado === EstadoSolicitud.RECHAZADO && !observaciones?.trim()) {
            throw new BadRequestException(
                'Indica el motivo del rechazo. La inscripción quedará anulada sin derecho a corrección.',
            );
        }

        const estadosPermitidos = [
            EstadoSolicitud.PENDIENTE,
            EstadoSolicitud.OBSERVADO,
            EstadoSolicitud.APROBADO,
            EstadoSolicitud.RECHAZADO,
        ];
        if (!estadosPermitidos.includes(estado as EstadoSolicitud)) {
            throw new BadRequestException(
                `El estado '${estado}' no es válido. Se permite: PENDIENTE, OBSERVADO, APROBADO, RECHAZADO.`,
            );
        }

        const revierteAprobacion =
            estadoAnterior === EstadoSolicitud.APROBADO &&
            [EstadoSolicitud.OBSERVADO, EstadoSolicitud.RECHAZADO].includes(estado as EstadoSolicitud);

        if (revierteAprobacion && sol.fraternidadCreada?.idFraternidad) {
            await this.eliminarFraternidadVinculada(sol.fraternidadCreada.idFraternidad);
            sol.fraternidadCreada = null;
        }

        sol.estado = estado as EstadoSolicitud;
        if (estado === EstadoSolicitud.OBSERVADO) {
            sol.observaciones = null;
        } else if (observaciones !== undefined) {
            sol.observaciones = observaciones;
        }
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

        let notificacionDelegado: { enviado: boolean; correo?: string; error?: string } | undefined;

        if (
            estado !== estadoAnterior &&
            [EstadoSolicitud.OBSERVADO, EstadoSolicitud.APROBADO, EstadoSolicitud.RECHAZADO].includes(
                estado as EstadoSolicitud,
            )
        ) {
            notificacionDelegado = await this.notificarDelegadoEstadoSolicitud(
                sol,
                estado as EstadoSolicitud,
                observaciones,
            );
        }

        const resultado = await this.getSolicitudById(id);
        return notificacionDelegado ? { ...resultado, notificacionDelegado } : resultado;
    }

    async updateSolicitudAdmin(id: number, data: Record<string, any>) {
        const sol = await this.solicitudRepo.findOne({
            where: { idSolicitud: id },
            relations: ['categoria', 'tipoDanza', 'facultad', 'carrera', 'institucionExterna', 'fraternidadCreada'],
        });
        if (!sol) throw new NotFoundException('Solicitud no encontrada');
        if (sol.estado === EstadoSolicitud.RECHAZADO) {
            throw new BadRequestException('No se pueden editar solicitudes rechazadas y anuladas.');
        }

        if (data.nombreFraternidad !== undefined) {
            sol.nombreFraternidad = data.nombreFraternidad;
        }
        if (data.instanciaRepresentacion !== undefined) {
            sol.instanciaRepresentacion = data.instanciaRepresentacion;
        }
        if (data.nombreInstitucionExterna !== undefined) {
            sol.nombreInstitucionExterna = data.nombreInstitucionExterna || null;
        }
        if (data.idCategoria !== undefined) {
            const idCategoria = parseInt(data.idCategoria, 10);
            if (!isNaN(idCategoria)) sol.categoria = { idCategoria } as Categoria;
        }
        if (data.idTipoDanza !== undefined) {
            sol.tipoDanza = await this.resolverTipoDanza(data.idTipoDanza, data.tipoDanzaOtro);
        }
        if (data.idFacultad !== undefined) {
            const idFacultad = data.idFacultad ? parseInt(data.idFacultad, 10) : null;
            sol.facultad = idFacultad && !isNaN(idFacultad) ? ({ idFacultad } as Facultad) : null;
        }
        if (data.idCarrera !== undefined) {
            const idCarrera = data.idCarrera ? parseInt(data.idCarrera, 10) : null;
            sol.carrera = idCarrera && !isNaN(idCarrera) ? ({ idCarrera } as Carrera) : null;
        }

        for (const p of PERSONAS_DIRECTIVA) {
            for (const suffix of ['Nombres', 'PrimerApellido', 'SegundoApellido', 'Ci', 'CiComplemento']) {
                const key = `${p.prefix}${suffix}`;
                if (data[key] !== undefined) sol[key] = data[key];
            }
            if (p.hasCelular && data[`${p.prefix}Celular`] !== undefined) {
                sol[`${p.prefix}Celular`] = data[`${p.prefix}Celular`];
            }
        }

        await this.assertCisDirectivaUnicos(sol, sol.idSolicitud);
        this.normalizarSolicitudInscripcion(sol);
        await this.solicitudRepo.save(sol);
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
        fraternidad.nivelRepresentacion = data?.nivelRepresentacion || solicitud.instanciaRepresentacion;

        if (data?.categoria?.idCategoria) {
            fraternidad.categoria = { idCategoria: data.categoria.idCategoria } as any;
        } else         if (solicitud.categoria) {
            fraternidad.categoria = solicitud.categoria;
        }

        if (solicitud.tipoDanza) {
            fraternidad.tipoDanza = solicitud.tipoDanza;
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
        } else {
            fraternidad.habilitadoEfu = true;
        }
    }

    async inscribirDesdeSolicitud(idSolicitud: number, data?: any) {
        const solicitud = await this.solicitudRepo.findOne({
            where: { idSolicitud },
            relations: ['delegado', 'fraternidadCreada', 'categoria', 'tipoDanza', 'facultad', 'carrera', 'institucionExterna', 'gestion', 'delegado.fraternidad']
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
