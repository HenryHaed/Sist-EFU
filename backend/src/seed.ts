import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { Role } from './entities/Role';
import { Usuario } from './entities/Usuario';
import { Facultad } from './entities/Facultad';
import { Carrera } from './entities/Carrera';
import { Categoria } from './entities/Categoria';
import { InstitucionExterna } from './entities/InstitucionExterna';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  // Obtenemos la conexión DataSource de TypeORM directamente de NestJS
  const dataSource = app.get(DataSource);

  console.log('[SEED] Iniciando la siembra de datos...');

  // --- 1. LÓGICA DE BORRADO DE DATOS (LIMPIEZA) ---
  console.log('[SEED] Limpiando base de datos antes de insertar datos nuevos...');
  // Orden importante para evitar contraints de foreign key
  await dataSource.query('DELETE FROM asistencias');
  await dataSource.query('DELETE FROM incidencias');
  await dataSource.query('DELETE FROM evaluaciones');
  await dataSource.query('DELETE FROM fraternidades');
  await dataSource.query('DELETE FROM carreras');
  await dataSource.query('DELETE FROM facultades');
  await dataSource.query('DELETE FROM categorias');
  await dataSource.query('DELETE FROM instituciones_externas');
  await dataSource.query('DELETE FROM jurados');
  await dataSource.query('DELETE FROM criterios');
  await dataSource.query('DELETE FROM fases');
  await dataSource.query('DELETE FROM infracciones');
  await dataSource.query('DELETE FROM usuarios');
  await dataSource.query('DELETE FROM roles');
  await dataSource.query('DELETE FROM gestiones');
  
  // Reiniciar secuencias truncadas para IDs limpios (PostgreSQL especifico)
  await dataSource.query('ALTER SEQUENCE roles_id_rol_seq RESTART WITH 1');
  await dataSource.query('ALTER SEQUENCE gestiones_id_gestion_seq RESTART WITH 1');
  await dataSource.query('ALTER SEQUENCE usuarios_id_usuario_seq RESTART WITH 1');
  await dataSource.query('ALTER SEQUENCE facultades_id_facultad_seq RESTART WITH 1');
  await dataSource.query('ALTER SEQUENCE carreras_id_carrera_seq RESTART WITH 1');
  await dataSource.query('ALTER SEQUENCE categorias_id_categoria_seq RESTART WITH 1');
  await dataSource.query('ALTER SEQUENCE instituciones_externas_id_institucion_seq RESTART WITH 1');


  // --- 2. GESTIONES ---
  console.log('[SEED] Insertando Gestiones...');
  const gestionRepo = dataSource.getRepository('gestiones');
  await gestionRepo.save([
    { anio: 2024, activa: false, modoMantenimiento: false },
    { anio: 2026, activa: true, modoMantenimiento: true } // El "Switch" principal
  ]);

  // --- 3. ROLES ---
  console.log('[SEED] Insertando Roles...');
  const roleRepo = dataSource.getRepository('roles'); // Usamos string para evitar problemas de metadata
  const roles: any[] = await roleRepo.save([
    { nombre: 'superusuario', descripcion: 'Duenio del sistema. Acceso total.' },
    { nombre: 'admin', descripcion: 'Administrador general del evento y gestion de usuarios.' },
    { nombre: 'controladorhcu', descripcion: 'Control de asistencia y disciplina.' },
    { nombre: 'delegado', descripcion: 'Delegado de fraternidad. Ayuda al control de disciplina.' },
    { nombre: 'jurado', descripcion: 'Jurado calificador del evento' }
  ]);

  // --- USUARIOS DE PRUEBA (uno por cada rol) ---
  console.log('[SEED] Insertando Usuarios de Prueba...');
  const usuarioRepo = dataSource.getRepository('usuarios');
  const SALT_ROUNDS = 10;

  // Mapeamos nombre de rol => objeto Role para asignarlo directamente
  const rolMap: Record<string, Role> = {};
  for (const r of roles) {
    rolMap[r.nombre] = r;
  }

  const PASSWORD_HASH = await bcrypt.hash('password123', SALT_ROUNDS);

  const usuariosData = [
    {
      ci: '1000000',
      nombres: 'Carlos Alberto',
      primerApellido: 'Quispe',
      segundoApellido: 'Mamani',
      password: PASSWORD_HASH,
      rol: rolMap['superusuario'],
    },
    {
      ci: '2000000',
      nombres: 'Maria Elena',
      primerApellido: 'Flores',
      segundoApellido: 'Choque',
      password: PASSWORD_HASH,
      rol: rolMap['admin'],
    },
    {
      ci: '3000000',
      nombres: 'Roberto',
      primerApellido: 'Condori',
      segundoApellido: 'Lima',
      password: PASSWORD_HASH,
      rol: rolMap['controladorhcu'],
    },
    {
      ci: '4000000',
      nombres: 'Ana Lucia',
      primerApellido: 'Huanca',
      segundoApellido: 'Vargas',
      password: PASSWORD_HASH,
      rol: rolMap['delegado'],
    },
    {
      ci: '5000000',
      nombres: 'Jorge Luis',
      primerApellido: 'Apaza',
      segundoApellido: 'Ramos',
      password: PASSWORD_HASH,
      rol: rolMap['jurado'],
    },
  ];

  await usuarioRepo.save(usuariosData);

  console.log('[SEED] Usuarios de prueba insertados (password: password123):');
  console.log('  superusuario -> CI: 1000000');
  console.log('  admin        -> CI: 2000000');
  console.log('  controlador  -> CI: 3000000');
  console.log('  delegado     -> CI: 4000000');
  console.log('  jurado       -> CI: 5000000');

  // --- 4. CATEGORÍAS ---
  console.log('[SEED] Insertando Categorias...');
  const categoriaRepo = dataSource.getRepository('categorias');
  await categoriaRepo.save([
    { 
      nombre: 'CATEGORÍA A', 
      descripcion: 'Danzas tradicionales o criollo mestizas que han tenido origen en la ciudad y se las interpreta con bandas que tienen instrumentos de metal.' 
    },
    { 
      nombre: 'CATEGORÍA B', 
      descripcion: 'Danzas autóctonas de origen rural que en la actualidad se bailan con el acompañamiento de bandas que tienen instrumentos de metal.' 
    },
    { 
      nombre: 'CATEGORÍA C', 
      descripcion: 'Danzas autóctonas de origen rural, que se interpretan con instrumentos nativos' 
    },
  ]);

  // --- 5. LÓGICA DE FRATERNIDADES (Facultades, Carreras, Instituciones) ---
  console.log('[SEED] Insertando Facultades y Carreras (UMSA)...');
  const facultadRepo = dataSource.getRepository('facultades');
  const carreraRepo = dataSource.getRepository('carreras');
  
  const fMedicina = await facultadRepo.save({ nombre: 'Facultad de Medicina', sigla: 'FMED' });
  const fIngenieria = await facultadRepo.save({ nombre: 'Facultad de Ingeniería', sigla: 'FING' });
  
  await carreraRepo.save([
    { nombre: 'Medicina', facultad: fMedicina },
    { nombre: 'Ingeniería Civil', facultad: fIngenieria },
  ]);

  console.log('[SEED] Insertando Instituciones Externas...');
  const institucionRepo = dataSource.getRepository('instituciones_externas');
  await institucionRepo.save([
    { nombre: 'UPEA', tipoInstitucion: 'Universidad Invitada' },
    { nombre: 'Ministerio de Culturas', tipoInstitucion: 'Gubernamental' }
  ]);

  // --- 6. FASES E INFRACCIONES MUESTRA ---
  console.log('[SEED] Insertando Fases e Infracciones...');
  const faseRepo = dataSource.getRepository('fases');
  const faseEntrada = await faseRepo.save({ nombre: 'Entrada Universitaria', pesoPorcentaje: 80, gestion: { idGestion: 2 } });
  const faseMonografia = await faseRepo.save({ nombre: 'Monografía', pesoPorcentaje: 20, gestion: { idGestion: 2 } });
  
  const criterioRepo = dataSource.getRepository('criterios');
  await criterioRepo.save({ nombre: 'Coreografía', puntajeMaximo: 40, fase: faseEntrada });
  await criterioRepo.save({ nombre: 'Vestimenta', puntajeMaximo: 40, fase: faseEntrada });
  
  const infraccionRepo = dataSource.getRepository('infracciones');
  await infraccionRepo.save({ nombre: 'Uso de Pirotecnia', tipoImpacto: 'RESTA_PUNTOS', valorImpacto: 5, gestion: { idGestion: 2 } });

  console.log('[SEED] Proceso finalizado exitosamente.');
  
  // Cerramos la conexión para que el script termine
  await app.close();
}

bootstrap();
