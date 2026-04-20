import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Gestion } from './Gestion';
import { Jurado } from './Jurado';
import { Fraternidad } from './Fraternidad';
import { Fase } from './Fase';
import { Participante } from './Participante';

@Entity('evaluaciones')
export class Evaluacion {
    @PrimaryGeneratedColumn({ name: 'id_evaluacion' })
    idEvaluacion: number;

    @ManyToOne(() => Gestion, (gestion) => gestion.evaluaciones)
    @JoinColumn({ name: 'id_gestion' })
    gestion: Gestion;

    @ManyToOne(() => Jurado, (jurado) => jurado.evaluaciones)
    @JoinColumn({ name: 'id_jurado' })
    jurado: Jurado;

    @ManyToOne(() => Fraternidad, (fraternidad) => fraternidad.evaluaciones, { nullable: true })
    @JoinColumn({ name: 'id_fraternidad' })
    fraternidad: Fraternidad;

    @ManyToOne(() => Fase, (fase) => fase.evaluaciones)
    @JoinColumn({ name: 'id_fase' })
    fase: Fase;

    @Column({ type: 'enum', enum: ['PENDIENTE', 'EN_PROGRESO', 'COMPLETADO'], default: 'PENDIENTE' })
    estado: string;

    @Column({ name: 'criterios_evaluados', type: 'jsonb', nullable: true })
    criteriosEvaluados: any;

    @Column({ name: 'puntaje_total', type: 'decimal', precision: 5, scale: 2, default: 0 })
    puntajeTotal: number;

    @ManyToOne(() => Participante, (participante) => participante.evaluaciones, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'id_participante' })
    participante: Participante;

    @Column({ name: 'fecha_apertura', type: 'timestamp', nullable: true })
    fechaApertura: Date;

    @Column({ name: 'fecha_cierre', type: 'timestamp', nullable: true })
    fechaCierre: Date;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
}
