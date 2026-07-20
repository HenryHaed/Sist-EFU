import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Gestion } from './Gestion';
import { Usuario } from './Usuario';
import { Facultad } from './Facultad';
import { Carrera } from './Carrera';
import { InstitucionExterna } from './InstitucionExterna';
import { Categoria } from './Categoria';
import { Fraternidad } from './Fraternidad';
import { TipoDanza } from './TipoDanza';

export enum EstadoSolicitud {
    BORRADOR = 'BORRADOR',
    PENDIENTE = 'PENDIENTE',
    OBSERVADO = 'OBSERVADO',
    APROBADO = 'APROBADO',
    RECHAZADO = 'RECHAZADO'
}

export type CostoParticipacionItem = {
    concepto: string;
    monto: number;
};

export type CostosParticipacion = {
    multiple: boolean;
    items: CostoParticipacionItem[];
};

export enum InstanciaRepresentacion {
    FACULTAD = 'Facultad',
    CARRERA = 'Carrera',
    UMSA = 'UMSA',
    FEDSIDUMSA = 'FEDSIDUMSA',
    STUMSA = 'STUMSA',
    EXTERNO = 'Externo'
}

@Entity('solicitudes_inscripcion')
export class SolicitudInscripcion {
    @PrimaryGeneratedColumn({ name: 'id_solicitud' })
    idSolicitud: number;

    @ManyToOne(() => Gestion)
    @JoinColumn({ name: 'id_gestion' })
    gestion: Gestion;

    @ManyToOne(() => Usuario)
    @JoinColumn({ name: 'id_usuario_delegado' })
    delegado: Usuario;

    // --- Datos de la Fraternidad (Puntos 1 al 3) ---
    // 1. Nombre de la Fraternidad
    @Column({ name: 'nombre_fraternidad', length: 255 })
    nombreFraternidad: string;

    // 2. Instancia a la que representa
    @Column({ type: 'enum', enum: InstanciaRepresentacion, name: 'instancia_representacion' })
    instanciaRepresentacion: InstanciaRepresentacion;

    @ManyToOne(() => Facultad, { nullable: true })
    @JoinColumn({ name: 'id_facultad' })
    facultad: Facultad;

    @ManyToOne(() => Carrera, { nullable: true })
    @JoinColumn({ name: 'id_carrera' })
    carrera: Carrera;

    @ManyToOne(() => InstitucionExterna, { nullable: true })
    @JoinColumn({ name: 'id_institucion_externa' })
    institucionExterna: InstitucionExterna;

    @Column({ name: 'nombre_institucion_externa', length: 255, nullable: true })
    nombreInstitucionExterna: string;

    // 3. Categoría a la que pertenece
    @ManyToOne(() => Categoria, { nullable: true })
    @JoinColumn({ name: 'id_categoria' })
    categoria: Categoria;

    @ManyToOne(() => TipoDanza, { nullable: true })
    @JoinColumn({ name: 'id_tipo_danza' })
    tipoDanza: TipoDanza;

    /** Costos de participación por bailarín (único o N conceptos). */
    @Column({ name: 'costos_participacion', type: 'jsonb', nullable: true })
    costosParticipacion: CostosParticipacion | null;

    // --- Directiva (Puntos 4 al 28) ---
    // Presidente
    @Column({ name: 'presi_nombres', length: 150, nullable: true })
    presiNombres: string;
    @Column({ name: 'presi_primer_apellido', length: 100, nullable: true })
    presiPrimerApellido: string;
    @Column({ name: 'presi_segundo_apellido', length: 100, nullable: true })
    presiSegundoApellido: string;
    @Column({ name: 'presi_ci', length: 50, nullable: true })
    presiCi: string;
    @Column({ name: 'presi_ci_complemento', length: 10, nullable: true })
    presiCiComplemento: string;
    @Column({ name: 'presi_celular', length: 50, nullable: true })
    presiCelular: string;

