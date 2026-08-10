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
import { Gestion } from './Gestion';

export type PersonaFicha = {
  nombresApellidos: string;
  ci: string;
  matricula: string;
  celular: string;
};

export enum EstadoFichaTecnica {
  BORRADOR = 'BORRADOR',
  GENERADA = 'GENERADA',
}

@Entity('fichas_tecnicas_monografia')
export class FichaTecnicaMonografia {
  @PrimaryGeneratedColumn({ name: 'id_ficha' })
  idFicha: number;

  @OneToOne(() => Fraternidad, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'id_fraternidad' })
  fraternidad: Fraternidad;

  @ManyToOne(() => Gestion, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'id_gestion' })
  gestion: Gestion;

  @Column({ name: 'nombre_fraternidad', length: 255 })
  nombreFraternidad: string;

  @Column({ length: 150, nullable: true })
  categoria: string;

  @Column({ name: 'facultad_carrera', type: 'text', nullable: true })
  facultadCarrera: string;

  /** Instancia de representación heredada de la preinscripción (Facultad, Carrera, UMSA, Externo, …) */
  @Column({ name: 'instancia_representacion', length: 50, nullable: true })
  instanciaRepresentacion: string;

  @Column({ length: 255, nullable: true })
  danza: string;

  @Column({ name: 'lugar_origen_danza', type: 'text', nullable: true })
  lugarOrigenDanza: string;

  @Column({ name: 'sinopsis_danza', type: 'text', nullable: true })
  sinopsisDanza: string;

  @Column({ name: 'resena_historica', type: 'text', nullable: true })
  resenaHistorica: string;

  @Column({ name: 'fecha_fundacion', type: 'date', nullable: true })
  fechaFundacion: string;

  @Column({ type: 'text', nullable: true })
  fundadores: string;

  @Column({ type: 'text', nullable: true })
  premios: string;

  /** Nombre de quien firma (Presidente o Delegado Titular) */
  @Column({ name: 'nombre_firmante', length: 255, nullable: true })
  nombreFirmante: string;

  @Column({ name: 'expositores', type: 'jsonb', nullable: true })
  expositores: PersonaFicha[];

  @Column({ name: 'representantes_traje', type: 'jsonb', nullable: true })
  representantesTraje: PersonaFicha[];

  @Column({
    type: 'varchar',
    length: 20,
    default: EstadoFichaTecnica.BORRADOR,
  })
  estado: EstadoFichaTecnica;

  @Column({ name: 'url_pdf', length: 500, nullable: true })
  urlPdf: string;

  @Column({ name: 'fecha_generacion', type: 'timestamp', nullable: true })
  fechaGeneracion: Date;

  @ManyToOne(() => Usuario, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'id_usuario_actualizo' })
  actualizadoPor: Usuario;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
