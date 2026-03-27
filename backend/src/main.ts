import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Servir archivos estáticos (para las imágenes subidas)
  app.useStaticAssets(join(__dirname, '..', 'uploads'), {
    prefix: '/uploads/',
  });

  // Prefijo global para todas las rutas: /api/v1
  app.setGlobalPrefix('api/v1');

  // Habilitar CORS para que el frontend pueda conectar
  app.enableCors();

  // Configuracion de Swagger
  const config = new DocumentBuilder()
    .setTitle('Entrada Universitaria EFU - API')
    .setDescription('Documentacion de la API para el sistema de gestion de la Entrada Universitaria')
    .setVersion('1.0')
    .addBearerAuth() // Soporte para JWT en la UI de Swagger
    .build();
  
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  await app.listen(3000);
  console.log('[SERVER] Iniciado en http://localhost:3000/api/v1');
  console.log('[SWAGGER] Documentacion en http://localhost:3000/api');
}
bootstrap();
