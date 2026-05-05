import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Gestion } from './Gestion';
import { Categoria } from './Categoria';

@Entity('cronograma_inscripciones')
export class CronogramaInscripcion {
    @PrimaryGeneratedColumn({ name: 'id_cronograma' })
    idCronograma: number;

    @ManyToOne(() => Gestion)
    @JoinColumn({ name: 'id_gestion' })
    gestion: Gestion;

    @ManyToOne(() => Categoria)
    @JoinColumn({ name: 'id_categoria' })
    categoria: Categoria;

    @Column({ name: 'fecha_inicio', type: 'timestamp' })
    fechaInicio: Date;

    @Column({ name: 'fecha_fin', type: 'timestamp' })
    fechaFin: Date;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
}
