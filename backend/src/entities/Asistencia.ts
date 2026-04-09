import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Gestion } from './Gestion';
import { Fraternidad } from './Fraternidad';
import { Usuario } from './Usuario';
import { EventoControl } from './EventoControl';

@Entity('asistencias')
export class Asistencia {
    @PrimaryGeneratedColumn({ name: 'id_asistencia' })
    idAsistencia: number;

    @ManyToOne(() => Gestion, (gestion) => gestion.asistencias)
    @JoinColumn({ name: 'id_gestion' })
    gestion: Gestion;

    @ManyToOne(() => Fraternidad, (fraternidad) => fraternidad.asistencias)
    @JoinColumn({ name: 'id_fraternidad' })
    fraternidad: Fraternidad;

    @ManyToOne(() => Usuario, (usuario) => usuario.asistencias)
    @JoinColumn({ name: 'id_usuario' })
    usuario: Usuario;

    @ManyToOne(() => EventoControl, (eventoControl) => eventoControl.asistencias)
    @JoinColumn({ name: 'id_evento' })
    eventoControl: EventoControl;

    @Column({ type: 'boolean', default: false })
    asistio: boolean;

    @Column({ type: 'text', nullable: true })
    observaciones: string;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
}
