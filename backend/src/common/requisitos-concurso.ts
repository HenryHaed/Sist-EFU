export type PlantillaRequisitos = 'fotografia' | 'chacha_warmi' | 'generico';

export type CampoRequisito = {
  clave: string;
  etiqueta: string;
  tipo: 'text' | 'email' | 'tel' | 'textarea' | 'select';
  obligatorio: boolean;
  opciones?: string[];
};

export type DocumentoRequisito = {
  clave: string;
  etiqueta: string;
  mime: string[];
  obligatorio: boolean;
  maxArchivos: number;
  maxMb?: number;
};

export type RequisitosInscripcion = {
  campos: CampoRequisito[];
  documentos: DocumentoRequisito[];
};

/** Catálogo base (fotografía / otros). Chacha-Warmi aplica sufijos vía helpers. */
export const CATALOGO_CAMPOS: CampoRequisito[] = [
  { clave: 'nombreCompleto', etiqueta: 'Nombre completo', tipo: 'text', obligatorio: true },
  { clave: 'ci', etiqueta: 'Cédula de Identidad', tipo: 'text', obligatorio: true },
  { clave: 'facultadCarrera', etiqueta: 'Facultad y Carrera', tipo: 'text', obligatorio: false },
  { clave: 'estamento', etiqueta: 'Estamento', tipo: 'select', obligatorio: false, opciones: ['Estudiante', 'Docente', 'Administrativo', 'Otro'] },
  { clave: 'celular', etiqueta: 'Número de celular', tipo: 'tel', obligatorio: true },
  { clave: 'correo', etiqueta: 'Correo electrónico', tipo: 'email', obligatorio: true },
  { clave: 'descripcionConceptual', etiqueta: 'Breve descripción conceptual de cada fotografía', tipo: 'textarea', obligatorio: false },
  { clave: 'nombreCompletoPareja', etiqueta: 'Nombre completo (Warmi)', tipo: 'text', obligatorio: false },
  { clave: 'ciPareja', etiqueta: 'CI del Warmi', tipo: 'text', obligatorio: false },
  { clave: 'facultadCarreraPareja', etiqueta: 'Facultad y Carrera (Warmi)', tipo: 'text', obligatorio: false },
  { clave: 'celularPareja', etiqueta: 'Celular (Warmi)', tipo: 'tel', obligatorio: false },
  { clave: 'correoPareja', etiqueta: 'Correo (Warmi)', tipo: 'email', obligatorio: false },
];

/** Etiquetas con sufijo (Chacha) — solo plantilla chacha_warmi. */
export const ETIQUETAS_CHACHA: Record<string, string> = {
  nombreCompleto: 'Nombre completo (Chacha)',
  ci: 'CI del Chacha',
  facultadCarrera: 'Facultad y Carrera (Chacha)',
  celular: 'Celular (Chacha)',
  correo: 'Correo (Chacha)',
};

/** Aplica sufijos Chacha en campos del titular (Warmi ya vienen etiquetados). */
export function aplicarEtiquetasChachaWarmi(req: RequisitosInscripcion): RequisitosInscripcion {
  return {
    campos: (req.campos || []).map((c) => ({
      ...c,
      etiqueta: ETIQUETAS_CHACHA[c.clave] || c.etiqueta,
    })),
    documentos: (req.documentos || []).map((d) => ({ ...d })),
  };
}

/** Catálogo de campos para UI según plantilla seleccionada. */
export function catalogoCamposParaPlantilla(plantilla?: string): CampoRequisito[] {
  const id = String(plantilla || '').toLowerCase();
  if (id !== 'chacha_warmi') return CATALOGO_CAMPOS.map((c) => ({ ...c }));
  return CATALOGO_CAMPOS.map((c) => ({
    ...c,
    etiqueta: ETIQUETAS_CHACHA[c.clave] || c.etiqueta,
  }));
}

