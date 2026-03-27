import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { Carrera } from './Carrera';
import { Fraternidad } from './Fraternidad';

@Entity('facultades')
export class Facultad {
    @PrimaryGeneratedColumn({ name: 'id_facultad' })
    idFacultad: number;

    @Column({ length: 255, unique: true })
    nombre: string;

    @Column({ length: 20, nullable: true })
    sigla: string;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;

    @OneToMany(() => Carrera, (carrera) => carrera.facultad)
    carreras: Carrera[];

    @OneToMany(() => Fraternidad, (fraternidad) => fraternidad.facultad)
    fraternidades: Fraternidad[];
}
