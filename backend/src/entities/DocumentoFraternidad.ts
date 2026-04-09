import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Fraternidad } from './Fraternidad';

@Entity('documentos_fraternidad')
export class DocumentoFraternidad {
    @PrimaryGeneratedColumn({ name: 'id_documento' })
    idDocumento: number;

    @ManyToOne(() => Fraternidad)
    @JoinColumn({ name: 'id_fraternidad' })
    fraternidad: Fraternidad;

    @Column({ name: 'tipo_documento', length: 50 })
    tipoDocumento: string;

    @Column({ name: 'url_archivo', length: 500 })
    urlArchivo: string;

    @CreateDateColumn({ name: 'fecha_subida' })
    fechaSubida: Date;
}
