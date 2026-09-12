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
          <p class="text-[11px] text-slate-600 font-medium mb-3 leading-relaxed">
            <strong>Puntaje final</strong> = suma de notas selladas ÷ cantidad de jurados que calificaron a ese
            {{ etiquetaSujetoLower }}. Cada sujeto se promedia solo con quienes lo calificaron.
          </p>

          <div v-if="sujetos.length" class="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mb-4">
            <div class="bg-white rounded-xl border border-slate-200 p-2.5 sm:p-3 text-center">
              <p class="text-[8px] sm:text-[9px] font-black uppercase tracking-widest text-slate-400">Total</p>
              <p class="text-lg sm:text-xl font-black text-primary">{{ listado?.resumen?.totalSujetos ?? sujetos.length }}</p>
            </div>
            <div class="bg-white rounded-xl border border-emerald-200 p-2.5 sm:p-3 text-center bg-emerald-50/50">
              <p class="text-[8px] sm:text-[9px] font-black uppercase tracking-widest text-emerald-700">Con nota</p>
              <p class="text-lg sm:text-xl font-black text-emerald-800">{{ listado?.resumen?.conNota ?? ranking.length }}</p>
            </div>
            <div class="bg-white rounded-xl border border-slate-200 p-2.5 sm:p-3 text-center">
              <p class="text-[8px] sm:text-[9px] font-black uppercase tracking-widest text-slate-400">Sin nota</p>
              <p class="text-lg sm:text-xl font-black text-slate-700">{{ listado?.resumen?.sinNota ?? 0 }}</p>
            </div>
            <div class="bg-white rounded-xl border border-amber-200 p-2.5 sm:p-3 text-center bg-amber-50/50">
              <p class="text-[8px] sm:text-[9px] font-black uppercase tracking-widest text-amber-700">Actas abiertas</p>
              <p class="text-lg sm:text-xl font-black text-amber-800">{{ resumenFase.totalPendientes }}</p>
            </div>
          </div>

          <div class="flex flex-col sm:flex-row gap-2 mb-4">
            <div class="relative flex-1">
              <span class="material-symbols-outlined absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-slate-400 text-[20px]">search</span>
              <input
                v-model="busqueda"
                type="search"
                :placeholder="`Buscar ${etiquetaSujetoLower}…`"
                class="w-full pl-11 sm:pl-12 pr-4 py-2.5 sm:py-3 bg-white border border-slate-200 rounded-xl text-sm font-medium outline-none focus:border-primary"
              />
            </div>
            <div class="flex gap-2 shrink-0">
              <button
                type="button"
                @click="soloConNota = !soloConNota"
                class="px-3 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all"
                :class="soloConNota
                  ? 'bg-emerald-600 text-white border-emerald-600'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-primary/40'"
              >
                Solo calificados
              </button>
              <button
                type="button"
                @click="descargarPdf"
                :disabled="descargandoPdf || !ranking.length"
                class="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-primary text-white text-[10px] font-black uppercase tracking-widest disabled:opacity-40"
              >
                <span class="material-symbols-outlined text-[16px]">picture_as_pdf</span>
                {{ descargandoPdf ? 'PDF…' : 'PDF' }}
              </button>
            </div>
          </div>

          <div v-if="!sujetosFiltrados.length" class="bg-white rounded-2xl border border-dashed border-slate-200 py-12 text-center text-slate-400">
            <span class="material-symbols-outlined text-5xl mb-2 opacity-40">groups</span>
            <p class="text-sm font-bold px-4">
              {{ busqueda.trim() || soloConNota ? 'Sin resultados.' : `No hay ${etiquetaSujetoPlural} en esta fase.` }}
            </p>
          </div>

          <div v-else class="overflow-x-auto rounded-2xl border border-slate-200 bg-white mb-2">
            <table class="w-full text-left text-sm">
              <thead class="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th class="px-3 py-2.5 text-[10px] font-black uppercase tracking-widest text-slate-500 w-12">N°</th>
                  <th class="px-3 py-2.5 text-[10px] font-black uppercase tracking-widest text-slate-500">{{ etiquetaSujeto }}</th>
                  <th class="px-3 py-2.5 text-[10px] font-black uppercase tracking-widest text-slate-500 text-center">Jurados</th>
                  <th class="px-3 py-2.5 text-[10px] font-black uppercase tracking-widest text-slate-500 text-right">Puntaje final</th>
                  <th class="px-3 py-2.5 w-8"></th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                <tr
                  v-for="s in sujetosFiltrados"
                  :key="claveSujeto(s)"
                  class="hover:bg-slate-50/80 cursor-pointer"
                  @click="abrirDetalle(s)"
                >
                  <td class="px-3 py-2.5 font-black text-primary tabular-nums">
                    {{ s.puesto || '—' }}
                  </td>
                  <td class="px-3 py-2.5 min-w-0">
                    <p class="font-bold text-slate-800 truncate">{{ s.nombre }}</p>
                    <p v-if="subtituloSujeto(s)" class="text-[10px] text-slate-400 font-medium truncate">
                      {{ subtituloSujeto(s) }}
                    </p>
                  </td>
                  <td class="px-3 py-2.5 text-center text-xs font-bold text-slate-600">
                    {{ s.cantidadCompletadas || 0 }}
                    <span v-if="s.cantidadPendientes" class="text-amber-600">(+{{ s.cantidadPendientes }})</span>
                  </td>
                  <td class="px-3 py-2.5 text-right">
                    <span
                      v-if="s.promedioSellado != null"
                      class="text-base font-black text-emerald-700 tabular-nums"
                    >{{ s.promedioSellado }}</span>
                    <span v-else class="text-xs font-bold text-slate-300">—</span>
                  </td>
                  <td class="px-2 py-2.5 text-slate-400">
                    <span class="material-symbols-outlined text-[18px]">chevron_right</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <p class="text-[10px] text-slate-400 font-medium mt-2">
            Toca una fila para ver el detalle por jurado. El PDF incluye solo sujetos con puntaje final.
          </p>
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
            @click="descargarPdf"
            :disabled="descargandoPdf || !ranking.length"
            class="w-full sm:w-auto px-4 sm:px-5 py-2.5 rounded-xl font-black text-[10px] sm:text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 disabled:opacity-40 bg-primary hover:bg-primary/90 text-white"
          >
            <span class="material-symbols-outlined text-[18px]">picture_as_pdf</span>
            {{ descargandoPdf ? 'Generando…' : 'Descargar PDF' }}
          </button>
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
const soloConNota = ref(true)
const descargandoPdf = ref(false)
let iniciando = false

