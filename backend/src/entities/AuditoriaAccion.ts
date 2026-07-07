import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Usuario } from './Usuario';
import { Gestion } from './Gestion';
import { SesionUsuario } from './SesionUsuario';

@Entity('auditoria_acciones')
@Index(['createdAt'])
@Index(['modulo'])
export class AuditoriaAccion {
  @PrimaryGeneratedColumn({ name: 'id_registro' })
  idRegistro: number;

  @ManyToOne(() => SesionUsuario, (sesion) => sesion.acciones, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'id_sesion' })
  sesion: SesionUsuario | null;

  @ManyToOne(() => Usuario, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'id_usuario' })
  usuario: Usuario | null;

  @ManyToOne(() => Gestion, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'id_gestion' })
  gestion: Gestion | null;

  @Column({ length: 10 })
  metodo: string;

  @Column({ length: 500 })
  ruta: string;

  @Column({ length: 100, nullable: true })
  modulo: string | null;

  @Column({ type: 'text', nullable: true })
  descripcion: string | null;

  @Column({ name: 'cuerpo_solicitud', type: 'jsonb', nullable: true })
  cuerpoSolicitud: Record<string, unknown> | null;

  @Column({ name: 'codigo_respuesta', type: 'int', nullable: true })
  codigoRespuesta: number | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
