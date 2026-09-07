import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { Fraternidad } from './Fraternidad';
import { Gestion } from './Gestion';
import { Usuario } from './Usuario';

@Entity('listas_nomina_fraternidad')
@Unique(['fraternidad', 'gestion'])
export class ListaNominaFraternidad {
  @PrimaryGeneratedColumn({ name: 'id_lista' })
  idLista: number;

  @ManyToOne(() => Fraternidad, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'id_fraternidad' })
  fraternidad: Fraternidad;

  @ManyToOne(() => Gestion, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'id_gestion' })
  gestion: Gestion;

  @Column({ name: 'nombre_original', length: 255 })
  nombreOriginal: string;

  @Column({ name: 'url_archivo', length: 500 })
  urlArchivo: string;

  @Column({ name: 'mime_type', length: 120, nullable: true })
  mimeType: string;

  @Column({ name: 'tamano_bytes', type: 'bigint', nullable: true })
  tamanoBytes: number;

  @ManyToOne(() => Usuario, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'id_usuario_subio' })
  subidoPor: Usuario;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
