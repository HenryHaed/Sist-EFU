/**
 * Puntuación EFU:
 * - Cada fase artística: promedio de las actas selladas de esa fase.
 * - Disciplina: SUMATORIA de criterios de los N controladores (no promedio).
 * - Nota final = suma(notas de cada fase)  [ej. Monografía + Entrada + Disciplina].
 *
 * Cada jurado sigue teniendo su NotaFraternidad (= suma de las fases que calificó)
 * solo como detalle; no se usa para diluir la nota final.
 */

import {
  esFaseDisciplinaNombre,
  fusionarPuntajeDisciplina,
} from '../common/disciplina-scoring';

export type EfuActa = {
  idFraternidad: number;
  idJurado: number | null;
  juradoNombre: string;
  idEvaluacion?: number | null;
  idFase?: number | null;
  faseNombre?: string;
  pesoPorcentaje?: number | null;
  puntajeTotal: number;
  criteriosEvaluados?: Record<string, unknown> | null;
  estado?: string;
  fechaCierre?: Date | string | null;
};

export type EfuFaseDetalle = {
  idEvaluacion: number | null;
  idFase: number | null;
  faseNombre: string;
  pesoPorcentaje: number | null;
  puntajeTotal: number;
  estado: string;
  fechaCierre: Date | string | null;
};

export type EfuJuradoNota = {
  idJurado: number | null;
  juradoNombre: string;
  notaFraternidad: number;
  fasesCalificadas: number;
  fases: EfuFaseDetalle[];
};

export type EfuFraternidadScore = {
  idFraternidad: number;
  cantidadJurados: number;
  /** Suma de (promedio por fase artística) + disciplina fusionada. */
  promedioFinal: number;
  disciplinaMerged?: number;
  /** Promedio por idFase (solo fases artísticas). */
  notasPorFase?: Record<number, number>;
  jurados: EfuJuradoNota[];
};

export const FORMULA_EFU_PROMEDIO =
  'Nota final = suma de las notas de cada fase EFU. Cada fase artística = promedio de jurados que la calificaron; Disciplina = sumatoria de controladores (no promedio)';

export function nombreJuradoDesdeUsuario(jurado?: {
  idJurado?: number;
  usuario?: { nombres?: string; primerApellido?: string; segundoApellido?: string } | null;
} | null): string {
  const u = jurado?.usuario;
  if (!u) return jurado?.idJurado ? `Jurado #${jurado.idJurado}` : 'Jurado sin usuario';
  return [u.nombres, u.primerApellido, u.segundoApellido].filter(Boolean).join(' ').trim()
    || (jurado?.idJurado ? `Jurado #${jurado.idJurado}` : 'Jurado sin usuario');
}

export function round2(n: number): number {
  return Number((n || 0).toFixed(2));
}

function claveJurado(acta: EfuActa): string {
  if (acta.idJurado != null && Number.isFinite(acta.idJurado)) return `j:${acta.idJurado}`;
  return `n:${acta.juradoNombre || 'sin'}`;
}

function claveFase(acta: EfuActa): string {
  if (acta.idFase != null && Number.isFinite(acta.idFase)) return `f:${acta.idFase}`;
  return `n:${acta.faseNombre || 'sin'}`;
}

export function actaDesdeEvaluacion(e: {
  idEvaluacion?: number;
  puntajeTotal?: number;
  criteriosEvaluados?: Record<string, unknown> | null;
  estado?: string;
  fechaCierre?: Date | string | null;
  updatedAt?: Date | string | null;
  fraternidad?: { idFraternidad?: number } | null;
  fase?: { idFase?: number; nombre?: string; pesoPorcentaje?: number } | null;
  jurado?: {
    idJurado?: number;
    usuario?: { nombres?: string; primerApellido?: string; segundoApellido?: string } | null;
  } | null;
}): EfuActa | null {
  const idFraternidad = e.fraternidad?.idFraternidad;
  if (!idFraternidad) return null;
  return {
    idFraternidad,
    idJurado: e.jurado?.idJurado ?? null,
    juradoNombre: nombreJuradoDesdeUsuario(e.jurado),
    idEvaluacion: e.idEvaluacion ?? null,
    idFase: e.fase?.idFase ?? null,
    faseNombre: e.fase?.nombre || '—',
    pesoPorcentaje: e.fase?.pesoPorcentaje != null ? Number(e.fase.pesoPorcentaje) : null,
    puntajeTotal: Number(e.puntajeTotal) || 0,
    criteriosEvaluados: e.criteriosEvaluados || null,
    estado: e.estado || '',
    fechaCierre: e.fechaCierre || e.updatedAt || null,
  };
}

