/**
 * Carreras oficiales UMSA por sigla de facultad.
 * Las facultades deben existir previamente en la tabla `facultades`.
 */
export const CARRERAS_POR_FACULTAD: Record<string, string[]> = {
  FAGRO: [
    'Ingeniería Agronómica',
    'Ingeniería en Producción y Comercialización Agropecuaria',
    'Programa de Medicina Veterinaria y Zootecnia',
  ],
  FAADU: [
    'Arquitectura',
    'Artes Plásticas',
    'Diseño Gráfico',
    'Programa de Artes Musicales',
    'Programa de Arquitectura para la Amazonia',
  ],
  FCEF: [
    'Administración de Empresas',
    'Contaduría Pública',
    'Economía',
  ],
  FCFB: [
    'Bioquímica',
    'Química Farmacéutica',
  ],
  FCG: [
    'Ingeniería Geográfica',
    'Ingeniería Geológica',
    'Programa de Catastro y Ordenamiento Territorial',
    'Programa de Geología de Minas',
  ],
  FCPN: [
    'Biología',
    'Ciencias Químicas',
    'Estadística',
    'Física',
    'Informática',
    'Matemática',
  ],
  FCS: [
    'Antropología y Arqueología',
    'Ciencias de la Comunicación Social',
    'Sociología',
    'Trabajo Social',
  ],
  FDCP: [
    'Derecho',
    'Ciencias Políticas y Gestión Pública',
    'Programa de Derecho de Naciones Originarias',
  ],
  FHCE: [
    'Bibliotecología y Ciencias de la Información',
    'Ciencias de la Educación',
    'Filosofía',
    'Historia',
    'Lingüística e Idiomas',
    'Literatura',
    'Psicología',
    'Turismo',
  ],
  FI: [
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
  FMENT: [
    'Medicina',
    'Enfermería',
    'Nutrición y Dietética',
    'Tecnología Médica',
  ],
  FO: [
    'Odontología',
  ],
  FT: [
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
};

/** Alias de siglas o nombres alternativos en BD */
export const SIGLAS_ALTERNATIVAS: Record<string, string[]> = {
  FDCP: ['FDER', 'FDYCP'],
  FAGRO: ['FA'],
};

/** Palabras clave en el nombre de facultad (fallback si la sigla no coincide) */
export const PALABRAS_FACULTAD: Record<string, string[]> = {
  FAGRO: ['agronom'],
  FCFB: ['farmac', 'bioquim'],
};
