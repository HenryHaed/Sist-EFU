/**
 * Disciplina: cada criterio es decisión SI / NO.
 * SI → puntajeMaximo del criterio (ej. 5 pts); NO → 0.
 * La nota de fraternidad es la SUMATORIA de criterios (no promedio de controladores).
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
 * Normaliza cualquier payload de criterio de disciplina a decisión 0 | 1.
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
    if ('decision' in obj) {
      const d = obj.decision;
      if (typeof d === 'string') {
        const s = d.trim().toLowerCase();
        if (['si', 'sí', '1', 'true', 'cumple', 'yes', 's'].includes(s)) return 1;
        if (['no', '0', 'false', 'no_cumple', 'n'].includes(s)) return 0;
      }
      return normalizarDecisionDisciplina(d);
    }
    if ('cumple' in obj) return normalizarDecisionDisciplina(obj.cumple);
    // valor/real > 0 cuenta como SI (compat con actas ya guardadas)
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

/**
 * Empaqueta decisión binaria: SI otorga el techo del criterio (puntajeMaximo).
 */
export function empaquetarDecisionDisciplina(
  decision: 0 | 1,
  puntajeMaximo = 1,
): {
  valor: number;
  decision: 'SI' | 'NO';
  puntajeMaximo: number;
} {
  const max = Math.max(0, Number(puntajeMaximo) || 0);
  return {
    valor: decision === 1 ? max : 0,
    decision: decision === 1 ? 'SI' : 'NO',
    puntajeMaximo: max,
  };
}

/**
 * @deprecated Usar normalizarDecisionDisciplina + empaquetarDecisionDisciplina.
 */
export function convertirNotaVisualAReal(
  notaVisual: number,
  _escalaVisual: number,
  puntajeMaximo: number,
): number {
  const d = normalizarDecisionDisciplina(notaVisual);
  return empaquetarDecisionDisciplina(d, puntajeMaximo).valor;
}

/**
 * Fusiona actas parciales de disciplina: cada idCriterio cuenta una sola vez
 * (primera aparición gana). Resultado = SUMATORIA de puntos, no promedio.
 * Si un acta no trae criteriosEvaluados, se usa puntajeTotal (compat).
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
        porCriterio.set(id, valorRealCriterio(raw));
      }
    } else {
      fallbackSinCriterios += Number(a.puntajeTotal) || 0;
    }
  }

  let sum = fallbackSinCriterios;
  for (const v of porCriterio.values()) sum += v;
  return round2(sum);
}

/**
 * Detalle por controlador (acta) para reportes: aporte individual + suma fusionada.
 */
export function desgloseControladoresDisciplina(
  actas: Array<{
    idJurado?: number | null;
    juradoNombre?: string;
    puntajeTotal?: number | null;
    criteriosEvaluados?: Record<string, unknown> | null;
    observacion?: string | null;
  }>,
): {
  controladores: Array<{
    idJurado: number | null;
    nombre: string;
    puntaje: number;
    observacion: string | null;
  }>;
  sumatoria: number;
} {
  const controladores = actas.map((a) => ({
    idJurado: a.idJurado ?? null,
    nombre: a.juradoNombre || (a.idJurado ? `Controlador #${a.idJurado}` : 'Controlador'),
    puntaje: round2(Number(a.puntajeTotal) || valorRealDesdeActa(a.criteriosEvaluados)),
    observacion: a.observacion || null,
  }));
  controladores.sort((a, b) =>
    String(a.nombre).localeCompare(String(b.nombre), 'es'),
  );
  return {
    controladores,
    sumatoria: fusionarPuntajeDisciplina(actas),
  };
}

function valorRealDesdeActa(crits?: Record<string, unknown> | null): number {
  if (!crits || typeof crits !== 'object') return 0;
  let s = 0;
  for (const raw of Object.values(crits)) s += valorRealCriterio(raw);
  return round2(s);
}
