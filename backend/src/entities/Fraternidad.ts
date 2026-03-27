import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { Facultad } from './Facultad';
import { Carrera } from './Carrera';
import { InstitucionExterna } from './InstitucionExterna';
import { Categoria } from './Categoria';
import { Evaluacion } from './Evaluacion';
import { Incidencia } from './Incidencia';
import { Asistencia } from './Asistencia';

@Entity('fraternidades')
export class Fraternidad {
    @PrimaryGeneratedColumn({ name: 'id_fraternidad' })
    idFraternidad: number;

    @Column({ length: 255, unique: true })
    nombre: string;

    @Column({ name: 'origen_fraternidad', length: 50 })
    origenFraternidad: string;

    @Column({ name: 'nivel_representacion', length: 100, nullable: true })
    nivelRepresentacion: string;

    @ManyToOne(() => Facultad, (facultad) => facultad.fraternidades)
    @JoinColumn({ name: 'id_facultad' })
    facultad: Facultad;

    @ManyToOne(() => Carrera, (carrera) => carrera.fraternidades)
    @JoinColumn({ name: 'id_carrera' })
    carrera: Carrera;

    @ManyToOne(() => InstitucionExterna, (institucionExterna) => institucionExterna.fraternidades)
    @JoinColumn({ name: 'id_institucion_externa' })
    institucionExterna: InstitucionExterna;

    @ManyToOne(() => Categoria, (categoria) => categoria.fraternidades)
    @JoinColumn({ name: 'id_categoria' })
    categoria: Categoria;

    @Column({ name: 'tipo_organizacion', length: 100, nullable: true })
    tipoOrganizacion: string;

    @Column({ name: 'fecha_fundacion', type: 'date', nullable: true })
    fechaFundacion: Date;

    @Column({ name: 'habilitado_efu', default: true })
    habilitadoEfu: boolean;

    @Column({ name: 'logo_url', type: 'text', nullable: true })
    logoUrl: string;

    @Column({ name: 'promedio_base', type: 'decimal', precision: 5, scale: 2, default: 0 })
    promedioBase: number;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;

    @OneToMany(() => Evaluacion, (evaluacion) => evaluacion.fraternidad)
    evaluaciones: Evaluacion[];

    @OneToMany(() => Incidencia, (incidencia) => incidencia.fraternidad)
    incidencias: Incidencia[];

    @OneToMany(() => Asistencia, (asistencia) => asistencia.fraternidad)
    asistencias: Asistencia[];
}
