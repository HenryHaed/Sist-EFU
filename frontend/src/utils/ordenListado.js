/**
 * Orden de listados de fraternidades / concursos para revisión y calificación.
 * Criterios: fechaSolicitud (default ASC), nombre, instancia.
 */

export const ORDEN_CRITERIOS = [
  { id: 'fechaSolicitud', label: 'Fecha de solicitud' },
  { id: 'nombre', label: 'Nombre' },
  { id: 'instancia', label: 'Instancia' },
]

export function compareFechaAsc(a, b) {
  const ta = a ? new Date(a).getTime() : Number.POSITIVE_INFINITY
  const tb = b ? new Date(b).getTime() : Number.POSITIVE_INFINITY
  if (Number.isNaN(ta) && Number.isNaN(tb)) return 0
  if (Number.isNaN(ta)) return 1
  if (Number.isNaN(tb)) return -1
  return ta - tb
}

export function compareTextoEs(a, b) {
  return String(a || '').localeCompare(String(b || ''), 'es', { sensitivity: 'base' })
}

/**
 * @param {Array} list
 * @param {'fechaSolicitud'|'nombre'|'instancia'} criterio
 * @param {'asc'|'desc'} dir
 * @param {(item: any) => object} getters - { fecha, nombre, instancia, id }
 */
export function ordenarListado(list, criterio, dir = 'asc', getters = {}) {
  const getFecha = getters.fecha || ((x) => x.fechaSolicitud || x.fechaEnvio || x.createdAt)
  const getNombre = getters.nombre || ((x) => x.nombre || x.nombreFraternidad || '')
  const getInstancia =
    getters.instancia ||
    ((x) => x.instanciaRepresentacion || x.instancia || x.nivelRepresentacion || '')
  const getId = getters.id || ((x) => x.idFraternidad || x.idInscripcion || x.idParticipante || 0)

  const mult = dir === 'desc' ? -1 : 1
  return [...list].sort((a, b) => {
    let cmp = 0
    if (criterio === 'nombre') {
      cmp = compareTextoEs(getNombre(a), getNombre(b))
    } else if (criterio === 'instancia') {
      cmp = compareTextoEs(getInstancia(a), getInstancia(b))
      if (cmp === 0) cmp = compareTextoEs(getNombre(a), getNombre(b))
    } else {
      // fechaSolicitud (default)
      cmp = compareFechaAsc(getFecha(a), getFecha(b))
      if (dir === 'desc') cmp = -cmp
      if (cmp === 0) cmp = compareTextoEs(getNombre(a), getNombre(b))
      if (cmp === 0) return Number(getId(a)) - Number(getId(b))
      return cmp
    }
    if (cmp === 0) cmp = compareFechaAsc(getFecha(a), getFecha(b))
    if (cmp === 0) return Number(getId(a)) - Number(getId(b))
    return cmp * mult
  })
}

export function formatFechaSolicitud(valor) {
  if (!valor) return '—'
  const d = new Date(valor)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleString('es-BO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}
