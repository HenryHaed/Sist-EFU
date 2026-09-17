import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  Unique,
} from 'typeorm';
import { ListaNominaFraternidad } from './ListaNominaFraternidad';
import { Fraternidad } from './Fraternidad';
import { Gestion } from './Gestion';

/**
 * Integrante registrado vía nómina Excel.
 * No es un usuario del sistema: solo control de quién baila.
 */
@Entity('miembros_nomina')
@Unique(['gestion', 'fraternidad', 'ci'])
@Index(['lista'])
export class MiembroNomina {
  @PrimaryGeneratedColumn({ name: 'id_miembro' })
  idMiembro: number;

  @ManyToOne(() => ListaNominaFraternidad, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'id_lista' })
  lista: ListaNominaFraternidad;

  @ManyToOne(() => Fraternidad, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'id_fraternidad' })
  fraternidad: Fraternidad;

  @ManyToOne(() => Gestion, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'id_gestion' })
  gestion: Gestion;

  @Column({ name: 'nombres', length: 150 })
  nombres: string;

  @Column({ name: 'apellido_paterno', length: 100 })
  apellidoPaterno: string;

  @Column({ name: 'apellido_materno', length: 100, nullable: true })
  apellidoMaterno: string | null;

  @Column({ name: 'ci', length: 30 })
  ci: string;

  /**
   * Categoría de la persona en la nómina.
   * ESTUDIANTE | DOCENTE | ADMINISTRATIVO | EXTERNO
   */
  @Column({ name: 'tipo_persona', length: 20, default: 'ESTUDIANTE' })
  tipoPersona: string;

  @Column({ name: 'correo', length: 180, nullable: true })
  correo: string | null;

  @Column({ name: 'celular', length: 30, nullable: true })
  celular: string | null;

  @Column({ name: 'registro_universitario', length: 40, nullable: true })
  registroUniversitario: string | null;

  /** Snapshot del tipo de danza al importar (heredado de la fraternidad, no viene del Excel). */
  @Column({ name: 'tipo_danza', length: 120, nullable: true })
  tipoDanza: string | null;

  /**
   * Seguro otorgado por admin/superusuario.
   * Solo ellos pueden marcar/desmarcar; el delegado no lo controla.
   */
  @Column({ name: 'asegurado', type: 'boolean', default: false })
  asegurado: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
