import axios from 'axios';
import { useAuthStore } from '../store/auth';

const api = axios.create({
  baseURL: 'http://localhost:3000/api/v1',
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
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      const authStore = useAuthStore();
      if (authStore.isAuthenticated) {
        authStore.triggerExpiry();
      }
    }
    return Promise.reject(error);
  }
);

export default api;
