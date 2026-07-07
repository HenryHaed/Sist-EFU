<template>
  <v-dialog v-model="show" max-width="500" persistent>
    <v-card class="bg-white border-2 border-primary rounded-xl overflow-hidden shadow-2xl">
      <div class="bg-primary/5 pa-8 pb-4 text-center">
        <div class="size-20 rounded-full bg-secondary/10 flex items-center justify-center text-secondary mx-auto mb-6 border-2 border-secondary/20">
          <span class="material-symbols-outlined text-4xl">security</span>
        </div>
        <h3 class="text-2xl font-black text-primary mb-2">Sesión Finalizada</h3>
        <p class="text-slate-600 font-medium">Por motivos de seguridad, su sesión ha expirado.</p>
      </div>

      <v-card-text class="pa-8 pt-4">
        <div class="bg-slate-50 border border-slate-200 rounded-lg pa-4 mb-6 text-center">
          <p class="text-xs text-slate-500 uppercase tracking-widest font-black mb-1">Motivo</p>
          <p class="text-primary font-bold">Tiempo de inicio de sesión excedido (4 horas)</p>
        </div>
        
        <p class="text-sm text-slate-500 text-center leading-relaxed">
          Para continuar trabajando y asegurar la integridad de sus datos, por favor vuelva a ingresar sus credenciales.
        </p>

        <v-alert v-if="hasUnsavedChanges" type="warning" variant="tonal" class="mt-4 rounded-lg" border="start" density="compact">
          <div class="text-xs font-bold">Sus cambios pendientes han sido guardados automáticamente en este navegador.</div>
        </v-alert>
      </v-card-text>

      <v-divider class="border-slate-100"></v-divider>

      <v-card-actions class="pa-8 pt-6">
        <v-btn
          block
          class="bg-primary text-white font-black text-lg py-6 rounded-lg shadow-lg hover:brightness-110 shadow-primary/20"
          height="56"
          elevation="0"
          @click="irALogin"
        >
          <span class="material-symbols-outlined mr-2">login</span>
          Iniciar Sesión de Nuevo
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { computed } from 'vue';
import { useAuthStore } from '../store/auth';
import { useRouter } from 'vue-router';

const authStore = useAuthStore();
const router = useRouter();

const show = computed(() => authStore.showExpiryModal);

const hasUnsavedChanges = computed(() => {
  // Verificamos si hay borradores activos en localStorage
  return localStorage.getItem('evaluacion_draft_active') === 'true';
});

const irALogin = () => {
  authStore.logout();
  router.replace('/login');
};
</script>

<style scoped>
.material-symbols-outlined {
  font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
}
</style>