/** Catálogo completo de documentos disponibles (checkboxes en UI). */
export const CATALOGO_DOCUMENTOS: DocumentoRequisito[] = [
  { clave: 'ci_pdf', etiqueta: 'Fotocopia simple de la Cédula de Identidad (PDF)', mime: ['application/pdf'], obligatorio: true, maxArchivos: 1, maxMb: 10 },
  { clave: 'matricula_pdf', etiqueta: 'Documento que acredite pertenencia a la UMSA — matrícula o boleta (PDF)', mime: ['application/pdf'], obligatorio: true, maxArchivos: 1, maxMb: 10 },
  { clave: 'fotos_jpeg', etiqueta: 'Respaldo digital con fotografías (JPEG)', mime: ['image/jpeg', 'image/jpg'], obligatorio: false, maxArchivos: 20, maxMb: 15 },
  { clave: 'carta_inscripcion_pdf', etiqueta: 'Carta de inscripción (PDF)', mime: ['application/pdf'], obligatorio: false, maxArchivos: 1, maxMb: 10 },
  { clave: 'ci_ambos_pdf', etiqueta: 'Fotocopia CI de ambos postulantes (PDF) — legado', mime: ['application/pdf'], obligatorio: false, maxArchivos: 2, maxMb: 10 },
  { clave: 'pertenencia_umsa_pdf', etiqueta: 'Documento de pertenencia UMSA (según corresponda) (PDF) — legado', mime: ['application/pdf'], obligatorio: false, maxArchivos: 2, maxMb: 10 },
  { clave: 'ci_chacha_pdf', etiqueta: 'CI del Chacha (PDF)', mime: ['application/pdf'], obligatorio: true, maxArchivos: 1, maxMb: 10 },
  { clave: 'matricula_chacha_pdf', etiqueta: 'Matrícula o boleta del Chacha (PDF)', mime: ['application/pdf'], obligatorio: true, maxArchivos: 1, maxMb: 10 },
  { clave: 'ci_warmi_pdf', etiqueta: 'CI del Warmi (PDF)', mime: ['application/pdf'], obligatorio: true, maxArchivos: 1, maxMb: 10 },
  { clave: 'matricula_warmi_pdf', etiqueta: 'Matrícula o boleta del Warmi (PDF)', mime: ['application/pdf'], obligatorio: true, maxArchivos: 1, maxMb: 10 },
  { clave: 'foto_postal_jpeg', etiqueta: 'Fotografía tamaño postal 10×15 cm cuerpo entero con traje (JPEG)', mime: ['image/jpeg', 'image/jpg'], obligatorio: false, maxArchivos: 1, maxMb: 15 },
  { clave: 'pista_mp3', etiqueta: 'Pista musical MP3 (máx. 1 minuto)', mime: ['audio/mpeg', 'audio/mp3'], obligatorio: false, maxArchivos: 1, maxMb: 10 },
];

const marcar = (claves: string[], catalogo: { clave: string }[]) =>
  new Set(claves.filter((c) => catalogo.some((x) => x.clave === c)));

function buildFromClaves(
  clavesCampos: string[],
  clavesDocs: string[],
  obligatoriosExtra: string[] = [],
): RequisitosInscripcion {
  const setCampos = marcar(clavesCampos, CATALOGO_CAMPOS);
  const setDocs = marcar(clavesDocs, CATALOGO_DOCUMENTOS);
  const setOblig = new Set(obligatoriosExtra);

  return {
    campos: CATALOGO_CAMPOS.filter((c) => setCampos.has(c.clave)).map((c) => ({
      ...c,
      obligatorio: c.obligatorio || setOblig.has(c.clave),
    })),
    documentos: CATALOGO_DOCUMENTOS.filter((d) => setDocs.has(d.clave)).map((d) => ({
      ...d,
      obligatorio: d.obligatorio || setOblig.has(d.clave),
    })),
  };
}

