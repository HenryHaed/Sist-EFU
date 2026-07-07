import { BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';

const PASSWORD_MIN_LENGTH = 8;

export function validatePasswordPolicy(password: string, ci?: string): void {
    if (!password || password.length < PASSWORD_MIN_LENGTH) {
        throw new BadRequestException(
            `La contraseña debe tener al menos ${PASSWORD_MIN_LENGTH} caracteres.`,
        );
    }
    if (!/[A-Z]/.test(password)) {
        throw new BadRequestException('La contraseña debe incluir al menos una letra mayúscula.');
    }
    if (!/[a-z]/.test(password)) {
        throw new BadRequestException('La contraseña debe incluir al menos una letra minúscula.');
    }
    if (!/[0-9]/.test(password)) {
        throw new BadRequestException('La contraseña debe incluir al menos un número.');
    }
    if (ci && password.trim() === ci.trim()) {
        throw new BadRequestException('La contraseña no puede ser igual al CI.');
    }
}

export async function assertPasswordNotReused(
    newPassword: string,
    currentHash: string | undefined,
): Promise<void> {
    if (!currentHash) return;
    const isSame = await bcrypt.compare(newPassword, currentHash);
    if (isSame) {
        throw new BadRequestException('La nueva contraseña no puede ser igual a la actual.');
    }
}

export function normalizeEmail(correo: string): string {
    return correo.trim().toLowerCase();
}
