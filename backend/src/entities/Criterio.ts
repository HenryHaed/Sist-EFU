import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { Fase } from './Fase';

@Entity('criterios')
export class Criterio {
    @PrimaryGeneratedColumn({ name: 'id_criterio' })
    idCriterio: number;

    @ManyToOne(() => Fase, (fase) => fase.criterios)
    @JoinColumn({ name: 'id_fase' })
    fase: Fase;

    @Column({ length: 255 })
    nombre: string;

    @Column({ name: 'puntaje_maximo', type: 'decimal', precision: 5, scale: 2 })
    puntajeMaximo: number;

    @Column({ name: 'url_imagen', length: 500, nullable: true })
    urlImagen: string;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
}
