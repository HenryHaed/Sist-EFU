<template>
  <div class="relative min-h-full flex flex-col bg-slate-50">
    <div class="dashboard-sticky-header shadow-sm space-y-3">
      <div class="flex flex-col lg:flex-row lg:items-center gap-3 lg:gap-4">
        <div class="flex items-center gap-3 min-w-0 flex-1">
          <button
            type="button"
            data-tutorial="volver"
            @click="onVolver"
            class="size-10 shrink-0 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl flex items-center justify-center transition-colors"
          >
            <span class="material-symbols-outlined">arrow_back</span>
          </button>
          <div class="min-w-0">
            <h2 class="text-[1.2rem] sm:text-xl font-black text-primary uppercase italic tracking-tighter truncate">{{ fase?.nombre || 'Cargando...' }}</h2>
            <p class="text-sm sm:text-xs text-slate-500 font-medium mt-0.5 truncate">
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

        <div class="flex flex-row flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            class="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 font-black text-[10px] uppercase tracking-widest transition-colors"
            @click="abrirTutorial"
          >
            <span class="material-symbols-outlined text-[18px]">school</span>
            Tutorial
          </button>
          <button
            v-if="esAdmin"
            type="button"
            @click="abrirPanelAdmin()"
            class="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 hover:bg-amber-100 font-black text-[10px] uppercase tracking-widest transition-colors"
          >
            <span class="material-symbols-outlined text-[18px]">monitoring</span>
            <span class="hidden md:inline">Admin</span>
          </button>
          <div
            data-tutorial="tiempo"
            class="inline-flex items-center gap-2 px-3 py-2 border rounded-xl"
            :class="urgenciaStatus.bgClass"
          >
            <span class="material-symbols-outlined animate-pulse text-[18px]" :class="urgenciaStatus.textClass">schedule</span>
            <div class="leading-tight">
              <p class="text-[9px] font-black uppercase tracking-widest text-slate-500">Tiempo fase</p>
              <p class="text-xs sm:text-sm font-black whitespace-nowrap" :class="urgenciaStatus.textClass">{{ countdownText }}</p>
            </div>
          </div>
        </div>
      </div>

      <div
        v-if="!loading && !(esChacha && vista === 'pareja')"
        class="flex flex-col md:flex-row md:items-center gap-2.5 md:gap-3 pt-1 border-t border-slate-100"
      >
        <div class="relative flex-1 min-w-0" data-tutorial="buscar">
          <span class="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-[20px]">search</span>
          <input
            v-model="busqueda"
            type="search"
            :placeholder="esChacha && vista === 'fraternidades' ? 'Buscar fraternidad...' : 'Buscar participante o fraternidad...'"
            class="w-full pl-11 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all shadow-sm font-medium text-sm"
          />
        </div>
        <div class="flex flex-wrap items-center gap-1.5 md:gap-2 shrink-0">
          <span class="text-[10px] font-black uppercase tracking-widest text-slate-400">Ordenar</span>
          <button
            v-for="opt in opcionesOrden"
            :key="opt.id"
            type="button"
            @click="setOrden(opt.id)"
            class="px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all"
            :class="ordenCriterio === opt.id
              ? 'bg-primary text-white border-primary'
              : 'bg-white text-slate-500 border-slate-200 hover:border-primary/40'"
          >
            {{ opt.label }}
          </button>
        </div>
      </div>
    </div>

    <TutorialCalificarModal v-model="tutorialAbierto" :variant="tutorialVariant" />

    <div class="flex-1 dashboard-page max-w-7xl">
      <div v-if="loading" class="flex justify-center py-20">
        <span class="material-symbols-outlined animate-spin text-4xl text-primary">progress_activity</span>
      </div>

      <template v-else>

      <!-- CHACHA: fraternidades (nota por pareja) -->
      <div v-if="esChacha && vista === 'fraternidades'" class="space-y-8">
        <section>
          <div class="flex items-center justify-between gap-3 mb-4 px-1">
            <div class="flex items-center gap-2 min-w-0">
              <span class="material-symbols-outlined text-amber-700 text-[22px]">pending_actions</span>
              <h3 class="text-base font-black text-amber-900 uppercase tracking-wide truncate">Pendientes de calificar</h3>
            </div>
            <span class="shrink-0 px-2.5 py-1 rounded-lg bg-amber-200/80 text-amber-950 text-sm font-black">{{ gruposPendientes.length }}</span>
          </div>
          <div v-if="gruposPendientes.length === 0" class="py-10 text-center text-slate-400 text-base font-medium bg-white rounded-3xl border border-slate-200">
            No hay fraternidades pendientes.
          </div>
          <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <div
              v-for="grupo in gruposPendientes"
              :key="'gp-' + (grupo.idFraternidad ?? 'sin')"
              class="bg-white rounded-3xl overflow-hidden border border-slate-200 shadow-sm hover:shadow-lg hover:border-primary/30 transition-all p-5 sm:p-6 group flex flex-col"
            >
              <div class="flex justify-between items-start mb-4 gap-2">
                <div class="size-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                  <span class="material-symbols-outlined text-3xl">groups</span>
                </div>
                <button
                  type="button"
                  class="px-3 py-1.5 rounded-full text-xs font-black uppercase tracking-wide border pointer-events-none"
                  :class="grupo.estadoEvaluacion === 'EN_PROGRESO'
                    ? 'bg-amber-100 text-amber-800 border-amber-200'
                    : 'bg-orange-100 text-orange-800 border-orange-200'"
                >
                  {{ grupo.estadoEvaluacion === 'EN_PROGRESO' ? 'En progreso' : 'No calificado' }}
                </button>
              </div>
              <h3 class="font-black text-xl sm:text-xl text-slate-800 uppercase tracking-tighter leading-tight mb-2">{{ grupo.nombre }}</h3>
              <p class="text-xs font-bold uppercase tracking-widest text-slate-400 mb-1">{{ (grupo.nombresPareja || []).join(' · ') || 'Pareja Chacha-Warmi' }}</p>
              <p class="text-xs font-medium text-slate-400 mb-2">
                {{ formatFechaSolicitud(grupo.fechaSolicitud) }}
                <span v-if="grupo.instanciaRepresentacion"> · {{ grupo.instanciaRepresentacion }}</span>
              </p>
              <p class="text-xl font-black text-primary mb-4">{{ grupo.puntajeActual || 0 }} <span class="text-xs text-slate-400">pts</span></p>
              <div class="mt-auto flex flex-col gap-2">
                <button v-if="esAdmin" type="button" @click="abrirPanelAdminFraternidad(grupo.idFraternidad)" class="w-full py-2.5 rounded-2xl text-sm font-black uppercase tracking-widest bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 transition-all flex items-center justify-center gap-2">
                  <span class="material-symbols-outlined text-[18px]">monitoring</span>
                  Ver calificaciones
                </button>
                <button
                  type="button"
                  @click="iniciarEvaluacionFraternidad(grupo)"
                  :disabled="tiempoRestante <= 0"
                  :data-tutorial="grupo === primerCalificarGrupo ? 'calificar' : undefined"
                  class="w-full py-3.5 rounded-2xl text-base sm:text-sm font-black transition-all flex items-center justify-center gap-2"
                  :class="tiempoRestante <= 0 ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-primary text-white hover:bg-blue-900 shadow-xl shadow-primary/20'"
                >
                  {{ tiempoRestante <= 0 ? 'Fase Cerrada' : (grupo.estadoEvaluacion === 'PENDIENTE' ? 'Calificar pareja' : 'Continuar calificación') }}
                  <span class="material-symbols-outlined text-[22px]">{{ tiempoRestante <= 0 ? 'lock' : 'arrow_forward' }}</span>
                </button>
              </div>
            </div>
          </div>
        </section>

        <section v-if="gruposCalificados.length">
          <div class="flex items-center justify-between gap-3 mb-4 px-1">
            <div class="flex items-center gap-2 min-w-0">
              <span class="material-symbols-outlined text-emerald-700 text-[22px]">verified</span>
              <h3 class="text-base font-black text-emerald-900 uppercase tracking-wide truncate">Ya calificadas</h3>
            </div>
            <span class="shrink-0 px-2.5 py-1 rounded-lg bg-emerald-200/80 text-emerald-950 text-sm font-black">{{ gruposCalificados.length }}</span>
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <div
              v-for="grupo in gruposCalificados"
              :key="'gc-' + (grupo.idFraternidad ?? 'sin')"
              class="bg-white rounded-3xl overflow-hidden border border-slate-200 shadow-sm p-5 sm:p-6 flex flex-col opacity-95"
            >
              <div class="flex justify-between items-start mb-4">
                <div class="size-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                  <span class="material-symbols-outlined text-3xl">groups</span>
                </div>
                <div class="px-3 py-1.5 rounded-full text-xs font-black uppercase tracking-wide bg-emerald-100 text-emerald-700 border border-emerald-200">Calificado</div>
              </div>
              <h3 class="font-black text-xl text-slate-800 uppercase tracking-tighter leading-tight mb-2">{{ grupo.nombre }}</h3>
              <p class="text-xl font-black text-primary mb-4">{{ grupo.puntajeActual || 0 }} <span class="text-xs text-slate-400">pts</span></p>
              <button disabled class="mt-auto w-full py-3.5 rounded-2xl text-base sm:text-sm font-black bg-slate-200 text-slate-400 cursor-not-allowed flex items-center justify-center gap-2">
                Nota Sellada <span class="material-symbols-outlined">lock</span>
              </button>
            </div>
          </div>
        </section>

        <div v-if="fraternidadesGruposFiltrados.length === 0" class="py-20 text-center">
          <span class="material-symbols-outlined text-6xl text-slate-200 mb-4">groups</span>
          <p class="text-slate-400 font-bold uppercase tracking-widest max-w-md mx-auto text-sm">
            {{ busqueda.trim() ? `Ninguna fraternidad coincide con “${busqueda}”.` : 'No hay fraternidades con Chacha-Warmi para calificar.' }}
          </p>
        </div>
      </div>

      <!-- CHACHA: pareja / listado plano de otros -->
      <div v-else class="space-y-8">
        <section>
          <div v-if="!(esChacha && vista === 'pareja')" class="flex items-center justify-between gap-3 mb-4 px-1">
            <div class="flex items-center gap-2 min-w-0">
              <span class="material-symbols-outlined text-amber-700 text-[22px]">pending_actions</span>
              <h3 class="text-base font-black text-amber-900 uppercase tracking-wide truncate">Pendientes de calificar</h3>
            </div>
            <span class="shrink-0 px-2.5 py-1 rounded-lg bg-amber-200/80 text-amber-950 text-sm font-black">{{ participantesPendientes.length }}</span>
          </div>
          <div v-if="participantesPendientes.length === 0 && !(esChacha && vista === 'pareja')" class="py-10 text-center text-slate-400 text-base font-medium bg-white rounded-3xl border border-slate-200">
            No hay participantes pendientes.
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <div
              v-for="p in (esChacha && vista === 'pareja' ? participantesVistaFiltrados : participantesPendientes)"
              :key="'pp-' + p.idParticipante"
              class="bg-white rounded-3xl overflow-hidden border border-slate-200 shadow-sm hover:shadow-lg transition-all group flex flex-col"
            >
              <div class="p-5 sm:p-6 flex-1">
                <div class="flex justify-between items-start mb-4 gap-2">
                  <div
                    class="size-12 rounded-2xl flex items-center justify-center shrink-0"
                    :class="p.tipo === 'Warmi' ? 'bg-secondary/10 text-secondary' : 'bg-primary/10 text-primary'"
                  >
                    <span class="material-symbols-outlined text-3xl">{{ p.tipo === 'Warmi' ? 'person_2' : 'person' }}</span>
                  </div>
                  <button
                    v-if="!estaCalificado(p)"
                    type="button"
                    class="px-3 py-1.5 rounded-full text-xs font-black uppercase tracking-wide border pointer-events-none"
                    :class="p.estadoEvaluacion === 'EN_PROGRESO' ? 'bg-amber-100 text-amber-800 border-amber-200' : 'bg-orange-100 text-orange-800 border-orange-200'"
                  >
                    {{ p.estadoEvaluacion === 'EN_PROGRESO' ? 'En progreso' : 'No calificado' }}
                  </button>
                  <div v-else class="px-3 py-1.5 rounded-full text-xs font-black uppercase tracking-wide bg-emerald-100 text-emerald-700 border border-emerald-200">Calificado</div>
                </div>
                <div class="mb-4 flex items-center justify-between gap-3">
                  <div class="flex flex-col min-w-0">
                    <h3 class="font-black text-xl text-slate-800 uppercase tracking-tighter leading-tight">{{ p.nombre }}</h3>
                    <p class="text-primary font-bold text-xs uppercase tracking-widest mt-1">{{ p.tipo || 'PARTICIPANTE' }}</p>
                  </div>
                  <div class="text-right shrink-0">
                    <p class="text-xs font-black text-slate-400 uppercase leading-none mb-1">Puntaje</p>
                    <p class="text-2xl font-black text-primary leading-none">{{ p.puntajeActual || 0 }}</p>
                  </div>
                </div>
                <div class="flex items-center gap-2 mb-4 p-3 bg-slate-50 rounded-2xl border border-slate-100">
                  <span class="material-symbols-outlined text-slate-400 text-lg">groups</span>
                  <div class="min-w-0">
                    <p class="text-[10px] font-black uppercase text-slate-400 leading-none mb-1">Representa a</p>
                    <p class="text-sm font-bold text-slate-700 leading-none truncate">{{ p.fraternidad }}</p>
                  </div>
                </div>
              </div>
              <div class="p-4 bg-slate-50 border-t border-slate-100 flex flex-col gap-2">
                <button v-if="esAdmin" type="button" @click="abrirPanelAdmin(p.idParticipante)" class="w-full py-2.5 rounded-2xl text-sm font-black uppercase tracking-widest bg-amber-50 text-amber-800 border border-amber-200 flex items-center justify-center gap-2">
                  <span class="material-symbols-outlined text-[18px]">monitoring</span>
                  Ver calificaciones
                </button>
                <button
                  type="button"
                  @click="iniciarEvaluacion(p)"
                  :disabled="estaCalificado(p) || tiempoRestante <= 0"
                  :data-tutorial="p.idParticipante === primerCalificarParticipante ? 'calificar' : undefined"
                  class="w-full py-3.5 rounded-2xl text-base sm:text-sm font-black transition-all flex items-center justify-center gap-2"
                  :class="(estaCalificado(p) || tiempoRestante <= 0)
                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    : 'bg-primary text-white hover:bg-blue-900 shadow-xl shadow-primary/20'"
                >
                  <span>
                    {{ (estaCalificado(p) || tiempoRestante <= 0)
                      ? (tiempoRestante <= 0 ? 'Fase Cerrada' : 'Nota Sellada')
                      : (p.estadoEvaluacion === 'PENDIENTE' ? 'Iniciar Calificación' : 'Continuar Calificación') }}
                  </span>
                  <span class="material-symbols-outlined text-[22px]">{{ (estaCalificado(p) || tiempoRestante <= 0) ? 'lock' : 'arrow_forward' }}</span>
                </button>
              </div>
            </div>
          </div>
        </section>

        <section v-if="!(esChacha && vista === 'pareja') && participantesCalificados.length">
          <div class="flex items-center justify-between gap-3 mb-4 px-1">
            <div class="flex items-center gap-2 min-w-0">
              <span class="material-symbols-outlined text-emerald-700 text-[22px]">verified</span>
              <h3 class="text-base font-black text-emerald-900 uppercase tracking-wide truncate">Ya calificados</h3>
            </div>
            <span class="shrink-0 px-2.5 py-1 rounded-lg bg-emerald-200/80 text-emerald-950 text-sm font-black">{{ participantesCalificados.length }}</span>
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <div
              v-for="p in participantesCalificados"
              :key="'pc-' + p.idParticipante"
              class="bg-white rounded-3xl overflow-hidden border border-slate-200 shadow-sm flex flex-col opacity-95"
            >
              <div class="p-5 sm:p-6 flex-1">
                <div class="flex justify-between items-start mb-4">
                  <div class="size-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                    <span class="material-symbols-outlined text-3xl">person</span>
                  </div>
                  <div class="px-3 py-1.5 rounded-full text-xs font-black uppercase bg-emerald-100 text-emerald-700 border border-emerald-200">Calificado</div>
                </div>
                <h3 class="font-black text-xl text-slate-800 uppercase tracking-tighter leading-tight">{{ p.nombre }}</h3>
                <p class="text-xl font-black text-primary mt-3">{{ p.puntajeActual || 0 }} pts</p>
              </div>
              <div class="p-4 bg-slate-50 border-t border-slate-100">
                <button disabled class="w-full py-3.5 rounded-2xl text-base sm:text-sm font-black bg-slate-200 text-slate-400 cursor-not-allowed flex items-center justify-center gap-2">
                  Nota Sellada <span class="material-symbols-outlined">lock</span>
                </button>
              </div>
            </div>
          </div>
        </section>

        <div v-if="participantesVistaFiltrados.length === 0" class="py-20 text-center">
          <span class="material-symbols-outlined text-6xl text-slate-200 mb-4">person_off</span>
          <p class="text-slate-400 font-bold uppercase tracking-widest text-sm">
            {{ busqueda.trim()
              ? `Ningún resultado para “${busqueda}”.`
              : (esChacha
                ? 'Esta fraternidad no tiene pareja registrada. Aparece cuando el delegado envía la inscripción Chacha-Warmi.'
                : 'No hay participantes registrados para este concurso.') }}
          </p>
        </div>
      </div>
      </template>
    </div>

    <ModalResumenCalificacionesAdmin
      v-if="modalResumenAdmin"
      :key="modalAdminKey"
      v-model="modalResumenAdmin"
      :id-fase="props.fase.idFase"
      :nombre-fase="props.fase?.nombre"
      tipo-concurso="EXTERNO"
      :initial-id-participante="resumenAdminIdParticipante"
      :initial-id-fraternidad="resumenAdminIdFraternidad"
      @actas-cerradas="cargarParticipantes"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import Swal from 'sweetalert2'
