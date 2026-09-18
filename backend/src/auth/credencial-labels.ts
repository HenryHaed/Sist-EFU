/** Roles que pueden generar credencial del sistema. */
export const ROLES_CREDENCIAL = new Set([
  'admin',
  'jurado',
  'controladorhcu',
  'superusuario',
]);

export type EtiquetaCredencial = {
  titulo: string;
  subtitulo: string;
};

export function etiquetaRolCredencial(rol?: string | null): EtiquetaCredencial {
  const r = String(rol || '').toLowerCase().trim();
  switch (r) {
    case 'superusuario':
      return { titulo: 'Super Usuario', subtitulo: 'Desarrollador del Sistema' };
    case 'admin':
      return { titulo: 'Administrador', subtitulo: 'Gestión del evento oficial' };
    case 'jurado':
      return { titulo: 'Jurado', subtitulo: 'Calificación oficial' };
    case 'controladorhcu':
      return { titulo: 'Controlador', subtitulo: 'Asistencia y disciplina' };
    case 'delegado':
      return { titulo: 'Delegado', subtitulo: 'Representante de fraternidad' };
    case 'veedor':
      return { titulo: 'Veedor', subtitulo: 'Observación del proceso' };
    case 'concursante':
      return { titulo: 'Concursante', subtitulo: 'Concurso externo' };
    default:
      return { titulo: rol || 'Usuario', subtitulo: 'Sistema EFU' };
  }
}

export function etiquetaRolCorta(rol?: string | null): string {
  return etiquetaRolCredencial(rol).titulo;
}

export function puedeGenerarCredencial(rol?: string | null): boolean {
  return ROLES_CREDENCIAL.has(String(rol || '').toLowerCase().trim());
}
