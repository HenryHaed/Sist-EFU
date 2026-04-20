import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { Fraternidad } from './Fraternidad';
import { Fase } from './Fase';
import { Evaluacion } from './Evaluacion';

@Entity('participantes_concurso')
export class Participante {
    @PrimaryGeneratedColumn({ name: 'id_participante' })
    idParticipante: number;

    @Column({ length: 255 })
    nombre: string;

    @Column({ length: 100, nullable: true })
    tipo: string; // Ej: 'Chacha', 'Warmi', 'Fotógrafo', 'Diseñador'

    @ManyToOne(() => Fraternidad, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'id_fraternidad' })
    fraternidad: Fraternidad;

    @ManyToOne(() => Fase, { nullable: false, onDelete: 'CASCADE' })
    @JoinColumn({ name: 'id_fase' })
    fase: Fase;

    @OneToMany(() => Evaluacion, (evaluacion) => evaluacion.participante)
    evaluaciones: Evaluacion[];

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
}
