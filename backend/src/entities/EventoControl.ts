import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { Asistencia } from './Asistencia';

@Entity('eventos_control')
export class EventoControl {
    @PrimaryGeneratedColumn({ name: 'id_evento' })
    idEvento: number;

    @Column({ length: 255 })
    nombre: string;

    @Column({ name: 'fecha_hora', type: 'timestamp' })
    fechaHora: Date;

    @Column({ length: 500, nullable: true })
    ubicacion: string;

    @Column({ type: 'text', nullable: true })
    descripcion: string;

    /** true = visible en landing; false = solo delegados (citación por correo). */
    @Column({ name: 'es_publico', default: false })
    esPublico: boolean;

    @Column({ name: 'puntos_penalizacion', type: 'decimal', precision: 5, scale: 2, default: 3 })
    puntosPenalizacion: number;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;

    @OneToMany(() => Asistencia, (asistencia) => asistencia.eventoControl)
    asistencias: Asistencia[];
}
