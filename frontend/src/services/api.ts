import axios from 'axios';
import { useAuthStore } from '../store/auth';

const api = axios.create({
  baseURL: 'http://localhost:3000/api/v1',
});

// Interceptor para añadir el token a las peticiones
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor para manejar errores de respuesta (especialmente 401)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      const authStore = useAuthStore();
      // Si ya estábamos autenticados y recibimos 401, el token expiró
      if (authStore.isAuthenticated) {
        authStore.triggerExpiry();
      }
    }
    return Promise.reject(error);
  }
);

export default api;
