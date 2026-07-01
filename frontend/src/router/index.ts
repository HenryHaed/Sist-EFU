import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '../store/auth';
import LandingView from '../views/LandingView.vue';
import LoginView from '../views/LoginView.vue';
import Dashboard from '../views/Dashboard.vue';
import RegistroDelegadoView from '../views/RegistroDelegadoView.vue';

const routes = [
  { path: '/', component: LandingView },
  { path: '/login', component: LoginView },
  { path: '/registro-delegado', component: RegistroDelegadoView },
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
});

export default router;
