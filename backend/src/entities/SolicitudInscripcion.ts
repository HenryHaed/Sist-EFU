import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Gestion } from './Gestion';
import { Usuario } from './Usuario';
import { Facultad } from './Facultad';
import { Carrera } from './Carrera';
import { InstitucionExterna } from './InstitucionExterna';
import { Categoria } from './Categoria';
import { Fraternidad } from './Fraternidad';

export enum EstadoSolicitud {
    PENDIENTE = 'PENDIENTE',
    OBSERVADO = 'OBSERVADO',
    APROBADO = 'APROBADO',
    RECHAZADO = 'RECHAZADO'
}

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

    @Column({ name: 'origen_fraternidad', length: 50, default: 'General' })
    origenFraternidad: string;

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
    @ManyToOne(() => Categoria)
    @JoinColumn({ name: 'id_categoria' })
    categoria: Categoria;

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

    // Secretario de Hacienda
    @Column({ name: 'sec_haci_nombres', length: 150, nullable: true })
    secHaciNombres: string;
    @Column({ name: 'sec_haci_primer_apellido', length: 100, nullable: true })
    secHaciPrimerApellido: string;
    @Column({ name: 'sec_haci_segundo_apellido', length: 100, nullable: true })
    secHaciSegundoApellido: string;
    @Column({ name: 'sec_haci_ci', length: 50, nullable: true })
    secHaciCi: string;

    // Secretario de Actas
    @Column({ name: 'sec_actas_nombres', length: 150, nullable: true })
    secActasNombres: string;
    @Column({ name: 'sec_actas_primer_apellido', length: 100, nullable: true })
    secActasPrimerApellido: string;
    @Column({ name: 'sec_actas_segundo_apellido', length: 100, nullable: true })
    secActasSegundoApellido: string;
    @Column({ name: 'sec_actas_ci', length: 50, nullable: true })
    secActasCi: string;

    // Secretario de Prensa y Propaganda
    @Column({ name: 'sec_prensa_nombres', length: 150, nullable: true })
    secPrensaNombres: string;
    @Column({ name: 'sec_prensa_primer_apellido', length: 100, nullable: true })
    secPrensaPrimerApellido: string;
    @Column({ name: 'sec_prensa_segundo_apellido', length: 100, nullable: true })
    secPrensaSegundoApellido: string;
    @Column({ name: 'sec_prensa_ci', length: 50, nullable: true })
    secPrensaCi: string;

    // Vocal
    @Column({ name: 'vocal_nombres', length: 150, nullable: true })
    vocalNombres: string;
    @Column({ name: 'vocal_primer_apellido', length: 100, nullable: true })
    vocalPrimerApellido: string;
    @Column({ name: 'vocal_segundo_apellido', length: 100, nullable: true })
    vocalSegundoApellido: string;
    @Column({ name: 'vocal_ci', length: 50, nullable: true })
    vocalCi: string;

    // Delegado a Co-Gobierno
    @Column({ name: 'del_cogob_nombres', length: 150, nullable: true })
    delCogobNombres: string;
    @Column({ name: 'del_cogob_primer_apellido', length: 100, nullable: true })
    delCogobPrimerApellido: string;
    @Column({ name: 'del_cogob_segundo_apellido', length: 100, nullable: true })
    delCogobSegundoApellido: string;
    @Column({ name: 'del_cogob_ci', length: 50, nullable: true })
    delCogobCi: string;
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
    @Column({ name: 'del_suplente_celular', length: 50, nullable: true })
    delSuplenteCelular: string;

    // --- Documentos Requisitos (Puntos 29 al 33) ---
    // 29. CI y Matrícula por integrante de la directiva (PDF individual)
    @Column({ name: 'url_ci_matricula_presi', length: 500, nullable: true })
    urlCiMatriculaPresi: string;
    @Column({ name: 'url_ci_matricula_vice', length: 500, nullable: true })
    urlCiMatriculaVice: string;
    @Column({ name: 'url_ci_matricula_sec_gen', length: 500, nullable: true })
    urlCiMatriculaSecGen: string;
    @Column({ name: 'url_ci_matricula_sec_haci', length: 500, nullable: true })
    urlCiMatriculaSecHaci: string;
    @Column({ name: 'url_ci_matricula_sec_actas', length: 500, nullable: true })
    urlCiMatriculaSecActas: string;
    @Column({ name: 'url_ci_matricula_sec_prensa', length: 500, nullable: true })
    urlCiMatriculaSecPrensa: string;
    @Column({ name: 'url_ci_matricula_vocal', length: 500, nullable: true })
    urlCiMatriculaVocal: string;
    @Column({ name: 'url_ci_matricula_del_cogob', length: 500, nullable: true })
    urlCiMatriculaDelCogob: string;
    @Column({ name: 'url_ci_matricula_del_titular', length: 500, nullable: true })
    urlCiMatriculaDelTitular: string;
    @Column({ name: 'url_ci_matricula_del_suplente', length: 500, nullable: true })
    urlCiMatriculaDelSuplente: string;

    // 31. Carta de Compromiso
    @Column({ name: 'url_carta_compromiso', length: 500, nullable: true })
    urlCartaCompromiso: string;

    // 32. Resolución HCU/HCF/HCC
    @Column({ name: 'url_resolucion', length: 500, nullable: true })
    urlResolucion: string;

    // 33. Acta de Conformación
    @Column({ name: 'url_acta_directiva', length: 500, nullable: true })
    urlActaDirectiva: string;

    // Certificados de no adeudar
    @Column({ name: 'url_sin_deudas_fraternidad', length: 500, nullable: true })
    urlSinDeudasFraternidad: string;
    @Column({ name: 'url_sin_deudas_areas', length: 500, nullable: true })
    urlSinDeudasAreas: string;

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
