import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '../store/auth';
import LandingView from '../views/LandingView.vue';
import LoginView from '../views/LoginView.vue';
import Dashboard from '../views/Dashboard.vue';

const routes = [
  { path: '/', component: LandingView },
  { path: '/login', component: LoginView },
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

router.beforeEach((to, from, next) => {
  const authStore = useAuthStore();
  
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    next('/login');
  } else if (to.path === '/login' && authStore.isAuthenticated) {
    next('/dashboard');
  } else {
    next();
  }
});

export default router;
