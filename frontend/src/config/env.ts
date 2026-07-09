/**
 * Variables de entorno del frontend (Vite).
 * En desarrollo: frontend/.env.development (valores localhost).
 * En producción: el admin crea frontend/.env.production antes de `npm run build`.
 *
 * Prefijo obligatorio de Vite: VITE_
 */

const trim = (value: string | undefined): string => (value ?? '').trim();

const apiUrl = trim(import.meta.env.VITE_API_URL);
const apiBaseUrl = trim(import.meta.env.VITE_API_BASE_URL);

/** Origen del backend sin /api/v1 (archivos estáticos, uploads). */
export const API_BASE_URL = apiBaseUrl || 'http://localhost:3000';

/** Base URL de la API REST (axios). */
export const API_URL = apiUrl || `${API_BASE_URL}/api/v1`;

/** URL pública del frontend (solo informativa en cliente; el backend usa FRONTEND_URL). */
export const APP_URL = trim(import.meta.env.VITE_APP_URL) || 'http://localhost:5173';
