import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
  Unique,
} from 'typeorm';
import { Usuario } from './Usuario';
import { Fase } from './Fase';
import { Gestion } from './Gestion';
import { InscripcionConcursoArchivo } from './InscripcionConcursoArchivo';
import { Participante } from './Participante';

export enum EstadoInscripcionConcurso {
  BORRADOR = 'BORRADOR',
  PENDIENTE = 'PENDIENTE',
  OBSERVADO = 'OBSERVADO',
  APROBADO = 'APROBADO',
  RECHAZADO = 'RECHAZADO',
}

@Entity('inscripciones_concurso')
@Unique(['usuario', 'fase'])
export class InscripcionConcurso {
  @PrimaryGeneratedColumn({ name: 'id_inscripcion' })
  idInscripcion: number;

  @ManyToOne(() => Usuario, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'id_usuario' })
  usuario: Usuario;

  @ManyToOne(() => Fase, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'id_fase' })
  fase: Fase;

  @ManyToOne(() => Gestion, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'id_gestion' })
  gestion: Gestion;

  @Column({
    type: 'varchar',
    length: 20,
    default: EstadoInscripcionConcurso.BORRADOR,
  })
  estado: EstadoInscripcionConcurso;

  @Column({ type: 'jsonb', nullable: true })
  datos: Record<string, any>;

  @Column({ name: 'observacion_admin', type: 'text', nullable: true })
  observacionAdmin: string;

  @ManyToOne(() => Participante, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'id_participante' })
  participante: Participante;

  @OneToMany(() => InscripcionConcursoArchivo, (a) => a.inscripcion, { cascade: true })
  archivos: InscripcionConcursoArchivo[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
