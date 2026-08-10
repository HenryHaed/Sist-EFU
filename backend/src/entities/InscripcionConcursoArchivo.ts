import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { InscripcionConcurso } from './InscripcionConcurso';

@Entity('inscripcion_concurso_archivos')
export class InscripcionConcursoArchivo {
  @PrimaryGeneratedColumn({ name: 'id_archivo' })
  idArchivo: number;

  @ManyToOne(() => InscripcionConcurso, (i) => i.archivos, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'id_inscripcion' })
  inscripcion: InscripcionConcurso;

  @Column({ name: 'clave_documento', length: 100 })
  claveDocumento: string;

  @Column({ length: 500 })
  url: string;

  @Column({ length: 120, nullable: true })
  mime: string;

  @Column({ name: 'nombre_original', length: 255, nullable: true })
  nombreOriginal: string;

  @Column({ default: 0 })
  orden: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
