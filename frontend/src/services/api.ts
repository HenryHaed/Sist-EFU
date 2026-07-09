import axios from 'axios';
import { useAuthStore } from '../store/auth';
import { API_URL } from '../config/env';

const api = axios.create({
  baseURL: API_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  const sessionId = localStorage.getItem('sessionId');
  if (sessionId) {
    config.headers['X-Session-Id'] = sessionId;
  }
  const gestionContextId = localStorage.getItem('gestionContextId');
  if (gestionContextId) {
    config.headers['X-Gestion-Id'] = gestionContextId;
  }
  // Cualquier petición API cuenta como actividad
  try {
    const authStore = useAuthStore();
    if (authStore.isAuthenticated) authStore.touchActivity();
  } catch { /* store aún no listo */ }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      const authStore = useAuthStore();
      if (authStore.isAuthenticated) {
        authStore.triggerExpiry('unauthorized');
      }
    }
    return Promise.reject(error);
  }
);

export default api;
