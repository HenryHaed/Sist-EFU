<template>
  <div class="relative min-h-[calc(100vh-4rem)] flex flex-col bg-slate-50">
    <!-- TIMER HEADER FIJO -->
    <div class="sticky top-0 z-20 bg-white border-b border-slate-200 px-6 py-3 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div class="flex items-center gap-4">
        <button @click="$emit('volver')" class="size-10 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl flex items-center justify-center transition-colors">
          <span class="material-symbols-outlined">arrow_back</span>
        </button>
        <div>
          <h2 class="text-xl font-black text-primary uppercase italic tracking-tighter">{{ fase?.nombre || 'Cargando...' }}</h2>
          <p class="text-xs text-slate-500 font-medium">Listado de participantes habilitados para este concurso</p>
        </div>
      </div>
      
      <!-- Contador Global -->
      <div 
        class="flex items-center gap-3 px-4 py-2 border rounded-xl"
        :class="urgenciaStatus.bgClass"
      >
        <span class="material-symbols-outlined animate-pulse" :class="urgenciaStatus.textClass">schedule</span>
        <div>
          <p class="text-[10px] font-black uppercase tracking-widest text-slate-500">Tiempo Restante de Fase</p>
          <p class="text-sm font-black" :class="urgenciaStatus.textClass">{{ countdownText }}</p>
        </div>
      </div>
    </div>

    <!-- MAIN LISTING -->
    <div class="flex-1 p-6 md:p-8 max-w-7xl mx-auto w-full">
      <div v-if="loading" class="flex justify-center py-20">
        <span class="material-symbols-outlined animate-spin text-4xl text-primary">progress_activity</span>
      </div>

      <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
         <!-- PARTICIPANTE CARD -->
         <div v-for="p in participantes" :key="p.idParticipante" 
              class="bg-white rounded-3xl overflow-hidden border border-slate-200 shadow-sm hover:shadow-lg transition-all group flex flex-col">
            
            <div class="p-6 flex-1">
               <div class="flex justify-between items-start mb-4">
                  <div class="size-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center shrink-0">
                     <span class="material-symbols-outlined text-3xl">person</span>
                  </div>
                  <div class="px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest"
                       :class="p.estadoEvaluacion === 'COMPLETADO' ? 'bg-emerald-100 text-emerald-700' : (p.estadoEvaluacion === 'EN_PROGRESO' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500')">
                    {{ p.estadoEvaluacion }}
                  </div>
               </div>

               <h3 class="font-black text-xl text-slate-800 uppercase tracking-tighter leading-tight mb-1">{{ p.nombre }}</h3>
               <p class="text-primary font-bold text-xs uppercase tracking-widest mb-4">{{ p.tipo || 'PARTICIPANTE' }}</p>

               <div class="flex items-center gap-2 mb-4 p-3 bg-slate-50 rounded-2xl border border-slate-100">
                  <span class="material-symbols-outlined text-slate-400 text-lg">groups</span>
                  <div>
                     <p class="text-[8px] font-black uppercase text-slate-400 leading-none mb-1">Representa a</p>
                     <p class="text-[10px] font-bold text-slate-700 leading-none truncate max-w-[150px]">{{ p.fraternidad }}</p>
                  </div>
               </div>

               <div v-if="p.fechaApertura" class="text-[9px] text-slate-400 font-bold uppercase tracking-widest flex flex-col gap-1">
                  <p>Inició: {{ formatearFecha(p.fechaApertura) }}</p>
                  <p v-if="p.fechaCierre">Cerró: {{ formatearFecha(p.fechaCierre) }}</p>
               </div>
            </div>

            <div class="p-4 bg-slate-50 border-t border-slate-100">
               <button 
                  @click="iniciarEvaluacion(p)"
                  :disabled="p.estadoEvaluacion === 'COMPLETADO'"
                  class="w-full py-3 rounded-2xl text-sm font-black transition-all flex items-center justify-center gap-2"
                  :class="p.estadoEvaluacion === 'COMPLETADO' ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-primary text-white hover:bg-blue-900 shadow-xl shadow-primary/20'"
               >
                  <span>{{ p.estadoEvaluacion === 'PENDIENTE' ? 'Iniciar Calificación' : (p.estadoEvaluacion === 'EN_PROGRESO' ? 'Continuar Calificación' : 'Calificación Cerrada') }}</span>
                  <span class="material-symbols-outlined text-[20px]">{{ p.estadoEvaluacion === 'COMPLETADO' ? 'lock' : 'arrow_forward' }}</span>
               </button>
            </div>
         </div>

         <!-- EMPTY STATE -->
         <div v-if="participantes.length === 0" class="col-span-full py-20 text-center">
            <span class="material-symbols-outlined text-6xl text-slate-200 mb-4">person_off</span>
            <p class="text-slate-400 font-bold uppercase tracking-widest">No hay participantes registrados para este concurso.</p>
         </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import Swal from 'sweetalert2'
import api from '../services/api'

const props = defineProps({
  fase: { type: Object, required: true }
})
const emit = defineEmits(['volver', 'evaluar-participante'])

const participantes = ref([])
const loading = ref(true)

// Temporizador Regresivo Global
const tiempoRestante = ref(0)
let timerInterval = null

const cargarParticipantes = async () => {
  loading.value = true
  try {
    const { data } = await api.get(`/evaluaciones/fase/${props.fase.idFase}/fraternidades`)
    // Note: for EXTERNO phases, the backend now returns a list of participants in 'listado'
    participantes.value = data.listado || []
    
    iniciarCronometro(new Date(props.fase.fechaFin))
  } catch (err) {
    Swal.fire('Error', 'No se pudo cargar el listado de competidores.', 'error')
    emit('volver')
  } finally {
    loading.value = false
  }
}

const iniciarCronometro = (fechaFin) => {
  const actualizar = () => {
    const ahora = new Date().getTime()
    const fin = fechaFin.getTime()
    tiempoRestante.value = Math.max(0, fin - ahora)
  }
  actualizar()
  timerInterval = setInterval(actualizar, 1000)
}

const countdownText = computed(() => {
  if (tiempoRestante.value <= 0) return 'TIEMPO FINALIZADO'
  const dias = Math.floor(tiempoRestante.value / (1000 * 60 * 60 * 24))
  const horas = Math.floor((tiempoRestante.value % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const min = Math.floor((tiempoRestante.value % (1000 * 60 * 60)) / (1000 * 60))
  return `${dias} Días / ${horas} Hrs / ${min} Min`
})

const urgenciaStatus = computed(() => {
  const dias = Math.floor(tiempoRestante.value / (1000 * 60 * 60 * 24))
  if (dias <= 1) return { bgClass: 'bg-secondary/10 border-secondary', textClass: 'text-secondary' }
  if (dias <= 2) return { bgClass: 'bg-orange-50 border-orange-200', textClass: 'text-orange-600' }
  return { bgClass: 'bg-emerald-50 border-emerald-200', textClass: 'text-emerald-700' }
})

const formatearFecha = (d) => {
  if (!d) return ''
  return new Date(d).toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit' })
}

const iniciarEvaluacion = (participante) => {
  emit('evaluar-participante', {
    idParticipante: participante.idParticipante,
    participanteNombre: participante.nombre,
    participanteTipo: participante.tipo,
    idFraternidad: participante.idFraternidad,
    fraternidadNombre: participante.fraternidad
  })
}

onMounted(() => {
  cargarParticipantes()
})

onUnmounted(() => {
  if (timerInterval) clearInterval(timerInterval)
})
</script>
