<template>
  <v-dialog :model-value="modelValue" max-width="860" max-height="92dvh" scrollable persistent @update:model-value="$emit('update:modelValue', $event)">
    <v-card class="rounded-2xl overflow-hidden border border-slate-200 flex flex-col max-h-[92dvh]">
      <div class="bg-primary p-4 sm:p-6 text-white relative shrink-0">
        <button
          type="button"
          @click="cerrar"
          class="absolute right-3 top-3 sm:right-4 sm:top-4 size-9 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors"
        >
          <span class="material-symbols-outlined text-xl">close</span>
        </button>
        <div class="flex items-start gap-3 sm:gap-4 pr-10">
          <button
            v-if="vista === 'detalle'"
            type="button"
            @click="volverLista"
            class="size-9 sm:size-10 rounded-xl bg-white/15 hover:bg-white/25 flex items-center justify-center shrink-0 transition-colors"
          >
            <span class="material-symbols-outlined">arrow_back</span>
          </button>
          <div class="size-10 sm:size-12 rounded-2xl bg-white/15 flex items-center justify-center shrink-0">
            <span class="material-symbols-outlined text-2xl sm:text-3xl">monitoring</span>
          </div>
          <div class="min-w-0 flex-1">
            <p class="text-[10px] font-black uppercase tracking-widest text-white/70 mb-1">Vista administrador</p>
            <h3 class="text-base sm:text-xl font-black italic uppercase tracking-tighter leading-tight">
              {{ tituloCabecera }}
            </h3>
            <p class="text-[11px] sm:text-xs text-white/80 font-medium mt-1">
              Fase: <span class="font-black">{{ nombreFaseMostrar }}</span>
              <span v-if="vista === 'detalle' && sujetoSeleccionado" class="block mt-0.5 truncate">
                {{ etiquetaSujeto }}: {{ sujetoSeleccionado.nombre }}
              </span>
            </p>
          </div>
        </div>
      </div>

      <v-card-text class="pa-4 sm:pa-6 bg-slate-50 overflow-y-auto flex-1 min-h-0">
        <div v-if="loading" class="py-16 text-center text-slate-400">
          <span class="material-symbols-outlined animate-spin text-4xl">progress_activity</span>
          <p class="text-sm font-bold mt-3">Cargando…</p>
        </div>

        <div v-else-if="error" class="py-12 text-center">
          <span class="material-symbols-outlined text-5xl text-red-300 mb-2">error</span>
          <p class="text-sm font-bold text-red-700 px-4">{{ error }}</p>
        </div>

        <!-- LISTA DE FRATERNIDADES / PARTICIPANTES -->
        <template v-else-if="vista === 'lista'">
          <p class="text-[11px] text-slate-600 font-medium mb-4 leading-relaxed">
            Solo se muestran calificaciones de la fase actual.
            Selecciona un {{ esExterno ? 'participante' : 'fraternidad' }} para ver quién calificó y cuánto.
          </p>

          <div v-if="sujetos.length" class="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mb-4">
            <div class="bg-white rounded-xl border border-slate-200 p-2.5 sm:p-3 text-center">
              <p class="text-[8px] sm:text-[9px] font-black uppercase tracking-widest text-slate-400">Sujetos</p>
              <p class="text-lg sm:text-xl font-black text-primary">{{ sujetos.length }}</p>
            </div>
            <div class="bg-white rounded-xl border border-slate-200 p-2.5 sm:p-3 text-center">
              <p class="text-[8px] sm:text-[9px] font-black uppercase tracking-widest text-slate-400">Calificaciones</p>
              <p class="text-lg sm:text-xl font-black text-slate-700">{{ resumenFase.totalCalificaciones }}</p>
            </div>
            <div class="bg-white rounded-xl border border-amber-200 p-2.5 sm:p-3 text-center bg-amber-50/50">
              <p class="text-[8px] sm:text-[9px] font-black uppercase tracking-widest text-amber-700">Actas abiertas</p>
              <p class="text-lg sm:text-xl font-black text-amber-800">{{ resumenFase.totalPendientes }}</p>
            </div>
            <div class="bg-white rounded-xl border border-emerald-200 p-2.5 sm:p-3 text-center bg-emerald-50/50">
              <p class="text-[8px] sm:text-[9px] font-black uppercase tracking-widest text-emerald-700">Con pendientes</p>
              <p class="text-lg sm:text-xl font-black text-emerald-800">{{ resumenFase.conActasAbiertas }}</p>
            </div>
          </div>

          <div class="relative mb-4">
            <span class="material-symbols-outlined absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-slate-400 text-[20px]">search</span>
            <input
              v-model="busqueda"
              type="search"
              :placeholder="esExterno ? 'Buscar participante…' : 'Buscar fraternidad…'"
              class="w-full pl-11 sm:pl-12 pr-4 py-2.5 sm:py-3 bg-white border border-slate-200 rounded-xl text-sm font-medium outline-none focus:border-primary"
            />
          </div>

          <div v-if="!sujetosFiltrados.length" class="bg-white rounded-2xl border border-dashed border-slate-200 py-12 text-center text-slate-400">
            <span class="material-symbols-outlined text-5xl mb-2 opacity-40">groups</span>
            <p class="text-sm font-bold px-4">
              {{ busqueda.trim() ? 'Sin resultados para la búsqueda.' : `No hay ${esExterno ? 'participantes' : 'fraternidades'} en esta fase.` }}
            </p>
          </div>

          <div v-else class="space-y-2">
            <button
              v-for="s in sujetosFiltrados"
              :key="claveSujeto(s)"
              type="button"
              @click="abrirDetalle(s)"
              class="w-full text-left bg-white rounded-2xl border border-slate-200 px-3 sm:px-4 py-3 sm:py-3.5 hover:border-primary/40 hover:shadow-md transition-all"
            >
              <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3">
                <div class="min-w-0 flex-1">
                  <p class="font-black text-sm text-slate-800 truncate">{{ s.nombre }}</p>
                  <p v-if="s.categoria || s.fraternidad || s.tipoParticipante" class="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-0.5 truncate">
                    {{ s.categoria || [s.tipoParticipante, s.fraternidad].filter(Boolean).join(' · ') }}
                  </p>
                </div>
                <div class="flex items-center justify-between sm:justify-end gap-2 sm:gap-3 shrink-0">
                  <div class="flex items-center gap-3 sm:gap-4">
                    <div class="text-center sm:text-right">
                      <p class="text-[9px] font-black uppercase text-slate-400">Calificaron</p>
                      <p class="text-sm font-black text-primary">{{ s.cantidadCalificadores }}</p>
                    </div>
                    <div class="text-center sm:text-right" v-if="s.promedioSellado != null">
                      <p class="text-[9px] font-black uppercase text-slate-400">Prom.</p>
                      <p class="text-sm font-black text-emerald-700">{{ s.promedioSellado }}</p>
                    </div>
                  </div>
                  <div class="flex items-center gap-2">
                    <span
                      v-if="s.todasSelladas && s.cantidadCalificadores > 0"
                      class="text-[9px] font-black uppercase px-2 py-1 rounded-full bg-emerald-100 text-emerald-800 whitespace-nowrap"
                    >Selladas</span>
                    <span
                      v-else-if="s.cantidadPendientes > 0"
                      class="text-[9px] font-black uppercase px-2 py-1 rounded-full bg-amber-100 text-amber-800 whitespace-nowrap"
                    >{{ s.cantidadPendientes }} abierta(s)</span>
                    <span class="material-symbols-outlined text-slate-400 hidden sm:inline">chevron_right</span>
                  </div>
                </div>
              </div>
            </button>
          </div>
        </template>

        <!-- DETALLE: JURADOS / ADMINS -->
        <template v-else-if="vista === 'detalle' && resumen">
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mb-5">
            <div class="bg-white rounded-xl border border-slate-200 p-2.5 sm:p-3 text-center">
              <p class="text-[8px] sm:text-[9px] font-black uppercase tracking-widest text-slate-400">Total</p>
              <p class="text-lg sm:text-xl font-black text-primary">{{ resumen.resumen?.totalCalificadores ?? 0 }}</p>
            </div>
            <div class="bg-white rounded-xl border border-slate-200 p-2.5 sm:p-3 text-center">
              <p class="text-[8px] sm:text-[9px] font-black uppercase tracking-widest text-slate-400">Jurados</p>
              <p class="text-lg sm:text-xl font-black text-slate-700">{{ resumen.resumen?.totalJurados ?? 0 }}</p>
            </div>
            <div class="bg-white rounded-xl border border-amber-200 p-2.5 sm:p-3 text-center bg-amber-50/50">
              <p class="text-[8px] sm:text-[9px] font-black uppercase tracking-widest text-amber-700">Admins</p>
              <p class="text-lg sm:text-xl font-black text-amber-800">{{ resumen.resumen?.totalAdmins ?? 0 }}</p>
            </div>
            <div class="bg-white rounded-xl border border-emerald-200 p-2.5 sm:p-3 text-center bg-emerald-50/50">
              <p class="text-[8px] sm:text-[9px] font-black uppercase tracking-widest text-emerald-700">Promedio</p>
              <p class="text-lg sm:text-xl font-black text-emerald-800">
                {{ resumen.resumen?.promedioSellado != null ? resumen.resumen.promedioSellado : '—' }}
              </p>
            </div>
          </div>

          <div v-if="!resumen.calificaciones?.length" class="bg-white rounded-2xl border border-dashed border-slate-200 py-12 text-center text-slate-400">
            <span class="material-symbols-outlined text-5xl mb-2 opacity-40">person_off</span>
            <p class="text-sm font-bold">Nadie ha calificado aún en esta fase.</p>
          </div>

          <div v-else class="space-y-3">
            <div
              v-for="cal in resumen.calificaciones"
              :key="cal.idEvaluacion"
              class="bg-white rounded-2xl border overflow-hidden"
              :class="cal.esAdmin ? 'border-amber-200' : 'border-slate-200'"
            >
              <button
                type="button"
                class="w-full px-3 sm:px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3 text-left hover:bg-slate-50 transition-colors"
                @click="toggleExpand(cal.idEvaluacion)"
              >
                <div class="flex items-center gap-3 min-w-0 flex-1">
                  <div
                    class="size-9 sm:size-10 rounded-xl flex items-center justify-center shrink-0"
                    :class="cal.esAdmin ? 'bg-amber-100 text-amber-800' : 'bg-primary/10 text-primary'"
                  >
                    <span class="material-symbols-outlined text-[18px] sm:text-[20px]">
                      {{ cal.esAdmin ? 'admin_panel_settings' : 'gavel' }}
                    </span>
                  </div>
                  <div class="min-w-0 flex-1">
                    <p class="font-black text-sm text-slate-800 truncate">{{ cal.juradoNombre }}</p>
                    <div class="flex flex-wrap items-center gap-1.5 sm:gap-2 mt-0.5">
                      <span
                        class="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full"
                        :class="cal.esAdmin ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600'"
                      >
                        {{ cal.esAdmin ? (cal.rolUsuario || 'Administrador') : 'Jurado' }}
                      </span>
                      <span
                        v-if="cal.ci"
                        class="text-[9px] font-bold text-slate-400"
                      >CI {{ cal.ci }}</span>
                      <span
                        class="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full"
                        :class="badgeEstado(cal.estado)"
                      >
                        {{ cal.estado?.replace('_', ' ') }}
                      </span>
                    </div>
                  </div>
                </div>
                <div class="flex items-center justify-between sm:justify-end gap-3 shrink-0 pl-12 sm:pl-0">
                  <div class="text-left sm:text-right">
                    <p class="text-[9px] font-black uppercase text-slate-400">Nota</p>
                    <p class="text-lg font-black text-primary leading-none">{{ cal.puntajeTotal }}</p>
                  </div>
                  <span class="material-symbols-outlined text-slate-400 transition-transform" :class="expandido === cal.idEvaluacion ? 'rotate-180' : ''">
                    expand_more
                  </span>
                </div>
              </button>

              <div v-if="expandido === cal.idEvaluacion" class="px-3 sm:px-4 pb-4 border-t border-slate-100 bg-slate-50/50">
                <div v-if="cal.fechaApertura || cal.fechaCierre" class="text-[10px] text-slate-500 font-medium mb-3 flex flex-wrap gap-x-4 gap-y-1">
                  <span v-if="cal.fechaApertura">Inició: {{ fmtFecha(cal.fechaApertura) }}</span>
                  <span v-if="cal.fechaCierre">Selló: {{ fmtFecha(cal.fechaCierre) }}</span>
                </div>
                <div v-if="cal.criterios?.length" class="space-y-1.5">
                  <p class="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2">Desglose por criterio</p>
                  <div
                    v-for="crit in cal.criterios"
                    :key="crit.idCriterio"
                    class="flex items-center justify-between text-xs bg-white rounded-lg px-3 py-2 border border-slate-100 gap-2"
                  >
                    <span class="font-medium text-slate-700 truncate">{{ crit.nombre }}</span>
                    <span class="font-black text-primary shrink-0">
                      {{ crit.puntaje }}
                      <span v-if="crit.puntajeMaximo != null" class="text-slate-400 font-bold">/ {{ crit.puntajeMaximo }}</span>
                    </span>
                  </div>
                </div>
                <p v-else class="text-xs text-slate-400 italic">Sin detalle de criterios.</p>
              </div>
            </div>
          </div>
        </template>
      </v-card-text>

      <v-card-actions class="pa-3 sm:pa-4 border-t border-slate-100 bg-white shrink-0 flex flex-col sm:flex-row gap-2 sm:gap-3">
        <div class="flex flex-col sm:flex-row gap-2 w-full sm:w-auto sm:flex-1">
          <button
            v-if="vista === 'lista'"
            type="button"
            :disabled="cerrandoActas || resumenFase.totalPendientes === 0"
            @click="confirmarCerrarTodasActas"
            class="w-full sm:w-auto px-4 sm:px-5 py-2.5 rounded-xl font-black text-[10px] sm:text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2"
            :class="cerrandoActas || resumenFase.totalPendientes === 0
              ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
              : 'bg-red-800 hover:bg-red-900 text-white shadow-lg shadow-red-200'"
          >
            <span class="material-symbols-outlined text-[18px]">lock_clock</span>
            {{ cerrandoActas ? 'Cerrando…' : 'Cerrar todas las actas' }}
          </button>
          <button
            v-if="vista === 'detalle' && resumen?.calificaciones?.length"
            type="button"
            :disabled="cerrandoActas || todasSelladasDetalle"
            @click="confirmarCerrarActas"
            class="w-full sm:w-auto px-4 sm:px-5 py-2.5 rounded-xl font-black text-[10px] sm:text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2"
            :class="cerrandoActas || todasSelladasDetalle
              ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
              : 'bg-red-700 hover:bg-red-800 text-white shadow-lg shadow-red-200'"
          >
            <span class="material-symbols-outlined text-[18px]">lock</span>
            {{ cerrandoActas ? 'Cerrando…' : 'Cerrar acta' }}
          </button>
        </div>
        <button
          type="button"
          @click="cerrar"
          class="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-[10px] sm:text-xs uppercase tracking-widest transition-colors"
        >
          Cerrar ventana
        </button>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import Swal from 'sweetalert2'
