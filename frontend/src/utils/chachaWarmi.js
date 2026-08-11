/** Detecta fases / plantillas Chacha-Warmi (plantilla o nombre). */
export function esFaseChachaWarmi(faseOrPlantilla) {
  if (!faseOrPlantilla) return false
  if (typeof faseOrPlantilla === 'string') {
    return String(faseOrPlantilla).toLowerCase() === 'chacha_warmi'
  }
  const plantilla = String(faseOrPlantilla.plantillaRequisitos || '').toLowerCase()
  if (plantilla === 'chacha_warmi') return true
  const nombre = String(faseOrPlantilla.nombre || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[-_\s]+/g, '')
  return nombre.includes('chachawarmi') || (nombre.includes('chacha') && nombre.includes('warmi'))
}
