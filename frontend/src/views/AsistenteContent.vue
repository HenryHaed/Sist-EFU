<template>
  <div class="relative flex flex-col w-full h-full wizard-gradient overflow-y-auto">
    
    <!-- Wizard Header (replaces standard header) -->
    <div class="sticky top-0 z-40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 px-4 sm:px-6 py-3 sm:py-4 bg-white/95 backdrop-blur-md shadow-sm">
      <div class="flex items-center gap-3 min-w-0">
        <button @click="$emit('volver')" class="flex items-center justify-center rounded-lg h-10 w-10 bg-slate-50 text-slate-500 hover:bg-slate-200 transition-colors border border-slate-200">
          <span class="material-symbols-outlined">arrow_back</span>
        </button>
        <div class="flex flex-col">
          <h2 class="text-primary text-base sm:text-xl font-black italic leading-tight tracking-tight uppercase truncate">
            <template v-if="participanteNombre">
              {{ participanteNombre }}
              <span v-if="fraternidad" class="text-slate-400 font-medium text-sm block sm:inline sm:ml-2">/ {{ fraternidad.nombre }}</span>
            </template>
            <template v-else>
              {{ fraternidad?.nombre || 'Evaluación' }}
            </template>
          </h2>
          <p class="text-slate-500 text-[10px] uppercase tracking-widest font-bold">
            {{ faseSeleccionada?.nombre }} <span v-if="participanteTipo" class="text-amber-600 ml-1">• {{ participanteTipo }}</span>
          </p>
        </div>
      </div>
      
      <div class="flex items-center gap-3 mt-4 sm:mt-0 flex-wrap justify-end">
        <div class="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-lg border border-slate-200" :class="urgenciaStatus.textClass">
          <span class="material-symbols-outlined animate-pulse text-sm">schedule</span>
          <span class="text-xs font-black">{{ countdownText }}</span>
        </div>
        <button
          v-if="esFaseMonografia && fraternidad"
          @click="abrirMonografia"
          :disabled="cargandoMonografia"
          class="flex items-center gap-2 px-4 py-2 bg-amber-50 text-amber-800 rounded-lg font-black text-[10px] uppercase tracking-widest border border-amber-200 hover:bg-amber-100 transition-colors disabled:opacity-50"
        >
          <span class="material-symbols-outlined text-sm">picture_as_pdf</span>
          Ver Monografía
        </button>
        <div v-if="estadoOriginal === 'COMPLETADO'" class="flex items-center gap-2 px-4 py-2 bg-emerald-100 text-emerald-700 rounded-lg font-black text-xs uppercase tracking-widest border border-emerald-200">
          <span class="material-symbols-outlined text-sm">verified_user</span> Sellada
        </div>
      </div>
    </div>

    <!-- Main Content -->
    <main class="flex-1 flex flex-col items-center p-4 sm:p-6 md:p-8 w-full max-w-6xl mx-auto min-w-0">
      
      <!-- Loading State -->
      <div v-if="loading" class="flex flex-col items-center justify-center py-20 text-slate-400">
        <span class="material-symbols-outlined animate-spin text-5xl text-primary mb-4">sync</span>
        <p class="font-bold tracking-widest uppercase text-xs">Preparando Criterios...</p>
      </div>

      <template v-else-if="criterios.length > 0">
        <!-- Progress section -->
        <div class="w-full max-w-5xl mb-8">
          <div class="flex justify-between items-end mb-3">
            <div>
              <span class="text-primary font-bold text-[10px] uppercase tracking-widest">Progreso de Calificación</span>
              <h3 class="text-2xl font-black text-slate-900 italic tracking-tighter uppercase">Paso {{ criterioActualIndex + 1 }}: {{ criterioActual.nombre }}</h3>
            </div>
            <div class="text-right">
              <span class="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Criterio {{ criterioActualIndex + 1 }} de {{ totalCriterios }}</span>
              <p class="text-primary font-black text-xl">{{ porcentajeProgreso }}%</p>
            </div>
          </div>
          <div class="w-full bg-slate-100 h-3 rounded-full overflow-hidden border border-slate-200 relative">
            <div class="bg-primary h-full transition-all duration-300 relative" :style="{ width: porcentajeProgreso + '%' }">
              <div class="absolute right-0 top-0 h-full w-1 bg-secondary"></div>
            </div>
          </div>
        </div>

        <!-- Layout Grid -->
        <div class="relative w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-start mb-10">
          
          <!-- LEFT CARD (Active Criterion) -->
          <div class="lg:col-span-8 flex flex-col glass-panel rounded-2xl overflow-hidden border-t-4 border-t-primary bg-white shadow-xl">
            <!-- Criterion Image -->
            <div class="aspect-video relative w-full overflow-hidden bg-slate-100">
              <div class="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/20 to-transparent z-10 pointer-events-none"></div>
              
              <!-- Badge status -->
              <div class="absolute top-4 left-4 z-20 bg-primary px-3 py-1 rounded text-[10px] font-black uppercase tracking-widest text-white shadow-lg border-l-4 border-secondary flex items-center gap-1">
                <span class="material-symbols-outlined text-[14px]" v-if="estadoOriginal === 'COMPLETADO'">lock</span>
                <span class="material-symbols-outlined text-[14px]" v-else>radio_button_checked</span>
                {{ estadoOriginal === 'COMPLETADO' ? 'Lectura' : 'En Evaluación' }}
              </div>
              
              <div class="absolute bottom-4 right-4 z-20 bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-lg text-white font-black text-xs border border-white/30 shadow-lg">
                Máximo: {{ Number(criterioActual.puntajeMaximo) }} pts
              </div>

              <!-- Imagen con fallback a textura andina si no hay -->
              <img 
                v-if="criterioActual.urlImagen" 
                :src="getImageUrl(criterioActual.urlImagen)" 
                class="w-full h-full object-cover" 
                alt="Imagen Criterio" 
              />
              <div v-else class="w-full h-full andean-pattern flex items-center justify-center opacity-80 mix-blend-multiply bg-primary/10">
                <span class="material-symbols-outlined text-6xl text-primary/20">school</span>
              </div>
            </div>
            
            <div class="p-6 md:p-10 flex-1 flex flex-col bg-white">
              <div class="mb-8">
                <div class="flex items-center gap-2 mb-3">
                  <span class="size-2 rounded-full bg-secondary shrink-0"></span>
                  <h4 class="text-2xl font-black text-slate-900 italic tracking-tighter uppercase leading-tight">
                    Evaluación de {{ criterioActual.nombre }}
                  </h4>
                </div>
                <p class="text-slate-600 text-sm leading-relaxed font-medium">
                  {{ criterioActual.descripcion || 'Asigne el puntaje correspondiente de acuerdo a los criterios observados durante el desarrollo del recorrido.' }}
                </p>
              </div>

              <div class="mt-auto space-y-8">
                <!-- Score Control -->
                <div class="bg-slate-50 p-6 rounded-2xl border border-slate-200">
                  <div class="flex justify-between items-center mb-6">
                    <label class="text-slate-800 font-black text-sm uppercase tracking-widest flex items-center gap-2">
                      <span class="material-symbols-outlined text-primary text-xl">analytics</span>
                      Puntaje del Criterio
                    </label>
                    <div class="flex items-center gap-3">
                      <input 
                        type="number" 
                        v-model.number="formValues[criterioActual.idCriterio]" 
                        min="0" 
                        :max="Number(criterioActual.puntajeMaximo)"
                        @input="validarPuntaje(criterioActual)"
                        @blur="validarPuntaje(criterioActual)"
                        class="w-24 px-3 py-2 bg-white border-2 border-slate-300 text-primary font-black text-2xl text-center rounded-xl focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all outline-none"
                        :disabled="estadoOriginal === 'COMPLETADO'"
                      />
                      <span class="text-slate-400 font-bold text-sm">/ {{ Number(criterioActual.puntajeMaximo) }}</span>
                    </div>
                  </div>
                  
                  <div class="relative flex items-center gap-4" v-if="estadoOriginal !== 'COMPLETADO'">
                    <span class="text-xs font-black text-slate-400">0</span>
                    <div class="flex-1 relative flex items-center group">
                      <input 
                        type="range" 
                        v-model.number="formValues[criterioActual.idCriterio]" 
                        min="0" 
                        :max="Number(criterioActual.puntajeMaximo)"
                        class="w-full h-3 bg-slate-200 rounded-full appearance-none cursor-pointer accent-primary focus:outline-none focus:ring-4 focus:ring-primary/20 transition-all custom-range shadow-inner"
                      />
                    </div>
                    <span class="text-xs font-black text-slate-400">{{ Number(criterioActual.puntajeMaximo) }}</span>
                  </div>
                </div>

                <!-- Navigation Controls -->
                <div class="flex items-center justify-between gap-4 pt-4 border-t border-slate-100">
                  <!-- Prev -->
                  <button 
                    @click="pasoAnterior" 
                    :disabled="criterioActualIndex === 0"
                    class="flex items-center gap-2 px-6 py-4 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all border-2 disabled:opacity-30 disabled:cursor-not-allowed"
                    :class="criterioActualIndex === 0 ? 'bg-slate-50 border-slate-100 text-slate-400' : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50 shadow-sm'"
                  >
                    <span class="material-symbols-outlined text-lg">arrow_back</span>
                    <span class="hidden sm:inline">Anterior</span>
                  </button>

                  <div class="flex gap-3 flex-1 justify-end">
                    <!-- Save draft -->
                    <button 
                      v-if="estadoOriginal !== 'COMPLETADO'"
                      @click="guardar(false)" 
                      :disabled="saving || tiempoRestante <= 0"
                      class="flex items-center gap-2 px-6 py-4 rounded-xl bg-white border-2 border-primary text-primary font-black uppercase text-[10px] tracking-widest hover:bg-primary/5 transition-all shadow-sm"
                    >
                      <span class="material-symbols-outlined text-lg" :class="{'animate-spin': saving}">sync</span>
                      <span class="hidden sm:inline">{{ tiempoRestante <= 0 ? 'Fase Cerrada' : 'Guardar' }}</span>
                    </button>

                    <!-- Next or Finish -->
                    <button 
                      v-if="criterioActualIndex < totalCriterios - 1"
                      @click="pasoSiguiente"
                      class="flex-1 max-w-[220px] flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-primary text-white font-black uppercase text-[10px] tracking-widest hover:bg-blue-900 transition-all glow-blue shadow-lg shadow-primary/30 border-b-4 border-blue-900 active:border-b-0 active:translate-y-1"
                    >
                      Siguiente 
                      <span class="material-symbols-outlined text-lg">arrow_forward</span>
                    </button>

                    <button 
                      v-else-if="estadoOriginal !== 'COMPLETADO'"
                      @click="abrirResumenModal"
                      :disabled="tiempoRestante <= 0"
                      class="flex-1 max-w-[220px] flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-secondary text-white font-black uppercase text-[10px] tracking-widest hover:bg-red-800 transition-all shadow-lg shadow-secondary/30 border-b-4 border-red-900 active:border-b-0 active:translate-y-1 disabled:bg-slate-200 disabled:text-slate-400 disabled:border-transparent"
                    >
                      <span class="material-symbols-outlined text-lg">{{ tiempoRestante <= 0 ? 'lock' : 'verified' }}</span>
                      {{ tiempoRestante <= 0 ? 'Fase Cerrada' : 'Sellar Acta' }}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- RIGHT SIDEBAR (Preview & Summary) -->
          <div class="lg:col-span-4 flex flex-col gap-6">
            
            <!-- Summary Global -->
            <div class="bg-slate-900 text-white border border-slate-800 rounded-2xl p-8 flex flex-col justify-center items-center text-center shadow-2xl shadow-slate-900/20 relative overflow-hidden">
              <div class="absolute top-0 left-0 w-full h-2 bg-secondary"></div>
              
              <h5 class="text-slate-400 font-bold mb-1 uppercase text-[10px] tracking-widest">Puntaje Acumulado</h5>
              <div class="flex items-end gap-1 mb-2">
                <p class="text-7xl font-black italic tracking-tighter">{{ puntajeCalculado }}</p>
                <p class="text-xl text-slate-500 font-bold mb-2">/ {{ puntajePosible }}</p>
              </div>
              
              <div class="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 text-slate-300 text-[9px] font-black uppercase tracking-widest mt-2 border border-white/5">
                <span class="material-symbols-outlined text-[14px]">done_all</span>
                {{ criteriosLlenados }} de {{ totalCriterios }} Completados
              </div>
            </div>

            <!-- Próximo Paso Preview -->
            <div 
              v-if="criterioSiguiente"
              @click="pasoSiguiente"
              class="glass-panel rounded-2xl p-5 flex flex-col opacity-90 hover:opacity-100 transition-all cursor-pointer group bg-white border-2 border-slate-100 hover:border-primary shadow-sm hover:shadow-lg"
            >
              <div class="flex items-center justify-between mb-4">
                <div class="flex items-center gap-3">
                  <div class="size-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 group-hover:text-primary group-hover:bg-primary/10 transition-colors">
                    <span class="material-symbols-outlined text-[18px]">forward_step</span>
                  </div>
                  <div>
                    <p class="text-[9px] text-slate-400 font-black uppercase tracking-widest">Próximo</p>
                    <p class="text-slate-900 font-bold text-sm tracking-tight truncate max-w-[150px]">{{ criterioSiguiente.nombre }}</p>
                  </div>
                </div>
                <span class="material-symbols-outlined text-slate-300 group-hover:text-primary group-hover:translate-x-1 transition-all">chevron_right</span>
              </div>
              
              <div class="aspect-[21/9] rounded-xl overflow-hidden border border-slate-200 relative bg-slate-50">
                <div class="absolute inset-0 bg-primary/10 group-hover:bg-transparent transition-colors z-10"></div>
                <!-- Mini Imagen Próximo -->
                <img 
                  v-if="criterioSiguiente.urlImagen"
                  :src="getImageUrl(criterioSiguiente.urlImagen)" 
                  class="w-full h-full object-cover grayscale mix-blend-multiply group-hover:grayscale-0 group-hover:mix-blend-normal transition-all duration-500"
                />
                <div v-else class="w-full h-full andean-pattern flex items-center justify-center opacity-60">
                   <span class="material-symbols-outlined text-2xl text-primary/30">image</span>
                </div>
              </div>
            </div>
            
            <div v-else class="glass-panel rounded-2xl p-6 flex flex-col items-center justify-center text-center bg-emerald-50 border-2 border-emerald-200 text-emerald-800">
              <span class="material-symbols-outlined text-4xl text-emerald-500 mb-2">task_alt</span>
              <p class="font-black text-sm uppercase tracking-widest">Último Criterio</p>
              <p class="text-xs font-medium mt-1 text-emerald-600/80">Estás en el paso final.</p>
            </div>

            <!-- Tareas Recientes / Observaciones (Opcional visualmente) -->
            <div class="glass-panel rounded-2xl bg-white border-2 border-slate-100 p-5 mt-auto">
                <p class="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-3 flex items-center gap-1">
                  <span class="material-symbols-outlined text-[14px]">info</span> Criterios Evaluados
                </p>
                <div class="space-y-2">
                  <div v-for="(c, idx) in criterios" :key="c.idCriterio" 
                    class="flex items-center justify-between p-2 rounded-lg"
                    :class="formValues[c.idCriterio] != null ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-50 text-slate-400'"
                  >
                    <div class="flex items-center gap-2 truncate">
                      <span class="material-symbols-outlined text-[14px]">{{ formValues[c.idCriterio] != null ? 'check_circle' : 'radio_button_unchecked' }}</span>
                      <span class="text-xs font-bold truncate max-w-[120px]">{{ idx + 1 }}. {{ c.nombre }}</span>
                    </div>
                    <span class="text-xs font-black">{{ formValues[c.idCriterio] ?? '-' }} / {{ Number(c.puntajeMaximo) }}</span>
                  </div>
                </div>
            </div>

          </div>
        </div>
      </template>

      <!-- Fallback general -->
      <div v-else class="text-center py-20 bg-white rounded-3xl border border-slate-200 shadow-sm w-full">
        <span class="material-symbols-outlined text-5xl text-slate-300">inventory_2</span>
        <p class="mt-4 font-bold text-slate-600 text-lg">No existen criterios definidos para esta fase.</p>
        <button @click="$emit('volver')" class="mt-6 px-6 py-2 bg-slate-100 text-slate-700 font-bold rounded-lg hover:bg-slate-200">Volver al Listado</button>
      </div>

    </main>

    <!-- MODAL RESUMEN FINAL -->
    <v-dialog v-model="modalResumen" max-width="500px" persistent scrollable>
      <v-card class="rounded-3xl border-4 border-secondary overflow-hidden">
        <v-card-title class="bg-secondary text-white pa-6 text-center flex flex-col items-center shrink-0">
          <span class="material-symbols-outlined text-5xl mb-2 opacity-90">verified_user</span>
          <h3 class="text-2xl font-black italic uppercase tracking-tighter shadow-sm">Confirmar Acta</h3>
          <p class="text-xs text-white/80 font-medium tracking-wide mt-1 uppercase">Revisión Final de Calificaciones</p>
        </v-card-title>
        
        <v-card-text class="pa-0 bg-slate-50 flex-grow-1 overflow-y-auto" style="max-height: 60vh;">
          <!-- Total grande -->
          <div class="bg-white border-b border-slate-200 p-8 text-center flex flex-col items-center">
            <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Puntaje Total Calculado</p>
            <div class="flex items-end justify-center gap-1">
              <span class="text-6xl font-black text-slate-900 italic tracking-tighter">{{ puntajeCalculado }}</span>
              <span class="text-xl text-slate-500 font-bold mb-1.5">/ {{ puntajePosible }} pts</span>
            </div>
          </div>

          <!-- Desglose -->
          <div class="p-6">
            <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 text-center">Desglose por Criterio</p>
            <div class="space-y-2">
              <div v-for="(c, idx) in criterios" :key="c.idCriterio" class="flex justify-between items-center p-3 bg-white border border-slate-200 rounded-xl">
                <div class="flex items-center gap-3">
                  <span class="size-6 bg-slate-100 text-slate-500 rounded font-black text-xs flex items-center justify-center">{{ idx + 1 }}</span>
                  <span class="font-bold text-sm text-slate-700">{{ c.nombre }}</span>
                </div>
                <div class="font-black text-primary text-lg">
                  {{ formValues[c.idCriterio] ?? '0' }} <span class="text-xs text-slate-400 font-bold">/ {{ Number(c.puntajeMaximo) }}</span>
                </div>
              </div>
            </div>
          </div>
          
          <div class="px-6 pb-6 text-center">
             <div class="bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold p-3 rounded-xl flex items-center gap-2">
               <span class="material-symbols-outlined text-amber-500">warning</span>
               Al "Sellar", el acta se cierra y ya no podrás modificar estas calificaciones.
             </div>
          </div>
        </v-card-text>

        <v-card-actions class="pa-6 bg-white border-t border-slate-200 flex gap-4">
          <button @click="modalResumen = false" class="flex-1 py-3 text-slate-500 font-bold hover:bg-slate-50 rounded-xl transition-colors border-2 border-transparent hover:border-slate-200">
            Revisar
          </button>
          <button @click="confirmarSello" :disabled="saving" class="flex-1 bg-secondary text-white font-black py-3 rounded-xl uppercase tracking-widest text-xs flex items-center justify-center gap-2 shadow-lg shadow-secondary/30 hover:bg-red-800 transition-colors">
             <span v-if="saving" class="material-symbols-outlined animate-spin text-sm">sync</span>
             <span v-else class="material-symbols-outlined text-sm">lock</span>
             Sellar Definitivo
          </button>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <PdfViewerModal
      v-if="visorMonografiaAbierto && monografiaFraternidad"
      :url="getImageUrl(monografiaFraternidad.urlArchivo)"
      :titulo="`Monografía —  ${fraternidad?.nombre || ''}`"
      @cerrar="visorMonografiaAbierto = false"
    />

  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { notify } from '../utils/notify'
