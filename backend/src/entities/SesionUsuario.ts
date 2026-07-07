import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { Usuario } from './Usuario';
import { Gestion } from './Gestion';
import { AuditoriaAccion } from './AuditoriaAccion';

@Entity('sesiones_usuario')
export class SesionUsuario {
  @PrimaryGeneratedColumn({ name: 'id_sesion' })
  idSesion: number;

  @ManyToOne(() => Usuario, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'id_usuario' })
  usuario: Usuario;

  @ManyToOne(() => Gestion, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'id_gestion' })
  gestion: Gestion | null;

  @Column({ name: 'inicio_sesion', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  inicioSesion: Date;

  @Column({ name: 'fin_sesion', type: 'timestamp', nullable: true })
  finSesion: Date | null;

  @Column({ name: 'ip_address', length: 45, nullable: true })
  ipAddress: string | null;

  @Column({ name: 'user_agent', type: 'text', nullable: true })
  userAgent: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @OneToMany(() => AuditoriaAccion, (accion) => accion.sesion)
  acciones: AuditoriaAccion[];
}
