export const PERSONAS_DIRECTIVA = [
  { prefix: 'presi', label: 'Presidente', hasCelular: true, required: true },
  { prefix: 'vice', label: 'Vicepresidente', hasCelular: true, required: true },
  { prefix: 'secGen', label: 'Secretario General', hasCelular: false, required: false },
  { prefix: 'secHaci', label: 'Secretario de Hacienda', hasCelular: false, required: true },
  { prefix: 'secActas', label: 'Secretario de Actas', hasCelular: false, required: false },
  { prefix: 'secPrensa', label: 'Secretario de Prensa', hasCelular: false, required: false },
  { prefix: 'vocal', label: 'Vocal', hasCelular: false, required: false },
  { prefix: 'delCogob', label: 'Delegado a Co-Gobierno', hasCelular: true, required: true },
  { prefix: 'delTitular', label: 'Delegado Titular', hasCelular: true, required: true },
  { prefix: 'delSuplente', label: 'Delegado Suplente', hasCelular: true, required: true },
]

export const PERSONAS_OBLIGATORIAS = PERSONAS_DIRECTIVA.filter((p) => p.required)
export const PERSONAS_OPCIONALES = PERSONAS_DIRECTIVA.filter((p) => !p.required)

export function esCargoObligatorio(prefix) {
  return PERSONAS_DIRECTIVA.some((p) => p.prefix === prefix && p.required)
}

export const CAMPOS_NOMBRE_PERSONA = PERSONAS_DIRECTIVA.flatMap(({ prefix }) => [
  `${prefix}Nombres`,
  `${prefix}PrimerApellido`,
  `${prefix}SegundoApellido`,
])

export function campoCiComplemento(prefix) {
  return `${prefix}CiComplemento`
}

export function normalizarComplementoCi(val) {
  let v = String(val || '').trim().toUpperCase().replace(/\s/g, '')
  if (!v) return ''
  if (!v.startsWith('-')) v = `-${v.replace(/^-*/, '')}`
  return v
}

export function formatCiDisplay(ci, complemento) {
  const base = String(ci || '').trim()
  const comp = normalizarComplementoCi(complemento)
  if (!base) return '—'
  return comp ? `${base} ${comp}` : base
}

/** Solo el número de CI, sin complemento SEGIP (para vistas de revisión). */
export function formatCiSoloBase(ci) {
  const raw = String(ci || '').trim()
  if (!raw) return '—'
  const soloDigitos = raw.match(/^(\d+)/)
  return soloDigitos ? soloDigitos[1] : raw
}

export function ciIdentificador(ci, complemento) {
  const base = String(ci || '').trim()
  const comp = normalizarComplementoCi(complemento)
  if (!base) return ''
  return `${base}|${comp}`
}

export function crearEstadoVacioComplementoActivo() {
  const estado = {}
  PERSONAS_DIRECTIVA.forEach(({ prefix }) => {
    estado[prefix] = false
  })
  return estado
}

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
    estado[`${prefix}CiComplemento`] = ''
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
    estado[`${prefix}CiComplemento`] = solicitud[`${prefix}CiComplemento`] || ''
    if (hasCelular) estado[`${prefix}Celular`] = solicitud[`${prefix}Celular`] || ''
  })

  return estado
}

export function hidratarComplementoActivoDesdeSolicitud(solicitud) {
  const estado = crearEstadoVacioComplementoActivo()
  if (!solicitud) return estado
  PERSONAS_DIRECTIVA.forEach(({ prefix }) => {
    estado[prefix] = Boolean(String(solicitud[`${prefix}CiComplemento`] || '').trim())
  })
  return estado
}

export const MAP_ADMIN_KEY_TO_DELEGADO = PERSONAS_DIRECTIVA.reduce((map, { prefix, label, hasCelular }) => {
  map[`${label}-nombres`] = `${prefix}Nombres`
  map[`${label}-paterno`] = `${prefix}PrimerApellido`
  map[`${label}-materno`] = `${prefix}SegundoApellido`
  map[`${label}-ci`] = `${prefix}Ci`
  map[`${label}-ci-complemento`] = `${prefix}CiComplemento`
  if (hasCelular) map[`${label}-celular`] = `${prefix}Celular`
  map[`${label}-nombre`] = `${prefix}Nombres`
  return map
}, {})

export const CAMPOS_CI_DIRECTIVA = PERSONAS_DIRECTIVA.map(({ prefix, label }) => ({
  field: `${prefix}Ci`,
  complementoField: `${prefix}CiComplemento`,
  label,
}))

/** Tipos de PDF por cada integrante de la directiva */
export const TIPOS_DOCUMENTO_PERSONA = [
  { type: 'ci', label: 'CI', shortLabel: 'CI', filePrefix: 'ci', urlInfix: 'Ci', icon: 'badge' },
  { type: 'matricula', label: 'Matrícula', shortLabel: 'Matrícula', filePrefix: 'matricula', urlInfix: 'Matricula', icon: 'school' },
  { type: 'deudaFrat', label: 'Certificado de no adeudar a la fraternidad', shortLabel: 'No deudas fraternidad', filePrefix: 'sinDeudasFraternidad', urlInfix: 'SinDeudasFraternidad', icon: 'verified' },
  { type: 'deudaAreas', label: 'Certificado de no adeudar a las áreas desconcentradas', shortLabel: 'No deudas áreas', filePrefix: 'sinDeudasAreas', urlInfix: 'SinDeudasAreas', icon: 'verified_user' },
]

