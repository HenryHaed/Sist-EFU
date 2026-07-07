import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Fraternidad } from './Fraternidad';
import { Usuario } from './Usuario';

@Entity('monografias')
export class Monografia {
  @PrimaryGeneratedColumn({ name: 'id_monografia' })
  idMonografia: number;

  @OneToOne(() => Fraternidad, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'id_fraternidad' })
  fraternidad: Fraternidad;

  @Column({ name: 'url_archivo', length: 500 })
  urlArchivo: string;

  @Column({ name: 'nombre_archivo', length: 255, nullable: true })
  nombreArchivo: string;

  @ManyToOne(() => Usuario, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'id_usuario_subio' })
  subidoPor: Usuario;

  @CreateDateColumn({ name: 'fecha_subida' })
  fechaSubida: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
