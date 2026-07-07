import { Repository } from 'typeorm';
import { Gestion } from '../entities/Gestion';

/** Gestión activa, o la más reciente por año. Null si no hay ninguna. */
export async function findGestionActivaOrLatest(
  gestionRepo: Repository<Gestion>,
): Promise<Gestion | null> {
  const activa = await gestionRepo.findOne({ where: { activa: true } });
  if (activa) return activa;

  const [latest] = await gestionRepo.find({
    order: { anio: 'DESC' },
    take: 1,
  });
  return latest ?? null;
}