export const PLANTILLAS_REQUISITOS: Record<PlantillaRequisitos, RequisitosInscripcion> = {
  fotografia: buildFromClaves(
    ['nombreCompleto', 'facultadCarrera', 'estamento', 'celular', 'correo', 'descripcionConceptual'],
    ['ci_pdf', 'matricula_pdf', 'fotos_jpeg', 'carta_inscripcion_pdf'],
    ['facultadCarrera', 'estamento', 'descripcionConceptual', 'fotos_jpeg', 'carta_inscripcion_pdf'],
  ),
  chacha_warmi: aplicarEtiquetasChachaWarmi(
    buildFromClaves(
      [
        'nombreCompleto',
        'ci',
        'facultadCarrera',
        'celular',
        'correo',
        'nombreCompletoPareja',
        'ciPareja',
        'facultadCarreraPareja',
        'celularPareja',
        'correoPareja',
      ],
      [
        'ci_chacha_pdf',
        'matricula_chacha_pdf',
        'ci_warmi_pdf',
        'matricula_warmi_pdf',
        'foto_postal_jpeg',
        'pista_mp3',
      ],
      [
        'nombreCompletoPareja',
        'ciPareja',
        'ci_chacha_pdf',
        'matricula_chacha_pdf',
        'ci_warmi_pdf',
        'matricula_warmi_pdf',
        'foto_postal_jpeg',
        'pista_mp3',
      ],
    ),
  ),
  generico: buildFromClaves(
    ['nombreCompleto', 'ci', 'facultadCarrera', 'celular', 'correo'],
    ['ci_pdf', 'matricula_pdf'],
    ['ci', 'facultadCarrera'],
  ),
};

export const PLANTILLAS_META: { id: PlantillaRequisitos; etiqueta: string; descripcion: string }[] = [
  {
    id: 'fotografia',
    etiqueta: 'Fotografía',
    descripcion: 'Inscripción por rol concursante: CI, matrícula, JPEGs, carta y datos generales',
  },
  {
    id: 'chacha_warmi',
    etiqueta: 'Chacha Warmi (por delegado)',
    descripcion:
      'Inscripción por delegado: CI y matrícula/boleta de Chacha y Warmi (PDF), foto postal y MP3',
  },
  {
    id: 'generico',
    etiqueta: 'Otros concursos',
    descripcion: 'Inscripción por rol concursante: CI, matrícula y datos generales',
  },
];

/** Plantillas que puede usar el rol concursante (no Chacha-Warmi). */
export const PLANTILLAS_CONCURSANTE: PlantillaRequisitos[] = ['fotografia', 'generico'];

export function esPlantillaChachaWarmi(plantilla?: string | null): boolean {
  return String(plantilla || '').toLowerCase() === 'chacha_warmi';
}

/** Detecta fase Chacha-Warmi por plantilla o por nombre (compatibilidad). */
export function esFaseChachaWarmi(fase?: { plantillaRequisitos?: string | null; nombre?: string | null } | null): boolean {
  if (!fase) return false;
  if (esPlantillaChachaWarmi(fase.plantillaRequisitos)) return true;
  const nombre = String(fase.nombre || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '');
  return (
    nombre.includes('chachawarmi') ||
    (nombre.includes('chacha') && nombre.includes('warmi'))
  );
}

export function esPlantillaParaConcursante(plantilla?: string | null): boolean {
  const p = String(plantilla || '').toLowerCase() as PlantillaRequisitos;
  return PLANTILLAS_CONCURSANTE.includes(p);
}

const DOCS_CHACHA_LEGACY = new Set([
  'ci_ambos_pdf',
  'pertenencia_umsa_pdf',
  'ci_pdf',
  'matricula_pdf',
]);

const DOCS_CHACHA_NUEVOS = [
  'ci_chacha_pdf',
  'matricula_chacha_pdf',
  'ci_warmi_pdf',
  'matricula_warmi_pdf',
] as const;

/**
 * Si la fase aún tiene documentos antiguos (CI ambos / pertenencia conjunta),
 * los reemplaza por CI y matrícula separados de Chacha y Warmi.
 */
