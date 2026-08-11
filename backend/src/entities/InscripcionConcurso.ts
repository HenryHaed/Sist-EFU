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
import { Fraternidad } from './Fraternidad';
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

  /** Fraternidad dueña (Chacha-Warmi inscrita por delegado). Null en concursos de concursante. */
  @ManyToOne(() => Fraternidad, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'id_fraternidad' })
  fraternidad: Fraternidad;

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

  /** Checklist de revisión admin: ✓ / ✕ por campo o documento (igual que solicitudes). */
  @Column({ name: 'revision_checklist', type: 'jsonb', nullable: true, default: {} })
  revisionChecklist: Record<
    string,
    { estado: 'PENDIENTE' | 'OK' | 'X'; label?: string; value?: string; comentario?: string }
  >;

  /** Chacha (titular) o único participante en concursos de concursante */
  @ManyToOne(() => Participante, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'id_participante' })
  participante: Participante;

  /** Warmi (pareja) — solo Chacha-Warmi */
  @ManyToOne(() => Participante, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'id_participante_pareja' })
  participantePareja: Participante;

  @OneToMany(() => InscripcionConcursoArchivo, (a) => a.inscripcion, { cascade: true })
  archivos: InscripcionConcursoArchivo[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
