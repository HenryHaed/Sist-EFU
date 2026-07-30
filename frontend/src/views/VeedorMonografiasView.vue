<template>
  <div class="dashboard-page max-w-6xl w-full">
    <div class="mb-6 sm:mb-8">
      <div class="flex items-center gap-3 mb-2">
        <span class="h-6 sm:h-8 w-2 bg-secondary rounded-full shrink-0"></span>
        <h2 class="dashboard-page-title italic uppercase text-primary">Monografías de Fraternidades</h2>
      </div>
      <p class="text-slate-500 font-medium text-sm">
        Consulta de solo lectura: listado de fraternidades de la gestión activa y la monografía que subió cada delegado.
      </p>
    </div>

    <div class="bg-white rounded-2xl border border-slate-200 p-4 mb-6 flex flex-wrap gap-3 items-end">
      <div class="flex-1 min-w-[200px]">
        <label class="label-xs">Buscar fraternidad</label>
        <input
          v-model="busqueda"
          type="search"
          placeholder="Nombre, danza, facultad..."
          class="form-input !py-2.5 !text-sm"
        />
      </div>
      <div>
        <label class="label-xs">Estado monografía</label>
        <select v-model="filtroEstado" class="form-input !py-2.5 !text-sm">
          <option value="">Todas</option>
          <option value="subida">Con monografía</option>
          <option value="pendiente">Sin monografía</option>
        </select>
      </div>
      <button
        type="button"
        @click="cargar"
        class="px-5 py-2.5 bg-primary text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-900 transition-all"
      >
        Actualizar
      </button>
    </div>

    <div class="flex flex-wrap gap-3 mb-6 text-xs font-bold">
      <span class="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-600">
        {{ listado.length }} fraternidad(es)
      </span>
      <span class="px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700">
        {{ conMono }} con monografía
      </span>
      <span class="px-3 py-1.5 rounded-lg bg-amber-50 text-amber-700">
        {{ sinMono }} pendientes
      </span>
    </div>

    <div v-if="loading" class="flex justify-center py-16 text-slate-400">
      <span class="material-symbols-outlined animate-spin text-3xl mr-2">progress_activity</span>
      <span class="font-bold">Cargando listado...</span>
    </div>

    <div v-else-if="!filtrados.length" class="bg-white rounded-2xl border border-slate-200 py-16 text-center text-slate-400 font-medium">
      No hay fraternidades para este filtro.
    </div>

    <div v-else class="space-y-3">
      <div
        v-for="item in filtrados"
        :key="item.idFraternidad"
        class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"
      >
        <div class="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-4">
          <div class="min-w-0 flex-1">
            <div class="flex flex-wrap items-center gap-2 mb-1">
              <h3 class="font-black text-primary uppercase italic tracking-tight truncate">
                {{ item.nombre }}
              </h3>
              <span
                class="text-[9px] font-black uppercase px-2 py-1 rounded-full"
                :class="item.tieneMonografia
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-amber-100 text-amber-700'"
              >
                {{ item.tieneMonografia ? 'Monografía subida' : 'Sin monografía' }}
              </span>
            </div>
            <p class="text-xs text-slate-500 font-medium">
              <span v-if="item.tipoDanza">{{ item.tipoDanza }}</span>
              <span v-if="item.categoria"> · Cat. {{ item.categoria }}</span>
              <span v-if="item.facultad"> · {{ item.facultad }}</span>
              <span v-else-if="item.institucionExterna"> · {{ item.institucionExterna }}</span>
            </p>
            <p v-if="item.tieneMonografia && item.monografia" class="text-[11px] text-slate-400 mt-1 font-mono truncate">
              {{ item.monografia.nombreArchivo || 'monografia.pdf' }}
              <span v-if="item.monografia.fechaSubida">
                — {{ formatFecha(item.monografia.fechaSubida) }}
              </span>
            </p>
          </div>

          <div class="flex flex-wrap gap-2 shrink-0">
            <template v-if="item.tieneMonografia && item.monografia?.urlArchivo">
              <button
                type="button"
                @click="abrirVisor(item)"
                class="inline-flex items-center gap-1.5 px-4 py-2.5 bg-primary text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-900 transition-colors"
              >
                <span class="material-symbols-outlined text-[16px]">visibility</span>
                Ver PDF
              </button>
              <a
                :href="getImageUrl(item.monografia.urlArchivo)"
                :download="item.monografia.nombreArchivo || `monografia-${item.idFraternidad}.pdf`"
                target="_blank"
                rel="noopener"
                class="inline-flex items-center gap-1.5 px-4 py-2.5 bg-secondary text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:brightness-110 transition-colors"
              >
                <span class="material-symbols-outlined text-[16px]">download</span>
                Descargar
              </a>
            </template>
            <div
              v-else
              class="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-50 border border-dashed border-slate-200 rounded-xl text-xs text-slate-500 font-medium max-w-xs"
            >
              <span class="material-symbols-outlined text-amber-500 text-[18px]">info</span>
              Esta fraternidad aún no subió su monografía
            </div>
          </div>
        </div>
      </div>
    </div>

    <PdfViewerModal
      v-if="visor.abierto && visor.url"
      :url="visor.url"
      :titulo="visor.titulo"
      @cerrar="visor.abierto = false"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import api from '../services/api'
import { getImageUrl } from '../utils/url'
import PdfViewerModal from '../components/PdfViewerModal.vue'

const loading = ref(false)
const listado = ref([])
const busqueda = ref('')
const filtroEstado = ref('')
const visor = ref({ abierto: false, url: '', titulo: '' })

const conMono = computed(() => listado.value.filter((x) => x.tieneMonografia).length)
const sinMono = computed(() => listado.value.filter((x) => !x.tieneMonografia).length)

const filtrados = computed(() => {
  const q = busqueda.value.trim().toLowerCase()
  return listado.value.filter((item) => {
    if (filtroEstado.value === 'subida' && !item.tieneMonografia) return false
    if (filtroEstado.value === 'pendiente' && item.tieneMonografia) return false
    if (!q) return true
    const haystack = [
      item.nombre,
      item.tipoDanza,
      item.categoria,
      item.facultad,
      item.carrera,
      item.institucionExterna,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()
    return haystack.includes(q)
  })
})

const formatFecha = (fecha) => {
  if (!fecha) return ''
  return new Date(fecha).toLocaleString('es-BO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const cargar = async () => {
  loading.value = true
  try {
    const { data } = await api.get('/monografias/listado-fraternidades')
    listado.value = Array.isArray(data) ? data : []
  } catch {
    listado.value = []
  } finally {
    loading.value = false
  }
}

const abrirVisor = (item) => {
  if (!item.monografia?.urlArchivo) return
  visor.value = {
    abierto: true,
    url: getImageUrl(item.monografia.urlArchivo),
    titulo: `Monografía — ${item.nombre}`,
  }
}

onMounted(cargar)
</script>
