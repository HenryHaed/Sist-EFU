/**
 * Puntuación EFU: cada jurado aporta UNA NotaFraternidad (suma de las fases
 * que sí calificó). El Promedio Final de la fraternidad es
 * suma(NotaFraternidad) / N jurados distintos. No se reescala ni se divide
 * por número de actas/fases.
 */

export type EfuActa = {
  idFraternidad: number;
  idJurado: number | null;
  juradoNombre: string;
  idEvaluacion?: number | null;
  idFase?: number | null;
  faseNombre?: string;
  pesoPorcentaje?: number | null;
  puntajeTotal: number;
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
  promedioFinal: number;
  jurados: EfuJuradoNota[];
};

export const FORMULA_EFU_PROMEDIO =
  'NotaFraternidad = suma de las fases que calificó el jurado; Promedio Final = suma(NotaFraternidad) / N jurados';

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

export function actaDesdeEvaluacion(e: {
  idEvaluacion?: number;
  puntajeTotal?: number;
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
    estado: e.estado || '',
    fechaCierre: e.fechaCierre || e.updatedAt || null,
  };
}

/**
 * Agrupa actas por fraternidad y por jurado.
 * NotaFraternidad = suma de puntajes de ese jurado en esa fraternidad.
 * Promedio Final = suma(NotaFraternidad) / N jurados.
 */
export function calcularScoresEfu(actas: EfuActa[]): Map<number, EfuFraternidadScore> {
  type AccJurado = {
    idJurado: number | null;
    juradoNombre: string;
    suma: number;
    fases: EfuFaseDetalle[];
  };

  const porFrat = new Map<number, Map<string, AccJurado>>();

  for (const acta of actas) {
    if (!acta?.idFraternidad) continue;
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
  }

  const result = new Map<number, EfuFraternidadScore>();
  for (const [idFraternidad, porJurado] of porFrat) {
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

    const sumaNotas = jurados.reduce((s, j) => s + j.notaFraternidad, 0);
    const n = jurados.length;
    result.set(idFraternidad, {
      idFraternidad,
      cantidadJurados: n,
      promedioFinal: n > 0 ? round2(sumaNotas / n) : 0,
      jurados,
    });
  }
  return result;
}
