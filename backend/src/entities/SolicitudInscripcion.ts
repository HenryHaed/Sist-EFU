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
    @JoinColumn({ name: 'id_usuario_representante' })
    representante: Usuario;

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
    @Column({ name: 'presi_nombre', length: 255, nullable: true })
    presiNombre: string;
    @Column({ name: 'presi_ci', length: 50, nullable: true })
    presiCi: string;
    @Column({ name: 'presi_celular', length: 50, nullable: true })
    presiCelular: string;

    // Vicepresidente
    @Column({ name: 'vice_nombre', length: 255, nullable: true })
    viceNombre: string;
    @Column({ name: 'vice_ci', length: 50, nullable: true })
    viceCi: string;
    @Column({ name: 'vice_celular', length: 50, nullable: true })
    viceCelular: string;

    // Secretario General
    @Column({ name: 'sec_gen_nombre', length: 255, nullable: true })
    secGenNombre: string;
    @Column({ name: 'sec_gen_ci', length: 50, nullable: true })
    secGenCi: string;

    // Secretario de Hacienda
    @Column({ name: 'sec_haci_nombre', length: 255, nullable: true })
    secHaciNombre: string;
    @Column({ name: 'sec_haci_ci', length: 50, nullable: true })
    secHaciCi: string;

    // Secretario de Actas
    @Column({ name: 'sec_actas_nombre', length: 255, nullable: true })
    secActasNombre: string;
    @Column({ name: 'sec_actas_ci', length: 50, nullable: true })
    secActasCi: string;

    // Secretario de Prensa y Propaganda
    @Column({ name: 'sec_prensa_nombre', length: 255, nullable: true })
    secPrensaNombre: string;
    @Column({ name: 'sec_prensa_ci', length: 50, nullable: true })
    secPrensaCi: string;

    // Vocal
    @Column({ name: 'vocal_nombre', length: 255, nullable: true })
    vocalNombre: string;
    @Column({ name: 'vocal_ci', length: 50, nullable: true })
    vocalCi: string;

    // Delegado a Co-Gobierno
    @Column({ name: 'del_cogob_nombre', length: 255, nullable: true })
    delCogobNombre: string;
    @Column({ name: 'del_cogob_ci', length: 50, nullable: true })
    delCogobCi: string;
    @Column({ name: 'del_cogob_celular', length: 50, nullable: true })
    delCogobCelular: string;

    // Delegado Titular
    @Column({ name: 'del_titular_nombre', length: 255, nullable: true })
    delTitularNombre: string;
    @Column({ name: 'del_titular_ci', length: 50, nullable: true })
    delTitularCi: string;
    @Column({ name: 'del_titular_celular', length: 50, nullable: true })
    delTitularCelular: string;

    // Delegado Suplente
    @Column({ name: 'del_suplente_nombre', length: 255, nullable: true })
    delSuplenteNombre: string;
    @Column({ name: 'del_suplente_ci', length: 50, nullable: true })
    delSuplenteCi: string;
    @Column({ name: 'del_suplente_celular', length: 50, nullable: true })
    delSuplenteCelular: string;

    // --- Documentos Requisitos (Puntos 29 al 33) ---
    // 29. Fotocopia CI Representante
    @Column({ name: 'url_ci_representante', length: 500, nullable: true })
    urlCiRepresentante: string;

    // 30. Matrícula o Boleta
    @Column({ name: 'url_matricula_boleta', length: 500, nullable: true })
    urlMatriculaBoleta: string;

    // 31. Carta de Compromiso
    @Column({ name: 'url_carta_compromiso', length: 500, nullable: true })
    urlCartaCompromiso: string;

    // 32. Resolución HCU/HCF/HCC
    @Column({ name: 'url_resolucion', length: 500, nullable: true })
    urlResolucion: string;

    // 33. Acta de Conformación
    @Column({ name: 'url_acta_directiva', length: 500, nullable: true })
    urlActaDirectiva: string;

    // --- Control Administrativo ---
    @Column({ type: 'enum', enum: EstadoSolicitud, default: EstadoSolicitud.PENDIENTE })
    estado: EstadoSolicitud;

    @Column({ type: 'text', nullable: true })
    observaciones: string;

    @ManyToOne(() => Fraternidad, { nullable: true })
    @JoinColumn({ name: 'id_fraternidad_creada' })
    fraternidadCreada: Fraternidad;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
}
