<template>
  <div class="dashboard-page max-w-6xl w-full">
    <div class="mb-6 sm:mb-8">
      <div class="flex items-center gap-3 mb-2">
        <span class="h-6 sm:h-8 w-2 bg-secondary rounded-full shrink-0"></span>
        <h2 class="dashboard-page-title italic uppercase text-primary">Auditoría y Reportes</h2>
      </div>
      <p class="text-slate-500 font-medium text-sm">
        Consulta el registro de actividad del sistema y genera reportes filtrados de fraternidades, directiva y calificaciones.
      </p>
    </div>

    <div class="flex gap-2 mb-6 border-b border-slate-200">
      <button
        v-if="canAuditoria"
        type="button"
        @click="activeTab = 'auditoria'"
        class="pb-3 px-3 text-[10px] sm:text-xs font-black uppercase tracking-widest transition-all relative"
        :class="activeTab === 'auditoria' ? 'text-primary' : 'text-slate-400 hover:text-slate-600'"
      >
        Auditoría
        <div v-if="activeTab === 'auditoria'" class="absolute bottom-0 left-0 w-full h-0.5 bg-secondary rounded-t-full"></div>
      </button>
      <button
        type="button"
        @click="activeTab = 'reportes'"
        class="pb-3 px-3 text-[10px] sm:text-xs font-black uppercase tracking-widest transition-all relative"
        :class="activeTab === 'reportes' ? 'text-primary' : 'text-slate-400 hover:text-slate-600'"
      >
        Reportes
        <div v-if="activeTab === 'reportes'" class="absolute bottom-0 left-0 w-full h-0.5 bg-secondary rounded-t-full"></div>
      </button>
    </div>

    <AuditoriaView v-if="activeTab === 'auditoria' && canAuditoria" embedded />
    <ReportesConsultaView v-else-if="activeTab === 'reportes'" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '../store/auth'
import AuditoriaView from './AuditoriaView.vue'
import ReportesConsultaView from './ReportesConsultaView.vue'

const authStore = useAuthStore()
const role = computed(() => authStore.userRole?.toLowerCase() || '')
const canAuditoria = computed(() => role.value === 'superusuario')
const activeTab = ref(canAuditoria.value ? 'auditoria' : 'reportes')

onMounted(() => {
  if (!canAuditoria.value) activeTab.value = 'reportes'
})
</script>