import api from '../services/api'
import { esFaseChachaWarmi } from '../utils/chachaWarmi'
import ModalResumenCalificacionesAdmin from '../components/ModalResumenCalificacionesAdmin.vue'
import TutorialCalificarModal from '../components/TutorialCalificarModal.vue'
import { useAuthStore } from '../store/auth'
import { ORDEN_CRITERIOS, formatFechaSolicitud, ordenarListado } from '../utils/ordenListado'
import { TUTORIAL_VARIANT, hasSeenTutorial } from '../utils/tutorialCalificar'

const authStore = useAuthStore()
const esAdmin = computed(() => ['admin', 'superusuario'].includes(authStore.userRole))

const props = defineProps({
  fase: { type: Object, required: true },
})
const emit = defineEmits(['volver', 'evaluar-participante'])

const tutorialVariant = TUTORIAL_VARIANT.LISTADO_EXTERNO
const tutorialAbierto = ref(false)
function abrirTutorial() {
  tutorialAbierto.value = true
}

const participantes = ref([])
const loading = ref(true)
const busqueda = ref('')
const vista = ref('lista') // 'lista' | 'fraternidades' | 'pareja'
const fraternidadActiva = ref(null)
const plantillaDesdeApi = ref(null)
const ordenCriterio = ref('ordenOficial')
const ordenDir = ref('asc')
const opcionesOrden = ORDEN_CRITERIOS

