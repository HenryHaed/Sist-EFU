<template>
  <div class="dashboard-page max-w-6xl w-full">
    <div class="mb-6 sm:mb-8">
      <div class="flex items-center gap-3 mb-2">
        <span class="h-6 sm:h-8 w-2 bg-secondary rounded-full shrink-0"></span>
        <h2 class="dashboard-page-title italic uppercase text-primary">Auditoría y Reportes</h2>
      </div>
      <p class="text-slate-500 font-medium text-sm">
        Consulta el registro de actividad del sistema, la auditoría de calificaciones y genera reportes filtrados.
      </p>
    </div>

    <div class="flex flex-wrap gap-2 mb-6 border-b border-slate-200">
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
        @click="activeTab = 'calificaciones'"
        class="pb-3 px-3 text-[10px] sm:text-xs font-black uppercase tracking-widest transition-all relative"
        :class="activeTab === 'calificaciones' ? 'text-primary' : 'text-slate-400 hover:text-slate-600'"
      >
        Auditoría de Calificaciones
        <div v-if="activeTab === 'calificaciones'" class="absolute bottom-0 left-0 w-full h-0.5 bg-secondary rounded-t-full"></div>
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
    <AuditoriaCalificacionesView v-else-if="activeTab === 'calificaciones'" />
    <ReportesConsultaView v-else-if="activeTab === 'reportes'" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '../store/auth'
import AuditoriaView from './AuditoriaView.vue'
import AuditoriaCalificacionesView from './AuditoriaCalificacionesView.vue'
import ReportesConsultaView from './ReportesConsultaView.vue'

const authStore = useAuthStore()
const role = computed(() => authStore.userRole?.toLowerCase() || '')
const canAuditoria = computed(() => role.value === 'superusuario')
const activeTab = ref(canAuditoria.value ? 'auditoria' : 'calificaciones')

onMounted(() => {
  if (!canAuditoria.value && activeTab.value === 'auditoria') {
    activeTab.value = 'calificaciones'
  }
})
</script>
