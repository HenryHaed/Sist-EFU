/**
 * Orden oficial de desfile (sugerido). Se usa solo para sembrar `orden_desfile`
 * cuando aún no hay orden guardado. El admin puede cambiarlo arrastrando.
 */
export const ORDEN_DESFILE_SUGERIDO: string[] = [
  'Tobas Weenhayek',
  'Charangos de Comunicación Social',
  'Suri Sicuri - Arquitectura',
  'Warmi Qullqa de Contaduría',
  'Taller de Proyección Cultural de la FAADU',
  'Mineritos Destructores',
  'Wititis de ECOFIN',
  'Espléndida Waka Waka de Trabajo Social',
  'Taller Cultural "Huella Cultural Tierra y Territorio"',
  'Llamerada Geo-Cat',
  'Moseñada del Programa de Derecho de las Naciones Originarias',
  'Amor Tacana de Ingeniería',
  'Fieles Cuernudos de ECOFIN',
  'Llameros de Agrovet',
  'Kusillos Dis-Art',
  'Reyes Morenos de Administración',
  'Rey Caporal de Auditoría',
  'Fraternidad Antro Arqueológica-Aymara Chapaca',
  'Pujllay EDU de la Carrera de Ciencias de la Educación',
  'Tobas Lingüística',
  'Wiñay Takisunchis Wititis de Tecnología',
  'Tinkus de Ingeniería',
  'Salay Rompe Taquitos de ECOFIN',
  'Tarqueada FEDSIUMSA',
  'Potosí de Ciencia, Información y Acervo',
  'Saya de Ley',
  'Morenos Achachis STUMSA',
  'Tonada Potosina',
  'Tobas Jaguar de Informática',
  'Tinkus Wistus Económicas y Financieras',
  'Chacarera del Sur Ciencias Económicas y Financieras',
  'Auténticos Afrovetecos',
  'Diablada de Medicina',
  'Caporales de Ingeniería',
  'Ecopótolos de Economía',
  'Carnaval Paceño Puro y Natural',
  'Saya Afroboliviana de la Carrera de Turismo',
  'Tinkus Chaquis',
  'Poderosa Morenada de Ingeniería',
  'Carnaval Chicheño de Ingeniería',
  'Llamerada San Andrés',
  'Tinkus Puros y Naturales',
  'Kullawada "Ojo Alegre" Ingeniería Industrial',
  'Salay Por Siempre Química Industrial',
  'Caporales de Informática',
  'Moseñada de Lingüística e Idiomas',
  'Fraternidad de Investigación Cultural Tinkuy Ch\'itis de la FAADU',
  'Pujllay Tecnología Médica',
  'Pótolos de Estadística',
  'Espectacular Morenada de la Facultad de Odontología',
  'Majestuosa Kullawada de Trabajo Social',
  'Chacarera de Ingeniería',
  'Tinkus Huayna Lisos Electromecánica',
  'Llamerada Geodesia Topografía y Geomántica',
  'Saya Afroboliviana de Electricidad Industrial',
  'Caporales ECOFIN',
  'Wititis San Andrés',
  'Rueda Chapaca de Nutrición',
  'Guerreros Tobas de Ingeniería Metalúrgica',
  'Taller Cultural CIPYCA "Kallawaya"',
  'Morenada Central Agronomía - Facultad de Agronomía',
  'Fraternidad Geodiablos',
  'Calcheños de Biofar',
  'Fraternidad Artística Cultural Psicokullawada',
  'Reyes Zambos de la FAADU',
  'Taller Cultural de Antropología y Arqueología',
  'Wititis Automotriz',
  'Diablada Tecnológica',
  'Entusiastas Waca-Wacas de Enfermería',
  'Saya Afroboliviana',
  'Central Facultativa Verdaderos Morenos de Derecho',
  'Caporales de Ciencias Políticas',
  'Tarqueada de Arquitectura Señores de la Noche de la Facultad de Arquitectura, Arte, Diseño y Urbanismo',
  'Mineritos de Sociología',
  'Diablada Proyección Cultural Diablos Rojos de Ciencias de la Comunicación Social',
  'Pujllay Geografía',
  'Sikuris de Italaque de Agronomía',
  'Verdaderos Amantes del Pergamino',
  'Audi-Tobas de Contaduría Pública',
  'Diablos de Ley y Poder',
  'Poderosa Fraternidad de Mineritos Universitarios',
]

/** Normaliza para comparar nombres (acentos, comillas, espacios). */
export function normalizarNombreFraternidad(nombre: string): string {
  return String(nombre || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[''`´"«»]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
}

export function indiceOrdenDesfileSugerido(nombre: string): number {
  const key = normalizarNombreFraternidad(nombre)
  const idx = ORDEN_DESFILE_SUGERIDO.findIndex(
    (n) => normalizarNombreFraternidad(n) === key,
  )
  return idx >= 0 ? idx : Number.POSITIVE_INFINITY
}
