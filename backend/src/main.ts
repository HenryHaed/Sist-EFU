import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';
import { join } from 'path';

async function ensureSchemaPatches(dataSource: DataSource) {
  // Producción con TYPEORM_SYNCHRONIZE=false: columnas nuevas sin migración formal
  await dataSource.query(`
    ALTER TABLE gestiones
    ADD COLUMN IF NOT EXISTS landing_fraternidades jsonb NULL
  `);
  await dataSource.query(`
    ALTER TABLE gestiones
    ADD COLUMN IF NOT EXISTS mostrar_historico boolean NOT NULL DEFAULT false
  `);
  await dataSource.query(`
    ALTER TABLE gestiones
    ADD COLUMN IF NOT EXISTS edicion varchar(20) NULL
  `);
  await dataSource.query(`
    ALTER TABLE eventos_control
    ADD COLUMN IF NOT EXISTS es_publico boolean NOT NULL DEFAULT false
  `);
  await dataSource.query(`
    ALTER TABLE eventos_control
    ADD COLUMN IF NOT EXISTS descripcion text NULL
  `);
  await dataSource.query(`
    ALTER TABLE solicitudes_inscripcion
    ADD COLUMN IF NOT EXISTS costos_participacion jsonb NULL
  `);
  await dataSource.query(`
    ALTER TABLE fraternidades
    ADD COLUMN IF NOT EXISTS costos_participacion jsonb NULL
  `);
  await dataSource.query(`
    ALTER TABLE gestiones
    ADD COLUMN IF NOT EXISTS limite_fraternidades_por_danza integer NOT NULL DEFAULT 6
  `);
  await dataSource.query(`
    ALTER TABLE fraternidades
    ADD COLUMN IF NOT EXISTS es_excedente boolean NOT NULL DEFAULT false
  `);
  // Permitir borradores sin categoría aún elegida
  await dataSource.query(`
    ALTER TABLE solicitudes_inscripcion
    ALTER COLUMN id_categoria DROP NOT NULL
  `);
  // Postgres: agregar BORRADOR al enum de forma idempotente
  await dataSource.query(`
    DO $$ BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_enum e
        JOIN pg_type t ON e.enumtypid = t.oid
        WHERE t.typname = 'estado_solicitud' AND e.enumlabel = 'BORRADOR'
      ) THEN
        ALTER TYPE estado_solicitud ADD VALUE 'BORRADOR';
      END IF;
    END $$;
  `);
  // Rol veedor (solo lectura) — idempotente en bases ya existentes
  await dataSource.query(`
    INSERT INTO roles (nombre, descripcion, created_at, updated_at)
    SELECT
      'veedor',
      'Veedor de solo lectura: estadísticas, reglamento y monografías de fraternidades.',
      NOW(),
      NOW()
    WHERE NOT EXISTS (SELECT 1 FROM roles WHERE nombre = 'veedor')
  `);

  // Documentos de gestión: visibilidad pública (landing)
  await dataSource.query(`
    ALTER TABLE documentos_gestion
    ADD COLUMN IF NOT EXISTS es_publico boolean NOT NULL DEFAULT false
  `);

  // Rol concursante — idempotente (NO re-ejecutar seed en producción)
  await dataSource.query(`
    INSERT INTO roles (nombre, descripcion, created_at, updated_at)
    SELECT
      'concursante',
      'Concursante de concurso externo: completa inscripción y sube documentos de su fase asignada.',
      NOW(),
      NOW()
    WHERE NOT EXISTS (SELECT 1 FROM roles WHERE nombre = 'concursante')
  `);

  // Fase EXTERNO: plantilla y requisitos de inscripción
  await dataSource.query(`
    ALTER TABLE fases
    ADD COLUMN IF NOT EXISTS plantilla_requisitos varchar(50) NULL
  `);
  await dataSource.query(`
    ALTER TABLE fases
    ADD COLUMN IF NOT EXISTS requisitos_inscripcion jsonb NULL
  `);

  // Usuario concursante → un concurso (fase EXTERNO)
  await dataSource.query(`
    ALTER TABLE usuarios
    ADD COLUMN IF NOT EXISTS id_fase_concurso integer NULL
  `);
  await dataSource.query(`
    DO $$ BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'fk_usuarios_fase_concurso'
          AND table_name = 'usuarios'
      ) THEN
        ALTER TABLE usuarios
          ADD CONSTRAINT fk_usuarios_fase_concurso
          FOREIGN KEY (id_fase_concurso) REFERENCES fases(id_fase)
          ON DELETE SET NULL;
      END IF;
    END $$;
  `);

  // Inscripciones de concursantes a concursos externos
  await dataSource.query(`
    CREATE TABLE IF NOT EXISTS inscripciones_concurso (
      id_inscripcion SERIAL PRIMARY KEY,
      id_usuario INTEGER NOT NULL REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
      id_fase INTEGER NOT NULL REFERENCES fases(id_fase) ON DELETE CASCADE,
      id_gestion INTEGER NOT NULL REFERENCES gestiones(id_gestion) ON DELETE CASCADE,
      estado VARCHAR(20) NOT NULL DEFAULT 'BORRADOR',
      datos JSONB NULL,
      observacion_admin TEXT NULL,
      id_participante INTEGER NULL REFERENCES participantes_concurso(id_participante) ON DELETE SET NULL,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
      CONSTRAINT uq_inscripcion_usuario_fase UNIQUE (id_usuario, id_fase)
    )
  `);
  await dataSource.query(`
    CREATE TABLE IF NOT EXISTS inscripcion_concurso_archivos (
      id_archivo SERIAL PRIMARY KEY,
      id_inscripcion INTEGER NOT NULL REFERENCES inscripciones_concurso(id_inscripcion) ON DELETE CASCADE,
      clave_documento VARCHAR(100) NOT NULL,
      url VARCHAR(500) NOT NULL,
      mime VARCHAR(120) NULL,
      nombre_original VARCHAR(255) NULL,
      orden INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `);
  await dataSource.query(`
    CREATE INDEX IF NOT EXISTS idx_inscripciones_concurso_fase ON inscripciones_concurso(id_fase)
  `);
  await dataSource.query(`
    CREATE INDEX IF NOT EXISTS idx_inscripciones_concurso_usuario ON inscripciones_concurso(id_usuario)
  `);

  // Ficha técnica monografía (delegado llena / admin lista) — sin borrar datos
  await dataSource.query(`
    CREATE TABLE IF NOT EXISTS fichas_tecnicas_monografia (
      id_ficha SERIAL PRIMARY KEY,
      id_fraternidad INTEGER NOT NULL UNIQUE REFERENCES fraternidades(id_fraternidad) ON DELETE CASCADE,
      id_gestion INTEGER NOT NULL REFERENCES gestiones(id_gestion) ON DELETE CASCADE,
      nombre_fraternidad VARCHAR(255) NOT NULL,
      categoria VARCHAR(150) NULL,
      facultad_carrera TEXT NULL,
      instancia_representacion VARCHAR(50) NULL,
      danza VARCHAR(255) NULL,
      lugar_origen_danza TEXT NULL,
      sinopsis_danza TEXT NULL,
      resena_historica TEXT NULL,
      fecha_fundacion DATE NULL,
      fundadores TEXT NULL,
      premios TEXT NULL,
      nombre_firmante VARCHAR(255) NULL,
      expositores JSONB NULL,
      representantes_traje JSONB NULL,
      estado VARCHAR(20) NOT NULL DEFAULT 'BORRADOR',
      url_pdf VARCHAR(500) NULL,
      fecha_generacion TIMESTAMP NULL,
      id_usuario_actualizo INTEGER NULL REFERENCES usuarios(id_usuario) ON DELETE SET NULL,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `);
  await dataSource.query(`
    CREATE INDEX IF NOT EXISTS idx_fichas_tecnicas_gestion ON fichas_tecnicas_monografia(id_gestion)
  `);
  await dataSource.query(`
    CREATE INDEX IF NOT EXISTS idx_fichas_tecnicas_estado ON fichas_tecnicas_monografia(estado)
  `);
  await dataSource.query(`
    ALTER TABLE fichas_tecnicas_monografia
    ADD COLUMN IF NOT EXISTS nombre_firmante varchar(255) NULL
  `);
  await dataSource.query(`
    ALTER TABLE fichas_tecnicas_monografia
    ADD COLUMN IF NOT EXISTS instancia_representacion varchar(50) NULL
  `);
}

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const configService = app.get(ConfigService);

  const nodeEnv = configService.get<string>('NODE_ENV', 'development');
  const port = configService.get<number>('PORT', 3000);
  const corsOrigins = configService.get<string>(
    'CORS_ORIGINS',
    'http://localhost:5173,http://localhost:8080',
  );
  const swaggerDefault = nodeEnv === 'production' ? 'false' : 'true';
  const swaggerEnabled =
    configService.get<string>('SWAGGER_ENABLED', swaggerDefault) === 'true';

  try {
    await ensureSchemaPatches(app.get(DataSource));
  } catch (err) {
    console.warn('[SERVER] No se pudo aplicar patch de esquema:', (err as Error)?.message || err);
  }

  // Prefijo global para todas las rutas: /api/v1
  app.setGlobalPrefix('api/v1');

  // Servir archivos estáticos de la carpeta uploads
  app.useStaticAssets(join(process.cwd(), 'uploads'), {
    prefix: '/uploads',
  });

  // CORS: orígenes permitidos (lista separada por comas en CORS_ORIGINS)
  const allowedOrigins = corsOrigins
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  app.enableCors({
    origin: allowedOrigins.length > 0 ? allowedOrigins : true,
    credentials: true,
  });

  if (swaggerEnabled) {
    const config = new DocumentBuilder()
      .setTitle('Entrada Universitaria EFU - API')
      .setDescription(
        'Documentacion de la API para el sistema de gestion de la Entrada Universitaria',
      )
      .setVersion('1.0')
      .addBearerAuth()
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api', app, document);
  }

  await app.listen(port);

  const host = configService.get<string>('APP_URL', `http://localhost:${port}`);
  console.log(`[SERVER] Entorno: ${nodeEnv}`);
  console.log(`[SERVER] API: ${host}/api/v1`);
  if (swaggerEnabled) {
    console.log(`[SWAGGER] Documentacion: ${host}/api`);
  }
}
bootstrap();