const setOrden = (id) => {
  if (ordenCriterio.value === id) {
    ordenDir.value = ordenDir.value === 'asc' ? 'desc' : 'asc'
  } else {
    ordenCriterio.value = id
    ordenDir.value = 'asc'
  }
}

const tiempoRestante = ref(0)
let timerInterval = null

const modalResumenAdmin = ref(false)
const modalAdminKey = ref(0)
const resumenAdminIdParticipante = ref(null)
const resumenAdminIdFraternidad = ref(null)
const modoCalificacionApi = ref(null)

const abrirPanelAdmin = (idParticipante = null) => {
  resumenAdminIdParticipante.value = idParticipante
  resumenAdminIdFraternidad.value = null
  modalAdminKey.value += 1
  modalResumenAdmin.value = true
}

const abrirPanelAdminFraternidad = (idFraternidad = null) => {
  resumenAdminIdFraternidad.value = idFraternidad
  resumenAdminIdParticipante.value = null
  modalAdminKey.value += 1
  modalResumenAdmin.value = true
}

const esChacha = computed(() =>
  esFaseChachaWarmi({
    ...props.fase,
    plantillaRequisitos: props.fase?.plantillaRequisitos || plantillaDesdeApi.value,
  }),
)

const fraternidadesGrupos = computed(() => {
  // API Chacha ya entrega listado por fraternidad
  if (modoCalificacionApi.value === 'fraternidad' || (esChacha.value && participantes.value[0]?.modoCalificacion === 'fraternidad')) {
    return ordenarListado(
      participantes.value.map((g) => ({
        ...g,
        nombresPareja: g.nombresPareja || [],
      })),
      ordenCriterio.value,
      ordenDir.value,
      {
        fecha: (x) => x.fechaSolicitud,
        nombre: (x) => x.nombre,
        instancia: (x) => x.instanciaRepresentacion,
        orden: (x) => x.ordenDesfile,
        id: (x) => x.idFraternidad || 0,
      },
    )
  }

  const map = new Map()
  for (const p of participantes.value) {
    const id = p.idFraternidad ?? null
    const key = id ?? `nombre:${p.fraternidad || 'sin'}`
    if (!map.has(key)) {
      map.set(key, {
        idFraternidad: id,
        nombre: p.fraternidad || 'Sin fraternidad',
        instanciaRepresentacion: p.instanciaRepresentacion || null,
        fechaSolicitud: p.fechaSolicitud || null,
        ordenDesfile: p.ordenDesfile ?? null,
        nombresPareja: [],
        estadoEvaluacion: p.estadoEvaluacion,
        puntajeActual: p.puntajeActual,
        participantes: [],
      })
    }
    const g = map.get(key)
    g.participantes.push(p)
    if (p.ordenDesfile != null && g.ordenDesfile == null) g.ordenDesfile = p.ordenDesfile
    if (p.nombre && !g.nombresPareja.includes(p.nombre)) g.nombresPareja.push(p.nombre)
    if (p.fechaSolicitud && (!g.fechaSolicitud || new Date(p.fechaSolicitud) < new Date(g.fechaSolicitud))) {
      g.fechaSolicitud = p.fechaSolicitud
    }
  }
  return ordenarListado(Array.from(map.values()), ordenCriterio.value, ordenDir.value, {
    fecha: (x) => x.fechaSolicitud,
    nombre: (x) => x.nombre,
    instancia: (x) => x.instanciaRepresentacion,
    orden: (x) => x.ordenDesfile,
    id: (x) => x.idFraternidad || 0,
  })
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
  return ordenarListado(participantes.value, ordenCriterio.value, ordenDir.value, {
    fecha: (x) => x.fechaSolicitud,
    nombre: (x) => x.nombre,
    instancia: (x) => x.instanciaRepresentacion || x.fraternidad,
    orden: (x) => x.ordenDesfile,
    id: (x) => x.idParticipante,
  })
})

