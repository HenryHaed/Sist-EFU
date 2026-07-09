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
] as const;

export function nombreCompletoPersona(source: Record<string, any>, prefix: string): string {
  return [source[`${prefix}Nombres`], source[`${prefix}PrimerApellido`], source[`${prefix}SegundoApellido`]]
    .filter((part) => part && String(part).trim())
    .join(' ')
    .trim();
}

export function formatCiDisplay(ci?: string, complemento?: string): string {
  const base = String(ci || '').trim();
  if (!base) return '—';
  let comp = String(complemento || '').trim().toUpperCase().replace(/\s/g, '');
  if (comp && !comp.startsWith('-')) comp = `-${comp.replace(/^-*/, '')}`;
  return comp ? `${base} ${comp}` : base;
}

export function buildMiembrosDirectiva(solicitud: Record<string, any>) {
  return PERSONAS_DIRECTIVA.map(({ prefix, label, hasCelular }) => {
    const nombre = nombreCompletoPersona(solicitud, prefix);
    const ci = formatCiDisplay(solicitud[`${prefix}Ci`], solicitud[`${prefix}CiComplemento`]);
    const celular = hasCelular ? solicitud[`${prefix}Celular`] || null : null;
    return { cargo: label, prefix, nombre, ci, celular };
  }).filter((m) => m.nombre || (m.ci && m.ci !== '—'));
}
