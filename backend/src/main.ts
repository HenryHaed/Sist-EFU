import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';
import { join } from 'path';
import { ensureSystemRoles } from './common/system-roles';

async function runPatch(dataSource: DataSource, name: string, sql: string) {
  try {
    await dataSource.query(sql);
  } catch (err) {
    console.warn(`[SCHEMA] Patch "${name}" omitido:`, (err as Error)?.message || err);
  }
}

async function ensureSchemaPatches(dataSource: DataSource) {
  // Producción con TYPEORM_SYNCHRONIZE=false: cada patch es independiente
  // (un fallo no debe impedir crear roles ni el resto de columnas).
  await runPatch(dataSource, 'gestiones.landing_fraternidades', `
    ALTER TABLE gestiones
    ADD COLUMN IF NOT EXISTS landing_fraternidades jsonb NULL
  `);
  await runPatch(dataSource, 'gestiones.mostrar_historico', `
    ALTER TABLE gestiones
    ADD COLUMN IF NOT EXISTS mostrar_historico boolean NOT NULL DEFAULT false
  `);
  await runPatch(dataSource, 'gestiones.edicion', `
    ALTER TABLE gestiones
    ADD COLUMN IF NOT EXISTS edicion varchar(20) NULL
  `);
  await runPatch(dataSource, 'eventos_control.es_publico', `
    ALTER TABLE eventos_control
    ADD COLUMN IF NOT EXISTS es_publico boolean NOT NULL DEFAULT false
  `);
  await runPatch(dataSource, 'eventos_control.descripcion', `
    ALTER TABLE eventos_control
    ADD COLUMN IF NOT EXISTS descripcion text NULL
  `);
  await runPatch(dataSource, 'solicitudes.costos_participacion', `
    ALTER TABLE solicitudes_inscripcion
    ADD COLUMN IF NOT EXISTS costos_participacion jsonb NULL
  `);
  await runPatch(dataSource, 'fraternidades.costos_participacion', `
    ALTER TABLE fraternidades
    ADD COLUMN IF NOT EXISTS costos_participacion jsonb NULL
  `);
  await runPatch(dataSource, 'gestiones.limite_fraternidades_por_danza', `
    ALTER TABLE gestiones
    ADD COLUMN IF NOT EXISTS limite_fraternidades_por_danza integer NOT NULL DEFAULT 6
  `);
  await runPatch(dataSource, 'fraternidades.es_excedente', `
    ALTER TABLE fraternidades
    ADD COLUMN IF NOT EXISTS es_excedente boolean NOT NULL DEFAULT false
  `);
  await runPatch(dataSource, 'solicitudes.id_categoria nullable', `
    ALTER TABLE solicitudes_inscripcion
    ALTER COLUMN id_categoria DROP NOT NULL
  `);
  await runPatch(dataSource, 'enum BORRADOR', `
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

  await runPatch(dataSource, 'documentos_gestion.es_publico', `
    ALTER TABLE documentos_gestion
    ADD COLUMN IF NOT EXISTS es_publico boolean NOT NULL DEFAULT false
  `);

  await runPatch(dataSource, 'fases.plantilla_requisitos', `
    ALTER TABLE fases
    ADD COLUMN IF NOT EXISTS plantilla_requisitos varchar(50) NULL
  `);
  await runPatch(dataSource, 'fases.requisitos_inscripcion', `
    ALTER TABLE fases
    ADD COLUMN IF NOT EXISTS requisitos_inscripcion jsonb NULL
  `);

  await runPatch(dataSource, 'usuarios.id_fase_concurso', `
    ALTER TABLE usuarios
    ADD COLUMN IF NOT EXISTS id_fase_concurso integer NULL
  `);
  await runPatch(dataSource, 'fk_usuarios_fase_concurso', `
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

  await runPatch(dataSource, 'tabla inscripciones_concurso', `
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
  await runPatch(dataSource, 'tabla inscripcion_concurso_archivos', `
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
  await runPatch(dataSource, 'idx inscripciones_concurso_fase', `
    CREATE INDEX IF NOT EXISTS idx_inscripciones_concurso_fase ON inscripciones_concurso(id_fase)
  `);
  await runPatch(dataSource, 'idx inscripciones_concurso_usuario', `
    CREATE INDEX IF NOT EXISTS idx_inscripciones_concurso_usuario ON inscripciones_concurso(id_usuario)
  `);

  await runPatch(dataSource, 'inscripciones_concurso.id_fraternidad', `
    ALTER TABLE inscripciones_concurso
    ADD COLUMN IF NOT EXISTS id_fraternidad integer NULL
  `);
  await runPatch(dataSource, 'inscripciones_concurso.id_participante_pareja', `
    ALTER TABLE inscripciones_concurso
    ADD COLUMN IF NOT EXISTS id_participante_pareja integer NULL
  `);
  await runPatch(dataSource, 'fk_insc_concurso_fraternidad', `
    DO $$ BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'fk_insc_concurso_fraternidad'
          AND table_name = 'inscripciones_concurso'
      ) THEN
        ALTER TABLE inscripciones_concurso
          ADD CONSTRAINT fk_insc_concurso_fraternidad
          FOREIGN KEY (id_fraternidad) REFERENCES fraternidades(id_fraternidad)
          ON DELETE SET NULL;
      END IF;
    END $$;
  `);
  await runPatch(dataSource, 'fk_insc_concurso_participante_pareja', `
    DO $$ BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'fk_insc_concurso_participante_pareja'
          AND table_name = 'inscripciones_concurso'
      ) THEN
        ALTER TABLE inscripciones_concurso
          ADD CONSTRAINT fk_insc_concurso_participante_pareja
          FOREIGN KEY (id_participante_pareja) REFERENCES participantes_concurso(id_participante)
          ON DELETE SET NULL;
      END IF;
    END $$;
  `);
  await runPatch(dataSource, 'uq_insc_concurso_fraternidad_fase', `
    CREATE UNIQUE INDEX IF NOT EXISTS uq_insc_concurso_fraternidad_fase
    ON inscripciones_concurso (id_fraternidad, id_fase)
    WHERE id_fraternidad IS NOT NULL
  `);
  await runPatch(dataSource, 'idx inscripciones_concurso_fraternidad', `
    CREATE INDEX IF NOT EXISTS idx_inscripciones_concurso_fraternidad
    ON inscripciones_concurso(id_fraternidad)
  `);
  await runPatch(dataSource, 'inscripciones_concurso.revision_checklist', `
    ALTER TABLE inscripciones_concurso
    ADD COLUMN IF NOT EXISTS revision_checklist jsonb NULL DEFAULT '{}'::jsonb
  `);

  await runPatch(dataSource, 'tabla fichas_tecnicas_monografia', `
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
  await runPatch(dataSource, 'idx fichas_tecnicas_gestion', `
    CREATE INDEX IF NOT EXISTS idx_fichas_tecnicas_gestion ON fichas_tecnicas_monografia(id_gestion)
  `);
  await runPatch(dataSource, 'idx fichas_tecnicas_estado', `
    CREATE INDEX IF NOT EXISTS idx_fichas_tecnicas_estado ON fichas_tecnicas_monografia(estado)
  `);
  await runPatch(dataSource, 'fichas.nombre_firmante', `
    ALTER TABLE fichas_tecnicas_monografia
    ADD COLUMN IF NOT EXISTS nombre_firmante varchar(255) NULL
  `);
  await runPatch(dataSource, 'fichas.instancia_representacion', `
    ALTER TABLE fichas_tecnicas_monografia
    ADD COLUMN IF NOT EXISTS instancia_representacion varchar(50) NULL
  `);

  // Una sanción grave no debe apagar habilitado_efu (eso oculta la fraternidad
  // de calificación, ranking y gestión). Restaura las que se deshabilitaron así.
  await runPatch(dataSource, 'restaurar habilitado_efu tras sancion SUSPENSION', `
    UPDATE fraternidades f
    SET habilitado_efu = true
    WHERE f.habilitado_efu = false
      AND EXISTS (
        SELECT 1
        FROM incidencias i
        INNER JOIN infracciones inf ON inf.id_infraccion = i.id_infraccion
        WHERE i.id_fraternidad = f.id_fraternidad
          AND inf.tipo_impacto = 'SUSPENSION'
      )
  `);

  await runPatch(dataSource, 'tabla cronogramas_actividad', `
    CREATE TABLE IF NOT EXISTS cronogramas_actividad (
      id_cronograma_actividad SERIAL PRIMARY KEY,
      id_gestion INTEGER NOT NULL REFERENCES gestiones(id_gestion) ON DELETE CASCADE,
      tipo VARCHAR(40) NOT NULL,
      fecha_inicio TIMESTAMP NOT NULL,
      fecha_fin TIMESTAMP NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `);
  await runPatch(dataSource, 'uq cronogramas_actividad gestion tipo', `
    CREATE UNIQUE INDEX IF NOT EXISTS uq_cronograma_actividad_gestion_tipo
    ON cronogramas_actividad (id_gestion, tipo)
  `);

  try {
    await ensureSystemRoles(dataSource);
  } catch (err) {
    console.warn('[SCHEMA] No se pudieron asegurar roles del sistema:', (err as Error)?.message || err);
  }
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

  const dataSource = app.get(DataSource);
  try {
    await ensureSchemaPatches(dataSource);
  } catch (err) {
    console.warn('[SERVER] No se pudo aplicar patch de esquema:', (err as Error)?.message || err);
  }
  try {
    await ensureSystemRoles(dataSource);
  } catch (err) {
    console.warn('[SERVER] No se pudieron asegurar roles del sistema:', (err as Error)?.message || err);
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