import Swal from 'sweetalert2'
import api from '../services/api'

import { getImageUrl } from '../utils/url'
import PdfViewerModal from '../components/PdfViewerModal.vue'

const props = defineProps({
  faseSeleccionada: {
    type: Object,
    required: true
  },
  fraternidad: {
    type: Object,
    required: false,
    default: null
  },
  participanteNombre: {
    type: String,
    default: null
  },
  participanteTipo: {
    type: String,
    default: null
  },
  participanteId: {
    type: Number,
    default: null
  }
})
const emit = defineEmits(['volver', 'finalizar'])

const loading = ref(true)
const saving = ref(false)
const criterios = ref([])
const formValues = ref({}) 
const estadoOriginal = ref('PENDIENTE')

// Wizard State
const criterioActualIndex = ref(0)
const totalCriterios = computed(() => criterios.value.length)
const criterioActual = computed(() => criterios.value[criterioActualIndex.value] || null)
const criterioSiguiente = computed(() => criterios.value[criterioActualIndex.value + 1] || null)

const porcentajeProgreso = computed(() => {
  if (totalCriterios.value === 0) return 0
  return Math.round(((criterioActualIndex.value + 1) / totalCriterios.value) * 100)
})

const criteriosLlenados = computed(() => {
  return criterios.value.filter(c => {
    const val = formValues.value[c.idCriterio]
    return val !== null && val !== undefined && val !== ''
  }).length
})

