<template>
  <div class="dashboard-page max-w-7xl">
    <div class="mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
      <div>
        <h2 class="dashboard-page-title text-primary">Nóminas Excel</h2>
        <p class="text-slate-500 text-sm font-medium mt-1">
          Revisa, visualiza y descarga las nóminas de integrantes subidas por cada fraternidad.
          <span v-if="gestionAnio" class="text-slate-400"> · Gestión {{ gestionAnio }}</span>
        </p>
      </div>
      <div class="flex items-center gap-2 w-full sm:w-auto">
        <div class="relative flex-1 sm:w-72">
          <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[20px]">search</span>
          <input
            v-model="busqueda"
            type="search"
            placeholder="Buscar fraternidad, categoría, archivo…"
            class="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium outline-none focus:border-primary"
          />
        </div>
        <button type="button" @click="cargar" class="size-10 bg-slate-100 hover:bg-slate-200 rounded-xl flex items-center justify-center shrink-0">
          <span class="material-symbols-outlined text-slate-600">refresh</span>
        </button>
      </div>
    </div>

    <div class="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
      <div class="bg-white rounded-2xl border border-slate-200 p-4 text-center shadow-sm">
        <p class="text-[9px] font-black uppercase tracking-widest text-slate-400">Fraternidades</p>
        <p class="text-xl font-black text-primary">{{ items.length }}</p>
      </div>
      <div class="bg-white rounded-2xl border border-emerald-200 p-4 text-center shadow-sm bg-emerald-50/40">
        <p class="text-[9px] font-black uppercase tracking-widest text-emerald-700">Con nómina</p>
        <p class="text-xl font-black text-emerald-800">{{ conArchivo }}</p>
      </div>
      <div class="bg-white rounded-2xl border border-amber-200 p-4 text-center shadow-sm bg-amber-50/40 col-span-2 sm:col-span-1">
        <p class="text-[9px] font-black uppercase tracking-widest text-amber-700">Pendientes</p>
        <p class="text-xl font-black text-amber-800">{{ items.length - conArchivo }}</p>
      </div>
    </div>

    <div v-if="loading" class="py-20 text-center text-slate-400">
      <span class="material-symbols-outlined animate-spin text-4xl">progress_activity</span>
    </div>

    <div v-else class="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
      <div v-if="filtradas.length === 0" class="py-16 text-center text-slate-400">
        <span class="material-symbols-outlined text-5xl mb-2 opacity-30">table</span>
        <p class="font-bold text-sm">No hay fraternidades con ese filtro.</p>
      </div>
      <div v-else class="divide-y divide-slate-100">
        <div
          v-for="row in filtradas"
          :key="row.idFraternidad"
          class="p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center gap-4 hover:bg-slate-50/80"
        >
          <div class="flex-1 min-w-0">
            <p class="font-black text-slate-900 truncate">{{ row.nombreFraternidad }}</p>
            <p class="text-xs text-slate-500 font-medium mt-0.5">
              {{ row.categoria || '—' }}
              <template v-if="row.lista">
                · {{ row.lista.nombreOriginal }}
                · {{ formatFecha(row.lista.updatedAt || row.lista.createdAt) }}
              </template>
            </p>
          </div>
          <span
            class="self-start px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border"
            :class="row.tieneArchivo
              ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
              : 'bg-slate-50 text-slate-500 border-slate-200'"
          >
            {{ row.tieneArchivo ? 'Cargada' : 'Sin archivo' }}
          </span>
          <div class="flex flex-wrap gap-2">
            <button
              v-if="row.lista"
              type="button"
              @click="abrirVisor(row.lista)"
              class="px-3 py-2 bg-primary hover:bg-blue-900 text-white rounded-xl text-xs font-bold"
            >
              Ver Excel
            </button>
            <button
              v-if="row.lista"
              type="button"
              @click="descargar(row.lista)"
              class="px-3 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-bold text-slate-700"
            >
              Descargar
            </button>
            <button
              v-if="row.lista"
              type="button"
              @click="eliminar(row.lista)"
              class="px-3 py-2 bg-red-50 hover:bg-red-100 text-red-700 rounded-xl text-xs font-bold"
            >
              Eliminar
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Visor tabular -->
    <v-dialog v-model="modalVisor" max-width="1100" max-height="92dvh" scrollable>
      <v-card class="rounded-2xl overflow-hidden flex flex-col max-h-[92dvh]">
        <v-card-title class="bg-slate-900 text-white pa-4 sm:pa-5 shrink-0">
          <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 w-full pr-8">
            <div class="min-w-0">
              <h3 class="text-base sm:text-lg font-black italic uppercase truncate">{{ preview?.nombreFraternidad }}</h3>
              <p class="text-slate-400 text-[11px] mt-0.5 truncate">
                {{ preview?.nombreOriginal }}
                <span v-if="preview?.hoja"> · Hoja: {{ preview.hoja }}</span>
                <span v-if="preview?.truncado" class="text-amber-300"> · Vista limitada a 2000 filas</span>
              </p>
            </div>
            <button
              v-if="preview?.idLista"
              type="button"
              @click="descargar(preview)"
              class="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-[10px] font-black uppercase tracking-widest"
            >
              Descargar
            </button>
          </div>
        </v-card-title>

        <v-card-text class="pa-0 bg-slate-50 flex-1 min-h-0 overflow-auto">
          <div v-if="cargandoPreview" class="py-20 text-center text-slate-400">
            <span class="material-symbols-outlined animate-spin text-4xl">progress_activity</span>
            <p class="text-xs font-bold mt-3 uppercase tracking-widest">Leyendo Excel…</p>
          </div>
          <div v-else-if="errorPreview" class="py-16 px-6 text-center">
            <span class="material-symbols-outlined text-5xl text-amber-400 mb-3">warning</span>
            <p class="text-sm font-bold text-slate-700 max-w-md mx-auto">{{ errorPreview }}</p>
            <button
              v-if="preview?.idLista || listaActiva?.idLista"
              type="button"
              class="mt-4 px-4 py-2 bg-primary text-white rounded-xl text-xs font-black uppercase"
              @click="descargar(preview || listaActiva)"
            >
              Descargar archivo
            </button>
          </div>
          <div v-else-if="preview" class="overflow-x-auto">
            <table class="w-full text-left border-collapse min-w-[640px]">
              <thead class="sticky top-0 z-10">
                <tr class="bg-slate-800 text-white">
                  <th class="px-2 py-2 text-[9px] font-black uppercase tracking-wider border-r border-slate-700 w-10">#</th>
                  <th
                    v-for="(h, i) in preview.headers"
                    :key="'h' + i"
                    class="px-3 py-2 text-[9px] font-black uppercase tracking-wider border-r border-slate-700 whitespace-nowrap"
                  >
                    {{ h || `Col ${i + 1}` }}
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(row, ri) in preview.rows"
                  :key="'r' + ri"
                  class="border-b border-slate-100"
                  :class="ri % 2 === 0 ? 'bg-white' : 'bg-slate-50'"
                >
                  <td class="px-2 py-1.5 text-[10px] text-slate-400 font-bold border-r border-slate-100">{{ ri + 1 }}</td>
                  <td
                    v-for="(cell, ci) in row"
                    :key="'c' + ri + '-' + ci"
                    class="px-3 py-1.5 text-xs text-slate-700 border-r border-slate-50 max-w-[220px] truncate"
                    :title="cell"
                  >
                    {{ cell || '—' }}
                  </td>
                </tr>
                <tr v-if="!preview.rows?.length">
                  <td :colspan="(preview.headers?.length || 0) + 1" class="px-6 py-12 text-center text-slate-400 text-sm">
                    La hoja está vacía o solo tiene encabezados.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </v-card-text>

        <v-card-actions class="pa-4 border-t bg-white shrink-0 justify-end">
          <button type="button" @click="modalVisor = false" class="px-5 py-2.5 rounded-xl font-bold text-slate-600 hover:bg-slate-100 text-xs uppercase tracking-widest">
            Cerrar
          </button>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import api from '../services/api'
