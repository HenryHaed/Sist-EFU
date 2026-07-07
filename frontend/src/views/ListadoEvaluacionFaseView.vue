<template>
  <div class="relative min-h-full flex flex-col bg-slate-50">
    <div class="dashboard-sticky-header flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
      <div class="flex items-center gap-4">
        <button @click="$emit('volver')" class="size-10 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl flex items-center justify-center transition-colors">
          <span class="material-symbols-outlined">arrow_back</span>
        </button>
        <div>
          <h2 class="text-xl font-black text-primary uppercase italic tracking-tighter">{{ fase?.nombre || 'Cargando...' }}</h2>
          <p class="text-xs text-slate-500 font-medium">Listado oficial de fraternidades habilitadas</p>
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
    <div class="flex-1 dashboard-page max-w-7xl">
      <div v-if="loading" class="flex justify-center py-20">
        <span class="material-symbols-outlined animate-spin text-4xl text-primary">progress_activity</span>
      </div>

      <div v-else class="bg-white rounded-3xl overflow-hidden border border-slate-200 shadow-sm">
        
        <!-- Vista Desktop (Tabla) -->
        <div class="hidden md:block overflow-x-auto">
          <table class="w-full text-left text-sm">
            <thead class="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-black text-[10px]">
              <tr>
                <th class="px-6 py-4">Fraternidad</th>
                <th class="px-6 py-4 text-center">Estado Evaluación</th>
                <th class="px-6 py-4 text-center">Puntaje</th>
                <th class="px-6 py-4">Tiempos Registrados</th>
                <th class="px-6 py-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr v-for="item in fraternidades" :key="item.idFraternidad" class="hover:bg-slate-50 transition-colors">
                <td class="px-6 py-4">
                  <p class="font-bold text-primary">{{ item.nombre }}</p>
                  <p class="text-xs text-slate-500">{{ item.categoria || 'Sin Categoría' }}</p>
                  
                  <!-- LISTADO DE PENALIZACIONES (Solo en Disciplina) -->
                  <div v-if="item.penalizaciones && item.penalizaciones.length > 0" class="mt-2 flex flex-wrap gap-1">
                    <div v-for="p in item.penalizaciones" :key="p.idIncidencia" 
                      class="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-red-50 border border-red-100 text-[9px] font-bold text-red-700"
                    >
                      <span class="material-symbols-outlined text-[10px]">warning</span>
                      {{ p.nombre }}
                      <button v-if="authStore.userRole === 'admin' || authStore.userRole === 'superusuario'"
                        @click="removerPenalizacion(item, p.idIncidencia)"
                        class="ml-1 hover:text-red-900"
                        title="Remover (Solo Admin)"
                      >
                        <span class="material-symbols-outlined text-[12px]">close</span>
                      </button>
                    </div>
                  </div>
                </td>
                
                <td class="px-6 py-4 text-center">
                  <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold"
                    :class="{
                      'bg-slate-100 text-slate-600': item.estadoEvaluacion === 'PENDIENTE',
                      'bg-amber-100 text-amber-700': item.estadoEvaluacion === 'EN_PROGRESO',
                      'bg-emerald-100 text-emerald-700': item.estadoEvaluacion === 'COMPLETADO'
                    }"
                  >
                    <span class="material-symbols-outlined text-[14px]">
                      {{ item.estadoEvaluacion === 'PENDIENTE' ? 'hourglass_empty' : (item.estadoEvaluacion === 'EN_PROGRESO' ? 'sync' : 'check_circle') }}
                    </span>
                    {{ item.estadoEvaluacion.replace('_', ' ') }}
                  </div>
                </td>

                <td class="px-6 py-4 text-center">
                  <div class="text-lg font-black text-primary">
                    {{ item.puntajeActual || 0 }} <span class="text-[10px] text-slate-400">pts</span>
                  </div>
                </td>

                <td class="px-6 py-4">
                  <div v-if="item.fechaApertura" class="text-xs text-slate-500 flex flex-col gap-1">
                    <p><span class="font-bold">Inició:</span> {{ formatearHora(item.fechaApertura) }}</p>
                    <p v-if="item.fechaCierre"><span class="font-bold">Finalizó:</span> {{ formatearHora(item.fechaCierre) }}</p>
                  </div>
                  <p v-else class="text-xs text-slate-400 italic">No iniciada</p>
                </td>

                <td class="px-6 py-4 text-right space-x-2 whitespace-nowrap">
                  <!-- Botones PDF (Solo si existe un PDF) -->
                  <template v-if="item.urlPdf">
                    <button 
                      @click="verPdf(item.urlPdf, item.nombre)"
                      title="Ver PDF Embebido"
                      class="inline-flex size-9 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-colors"
                    >
                      <span class="material-symbols-outlined text-[20px]">visibility</span>
                    </button>
                    <a 
                      :href="getImageUrl(item.urlPdf)" target="_blank" download
                      title="Descargar PDF"
                      class="inline-flex size-9 items-center justify-center rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
                    >
                      <span class="material-symbols-outlined text-[20px]">download</span>
                    </a>
                  </template>

                  <!-- Botón Principal de Calificar -->
                  <button 
                    @click="iniciarEvaluacion(item)"
                    :disabled="item.estadoEvaluacion === 'COMPLETADO' || tiempoRestante <= 0"
                    class="inline-flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-xs transition-colors"
                    :class="(item.estadoEvaluacion === 'COMPLETADO' || tiempoRestante <= 0)
                      ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                      : (item.estadoEvaluacion === 'EN_PROGRESO' ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-md' : 'bg-primary hover:bg-blue-900 text-white shadow-md')"
                  >
                    {{ (item.estadoEvaluacion === 'COMPLETADO' || tiempoRestante <= 0) ? (tiempoRestante <= 0 ? 'Fase Cerrada' : 'Nota Sellada') : (item.estadoEvaluacion === 'EN_PROGRESO' ? 'Continuar Eval.' : 'Iniciar Eval.') }}
                    <span v-if="item.estadoEvaluacion !== 'COMPLETADO' && tiempoRestante > 0" class="material-symbols-outlined text-[16px]">
                      {{ item.estadoEvaluacion === 'EN_PROGRESO' ? 'play_arrow' : 'edit_document' }}
                    </span>
                    <span v-else class="material-symbols-outlined text-[16px]">lock</span>
                  </button>

                  <!-- BOTONES DE DISCIPLINA (Solo si es fase de disciplina) -->
                  <template v-if="fase?.nombre?.toLowerCase().includes('disciplina')">
                    <button 
                      @click="aplicarPenalizacion(item, 'AMARILLA')"
                      title="Bandera Amarilla (-1 pto)"
                      class="inline-flex size-9 items-center justify-center rounded-lg bg-yellow-400 text-white hover:brightness-110 shadow-sm"
                    >
                      <span class="material-symbols-outlined text-[20px]">flag</span>
                    </button>
                    <button 
                      @click="aplicarPenalizacion(item, 'ROJA')"
                      title="Bandera Roja (-2 ptos)"
                      class="inline-flex size-9 items-center justify-center rounded-lg bg-red-600 text-white hover:brightness-110 shadow-sm"
                    >
                      <span class="material-symbols-outlined text-[20px]">flag</span>
                    </button>
                    <button 
                      @click="abrirSanciones(item)"
                      title="Sanciones Graves"
                      class="inline-flex h-9 items-center gap-2 px-3 rounded-lg bg-slate-900 text-white hover:bg-black shadow-sm transition-all"
                    >
                      <span class="material-symbols-outlined text-[18px]">gavel</span>
                      <span class="text-[10px] font-black uppercase tracking-widest">Sanciones</span>
                    </button>
                  </template>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Vista Mobile (Tarjetas) -->
        <div class="md:hidden p-4 space-y-4">
          <div v-for="item in fraternidades" :key="item.idFraternidad + '_mobile'" class="bg-slate-50 border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col gap-4 relative overflow-hidden">
            <!-- Indicador lateral estado -->
            <div class="absolute left-0 top-0 bottom-0 w-1.5"
                 :class="{
                   'bg-slate-300': item.estadoEvaluacion === 'PENDIENTE',
                   'bg-amber-500': item.estadoEvaluacion === 'EN_PROGRESO',
                   'bg-emerald-500': item.estadoEvaluacion === 'COMPLETADO'
                 }"
            ></div>

            <div class="flex justify-between items-start pl-2">
              <div>
                <p class="font-black text-primary text-base">{{ item.nombre }}</p>
                <p class="text-xs text-slate-500">{{ item.categoria || 'Sin Categoría' }}</p>
              </div>
              <div class="text-right">
                <p class="text-xl font-black text-primary">{{ item.puntajeActual || 0 }}</p>
                <p class="text-[10px] text-slate-400 font-bold uppercase">pts</p>
              </div>
            </div>

            <div class="flex flex-wrap gap-2 pl-2">
              <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest"
                :class="{
                  'bg-white text-slate-600 border border-slate-200': item.estadoEvaluacion === 'PENDIENTE',
                  'bg-amber-100 text-amber-700 border border-amber-200': item.estadoEvaluacion === 'EN_PROGRESO',
                  'bg-emerald-100 text-emerald-700 border border-emerald-200': item.estadoEvaluacion === 'COMPLETADO'
                }"
              >
                <span class="material-symbols-outlined text-[14px]">
                  {{ item.estadoEvaluacion === 'PENDIENTE' ? 'hourglass_empty' : (item.estadoEvaluacion === 'EN_PROGRESO' ? 'sync' : 'check_circle') }}
                </span>
                {{ item.estadoEvaluacion.replace('_', ' ') }}
              </div>
            </div>
            
            <!-- ACCIONES DISCIPLINA MOBILE -->
            <div v-if="fase?.nombre?.toLowerCase().includes('disciplina')" class="flex items-center gap-2 pl-2">
              <button @click="aplicarPenalizacion(item, 'AMARILLA')" class="flex-1 py-2 rounded-xl bg-yellow-400 text-white flex items-center justify-center shadow-sm">
                <span class="material-symbols-outlined text-[18px]">flag</span>
              </button>
              <button @click="aplicarPenalizacion(item, 'ROJA')" class="flex-1 py-2 rounded-xl bg-red-600 text-white flex items-center justify-center shadow-sm">
                <span class="material-symbols-outlined text-[18px]">flag</span>
              </button>
              <button @click="abrirSanciones(item)" class="flex-[2] py-2 rounded-xl bg-slate-900 text-white flex items-center justify-center gap-2 font-black text-[10px] uppercase tracking-widest shadow-sm">
                <span class="material-symbols-outlined text-[18px]">gavel</span>
                Sanciones
              </button>
            </div>

            <div v-if="item.fechaApertura" class="text-[10px] text-slate-500 bg-white p-2 rounded-lg border border-slate-100 pl-2">
              <div class="flex justify-between"><span class="font-bold">Inició:</span> <span>{{ formatearHora(item.fechaApertura) }}</span></div>
              <div class="flex justify-between mt-1" v-if="item.fechaCierre"><span class="font-bold">Finalizó:</span> <span>{{ formatearHora(item.fechaCierre) }}</span></div>
            </div>

            <div class="flex items-center gap-2 pt-2 border-t border-slate-200 mt-2 pl-2">
              <!-- Botones PDF Mobile -->
              <template v-if="item.urlPdf">
                <button @click="verPdf(item.urlPdf, item.nombre)" class="flex-1 inline-flex items-center justify-center gap-1 py-2.5 rounded-xl bg-indigo-50 text-indigo-600 font-bold text-xs border border-indigo-100 hover:bg-indigo-100">
                  <span class="material-symbols-outlined text-[16px]">visibility</span>
                </button>
              </template>
              
              <!-- Evaluar Mobile -->
              <button 
                @click="iniciarEvaluacion(item)"
                :disabled="item.estadoEvaluacion === 'COMPLETADO' || tiempoRestante <= 0"
                class="flex-[3] inline-flex justify-center items-center gap-2 py-2.5 rounded-xl font-bold text-xs transition-all uppercase tracking-widest"
                :class="(item.estadoEvaluacion === 'COMPLETADO' || tiempoRestante <= 0)
                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200' 
                  : (item.estadoEvaluacion === 'EN_PROGRESO' ? 'bg-amber-500 text-white shadow-md' : 'bg-primary text-white shadow-md shadow-primary/20')"
              >
                {{ (item.estadoEvaluacion === 'COMPLETADO' || tiempoRestante <= 0) ? 'Cerrada' : 'Evaluar' }}
                <span v-if="item.estadoEvaluacion !== 'COMPLETADO' && tiempoRestante > 0" class="material-symbols-outlined text-[16px]">
                  {{ item.estadoEvaluacion === 'EN_PROGRESO' ? 'play_arrow' : 'edit_document' }}
                </span>
                <span v-else class="material-symbols-outlined text-[16px]">lock</span>
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>

    <!-- VISOR PDF COMPONENTE -->
    <PdfViewerModal 
      v-if="visorPdfAbierto" 
      :url="pdfUrlActual" 
      :titulo="pdfTituloActual"
      @cerrar="visorPdfAbierto = false" 
    />

    <!-- MODAL DE SANCIONES GRAVES -->
    <v-dialog v-model="modalSanciones" max-width="600" persistent>
      <v-card class="rounded-2xl overflow-hidden border-4 border-slate-900">
        <div class="bg-slate-900 p-6 text-white text-center relative">
          <button @click="modalSanciones = false" class="absolute right-4 top-4 size-8 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors">
            <span class="material-symbols-outlined text-xl text-white">close</span>
          </button>
          <div class="size-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-white/20">
            <span class="material-symbols-outlined text-4xl text-red-500">warning</span>
          </div>
          <h3 class="text-2xl font-black italic uppercase tracking-tighter">Sanciones de Disciplina</h3>
          <p class="text-white/60 text-xs font-bold mt-1">{{ fraternidadParaSancion?.nombre }}</p>
        </div>

        <v-card-text class="pa-8 bg-white">
          <p class="text-slate-500 text-sm mb-6">Seleccione una sanción grave según el reglamento de disciplina. <b>Estas acciones son irreversibles</b> y afectan directamente la participación de la fraternidad.</p>
          
          <div class="grid gap-3">
            <button v-for="s in sancionesReglamento" :key="s.id"
              @click="preconfirmarSancion(s)"
              class="w-full p-4 rounded-xl border border-slate-200 hover:border-red-500 hover:bg-red-50 text-left transition-all flex items-center gap-4 group"
            >
              <div class="size-10 rounded-lg bg-slate-100 group-hover:bg-red-100 flex items-center justify-center text-slate-400 group-hover:text-red-600">
                <span class="material-symbols-outlined">{{ s.icono }}</span>
              </div>
              <div class="flex-1">
                <p class="text-sm font-black text-slate-800">{{ s.titulo }}</p>
                <p class="text-[10px] text-slate-500 uppercase tracking-widest font-bold">{{ s.penalidad }}</p>
              </div>
              <span class="material-symbols-outlined text-slate-300 group-hover:text-red-400">chevron_right</span>
            </button>
          </div>
        </v-card-text>

        <v-card-actions class="pa-6 bg-slate-50 border-t border-slate-100">
          <v-btn block height="48" variant="tonal" color="slate" class="rounded-xl font-bold" @click="modalSanciones = false">Cancelar</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- MODAL DE CONFIRMACIÓN CON CUENTA REGRESIVA -->
    <v-dialog v-model="modalConfirmacion" max-width="450" persistent>
      <v-card class="rounded-2xl border-4 border-red-600">
        <div class="bg-red-600 p-6 text-white text-center">
          <h3 class="text-2xl font-black italic uppercase tracking-tighter">¿Está Seguro?</h3>
          <p class="text-white/80 text-xs font-bold mt-2">ESTA ACCIÓN NO SE PUEDE DESHACER</p>
        </div>
        
        <v-card-text class="pa-8 text-center bg-white">
          <p class="text-slate-800 font-bold mb-2">{{ sancionSeleccionada?.titulo }}</p>
          <p class="text-slate-500 text-sm mb-6">{{ sancionSeleccionada?.descripcion }}</p>

          <div v-if="contador > 0" class="size-16 rounded-full border-4 border-slate-100 flex items-center justify-center mx-auto mb-4">
             <span class="text-2xl font-black text-primary">{{ contador }}</span>
          </div>
          <p v-if="contador > 0" class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Espere para confirmar...</p>
        </v-card-text>

        <v-card-actions class="pa-6 pt-0 bg-white flex flex-col gap-2">
          <button
            :disabled="contador > 0 || cargandoSancion"
            @click="confirmarSancion"
            class="w-full h-[52px] rounded-xl font-black shadow-lg transition-all flex items-center justify-center text-sm uppercase tracking-widest"
            :class="contador > 0 
              ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
              : 'bg-red-600 text-white hover:bg-red-700 active:scale-95'"
          >
            {{ cargandoSancion ? 'Aplicando...' : 'Confirmar Sanción' }}
          </button>
          
          <button 
            @click="modalConfirmacion = false"
            class="w-full h-[48px] text-slate-500 font-bold text-sm hover:text-slate-800 transition-colors"
          >
            Arrepentirse y Cancelar
          </button>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import Swal from 'sweetalert2'
