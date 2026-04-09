import { defineStore } from 'pinia';
import { jwtDecode } from 'jwt-decode';

interface User {
  id: number;
  ci: string;
  nombres: string;
  rol: string;
  primerLogin: boolean;
}

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: localStorage.getItem('token') || null,
    user: JSON.parse(localStorage.getItem('user') || 'null') as User | null,
    showExpiryModal: false,
    sessionTimeout: null as any,
  }),
  getters: {
    isAuthenticated: (state) => !!state.token,
    userRole: (state) => state.user?.rol || null,
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
    setAuth(token: string, user: User) {
      this.token = token;
      this.user = user;
      this.showExpiryModal = false;
      const now = Date.now().toString();
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('loginAt', now);
      this.startSessionTimer();
    },
    triggerExpiry() {
      this.showExpiryModal = true;
      this.logout(false);
    },
    logout(clearModal = true) {
      this.token = null;
      this.user = null;
      if (this.sessionTimeout) clearTimeout(this.sessionTimeout);
      if (clearModal) this.showExpiryModal = false;
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('loginAt');
    },
    updatePrimerLogin(val: boolean) {
      if (this.user) {
        this.user.primerLogin = val;
        localStorage.setItem('user', JSON.stringify(this.user));
      }
    }
  },
});
