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
 * Si se pasan `asignados`, aparecen TODOS (sin acta o nota 0 → 0.00), no solo los que sellaron.
 */
export function desgloseControladoresDisciplina(
  actas: Array<{
    idJurado?: number | null;
    juradoNombre?: string;
    puntajeTotal?: number | null;
    criteriosEvaluados?: Record<string, unknown> | null;
    observacion?: string | null;
    estado?: string | null;
  }>,
  asignados?: Array<{
    idJurado?: number | null;
    nombre?: string;
  }>,
): {
  controladores: Array<{
    idJurado: number | null;
    nombre: string;
    puntaje: number;
    observacion: string | null;
    revisado: boolean;
    estado: string | null;
  }>;
  sumatoria: number;
} {
  type Row = {
    idJurado: number | null;
    nombre: string;
    puntaje: number;
    observacion: string | null;
    revisado: boolean;
    estado: string | null;
  };

  const byKey = new Map<string, Row>();

  const keyOf = (idJurado: number | null, nombre: string) =>
    idJurado != null ? `j:${idJurado}` : `n:${nombre}`;

  for (const a of asignados || []) {
    const idJurado = a.idJurado ?? null;
    const nombre =
      a.nombre || (idJurado != null ? `Controlador #${idJurado}` : 'Controlador');
    byKey.set(keyOf(idJurado, nombre), {
      idJurado,
      nombre,
      puntaje: 0,
      observacion: null,
      revisado: false,
      estado: null,
    });
  }

  for (const a of actas) {
    const idJurado = a.idJurado ?? null;
    const nombre =
      a.juradoNombre ||
      (idJurado != null ? `Controlador #${idJurado}` : 'Controlador');
    const key = keyOf(idJurado, nombre);
    const rawPts = a.puntajeTotal;
    const puntaje = round2(
      rawPts != null && Number.isFinite(Number(rawPts))
        ? Number(rawPts)
        : valorRealDesdeActa(a.criteriosEvaluados),
    );
    // Incluye nota 0 explícita; sin acta previa queda 0 (asignado)
    byKey.set(key, {
      idJurado,
      nombre,
      puntaje,
      observacion: a.observacion || null,
      revisado: true,
      estado: a.estado || null,
    });
  }

  const controladores = Array.from(byKey.values());
  controladores.sort((a, b) =>
    String(a.nombre).localeCompare(String(b.nombre), 'es'),
  );

  // Sumatoria: actas reales + asignados sin acta cuentan 0 (no suman)
  const actasParaSuma = [
    ...actas,
    ...controladores
      .filter((c) => !c.revisado)
      .map((c) => ({
        idJurado: c.idJurado,
        juradoNombre: c.nombre,
        puntajeTotal: 0,
        criteriosEvaluados: null,
      })),
  ];

  return {
    controladores,
    sumatoria: fusionarPuntajeDisciplina(actasParaSuma),
  };
}


function valorRealDesdeActa(crits?: Record<string, unknown> | null): number {
  if (!crits || typeof crits !== 'object') return 0;
  let s = 0;
  for (const raw of Object.values(crits)) s += valorRealCriterio(raw);
  return round2(s);
}
