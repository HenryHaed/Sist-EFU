import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Gestion } from './Gestion';
import { Fraternidad } from './Fraternidad';
import { Usuario } from './Usuario';
import { Infraccion } from './Infraccion';

@Entity('incidencias')
export class Incidencia {
    @PrimaryGeneratedColumn({ name: 'id_incidencia' })
    idIncidencia: number;

    @ManyToOne(() => Gestion, (gestion) => gestion.incidencias)
    @JoinColumn({ name: 'id_gestion' })
    gestion: Gestion;

    @ManyToOne(() => Fraternidad, (fraternidad) => fraternidad.incidencias)
    @JoinColumn({ name: 'id_fraternidad' })
    fraternidad: Fraternidad;

    @ManyToOne(() => Usuario, (usuario) => usuario.incidencias)
    @JoinColumn({ name: 'id_usuario' })
    usuario: Usuario;

    @ManyToOne(() => Infraccion, (infraccion) => infraccion.incidencias)
    @JoinColumn({ name: 'id_infraccion' })
    infraccion: Infraccion;

    @Column({ name: 'fecha_hora', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    fechaHora: Date;

    @Column({ type: 'text', nullable: true })
    observacion: string;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
}
