import { Repository } from 'typeorm';
import { Facultad } from '../entities/Facultad';
import { Carrera } from '../entities/Carrera';
import {
  FACULTADES_UMSA_DEFAULT,
  FacultadUmsaDef,
  PALABRAS_FACULTAD,
  SIGLAS_ALTERNATIVAS,
} from '../data/organizacion-umsa';

export interface OrganizacionUmsaSeedResult {
  facultadesInsertadas: number;
  facultadesExistentes: number;
  carrerasInsertadas: number;
  carrerasExistentes: number;
}

function normalizar(texto: string): string {
  return texto.trim().toLowerCase().normalize('NFD').replace(/\p{M}/gu, '');
}

function siglaLimpia(sigla?: string): string {
  return (sigla || '').trim().toUpperCase();
}

function siglasEquivalentes(sigla: string): string[] {
  const s = siglaLimpia(sigla);
  return [s, ...(SIGLAS_ALTERNATIVAS[s] || [])];
}

function buscarFacultadExistente(todas: Facultad[], def: FacultadUmsaDef): Facultad | null {
  const alias = siglasEquivalentes(def.sigla);
  const palabrasNombre = PALABRAS_FACULTAD[def.sigla] || [];
  const nombreCanonico = normalizar(def.nombre);

  for (const f of todas) {
    if (alias.includes(siglaLimpia(f.sigla))) return f;
  }

  for (const f of todas) {
    if (normalizar(f.nombre) === nombreCanonico) return f;
  }

  for (const f of todas) {
    const nombre = normalizar(f.nombre);
    if (palabrasNombre.some((p) => nombre.includes(p))) return f;
  }

  for (const f of todas) {
    const nombre = f.nombre.toUpperCase();
    if (alias.some((s) => nombre.includes(s))) return f;
  }

  return null;
}

/**
 * Garantiza el catálogo base de facultades y carreras UMSA (idempotente).
 * Inserta solo lo que falta; no elimina ni sobrescribe registros existentes.
 */
export async function ensureOrganizacionUmsaDefault(
  facultadRepo: Repository<Facultad>,
  carreraRepo: Repository<Carrera>,
): Promise<OrganizacionUmsaSeedResult> {
  const result: OrganizacionUmsaSeedResult = {
    facultadesInsertadas: 0,
    facultadesExistentes: 0,
    carrerasInsertadas: 0,
    carrerasExistentes: 0,
  };

  let facultades = await facultadRepo.find();

  for (const def of FACULTADES_UMSA_DEFAULT) {
    let facultad = buscarFacultadExistente(facultades, def);

    if (!facultad) {
      facultad = await facultadRepo.save(
        facultadRepo.create({
          nombre: def.nombre,
          sigla: def.sigla,
        }),
      );
      facultades = [...facultades, facultad];
      result.facultadesInsertadas++;
    } else {
      result.facultadesExistentes++;
      if (!siglaLimpia(facultad.sigla) && def.sigla) {
        facultad.sigla = def.sigla;
        await facultadRepo.save(facultad);
      }
    }

    const existentes = await carreraRepo.find({
      where: { facultad: { idFacultad: facultad.idFacultad } },
    });
    const nombresExistentes = new Set(existentes.map((c) => normalizar(c.nombre)));

    for (const nombre of def.carreras) {
      if (nombresExistentes.has(normalizar(nombre))) {
        result.carrerasExistentes++;
        continue;
      }

      await carreraRepo.save(
        carreraRepo.create({
          nombre,
          facultad: { idFacultad: facultad.idFacultad } as Facultad,
        }),
      );
      nombresExistentes.add(normalizar(nombre));
      result.carrerasInsertadas++;
    }
  }

  return result;
}
