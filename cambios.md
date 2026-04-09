# Registro de Cambios en la Base de Datos
**Fecha de Actualización:** 02 de Abril de 2026

A continuación, se detalla la **refactorización y normalización** completa del modelo de datos de la Entrada Universitaria en la base de datos (PostgreSQL vía TypeORM). Estos cambios permiten gestionar eficientemente módulos avanzados (control de asistencia penalizada, documentos de delegados y flujos de calificación inteligente).

---

## 🔹 Nuevas Entidades (Tablas)

### 1. `documentos_fraternidad` (DocumentoFraternidad.ts)
*   **Propósito**: Centraliza los archivos subidos al sistema por los delegados, reemplazando la dependencia de incrustar rutas dentro de las tablas directas.
*   **Campos Clave**:
    *   `id_documento`: PK
    *   `id_fraternidad`: Relación con la Fraternidad propietaria.
    *   `tipo_documento`: (String/Enum). Permite subir `MONOGRAFIA`, `LISTA_BAILARINES`, etc.
    *   `url_archivo`: La ruta del archivo en el servidor.
    *   `fecha_subida`: Timestamp de auditoría.

### 2. `eventos_control` (EventoControl.ts)
*   **Propósito**: Hitos o eventos que exigen asistencia obligatoria de delegados, con efecto en puntaje.
*   **Campos Clave**:
    *   `id_evento`: PK
    *   `nombre`: Nombre de la reunión / control (Ej. Apoyo Chacha Warmi).
    *   `fecha_hora`: Cuándo sucede el hito.
    *   `puntos_penalizacion`: (Decimal). Cuántos puntos perderá la fraternidad por inasistencia.

---

## 🔹 Entidades Refactorizadas (Tablas Existentes)

### 3. `evaluaciones` (Evaluacion.ts) *[Refactorización Crítica]*
*   **Cambio**: Se eliminó la relación de "Evaluación por Criterio" (una tabla inmensa si son muchos criterios) por una Tabla Centralizada de fase completa. 
*   **Campos Integrados**:
    *   `id_jurado`, `id_fraternidad`, `id_fase`: LLaves foráneas para contexto.
    *   `estado`: `PENDIENTE`, `EN_PROGRESO` o `COMPLETADO`.
    *   `criterios_evaluados (JSONB)`: Estructura mágica. Puede alojar cualquier combinación de puntajes sin crear columnas (`{"vestimenta": 15, "musica": 10}`).
    *   `puntaje_total`: Sumatoria central para reportes.
    *   `fecha_apertura` / `fecha_cierre`: Para control de cuánto tiempo le tomó al jurado calificar.

### 4. `fases` (Fase.ts)
*   **Cambio**: Convertido en el "Controlador de Tiempo" del sistema.
*   **Campos Integrados**:
    *   `fecha_inicio` y `fecha_fin`: Límites manuales designados por el admin. Fuera de ellas, el sistema bloquea acceso al Jurado.
    *   `esta_activa`: Switch manual para apagar la fase en vivo.

### 5. `jurados` (Jurado.ts) *[Asociación Muchos a Muchos]*
*   **Cambio**: Implementación de una tabla puente (`jurado_fases`) que se auto-genera para limitar los permisos.
*   **Efecto**: `fasesHabilitadas` ahora gobierna el dashboard del jurado. Si el jurado no existe en el vínculo con "Monografía", su interfaz bloqueará o esconderá el acceso.

### 6. `usuarios` (Usuario.ts)
*   **Cambio**: Vinculación directa con la fraternidad a la que sirve.
*   **Campo Añadido**: `id_fraternidad`. Permite a los Delegados identificarse fácilmente en el sistema (Subir PDF, listar notificaciones, etc.).
*   *(Nota: También se añadió `primerLogin` en ajustes de seguridad previos).*

### 7. `asistencias` (Asistencia.ts)
*   **Cambio**: La asistencia dejó de ser un simple estampillado de hora, convirtiéndose en un verdadero checklist.
*   **Campos Transformados**:
    *   `id_evento` reemplaza fechas al azar. Vincula directamente a la tabla **Hitos (`eventos_control`)**.
    *   `asistio`: Boolean explícito (Fue o No Fue).
    *   `observaciones`: Campo de texto en caso de altercados.

---

### ✅ Beneficios Finales
*   **No se requiere configuración extra**: Toda falta de asistencia puede insertarse en la tabla `Infracciones / Incidencias` existente.
*   **Flexibilidad infinita:** El diseño del sistema de evaluaciones (`Evaluacion.ts`) con `JSONB` elimina la necesidad de migrar la base de datos cada que cambie la convocatoria o existan tipos nuevos de concurso como el *Chacha Warmi*.