const esExterno = computed(() => String(props.tipoConcurso || '').toUpperCase() === 'EXTERNO')
/** Chacha (y EFU) se listan por fraternidad; otros externos por participante. */
const esPorFraternidad = computed(() => {
  if (listado.value?.tipoSujeto === 'fraternidad') return true
  if (listado.value?.tipoSujeto === 'participante') return false
  if (listado.value?.fase?.modoCalificacion === 'fraternidad') return true
  return !esExterno.value
})
const etiquetaSujeto = computed(() => (esPorFraternidad.value ? 'Fraternidad' : 'Participante'))
const etiquetaSujetoLower = computed(() => (esPorFraternidad.value ? 'fraternidad' : 'participante'))
const etiquetaSujetoPlural = computed(() => (esPorFraternidad.value ? 'fraternidades' : 'participantes'))

const nombreFaseMostrar = computed(
  () => listado.value?.fase?.nombre || props.nombreFase || '—',
)

const tituloCabecera = computed(() => {
  if (vista.value === 'detalle') return 'Calificaciones por calificador'
  return `Puntajes promediados · ${etiquetaSujetoPlural.value}`
})

const sujetos = computed(() => listado.value?.sujetos || [])
const ranking = computed(() => listado.value?.ranking || [])

const resumenFase = computed(() => {
  const items = sujetos.value
  return {
    totalCalificaciones: items.reduce((s, i) => s + (i.cantidadCalificadores || 0), 0),
    totalPendientes: items.reduce((s, i) => s + (i.cantidadPendientes || 0), 0),
    conActasAbiertas: items.filter((i) => (i.cantidadPendientes || 0) > 0).length,
  }
})

const sujetosOrdenados = computed(() => {
  const rankMap = new Map(
    (ranking.value || []).map((r) => [claveSujeto(r), r.puesto]),
  )
  const items = sujetos.value.map((s) => ({
    ...s,
    puesto: rankMap.get(claveSujeto(s)) || null,
  }))
  return items.slice().sort((a, b) => {
    const pa = a.promedioSellado != null ? Number(a.promedioSellado) : -1
    const pb = b.promedioSellado != null ? Number(b.promedioSellado) : -1
    if (pb !== pa) return pb - pa
    return String(a.nombre || '').localeCompare(String(b.nombre || ''), 'es')
  })
})

const sujetosFiltrados = computed(() => {
  let rows = sujetosOrdenados.value
  if (soloConNota.value) {
    rows = rows.filter((s) => s.promedioSellado != null)
  }
  const q = busqueda.value.trim().toLowerCase()
  if (!q) return rows
  return rows.filter((s) => {
    const pareja = Array.isArray(s.nombresPareja) ? s.nombresPareja.join(' ') : ''
    const hay = [s.nombre, s.categoria, s.fraternidad, s.tipoParticipante, pareja]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()
    return hay.includes(q)
  })
})

const subtituloSujeto = (s) => {
  if (Array.isArray(s.nombresPareja) && s.nombresPareja.length) {
    return s.nombresPareja.join(' / ')
  }
  return s.categoria || [s.tipoParticipante, s.fraternidad].filter(Boolean).join(' · ') || ''
}

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

const descargarPdf = async () => {
  descargandoPdf.value = true
  try {
    const { data } = await api.get(
      `/evaluaciones/fase/${props.idFase}/listado-calificaciones-admin/pdf`,
      { responseType: 'blob' },
    )
    const url = URL.createObjectURL(new Blob([data], { type: 'application/pdf' }))
    const a = document.createElement('a')
    a.href = url
    a.download = `Puntajes_${(nombreFaseMostrar.value || 'fase').replace(/\s+/g, '_')}_${Date.now()}.pdf`
    a.click()
    URL.revokeObjectURL(url)
  } catch (e) {
    Swal.fire('Error', e?.response?.data?.message || 'No se pudo descargar el PDF', 'error')
  } finally {
    descargandoPdf.value = false
  }
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
    html: `Se sellarán <strong>todas las actas abiertas</strong> de <strong>todos los jurados y administradores</strong> para <strong>todos los ${etiquetaSujetoPlural.value}</strong> en la fase <strong>${fase}</strong>.<br><br>
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
  soloConNota.value = true
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
