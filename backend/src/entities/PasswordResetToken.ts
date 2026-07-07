import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { Usuario } from './Usuario';

@Entity('password_reset_tokens')
export class PasswordResetToken {
    @PrimaryGeneratedColumn({ name: 'id_token' })
    idToken: number;

    @ManyToOne(() => Usuario, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'id_usuario' })
    usuario: Usuario;

    @Column({ name: 'code_hash', length: 255 })
    codeHash: string;

    @Column({ name: 'expires_at', type: 'timestamp' })
    expiresAt: Date;

    @Column({ default: 0 })
    attempts: number;

    @Column({ name: 'used_at', type: 'timestamp', nullable: true })
    usedAt: Date | null;

    @Column({ name: 'reset_session_id', length: 64, nullable: true })
    resetSessionId: string | null;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;
}
