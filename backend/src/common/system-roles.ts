import { DataSource } from 'typeorm';

/** Roles oficiales del sistema. Se insertan de forma idempotente en producción (sin re-seed). */
export const SYSTEM_ROLES = [
  { nombre: 'superusuario', descripcion: 'Dueño del sistema. Acceso total.' },
  { nombre: 'admin', descripcion: 'Administrador general del evento y gestión de usuarios.' },
  { nombre: 'controladorhcu', descripcion: 'Control de asistencia y disciplina.' },
  { nombre: 'delegado', descripcion: 'Delegado de fraternidad.' },
  { nombre: 'jurado', descripcion: 'Jurado calificador del evento.' },
  {
    nombre: 'veedor',
    descripcion: 'Veedor de solo lectura: estadísticas, reglamento y monografías de fraternidades.',
  },
  {
    nombre: 'concursante',
    descripcion:
      'Concursante de concurso externo: completa inscripción y sube documentos de su fase asignada.',
  },
] as const;

export type NombreRolSistema = (typeof SYSTEM_ROLES)[number]['nombre'];

export function esRolSistema(nombre: string | null | undefined): boolean {
  const n = String(nombre || '').trim().toLowerCase();
  return SYSTEM_ROLES.some((r) => r.nombre === n);
}

/**
 * Garantiza que existan todos los roles del sistema.
 * Idempotente: no duplica ni modifica roles ya presentes (compara sin mayúsculas/espacios).
 */
export async function ensureSystemRoles(dataSource: DataSource): Promise<void> {
  for (const rol of SYSTEM_ROLES) {
    await dataSource.query(
      `
      INSERT INTO roles (nombre, descripcion, created_at, updated_at)
      SELECT $1, $2, NOW(), NOW()
      WHERE NOT EXISTS (
        SELECT 1 FROM roles
        WHERE LOWER(TRIM(nombre)) = LOWER(TRIM($1::text))
      )
      `,
      [rol.nombre, rol.descripcion],
    );
  }
}
