# 🚀 Entrada Universitaria - API (Backend)

API NestJS + TypeORM + PostgreSQL para la **Entrada Universitaria UMSA**.

## Requisitos

- Node.js 18+
- PostgreSQL

## Configuración (`.env`)

El backend usa la **convención estándar de Node/NestJS** para cargar variables:

```
.env.{NODE_ENV}.local  →  .env.{NODE_ENV}  →  .env.local  →  .env
```

### Desarrollo

```bash
cd backend
npm install
cp .env.example .env
# Editar DB_PASSWORD, JWT_SECRET, etc.
```

### Producción (administrador del servidor)

```bash
cp .env.production.example .env.production
# o bien: cp .env.production.example .env
```

Editar **todos** los valores marcados como `cambiar` / `GENERAR` antes de arrancar.

| Variable | Desarrollo | Producción |
|----------|------------|------------|
| `NODE_ENV` | `development` | `production` |
| `TYPEORM_SYNCHRONIZE` | `true` | **`false`** |
| `SWAGGER_ENABLED` | `true` | `false` (recomendado) |
| `CORS_ORIGINS` | `http://localhost:5173` | dominio HTTPS del frontend |
| `FRONTEND_URL` | `http://localhost:5173` | `https://tu-dominio.bo` |
| `JWT_SECRET` | cualquiera en local | **generar** (`openssl rand -base64 64`) |

Plantillas: `.env.example` · `.env.production.example`

## Ejecución

```bash
# Desarrollo (recarga automática)
npm run start:dev

# Producción
npm run build
NODE_ENV=production npm run start:prod
```

Por defecto escucha en `PORT=3000`. API: `/api/v1` · Swagger (si habilitado): `/api`

## Semilla de datos

```bash
npm run seed
```

Solo en **base de datos vacía** (desarrollo o primer despliegue). **No ejecutar** en producción con datos reales.

## Estructura `src/`

- `auth/` — JWT y sesiones
- `entities/` — modelos TypeORM
- `inscripciones/`, `evaluaciones/`, `fraternidades/` — módulos de negocio
- `main.ts` — puerto, CORS, Swagger
- `app.module.ts` — base de datos y configuración global

## Seguridad

- No commitear `backend/.env` ni `backend/.env.production`
- Contraseñas de BD y `JWT_SECRET` únicos por entorno
- En producción: `TYPEORM_SYNCHRONIZE=false` y migraciones controladas
