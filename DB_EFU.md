# Diccionario de Datos - Sistema EFU (Entrada Folklórica Universitaria)

Este documento detalla la estructura de la base de datos basada en las entidades de TypeORM definidas en el backend.

---

## 1. Seguridad y Usuarios

### `usuarios`
Almacena la información de acceso y perfil de todos los usuarios del sistema (Administradores, Jurados, Delegados, etc.).

| Atributo | Tipo (DB) | Descripción |
| :--- | :--- | :--- |
| `id_usuario` | PK (Serial) | Identificador único del usuario. |
| `id_rol` | FK | Relación con la tabla `roles`. |
| `ci` | Varchar(20) | Cédula de Identidad (único, usado para login). |
| `nombres` | Varchar(150) | Nombres del usuario. |
| `primer_apellido` | Varchar(100) | Primer apellido. |
| `segundo_apellido`| Varchar(100) | Segundo apellido (opcional). |
| `password` | Varchar(255) | Contraseña encriptada. |
| `id_fraternidad` | FK | Fraternidad asociada (principalmente para Delegados). |
| `primer_login` | Boolean | Indica si el usuario debe cambiar su contraseña inicial. |
| `created_at` | Timestamp | Fecha de creación del registro. |
| `updated_at` | Timestamp | Fecha de última actualización. |

### `roles`
Define los niveles de acceso al sistema.

| Atributo | Tipo (DB) | Descripción |
| :--- | :--- | :--- |
| `id_rol` | PK (Serial) | Identificador único del rol. |
| `nombre` | Varchar(100) | Nombre del rol (Ej: ADMIN, JURADO, DELEGADO). |
| `descripcion` | Text | Descripción de las responsabilidades del rol. |

---

## 2. Estructura Organizativa

### `facultades`
Lista de facultades pertenecientes a la UMSA.

| Atributo | Tipo (DB) | Descripción |
| :--- | :--- | :--- |
| `id_facultad` | PK (Serial) | Identificador único. |
| `nombre` | Varchar(255) | Nombre completo de la facultad. |
| `sigla` | Varchar(20) | Sigla de la facultad (Ej: FCPN). |

### `carreras`
Carreras académicas asociadas a una facultad.

| Atributo | Tipo (DB) | Descripción |
| :--- | :--- | :--- |
| `id_carrera` | PK (Serial) | Identificador único. |
| `id_facultad` | FK | Facultad a la que pertenece. |
| `nombre` | Varchar(255) | Nombre de la carrera. |

### `instituciones_externas`
Instituciones invitadas o externas a la UMSA.

| Atributo | Tipo (DB) | Descripción |
| :--- | :--- | :--- |
| `id_institucion` | PK (Serial) | Identificador único. |
| `nombre` | Varchar(255) | Nombre de la institución. |
| `sigla` | Varchar(20) | Sigla descriptiva. |
| `tipo_institucion`| Varchar(100) | Categorización (Ej: Policial, Militar, Convenio). |

### `categorias`
Categorías de danzas según el reglamento.

| Atributo | Tipo (DB) | Descripción |
| :--- | :--- | :--- |
| `id_categoria` | PK (Serial) | Identificador único. |
| `nombre` | Varchar(50) | Nombre de la categoría (Ej: Liviana, Pesada). |
| `descripcion` | Text | Detalles técnicos de la categoría. |

---

## 3. Evento y Configuración

### `gestiones`
Configuración global anual del evento.

| Atributo | Tipo (DB) | Descripción |
| :--- | :--- | :--- |
| `id_gestion` | PK (Serial) | Identificador único. |
| `anio` | Integer | Año de la gestión (único). |
| `lema` | Text | Eslogan o lema anual. |
| `activa` | Boolean | Define si es la gestión vigente para operaciones. |
| `nombre_sitio` | Varchar(255) | Nombre visual del sistema. |
| `url_banner` | Varchar(500) | Imagen de cabecera. |
| `url_reglamento` | Varchar(500) | Link al PDF del reglamento vigente. |
| `modo_mantenimiento`| Boolean | Bloquea el acceso al sistema. |

### `fases`
Etapas de evaluación de una gestión (Ej: Monografía, Pre-entrada, Entrada).

| Atributo | Tipo (DB) | Descripción |
| :--- | :--- | :--- |
| `id_fase` | PK (Serial) | Identificador único. |
| `id_gestion` | FK | Gestión a la que pertenece. |
| `nombre` | Varchar(255) | Nombre de la etapa. |
| `peso_porcentaje` | Decimal(5,2) | Ponderación sobre la nota final (0-100). |
| `tipo_concurso` | Varchar(50) | Clasificación (EFU o EXTERNO). |
| `esta_activa` | Boolean | Indica si la fase está abierta para calificación. |
| `url_imagen` | Varchar(500) | Imagen representativa para el asistente. |

