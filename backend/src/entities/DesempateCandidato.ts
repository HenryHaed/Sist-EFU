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
import { DesempateFase } from './DesempateFase';
import { Fraternidad } from './Fraternidad';

export enum DecisionDesempate {
  PENDIENTE = 'PENDIENTE',
  PASA = 'PASA',
  NO_PASA = 'NO_PASA',
}

@Entity('desempate_candidatos')
@Unique(['desempate', 'fraternidad'])
export class DesempateCandidato {
  @PrimaryGeneratedColumn({ name: 'id_candidato' })
  idCandidato: number;

  @ManyToOne(() => DesempateFase, (d) => d.candidatos, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'id_desempate' })
  desempate: DesempateFase;

  @ManyToOne(() => Fraternidad, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'id_fraternidad' })
  fraternidad: Fraternidad;

  @Column({ type: 'decimal', precision: 8, scale: 2, nullable: true })
  nota: number | null;

  @Column({ name: 'puesto_provisional', type: 'int', nullable: true })
  puestoProvisional: number | null;

  @Column({ type: 'varchar', length: 20, default: DecisionDesempate.PENDIENTE })
  decision: DecisionDesempate;

  /** Solo PODIO: 1, 2 o 3. */
  @Column({ name: 'orden_podio', type: 'int', nullable: true })
  ordenPodio: number | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
