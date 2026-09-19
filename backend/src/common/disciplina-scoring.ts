/**
 * Disciplina: cada criterio es decisión SI / NO → puntaje 1 / 0 (sin decimales).
 */

export function esFaseDisciplinaNombre(nombre?: string | null): boolean {
  return String(nombre || '')
    .toLowerCase()
    .includes('disciplina');
}

export function round2(n: number): number {
  return Number((n || 0).toFixed(2));
}

/** Extrae valor numérico desde JSONB (número plano o { real, valor, visual }). */
export function valorRealCriterio(raw: unknown): number {
  if (raw == null) return 0;
  if (typeof raw === 'number') return Number(raw) || 0;
  if (typeof raw === 'boolean') return raw ? 1 : 0;
  if (typeof raw === 'object' && raw !== null) {
    if ('valor' in (raw as any)) return Number((raw as any).valor) || 0;
    if ('real' in (raw as any)) return Number((raw as any).real) || 0;
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
 * Normaliza cualquier payload de criterio de disciplina a 0 | 1.
 * Acepta: 0/1, boolean, "SI"/"NO", { decision }, { valor }, legacy { visual, real }.
 */
export function normalizarDecisionDisciplina(raw: unknown): 0 | 1 {
  if (raw == null || raw === '') return 0;

  if (typeof raw === 'boolean') return raw ? 1 : 0;

  if (typeof raw === 'string') {
    const s = raw.trim().toLowerCase();
    if (['si', 'sí', '1', 'true', 'cumple', 'yes', 's'].includes(s)) return 1;
    if (['no', '0', 'false', 'no_cumple', 'n'].includes(s)) return 0;
    const n = Number(s);
    if (Number.isFinite(n)) return n > 0 ? 1 : 0;
    return 0;
  }

  if (typeof raw === 'object' && raw !== null) {
    const obj = raw as Record<string, unknown>;
    if ('decision' in obj) return normalizarDecisionDisciplina(obj.decision);
    if ('valor' in obj) return normalizarDecisionDisciplina(obj.valor);
    if ('cumple' in obj) return normalizarDecisionDisciplina(obj.cumple);
    // Legacy escala visual → real
    const real = valorRealCriterio(raw);
    if (real > 0) return 1;
    const visual = valorVisualCriterio(raw);
    if (visual != null && visual > 0) return 1;
    return 0;
  }

  const n = Number(raw);
  if (!Number.isFinite(n) || n <= 0) return 0;
  return 1;
}

/** Empaqueta decisión binaria para JSONB. */
export function empaquetarDecisionDisciplina(decision: 0 | 1): {
  valor: 0 | 1;
  decision: 'SI' | 'NO';
} {
  return {
    valor: decision,
    decision: decision === 1 ? 'SI' : 'NO',
  };
}

/**
 * @deprecated Usar normalizarDecisionDisciplina. Se mantiene por compat. de imports.
 */
export function convertirNotaVisualAReal(
  notaVisual: number,
  _escalaVisual: number,
  _puntajeMaximo: number,
): number {
  return normalizarDecisionDisciplina(notaVisual);
}

/**
 * Fusiona actas parciales de disciplina: cada idCriterio cuenta una sola vez
 * (primera aparición gana). Si un acta no trae criteriosEvaluados, se usa
 * puntajeTotal como aporte total (compat).
 *
 * Formato nuevo: { valor: 0|1, decision: 'SI'|'NO' }
 * Formato legado: número o { visual, real } → se conserva el valor real.
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
        if (porCriterio.has(id)) continue;
        if (
          raw != null &&
          typeof raw === 'object' &&
          ('decision' in (raw as any) ||
            ('valor' in (raw as any) && !('visual' in (raw as any)) && !('real' in (raw as any))))
        ) {
          porCriterio.set(id, normalizarDecisionDisciplina(raw));
        } else {
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
