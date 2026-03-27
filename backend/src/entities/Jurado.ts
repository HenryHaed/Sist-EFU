import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { Usuario } from './Usuario';
import { Gestion } from './Gestion';
import { Carrera } from './Carrera';
import { Evaluacion } from './Evaluacion';

@Entity('jurados')
export class Jurado {
    @PrimaryGeneratedColumn({ name: 'id_jurado' })
    idJurado: number;

    @ManyToOne(() => Usuario, (usuario) => usuario.jurados)
    @JoinColumn({ name: 'id_usuario' })
    usuario: Usuario;

    @ManyToOne(() => Gestion, (gestion) => gestion.jurados)
    @JoinColumn({ name: 'id_gestion' })
    gestion: Gestion;

    @Column({ name: 'tipo_origen', length: 100, nullable: true })
    tipoOrigen: string;

    @ManyToOne(() => Carrera, (carrera) => carrera.jurados)
    @JoinColumn({ name: 'id_carrera' })
    carrera: Carrera;

    @Column({ name: 'institucion_externa', length: 255, nullable: true })
    institucionExterna: string;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;

    @OneToMany(() => Evaluacion, (evaluacion) => evaluacion.jurado)
    evaluaciones: Evaluacion[];
}