// Modal Resumen
const modalResumen = ref(false)

// Cronómetro
// Monografía (fase MONOGRAFIA)
const esFaseMonografia = computed(() => {
  const f = props.faseSeleccionada
  if (!f) return false
  if (f.categoriaEfu === 'MONOGRAFIA') return true
  return (f.nombre || '').toLowerCase().includes('monograf')
})
const monografiaFraternidad = ref(null)
const visorMonografiaAbierto = ref(false)
const cargandoMonografia = ref(false)

const abrirMonografia = async () => {
  if (!props.fraternidad?.idFraternidad) return
  cargandoMonografia.value = true
  try {
    const res = await api.get(`/monografias/fraternidad/${props.fraternidad.idFraternidad}`)
    monografiaFraternidad.value = res.data
    visorMonografiaAbierto.value = true
  } catch (error) {
    notify.warning(
      'Sin monografía',
      error.response?.data?.message || 'Esta fraternidad aún no ha subido su monografía.',
    )
  } finally {
    cargandoMonografia.value = false
  }
}

const tiempoRestante = ref(0)
let timerInterval = null

const cargarDatos = async () => {
  loading.value = true
  try {
    const resCriterios = await api.get(`/evaluaciones/fase/${props.faseSeleccionada.idFase}/criterios`)
    criterios.value = resCriterios.data
    criterios.value.forEach(c => { formValues.value[c.idCriterio] = null })

    let resEval;
    if (props.participanteId) {
      resEval = await api.get(`/evaluaciones/fase/${props.faseSeleccionada.idFase}/participante/${props.participanteId}/evaluacion`)
    } else if (props.fraternidad) {
      resEval = await api.get(`/evaluaciones/fase/${props.faseSeleccionada.idFase}/fraternidades/${props.fraternidad.idFraternidad}/evaluacion`)
    }

    if (resEval && resEval.data) {
      estadoOriginal.value = resEval.data.estado
      const jsonb = resEval.data.criteriosEvaluados
      if (jsonb) {
        Object.keys(jsonb).forEach(key => { formValues.value[key] = jsonb[key] })
      }
    }
    
    const parseSafeDate = (d, isEnd = true) => {
      if (!d) return null
      const datePart = typeof d === 'string' ? d.split('T')[0].split(' ')[0] : ''
      if (!datePart) return new Date(d)
      const parts = datePart.split('-')
      if (parts.length === 3) {
        const year = parseInt(parts[0], 10)
        const month = parseInt(parts[1], 10) - 1
        const day = parseInt(parts[2], 10)
        if (isEnd) return new Date(year, month, day, 23, 59, 59, 999)
        return new Date(year, month, day, 0, 0, 0, 0)
      }
      return new Date(d)
    }

    const fechaFin = parseSafeDate(props.faseSeleccionada?.fechaFin, true)
    if (fechaFin) {
      iniciarCronometro(fechaFin)
    }
  } catch (error) {
    notify.error('Error', 'Problema al cargar la evaluación.')
    emit('volver')
  } finally {
    loading.value = false
  }
}

