# Entrada Universitaria - Diccionario de Base de Datos EFU

Este documento detalla la estructura actual de la base de datos para el sistema EFU.

## CONSIDERACIONES GENERALES
- Se ha normalizado la base de datos.
- **Entidades Globales:** `facultades`, `carreras` e `instituciones_externas` ahora son globales. No dependen de la gestión anual porque se asume que su existencia perdura a lo largo de los años.
- **Entidades por Gestión:** Todo lo relacionado a reglas y participaciones (`fases`, `criterios`, `categorias`, `infracciones`, `fraternidades`) se asocia directamente a una `gestion`.

---

## 1. MÓDULO ORGANIZACIONAL (GLOBALES)

### `facultades`
Facultades de la universidad. Es global y no depende de la gestión.

| Atributo | Tipo (DB) | Descripción |
| :--- | :--- | :--- |
| `id_facultad` | PK (Serial) | Identificador único |
| `nombre` | Varchar(255) | Nombre de la facultad |
| `sigla` | Varchar(20) | Sigla de la facultad |
| `created_at` | Timestamp | Fecha de creación |
| `updated_at` | Timestamp | Fecha de actualización |

### `carreras`
Carreras pertenecientes a las facultades. Es global y no depende de la gestión.

| Atributo | Tipo (DB) | Descripción |
| :--- | :--- | :--- |
| `id_carrera` | PK (Serial) | Identificador único |
| `id_facultad`| FK | Facultad a la que pertenece |
| `nombre` | Varchar(255) | Nombre de la carrera |

### `instituciones_externas`
Entidades no universitarias (ej. Invitados, Auspiciadores) que participan o patrocinan.

| Atributo | Tipo (DB) | Descripción |
| :--- | :--- | :--- |
| `id_institucion`| PK (Serial) | Identificador único. |
| `nombre` | Varchar(255) | Nombre de la institución. |
| `sigla` | Varchar(20) | Sigla opcional. |
| `tipo_institucion`| Varchar(100)| Tipo de entidad externa. |

---

## 2. MÓDULO DE GESTIÓN (AÑO DEL EVENTO)

### `gestiones`
Configuración principal de cada año que rige el evento.

| Atributo | Tipo (DB) | Descripción |
| :--- | :--- | :--- |
| `id_gestion` | PK (Serial) | Identificador único. |
| `anio` | Integer | Año (Ej: 2024). Único. |
| `lema` | Text | Eslogan del año. |
| `activa` | Boolean | Indica si es la gestión en curso. |

---

## 3. MÓDULO FRATERNIDADES (DEPENDIENTE DE GESTIÓN)

### `categorias`
Categorías de concurso (Ej: Danzas Pesadas, Danzas Livianas, etc.).

| Atributo | Tipo (DB) | Descripción |
| :--- | :--- | :--- |
| `id_categoria` | PK (Serial) | Identificador único |
| `id_gestion` | FK | Gestión a la que pertenece |
| `nombre` | Varchar(255) | Nombre de la categoría |

### `fraternidades`
Es la participación "instanciada" de un grupo folclórico durante un año (Gestión) en específico.

| Atributo | Tipo (DB) | Descripción |
| :--- | :--- | :--- |
| `id_fraternidad` | PK (Serial) | Identificador único |
| `id_gestion` | FK | La gestión (año) donde participa |
| `id_facultad` | FK | (Global) Facultad de procedencia |
| `id_carrera` | FK | (Global) Carrera de procedencia |
| `id_institucion` | FK | (Global) Institución de procedencia (Si aplica) |
| `id_categoria` | FK | (Gestión) Categoría de baile a la que pertenece |
| `nombre` | Varchar(255) | Nombre de la fraternidad |
| `origen_fraternidad`| Varchar(50) | Origen (UMSA, Invitada) |
| `promedio_base`| Decimal(5,2)| Puntaje promedio asignado tras evaluaciones |
| `habilitado_efu`| Boolean | Está formalmente inscrita |

---

## 4. MÓDULO DE EVALUACIONES

### `fases`
Fases o bloques del concurso durante el año.

| Atributo | Tipo (DB) | Descripción |
| :--- | :--- | :--- |
| `id_fase` | PK (Serial) | Identificador único |
| `id_gestion` | FK | Gestión respectiva |
| `nombre` | Varchar(255) | (Ej. Monografía, Entrada) |
| `peso_porcentaje`| Decimal | Peso ponderado en la nota total de la gestión |

### `criterios`
Puntos específicos a calificar dentro de una fase.

| Atributo | Tipo (DB) | Descripción |
| :--- | :--- | :--- |
| `id_criterio` | PK (Serial) | Identificador único |
| `id_fase` | FK | Fase asociada |
| `id_gestion` | FK | Gestión a la que aplican |
| `nombre` | Varchar(255) | (Ej: Vestimenta, Coreografía) |
| `puntaje_maximo`| Decimal(5,2)| Nota máxima por criterio |

---

## 5. MÓDULO USUARIOS Y ROLES (GLOBAL)
* `usuarios`: Todos los usuarios del sistema (Jurados, Delegados, Admin).
* `roles`: Permisos (ADMIN, JURADO, DELEGADO).

## 6. MÓDULO PARTICIPANTES (JURADOS Y DELEGADOS)
* `participantes`: Competidores principales vinculados a actas.
* `jurados`: Asignados a la gestión (con `id_gestion`).

## 7. MÓDULO INCIDENCIAS E INFRACCIONES
* `infracciones`: Reglas de descuentos de puntos asociadas a la gestión.
* `incidencias`: Sucesos registrados contra fraternidades que incurren en una _infracción_.

## 8. MÓDULO ASISTENCIAS Y COMUNICADOS
* `eventos_control`: Avisos de asambleas, reuniones de ese año.
* `asistencias`: Registro de asistencia a dichos eventos.