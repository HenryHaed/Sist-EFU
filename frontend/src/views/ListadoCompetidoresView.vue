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
          <p class="text-xs text-slate-500 font-medium">Listado oficial de postulación por fraternidad</p>
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

      <div v-else class="grid grid-cols-1 gap-6">
         <!-- FRATERNIDADES CARDS ACORDEON -->
         <div v-for="item in fraternidades" :key="item.idFraternidad" class="bg-white rounded-3xl overflow-hidden border border-slate-200 shadow-sm">
            <div class="p-6 bg-slate-50 flex items-center justify-between cursor-pointer hover:bg-slate-100 transition-colors" @click="toggleFrat(item.idFraternidad)">
               <div class="flex items-center gap-4">
                  <div class="size-12 rounded-full bg-primary/5 text-primary flex items-center justify-center">
                     <span class="material-symbols-outlined">groups</span>
                  </div>
                  <div>
                     <h3 class="font-black text-lg text-slate-800 uppercase tracking-tighter">{{ item.nombre }}</h3>
                     <p class="text-xs text-slate-500 font-medium">{{ getNumeroParticipantes(item) }} Participante(s) Registrados</p>
                  </div>
               </div>
               <span class="material-symbols-outlined text-slate-400 transition-transform" :class="expandedFrat === item.idFraternidad ? 'rotate-180' : ''">expand_more</span>
            </div>

            <!-- Lista de Participantes (Expandible) -->
            <div v-if="expandedFrat === item.idFraternidad" class="bg-white p-6 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-4">
               <div v-if="!item.participantesParsed || item.participantesParsed.length === 0" class="col-span-full py-8 text-center text-slate-400 font-medium text-sm">
                  Esta fraternidad no tiene participantes registrados para este concurso.
               </div>

               <div v-for="(partic, idx) in item.participantesParsed" :key="idx" class="border border-slate-200 rounded-2xl p-5 hover:border-primary hover:shadow-md transition-all group flex flex-col sm:flex-row justify-between items-start gap-4">
                  <div class="flex items-start gap-3">
                     <div class="size-10 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center shrink-0">
                        <span class="material-symbols-outlined text-lg">person</span>
                     </div>
                     <div>
                        <p class="text-[9px] font-black tracking-widest text-primary uppercase mb-0.5">{{ partic.tipo }}</p>
                        <h4 class="font-bold text-slate-800 text-sm leading-tight">{{ partic.nombre }}</h4>
                        <!-- ESTADO EVALUACION CHECK -->
                        <div class="mt-2 text-[10px] font-bold flex items-center gap-1" :class="partic.evaluacion ? 'text-emerald-600' : 'text-slate-400'">
                           <span class="material-symbols-outlined text-[14px]">{{ partic.evaluacion ? 'check_circle' : 'pending' }}</span>
                           {{ partic.evaluacion ? 'EVALUADO' : 'PENDIENTE' }}
                        </div>
                     </div>
                  </div>

                  <button 
                     @click="iniciarEvaluacion(item, partic)"
                     :disabled="partic.evaluacion?.estado === 'COMPLETADO'"
                     class="w-full sm:w-auto px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2"
                     :class="partic.evaluacion?.estado === 'COMPLETADO' ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-primary text-white hover:bg-blue-900 shadow-lg shadow-primary/20'"
                  >
                     <span>{{ partic.evaluacion ? 'Ver/Editar' : 'Calificar' }}</span>
                     <span class="material-symbols-outlined text-[16px]">{{ partic.evaluacion ? 'visibility' : 'edit_document' }}</span>
                  </button>
               </div>
            </div>
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

const fraternidades = ref([])
const loading = ref(true)

const expandedFrat = ref(null)
const cacheEvaluaciones = ref([])

// Temporizador Regresivo Global
const tiempoRestante = ref(0)
let timerInterval = null

const cargarDataEspecial = async () => {
  loading.value = true
  try {
    const { data } = await api.get(`/evaluaciones/fase/${props.fase.idFase}/fraternidades`)
    // Extraemos la lista raw
    const listadoBase = data.listado || []
    
    // Necesitamos cargar todas las evaluaciones de este jurado para esta fase para mapear por concursante
    const { data: evas } = await api.get('/evaluaciones/fases-auth') // No tenemos endpoint directo para listar las mias, pero en getFraternidadesPorFase el backend lo saca? 
    // Wait, getFraternidadesPorFase ya manda 'idEvaluacion' solo si hay 1. Para particiaptnes multiples necesitamos ajustar cómo se mapean.
    // Como el backend devolverá la info base, transformaremos el JSON de participantes
    
    fraternidades.value = await Promise.all(listadoBase.map(async (frat) => {
       // Parsear participantes
       let parsed = []
       if (frat.participantesConcurso) {
          try {
             const raw = typeof frat.participantesConcurso === 'string' ? JSON.parse(frat.participantesConcurso) : frat.participantesConcurso
             // asume formato { "Chacha": "Juan", "Warmi": "Maria" } o un array
             if (Array.isArray(raw)) {
                parsed = raw
             } else {
                parsed = Object.keys(raw).map(k => ({ tipo: k, nombre: raw[k] }))
             }
          } catch(e) {}
       }
       
       // Por ahora, verificamos si hay evaluaciones individuales llamando al endpoint si es necesario o usando el que ya viene
       for(const p of parsed) {
          try {
             // Check individual eval
             const evasReq = await api.get(`/evaluaciones/fase/${props.fase.idFase}/fraternidades/${frat.idFraternidad}/evaluacion?participanteNombre=${encodeURIComponent(p.nombre)}`)
             p.evaluacion = evasReq.data
          } catch(e) {
             p.evaluacion = null
          }
       }
       return { ...frat, participantesParsed: parsed }
    }))
    
    iniciarCronometro(new Date(props.fase.fechaFin))
  } catch (err) {
    Swal.fire('Error', 'No se pudo cargar el listado de competidores.', 'error')
    emit('volver')
  } finally {
    loading.value = false
  }
}

const toggleFrat = (id) => {
   expandedFrat.value = expandedFrat.value === id ? null : id
}

const getNumeroParticipantes = (frat) => {
   if (!frat.participantesConcurso) return 0
   try {
     const p = typeof frat.participantesConcurso === 'string' ? JSON.parse(frat.participantesConcurso) : frat.participantesConcurso
     if (Array.isArray(p)) return p.length
     return Object.keys(p).length
   } catch(e) { return 0 }
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

const iniciarEvaluacion = (fraternidad, participante) => {
  emit('evaluar-participante', {
    fraternidad,
    participanteNombre: participante.nombre,
    participanteTipo: participante.tipo
  })
}

onMounted(() => {
  cargarDataEspecial()
})

onUnmounted(() => {
  if (timerInterval) clearInterval(timerInterval)
})
</script>
