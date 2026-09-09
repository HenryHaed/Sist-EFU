import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { Fase } from './Fase';
import { Usuario } from './Usuario';
import { DesempateCandidato } from './DesempateCandidato';

export enum TipoDesempate {
  CORTE_FINALISTAS = 'CORTE_FINALISTAS',
  PODIO = 'PODIO',
}

export enum EstadoDesempate {
  PENDIENTE = 'PENDIENTE',
  RESUELTO = 'RESUELTO',
}

@Entity('desempates_fase')
export class DesempateFase {
  @PrimaryGeneratedColumn({ name: 'id_desempate' })
  idDesempate: number;

  @ManyToOne(() => Fase, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'id_fase' })
  fase: Fase;

  @Column({ type: 'varchar', length: 30 })
  tipo: TipoDesempate;

  @Column({ type: 'varchar', length: 20, default: EstadoDesempate.PENDIENTE })
  estado: EstadoDesempate;

  /** Cupo N (corte) o 3 (podio). */
  @Column({ type: 'int' })
  cupo: number;

  /** Plazas que el Decisor debe llenar entre candidatas (corte). */
  @Column({ name: 'plazas_libres', type: 'int', default: 0 })
  plazasLibres: number;

  @ManyToOne(() => Usuario, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'id_usuario_decisor' })
  decisor: Usuario | null;

  @OneToMany(() => DesempateCandidato, (c) => c.desempate, { cascade: true })
  candidatos: DesempateCandidato[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
