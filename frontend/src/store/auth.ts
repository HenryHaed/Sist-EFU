import { defineStore } from 'pinia';
import api from '../services/api';
import {
  INACTIVITY_TIMEOUT_MS,
  SESSION_ABSOLUTE_MS,
  ACTIVITY_THROTTLE_MS,
} from '../utils/session';

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
    nivelRepresentacion?: string;
    categoria?: { idCategoria: number; nombre: string } | null;
    facultad?: { idFacultad: number; nombre: string } | null;
    carrera?: { idCarrera: number; nombre: string } | null;
    institucionExterna?: { idInstitucionExterna: number; nombre: string } | null;
  } | null;
}

function readTs(key: string): number | null {
  const raw = localStorage.getItem(key);
  if (!raw) return null;
  const n = parseInt(raw, 10);
  return Number.isFinite(n) ? n : null;
}

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: localStorage.getItem('token') || null,
    user: JSON.parse(localStorage.getItem('user') || 'null') as User | null,
    sessionId: localStorage.getItem('sessionId') || null,
    gestionContextId: localStorage.getItem('gestionContextId') || null,
    showExpiryModal: false,
    expiryReason: 'inactivity' as 'inactivity' | 'absolute' | 'unauthorized',
    sessionTimeout: null as ReturnType<typeof setTimeout> | null,
    _lastTouchAt: 0,
  }),
  getters: {
    isAuthenticated: (state) => !!state.token,
    userRole: (state) => state.user?.rol || null,
    remainingIdleSeconds: () => {
      const last = readTs('lastActivityAt');
      if (!last) return 0;
      const remaining = INACTIVITY_TIMEOUT_MS - (Date.now() - last);
      return Math.max(0, Math.floor(remaining / 1000));
    },
  },
  actions: {
    /** Marca actividad del usuario (teclado, mouse, etc.) y reinicia el timer de inactividad. */
    touchActivity(force = false) {
      if (!this.isAuthenticated) return;
      const now = Date.now();
      if (!force && now - this._lastTouchAt < ACTIVITY_THROTTLE_MS) return;
      this._lastTouchAt = now;
      localStorage.setItem('lastActivityAt', String(now));
      this.scheduleIdleCheck();
    },

    scheduleIdleCheck() {
      if (this.sessionTimeout) {
        clearTimeout(this.sessionTimeout);
        this.sessionTimeout = null;
      }
      if (!this.isAuthenticated) return;

      const loginAt = readTs('loginAt') ?? Date.now();
      const lastActivity = readTs('lastActivityAt') ?? loginAt;
      const now = Date.now();

      const absoluteRemaining = SESSION_ABSOLUTE_MS - (now - loginAt);
      const idleRemaining = INACTIVITY_TIMEOUT_MS - (now - lastActivity);

      if (absoluteRemaining <= 0) {
        this.triggerExpiry('absolute');
        return;
      }
      if (idleRemaining <= 0) {
        this.triggerExpiry('inactivity');
        return;
      }

      const wait = Math.min(absoluteRemaining, idleRemaining);
      this.sessionTimeout = setTimeout(() => {
        this.checkSessionExpiry();
      }, wait);
    },

    checkSessionExpiry() {
      if (!this.isAuthenticated) return;

      const loginAt = readTs('loginAt') ?? Date.now();
      const lastActivity = readTs('lastActivityAt') ?? loginAt;
      const now = Date.now();

      if (now - loginAt >= SESSION_ABSOLUTE_MS) {
        this.triggerExpiry('absolute');
        return;
      }
      if (now - lastActivity >= INACTIVITY_TIMEOUT_MS) {
        this.triggerExpiry('inactivity');
        return;
      }
      this.scheduleIdleCheck();
    },

    /** Compatibilidad con llamadas existentes. */
    startSessionTimer() {
      if (!this.isAuthenticated) return;
      if (!localStorage.getItem('lastActivityAt')) {
        localStorage.setItem('lastActivityAt', String(Date.now()));
      }
      this.scheduleIdleCheck();
    },

    setAuth(token: string, user: User, sessionId?: number | string | null) {
      this.token = token;
      this.user = user;
      this.showExpiryModal = false;
      const now = Date.now().toString();
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('loginAt', now);
      localStorage.setItem('lastActivityAt', now);
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

    triggerExpiry(reason: 'inactivity' | 'absolute' | 'unauthorized' = 'inactivity') {
      this.expiryReason = reason;
      this.showExpiryModal = true;
      this.logout(false);
    },

    async logout(clearModal = true) {
      const sessionId = this.sessionId;
      const token = this.token;

      // Cerrar sesión en servidor ANTES de limpiar token/sessionId (si no, fin_sesion nunca se guarda)
      if (sessionId && token) {
        try {
          await api.post(
            '/auth/logout',
            {},
            {
              headers: {
                Authorization: `Bearer ${token}`,
                'X-Session-Id': String(sessionId),
              },
            },
          );
        } catch {
          /* best-effort: igual se limpia el cliente */
        }
      }

      this.token = null;
      this.user = null;
      this.sessionId = null;
      this.gestionContextId = null;
      if (this.sessionTimeout) clearTimeout(this.sessionTimeout);
      this.sessionTimeout = null;
      if (clearModal) this.showExpiryModal = false;
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('loginAt');
      localStorage.removeItem('lastActivityAt');
      localStorage.removeItem('sessionId');
      localStorage.removeItem('gestionContextId');
    },

    updatePrimerLogin(val: boolean) {
      if (this.user) {
        this.user.primerLogin = val;
        localStorage.setItem('user', JSON.stringify(this.user));
      }
    },
  },
});
