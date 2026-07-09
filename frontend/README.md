# 🎨 Entrada Universitaria - Dashboard (Frontend)

Cliente Vue 3 + Vite + Vuetify para la **Entrada Universitaria UMSA**.

## Instalación

```bash
cd frontend
npm install
```

## Variables de entorno (Vite)

Todas las variables expuestas al cliente deben llevar prefijo **`VITE_`**.

| Archivo | Cuándo se usa | En Git |
|---------|---------------|--------|
| `.env.development` | `npm run dev` | ✅ Sí (localhost por defecto) |
| `.env.production` | `npm run build` | ❌ No (lo crea el admin en el servidor) |
| `.env.example` | Referencia | ✅ Sí |
| `.env.production.example` | Plantilla producción | ✅ Sí |

### Desarrollo

No hace falta copiar nada: `frontend/.env.development` ya apunta a `http://localhost:3000`.

```bash
npm run dev
```

App: `http://localhost:5173`

### Producción (administrador del servidor)

```bash
cp .env.production.example .env.production
# Editar VITE_API_BASE_URL, VITE_API_URL, VITE_APP_URL con el dominio real
npm ci
npm run build
```

Servir la carpeta `dist/` con Nginx u otro servidor estático.

| Variable | Ejemplo producción |
|----------|-------------------|
| `VITE_API_BASE_URL` | `https://api.efu.umsa.bo` |
| `VITE_API_URL` | `https://api.efu.umsa.bo/api/v1` |
| `VITE_APP_URL` | `https://efu.umsa.bo` |

> Los valores se **compilan** en el bundle. Si cambia el dominio, hay que volver a ejecutar `npm run build`.

## Código

- `src/config/env.ts` — lectura centralizada de `import.meta.env`
- `src/services/api.ts` — cliente Axios (`VITE_API_URL`)
- `src/utils/url.ts` — URLs de archivos y PDFs (`VITE_API_BASE_URL`)

## Build y preview

```bash
npm run build      # Salida en dist/
npm run preview    # Probar el build localmente
```

## Estructura

- `src/views/` — pantallas del dashboard y landing
- `src/components/` — componentes reutilizables
- `src/store/` — Pinia (auth, etc.)
- `src/router/` — rutas Vue Router