const validarPuntaje = (criterio) => {
  const id = criterio.idCriterio
  let val = formValues.value[id]
  const max = Number(criterio.puntajeMaximo)
  
  if (val === null || val === undefined || val === '') return

  if (isNaN(val) || val < 0) {
    formValues.value[id] = 0
  } else if (val > max) {
    formValues.value[id] = max
  }
}

const pasoSiguiente = () => {
  // Opcional: auto-guardar borrador al pasar
  if (criterioActualIndex.value < totalCriterios.value - 1) {
    criterioActualIndex.value++
  }
}
const pasoAnterior = () => {
  if (criterioActualIndex.value > 0) {
    criterioActualIndex.value--
  }
}

const abrirResumenModal = () => {
  const sinLlenar = criterios.value.some(c => {
    const v = formValues.value[c.idCriterio]
    return v === null || v === undefined || v === ''
  })
  const superaLimites = criterios.value.some(c => {
    const v = formValues.value[c.idCriterio]
    return Number(v) > Number(c.puntajeMaximo) || Number(v) < 0
  })

  if (sinLlenar) {
    notify.warning('Atención', 'Asegúrate de llenar todos los criterios antes de finalizar.')
    return
  }
  if (superaLimites) {
    notify.error('Error', 'Existen puntajes fuera del rango permitido.')
    return
  }
  
  modalResumen.value = true
}

