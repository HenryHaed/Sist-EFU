import { Repository } from 'typeorm';
import { Categoria } from '../entities/Categoria';

export const CATEGORIAS_DEFAULT = [
  {
    nombre: 'CATEGORÍA A',
    descripcion:
      'Danzas tradicionales o criollo mestizas que han tenido origen en la ciudad y se las interpreta con bandas que tienen instrumentos de metal.',
  },
  {
    nombre: 'CATEGORÍA B',
    descripcion:
      'Danzas autóctonas de origen rural que en la actualidad se bailan con el acompañamiento de bandas que tienen instrumentos de metal.',
  },
  {
    nombre: 'CATEGORÍA C',
    descripcion:
      'Danzas autóctonas de origen rural, que se interpretan con instrumentos nativos.',
  },
] as const;

export async function ensureCategoriasDefault(
  categoriaRepo: Repository<Categoria>,
  idGestion: number,
): Promise<Categoria[]> {
  const existing = await categoriaRepo.find({
    where: { gestion: { idGestion } },
    order: { idCategoria: 'ASC' },
  });

  const existingNames = new Set(existing.map((c) => c.nombre.trim().toUpperCase()));
  const created = [...existing];

  for (const def of CATEGORIAS_DEFAULT) {
    if (existingNames.has(def.nombre.toUpperCase())) continue;
    const saved = await categoriaRepo.save(
      categoriaRepo.create({
        nombre: def.nombre,
        descripcion: def.descripcion,
        gestion: { idGestion } as any,
      }),
    );
    created.push(saved);
    existingNames.add(def.nombre.toUpperCase());
  }

  return created.sort((a, b) => a.idCategoria - b.idCategoria);
}
