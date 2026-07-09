const CI_MIN_DIGITOS = 5
const CI_MAX_DIGITOS = 20

export function normalizarCiUsuario(ci) {
  return String(ci || '').trim().replace(/\D/g, '')
}

export function validarCiUsuario(ci) {
  const digits = normalizarCiUsuario(ci)
  if (digits.length < CI_MIN_DIGITOS) {
    return `El CI debe tener al menos ${CI_MIN_DIGITOS} dígitos numéricos.`
  }
  if (digits.length > CI_MAX_DIGITOS) {
    return `El CI no puede superar ${CI_MAX_DIGITOS} dígitos.`
  }
  return null
}