export function capitalizePrefix(prefix) {
  return `${prefix.charAt(0).toUpperCase()}${prefix.slice(1)}`
}

export function docFileKey(prefix, type) {
  const doc = TIPOS_DOCUMENTO_PERSONA.find((d) => d.type === type)
  if (!doc) return ''
  return `${doc.filePrefix}${capitalizePrefix(prefix)}`
}

export function docUrlField(prefix, type) {
  const doc = TIPOS_DOCUMENTO_PERSONA.find((d) => d.type === type)
  if (!doc) return ''
  return `url${doc.urlInfix}${capitalizePrefix(prefix)}`
}

/** Todos los documentos PDF por persona (4 × N cargos) */
export const DOCUMENTOS_POR_PERSONA = PERSONAS_DIRECTIVA.flatMap(({ prefix, label, required }) =>
  TIPOS_DOCUMENTO_PERSONA.map((doc) => ({
    prefix,
    cargoLabel: label,
    required: !!required,
    type: doc.type,
    label: doc.label,
    shortLabel: doc.shortLabel,
    icon: doc.icon,
    fileKey: docFileKey(prefix, doc.type),
    urlField: docUrlField(prefix, doc.type),
  })),
)

export const DOCUMENTOS_POR_PERSONA_OBLIGATORIOS = DOCUMENTOS_POR_PERSONA.filter((d) => d.required)

export const DOCUMENTOS_INSTITUCIONALES = [
  { fileKey: 'cartaCompromiso', urlField: 'urlCartaCompromiso', label: 'Carta de Compromiso Firmada', point: 31, icon: 'contract', required: true },
  { fileKey: 'resolucion', urlField: 'urlResolucion', label: 'Resolución HCU/HCF/HCC', point: 32, icon: 'gavel', required: true },
  { fileKey: 'actaDirectiva', urlField: 'urlActaDirectiva', label: 'Acta Conformación Directiva', point: 33, icon: 'assignment', required: true },
]

/** @deprecated Usar DOCUMENTOS_POR_PERSONA */
export const DOCUMENTOS_CI_MATRICULA = DOCUMENTOS_POR_PERSONA.filter((d) => d.type === 'ci' || d.type === 'matricula')
/** @deprecated Sin certificados globales */
export const DOCUMENTOS_DEUDA = []

export function docFileKeyFromPrefix(prefix) {
  return docFileKey(prefix, 'ci')
}

export function docUrlFieldFromPrefix(prefix) {
  return docUrlField(prefix, 'ci')
}

export function crearEstadoVacioArchivosPersona() {
  const estado = {}
  DOCUMENTOS_POR_PERSONA.forEach(({ fileKey }) => {
    estado[fileKey] = null
  })
  DOCUMENTOS_INSTITUCIONALES.forEach(({ fileKey }) => {
    estado[fileKey] = null
  })
  return estado
}

/** Alias para compatibilidad */
export function crearEstadoVacioArchivosCi() {
  return crearEstadoVacioArchivosPersona()
}

export function hidratarArchivosPersonaDesdeSolicitud(solicitud) {
  const estado = {}
  DOCUMENTOS_POR_PERSONA.forEach(({ fileKey, urlField }) => {
    estado[fileKey] = solicitud?.[urlField] || ''
  })
  DOCUMENTOS_INSTITUCIONALES.forEach(({ fileKey, urlField }) => {
    estado[fileKey] = solicitud?.[urlField] || ''
  })
  return estado
}

/** Alias para compatibilidad */
export function hidratarArchivosCiDesdeSolicitud(solicitud) {
  return hidratarArchivosPersonaDesdeSolicitud(solicitud)
}

export function multerFileFieldsPersona() {
  return [
    ...DOCUMENTOS_POR_PERSONA.map(({ fileKey }) => ({ name: fileKey, maxCount: 1 })),
    ...DOCUMENTOS_INSTITUCIONALES.map(({ fileKey }) => ({ name: fileKey, maxCount: 1 })),
  ]
}

export function limpiarComplementosInactivos(form, complementoActivo) {
  const payload = { ...form }
  PERSONAS_DIRECTIVA.forEach(({ prefix }) => {
    if (!complementoActivo[prefix]) {
      payload[`${prefix}CiComplemento`] = ''
    } else if (payload[`${prefix}CiComplemento`]) {
      payload[`${prefix}CiComplemento`] = normalizarComplementoCi(payload[`${prefix}CiComplemento`])
    }
  })
  return payload
}

export function checklistKeysParaCargo(cargo) {
  const { label, hasCelular, complemento } = cargo
  const keys = [
    { key: `${label}-nombres`, label: 'Nombres', value: cargo.nombres || cargo.partesNombre?.find((p) => p.key === 'nombres')?.value },
    { key: `${label}-paterno`, label: 'Paterno', value: cargo.paterno || cargo.partesNombre?.find((p) => p.key === 'paterno')?.value },
    { key: `${label}-materno`, label: 'Materno', value: cargo.materno || cargo.partesNombre?.find((p) => p.key === 'materno')?.value },
    { key: `${label}-ci`, label: 'CI', value: cargo.ciDisplay || cargo.ci },
  ]
  if (complemento) {
    keys.push({ key: `${label}-ci-complemento`, label: 'Complemento CI', value: complemento })
  }
  if (hasCelular || cargo.celular !== undefined) {
    keys.push({ key: `${label}-celular`, label: 'Celular', value: cargo.celular })
  }
  return keys
}
