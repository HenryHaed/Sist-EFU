# Despliegue en producción — EFU

Guía para el **administrador del servidor**. El desarrollador solo entrega el código; la configuración real vive en `.env` en la máquina de producción.

---

## 1. Resumen de archivos `.env`

| Archivo | Ubicación | Quién lo crea |
|---------|-----------|---------------|
| `backend/.env` o `backend/.env.production` | Servidor API | Admin |
| `frontend/.env.production` | Servidor web (antes del build) | Admin |
| `*.example` en el repo | Plantillas sin secretos | Desarrollo (Git) |

**Nunca** subir `.env` con contraseñas o `JWT_SECRET` al repositorio.

---

## 2. Base de datos

```sql
CREATE USER efu_app WITH PASSWORD 'password_fuerte';
CREATE DATABASE efu_db OWNER efu_app;
```

En `backend/.env`:

```env
NODE_ENV=production
DB_HOST=localhost
DB_PORT=5432
DB_USER=efu_app
DB_PASSWORD=...
DB_NAME=efu_db
TYPEORM_SYNCHRONIZE=false
```

### Primera vez: crear tablas + datos iniciales

Con la BD vacía (solo `CREATE DATABASE`), ejecutar **una sola vez**:

```bash
cd backend
npm ci
npm run build
npm run seed:prod
```

> Si `seed:prod` no existe, actualizar el código del repositorio y volver a `npm run build`.
> Alternativa en desarrollo: `npm run seed` (requiere `ts-node`).

`npm run seed` / `seed:prod` hace automáticamente:

1. **Crea todas las tablas** (sin arrancar Nest ni `onModuleInit`)
2. Inserta roles, superusuario y catálogos UMSA

**No usa** `TYPEORM_SYNCHRONIZE=true` en el `.env` de la API.

**Superusuario inicial:** CI `12512405`, contraseña inicial = el mismo CI. Debe cambiarla en el primer login.

> **No volver a ejecutar** `seed:prod` si ya hay datos reales (borra todo).

En desarrollo local puede usarse `npm run seed` (con `ts-node`).

---

## 3. Backend (NestJS)

```bash
cd backend
cp .env.production.example .env
# Editar: JWT_SECRET, DB_*, CORS_ORIGINS, FRONTEND_URL, SMTP_*, APP_URL

npm ci
npm run build
npm run seed:prod    # Solo la primera vez (BD vacía)
NODE_ENV=production npm run start:prod
```

### Variables críticas

```env
NODE_ENV=production
PORT=3000
APP_URL=https://api.efu.umsa.bo

JWT_SECRET=<openssl rand -base64 64>
JWT_EXPIRES_IN=8h

CORS_ORIGINS=https://efu.umsa.bo
FRONTEND_URL=https://efu.umsa.bo

SWAGGER_ENABLED=false
TYPEORM_SYNCHRONIZE=false
```

### Proceso persistente (ejemplo PM2)

```bash
pm2 start dist/src/main.js --name efu-api --env production
pm2 save
```

### Carpeta `uploads/`

Debe persistir en disco (documentos, logos, PDFs). Hacer backup periódico.

---

## 4. Frontend (Vue + Vite)

```bash
cd frontend
cp .env.production.example .env.production
# Editar dominios reales

npm ci
npm run build
```

Servir `frontend/dist/` con Nginx. Ejemplo:

```nginx
server {
    listen 443 ssl;
    server_name efu.umsa.bo;

    root /var/www/efu/frontend/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}

server {
    listen 443 ssl;
    server_name api.efu.umsa.bo;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

---

## 5. Correo (SMTP)

Sin SMTP configurado, el login funciona pero **no** se envían correos de recuperación de contraseña ni notificaciones.

```env
SMTP_HOST=smtp.institucion.edu.bo
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=...
SMTP_PASS=...
SMTP_FROM="EFU <culturas@fcpn.edu.bo>"
```

`FRONTEND_URL` debe coincidir con la URL pública del frontend (con `https://`).

---

## 6. Checklist final

- [ ] `JWT_SECRET` generado y único en producción
- [ ] `TYPEORM_SYNCHRONIZE=false`
- [ ] `CORS_ORIGINS` = dominio del frontend
- [ ] `FRONTEND_URL` = dominio del frontend
- [ ] `VITE_API_URL` compilado con la URL pública de la API
- [ ] HTTPS activo
- [ ] `SWAGGER_ENABLED=false` (o protegido)
- [ ] Backups de PostgreSQL y `uploads/`
- [ ] `npm run seed:prod` ejecutado **una vez** en BD vacía (no repetir con datos reales)

---

## 7. Desarrollo vs producción

| | Desarrollo | Producción |
|---|------------|------------|
| Backend env | `backend/.env` | `backend/.env` o `.env.production` |
| Frontend env | `.env.development` (en repo) | `.env.production` (solo servidor) |
| API URL frontend | `http://localhost:3000/api/v1` | `https://api.../api/v1` |
| Synchronize BD | `true` | `false` |
