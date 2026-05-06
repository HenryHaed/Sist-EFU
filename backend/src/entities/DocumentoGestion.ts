import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Gestion } from './Gestion';

@Entity('documentos_gestion')
export class DocumentoGestion {
    @PrimaryGeneratedColumn({ name: 'id_documento' })
    idDocumento: number;

    @Column({ length: 255 })
    titulo: string;

    @Column({ type: 'text', nullable: true })
    descripcion: string;

    // Tipo de documento: 'reglamento_efu', 'reglamento_afiche', 'reglamento_chachawarmi', etc.
    @Column({ length: 100, default: 'otro' })
    tipo: string;

    // Ruta relativa del PDF: /api/v1/archivos/doc-gestion/<filename>
    @Column({ name: 'url_pdf', length: 500 })
    urlPdf: string;

    // Orden de visualización
    @Column({ default: 0 })
    orden: number;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @ManyToOne(() => Gestion, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'id_gestion' })
    gestion: Gestion;
}
