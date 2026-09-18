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

/**
 * Orden oficial de desfile (admin drag-and-drop).
 * Números primero (ASC); sin orden al final; empate por nombre e id.
 */
export function compareOrdenDesfileAsc(
  a: { ordenDesfile?: number | null; nombre?: string | null; idFraternidad?: number | null },
  b: { ordenDesfile?: number | null; nombre?: string | null; idFraternidad?: number | null },
  getNombre: (x: any) => string = (x) => x?.nombre || x?.nombreFraternidad || '',
  getId: (x: any) => number = (x) => Number(x?.idFraternidad) || 0,
): number {
  const oa = a?.ordenDesfile;
  const ob = b?.ordenDesfile;
  const aNum = oa != null && oa !== ('' as any) && Number.isFinite(Number(oa));
  const bNum = ob != null && ob !== ('' as any) && Number.isFinite(Number(ob));
  if (aNum && bNum && Number(oa) !== Number(ob)) return Number(oa) - Number(ob);
  if (aNum && !bNum) return -1;
  if (!aNum && bNum) return 1;
  const byNombre = compareTextoEs(getNombre(a), getNombre(b));
  if (byNombre !== 0) return byNombre;
  return getId(a) - getId(b);
}
