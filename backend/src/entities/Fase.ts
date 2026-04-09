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

    @Column({ name: 'tipo_concurso', type: 'varchar', length: 50, default: 'EFU' })
    tipoConcurso: string;

    @Column({ name: 'categoria_efu', type: 'varchar', length: 50, nullable: true })
    categoriaEfu: string;

    @Column({ name: 'fecha_inicio', type: 'timestamp', nullable: true })
    fechaInicio: Date;

    @Column({ name: 'fecha_fin', type: 'timestamp', nullable: true })
    fechaFin: Date;

    @Column({ name: 'esta_activa', type: 'boolean', default: false })
    estaActiva: boolean;

    @Column({ name: 'url_imagen', length: 500, nullable: true })
    urlImagen: string;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;

    @OneToMany(() => Criterio, (criterio) => criterio.fase)
    criterios: Criterio[];

    @OneToMany(() => Evaluacion, (evaluacion) => evaluacion.fase)
    evaluaciones: Evaluacion[];
}
