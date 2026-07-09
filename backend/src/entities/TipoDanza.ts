import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('tipos_danza')
export class TipoDanza {
  @PrimaryGeneratedColumn({ name: 'id_tipo_danza' })
  idTipoDanza: number;

  @Column({ length: 120, unique: true })
  nombre: string;

  @Column({ type: 'int', default: 0 })
  orden: number;

  @Column({ default: true })
  activo: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