    // Vicepresidente
    @Column({ name: 'vice_nombres', length: 150, nullable: true })
    viceNombres: string;
    @Column({ name: 'vice_primer_apellido', length: 100, nullable: true })
    vicePrimerApellido: string;
    @Column({ name: 'vice_segundo_apellido', length: 100, nullable: true })
    viceSegundoApellido: string;
    @Column({ name: 'vice_ci', length: 50, nullable: true })
    viceCi: string;
    @Column({ name: 'vice_ci_complemento', length: 10, nullable: true })
    viceCiComplemento: string;
    @Column({ name: 'vice_celular', length: 50, nullable: true })
    viceCelular: string;

    // Secretario General
    @Column({ name: 'sec_gen_nombres', length: 150, nullable: true })
    secGenNombres: string;
    @Column({ name: 'sec_gen_primer_apellido', length: 100, nullable: true })
    secGenPrimerApellido: string;
    @Column({ name: 'sec_gen_segundo_apellido', length: 100, nullable: true })
    secGenSegundoApellido: string;
    @Column({ name: 'sec_gen_ci', length: 50, nullable: true })
    secGenCi: string;
    @Column({ name: 'sec_gen_ci_complemento', length: 10, nullable: true })
    secGenCiComplemento: string;

    // Secretario de Hacienda
    @Column({ name: 'sec_haci_nombres', length: 150, nullable: true })
    secHaciNombres: string;
    @Column({ name: 'sec_haci_primer_apellido', length: 100, nullable: true })
    secHaciPrimerApellido: string;
    @Column({ name: 'sec_haci_segundo_apellido', length: 100, nullable: true })
    secHaciSegundoApellido: string;
    @Column({ name: 'sec_haci_ci', length: 50, nullable: true })
    secHaciCi: string;
    @Column({ name: 'sec_haci_ci_complemento', length: 10, nullable: true })
    secHaciCiComplemento: string;

    // Secretario de Actas
    @Column({ name: 'sec_actas_nombres', length: 150, nullable: true })
    secActasNombres: string;
    @Column({ name: 'sec_actas_primer_apellido', length: 100, nullable: true })
    secActasPrimerApellido: string;
    @Column({ name: 'sec_actas_segundo_apellido', length: 100, nullable: true })
    secActasSegundoApellido: string;
    @Column({ name: 'sec_actas_ci', length: 50, nullable: true })
    secActasCi: string;
    @Column({ name: 'sec_actas_ci_complemento', length: 10, nullable: true })
    secActasCiComplemento: string;

    // Secretario de Prensa y Propaganda
    @Column({ name: 'sec_prensa_nombres', length: 150, nullable: true })
    secPrensaNombres: string;
    @Column({ name: 'sec_prensa_primer_apellido', length: 100, nullable: true })
    secPrensaPrimerApellido: string;
    @Column({ name: 'sec_prensa_segundo_apellido', length: 100, nullable: true })
    secPrensaSegundoApellido: string;
    @Column({ name: 'sec_prensa_ci', length: 50, nullable: true })
    secPrensaCi: string;
    @Column({ name: 'sec_prensa_ci_complemento', length: 10, nullable: true })
    secPrensaCiComplemento: string;

    // Vocal
    @Column({ name: 'vocal_nombres', length: 150, nullable: true })
    vocalNombres: string;
    @Column({ name: 'vocal_primer_apellido', length: 100, nullable: true })
    vocalPrimerApellido: string;
    @Column({ name: 'vocal_segundo_apellido', length: 100, nullable: true })
    vocalSegundoApellido: string;
    @Column({ name: 'vocal_ci', length: 50, nullable: true })
    vocalCi: string;
    @Column({ name: 'vocal_ci_complemento', length: 10, nullable: true })
    vocalCiComplemento: string;

    // Delegado a Co-Gobierno
    @Column({ name: 'del_cogob_nombres', length: 150, nullable: true })
    delCogobNombres: string;
    @Column({ name: 'del_cogob_primer_apellido', length: 100, nullable: true })
    delCogobPrimerApellido: string;
    @Column({ name: 'del_cogob_segundo_apellido', length: 100, nullable: true })
    delCogobSegundoApellido: string;
    @Column({ name: 'del_cogob_ci', length: 50, nullable: true })
    delCogobCi: string;
    @Column({ name: 'del_cogob_ci_complemento', length: 10, nullable: true })
    delCogobCiComplemento: string;
    @Column({ name: 'del_cogob_celular', length: 50, nullable: true })
    delCogobCelular: string;

