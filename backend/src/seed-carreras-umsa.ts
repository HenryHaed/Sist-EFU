import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DataSource, Repository } from 'typeorm';
import { Facultad } from './entities/Facultad';
import { Carrera } from './entities/Carrera';
import { CARRERAS_POR_FACULTAD, SIGLAS_ALTERNATIVAS, PALABRAS_FACULTAD } from './data/carreras-umsa';

function normalizar(texto: string): string {
  return texto.trim().toLowerCase().normalize('NFD').replace(/\p{M}/gu, '');
}

function siglaLimpia(sigla?: string): string {
  return (sigla || '').trim().toUpperCase();
}

async function resolverFacultad(
  facultadRepo: Repository<Facultad>,
  sigla: string,
): Promise<Facultad | null> {
  const siglaNorm = sigla.toUpperCase();
  const alias = [siglaNorm, ...(SIGLAS_ALTERNATIVAS[siglaNorm] || [])];
  const palabrasNombre = PALABRAS_FACULTAD[siglaNorm] || [];

  const todas = await facultadRepo.find();

  for (const f of todas) {
    const fSigla = siglaLimpia(f.sigla);
    if (alias.includes(fSigla)) return f;
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

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const dataSource = app.get(DataSource);
  const facultadRepo = dataSource.getRepository(Facultad);
  const carreraRepo = dataSource.getRepository(Carrera);

  let insertadas = 0;
  let omitidas = 0;
  const facultadesNoEncontradas: string[] = [];

  try {
    console.log('[CARRERAS] Insertando carreras UMSA por facultad...\n');

    for (const [sigla, carreras] of Object.entries(CARRERAS_POR_FACULTAD)) {
      const facultad = await resolverFacultad(facultadRepo, sigla);
      if (!facultad) {
        facultadesNoEncontradas.push(sigla);
        console.warn(`  ⚠ Facultad no encontrada: ${sigla}`);
        continue;
      }

      const existentes = await carreraRepo.find({
        where: { facultad: { idFacultad: facultad.idFacultad } },
      });
      const nombresExistentes = new Set(existentes.map((c) => normalizar(c.nombre)));

      console.log(`  ${facultad.sigla || sigla} — ${facultad.nombre}`);

      for (const nombre of carreras) {
        if (nombresExistentes.has(normalizar(nombre))) {
          omitidas++;
          continue;
        }

        await carreraRepo.save(
          carreraRepo.create({
            nombre,
            facultad: { idFacultad: facultad.idFacultad } as Facultad,
          }),
        );
        nombresExistentes.add(normalizar(nombre));
        insertadas++;
        console.log(`    + ${nombre}`);
      }
    }

    console.log('\n════════════════════════════════════════');
    console.log(`  Carreras insertadas: ${insertadas}`);
    console.log(`  Ya existían (omitidas): ${omitidas}`);
    if (facultadesNoEncontradas.length) {
      console.log(`  Facultades sin coincidencia: ${facultadesNoEncontradas.join(', ')}`);
    }
    console.log('════════════════════════════════════════\n');
  } catch (error) {
    console.error('[CARRERAS] Error:', error);
    process.exitCode = 1;
  } finally {
    await app.close();
  }
}

bootstrap();
