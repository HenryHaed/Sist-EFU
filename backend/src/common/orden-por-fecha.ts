/** Compara fechas ASC (más antigua primero). Nulls al final. */
export function compareFechaAsc(
  a: Date | string | null | undefined,
  b: Date | string | null | undefined,
): number {
  const ta = a ? new Date(a).getTime() : Number.POSITIVE_INFINITY;
  const tb = b ? new Date(b).getTime() : Number.POSITIVE_INFINITY;
  if (ta !== tb) return ta - tb;
  return 0;
}

export function compareTextoEs(a: string | null | undefined, b: string | null | undefined): number {
  return String(a || '')
    .localeCompare(String(b || ''), 'es', { sensitivity: 'base' });
}
