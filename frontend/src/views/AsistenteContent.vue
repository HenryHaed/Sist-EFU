<template>
  <div class="relative min-h-[calc(100vh-4rem)] flex flex-col bg-slate-50">
    <!-- WIZARD HEADER FIJO -->
    <div class="sticky top-0 z-30 bg-white border-b border-slate-200 px-6 py-4 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div class="flex items-center gap-4">
        <button @click="$emit('volver')" class="size-10 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl flex items-center justify-center transition-colors">
          <span class="material-symbols-outlined">arrow_back</span>
        </button>
        <div>
          <h2 class="text-xl font-black text-primary uppercase italic tracking-tighter">{{ fraternidad?.nombre || 'Cargando...' }}</h2>
          <p class="text-xs text-slate-500 font-medium">Fase: <span class="font-bold text-secondary">{{ faseSeleccionada?.nombre }}</span></p>
        </div>
      </div>
      
      <!-- Contador de Fase -->
      <div 
        class="flex items-center gap-3 px-4 py-2 border rounded-xl"
        :class="urgenciaStatus.bgClass"
      >
        <span class="material-symbols-outlined animate-pulse" :class="urgenciaStatus.textClass">timer</span>
        <div>
          <p class="text-[10px] font-black uppercase tracking-widest text-slate-500">Tiempo de Fase</p>
          <p class="text-sm font-black" :class="urgenciaStatus.textClass">{{ countdownText }}</p>
        </div>
      </div>
    </div>

    <!-- MAIN FORM -->
    <div class="flex-1 p-6 md:p-8 max-w-4xl mx-auto w-full">
      <div v-if="loading" class="flex justify-center py-20">
        <span class="material-symbols-outlined animate-spin text-4xl text-primary">sync</span>
      </div>

      <div v-else class="space-y-6">
        <!-- Resumen de Evaluación Actual -->
        <div class="bg-indigo-50 border border-indigo-100 rounded-2xl p-6 flex items-center justify-between">
          <div class="flex items-center gap-4">
            <div class="size-12 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600">
              <span class="material-symbols-outlined text-2xl">monitoring</span>
            </div>
            <div>
              <p class="text-[10px] font-black uppercase tracking-widest text-indigo-500">Estado de Evaluación</p>
              <h3 class="text-lg font-black text-indigo-900">{{ estadoTexto }}</h3>
            </div>
          </div>
          
          <div class="text-right">
            <p class="text-[10px] font-black uppercase tracking-widest text-slate-500">Puntaje Parcial</p>
            <p class="text-3xl font-black text-primary">{{ puntajeCalculado }}<span class="text-lg text-slate-400 font-medium"> / {{ puntajePosible }}</span></p>
          </div>
        </div>

        <!-- Criterios -->
        <div class="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden p-6 space-y-6">
          <h3 class="text-lg font-black text-slate-800 uppercase italic tracking-tighter">Panel de Criterios</h3>

          <div v-if="criterios.length === 0" class="text-center py-10 text-slate-400">
            <span class="material-symbols-outlined text-4xl">inventory_2</span>
            <p class="mt-2 font-bold">No existen criterios definidos para esta fase.</p>
          </div>

          <div 
            v-for="(criterio, index) in criterios" 
            :key="criterio.idCriterio"
            class="p-5 border-2 rounded-2xl transition-all"
            :class="formValues[criterio.idCriterio] ? 'border-emerald-200 bg-emerald-50/30' : 'border-slate-100 bg-slate-50 hover:border-slate-200'"
          >
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div class="flex items-center gap-4">
                <div 
                  class="size-10 rounded-xl flex items-center justify-center font-black text-lg"
                  :class="formValues[criterio.idCriterio] ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-200 text-slate-500'"
                >
                  <span v-if="formValues[criterio.idCriterio]" class="material-symbols-outlined">check</span>
                  <span v-else>{{ index + 1 }}</span>
                </div>
                <div>
                  <h4 class="font-bold text-slate-800">{{ criterio.nombre }}</h4>
                  <p class="text-xs text-slate-500 font-medium tracking-wide">Puntaje Máximo: {{ Number(criterio.puntajeMaximo) }} pts</p>
                </div>
              </div>

              <!-- Input Score -->
              <div class="flex items-center gap-2">
                <input 
                  type="number" 
                  v-model.number="formValues[criterio.idCriterio]" 
                  min="0" 
                  :max="Number(criterio.puntajeMaximo)"
                  class="w-24 text-center py-2 px-3 bg-white border-2 border-slate-300 rounded-xl focus:border-secondary focus:ring-0 outline-none font-bold text-lg text-primary transition-colors"
                  :placeholder="'0 - ' + Number(criterio.puntajeMaximo)"
                  :disabled="estadoOriginal === 'COMPLETADO'"
                />
                <span class="text-slate-400 font-bold">pts</span>
              </div>
            </div>
            <!-- Slider opcional para UI más refinada -->
            <div class="mt-4 px-1" v-if="estadoOriginal !== 'COMPLETADO'">
              <input 
                type="range" 
                v-model.number="formValues[criterio.idCriterio]" 
                min="0" 
                :max="Number(criterio.puntajeMaximo)"
                class="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-primary"
              />
            </div>
          </div>
        </div>

        <!-- Footer Actions -->
        <div v-if="estadoOriginal !== 'COMPLETADO'" class="flex flex-col sm:flex-row items-center gap-4 pt-4">
          <button 
            @click="guardar(false)"
            :disabled="saving"
            class="w-full sm:w-1/2 py-4 bg-white border-2 border-primary text-primary hover:bg-primary/5 rounded-2xl font-black transition-all flex items-center justify-center gap-2"
          >
            <span class="material-symbols-outlined text-[20px]">save</span>
            Guardar Progreso
          </button>
          
          <button 
            @click="intentarFinalizar"
            :disabled="saving"
            class="w-full sm:w-1/2 py-4 bg-primary text-white hover:bg-blue-900 shadow-xl shadow-primary/20 rounded-2xl font-black transition-all flex items-center justify-center gap-2"
          >
            <span class="material-symbols-outlined text-[20px]">verified</span>
            Sellar Calificación
          </button>
        </div>

        <div v-else class="bg-emerald-50 border-2 border-emerald-500 rounded-2xl p-6 text-center">
            <span class="material-symbols-outlined text-5xl text-emerald-500 mb-2">lock</span>
            <h3 class="text-emerald-800 font-black text-xl">Acta Sellada</h3>
            <p class="text-emerald-700 text-sm mt-1">Esta calificación ha finalizado y ya no puede ser alterada.</p>
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
  faseSeleccionada: {
    type: Object,
    required: true
  },
  fraternidad: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['volver', 'finalizar'])

