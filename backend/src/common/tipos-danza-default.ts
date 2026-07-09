import { Repository } from 'typeorm';
import { TipoDanza } from '../entities/TipoDanza';

export const TIPOS_DANZA_DEFAULT = [
  'La Diablada',
  'La Morenada',
  'Los Caporales',
  'El Tinku',
  'La Cueca',
  'La Llamerada',
  'El Pujllay',
  'El Ayarichi',
  'La Kullawada',
  'Los Tobas',
  'La Waca Waca',
  'El Suri Sicuri',
  'Los Doctorcitos',
  'Los Potolos',
  'El Taquirari',
  'La Chovena',
  'El Sarao',
  'Los Macheteros',
  'El Arete Guazú',
  'La Saya Afroboliviana',
  'El Tundiqui',
  'El Huayño',
  'La Chapaqueada',
  'La Rueda Chapaca',
  'Los Chunchos',
  'La ChampaDance',
  'Los Kusillos',
  'El Carnavalito',
  'La Cahuaniri',
  'El Auqui Auqui',
  'Los Jacha Tata Danzanti',
  'La Tarqueada',
  'La Pinquillada',
  'La Moseñada',
  'Los Negritos',
  'La Cacharpaya',
] as const;

export async function ensureTiposDanzaDefault(repo: Repository<TipoDanza>): Promise<TipoDanza[]> {
  const existing = await repo.find({ order: { orden: 'ASC', idTipoDanza: 'ASC' } });
  const byName = new Set(existing.map((t) => t.nombre.trim().toLowerCase()));
  const result = [...existing];

  TIPOS_DANZA_DEFAULT.forEach((nombre, index) => {
    if (byName.has(nombre.toLowerCase())) return;
    result.push(
      repo.create({
        nombre,
        orden: index + 1,
        activo: true,
      }),
    );
  });

  const toSave = result.filter((t) => !t.idTipoDanza);
  if (toSave.length) {
    const saved = await repo.save(toSave);
    return [...existing, ...saved].sort((a, b) => a.orden - b.orden || a.idTipoDanza - b.idTipoDanza);
  }

  return existing;
}
