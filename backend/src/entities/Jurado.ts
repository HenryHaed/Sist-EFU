import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToMany, ManyToMany, JoinTable } from 'typeorm';
import { Usuario } from './Usuario';
import { Gestion } from './Gestion';
import { Carrera } from './Carrera';
import { Evaluacion } from './Evaluacion';
import { Fase } from './Fase';
import { Fraternidad } from './Fraternidad';

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

    @Column({ name: 'tipo_jurado', type: 'varchar', length: 20, default: 'EFU' })
    tipoJurado: string; // 'EFU' | 'EXTERNO'

    @ManyToOne(() => Carrera, (carrera) => carrera.jurados, { onDelete: 'SET NULL' })
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

    @ManyToMany(() => Fase)
    @JoinTable({
        name: 'jurado_fases',
        joinColumn: { name: 'id_jurado', referencedColumnName: 'idJurado' },
        inverseJoinColumn: { name: 'id_fase', referencedColumnName: 'idFase' }
    })
    fasesHabilitadas: Fase[];

    @ManyToMany(() => Fraternidad)
    @JoinTable({
        name: 'jurado_fraternidades',
        joinColumn: { name: 'id_jurado', referencedColumnName: 'idJurado' },
        inverseJoinColumn: { name: 'id_fraternidad', referencedColumnName: 'idFraternidad' }
    })
    fraternidadesHabilitadas: Fraternidad[];
}
