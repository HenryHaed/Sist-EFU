import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DataSource } from 'typeorm';
import { Facultad } from './entities/Facultad';
import { Carrera } from './entities/Carrera';
import { ensureOrganizacionUmsaDefault } from './common/organizacion-umsa-default';
import { FACULTADES_UMSA_DEFAULT } from './data/organizacion-umsa';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const dataSource = app.get(DataSource);
  const facultadRepo = dataSource.getRepository(Facultad);
  const carreraRepo = dataSource.getRepository(Carrera);

  try {
    console.log('[ORGANIZACION] Sembrando facultades y carreras UMSA...\n');
    console.log(`  Catálogo: ${FACULTADES_UMSA_DEFAULT.length} facultades\n`);

    const result = await ensureOrganizacionUmsaDefault(facultadRepo, carreraRepo);

    console.log('════════════════════════════════════════');
    console.log(`  Facultades insertadas: ${result.facultadesInsertadas}`);
    console.log(`  Facultades ya existían: ${result.facultadesExistentes}`);
    console.log(`  Carreras insertadas: ${result.carrerasInsertadas}`);
    console.log(`  Carreras ya existían: ${result.carrerasExistentes}`);
    console.log('════════════════════════════════════════\n');
  } catch (error) {
    console.error('[ORGANIZACION] Error:', error);
    process.exitCode = 1;
  } finally {
    await app.close();
  }
}

bootstrap();