const fraternidadesGruposFiltrados = computed(() => {
  const q = busqueda.value.trim().toLowerCase()
  if (!q) return fraternidadesGrupos.value
  return fraternidadesGrupos.value.filter((g) =>
    String(g.nombre || '').toLowerCase().includes(q),
  )
})

const participantesVistaFiltrados = computed(() => {
  const q = busqueda.value.trim().toLowerCase()
  if (!q || (esChacha.value && vista.value === 'pareja')) return participantesVista.value
  return participantesVista.value.filter((p) => {
    const haystack = [p.nombre, p.fraternidad, p.tipo, p.instanciaRepresentacion]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()
    return haystack.includes(q)
  })
})

const estaCalificado = (item) => item?.estadoEvaluacion === 'COMPLETADO'

const gruposPendientes = computed(() =>
  fraternidadesGruposFiltrados.value.filter((g) => !estaCalificado(g)),
)
const gruposCalificados = computed(() =>
  fraternidadesGruposFiltrados.value.filter((g) => estaCalificado(g)),
)
const participantesPendientes = computed(() =>
  participantesVistaFiltrados.value.filter((p) => !estaCalificado(p)),
)
const participantesCalificados = computed(() =>
  participantesVistaFiltrados.value.filter((p) => estaCalificado(p)),
)
const primerCalificarGrupo = computed(() => gruposPendientes.value[0] || fraternidadesGruposFiltrados.value[0])
const primerCalificarParticipante = computed(
  () => participantesPendientes.value[0]?.idParticipante ?? participantesVistaFiltrados.value[0]?.idParticipante,
)

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
    modoCalificacionApi.value = data.fase?.modoCalificacion || data.listado?.[0]?.modoCalificacion || null

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
    lanzarModalBienvenida(props.fase)
  } catch {
    Swal.fire('Error', 'No se pudo cargar el listado de competidores.', 'error')
    emit('volver')
  } finally {
    loading.value = false
  }
}

