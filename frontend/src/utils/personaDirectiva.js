export const PERSONAS_DIRECTIVA = [
  { prefix: 'presi', label: 'Presidente', hasCelular: true },
  { prefix: 'vice', label: 'Vicepresidente', hasCelular: true },
  { prefix: 'secGen', label: 'Secretario General', hasCelular: false },
  { prefix: 'secHaci', label: 'Secretario de Hacienda', hasCelular: false },
  { prefix: 'secActas', label: 'Secretario de Actas', hasCelular: false },
  { prefix: 'secPrensa', label: 'Secretario de Prensa', hasCelular: false },
  { prefix: 'vocal', label: 'Vocal', hasCelular: false },
  { prefix: 'delCogob', label: 'Delegado a Co-Gobierno', hasCelular: true },
  { prefix: 'delTitular', label: 'Delegado Titular', hasCelular: true },
  { prefix: 'delSuplente', label: 'Delegado Suplente', hasCelular: true },
]

export const CAMPOS_NOMBRE_PERSONA = PERSONAS_DIRECTIVA.flatMap(({ prefix }) => [
  `${prefix}Nombres`,
  `${prefix}PrimerApellido`,
  `${prefix}SegundoApellido`,
])

export function nombreCompletoPersona(source, prefix) {
  if (!source) return ''
  return [
    source[`${prefix}Nombres`],
    source[`${prefix}PrimerApellido`],
    source[`${prefix}SegundoApellido`],
  ]
    .filter((part) => part && String(part).trim())
    .join(' ')
    .trim()
}

export function crearEstadoVacioPersonas() {
  const estado = {}
  PERSONAS_DIRECTIVA.forEach(({ prefix, hasCelular }) => {
    estado[`${prefix}Nombres`] = ''
    estado[`${prefix}PrimerApellido`] = ''
    estado[`${prefix}SegundoApellido`] = ''
    estado[`${prefix}Ci`] = ''
    if (hasCelular) estado[`${prefix}Celular`] = ''
  })
  return estado
}

export function hidratarPersonasDesdeSolicitud(solicitud) {
  const estado = crearEstadoVacioPersonas()
  if (!solicitud) return estado

  PERSONAS_DIRECTIVA.forEach(({ prefix, hasCelular }) => {
    estado[`${prefix}Nombres`] = solicitud[`${prefix}Nombres`] || ''
    estado[`${prefix}PrimerApellido`] = solicitud[`${prefix}PrimerApellido`] || ''
    estado[`${prefix}SegundoApellido`] = solicitud[`${prefix}SegundoApellido`] || ''
    estado[`${prefix}Ci`] = solicitud[`${prefix}Ci`] || ''
    if (hasCelular) estado[`${prefix}Celular`] = solicitud[`${prefix}Celular`] || ''
  })

  return estado
}

export const MAP_ADMIN_KEY_TO_DELEGADO = PERSONAS_DIRECTIVA.reduce((map, { prefix, label, hasCelular }) => {
  map[`${label}-nombres`] = `${prefix}Nombres`
  map[`${label}-paterno`] = `${prefix}PrimerApellido`
  map[`${label}-materno`] = `${prefix}SegundoApellido`
  map[`${label}-ci`] = `${prefix}Ci`
  if (hasCelular) map[`${label}-celular`] = `${prefix}Celular`
  map[`${label}-nombre`] = `${prefix}Nombres`
  return map
}, {})

export const CAMPOS_CI_DIRECTIVA = PERSONAS_DIRECTIVA.map(({ prefix, label }) => ({
  field: `${prefix}Ci`,
  label,
}))

export const DOCUMENTOS_DEUDA = [
  {
    fileKey: 'sinDeudasFraternidad',
    urlField: 'urlSinDeudasFraternidad',
    label: 'Certificado de no adeudar a la fraternidad',
    point: 34,
    icon: 'verified',
  },
  {
    fileKey: 'sinDeudasAreas',
    urlField: 'urlSinDeudasAreas',
    label: 'Certificado de no adeudar a las áreas desconcentradas',
    point: 35,
    icon: 'verified_user',
  },
]

export function docFileKeyFromPrefix(prefix) {
  return `ciMatricula${prefix.charAt(0).toUpperCase()}${prefix.slice(1)}`
}

export function docUrlFieldFromPrefix(prefix) {
  return `urlCiMatricula${prefix.charAt(0).toUpperCase()}${prefix.slice(1)}`
}

export const DOCUMENTOS_CI_MATRICULA = PERSONAS_DIRECTIVA.map(({ prefix, label }) => ({
  prefix,
  label,
  fileKey: docFileKeyFromPrefix(prefix),
  urlField: docUrlFieldFromPrefix(prefix),
}))

export function crearEstadoVacioArchivosCi() {
  const estado = {}
  DOCUMENTOS_CI_MATRICULA.forEach(({ fileKey }) => {
    estado[fileKey] = null
  })
  return estado
}

export function hidratarArchivosCiDesdeSolicitud(solicitud) {
  const estado = {}
  DOCUMENTOS_CI_MATRICULA.forEach(({ fileKey, urlField }) => {
    estado[fileKey] = solicitud?.[urlField] || ''
  })
  return estado
}
