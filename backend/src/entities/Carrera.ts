import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { Facultad } from './Facultad';
import { Fraternidad } from './Fraternidad';
import { Jurado } from './Jurado';

@Entity('carreras')
export class Carrera {
    @PrimaryGeneratedColumn({ name: 'id_carrera' })
    idCarrera: number;

    @ManyToOne(() => Facultad, (facultad) => facultad.carreras)
    @JoinColumn({ name: 'id_facultad' })
    facultad: Facultad;

    @Column({ length: 255 })
    nombre: string;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;

    @OneToMany(() => Fraternidad, (fraternidad) => fraternidad.carrera)
    fraternidades: Fraternidad[];

    @OneToMany(() => Jurado, (jurado) => jurado.carrera)
    jurados: Jurado[];
}
