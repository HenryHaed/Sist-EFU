import { defineStore } from 'pinia';
import { jwtDecode } from 'jwt-decode';
import api from '../services/api';

interface User {
  id: number;
  ci: string;
  correo?: string | null;
  nombres: string;
  rol: string;
  primerLogin: boolean;
  fraternidad?: {
    idFraternidad: number;
    nombre: string;
    origenFraternidad?: string;
    nivelRepresentacion?: string;
    categoria?: { idCategoria: number; nombre: string } | null;
    facultad?: { idFacultad: number; nombre: string } | null;
    carrera?: { idCarrera: number; nombre: string } | null;
    institucionExterna?: { idInstitucionExterna: number; nombre: string } | null;
  } | null;
}

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: localStorage.getItem('token') || null,
    user: JSON.parse(localStorage.getItem('user') || 'null') as User | null,
    sessionId: localStorage.getItem('sessionId') || null,
    gestionContextId: localStorage.getItem('gestionContextId') || null,
    showExpiryModal: false,
    sessionTimeout: null as any,
  }),
  getters: {
    isAuthenticated: (state) => !!state.token,
    userRole: (state) => state.user?.rol || null,
    remainingSessionSeconds: () => {
      const loginAt = localStorage.getItem('loginAt');
      if (!loginAt) return 0;
      const oneHour = 3600000;
      const remaining = oneHour - (Date.now() - parseInt(loginAt));
      return Math.max(0, Math.floor(remaining / 1000));
    }
  },
  actions: {
    startSessionTimer() {
      if (this.sessionTimeout) clearTimeout(this.sessionTimeout);
      
      const loginAt = localStorage.getItem('loginAt');
      if (!loginAt) return;

      const now = Date.now();
      const loginTime = parseInt(loginAt);
      const oneHour = 3600000;
      const elapsed = now - loginTime;
      const remaining = oneHour - elapsed;

      if (remaining <= 0) {
        if (this.isAuthenticated) this.triggerExpiry();
      } else {
        this.sessionTimeout = setTimeout(() => {
          if (this.isAuthenticated) {
            this.triggerExpiry();
          }
        }, remaining);
      }
    },
    setAuth(token: string, user: User, sessionId?: number | string | null) {
      this.token = token;
      this.user = user;
      this.showExpiryModal = false;
      const now = Date.now().toString();
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('loginAt', now);
      if (sessionId != null) {
        this.sessionId = String(sessionId);
        localStorage.setItem('sessionId', String(sessionId));
      }
      this.startSessionTimer();
    },
    setGestionContext(idGestion: number | string | null) {
      if (idGestion == null) {
        this.gestionContextId = null;
        localStorage.removeItem('gestionContextId');
        return;
      }
      this.gestionContextId = String(idGestion);
      localStorage.setItem('gestionContextId', String(idGestion));
    },
    triggerExpiry() {
      this.showExpiryModal = true;
      this.logout(false);
    },
    async logout(clearModal = true) {
      const sessionId = this.sessionId;
      if (sessionId && this.token) {
        try {
          await api.post('/auth/logout');
        } catch {
          // Ignorar si el token ya expiró
        }
      }
      this.token = null;
      this.user = null;
      this.sessionId = null;
      if (this.sessionTimeout) clearTimeout(this.sessionTimeout);
      if (clearModal) this.showExpiryModal = false;
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('loginAt');
      localStorage.removeItem('sessionId');
    },
    updatePrimerLogin(val: boolean) {
      if (this.user) {
        this.user.primerLogin = val;
        localStorage.setItem('user', JSON.stringify(this.user));
      }
    }
  },
});