export function asegurarDocumentosChachaWarmi(req: RequisitosInscripcion): RequisitosInscripcion {
  const plantilla = requisitosDesdePlantilla('chacha_warmi');
  const claves = new Set((req.documentos || []).map((d) => d.clave));
  const yaActualizado = DOCS_CHACHA_NUEVOS.every((c) => claves.has(c));
  if (yaActualizado) {
    return aplicarEtiquetasChachaWarmi({
      campos: req.campos?.length ? req.campos : plantilla.campos,
      documentos: req.documentos,
    });
  }

  const docsSinLegado = (req.documentos || []).filter((d) => !DOCS_CHACHA_LEGACY.has(d.clave));
  const porClave = new Map(docsSinLegado.map((d) => [d.clave, d]));
  for (const clave of DOCS_CHACHA_NUEVOS) {
    if (!porClave.has(clave)) {
      const base = CATALOGO_DOCUMENTOS.find((d) => d.clave === clave);
      if (base) porClave.set(clave, { ...base });
    }
  }

  return aplicarEtiquetasChachaWarmi({
    campos: req.campos?.length ? req.campos : plantilla.campos,
    documentos: Array.from(porClave.values()),
  });
}

export function normalizarRequisitos(raw: any): RequisitosInscripcion {
  const camposIn = Array.isArray(raw?.campos) ? raw.campos : [];
  const docsIn = Array.isArray(raw?.documentos) ? raw.documentos : [];

  const campos = camposIn
    .map((c: any) => {
      const base = CATALOGO_CAMPOS.find((x) => x.clave === c.clave);
      if (!base) return null;
      return {
        ...base,
        etiqueta: c.etiqueta || base.etiqueta,
        obligatorio: c.obligatorio !== undefined ? !!c.obligatorio : base.obligatorio,
      } as CampoRequisito;
    })
    .filter(Boolean) as CampoRequisito[];

  const documentos = docsIn
    .map((d: any) => {
      const base = CATALOGO_DOCUMENTOS.find((x) => x.clave === d.clave);
      if (!base) return null;
      return {
        ...base,
        etiqueta: d.etiqueta || base.etiqueta,
        obligatorio: d.obligatorio !== undefined ? !!d.obligatorio : base.obligatorio,
        maxArchivos: d.maxArchivos || base.maxArchivos,
        maxMb: d.maxMb || base.maxMb,
      } as DocumentoRequisito;
    })
    .filter(Boolean) as DocumentoRequisito[];

  return { campos, documentos };
}

export function requisitosDesdePlantilla(plantilla?: string): RequisitosInscripcion {
  const id = (String(plantilla || 'generico').toLowerCase() as PlantillaRequisitos);
  const base = PLANTILLAS_REQUISITOS[id] || PLANTILLAS_REQUISITOS.generico;
  return {
    campos: base.campos.map((c) => ({ ...c })),
    documentos: base.documentos.map((d) => ({ ...d })),
  };
}

export function buildRequisitosFromSeleccion(
  plantilla: string,
  clavesCampos?: string[],
  clavesDocumentos?: string[],
): RequisitosInscripcion {
  if (Array.isArray(clavesCampos) || Array.isArray(clavesDocumentos)) {
    const plantillaBase = requisitosDesdePlantilla(plantilla);
    const setCampos = new Set(clavesCampos || plantillaBase.campos.map((c) => c.clave));
    const setDocs = new Set(clavesDocumentos || plantillaBase.documentos.map((d) => d.clave));
    let result: RequisitosInscripcion = {
      campos: CATALOGO_CAMPOS.filter((c) => setCampos.has(c.clave)).map((c) => {
        const fromPlantilla = plantillaBase.campos.find((x) => x.clave === c.clave);
        return { ...c, obligatorio: fromPlantilla?.obligatorio ?? c.obligatorio };
      }),
      documentos: CATALOGO_DOCUMENTOS.filter((d) => setDocs.has(d.clave)).map((d) => {
        const fromPlantilla = plantillaBase.documentos.find((x) => x.clave === d.clave);
        return { ...d, obligatorio: fromPlantilla?.obligatorio ?? d.obligatorio };
      }),
    };
    if (esPlantillaChachaWarmi(plantilla)) {
      result = aplicarEtiquetasChachaWarmi(result);
    }
    return result;
  }
  return requisitosDesdePlantilla(plantilla);
}
