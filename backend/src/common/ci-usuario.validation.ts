import { BadRequestException } from '@nestjs/common';

const CI_USUARIO_MIN_DIGITOS = 5;
const CI_USUARIO_MAX_DIGITOS = 20;

/** Extrae solo dígitos del CI de usuario (sin complemento SEGIP). */
export function normalizarCiUsuario(ci: string | null | undefined): string {
    return String(ci || '').trim().replace(/\D/g, '');
}

export function validarCiUsuario(ci: string | null | undefined): string {
    const digits = normalizarCiUsuario(ci);
    if (digits.length < CI_USUARIO_MIN_DIGITOS) {
        throw new BadRequestException(
            `El CI debe tener al menos ${CI_USUARIO_MIN_DIGITOS} dígitos numéricos.`,
        );
    }
    if (digits.length > CI_USUARIO_MAX_DIGITOS) {
        throw new BadRequestException(
            `El CI no puede superar ${CI_USUARIO_MAX_DIGITOS} dígitos.`,
        );
    }
    return digits;
}