import api from '../services/api'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  idFase: { type: Number, required: true },
  nombreFase: { type: String, default: '' },
  tipoConcurso: { type: String, default: 'EFU' },
  /** Atajo: abrir directamente el detalle de esta fraternidad */
  initialIdFraternidad: { type: [Number, String], default: null },
  /** Atajo: abrir directamente el detalle de este participante */
  initialIdParticipante: { type: [Number, String], default: null },
})

const emit = defineEmits(['update:modelValue', 'actas-cerradas'])

const loading = ref(false)
const error = ref('')
const vista = ref('lista')
const listado = ref(null)
const resumen = ref(null)
const sujetoSeleccionado = ref(null)
const busqueda = ref('')
const expandido = ref(null)
const cerrandoActas = ref(false)
let iniciando = false

const esExterno = computed(() => String(props.tipoConcurso || '').toUpperCase() === 'EXTERNO')
const etiquetaSujeto = computed(() => (esExterno.value ? 'Participante' : 'Fraternidad'))

const nombreFaseMostrar = computed(
  () => listado.value?.fase?.nombre || props.nombreFase || '—',
)

const tituloCabecera = computed(() => {
  if (vista.value === 'detalle') return 'Calificaciones por calificador'
  return esExterno.value ? 'Participantes de la fase' : 'Fraternidades de la fase'
})

