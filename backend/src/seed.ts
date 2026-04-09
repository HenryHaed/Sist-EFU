import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { Role } from './entities/Role';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  // Obtenemos la conexión DataSource de TypeORM directamente de NestJS
  const dataSource = app.get(DataSource);

  console.log('[SEED] Iniciando la siembra de datos...');

  // --- 1. LÓGICA DE BORRADO DE DATOS (LIMPIEZA) ---
  console.log('[SEED] Limpiando base de datos antes de insertar datos nuevos...');
  // Orden importante para evitar contraints de foreign key
  await dataSource.query('DELETE FROM asistencias');
  await dataSource.query('DELETE FROM eventos_control');
  await dataSource.query('DELETE FROM incidencias');
  await dataSource.query('DELETE FROM evaluaciones');
  await dataSource.query('DELETE FROM documentos_fraternidad');
  await dataSource.query('DELETE FROM jurado_fases');
  await dataSource.query('DELETE FROM criterios');
  await dataSource.query('DELETE FROM fases');
  await dataSource.query('DELETE FROM infracciones');
  await dataSource.query('DELETE FROM jurados');
  await dataSource.query('DELETE FROM usuarios');
  await dataSource.query('DELETE FROM roles');
  await dataSource.query('DELETE FROM fraternidades');
  await dataSource.query('DELETE FROM carreras');
  await dataSource.query('DELETE FROM facultades');
  await dataSource.query('DELETE FROM categorias');
  await dataSource.query('DELETE FROM instituciones_externas');
  await dataSource.query('DELETE FROM gestiones');
  
  // Reiniciar secuencias truncadas para IDs limpios (PostgreSQL especifico)
  await dataSource.query('ALTER SEQUENCE roles_id_rol_seq RESTART WITH 1');
  await dataSource.query('ALTER SEQUENCE gestiones_id_gestion_seq RESTART WITH 1');
  await dataSource.query('ALTER SEQUENCE usuarios_id_usuario_seq RESTART WITH 1');
  await dataSource.query('ALTER SEQUENCE facultades_id_facultad_seq RESTART WITH 1');
  await dataSource.query('ALTER SEQUENCE carreras_id_carrera_seq RESTART WITH 1');
  await dataSource.query('ALTER SEQUENCE categorias_id_categoria_seq RESTART WITH 1');
  await dataSource.query('ALTER SEQUENCE instituciones_externas_id_institucion_seq RESTART WITH 1');
  await dataSource.query('ALTER SEQUENCE fraternidades_id_fraternidad_seq RESTART WITH 1');
  await dataSource.query('ALTER SEQUENCE fases_id_fase_seq RESTART WITH 1');
  await dataSource.query('ALTER SEQUENCE jurados_id_jurado_seq RESTART WITH 1');
  await dataSource.query('ALTER SEQUENCE eventos_control_id_evento_seq RESTART WITH 1');


  // --- 2. GESTIONES ---
  console.log('[SEED] Insertando Gestiones...');
  const gestionRepo = dataSource.getRepository('gestiones');
  await gestionRepo.save([
    { anio: 2024, activa: false, modoMantenimiento: false },
  ]);
  const g2026 = await gestionRepo.save({ anio: 2026, activa: true, modoMantenimiento: true });

  // --- 3. ROLES ---
  console.log('[SEED] Insertando Roles...');
  const roleRepo = dataSource.getRepository('roles');
  const roles: any[] = await roleRepo.save([
    { nombre: 'superusuario', descripcion: 'Duenio del sistema. Acceso total.' },
    { nombre: 'admin', descripcion: 'Administrador general del evento y gestion de usuarios.' },
    { nombre: 'controladorhcu', descripcion: 'Control de asistencia y disciplina.' },
    { nombre: 'delegado', descripcion: 'Delegado de fraternidad. Ayuda al control de disciplina.' },
    { nombre: 'jurado', descripcion: 'Jurado calificador del evento' }
  ]);

  const rolMap: Record<string, Role> = {};
  for (const r of roles) {
    rolMap[r.nombre] = r;
  }

  // --- 4. CATEGORÍAS, FACULTADES Y CARRERAS ---
  console.log('[SEED] Insertando Categorias, Facultades y Carreras...');
  const categoriaRepo = dataSource.getRepository('categorias');
  const catA = await categoriaRepo.save({ 
    nombre: 'CATEGORÍA A', 
    descripcion: 'Danzas con bandas e instrumentos de metal.' 
  });
  await categoriaRepo.save({ nombre: 'CATEGORÍA B', descripcion: 'Danzas autóctonas con banda.' });
  await categoriaRepo.save({ nombre: 'CATEGORÍA C', descripcion: 'Danzas autóctonas con instrumentos nativos.' });

  const facultadRepo = dataSource.getRepository('facultades');
  const carreraRepo = dataSource.getRepository('carreras');
  
  const fDerecho = await facultadRepo.save({ nombre: 'Facultad de Derecho', sigla: 'FDER' });
  const fMedicina = await facultadRepo.save({ nombre: 'Facultad de Medicina', sigla: 'FMED' });
  const fIngenieria = await facultadRepo.save({ nombre: 'Facultad de Ingeniería', sigla: 'FING' });
  
  const cDerecho = await carreraRepo.save({ nombre: 'Derecho', facultad: fDerecho });
  await carreraRepo.save([{ nombre: 'Medicina', facultad: fMedicina }, { nombre: 'Ingeniería Civil', facultad: fIngenieria }]);

  // --- 5. FRATERNIDAD DE PRUEBA ---
  console.log('[SEED] Insertando Fraternidad de Prueba...');
  const fraterRepo = dataSource.getRepository('fraternidades');
  const fraterDerecho = await fraterRepo.save({
    nombre: 'Morenada de Derecho',
    origenFraternidad: 'Carrera',
    facultad: fDerecho,
    carrera: cDerecho,
    categoria: catA,
    habilitadoEfu: true,
  });

  // --- 6. USUARIOS DE PRUEBA (Aplicando el Flujo "Contrasenia Inicial = CI") ---
  console.log('[SEED] Insertando Usuarios de Prueba (Contraseña inicial = CI)...');
  const usuarioRepo = dataSource.getRepository('usuarios');
  
  const hash = async (password: string) => bcrypt.hash(password, 10);

  const uSuper = await usuarioRepo.save({
    ci: '1000000', nombres: 'Carlos', primerApellido: 'Quispe',
    password: await hash('1000000'), rol: rolMap['superusuario'], primerLogin: true
  });
  
  const uAdmin = await usuarioRepo.save({
    ci: '2000000', nombres: 'Maria Elena', primerApellido: 'Flores',
    password: await hash('2000000'), rol: rolMap['admin'], primerLogin: true
  });
  
  const uControl = await usuarioRepo.save({
    ci: '3000000', nombres: 'Roberto', primerApellido: 'Condori',
    password: await hash('3000000'), rol: rolMap['controladorhcu'], primerLogin: true
  });

  // Delegado ESTA VINCULADO a una Fraternidad
  const uDelegado = await usuarioRepo.save({
    ci: '4000000', nombres: 'Ana Lucia', primerApellido: 'Huanca',
    password: await hash('4000000'), rol: rolMap['delegado'], 
    fraternidad: fraterDerecho, primerLogin: true
  });

  const uJurado = await usuarioRepo.save({
    ci: '5000000', nombres: 'Jorge Luis', primerApellido: 'Apaza',
    password: await hash('5000000'), rol: rolMap['jurado'], primerLogin: true
  });

  console.log('  superusuario -> CI/Pass: 1000000');
  console.log('  admin        -> CI/Pass: 2000000');
  console.log('  controlador  -> CI/Pass: 3000000');
  console.log('  delegado     -> CI/Pass: 4000000 (Morenada de Derecho)');
  console.log('  jurado       -> CI/Pass: 5000000 (Permitido evaluar Entrada y Monografía)');

  // --- 7. FASES EXCLUSIVAS (El Motor de Tiempos) ---
  console.log('[SEED] Insertando Fases con fechas de evaluación...');
  const faseRepo = dataSource.getRepository('fases');
  
  const dInicio = new Date();
  const dFin = new Date();
  dFin.setDate(dFin.getDate() + 14); // Tienen 2 semanas

  const faseMonografia = await faseRepo.save({ 
    nombre: 'Monografía', pesoPorcentaje: 20, gestion: g2026, 
    tipoConcurso: 'EFU', categoriaEfu: 'MONOGRAFIA',
    fechaInicio: dInicio, fechaFin: dFin, estaActiva: true 
  });
  const faseEntrada = await faseRepo.save({ 
    nombre: 'Entrada Universitaria', pesoPorcentaje: 80, gestion: g2026, 
    tipoConcurso: 'EFU', categoriaEfu: 'DANZA',
    fechaInicio: dInicio, fechaFin: dFin, estaActiva: true 
  });

  // --- 8. PERMISOS DE JURADO ---
  console.log('[SEED] Habilitando al Jurado en Fases Específicas...');
  const juradoRepo = dataSource.getRepository('jurados');
  await juradoRepo.save({
    usuario: uJurado,
    gestion: g2026,
    tipoOrigen: 'Docente',
    fasesHabilitadas: [faseMonografia, faseEntrada] // Este jurado califica ambas cosas
  });

  // --- 9. EVENTOS DE CONTROL E INFRACCIONES MUESTRA ---
  console.log('[SEED] Insertando Eventos Hito e Infracciones (Asistencia y Disciplina)...');
  const eventoRepo = dataSource.getRepository('eventos_control');
  await eventoRepo.save({
    nombre: 'Primera Reunión de Delegados EFU 2026',
    fechaHora: new Date(),
    puntosPenalizacion: 2 // Castigo matemático
  });
  
  const infraccionRepo = dataSource.getRepository('infracciones');
  await infraccionRepo.save({ nombre: 'Falta Injustificada a Reunión', tipoImpacto: 'RESTA_PUNTOS', valorImpacto: 2, gestion: g2026 });
  await infraccionRepo.save({ nombre: 'Uso de Pirotecnia', tipoImpacto: 'RESTA_PUNTOS', valorImpacto: 5, gestion: g2026 });

  console.log('[SEED] Proceso finalizado exitosamente.');
  
  // Cerramos la conexión para que el script termine
  await app.close();
}

bootstrap();
