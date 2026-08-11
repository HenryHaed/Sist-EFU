<template>
  <div class="relative min-h-full flex flex-col bg-slate-50">
    <div class="dashboard-sticky-header flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
      <div class="flex items-center gap-4">
        <button
          type="button"
          @click="onVolver"
          class="size-10 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl flex items-center justify-center transition-colors"
        >
          <span class="material-symbols-outlined">arrow_back</span>
        </button>
        <div>
          <h2 class="text-xl font-black text-primary uppercase italic tracking-tighter">{{ fase?.nombre || 'Cargando...' }}</h2>
          <p class="text-xs text-slate-500 font-medium">
            <template v-if="esChacha && vista === 'fraternidades'">
              Fraternidades con pareja Chacha-Warmi — elige una para calificar
            </template>
            <template v-else-if="esChacha && vista === 'pareja'">
              {{ fraternidadActiva?.nombre }} — califica a cada persona de la pareja
            </template>
            <template v-else>
              Listado de participantes habilitados para este concurso
            </template>
          </p>
        </div>
      </div>

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

    <div class="flex-1 dashboard-page max-w-7xl">
      <div v-if="loading" class="flex justify-center py-20">
        <span class="material-symbols-outlined animate-spin text-4xl text-primary">progress_activity</span>
      </div>

      <!-- CHACHA: fraternidades -->
      <div v-else-if="esChacha && vista === 'fraternidades'" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <button
          v-for="grupo in fraternidadesGrupos"
          :key="grupo.idFraternidad ?? 'sin'"
          type="button"
          class="text-left bg-white rounded-3xl overflow-hidden border border-slate-200 shadow-sm hover:shadow-lg hover:border-primary/30 transition-all p-6 group"
          @click="abrirFraternidad(grupo)"
        >
          <div class="flex justify-between items-start mb-4">
            <div class="size-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
              <span class="material-symbols-outlined text-3xl">groups</span>
            </div>
            <span class="px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest bg-slate-100 text-slate-600">
              {{ grupo.participantes.length }} persona(s)
            </span>
          </div>
          <h3 class="font-black text-xl text-slate-800 uppercase tracking-tighter leading-tight mb-2">
            {{ grupo.nombre }}
          </h3>
          <p class="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-4">
            {{ resumenTipos(grupo.participantes) }}
          </p>
          <div class="flex items-center justify-between text-sm font-black text-primary">
            <span>Ver pareja</span>
            <span class="material-symbols-outlined group-hover:translate-x-1 transition-transform">arrow_forward</span>
          </div>
          <div class="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[10px] font-bold text-slate-500">
            <span>Progreso calificación</span>
            <span :class="progresoGrupo(grupo).clase">{{ progresoGrupo(grupo).texto }}</span>
          </div>
        </button>

        <div v-if="fraternidadesGrupos.length === 0" class="col-span-full py-20 text-center">
          <span class="material-symbols-outlined text-6xl text-slate-200 mb-4">groups</span>
          <p class="text-slate-400 font-bold uppercase tracking-widest max-w-md mx-auto">
            No hay fraternidades con Chacha-Warmi aprobado para calificar.
          </p>
        </div>
      </div>

      <!-- CHACHA: pareja / listado plano de otros -->
      <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <div
          v-for="p in participantesVista"
          :key="p.idParticipante"
          class="bg-white rounded-3xl overflow-hidden border border-slate-200 shadow-sm hover:shadow-lg transition-all group flex flex-col"
        >
          <div class="p-6 flex-1">
            <div class="flex justify-between items-start mb-4">
              <div
                class="size-12 rounded-2xl flex items-center justify-center shrink-0"
                :class="p.tipo === 'Warmi' ? 'bg-secondary/10 text-secondary' : 'bg-primary/10 text-primary'"
              >
                <span class="material-symbols-outlined text-3xl">
                  {{ p.tipo === 'Warmi' ? 'person_2' : 'person' }}
                </span>
              </div>
              <div
                class="px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest"
                :class="p.estadoEvaluacion === 'COMPLETADO' ? 'bg-emerald-100 text-emerald-700' : (p.estadoEvaluacion === 'EN_PROGRESO' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500')"
              >
                {{ p.estadoEvaluacion }}
              </div>
            </div>

            <div class="mb-4 flex items-center justify-between gap-3">
              <div class="flex flex-col min-w-0">
                <h3 class="font-black text-xl text-slate-800 uppercase tracking-tighter leading-tight">{{ p.nombre }}</h3>
                <p class="text-primary font-bold text-[10px] uppercase tracking-widest">{{ p.tipo || 'PARTICIPANTE' }}</p>
              </div>
              <div class="text-right shrink-0">
                <p class="text-[9px] font-black text-slate-400 uppercase leading-none mb-1">Puntaje</p>
                <p class="text-xl font-black text-primary leading-none">{{ p.puntajeActual || 0 }} pts</p>
              </div>
            </div>

            <div class="flex items-center gap-2 mb-4 p-3 bg-slate-50 rounded-2xl border border-slate-100">
              <span class="material-symbols-outlined text-slate-400 text-lg">groups</span>
              <div class="min-w-0">
                <p class="text-[8px] font-black uppercase text-slate-400 leading-none mb-1">Representa a</p>
                <p class="text-[10px] font-bold text-slate-700 leading-none truncate">{{ p.fraternidad }}</p>
              </div>
            </div>

            <div v-if="p.fechaApertura" class="text-[9px] text-slate-400 font-bold uppercase tracking-widest flex flex-col gap-1">
              <p>Inició: {{ formatearFecha(p.fechaApertura) }}</p>
              <p v-if="p.fechaCierre">Cerró: {{ formatearFecha(p.fechaCierre) }}</p>
            </div>
          </div>

          <div class="p-4 bg-slate-50 border-t border-slate-100">
            <button
              type="button"
              @click="iniciarEvaluacion(p)"
              :disabled="p.estadoEvaluacion === 'COMPLETADO' || tiempoRestante <= 0"
              class="w-full py-3 rounded-2xl text-sm font-black transition-all flex items-center justify-center gap-2"
              :class="(p.estadoEvaluacion === 'COMPLETADO' || tiempoRestante <= 0)
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                : 'bg-primary text-white hover:bg-blue-900 shadow-xl shadow-primary/20'"
            >
              <span>
                {{ (p.estadoEvaluacion === 'COMPLETADO' || tiempoRestante <= 0)
                  ? (tiempoRestante <= 0 ? 'Fase Cerrada' : 'Nota Sellada')
                  : (p.estadoEvaluacion === 'PENDIENTE' ? 'Iniciar Calificación' : 'Continuar Calificación') }}
              </span>
              <span class="material-symbols-outlined text-[20px]">
                {{ (p.estadoEvaluacion === 'COMPLETADO' || tiempoRestante <= 0) ? 'lock' : 'arrow_forward' }}
              </span>
            </button>
          </div>
        </div>

        <div v-if="participantesVista.length === 0" class="col-span-full py-20 text-center">
          <span class="material-symbols-outlined text-6xl text-slate-200 mb-4">person_off</span>
          <p class="text-slate-400 font-bold uppercase tracking-widest">
            {{ esChacha ? 'Esta fraternidad no tiene pareja registrada.' : 'No hay participantes registrados para este concurso.' }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import Swal from 'sweetalert2'
import api from '../services/api'
import { esFaseChachaWarmi } from '../utils/chachaWarmi'

const props = defineProps({
  fase: { type: Object, required: true },
})
const emit = defineEmits(['volver', 'evaluar-participante'])

const participantes = ref([])
const loading = ref(true)
const vista = ref('lista') // 'lista' | 'fraternidades' | 'pareja'
const fraternidadActiva = ref(null)
const plantillaDesdeApi = ref(null)

const tiempoRestante = ref(0)
let timerInterval = null

const esChacha = computed(() =>
  esFaseChachaWarmi({
    ...props.fase,
    plantillaRequisitos: props.fase?.plantillaRequisitos || plantillaDesdeApi.value,
  }),
)

const fraternidadesGrupos = computed(() => {
  const map = new Map()
  for (const p of participantes.value) {
    const id = p.idFraternidad ?? null
    const key = id ?? `nombre:${p.fraternidad || 'sin'}`
    if (!map.has(key)) {
      map.set(key, {
        idFraternidad: id,
        nombre: p.fraternidad || 'Sin fraternidad',
        participantes: [],
      })
    }
    map.get(key).participantes.push(p)
  }
  return Array.from(map.values()).sort((a, b) =>
    String(a.nombre).localeCompare(String(b.nombre), 'es'),
  )
})

const participantesVista = computed(() => {
  if (esChacha.value && vista.value === 'pareja' && fraternidadActiva.value) {
    const list = [...fraternidadActiva.value.participantes]
    const orden = { Chacha: 0, Warmi: 1 }
    return list.sort((a, b) => {
      const oa = orden[a.tipo] ?? 9
      const ob = orden[b.tipo] ?? 9
      if (oa !== ob) return oa - ob
      return String(a.nombre || '').localeCompare(String(b.nombre || ''), 'es')
    })
  }
  return participantes.value
})

const resumenTipos = (lista) => {
  const chacha = lista.filter((p) => p.tipo === 'Chacha').length
  const warmi = lista.filter((p) => p.tipo === 'Warmi').length
  const partes = []
  if (chacha) partes.push(`${chacha} Chacha`)
  if (warmi) partes.push(`${warmi} Warmi`)
  if (!partes.length) partes.push(`${lista.length} inscrito(s)`)
  return partes.join(' · ')
}

const progresoGrupo = (grupo) => {
  const total = grupo.participantes.length || 1
  const hechos = grupo.participantes.filter((p) => p.estadoEvaluacion === 'COMPLETADO').length
  if (hechos === total) return { texto: 'Completo', clase: 'text-emerald-600' }
  if (hechos > 0) return { texto: `${hechos}/${total}`, clase: 'text-amber-600' }
  return { texto: 'Pendiente', clase: 'text-slate-400' }
}

const cargarParticipantes = async () => {
  loading.value = true
  try {
    const { data } = await api.get(`/evaluaciones/fase/${props.fase.idFase}/fraternidades`)
    participantes.value = data.listado || []
    plantillaDesdeApi.value = data.fase?.plantillaRequisitos || null

    if (esFaseChachaWarmi({ ...props.fase, plantillaRequisitos: plantillaDesdeApi.value || props.fase?.plantillaRequisitos })) {
      vista.value = 'fraternidades'
      fraternidadActiva.value = null
    } else {
      vista.value = 'lista'
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

    const fechaFin = parseSafeDate(props.fase.fechaFin, true)
    if (fechaFin) iniciarCronometro(fechaFin)
  } catch {
    Swal.fire('Error', 'No se pudo cargar el listado de competidores.', 'error')
    emit('volver')
  } finally {
    loading.value = false
  }
}

const abrirFraternidad = (grupo) => {
  fraternidadActiva.value = grupo
  vista.value = 'pareja'
}

const onVolver = () => {
  if (esChacha.value && vista.value === 'pareja') {
    vista.value = 'fraternidades'
    fraternidadActiva.value = null
    return
  }
  emit('volver')
}

const iniciarCronometro = (fechaFin) => {
  if (!fechaFin || isNaN(fechaFin.getTime())) return
  if (timerInterval) clearInterval(timerInterval)
  const actualizar = () => {
    tiempoRestante.value = Math.max(0, fechaFin.getTime() - Date.now())
  }
  actualizar()
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
    fraternidadNombre: participante.fraternidad,
  })
}

watch(
  () => props.fase?.idFase,
  () => {
    cargarParticipantes()
  },
)

onMounted(() => {
  cargarParticipantes()
})

onUnmounted(() => {
  if (timerInterval) clearInterval(timerInterval)
})
</script>