const sujetos = computed(() => listado.value?.sujetos || [])

const resumenFase = computed(() => {
  const items = sujetos.value
  return {
    totalCalificaciones: items.reduce((s, i) => s + (i.cantidadCalificadores || 0), 0),
    totalPendientes: items.reduce((s, i) => s + (i.cantidadPendientes || 0), 0),
    conActasAbiertas: items.filter((i) => (i.cantidadPendientes || 0) > 0).length,
  }
})

const sujetosFiltrados = computed(() => {
  const q = busqueda.value.trim().toLowerCase()
  if (!q) return sujetos.value
  return sujetos.value.filter((s) => {
    const hay = [s.nombre, s.categoria, s.fraternidad, s.tipoParticipante].filter(Boolean).join(' ').toLowerCase()
    return hay.includes(q)
  })
})

const todasSelladasDetalle = computed(() => {
  const cals = resumen.value?.calificaciones || []
  return cals.length > 0 && cals.every((c) => c.estado === 'COMPLETADO')
})

const mismoId = (a, b) => {
  if (a == null || b == null || a === '' || b === '') return false
  return Number(a) === Number(b)
}

const claveSujeto = (s) => s.idFraternidad ?? s.idParticipante

const badgeEstado = (estado) => ({
  PENDIENTE: 'bg-slate-100 text-slate-600',
  EN_PROGRESO: 'bg-amber-100 text-amber-800',
  COMPLETADO: 'bg-emerald-100 text-emerald-800',
}[estado] || 'bg-slate-100 text-slate-600')