import api from '../services/api'
import PdfViewerModal from '../components/PdfViewerModal.vue'
import { getImageUrl } from '../utils/url'
import { useAuthStore } from '../store/auth'

const authStore = useAuthStore()
const props = defineProps({
  faseSeleccionada: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['volver', 'evaluar-fraternidad'])

const fase = ref(null)
const fraternidades = ref([])
const loading = ref(true)

// Temporizador Regresivo Global
const tiempoRestante = ref(0)
let timerInterval = null

// PDF Visor
const visorPdfAbierto = ref(false)
const pdfUrlActual = ref('')
const pdfTituloActual = ref('')

// Disciplina / Sanciones
const modalSanciones = ref(false)
const modalConfirmacion = ref(false)
const fraternidadParaSancion = ref(null)
const sancionSeleccionada = ref(null)
const contador = ref(5)
const cargandoSancion = ref(false)
let countdownInterval = null

const sancionesReglamento = [
  { id: 'SANCION_ALCOHOL', titulo: 'Consumo de Bebidas Alcohólicas', penalidad: 'Puntaje 0 en Disciplina', icono: 'local_bar', descripcion: 'Se ha detectado consumo de alcohol por parte de los integrantes durante el recorrido.', tipo: 'SANCION_ALCOHOL' },
  { id: 'SANCION_AGRESION', titulo: 'Mostrar Agresividad', penalidad: 'Suspensión de 1 año', icono: 'person_off', descripcion: 'Comportamiento violento o agresivo hacia el público o personal de la UMSA.', tipo: 'SANCION_AGRESION' },
  { id: 'SANCION_BANDA', titulo: 'Exceso de Bandas/Músicos', penalidad: 'Puntaje 0 en Disciplina', icono: 'music_off', descripcion: 'Más de 2 bandas de 80 músicos cada una o exceso de personal musical permitido.', tipo: 'SANCION_BANDA' },
  { id: 'SANCION_AJENO', titulo: 'Personal ajeno a la UMSA', penalidad: 'Suspensión de 1 año', icono: 'group_remove', descripcion: 'Se detectó personal externo no perteneciente a la universidad dentro de las filas.', tipo: 'SANCION_AJENO' }
]

const cargarFaseData = async () => {
  loading.value = true
  try {
    const { data } = await api.get(`/evaluaciones/fase/${props.faseSeleccionada.idFase}/fraternidades`)
    fase.value = data.fase
    fraternidades.value = data.listado
    
    const parseSafeDate = (d, isEnd = true) => {
      if (!d) return null
      const datePart = typeof d === 'string' ? d.split('T')[0].split(' ')[0] : ''
      if (!datePart) return new Date(d)
      
      const parts = datePart.split('-')
      if (parts.length === 3) {
        const year = parseInt(parts[0], 10)
        const month = parseInt(parts[1], 10) - 1
        const day = parseInt(parts[2], 10)
        if (isEnd) {
          return new Date(year, month, day, 23, 59, 59, 999)
        }
        return new Date(year, month, day, 0, 0, 0, 0)
      }
      return new Date(d)
    }

    const fechaFin = parseSafeDate(props.faseSeleccionada.fechaFin, true)
    if (fechaFin) {
      iniciarCronometro(fechaFin)
    }
    lanzarModalBienvenida(props.faseSeleccionada)
  } catch (err) {
    Swal.fire('Error', 'No se pudo cargar el listado. Intente de nuevo.', 'error')
    emit('volver')
  } finally {
    loading.value = false
  }
}

const iniciarCronometro = (fechaFin) => {
  if (!fechaFin || isNaN(fechaFin.getTime())) return
  const actualizar = () => {
    const ahora = new Date().getTime()
    const fin = fechaFin.getTime()
    tiempoRestante.value = Math.max(0, fin - ahora)
  }
  
  actualizar() // primera vez
  timerInterval = setInterval(actualizar, 1000)
}

const countdownText = computed(() => {
  if (isNaN(tiempoRestante.value) || tiempoRestante.value <= 0) return 'TIEMPO FINALIZADO'
  
  const dias = Math.floor(tiempoRestante.value / (1000 * 60 * 60 * 24))
  const horas = Math.floor((tiempoRestante.value % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const min = Math.floor((tiempoRestante.value % (1000 * 60 * 60)) / (1000 * 60))
  return `${dias} Días / ${horas} Hrs / ${min} Min`
})

const urgenciaStatus = computed(() => {
  if (isNaN(tiempoRestante.value)) return { bgClass: 'bg-slate-50 border-slate-200', textClass: 'text-slate-400' }
  const dias = Math.floor(tiempoRestante.value / (1000 * 60 * 60 * 24))
  if (dias <= 1) return { bgClass: 'bg-secondary/10 border-secondary', textClass: 'text-secondary' }
  if (dias <= 2) return { bgClass: 'bg-orange-50 border-orange-200', textClass: 'text-orange-600' }
  return { bgClass: 'bg-emerald-50 border-emerald-200', textClass: 'text-emerald-700' }
})

const lanzarModalBienvenida = (faseInfo) => {
  // Solo lanzamos si "no ha sido vista" en sesion actual. Usar sessionStorage
  const key = `fase_bienvenida_${faseInfo.idFase}`
  if (!sessionStorage.getItem(key)) {
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
    const fInicio = parseSafeDate(props.faseSeleccionada.fechaInicio, false)
    const fFin = parseSafeDate(props.faseSeleccionada.fechaFin, true)
    
    const inicioFmt = fInicio ? fInicio.toLocaleDateString() : 'Pendiente'
    const finFmt = fFin ? fFin.toLocaleDateString() : 'Pendiente'
    
    Swal.fire({
      icon: 'info',
      title: `Bienvenido a la Evaluación`,
      html: `Tienes desde el <b>${inicioFmt}</b> hasta el <b>${finFmt}</b> para completar la calificación.<br><br>Una vez finalizado este periodo, el acceso será restringido.`,
      confirmButtonColor: '#003399',
      confirmButtonText: 'Entendido'
    }).then(() => {
      sessionStorage.setItem(key, 'true')
    })
  }
}

const formatearHora = (fechaString) => {
  return new Date(fechaString).toLocaleString('es-BO', {
    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
  })
}

const verPdf = (url, titulo) => {
  pdfUrlActual.value = getImageUrl(url)
  pdfTituloActual.value = titulo
  visorPdfAbierto.value = true
}

const iniciarEvaluacion = (fraternidad) => {
  // Emitimos el evento hacia el Dashboard superior para cambiar la vista al Wizard
  emit('evaluar-fraternidad', {
    fase: fase.value,
    fraternidad,
    idEvaluacionGuardada: fraternidad.idEvaluacion
  })
}

// LÓGICA DE DISCIPLINA
const aplicarPenalizacion = async (fraternidad, tipo) => {
  const result = await Swal.fire({
    title: tipo === 'AMARILLA' ? '¿Bandera Amarilla?' : '¿Bandera Roja?',
    text: `Se descontarán ${tipo === 'AMARILLA' ? '1 punto' : '2 puntos'} de la nota de disciplina.`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: tipo === 'AMARILLA' ? '#facc15' : '#dc2626',
    confirmButtonText: 'Sí, aplicar penalización',
    cancelButtonText: 'Cancelar'
  })

  if (result.isConfirmed) {
    try {
      await api.post(`/evaluaciones/fase/${fase.value.idFase}/fraternidad/${fraternidad.idFraternidad}/penalizar`, { tipo })
      Swal.fire('Aplicado', 'La penalización se registró correctamente.', 'success')
      cargarFaseData() // recargar para ver el puntaje
    } catch (e) {
      Swal.fire('Error', 'No se pudo aplicar la penalización.', 'error')
    }
  }
}

const abrirSanciones = (fraternidad) => {
  fraternidadParaSancion.value = fraternidad
  modalSanciones.value = true
}

const preconfirmarSancion = (sancion) => {
  sancionSeleccionada.value = sancion
  contador.value = 5
  modalConfirmacion.value = true
  
  if (countdownInterval) clearInterval(countdownInterval)
  countdownInterval = setInterval(() => {
    contador.value--
    if (contador.value <= 0) clearInterval(countdownInterval)
  }, 1000)
}

const confirmarSancion = async () => {
  cargandoSancion.value = true
  try {
    await api.post(`/evaluaciones/fase/${fase.value.idFase}/fraternidad/${fraternidadParaSancion.value.idFraternidad}/penalizar`, { 
      tipo: sancionSeleccionada.value.tipo 
    })
    modalConfirmacion.value = false
    modalSanciones.value = false
    Swal.fire('Sanción Aplicada', 'Se ha registrado la sanción definitiva.', 'error')
    cargarFaseData()
  } catch (e) {
    Swal.fire('Error', 'No se pudo aplicar la sanción.', 'error')
  } finally {
    cargandoSancion.value = false
  }
}

const removerPenalizacion = async (fraternidad, idIncidencia) => {
  const result = await Swal.fire({
    title: '¿Remover Penalización?',
    text: 'Esta acción revertirá el descuento de puntos. Solo debe hacerse en caso de error.',
    icon: 'question',
    showCancelButton: true,
    confirmButtonColor: '#334155',
    confirmButtonText: 'Sí, remover',
    cancelButtonText: 'Cancelar'
  })

  if (result.isConfirmed) {
    try {
      await api.delete(`/evaluaciones/fase/${fase.value.idFase}/fraternidad/${fraternidad.idFraternidad}/penalizaciones/${idIncidencia}`)
      Swal.fire('Removida', 'La penalización fue eliminada.', 'success')
      cargarFaseData()
    } catch (e) {
      Swal.fire('Error', 'No se pudo remover la penalización.', 'error')
    }
  }
}

onMounted(() => {
  cargarFaseData()
})

onUnmounted(() => {
  if (timerInterval) clearInterval(timerInterval)
})
</script>
