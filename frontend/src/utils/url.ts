import api from '../services/api';

/**
 * Convierte una URL relativa almacenada en la base de datos (ej: /api/v1/archivos/...)
 * en una URL absoluta que el navegador pueda cargar desde el backend.
 */
export const getImageUrl = (url: string): string => {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  
  // El host del backend es http://localhost:3000
  const host = 'http://localhost:3000';
  
  // Si la URL ya empieza con /api/v1, solo concatenamos el host
  if (url.startsWith('/api')) {
    return `${host}${url}`;
  }
  
  // Caso de respaldo para URLs que solo contienen el nombre del archivo (antiguo comportamiento)
  // Intentamos adivinar basándonos en el contexto si es posible, 
  // pero lo ideal es que todas las URLs nuevas guarden la ruta completa.
  return url;
};