const urgenteIcon = (fFin) => {
  if (!fFin) return 'info'
  const dias = Math.floor(Math.max(0, fFin.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
  return dias <= 1 ? 'warning' : 'info'
}

const lanzarModalBienvenida = (faseInfo) => {
  if (!faseInfo?.idFase) return
  const key = `fase_bienvenida_${faseInfo.idFase}`
  if (sessionStorage.getItem(key)) return

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
  const fInicio = parseSafeDate(faseInfo.fechaInicio, false)
  const fFin = parseSafeDate(faseInfo.fechaFin, true)
  const inicioFmt = fInicio
    ? fInicio.toLocaleDateString('es-BO', { day: '2-digit', month: 'long', year: 'numeric' })
    : 'Pendiente'
  const finFmt = fFin
    ? fFin.toLocaleDateString('es-BO', { day: '2-digit', month: 'long', year: 'numeric' })
    : 'Pendiente'

  let restanteHtml = ''
  if (fFin) {
    const ms = Math.max(0, fFin.getTime() - Date.now())
    const dias = Math.floor(ms / (1000 * 60 * 60 * 24))
    const horas = Math.floor((ms % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    const min = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60))
    const urgente = dias <= 1
    restanteHtml = `
      <div style="margin-top:14px;padding:12px 14px;border-radius:12px;border:1px solid ${urgente ? '#fecaca' : '#bbf7d0'};background:${urgente ? '#fef2f2' : '#ecfdf5'};text-align:left">
        <p style="margin:0 0 4px;font-size:11px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;color:${urgente ? '#b91c1c' : '#047857'}">Tiempo restante para calificar</p>
        <p style="margin:0;font-size:18px;font-weight:900;color:${urgente ? '#991b1b' : '#065f46'}">${dias} días · ${horas} hrs · ${min} min</p>
      </div>`
  }

  Swal.fire({
    icon: urgenteIcon(fFin),
    title: 'Tiempo para calificar',
    html: `
      <p style="margin:0 0 8px;color:#475569;font-size:14px;line-height:1.45">
        Concurso <b>${faseInfo.nombre || ''}</b><br>
        Del <b>${inicioFmt}</b> al <b>${finFmt}</b>.
      </p>
      <p style="margin:0;color:#64748b;font-size:13px">Cuando termine el plazo, el acceso para calificar se restringe.</p>
      ${restanteHtml}
    `,
    confirmButtonColor: '#003399',
    confirmButtonText: 'Entendido',
  }).then(() => {
    sessionStorage.setItem(key, 'true')
  })
}

const abrirFraternidad = (grupo) => {
  // Legacy: ya no se usa para calificar por persona
  fraternidadActiva.value = grupo
  vista.value = 'pareja'
}

const iniciarEvaluacionFraternidad = (grupo) => {
  emit('evaluar-participante', {
    idParticipante: null,
    participanteNombre: (grupo.nombresPareja || []).join(' / ') || 'Pareja Chacha-Warmi',
    participanteTipo: 'Pareja',
    idFraternidad: grupo.idFraternidad,
    fraternidadNombre: grupo.nombre,
  })
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

watch(loading, (isLoading) => {
  if (!isLoading && !hasSeenTutorial(tutorialVariant)) {
    tutorialAbierto.value = true
  }
})

onUnmounted(() => {
  if (timerInterval) clearInterval(timerInterval)
})
</script>
