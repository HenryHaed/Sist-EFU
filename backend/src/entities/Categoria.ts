import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { Fraternidad } from './Fraternidad';

@Entity('categorias')
export class Categoria {
    @PrimaryGeneratedColumn({ name: 'id_categoria' })
    idCategoria: number;

    @Column({ length: 50 })
    nombre: string;

    @Column({ type: 'text', nullable: true })
    descripcion: string;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;

    @OneToMany(() => Fraternidad, (fraternidad) => fraternidad.categoria)
    fraternidades: Fraternidad[];
}
