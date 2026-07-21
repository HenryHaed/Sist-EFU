import { Repository } from 'typeorm';
import { Fraternidad } from '../entities/Fraternidad';

/**
 * Recalcula el sello esExcedente para fraternidades de una gestión y tipo de danza.
 * Las primeras `limite` (por fecha de creación / id) quedan normales; el resto excedente.
 */
export async function recalcularExcedentesPorTipoDanza(
  fraternidadRepo: Repository<Fraternidad>,
  idGestion: number,
  idTipoDanza: number,
  limite: number,
): Promise<void> {
  if (!idGestion || !idTipoDanza) return;

  const lim = Math.max(1, Number(limite) || 6);
  const list = await fraternidadRepo.find({
    where: {
      gestion: { idGestion },
      tipoDanza: { idTipoDanza },
    },
    order: { createdAt: 'ASC', idFraternidad: 'ASC' },
  });

  if (!list.length) return;

  for (let i = 0; i < list.length; i++) {
    list[i].esExcedente = i >= lim;
  }
  await fraternidadRepo.save(list);
}

/**
 * Recalcula excedentes para todos los tipos de danza presentes en una gestión.
 */
export async function recalcularExcedentesGestion(
  fraternidadRepo: Repository<Fraternidad>,
  idGestion: number,
  limite: number,
): Promise<void> {
  if (!idGestion) return;

  const frats = await fraternidadRepo.find({
    where: { gestion: { idGestion } },
    relations: ['tipoDanza'],
  });
  const idsTipo = [
    ...new Set(
      frats
        .map((f) => f.tipoDanza?.idTipoDanza)
        .filter((id): id is number => typeof id === 'number' && !Number.isNaN(id)),
    ),
  ];

  for (const idTipoDanza of idsTipo) {
    await recalcularExcedentesPorTipoDanza(fraternidadRepo, idGestion, idTipoDanza, limite);
  }
}
