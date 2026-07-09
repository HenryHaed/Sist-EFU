# 🎓 Sistema de Gestión - Entrada Universitaria UMSA

Sistema integral para la gestión, calificación y seguimiento de la **Entrada Universitaria de la UMSA**.

## 🏗️ Arquitectura

| Componente | Tecnología | Documentación |
|------------|------------|---------------|
| **Backend** | NestJS, TypeORM, PostgreSQL, JWT | [backend/README.md](./backend/README.md) |
| **Frontend** | Vue 3, Vite, Pinia, Vuetify | [frontend/README.md](./frontend/README.md) |

## 🚀 Desarrollo local

### Requisitos

- Node.js 18+
- PostgreSQL con base de datos `efu_db`

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env          # Editar credenciales locales
npm run start:dev
```

API: `http://localhost:3000/api/v1` · Swagger: `http://localhost:3000/api`

### 2. Frontend

```bash
cd frontend
npm install
npm run dev                   # Usa frontend/.env.development (localhost)
```

App: `http://localhost:5173`

### 3. Datos iniciales (solo primera vez)

```bash
cd backend
npm run seed
```

---

## 🌐 Producción

**Toda la configuración sensible va en archivos `.env` del servidor** (nunca en Git).

| Quién | Qué hace |
|-------|----------|
| **Desarrollador** | Sube el código; en el repo solo hay `.env.example` y `.env.production.example` |
| **Admin del servidor** | Crea `backend/.env` (o `.env.production`) y `frontend/.env.production` con dominios y secretos reales |

### Checklist rápido (servidor)

1. **PostgreSQL** — crear BD y usuario dedicado.
2. **Backend** — `cp backend/.env.production.example backend/.env` → editar → `npm ci` → `npm run build` → `npm run start:prod` (o PM2/systemd).
3. **Frontend** — `cp frontend/.env.production.example frontend/.env.production` → editar dominios → `npm ci` → `npm run build` → servir `frontend/dist` con Nginx.
4. **HTTPS** — certificado en el reverse proxy (Nginx/Caddy).
5. **Seed inicial** — `npm run seed` **una sola vez** en BD vacía (nunca en producción con datos reales).
6. **Secretos** — `JWT_SECRET` con `openssl rand -base64 64`; `TYPEORM_SYNCHRONIZE=false`.

### Variables clave

| Variable | Dónde | Descripción |
|----------|-------|-------------|
| `FRONTEND_URL` | backend `.env` | Dominio público del frontend (correos y enlaces) |
| `CORS_ORIGINS` | backend `.env` | Orígenes permitidos (ej. `https://efu.umsa.bo`) |
| `VITE_API_URL` | frontend `.env.production` | URL de la API al compilar (`https://api.../api/v1`) |
| `JWT_SECRET` | backend `.env` | Secreto largo y aleatorio, único por entorno |

Guía detallada: [DEPLOY.md](./DEPLOY.md)

---

## 📋 Características

- Gestión de fraternidades, inscripciones, evaluaciones y disciplina
- Roles: superusuario, admin, jurado, delegado, controlador HCU
- Reportes PDF, auditoría, correo (SMTP) y recuperación de contraseña
- Landing pública con estadísticas e histórico

## 🛠️ Stack

NestJS · TypeORM · PostgreSQL · Vue 3 · Vite · Vuetify · Axios · Swagger
