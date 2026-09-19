/**
 * Orden de listados de fraternidades / concursos para revisión y calificación.
 * Criterios: orden oficial (desfile), fechaSolicitud, nombre, instancia.
 */

export const ORDEN_CRITERIOS = [
  { id: 'ordenOficial', label: 'Orden oficial' },
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

function compareOrdenOficial(a, b, getOrden, getNombre, getId) {
  const oa = getOrden(a)
  const ob = getOrden(b)
  const aNum = oa != null && oa !== '' && Number.isFinite(Number(oa))
  const bNum = ob != null && ob !== '' && Number.isFinite(Number(ob))
  if (aNum && bNum && Number(oa) !== Number(ob)) return Number(oa) - Number(ob)
  if (aNum && !bNum) return -1
  if (!aNum && bNum) return 1
  const byNombre = compareTextoEs(getNombre(a), getNombre(b))
  if (byNombre !== 0) return byNombre
  return Number(getId(a)) - Number(getId(b))
}

/**
 * @param {Array} list
 * @param {'ordenOficial'|'fechaSolicitud'|'nombre'|'instancia'} criterio
 * @param {'asc'|'desc'} dir
 * @param {(item: any) => object} getters - { fecha, nombre, instancia, id, orden }
 */
export function ordenarListado(list, criterio, dir = 'asc', getters = {}) {
  const getFecha = getters.fecha || ((x) => x.fechaSolicitud || x.fechaEnvio || x.createdAt)
  const getNombre = getters.nombre || ((x) => x.nombre || x.nombreFraternidad || '')
  const getInstancia =
    getters.instancia ||
    ((x) => x.instanciaRepresentacion || x.instancia || x.nivelRepresentacion || '')
  const getId = getters.id || ((x) => x.idFraternidad || x.idInscripcion || x.idParticipante || 0)
  const getOrden = getters.orden || ((x) => x.ordenDesfile ?? x.orden ?? null)

  const mult = dir === 'desc' ? -1 : 1
  return [...list].sort((a, b) => {
    let cmp = 0
    if (criterio === 'ordenOficial') {
      cmp = compareOrdenOficial(a, b, getOrden, getNombre, getId)
      return dir === 'desc' ? -cmp : cmp
    }
    if (criterio === 'nombre') {
      cmp = compareTextoEs(getNombre(a), getNombre(b))
    } else if (criterio === 'instancia') {
      cmp = compareTextoEs(getInstancia(a), getInstancia(b))
      if (cmp === 0) cmp = compareTextoEs(getNombre(a), getNombre(b))
    } else {
      // fechaSolicitud (legacy default)
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

/**
 * Prioridad en listado de calificación:
 * EN_PROGRESO (continuar) → PENDIENTE → COMPLETADO (al final).
 */
export function rankEstadoCalificacion(estado) {
  const e = String(estado || '').toUpperCase()
  if (e === 'EN_PROGRESO') return 0
  if (e === 'COMPLETADO') return 2
  return 1
}

/** Pendientes: en progreso primero; conserva orden relativo previo. */
export function ordenarPendientesCalificacion(list) {
  return [...(list || [])].sort((a, b) => {
    const ra = rankEstadoCalificacion(a?.estadoEvaluacion)
    const rb = rankEstadoCalificacion(b?.estadoEvaluacion)
    return ra - rb
  })
}

/**
 * Ya selladas: van al final del listado; entre ellas, las recién cerradas al fondo
 * (orden cronológico de sellado).
 */
export function ordenarCalificadosAlFinal(list) {
  return [...(list || [])].sort((a, b) => {
    const byCierre = compareFechaAsc(a?.fechaCierre, b?.fechaCierre)
    if (byCierre !== 0) return byCierre
    return String(a?.nombre || '').localeCompare(String(b?.nombre || ''), 'es')
  })
}
