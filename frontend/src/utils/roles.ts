/** Etiquetas de rol para UI y credencial (espejo del backend). */

export function etiquetaRol(rol?: string | null): { titulo: string; subtitulo: string } {
  const r = String(rol || '').toLowerCase().trim()
  switch (r) {
    case 'superusuario':
      return { titulo: 'Super Usuario', subtitulo: 'Desarrollador del Sistema' }
    case 'admin':
      return { titulo: 'Administrador', subtitulo: 'Gestión del evento oficial' }
    case 'jurado':
      return { titulo: 'Jurado', subtitulo: 'Calificación oficial' }
    case 'controladorhcu':
      return { titulo: 'Controlador', subtitulo: 'Asistencia y disciplina' }
    case 'delegado':
      return { titulo: 'Delegado', subtitulo: 'Representante de fraternidad' }
    case 'veedor':
      return { titulo: 'Veedor', subtitulo: 'Observación del proceso' }
    case 'concursante':
      return { titulo: 'Concursante', subtitulo: 'Concurso externo' }
    default:
      return { titulo: rol || 'Usuario', subtitulo: 'Sistema EFU' }
  }
}

export function puedeGenerarCredencial(rol?: string | null): boolean {
  const r = String(rol || '').toLowerCase().trim()
  return ['admin', 'jurado', 'controladorhcu', 'superusuario'].includes(r)
}

export function nombreCompletoUsuario(user?: {
  nombres?: string
  primerApellido?: string
  segundoApellido?: string
} | null): string {
  if (!user) return ''
  return [user.nombres, user.primerApellido, user.segundoApellido].filter(Boolean).join(' ').trim()
}
