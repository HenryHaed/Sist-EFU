import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { Gestion } from './Gestion';
import { Criterio } from './Criterio';
import { Evaluacion } from './Evaluacion';

@Entity('fases')
export class Fase {
    @PrimaryGeneratedColumn({ name: 'id_fase' })
    idFase: number;

    @ManyToOne(() => Gestion, (gestion) => gestion.fases)
    @JoinColumn({ name: 'id_gestion' })
    gestion: Gestion;

    @Column({ length: 255 })
    nombre: string;

    @Column({ name: 'peso_porcentaje', type: 'decimal', precision: 5, scale: 2 })
    pesoPorcentaje: number;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;

    @OneToMany(() => Criterio, (criterio) => criterio.fase)
    criterios: Criterio[];

    @OneToMany(() => Evaluacion, (evaluacion) => evaluacion.fase)
    evaluaciones: Evaluacion[];
}
