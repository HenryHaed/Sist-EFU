import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import * as fs from 'fs';
import * as path from 'path';
import { Role } from './entities/Role';

const UPLOAD_SUBDIRS = [
  'Doc_Gestion',
  'Doc_Monografia',
  'Docs_Gestion',
  'Docs_Registro',
  'img_Criterios',
  'img_Fases',
  'img_Fraternidades',
  'img_Gestion',
  'logos',
];

const SUPERUSUARIO = {
  ci: '12512405',
  nombres: 'Henry',
  primerApellido: 'Aguilar',
  segundoApellido: 'Estrada',
  correo: 'culturas@fcpn.edu.bo',
};

function limpiarArchivosSubidos() {
  const uploadsRoot = path.join(process.cwd(), 'uploads');
  if (!fs.existsSync(uploadsRoot)) {
    fs.mkdirSync(uploadsRoot, { recursive: true });
    console.log('[RESET] Carpeta uploads/ creada (vacía).');
    return;
  }

  let eliminados = 0;
  for (const subdir of UPLOAD_SUBDIRS) {
    const dirPath = path.join(uploadsRoot, subdir);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
      continue;
    }
    for (const entry of fs.readdirSync(dirPath)) {
      const fullPath = path.join(dirPath, entry);
      if (fs.statSync(fullPath).isFile()) {
        fs.unlinkSync(fullPath);
        eliminados++;
      }
    }
  }

  // Archivos sueltos en uploads/ (si los hubiera)
  for (const entry of fs.readdirSync(uploadsRoot)) {
    const fullPath = path.join(uploadsRoot, entry);
    if (fs.statSync(fullPath).isFile()) {
      fs.unlinkSync(fullPath);
      eliminados++;
    }
  }

  console.log(`[RESET] Archivos eliminados de uploads/: ${eliminados}`);
}

async function limpiarBaseDeDatos(dataSource: DataSource) {
  console.log('[RESET] Vaciando base de datos...');

  const tablas = [
    'auditoria_acciones',
    'sesiones_usuario',
    'password_reset_tokens',
    'asistencias',
    'incidencias',
    'evaluaciones',
    'monografias',
    'documentos_fraternidad',
    'documentos_gestion',
    'participantes_concurso',
    'jurado_fases',
    'jurado_fraternidades',
    'criterios',
    'fases',
    'infracciones',
    'jurados',
    'solicitudes_inscripcion',
    'cronograma_inscripciones',
    'usuarios',
    'fraternidades',
    'categorias',
    'carreras',
    'facultades',
    'instituciones_externas',
    'eventos_control',
    'gestiones',
    'roles',
  ];

  for (const tabla of tablas) {
    await dataSource.query(`DELETE FROM ${tabla}`);
  }

  const secuencias = [
    'roles_id_rol_seq',
    'gestiones_id_gestion_seq',
    'usuarios_id_usuario_seq',
    'facultades_id_facultad_seq',
    'carreras_id_carrera_seq',
    'categorias_id_categoria_seq',
    'instituciones_externas_id_institucion_seq',
    'fraternidades_id_fraternidad_seq',
    'fases_id_fase_seq',
    'jurados_id_jurado_seq',
    'eventos_control_id_evento_seq',
    'evaluaciones_id_evaluacion_seq',
    'participantes_concurso_id_participante_seq',
    'infracciones_id_infraccion_seq',
    'incidencias_id_incidencia_seq',
    'asistencias_id_asistencia_seq',
    'solicitudes_inscripcion_id_solicitud_seq',
    'documentos_gestion_id_documento_seq',
    'documentos_fraternidad_id_documento_seq',
    'monografias_id_monografia_seq',
    'criterios_id_criterio_seq',
    'cronograma_inscripciones_id_cronograma_seq',
    'password_reset_tokens_id_token_seq',
    'sesiones_usuario_id_sesion_seq',
    'auditoria_acciones_id_registro_seq',
  ];

  for (const seq of secuencias) {
    try {
      await dataSource.query(`ALTER SEQUENCE ${seq} RESTART WITH 1`);
    } catch {
      // La secuencia puede no existir aún en algunos entornos
    }
  }

  console.log('[RESET] Base de datos vaciada.');
}

async function sembrarProduccion(dataSource: DataSource) {
  console.log('[RESET] Insertando roles del sistema...');
  const roleRepo = dataSource.getRepository(Role);
  const roles = await roleRepo.save([
    { nombre: 'superusuario', descripcion: 'Dueño del sistema. Acceso total.' },
    { nombre: 'admin', descripcion: 'Administrador general del evento y gestión de usuarios.' },
    { nombre: 'controladorhcu', descripcion: 'Control de asistencia y disciplina.' },
    { nombre: 'delegado', descripcion: 'Delegado de fraternidad.' },
    { nombre: 'jurado', descripcion: 'Jurado calificador del evento.' },
  ]);

  const rolSuper = roles.find((r) => r.nombre === 'superusuario');
  if (!rolSuper) throw new Error('No se pudo crear el rol superusuario.');

  console.log('[RESET] Creando SuperUsuario de producción...');
  const usuarioRepo = dataSource.getRepository('usuarios');
  const passwordHash = await bcrypt.hash(SUPERUSUARIO.ci, 10);

  await usuarioRepo.save({
    ci: SUPERUSUARIO.ci,
    nombres: SUPERUSUARIO.nombres,
    primerApellido: SUPERUSUARIO.primerApellido,
    segundoApellido: SUPERUSUARIO.segundoApellido,
    correo: SUPERUSUARIO.correo,
    password: passwordHash,
    rol: rolSuper,
    primerLogin: true,
  });

  console.log('');
  console.log('══════════════════════════════════════════════════');
  console.log('  SISTEMA LISTO PARA PRODUCCIÓN (vacío)');
  console.log('══════════════════════════════════════════════════');
  console.log(`  SuperUsuario: ${SUPERUSUARIO.nombres} ${SUPERUSUARIO.primerApellido} ${SUPERUSUARIO.segundoApellido}`);
  console.log(`  CI / Contraseña inicial: ${SUPERUSUARIO.ci}`);
  console.log(`  Correo: ${SUPERUSUARIO.correo}`);
  console.log('  (Deberá cambiar la contraseña en el primer inicio de sesión)');
  console.log('══════════════════════════════════════════════════');
  console.log('');
}

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const dataSource = app.get(DataSource);

  try {
    limpiarArchivosSubidos();
    await limpiarBaseDeDatos(dataSource);
    await sembrarProduccion(dataSource);
    console.log('[RESET] Proceso completado exitosamente.');
  } catch (error) {
    console.error('[RESET] Error durante el reset:', error);
    process.exitCode = 1;
  } finally {
    await app.close();
  }
}

bootstrap();
