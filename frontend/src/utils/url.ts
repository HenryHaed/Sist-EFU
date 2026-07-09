import { API_BASE_URL } from '../config/env';

/**
 * Convierte una URL relativa almacenada en la base de datos (ej: /api/v1/archivos/...)
 * en una URL absoluta que el navegador pueda cargar desde el backend.
 */
export const getImageUrl = (url: string): string => {
  if (!url) return '';
  if (url.startsWith('http')) return url;

  const host = API_BASE_URL.replace(/\/$/, '');

  if (url.startsWith('/api') || url.startsWith('/uploads')) {
    return `${host}${url}`;
  }

  return url;
};

/** URL absoluta a un endpoint de la API (ej. descarga de PDF). */
export const getApiUrl = (path: string): string => {
  const base = API_BASE_URL.replace(/\/$/, '');
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `${base}${normalized}`;
};
