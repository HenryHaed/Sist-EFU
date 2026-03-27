import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Gestion } from './Gestion';
import { Jurado } from './Jurado';
import { Fraternidad } from './Fraternidad';
import { Fase } from './Fase';
import { Criterio } from './Criterio';

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

    @ManyToOne(() => Fraternidad, (fraternidad) => fraternidad.evaluaciones)
    @JoinColumn({ name: 'id_fraternidad' })
    fraternidad: Fraternidad;

    @ManyToOne(() => Fase, (fase) => fase.evaluaciones)
    @JoinColumn({ name: 'id_fase' })
    fase: Fase;

    @ManyToOne(() => Criterio, (criterio) => criterio.evaluaciones)
    @JoinColumn({ name: 'id_criterio' })
    criterio: Criterio;

    @Column({ type: 'decimal', precision: 5, scale: 2 })
    puntaje: number;

    @Column({ name: 'fecha_hora', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    fechaHora: Date;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
}
