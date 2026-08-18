import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Unique,
} from 'typeorm';
import { Gestion } from './Gestion';

@Entity('cronogramas_actividad')
@Unique('uq_cronograma_actividad_gestion_tipo', ['gestion', 'tipo'])
export class CronogramaActividad {
  @PrimaryGeneratedColumn({ name: 'id_cronograma_actividad' })
  idCronogramaActividad: number;

  @ManyToOne(() => Gestion, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'id_gestion' })
  gestion: Gestion;

  /** MONOGRAFIA | FICHA_TECNICA */
  @Column({ length: 40 })
  tipo: string;

  @Column({ name: 'fecha_inicio', type: 'timestamp' })
  fechaInicio: Date;

  @Column({ name: 'fecha_fin', type: 'timestamp' })
  fechaFin: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
