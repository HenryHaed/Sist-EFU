import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Gestion } from './Gestion';
import { Fraternidad } from './Fraternidad';
import { Usuario } from './Usuario';

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

    @Column({ name: 'fecha_hora', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    fechaHora: Date;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
}
