/**
 * Facultades y carreras oficiales UMSA (catálogo base del sistema).
 */
export interface FacultadUmsaDef {
  sigla: string;
  nombre: string;
  carreras: string[];
}

export const FACULTADES_UMSA_DEFAULT: FacultadUmsaDef[] = [
  {
    sigla: 'FA',
    nombre: 'Facultad de Agronomía',
    carreras: [
      'Ingeniería Agronómica',
      'Ingeniería en Producción y Comercialización Agropecuaria',
      'Programa de Medicina Veterinaria y Zootecnia',
    ],
  },
  {
    sigla: 'FAADU',
    nombre: 'Facultad de Arquitectura, Artes, Diseño y Urbanismo',
    carreras: [
      'Arquitectura',
      'Artes Plásticas',
      'Diseño Gráfico',
      'Programa de Artes Musicales',
      'Programa de Arquitectura para la Amazonia',
    ],
  },
  {
    sigla: 'FCEF',
    nombre: 'Facultad de Ciencias Económicas y Financieras',
    carreras: ['Administración de Empresas', 'Contaduría Pública', 'Economía'],
  },
  {
    sigla: 'FCFB',
    nombre: 'Facultad de Ciencias Farmacéuticas y Bioquímicas',
    carreras: ['Bioquímica', 'Química Farmacéutica'],
  },
  {
    sigla: 'FCG',
    nombre: 'Facultad de Ciencias Geológicas',
    carreras: [
      'Ingeniería Geográfica',
      'Ingeniería Geológica',
      'Programa de Catastro y Ordenamiento Territorial',
      'Programa de Geología de Minas',
    ],
  },
  {
    sigla: 'FCPN',
    nombre: 'Facultad de Ciencias Puras y Naturales',
    carreras: [
      'Biología',
      'Ciencias Químicas',
      'Estadística',
      'Física',
      'Informática',
      'Matemática',
    ],
  },
  {
    sigla: 'FCS',
    nombre: 'Facultad de Ciencias Sociales',
    carreras: [
      'Antropología y Arqueología',
      'Ciencias de la Comunicación Social',
      'Sociología',
      'Trabajo Social',
    ],
  },
  {
    sigla: 'FDCP',
    nombre: 'Facultad de Derecho y Ciencias Políticas',
    carreras: [
      'Derecho',
      'Ciencias Políticas y Gestión Pública',
      'Programa de Derecho de Naciones Originarias',
    ],
  },
  {
    sigla: 'FHCE',
    nombre: 'Facultad de Humanidades y Ciencias de la Educación',
    carreras: [
      'Bibliotecología y Ciencias de la Información',
      'Ciencias de la Educación',
      'Filosofía',
      'Historia',
      'Lingüística e Idiomas',
      'Literatura',
      'Psicología',
      'Turismo',
    ],
  },
  {
    sigla: 'FI',
    nombre: 'Facultad de Ingeniería',
    carreras: [
      'Ingeniería Civil',
      'Ingeniería Química',
      'Ingeniería Electrónica',
      'Ingeniería Petrolera',
      'Ingeniería Eléctrica',
      'Ingeniería Industrial',
      'Ingeniería Metalúrgica y de Materiales',
      'Ingeniería Mecánica y Electromecánica',
      'Ingeniería Mecánica',
      'Ingeniería Electromecánica',
      'Ingeniería Mecatrónica',
      'Ingeniería de Alimentos',
      'Ingeniería Ambiental',
      'Ingeniería Petroquímica',
      'Ingeniería en Seguridad Industrial y Salud Ocupacional',
      'Ingeniería en Producción Industrial',
      'Ingeniería en Litio y Recursos Evaporíticos',
      'Ingeniería en Polímeros',
      'Ingeniería Siderúrgica',
      'Ingeniería Biomédica',
    ],
  },
  {
    sigla: 'FMENT',
    nombre: 'Facultad de Medicina, Enfermería, Nutrición y Tecnología Médica',
    carreras: ['Medicina', 'Enfermería', 'Nutrición y Dietética', 'Tecnología Médica'],
  },
  {
    sigla: 'FO',
    nombre: 'Facultad de Odontología',
    carreras: ['Odontología'],
  },
  {
    sigla: 'FT',
    nombre: 'Facultad de Tecnología',
    carreras: [
      'Aeronáutica',
      'Construcciones Civiles',
      'Electricidad Industrial',
      'Electrónica y Telecomunicaciones',
      'Electromecánica',
      'Mecánica Automotriz',
      'Mecánica Industrial',
      'Química Industrial',
      'Geodesia, Topografía y Geomática',
    ],
  },
];

/** Alias de siglas históricas en BD (p. ej. FAGRO → FA). */
export const SIGLAS_ALTERNATIVAS: Record<string, string[]> = {
  FA: ['FAGRO'],
  FDCP: ['FDER', 'FDYCP'],
};

/** Palabras clave en el nombre de facultad (fallback si la sigla no coincide). */
export const PALABRAS_FACULTAD: Record<string, string[]> = {
  FA: ['agronom'],
  FCFB: ['farmac', 'bioquim'],
};

/** @deprecated Usar FACULTADES_UMSA_DEFAULT */
export const CARRERAS_POR_FACULTAD: Record<string, string[]> = Object.fromEntries(
  FACULTADES_UMSA_DEFAULT.map((f) => [f.sigla, f.carreras]),
);
