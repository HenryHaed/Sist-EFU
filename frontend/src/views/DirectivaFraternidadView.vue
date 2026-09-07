<template>
  <div class="dashboard-page max-w-5xl w-full">
    <!-- Header -->
    <div class="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <button
          type="button"
          @click="volver"
          class="mb-3 flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-primary transition-colors"
        >
          <span class="material-symbols-outlined text-sm">arrow_back</span>
          Volver a Fraternidades
        </button>
        <div class="flex items-center gap-2 mb-1">
          <span class="h-1 w-8 bg-secondary inline-block"></span>
          <h2 class="dashboard-page-title tracking-tight text-primary uppercase italic">Detalle de Fraternidad</h2>
        </div>
        <p v-if="detalle" class="text-slate-500 text-sm font-medium mt-1">
          {{ detalle.fraternidad.nombre }}
          <span class="text-slate-300 mx-1">·</span>
          {{ detalle.fraternidad.categoria || 'Sin categoría' }}
        </p>
      </div>

      <button
        v-if="detalle?.directiva"
        type="button"
        @click="descargarPdf"
        :disabled="generandoPdf"
        class="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-primary text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-lg shadow-primary/20 hover:brightness-110 disabled:opacity-50 transition-all"
      >
        <span v-if="generandoPdf" class="material-symbols-outlined animate-spin text-lg">progress_activity</span>
        <span v-else class="material-symbols-outlined text-lg">picture_as_pdf</span>
        {{ generandoPdf ? 'Generando...' : 'PDF Directiva' }}
      </button>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="py-24 flex flex-col items-center text-slate-400">
      <span class="material-symbols-outlined animate-spin text-5xl text-primary mb-4">progress_activity</span>
      <p class="text-xs font-black uppercase tracking-widest">Cargando datos...</p>
    </div>

    <!-- Error -->
    <div v-else-if="errorMsg" class="py-16 px-8 text-center bg-white rounded-3xl border border-slate-200 shadow-sm">
      <span class="material-symbols-outlined text-5xl text-slate-300 mb-4">error</span>
      <h3 class="text-lg font-black text-slate-600 uppercase mb-2">Error al cargar</h3>
      <p class="text-sm text-slate-500 max-w-md mx-auto mb-6">{{ errorMsg }}</p>
      <button type="button" @click="volver" class="px-6 py-3 bg-slate-800 text-white rounded-xl font-black text-xs uppercase tracking-widest">
        Volver al listado
      </button>
    </div>

    <!-- Contenido -->
    <template v-else-if="detalle">
      <!-- Info general -->
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        <div class="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
          <p class="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Gestión</p>
          <p class="text-sm font-bold text-slate-800">{{ detalle.fraternidad.gestionAnio || '—' }}</p>
        </div>
        <div class="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
          <p class="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Tipo de danza</p>
          <p class="text-sm font-bold text-slate-800">{{ detalle.fraternidad.tipoDanza || '—' }}</p>
        </div>
        <div class="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
          <p class="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Instancia</p>
          <p class="text-sm font-bold text-slate-800">{{ detalle.fraternidad.nivelRepresentacion || '—' }}</p>
        </div>
        <div class="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
          <p class="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Estado</p>
          <p class="text-sm font-bold" :class="detalle.fraternidad.habilitadoEfu ? 'text-green-600' : 'text-red-600'">
            {{ detalle.fraternidad.habilitadoEfu ? 'Activa' : 'Inactiva' }}
          </p>
        </div>
      </div>

      <!-- Tabs -->
      <div class="flex gap-2 mb-6 overflow-x-auto pb-1">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          @click="tabActiva = tab.id"
          class="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap border"
          :class="tabActiva === tab.id
            ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20'
            : 'bg-white text-slate-500 border-slate-200 hover:border-primary/30 hover:text-primary'"
        >
          <span class="material-symbols-outlined text-[16px]">{{ tab.icon }}</span>
          {{ tab.label }}
          <span
            v-if="tab.count !== undefined"
            class="ml-1 px-1.5 py-0.5 rounded-full text-[9px] font-black"
            :class="tabActiva === tab.id ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'"
          >{{ tab.count }}</span>
        </button>
      </div>

      <!-- TAB: Directiva -->
      <div v-if="tabActiva === 'directiva'">
        <div v-if="!detalle.directiva" class="py-12 text-center bg-white rounded-2xl border border-slate-200 shadow-sm">
          <span class="material-symbols-outlined text-4xl text-slate-300 mb-3">groups_off</span>
          <p class="text-sm font-bold text-slate-500">No hay directiva registrada para esta fraternidad.</p>
          <p class="text-[11px] text-slate-400 mt-1">La directiva se registra al aprobar una solicitud de inscripción.</p>
        </div>
        <template v-else>
          <div class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div class="px-6 py-4 bg-slate-50 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 class="text-[10px] font-black uppercase tracking-widest text-primary">Integrantes de la directiva</h3>
                <p class="text-[11px] text-slate-500 mt-1">{{ detalle.directiva.miembros.length }} cargo(s) registrado(s)</p>
              </div>
              <p v-if="detalle.directiva.solicitud" class="text-[10px] text-slate-400 font-bold">
                Solicitud #{{ detalle.directiva.solicitud.idSolicitud }}
              </p>
            </div>

            <!-- Desktop table -->
            <div class="hidden md:block overflow-x-auto">
              <table class="w-full text-left">
                <thead>
                  <tr class="bg-white border-b border-slate-100">
                    <th class="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400">Cargo</th>
                    <th class="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400">Nombre</th>
                    <th class="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400">CI</th>
                    <th class="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400">Celular</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-50">
                  <tr v-for="m in detalle.directiva.miembros" :key="m.prefix" class="hover:bg-slate-50/50">
                    <td class="px-6 py-4">
                      <span class="text-[10px] font-black uppercase tracking-wider text-primary">{{ m.cargo }}</span>
                    </td>
                    <td class="px-6 py-4 text-sm font-bold text-slate-800">{{ m.nombre || '—' }}</td>
                    <td class="px-6 py-4 text-sm font-medium text-slate-600">{{ m.ci || '—' }}</td>
                    <td class="px-6 py-4 text-sm font-medium text-slate-600">{{ m.celular || '—' }}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- Mobile cards -->
            <div class="md:hidden p-4 space-y-3">
              <div v-for="m in detalle.directiva.miembros" :key="m.prefix + '_m'" class="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <p class="text-[9px] font-black uppercase tracking-widest text-primary mb-2">{{ m.cargo }}</p>
                <p class="text-sm font-black text-slate-800 mb-2">{{ m.nombre || '—' }}</p>
                <div class="flex flex-wrap gap-3 text-[11px] text-slate-500">
                  <span><strong class="text-slate-400">CI:</strong> {{ m.ci || '—' }}</span>
                  <span v-if="m.celular"><strong class="text-slate-400">Cel:</strong> {{ m.celular }}</span>
                </div>
              </div>
            </div>
          </div>
        </template>
      </div>

      <!-- TAB: Jurados -->
      <div v-if="tabActiva === 'jurados'">
        <div v-if="detalle.jurados.length === 0" class="py-12 text-center bg-white rounded-2xl border border-slate-200 shadow-sm">
          <span class="material-symbols-outlined text-4xl text-slate-300 mb-3">gavel</span>
          <p class="text-sm font-bold text-slate-500">No hay jurados asignados a esta fraternidad.</p>
          <p class="text-[11px] text-slate-400 mt-1">Los jurados se asignan desde Gestión de sistema → Usuarios → Jurados.</p>
        </div>
        <div v-else class="space-y-3">
          <div
            v-for="j in detalle.jurados"
            :key="j.idJurado"
            class="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex flex-col sm:flex-row sm:items-center gap-4"
          >
            <div class="flex items-center gap-3 flex-1 min-w-0">
              <div class="size-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0">
                <span class="material-symbols-outlined text-indigo-600 text-[20px]">gavel</span>
              </div>
              <div class="min-w-0">
                <p class="text-sm font-black text-slate-800 truncate">{{ j.nombre }}</p>
                <p class="text-[10px] text-slate-400 font-bold">CI: {{ j.ci || '—' }} · {{ j.tipoJurado }}</p>
              </div>
            </div>
            <div class="flex flex-wrap gap-1.5">
              <span
                v-for="f in j.fases"
                :key="f.idFase"
                class="px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider border"
                :class="f.tipoConcurso === 'EFU'
                  ? 'bg-blue-50 text-blue-700 border-blue-200'
                  : 'bg-amber-50 text-amber-700 border-amber-200'"
              >
                {{ f.nombre }}
              </span>
              <span v-if="j.fases.length === 0" class="text-[10px] text-slate-400 italic">Sin fases asignadas</span>
            </div>
          </div>
        </div>
      </div>

      <!-- TAB: Concursantes -->
      <div v-if="tabActiva === 'concursantes'">
        <div v-if="detalle.participantes.length === 0" class="py-12 text-center bg-white rounded-2xl border border-slate-200 shadow-sm">
          <span class="material-symbols-outlined text-4xl text-slate-300 mb-3">emoji_events</span>
          <p class="text-sm font-bold text-slate-500">No hay concursantes registrados para esta fraternidad.</p>
          <p class="text-[11px] text-slate-400 mt-1">Los concursantes se inscriben desde los concursos externos (Chacha-Warmi, fotografía, etc.).</p>
        </div>
        <template v-else>
          <!-- Group by fase -->
          <div v-for="grupo in participantesPorFase" :key="grupo.fase" class="mb-6">
            <div class="flex items-center gap-2 mb-3">
              <span class="material-symbols-outlined text-[18px] text-amber-600">emoji_events</span>
              <h3 class="text-[11px] font-black uppercase tracking-widest text-slate-700">{{ grupo.fase }}</h3>
              <span class="px-2 py-0.5 rounded-full text-[9px] font-black bg-amber-50 text-amber-700 border border-amber-200">
                {{ grupo.participantes.length }}
              </span>
            </div>
            <div class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <!-- Desktop -->
              <div class="hidden md:block overflow-x-auto">
                <table class="w-full text-left">
                  <thead>
                    <tr class="bg-slate-50 border-b border-slate-100">
                      <th class="px-5 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400">Nombre</th>
                      <th class="px-5 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400">Tipo</th>
                      <th class="px-5 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400">Procedencia</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-slate-50">
                    <tr v-for="p in grupo.participantes" :key="p.idParticipante" class="hover:bg-slate-50/50">
                      <td class="px-5 py-3 text-sm font-bold text-slate-800">{{ p.nombre }}</td>
                      <td class="px-5 py-3">
                        <span class="px-2 py-0.5 rounded text-[9px] font-black uppercase bg-slate-100 text-slate-600">{{ p.tipo || '—' }}</span>
                      </td>
                      <td class="px-5 py-3 text-xs text-slate-600">
                        {{ p.facultad || '—' }}
                        <span v-if="p.carrera" class="text-slate-400"> · {{ p.carrera }}</span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <!-- Mobile -->
              <div class="md:hidden p-4 space-y-3">
                <div v-for="p in grupo.participantes" :key="p.idParticipante + '_m'" class="rounded-xl border border-slate-100 bg-slate-50 p-3">
                  <p class="text-sm font-black text-slate-800 mb-1">{{ p.nombre }}</p>
                  <div class="flex flex-wrap gap-2 text-[10px] text-slate-500">
                    <span v-if="p.tipo" class="px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-black uppercase">{{ p.tipo }}</span>
                    <span>{{ p.facultad || '—' }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </template>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import api from '../services/api'
import { notify } from '../utils/notify'

const props = defineProps({
  idFraternidad: { type: [Number, String], required: true },
})

const router = useRouter()
const loading = ref(true)
const generandoPdf = ref(false)
const detalle = ref(null)
const errorMsg = ref('')
const tabActiva = ref('directiva')

const tabs = computed(() => {
  const d = detalle.value
  if (!d) return []
  return [
    { id: 'directiva', label: 'Directiva', icon: 'badge', count: d.directiva?.miembros?.length ?? 0 },
    { id: 'jurados', label: 'Jurados', icon: 'gavel', count: d.jurados.length },
    { id: 'concursantes', label: 'Concursantes', icon: 'emoji_events', count: d.participantes.length },
  ]
})

const participantesPorFase = computed(() => {
  if (!detalle.value) return []
  const map = {}
  for (const p of detalle.value.participantes) {
    const key = p.fase?.nombre || 'Sin concurso'
    if (!map[key]) map[key] = { fase: key, participantes: [] }
    map[key].participantes.push(p)
  }
  return Object.values(map)
})

const cargarDetalle = async () => {
  if (!props.idFraternidad) {
    errorMsg.value = 'No se indicó la fraternidad.'
    loading.value = false
    return
  }
  loading.value = true
  errorMsg.value = ''
  detalle.value = null
  try {
    const { data } = await api.get(`/fraternidades/${props.idFraternidad}/detalle`)
    detalle.value = data
  } catch (e) {
    errorMsg.value = e.response?.data?.message || 'No se pudo cargar el detalle de esta fraternidad.'
  } finally {
    loading.value = false
  }
}

const volver = () => {
  router.push({ query: { v: 'fraternidades_crud' } })
}

const descargarPdf = async () => {
  if (!props.idFraternidad || generandoPdf.value) return
  generandoPdf.value = true
  try {
    const { data } = await api.get(`/fraternidades/${props.idFraternidad}/directiva/pdf`, {
      responseType: 'blob',
    })
    const nombre = detalle.value?.fraternidad?.nombre?.replace(/[^a-zA-Z0-9_-]/g, '_') || 'fraternidad'
    const url = URL.createObjectURL(data)
    const link = document.createElement('a')
    link.href = url
    link.download = `Directiva_${nombre}.pdf`
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
    notify.success('PDF generado', 'El reporte de directiva se descargó correctamente.')
  } catch (e) {
    notify.error('Error', 'No se pudo generar el PDF de la directiva.')
  } finally {
    generandoPdf.value = false
  }
}

watch(() => props.idFraternidad, cargarDetalle)
onMounted(cargarDetalle)
</script>
