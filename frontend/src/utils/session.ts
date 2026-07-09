/** Tiempo máximo de inactividad antes de cerrar sesión por seguridad. */
export const INACTIVITY_TIMEOUT_MS = 30 * 60 * 1000 // 30 minutos

/** Aviso opcional antes del cierre (mostrar modal de advertencia). */
export const INACTIVITY_WARNING_MS = 2 * 60 * 1000 // 2 minutos antes

/**
 * Techo absoluto de duración del JWT (debe coincidir con JWT_EXPIRES_IN del backend).
 * Mientras el usuario esté activo, la sesión se mantiene hasta este límite.
 */
export const SESSION_ABSOLUTE_MS = 12 * 60 * 60 * 1000 // 12 horas

/** @deprecated Usar INACTIVITY_TIMEOUT_MS */
export const SESSION_DURATION_MS = INACTIVITY_TIMEOUT_MS

export const SESSION_DURATION_HOURS = 0.5

export const ACTIVITY_EVENTS = [
  'mousedown',
  'mousemove',
  'keydown',
  'keypress',
  'scroll',
  'touchstart',
  'click',
  'wheel',
] as const

/** Throttle de registro de actividad para no saturar timers (ms). */
export const ACTIVITY_THROTTLE_MS = 1500