/**
 * Agrupa actas por fraternidad.
 * Nota final = Σ (promedio por fase artística) + disciplina fusionada (sumatoria).
 */
export function calcularScoresEfu(actas: EfuActa[]): Map<number, EfuFraternidadScore> {
  type AccJurado = {
    idJurado: number | null;
    juradoNombre: string;
    suma: number;
    fases: EfuFaseDetalle[];
  };

  const disciplinaActasPorFrat = new Map<number, EfuActa[]>();
  const porFrat = new Map<number, Map<string, AccJurado>>();
  /** idFraternidad → claveFase → notas */
  const notasFasePorFrat = new Map<number, Map<string, { idFase: number | null; vals: number[] }>>();

  for (const acta of actas) {
    if (!acta?.idFraternidad) continue;

    if (esFaseDisciplinaNombre(acta.faseNombre)) {
      if (!disciplinaActasPorFrat.has(acta.idFraternidad)) {
        disciplinaActasPorFrat.set(acta.idFraternidad, []);
      }
      disciplinaActasPorFrat.get(acta.idFraternidad)!.push(acta);
      continue;
    }

    let porJurado = porFrat.get(acta.idFraternidad);
    if (!porJurado) {
      porJurado = new Map();
      porFrat.set(acta.idFraternidad, porJurado);
    }
    const key = claveJurado(acta);
    let acc = porJurado.get(key);
    if (!acc) {
      acc = {
        idJurado: acta.idJurado,
        juradoNombre: acta.juradoNombre || 'Jurado',
        suma: 0,
        fases: [],
      };
      porJurado.set(key, acc);
    }
    acc.suma += Number(acta.puntajeTotal) || 0;
    acc.fases.push({
      idEvaluacion: acta.idEvaluacion ?? null,
      idFase: acta.idFase ?? null,
      faseNombre: acta.faseNombre || '—',
      pesoPorcentaje: acta.pesoPorcentaje ?? null,
      puntajeTotal: round2(Number(acta.puntajeTotal) || 0),
      estado: acta.estado || '',
      fechaCierre: acta.fechaCierre || null,
    });

    let porFase = notasFasePorFrat.get(acta.idFraternidad);
    if (!porFase) {
      porFase = new Map();
      notasFasePorFrat.set(acta.idFraternidad, porFase);
    }
    const fk = claveFase(acta);
    let bucket = porFase.get(fk);
    if (!bucket) {
      bucket = { idFase: acta.idFase ?? null, vals: [] };
      porFase.set(fk, bucket);
    }
    bucket.vals.push(Number(acta.puntajeTotal) || 0);
  }

  const disciplinaPorFrat = new Map<number, number>();
  for (const [idFrat, actasDisc] of disciplinaActasPorFrat) {
    disciplinaPorFrat.set(idFrat, fusionarPuntajeDisciplina(actasDisc));
    if (!porFrat.has(idFrat)) porFrat.set(idFrat, new Map());
  }

  const result = new Map<number, EfuFraternidadScore>();
  const allIds = new Set([...porFrat.keys(), ...disciplinaPorFrat.keys()]);

  for (const idFraternidad of allIds) {
    const porJurado = porFrat.get(idFraternidad) || new Map();
    const disciplinaMerged = round2(disciplinaPorFrat.get(idFraternidad) || 0);

    const jurados: EfuJuradoNota[] = Array.from(porJurado.values()).map((acc) => ({
      idJurado: acc.idJurado,
      juradoNombre: acc.juradoNombre,
      notaFraternidad: round2(acc.suma),
      fasesCalificadas: acc.fases.length,
      fases: acc.fases.sort((a, b) =>
        String(a.faseNombre).localeCompare(String(b.faseNombre), 'es'),
      ),
    }));
    jurados.sort((a, b) => b.notaFraternidad - a.notaFraternidad
      || String(a.juradoNombre).localeCompare(String(b.juradoNombre), 'es'));

    const notasPorFase: Record<number, number> = {};
    let sumaFasesArtisticas = 0;
    const porFase = notasFasePorFrat.get(idFraternidad);
    if (porFase) {
      for (const bucket of porFase.values()) {
        if (!bucket.vals.length) continue;
        const avg = round2(
          bucket.vals.reduce((s, v) => s + v, 0) / bucket.vals.length,
        );
        sumaFasesArtisticas += avg;
        if (bucket.idFase != null) notasPorFase[bucket.idFase] = avg;
      }
    }

    result.set(idFraternidad, {
      idFraternidad,
      cantidadJurados: jurados.length,
      promedioFinal: round2(sumaFasesArtisticas + disciplinaMerged),
      disciplinaMerged,
      notasPorFase,
      jurados,
    });
  }
  return result;
}
