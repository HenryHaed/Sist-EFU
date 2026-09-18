/**
 * Conversión visual → real para criterios de disciplina.
 * notaReal = (notaVisual / escalaVisual) * puntajeMaximo
 */

export function esFaseDisciplinaNombre(nombre?: string | null): boolean {
  return String(nombre || '')
    .toLowerCase()
    .includes('disciplina');
}

export function round2(n: number): number {
  return Number((n || 0).toFixed(2));
}

export function convertirNotaVisualAReal(
  notaVisual: number,
  escalaVisual: number,
  puntajeMaximo: number,
): number {
  const escala = Number(escalaVisual);
  const max = Number(puntajeMaximo);
  const visual = Number(notaVisual);
  if (!Number.isFinite(visual) || visual < 0) return 0;
  if (!Number.isFinite(escala) || escala <= 0) return 0;
  if (!Number.isFinite(max) || max < 0) return 0;
  const clamped = Math.min(visual, escala);
  return round2((clamped / escala) * max);
}

/** Extrae valor real desde JSONB (número plano o { real, visual }). */
export function valorRealCriterio(raw: unknown): number {
  if (raw == null) return 0;
  if (typeof raw === 'number') return Number(raw) || 0;
  if (typeof raw === 'object' && raw !== null && 'real' in (raw as any)) {
    return Number((raw as any).real) || 0;
  }
  return Number(raw) || 0;
}

export function valorVisualCriterio(raw: unknown): number | null {
  if (raw != null && typeof raw === 'object' && 'visual' in (raw as any)) {
    const v = Number((raw as any).visual);
    return Number.isFinite(v) ? v : null;
  }
  return null;
}

/**
 * Fusiona actas parciales de disciplina: cada idCriterio cuenta una sola vez
 * (primera aparición gana). Si un acta no trae criteriosEvaluados, se usa
 * puntajeTotal como aporte total (compat).
 */
export function fusionarPuntajeDisciplina(
  actas: Array<{
    criteriosEvaluados?: Record<string, unknown> | null;
    puntajeTotal?: number | null;
  }>,
): number {
  const porCriterio = new Map<string, number>();
  let fallbackSinCriterios = 0;

  for (const a of actas) {
    const crits = a.criteriosEvaluados;
    if (crits && typeof crits === 'object' && Object.keys(crits).length > 0) {
      for (const [id, raw] of Object.entries(crits)) {
        if (!porCriterio.has(id)) {
          porCriterio.set(id, valorRealCriterio(raw));
        }
      }
    } else {
      fallbackSinCriterios += Number(a.puntajeTotal) || 0;
    }
  }

  let sum = fallbackSinCriterios;
  for (const v of porCriterio.values()) sum += v;
  return round2(sum);
}
