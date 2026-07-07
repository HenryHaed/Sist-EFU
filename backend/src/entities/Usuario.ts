import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { Role } from './Role';
import { Jurado } from './Jurado';
import { Incidencia } from './Incidencia';
import { Asistencia } from './Asistencia';
import { Fraternidad } from './Fraternidad';

@Entity('usuarios')
export class Usuario {
    @PrimaryGeneratedColumn({ name: 'id_usuario' })
    idUsuario: number;

    @ManyToOne(() => Role, (role) => role.usuarios)
    @JoinColumn({ name: 'id_rol' })
    rol: Role;

    @Column({ length: 20, unique: true })
    ci: string;

    @Column({ length: 150 })
    nombres: string;

    @Column({ name: 'primer_apellido', length: 100 })
    primerApellido: string;

    @Column({ name: 'segundo_apellido', length: 100, nullable: true })
    segundoApellido: string;

    @Column({ length: 255, unique: true, nullable: true })
    correo: string;

    @Column({ length: 255 })
    password: string;

    @ManyToOne(() => Fraternidad, { nullable: true })
    @JoinColumn({ name: 'id_fraternidad' })
    fraternidad: Fraternidad;

    @Column({ name: 'primer_login', default: true })
    primerLogin: boolean;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;

    @OneToMany(() => Jurado, (jurado) => jurado.usuario)
    jurados: Jurado[];

    @OneToMany(() => Incidencia, (incidencia) => incidencia.usuario)
    incidencias: Incidencia[];

    @OneToMany(() => Asistencia, (asistencia) => asistencia.usuario)
    asistencias: Asistencia[];
}
