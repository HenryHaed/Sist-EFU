import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { FraternidadesModule } from './fraternidades/fraternidades.module';
import { UsuariosModule } from './usuarios/usuarios.module';
import { EvaluacionesModule } from './evaluaciones/evaluaciones.module';
import { ParticipantesModule } from './participantes/participantes.module';
import { OrganizacionModule } from './organizacion/organizacion.module';
import { InscripcionesModule } from './inscripciones/inscripciones.module';
import { AsistenciasModule } from './asistencias/asistencias.module';
import { MonografiasModule } from './monografias/monografias.module';
import { AuditoriaModule } from './auditoria/auditoria.module';
import { ReportesModule } from './reportes/reportes.module';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      // Convención Node/Nest: .env por entorno; el admin del servidor solo edita .env (o .env.production)
      envFilePath: [
        `.env.${process.env.NODE_ENV || 'development'}.local`,
        `.env.${process.env.NODE_ENV || 'development'}`,
        '.env.local',
        '.env',
      ],
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const nodeEnv = configService.get<string>('NODE_ENV', 'development');
        const synchronizeDefault = nodeEnv === 'production' ? 'false' : 'true';
        return {
        type: 'postgres',
        host: configService.get<string>('DB_HOST', 'localhost'),
        port: configService.get<number>('DB_PORT', 5432),
        username: configService.get<string>('DB_USER', 'postgres'),
        password: configService.get<string>('DB_PASSWORD', 'root'),
        database: configService.get<string>('DB_NAME', 'efu_db'),
        entities: [__dirname + '/entities/*{.ts,.js}'],
        synchronize: configService.get<string>('TYPEORM_SYNCHRONIZE', synchronizeDefault) === 'true',
      }},
    }),
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), 'uploads'),
      serveRoot: '/uploads',
    }),
    AuthModule,
    FraternidadesModule,
    UsuariosModule,
    EvaluacionesModule,
    ParticipantesModule,
    OrganizacionModule,
    InscripcionesModule,
    AsistenciasModule,
    MonografiasModule,
    AuditoriaModule,
    ReportesModule,
  ],
})
export class AppModule {}