    // Delegado Titular
    @Column({ name: 'del_titular_nombres', length: 150, nullable: true })
    delTitularNombres: string;
    @Column({ name: 'del_titular_primer_apellido', length: 100, nullable: true })
    delTitularPrimerApellido: string;
    @Column({ name: 'del_titular_segundo_apellido', length: 100, nullable: true })
    delTitularSegundoApellido: string;
    @Column({ name: 'del_titular_ci', length: 50, nullable: true })
    delTitularCi: string;
    @Column({ name: 'del_titular_ci_complemento', length: 10, nullable: true })
    delTitularCiComplemento: string;
    @Column({ name: 'del_titular_celular', length: 50, nullable: true })
    delTitularCelular: string;

    // Delegado Suplente
    @Column({ name: 'del_suplente_nombres', length: 150, nullable: true })
    delSuplenteNombres: string;
    @Column({ name: 'del_suplente_primer_apellido', length: 100, nullable: true })
    delSuplentePrimerApellido: string;
    @Column({ name: 'del_suplente_segundo_apellido', length: 100, nullable: true })
    delSuplenteSegundoApellido: string;
    @Column({ name: 'del_suplente_ci', length: 50, nullable: true })
    delSuplenteCi: string;
    @Column({ name: 'del_suplente_ci_complemento', length: 10, nullable: true })
    delSuplenteCiComplemento: string;
    @Column({ name: 'del_suplente_celular', length: 50, nullable: true })
    delSuplenteCelular: string;

    // --- Documentos Requisitos ---
    // 4 PDFs por integrante: CI, Matrícula, No deudas fraternidad, No deudas áreas
    @Column({ name: 'url_ci_presi', length: 500, nullable: true })
    urlCiPresi: string;
    @Column({ name: 'url_matricula_presi', length: 500, nullable: true })
    urlMatriculaPresi: string;
    @Column({ name: 'url_sin_deudas_fraternidad_presi', length: 500, nullable: true })
    urlSinDeudasFraternidadPresi: string;
    @Column({ name: 'url_sin_deudas_areas_presi', length: 500, nullable: true })
    urlSinDeudasAreasPresi: string;

    @Column({ name: 'url_ci_vice', length: 500, nullable: true })
    urlCiVice: string;
    @Column({ name: 'url_matricula_vice', length: 500, nullable: true })
    urlMatriculaVice: string;
    @Column({ name: 'url_sin_deudas_fraternidad_vice', length: 500, nullable: true })
    urlSinDeudasFraternidadVice: string;
    @Column({ name: 'url_sin_deudas_areas_vice', length: 500, nullable: true })
    urlSinDeudasAreasVice: string;

    @Column({ name: 'url_ci_sec_gen', length: 500, nullable: true })
    urlCiSecGen: string;
    @Column({ name: 'url_matricula_sec_gen', length: 500, nullable: true })
    urlMatriculaSecGen: string;
    @Column({ name: 'url_sin_deudas_fraternidad_sec_gen', length: 500, nullable: true })
    urlSinDeudasFraternidadSecGen: string;
    @Column({ name: 'url_sin_deudas_areas_sec_gen', length: 500, nullable: true })
    urlSinDeudasAreasSecGen: string;

    @Column({ name: 'url_ci_sec_haci', length: 500, nullable: true })
    urlCiSecHaci: string;
    @Column({ name: 'url_matricula_sec_haci', length: 500, nullable: true })
    urlMatriculaSecHaci: string;
    @Column({ name: 'url_sin_deudas_fraternidad_sec_haci', length: 500, nullable: true })
    urlSinDeudasFraternidadSecHaci: string;
    @Column({ name: 'url_sin_deudas_areas_sec_haci', length: 500, nullable: true })
    urlSinDeudasAreasSecHaci: string;

