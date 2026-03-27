import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { Gestion } from './Gestion';
import { Incidencia } from './Incidencia';

@Entity('infracciones')
export class Infraccion {
    @PrimaryGeneratedColumn({ name: 'id_infraccion' })
    idInfraccion: number;

    @ManyToOne(() => Gestion, (gestion) => gestion.infracciones)
    @JoinColumn({ name: 'id_gestion' })
    gestion: Gestion;

    @Column({ length: 255 })
    nombre: string;

    @Column({ name: 'tipo_impacto', length: 100, nullable: true })
    tipoImpacto: string;

    @Column({ name: 'valor_impacto', type: 'decimal', precision: 5, scale: 2, nullable: true })
    valorImpacto: number;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;

    @OneToMany(() => Incidencia, (incidencia) => incidencia.infraccion)
    incidencias: Incidencia[];
}
