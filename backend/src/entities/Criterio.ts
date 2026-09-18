import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, ManyToMany } from 'typeorm';
import { Gestion } from './Gestion';
import { Fase } from './Fase';
import { Jurado } from './Jurado';

@Entity('criterios')
export class Criterio {
    @PrimaryGeneratedColumn({ name: 'id_criterio' })
    idCriterio: number;

    @ManyToOne(() => Gestion, (gestion) => gestion.criterios, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'id_gestion' })
    gestion: Gestion;

    @ManyToOne(() => Fase, (fase) => fase.criterios)
    @JoinColumn({ name: 'id_fase' })
    fase: Fase;

    @Column({ length: 255 })
    nombre: string;

    @Column({ name: 'puntaje_maximo', type: 'decimal', precision: 5, scale: 2 })
    puntajeMaximo: number;

    /**
     * Techo visual para el Controlador (ej. 6).
     * notaReal = (notaVisual / escalaVisual) * puntajeMaximo
     */
    @Column({ name: 'escala_visual', type: 'decimal', precision: 5, scale: 2, default: 6 })
    escalaVisual: number;

    @Column({ name: 'url_imagen', length: 500, nullable: true })
    urlImagen: string;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;

    @ManyToMany(() => Jurado, (jurado) => jurado.criteriosAsignados)
    juradosAsignados: Jurado[];
}
