import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '../store/auth';
import LandingView from '../views/LandingView.vue';
import LoginView from '../views/LoginView.vue';
import Dashboard from '../views/Dashboard.vue';
import RegistroDelegadoView from '../views/RegistroDelegadoView.vue';
import OlvideContrasenaView from '../views/OlvideContrasenaView.vue';
import RestablecerContrasenaView from '../views/RestablecerContrasenaView.vue';

const routes = [
  { path: '/', component: LandingView },
  { path: '/login', component: LoginView },
  { path: '/registro-delegado', component: RegistroDelegadoView },
  { path: '/olvide-contrasena', component: OlvideContrasenaView },
  { path: '/restablecer-contrasena', component: RestablecerContrasenaView },
  { 
    path: '/dashboard', 
    component: Dashboard,
    meta: { requiresAuth: true }
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach((to, from) => {
  const authStore = useAuthStore();
  
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    return '/login';
  }
  
  if (to.path === '/login' && authStore.isAuthenticated) {
    return '/dashboard';
  }

  if (to.path === '/restablecer-contrasena') {
    const token = sessionStorage.getItem('efu_reset_token');
    if (!token) return '/olvide-contrasena';
  }
});

export default router;
