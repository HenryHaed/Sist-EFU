import { Repository } from 'typeorm';
import { TipoDanza } from '../entities/TipoDanza';

export const TIPOS_DANZA_DEFAULT = [
  'Amor tacana',
  'Antawara',
  'Arete Guazú',
  'Auqui Auqui',
  'Awatiris',
  'Ayarichi',
  'Bailecito',
  'Cacharpaya',
  'Cahuaniri',
  'Calcheños',
  'Caporales',
  'Carnavalito',
  'Chacarera',
  'ChampaDance',
  'Chapaqueada',
  'Chicheños',
  'Chovena',
  'Chunchos',
  'Chutas',
  'Cueca',
  'Diablada',
  'Doctorcitos',
  'Huayño',
  'Incas',
  'Jacha Tata Danzanti',
  'Jula julas',
  'Kallawaya',
  'Kullawada',
  'Kusillos',
  'Llamerada',
  'Macheteros',
  'Morenada',
  'Moseñada',
  'Negritos',
  'Pinquillada',
  'Potolos',
  'Pujllay',
  'Quena quena',
  'Rueda Chapaca',
  'Salay',
  'Sarao',
  'Saya Afroboliviana',
  'Suri Sicuri',
  'Taquirari',
  'Tarqueada',
  'Tinku',
  'Tobas',
  'Tundiqui',
  'Waca Waca',
  'Wititis',
] as const;

export async function ensureTiposDanzaDefault(repo: Repository<TipoDanza>): Promise<TipoDanza[]> {
  const existing = await repo.find({ order: { orden: 'ASC', idTipoDanza: 'ASC' } });
  const limpiarArticulo = (nombre: string) => nombre.trim().replace(/^(el|la|los|las)\s+/i, '');
  const defaultsByName = new Map(
    TIPOS_DANZA_DEFAULT.map((nombre, index) => [nombre.toLocaleLowerCase('es'), { nombre, orden: index + 1 }]),
  );

  for (const tipo of existing) {
    const limpio = limpiarArticulo(tipo.nombre);
    const valorDefault = defaultsByName.get(limpio.toLocaleLowerCase('es'));
    if (!valorDefault) continue;
    tipo.nombre = valorDefault.nombre;
    tipo.orden = valorDefault.orden;
    tipo.activo = true;
  }
  if (existing.length) await repo.save(existing);

  const byName = new Set(existing.map((t) => t.nombre.trim().toLocaleLowerCase('es')));
  const nuevos: TipoDanza[] = [];
  TIPOS_DANZA_DEFAULT.forEach((nombre, index) => {
    if (byName.has(nombre.toLocaleLowerCase('es'))) return;
    nuevos.push(
      repo.create({
        nombre,
        orden: index + 1,
        activo: true,
      }),
    );
  });

  if (nuevos.length) await repo.save(nuevos);
  return repo.find({ where: { activo: true }, order: { nombre: 'ASC' } });
}