import { notify } from '../utils/notify'

const loading = ref(true)
const items = ref([])
const gestionAnio = ref(null)
const busqueda = ref('')
const modalVisor = ref(false)
const cargandoPreview = ref(false)
const errorPreview = ref('')
const preview = ref(null)
const listaActiva = ref(null)

const conArchivo = computed(() => items.value.filter((i) => i.tieneArchivo).length)

const filtradas = computed(() => {
  const q = busqueda.value.trim().toLowerCase()
  if (!q) return items.value
  return items.value.filter((i) => {
    const hay = [
      i.nombreFraternidad,
      i.categoria,
      i.lista?.nombreOriginal,
      i.tieneArchivo ? 'cargada' : 'pendiente sin archivo',
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()
    return hay.includes(q)
  })
})

const formatFecha = (fecha) => {
  if (!fecha) return ''
  return new Date(fecha).toLocaleDateString('es-BO', {
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
    const { data } = await api.get('/listas-nomina')
    items.value = data.items || []
    gestionAnio.value = data.gestion?.anio || null
  } catch (e) {
    notify.error('Error', e.response?.data?.message || 'No se pudo cargar el listado.')
    items.value = []
  } finally {
    loading.value = false
  }
}

const abrirVisor = async (lista) => {
  listaActiva.value = lista
  preview.value = { ...lista }
  errorPreview.value = ''
  modalVisor.value = true
  cargandoPreview.value = true
  try {
    const { data } = await api.get(`/listas-nomina/${lista.idLista}/preview`)
    preview.value = data
  } catch (e) {
    errorPreview.value = e.response?.data?.message || 'No se pudo leer el Excel en el visor.'
  } finally {
    cargandoPreview.value = false
  }
}

const descargar = async (lista) => {
  if (!lista?.idLista) return
  try {
    const { data } = await api.get(`/listas-nomina/${lista.idLista}/archivo`, { responseType: 'blob' })
    const url = URL.createObjectURL(data)
    const a = document.createElement('a')
    a.href = url
    a.download = lista.nombreOriginal || `nomina_${lista.idLista}.xlsx`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  } catch (e) {
    notify.error('Error', 'No se pudo descargar el archivo.')
  }
}

const eliminar = async (lista) => {
  const conf = await notify.confirm(
    '¿Eliminar nómina?',
    `Se eliminará el Excel de «${lista.nombreFraternidad || 'esta fraternidad'}».`,
    'Sí, eliminar',
  )
  if (!conf.isConfirmed) return
  try {
    await api.delete(`/listas-nomina/${lista.idLista}`)
    notify.success('Eliminado', 'La nómina fue removida.')
    if (modalVisor.value && preview.value?.idLista === lista.idLista) modalVisor.value = false
    await cargar()
  } catch (e) {
    notify.error('Error', e.response?.data?.message || 'No se pudo eliminar.')
  }
}

onMounted(cargar)
</script>