const fmtFecha = (d) => {
  if (!d) return '—'
  return new Date(d).toLocaleString('es-BO', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const toggleExpand = (id) => {
  expandido.value = expandido.value === id ? null : id
}

const cargarListado = async () => {
  const { data } = await api.get(`/evaluaciones/fase/${props.idFase}/listado-calificaciones-admin`)
  listado.value = data
}

const cargarDetalle = async (sujeto) => {
  const params = {}
  if (sujeto.idFraternidad != null) params.idFraternidad = Number(sujeto.idFraternidad)
  if (sujeto.idParticipante != null) params.idParticipante = Number(sujeto.idParticipante)
  const { data } = await api.get(`/evaluaciones/fase/${props.idFase}/resumen-calificaciones`, { params })
  resumen.value = data
  // Preferir nombre canónico del backend
  if (data?.sujeto?.nombre) {
    sujetoSeleccionado.value = {
      ...sujeto,
      ...data.sujeto,
      nombre: data.sujeto.nombre,
    }
  }
}

const abrirDetalle = async (sujeto) => {
  sujetoSeleccionado.value = sujeto
  loading.value = true
  error.value = ''
  expandido.value = null
  try {
    await cargarDetalle(sujeto)
    vista.value = 'detalle'
  } catch (e) {
    error.value = e?.response?.data?.message || 'No se pudo cargar el detalle de calificaciones.'
    vista.value = 'detalle'
  } finally {
    loading.value = false
  }
}

const volverLista = async () => {
  vista.value = 'lista'
  resumen.value = null
  sujetoSeleccionado.value = null
  expandido.value = null
  loading.value = true
  error.value = ''
  try {
    await cargarListado()
  } catch (e) {
    error.value = e?.response?.data?.message || 'No se pudo recargar el listado.'
  } finally {
    loading.value = false
  }
}

const confirmarCerrarTodasActas = async () => {
  const fase = nombreFaseMostrar.value
  const n = resumenFase.value.totalPendientes
  const conf = await Swal.fire({
    title: '¿Cerrar todas las actas?',
    html: `Se sellarán <strong>todas las actas abiertas</strong> de <strong>todos los jurados y administradores</strong> para <strong>todos los ${esExterno.value ? 'participantes' : 'fraternidades'}</strong> en la fase <strong>${fase}</strong>.<br><br>
      Actas pendientes: <strong>${n}</strong>.<br><br>
      Esta acción no se puede deshacer.`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Sí, cerrar todas',
    cancelButtonText: 'Cancelar',
    confirmButtonColor: '#991b1b',
  })
  if (!conf.isConfirmed) return

  cerrandoActas.value = true
  try {
    const { data } = await api.post(`/evaluaciones/fase/${props.idFase}/cerrar-actas`, {})
    await cargarListado()
    emit('actas-cerradas')
    Swal.fire({
      icon: 'success',
      title: 'Actas cerradas',
      text: data?.mensaje || 'Todas las actas de la fase fueron selladas.',
      timer: 3200,
      showConfirmButton: false,
    })
  } catch (e) {
    Swal.fire('Error', e?.response?.data?.message || 'No se pudieron cerrar las actas.', 'error')
  } finally {
    cerrandoActas.value = false
  }
}

const confirmarCerrarActas = async () => {
  const nombre = sujetoSeleccionado.value?.nombre || 'este sujeto'
  const fase = nombreFaseMostrar.value
  const conf = await Swal.fire({
    title: '¿Cerrar acta?',
    html: `Se sellarán <strong>todas las actas abiertas</strong> de todos los jurados y administradores que hayan calificado a <strong>${nombre}</strong> en la fase <strong>${fase}</strong>.<br><br>Esta acción no se puede deshacer.`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Sí, cerrar acta',
    cancelButtonText: 'Cancelar',
    confirmButtonColor: '#b91c1c',
  })
  if (!conf.isConfirmed) return

  cerrandoActas.value = true
  try {
    const payload = {}
    if (sujetoSeleccionado.value?.idFraternidad != null) {
      payload.idFraternidad = Number(sujetoSeleccionado.value.idFraternidad)
    }
    if (sujetoSeleccionado.value?.idParticipante != null) {
      payload.idParticipante = Number(sujetoSeleccionado.value.idParticipante)
    }
    const { data } = await api.post(`/evaluaciones/fase/${props.idFase}/cerrar-actas`, payload)
    await cargarDetalle(sujetoSeleccionado.value)
    emit('actas-cerradas')
    Swal.fire({
      icon: 'success',
      title: 'Actas cerradas',
      text: data?.mensaje || 'Las actas fueron selladas correctamente.',
      timer: 2800,
      showConfirmButton: false,
    })
  } catch (e) {
    Swal.fire('Error', e?.response?.data?.message || 'No se pudieron cerrar las actas.', 'error')
  } finally {
    cerrandoActas.value = false
  }
}

const resetModal = () => {
  vista.value = 'lista'
  listado.value = null
  resumen.value = null
  sujetoSeleccionado.value = null
  busqueda.value = ''
  expandido.value = null
  error.value = ''
}

const iniciar = async () => {
  if (!props.idFase || !props.modelValue || iniciando) return
  iniciando = true
  resetModal()
  loading.value = true
  error.value = ''
  try {
    await cargarListado()

    const idFrat = props.initialIdFraternidad
    const idPart = props.initialIdParticipante
    if (idFrat != null || idPart != null) {
      const sujeto = sujetos.value.find((s) =>
        (idFrat != null && mismoId(s.idFraternidad, idFrat)) ||
        (idPart != null && mismoId(s.idParticipante, idPart)),
      )
      if (sujeto) {
        await abrirDetalle(sujeto)
        return
      }
      // Aunque no esté en el listado filtrado, cargar detalle directo
      const stub = idFrat != null
        ? { idFraternidad: Number(idFrat), nombre: 'Fraternidad' }
        : { idParticipante: Number(idPart), nombre: 'Participante' }
      await abrirDetalle(stub)
    }
  } catch (e) {
    error.value = e?.response?.data?.message || 'No se pudo cargar el panel de calificaciones.'
  } finally {
    loading.value = false
    iniciando = false
  }
}

const cerrar = () => {
  emit('update:modelValue', false)
}

onMounted(() => {
  if (props.modelValue) iniciar()
})

watch(
  () => props.modelValue,
  (open) => {
    if (open) iniciar()
    else resetModal()
  },
)
</script>