const loading = ref(true)
const saving = ref(false)
const criterios = ref([])
const formValues = ref({}) // Almacenará { idCriterio: score }

// Control Estado
const estadoOriginal = ref('PENDIENTE')

// Timer Fase
const tiempoRestante = ref(0)
let timerInterval = null

const cargarDatos = async () => {
  loading.value = true
  try {
    // 1. Obtener los criterios que aplican a esta fase
    const resCriterios = await api.get(`/evaluaciones/fase/${props.faseSeleccionada.idFase}/criterios`)
    criterios.value = resCriterios.data

    // Inicializar form values a null o 0
    criterios.value.forEach(c => {
      formValues.value[c.idCriterio] = null
    })

    // 2. Traer Evaluación Existente si hay (para cargar el JSONB)
    const resEval = await api.get(`/evaluaciones/fase/${props.faseSeleccionada.idFase}/fraternidades/${props.fraternidad.idFraternidad}/evaluacion`)
    
    if (resEval.data) {
      estadoOriginal.value = resEval.data.estado
      const jsonb = resEval.data.criteriosEvaluados
      if (jsonb) {
        Object.keys(jsonb).forEach(key => {
          formValues.value[key] = jsonb[key]
        })
      }
    }

    iniciarCronometro(new Date(props.faseSeleccionada.fechaFin))
  } catch (error) {
    Swal.fire('Error', 'No se pudieron cargar los criterios.', 'error')
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

const puntajeCalculado = computed(() => {
  let total = 0
  Object.values(formValues.value).forEach(val => {
    total += Number(val) || 0
  })
  return total
})

const puntajePosible = computed(() => {
  return criterios.value.reduce((acc, curr) => acc + Number(curr.puntajeMaximo), 0)
})

const estadoTexto = computed(() => {
  if (estadoOriginal.value === 'PENDIENTE') return 'Sin Iniciar'
  if (estadoOriginal.value === 'EN_PROGRESO') return 'En Progreso (Borrador)'
  return 'Calificación Finalizada'
})

// Acciones Guardado
const guardar = async (finalizar = false) => {
  saving.value = true
  
  // Limpiar nulos para guardado JSON
  const payloadCriterios = {}
  Object.keys(formValues.value).forEach(k => {
    if (formValues.value[k] !== null) {
      payloadCriterios[k] = formValues.value[k]
    }
  })

  try {
    await api.post('/evaluaciones/guardar', {
      idFase: props.faseSeleccionada.idFase,
      idFraternidad: props.fraternidad.idFraternidad,
      criterios: payloadCriterios,
      finalizar
    })

    if (finalizar) {
      Swal.fire({
        icon: 'success',
        title: '¡Acta Sellada!',
        text: 'Las calificaciones se han asegurado.',
        confirmButtonColor: '#003399'
      })
      emit('finalizar', { promedio: puntajeCalculado.value })
    } else {
      Swal.fire({
        icon: 'success',
        title: 'Progreso Guardado',
        text: 'Puedes continuar editando más tarde.',
        timer: 2000,
        showConfirmButton: false
      })
      estadoOriginal.value = 'EN_PROGRESO'
    }
  } catch (error) {
    Swal.fire('Error', error.response?.data?.message || 'No se pudo guardar la evaluación.', 'error')
  } finally {
    saving.value = false
  }
}

const intentarFinalizar = () => {
  // Validar que todos los criterios estén llenados
  const sinLlenar = criterios.value.some(c => {
    const v = formValues.value[c.idCriterio]
    return v === null || v === undefined || v === ''
  })

  // Validar límites lógicos base
  const superaLimites = criterios.value.some(c => {
    const v = formValues.value[c.idCriterio]
    return Number(v) > Number(c.puntajeMaximo) || Number(v) < 0
  })

  if (sinLlenar) {
    Swal.fire('Atención', 'Debes ingresar un valor para todos los criterios antes de sellar el acta.', 'warning')
    return
  }

  if (superaLimites) {
    Swal.fire('Error', 'Existen puntajes que superan el máximo permitido según el reglamento.', 'error')
    return
  }

  Swal.fire({
    icon: 'warning',
    title: '¿Confirmas la calificación?',
    html: `Puntaje total calculado: <b>${puntajeCalculado.value} / ${puntajePosible.value}</b><br><br>Al "Sellar", ya no podrás realizar ediciones.`,
    showCancelButton: true,
    confirmButtonText: 'Sí, Sellar Calificación',
    cancelButtonText: 'Cancelar',
    confirmButtonColor: '#003399'
  }).then((result) => {
    if (result.isConfirmed) {
      guardar(true)
    }
  })
}

onMounted(() => {
  cargarDatos()
})

onUnmounted(() => {
  if (timerInterval) clearInterval(timerInterval)
})
</script>
