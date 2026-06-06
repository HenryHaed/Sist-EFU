import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { Jurado } from './Jurado';
import { Fase } from './Fase';
import { Evaluacion } from './Evaluacion';
import { Infraccion } from './Infraccion';
import { Incidencia } from './Incidencia';
import { Asistencia } from './Asistencia';
import { Fraternidad } from './Fraternidad';
import { Categoria } from './Categoria';
import { Criterio } from './Criterio';
import { Participante } from './Participante';

@Entity('gestiones')
export class Gestion {
    @PrimaryGeneratedColumn({ name: 'id_gestion' })
    idGestion: number;

    @Column({ unique: true })
    anio: number;

    @Column({ type: 'text', nullable: true })
    lema: string;

    @Column({ default: false })
    activa: boolean;

    @Column({ name: 'nombre_sitio', length: 255, nullable: true })
    nombreSitio: string;

    @Column({ name: 'titulo_principal', length: 255, nullable: true })
    tituloPrincipal: string;

    @Column({ name: 'subtitulo_principal', type: 'text', nullable: true })
    subtituloPrincipal: string;

    @Column({ name: 'url_banner', length: 500, nullable: true })
    urlBanner: string;

    @Column({ name: 'url_logo', length: 500, nullable: true })
    urlLogo: string;

    @Column({ name: 'url_imagen_login', length: 500, nullable: true })
    urlImagenLogin: string;

    @Column({ name: 'url_mapa_ubicacion', length: 500, nullable: true })
    urlMapaUbicacion: string;

    @Column({ name: 'modo_mantenimiento', default: false })
    modoMantenimiento: boolean;

    @Column({ name: 'mostrar_ranking', default: true })
    mostrarRanking: boolean;

    @Column({ name: 'permite_inscripcion_publica', default: false })
    permiteInscripcionPublica: boolean;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;

    @OneToMany(() => Jurado, (jurado) => jurado.gestion)
    jurados: Jurado[];

    @OneToMany(() => Fase, (fase) => fase.gestion)
    fases: Fase[];

    @OneToMany(() => Evaluacion, (evaluacion) => evaluacion.gestion)
    evaluaciones: Evaluacion[];

    @OneToMany(() => Infraccion, (infraccion) => infraccion.gestion)
    infracciones: Infraccion[];

    @OneToMany(() => Incidencia, (incidencia) => incidencia.gestion)
    incidencias: Incidencia[];

    @OneToMany(() => Asistencia, (asistencia) => asistencia.gestion)
    asistencias: Asistencia[];

    @OneToMany(() => Fraternidad, (fraternidad) => fraternidad.gestion)
    fraternidades: Fraternidad[];

    @OneToMany(() => Categoria, (categoria) => categoria.gestion)
    categorias: Categoria[];

    @OneToMany(() => Criterio, (criterio) => criterio.gestion)
    criterios: Criterio[];

    @OneToMany(() => Participante, (participante) => participante.gestion)
    participantes: Participante[];
}