### `criterios`
Puntos específicos a calificar dentro de una fase.

| Atributo | Tipo (DB) | Descripción |
| :--- | :--- | :--- |
| `id_criterio` | PK (Serial) | Identificador único. |
| `id_fase` | FK | Fase asociada. |
| `nombre` | Varchar(255) | Nombre del criterio (Ej: Vestimenta, Coreografía). |
| `puntaje_maximo` | Decimal(5,2) | Nota máxima posible. |
| `url_imagen` | Varchar(500) | Imagen de referencia visual. |

---

## 4. Fraternidades y Participantes

### `fraternidades`
Registro central de todas las agrupaciones folklóricas.

| Atributo | Tipo (DB) | Descripción |
| :--- | :--- | :--- |
| `id_fraternidad` | PK (Serial) | Identificador único. |
| `nombre` | Varchar(255) | Nombre oficial. |
| `origen_fraternidad`| Varchar(50) | Origen (Interna UMSA / Externa). |
| `id_facultad` | FK (Opcional) | Facultad asociada. |
| `id_carrera` | FK (Opcional) | Carrera asociada. |
| `id_categoria` | FK | Categoría de danza. |
| `habilitado_efu` | Boolean | Indica si compite en la EFU principal. |
| `logo_url` | Text | URL del escudo/logo. |
| `promedio_base` | Decimal(5,2) | Puntos previos o base. |

### `participantes_concurso`
Personas individuales que compiten en categorías especiales (Ej: Mejor Pareja).

| Atributo | Tipo (DB) | Descripción |
| :--- | :--- | :--- |
| `id_participante` | PK (Serial) | Identificador único. |
| `nombre` | Varchar(255) | Nombre completo del participante. |
| `tipo` | Varchar(100) | Rol (Chacha, Warmi, Fotógrafo, etc.). |
| `id_fraternidad` | FK | Fraternidad a la que representa. |
| `id_fase` | FK | Fase/Concurso donde participa. |

---

## 5. Evaluación y Jurados

### `jurados`
Extensión de la tabla usuarios para el rol de calificador.

| Atributo | Tipo (DB) | Descripción |
| :--- | :--- | :--- |
| `id_jurado` | PK (Serial) | Identificador único. |
| `id_usuario` | FK | Usuario asociado. |
| `id_gestion` | FK | Gestión donde participa. |
| `tipo_jurado` | Varchar(20) | EFU o EXTERNO. |
| `id_carrera` | FK (Opcional) | Especialidad académica del jurado. |
| `institucion_externa`| Varchar(255) | Institución si es jurado invitado. |

### `evaluaciones`
Registro de las notas emitidas.

| Atributo | Tipo (DB) | Descripción |
| :--- | :--- | :--- |
| `id_evaluacion` | PK (Serial) | Identificador único. |
| `id_jurado` | FK | Calificador. |
| `id_fraternidad` | FK (Opcional) | Fraternidad evaluada. |
| `id_participante` | FK (Opcional) | Participante evaluado. |
| `id_fase` | FK | Fase evaluada. |
| `estado` | Enum | PENDIENTE, EN_PROGRESO, COMPLETADO. |
| `criterios_evaluados`| JSONB | Detalle de notas por `id_criterio`. |
| `puntaje_total` | Decimal(5,2) | Sumatoria final de la evaluación. |
| `fecha_cierre` | Timestamp | Fecha en que se selló el acta. |

---

## 6. Control y Disciplina

### `asistencias`
Control de puntualidad y presencia en eventos de control.

| Atributo | Tipo (DB) | Descripción |
| :--- | :--- | :--- |
| `id_asistencia` | PK (Serial) | Identificador único. |
| `id_fraternidad` | FK | Fraternidad controlada. |
| `id_evento` | FK | Evento de control asociado. |
| `asistio` | Boolean | Estado de presencia. |

### `incidencias`
Reportes de faltas o infracciones durante el recorrido.

| Atributo | Tipo (DB) | Descripción |
| :--- | :--- | :--- |
| `id_incidencia` | PK (Serial) | Identificador único. |
| `id_fraternidad` | FK | Fraternidad infractora. |
| `id_usuario` | FK | Usuario que reporta (Controlador HCU). |
| `id_infraccion` | FK | Tipo de falta cometida. |
| `observacion` | Text | Detalles del incidente. |

### `infracciones`
Catálogo de faltas tipificadas y su impacto.

| Atributo | Tipo (DB) | Descripción |
| :--- | :--- | :--- |
| `id_infraccion` | PK (Serial) | Identificador único. |
| `nombre` | Varchar(255) | Nombre de la falta (Ej: Consumo de Alcohol). |
| `valor_impacto` | Decimal(5,2) | Puntos a descontar o penalizar. |