const confirmarSello = async () => {
  await guardar(true)
  modalResumen.value = false
}

// Stats & Guardado
const puntajeCalculado = computed(() => {
  return Object.values(formValues.value).reduce((t, val) => t + (Number(val) || 0), 0)
})

const puntajePosible = computed(() => criterios.value.reduce((a, c) => a + Number(c.puntajeMaximo), 0))

const guardar = async (finalizar = false) => {
  saving.value = true
  const payloadCriterios = {}
  Object.keys(formValues.value).forEach(k => {
    if (formValues.value[k] !== null && formValues.value[k] !== '') {
      payloadCriterios[k] = formValues.value[k]
    }
  })

  try {
    await api.post('/evaluaciones/guardar', {
      idFase: props.faseSeleccionada.idFase,
      idFraternidad: props.fraternidad ? props.fraternidad.idFraternidad : null,
      idParticipante: props.participanteId,
      criterios: payloadCriterios,
      finalizar
    })

    if (finalizar) {
      notify.success('Acta Cerrada', 'La calificación se oficializó correctamente.')
      estadoOriginal.value = 'COMPLETADO'
      emit('finalizar', { promedio: puntajeCalculado.value })
    } else {
      notify.success('Progreso Guardado', 'Los cambios se almacenaron como borrador.')
      estadoOriginal.value = 'EN_PROGRESO'
    }
  } catch (error) {
    notify.error('Error', error.response?.data?.message || 'Falló el guardado')
  } finally {
    saving.value = false
  }
}