    @Column({ name: 'url_ci_sec_actas', length: 500, nullable: true })
    urlCiSecActas: string;
    @Column({ name: 'url_matricula_sec_actas', length: 500, nullable: true })
    urlMatriculaSecActas: string;
    @Column({ name: 'url_sin_deudas_fraternidad_sec_actas', length: 500, nullable: true })
    urlSinDeudasFraternidadSecActas: string;
    @Column({ name: 'url_sin_deudas_areas_sec_actas', length: 500, nullable: true })
    urlSinDeudasAreasSecActas: string;

    @Column({ name: 'url_ci_sec_prensa', length: 500, nullable: true })
    urlCiSecPrensa: string;
    @Column({ name: 'url_matricula_sec_prensa', length: 500, nullable: true })
    urlMatriculaSecPrensa: string;
    @Column({ name: 'url_sin_deudas_fraternidad_sec_prensa', length: 500, nullable: true })
    urlSinDeudasFraternidadSecPrensa: string;
    @Column({ name: 'url_sin_deudas_areas_sec_prensa', length: 500, nullable: true })
    urlSinDeudasAreasSecPrensa: string;

    @Column({ name: 'url_ci_vocal', length: 500, nullable: true })
    urlCiVocal: string;
    @Column({ name: 'url_matricula_vocal', length: 500, nullable: true })
    urlMatriculaVocal: string;
    @Column({ name: 'url_sin_deudas_fraternidad_vocal', length: 500, nullable: true })
    urlSinDeudasFraternidadVocal: string;
    @Column({ name: 'url_sin_deudas_areas_vocal', length: 500, nullable: true })
    urlSinDeudasAreasVocal: string;

    @Column({ name: 'url_ci_del_cogob', length: 500, nullable: true })
    urlCiDelCogob: string;
    @Column({ name: 'url_matricula_del_cogob', length: 500, nullable: true })
    urlMatriculaDelCogob: string;
    @Column({ name: 'url_sin_deudas_fraternidad_del_cogob', length: 500, nullable: true })
    urlSinDeudasFraternidadDelCogob: string;
    @Column({ name: 'url_sin_deudas_areas_del_cogob', length: 500, nullable: true })
    urlSinDeudasAreasDelCogob: string;

    @Column({ name: 'url_ci_del_titular', length: 500, nullable: true })
    urlCiDelTitular: string;
    @Column({ name: 'url_matricula_del_titular', length: 500, nullable: true })
    urlMatriculaDelTitular: string;
    @Column({ name: 'url_sin_deudas_fraternidad_del_titular', length: 500, nullable: true })
    urlSinDeudasFraternidadDelTitular: string;
    @Column({ name: 'url_sin_deudas_areas_del_titular', length: 500, nullable: true })
    urlSinDeudasAreasDelTitular: string;

    @Column({ name: 'url_ci_del_suplente', length: 500, nullable: true })
    urlCiDelSuplente: string;
    @Column({ name: 'url_matricula_del_suplente', length: 500, nullable: true })
    urlMatriculaDelSuplente: string;
    @Column({ name: 'url_sin_deudas_fraternidad_del_suplente', length: 500, nullable: true })
    urlSinDeudasFraternidadDelSuplente: string;
    @Column({ name: 'url_sin_deudas_areas_del_suplente', length: 500, nullable: true })
    urlSinDeudasAreasDelSuplente: string;

    // Documentos institucionales
    @Column({ name: 'url_carta_compromiso', length: 500, nullable: true })
    urlCartaCompromiso: string;

    @Column({ name: 'url_resolucion', length: 500, nullable: true })
    urlResolucion: string;

    @Column({ name: 'url_acta_directiva', length: 500, nullable: true })
    urlActaDirectiva: string;

    // --- Control Administrativo ---
    @Column({ type: 'enum', enum: EstadoSolicitud, default: EstadoSolicitud.PENDIENTE })
    estado: EstadoSolicitud;

    @Column({ type: 'text', nullable: true })
    observaciones: string;

    @Column({ name: 'revision_checklist', type: 'jsonb', nullable: true, default: {} })
    revisionChecklist: Record<string, { estado: 'PENDIENTE' | 'OK' | 'X', comentario?: string }>;

    @ManyToOne(() => Fraternidad, { nullable: true })
    @JoinColumn({ name: 'id_fraternidad_creada' })
    fraternidadCreada: Fraternidad;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
}
