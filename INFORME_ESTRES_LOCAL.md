# Informe de pruebas de estrés — EFU (local)

**Fecha:** 30 julio 2026  
**Entorno:** solo `http://localhost:3000` (backend NestJS + PostgreSQL local)  
**Herramienta:** Artillery (instalada temporalmente y **eliminada** al finalizar)  
**Alcance:** endpoints **públicos de lectura** (GET). Sin DELETE/PUT/POST masivos → **no se modificó ni borró data de negocio**.

---

## ¿Se rompió el proyecto?

**No.**  

- No se alteró el código de `backend/` ni `frontend/` para estas pruebas.  
- Se usó una carpeta temporal `_tmp_stress/` (Artillery + YAML) que se **borró completa** al terminar.  
- Solo queda este informe.  
- Tras el estrés, la API local seguía respondiendo `200` en los endpoints probados.

---

## Limitación

El login del seed (`CI 12512405` / misma clave) devolvió **401** en este entorno (contraseña ya cambiada). Por eso **no** se estresaron rutas autenticadas (fraternidades JWT, monografías, reportes admin). Eso evita además llenar `sesiones_usuario` / `auditoria_acciones` con fallos de login.

Endpoints usados:

- `GET /api/v1/evaluaciones/gestion-activa`
- `GET /api/v1/evaluaciones/estadisticas`
- `GET /api/v1/evaluaciones/gestiones-publicas`
- `GET /api/v1/evaluaciones/documentos-gestion`
- `GET /api/v1/evaluaciones/reporte/1`

---

## Criterios (plan)

| Criterio | Objetivo | Resultado |
|----------|----------|-----------|
| Errores HTTP | &lt; 1% | **0%** en los 3 escenarios |
| p95 (load) | &lt; 800 ms | **~8 ms** |
| p95 (stress) | reportar punto de quiebre | **~10 ms** (sin quiebre) |

---

## Resultados

### 1) Smoke (~30 s, 5 usuarios/s)

| Métrica | Valor |
|---------|-------|
| Requests | 600 |
| HTTP 200 | 600 |
| Fallos VU | 0 |
| RPS medio | 20/s |
| Latencia media | 3.8 ms |
| p95 | 8.9 ms |
| p99 | 12.1 ms |
| **Veredicto** | **PASS** |

### 2) Load (~1 min 41 s, rampa 10→30 usuarios/s)

| Métrica | Valor |
|---------|-------|
| Requests | 5 127 |
| HTTP 200 | 5 127 |
| Fallos VU | 0 |
| RPS medio | 54/s |
| Latencia media | 3.6 ms |
| p95 | 7.9 ms |
| p99 | 12.1 ms |
| **Veredicto** | **PASS** |

### 3) Stress (~2 min 17 s, rampa hasta ~80 usuarios/s)

| Métrica | Valor |
|---------|-------|
| Requests | 25 800 |
| HTTP 200 | 25 800 |
| Fallos VU | 0 |
| RPS medio | **192/s** (picos ~260–314/s en ventanas) |
| Latencia media | 4.4 ms |
| p95 | 10.1 ms |
| p99 | 13.1 ms |
| max observado | 191 ms |
| **Veredicto** | **PASS** — no se alcanzó punto de quiebre en este nivel |

---

## Conclusión

En local, el backend **soportó bien** carga y estrés de lectura pública (~26k requests en el escenario más fuerte) con latencias muy bajas y **cero errores**.

Esto **no garantiza** el mismo comportamiento en producción (CPU/RAM del servidor, pool de PostgreSQL, latencia de red, HTTPS, concurrencia de logins/jurados, PDFs, uploads). Sí indica que, para el patrón típico del landing/estadísticas, la API local es estable bajo cientos de requests por segundo de solo lectura.

### Cómo repetir en el futuro (sin dejar basura)

1. Tener backend en `localhost:3000`.  
2. Crear carpeta temporal, `npm i artillery`, correr escenarios GET.  
3. Borrar la carpeta temporal.  
4. Actualizar este informe.

### Siguiente paso opcional

Si se quiere estresar rutas autenticadas: usar un usuario de prueba local conocido y escenarios GET con JWT (sin mutaciones), o un usuario dedicado solo para load test.