// Timer
const iniciarCronometro = (fechaFin) => {
  if (!fechaFin || isNaN(fechaFin.getTime())) return
  const actualizar = () => {
    const agora = new Date().getTime()
    const fin = fechaFin.getTime()
    tiempoRestante.value = Math.max(0, fin - agora)
  }
  actualizar()
  timerInterval = setInterval(actualizar, 1000)
}
const countdownText = computed(() => {
  if (isNaN(tiempoRestante.value) || tiempoRestante.value <= 0) return 'FINALIZADO'
  const horas = Math.floor(tiempoRestante.value / (1000 * 60 * 60))
  const min = Math.floor((tiempoRestante.value % (1000 * 60 * 60)) / (1000 * 60))
  return `${horas} H / ${min} M`
})
const urgenciaStatus = computed(() => {
  if (isNaN(tiempoRestante.value)) return { textClass: 'text-slate-400 bg-slate-50' }
  const horas = Math.floor(tiempoRestante.value / (1000 * 60 * 60))
  if (horas < 1) return { textClass: 'text-secondary bg-red-50' }
  return { textClass: 'text-primary bg-blue-50' }
})

onMounted(() => cargarDatos())
onUnmounted(() => { if (timerInterval) clearInterval(timerInterval) })
</script>

<style scoped>
.wizard-gradient {
  background: radial-gradient(circle at top right, #fdfdfd 0%, #f1f5f9 100%);
  background-attachment: fixed;
}
.glass-panel {
  background: rgba(255, 255, 255, 1);
  box-shadow: 0 10px 30px -5px rgba(0, 51, 153, 0.08);
}
.glow-blue {
  box-shadow: 0 4px 15px rgba(0, 51, 153, 0.25);
}

/* Custom Range Input */
input[type=range].custom-range::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 24px;
  height: 24px;
  background: #003399; /* Primary Blue */
  cursor: pointer;
  border-radius: 50%;
  border: 3px solid white;
  box-shadow: 0 0 10px rgba(0, 51, 153, 0.3);
  transition: transform 0.1s ease;
}
input[type=range].custom-range::-webkit-slider-thumb:hover {
  transform: scale(1.1);
  background: #E30613; /* Secondary Red pulse */
}
input[type=range].custom-range::-moz-range-thumb {
  width: 24px;
  height: 24px;
  background: #003399;
  cursor: pointer;
  border-radius: 50%;
  border: 3px solid white;
  box-shadow: 0 0 10px rgba(0, 51, 153, 0.3);
}

.andean-pattern {
  background-color: transparent;
  background-image: linear-gradient(rgba(255,255,255,0.7), rgba(255,255,255,0.7)), url('@/assets/img/Textura-Andina.png');
  background-repeat: repeat;
  background-size: 200px;
}
</style>
