import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ConfigService } from '@nestjs/config';
import { join } from 'path';

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
