import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { Fraternidad } from './Fraternidad';

@Entity('instituciones_externas')
export class InstitucionExterna {
    @PrimaryGeneratedColumn({ name: 'id_institucion' })
    idInstitucion: number;

    @Column({ length: 255, unique: true })
    nombre: string;

    @Column({ name: 'tipo_institucion', length: 100, nullable: true })
    tipoInstitucion: string;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;

    @OneToMany(() => Fraternidad, (fraternidad) => fraternidad.institucionExterna)
    fraternidades: Fraternidad[];
}
