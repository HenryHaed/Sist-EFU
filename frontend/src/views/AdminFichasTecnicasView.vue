<template>
  <div class="dashboard-page max-w-7xl">
    <div class="mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
      <div>
        <h2 class="dashboard-page-title text-primary">Fichas Técnicas Monografía</h2>
        <p class="text-slate-500 text-sm font-medium mt-1">
          Revisa y descarga las fichas generadas por los delegados de cada fraternidad.
        </p>
      </div>
      <div class="flex items-center gap-2">
        <select
          v-model="filtroEstado"
          class="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none focus:border-primary"
        >
          <option value="">Todas</option>
          <option value="GENERADA">Generadas</option>
          <option value="BORRADOR">Borradores</option>
        </select>
        <button type="button" @click="cargar" class="size-10 bg-slate-100 hover:bg-slate-200 rounded-xl flex items-center justify-center">
          <span class="material-symbols-outlined text-slate-600">refresh</span>
        </button>
      </div>
    </div>

    <div v-if="loading" class="py-20 text-center text-slate-400">
      <span class="material-symbols-outlined animate-spin text-4xl">progress_activity</span>
    </div>

    <div v-else class="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
      <div v-if="filtradas.length === 0" class="py-16 text-center text-slate-400">
        <span class="material-symbols-outlined text-5xl mb-2 opacity-30">description</span>
        <p class="font-bold text-sm">No hay fichas técnicas con ese filtro.</p>
      </div>
      <div v-else class="divide-y divide-slate-100">
        <div
          v-for="f in filtradas"
          :key="f.idFicha"
          class="p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center gap-4 hover:bg-slate-50/80"
        >
          <div class="flex-1 min-w-0">
            <p class="font-black text-slate-900 truncate">{{ f.nombreFraternidad }}</p>
            <p class="text-xs text-slate-500 font-medium mt-0.5">
              {{ f.categoria || '—' }} · {{ f.danza || 'Sin danza' }}
              <span v-if="f.fechaGeneracion"> · Generada {{ formatFecha(f.fechaGeneracion) }}</span>
            </p>
          </div>
          <span
            class="self-start px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border"
            :class="f.estado === 'GENERADA'
              ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
              : 'bg-amber-50 text-amber-700 border-amber-100'"
          >{{ f.estado }}</span>
          <div class="flex flex-wrap gap-2">
            <button type="button" @click="verDetalle(f)" class="px-3 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-bold text-slate-700">
              Ver datos
            </button>
            <button
              v-if="f.estado === 'GENERADA'"
              type="button"
              @click="descargar(f)"
              class="px-3 py-2 bg-primary hover:bg-blue-900 text-white rounded-xl text-xs font-bold"
            >
              Descargar PDF
            </button>
          </div>
        </div>
      </div>
    </div>

    <v-dialog v-model="modal" max-width="720px">
      <v-card v-if="detalle" class="rounded-2xl">
        <v-card-title class="bg-primary text-white pa-5">
          <h3 class="text-lg font-black italic uppercase">{{ detalle.nombreFraternidad }}</h3>
          <p class="text-blue-200 text-xs mt-1">Ficha técnica · {{ detalle.estado }}</p>
        </v-card-title>
        <v-card-text class="pa-6 max-h-[70vh] overflow-y-auto space-y-3 text-sm">
          <div v-for="row in filasDetalle" :key="row.label" class="grid grid-cols-1 sm:grid-cols-3 gap-1 border-b border-slate-100 pb-2">
            <p class="text-[10px] font-black uppercase tracking-widest text-slate-400">{{ row.label }}</p>
            <p class="sm:col-span-2 font-medium text-slate-800 whitespace-pre-wrap">{{ row.value || '—' }}</p>
          </div>
          <div>
            <p class="text-[10px] font-black uppercase tracking-widest text-secondary mb-2">Expositores monografía</p>
            <div v-for="(p, i) in detalle.expositores" :key="'e'+i" class="text-xs bg-slate-50 rounded-xl p-3 mb-2">
              {{ i + 1 }}. {{ p.nombresApellidos }} — CI {{ p.ci }} — Mat. {{ p.matricula }} — Cel. {{ p.celular }}
            </div>
          </div>
          <div>
            <p class="text-[10px] font-black uppercase tracking-widest text-secondary mb-2">Representantes traje típico</p>
            <div v-for="(p, i) in detalle.representantesTraje" :key="'t'+i" class="text-xs bg-slate-50 rounded-xl p-3 mb-2">
              {{ i + 1 }}. {{ p.nombresApellidos }} — CI {{ p.ci }} — Mat. {{ p.matricula }} — Cel. {{ p.celular }}
            </div>
          </div>
        </v-card-text>
        <v-card-actions class="pa-4 border-t flex justify-between">
          <button type="button" @click="modal = false" class="px-4 py-2 font-bold text-slate-600">Cerrar</button>
          <button
            v-if="detalle.estado === 'GENERADA'"
            type="button"
            @click="descargar(detalle)"
            class="px-4 py-2 bg-primary text-white rounded-xl text-xs font-black uppercase"
          >
            Descargar PDF
          </button>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import Swal from 'sweetalert2'
import api from '../services/api'

const loading = ref(true)
const lista = ref([])
const filtroEstado = ref('GENERADA')
const modal = ref(false)
const detalle = ref(null)

const filtradas = computed(() => {
  if (!filtroEstado.value) return lista.value
  return lista.value.filter((f) => f.estado === filtroEstado.value)
})

const filasDetalle = computed(() => {
  if (!detalle.value) return []
  const d = detalle.value
  return [
    { label: 'Categoría', value: d.categoria },
    { label: 'Instancia', value: d.instanciaRepresentacion },
    { label: 'Facultad / Carrera / Otros', value: d.facultadCarrera },
    { label: 'Danza (tipo)', value: d.danza },
    { label: 'Origen danza', value: d.lugarOrigenDanza },
    { label: 'Sinopsis', value: d.sinopsisDanza },
    { label: 'Reseña histórica', value: d.resenaHistorica },
    { label: 'Fundación', value: d.fechaFundacion },
    { label: 'Fundadores', value: d.fundadores },
    { label: 'Premios', value: d.premios },
    { label: 'Firmante', value: d.nombreFirmante },
  ]
})

const formatFecha = (d) => {
  if (!d) return ''
  return new Date(d).toLocaleString('es-BO', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

const cargar = async () => {
  loading.value = true
  try {
    const { data } = await api.get('/ficha-tecnica')
    lista.value = data || []
  } catch (e) {
    Swal.fire('Error', e.response?.data?.message || 'No se pudieron cargar las fichas', 'error')
  } finally {
    loading.value = false
  }
}

const verDetalle = async (f) => {
  try {
    const { data } = await api.get(`/ficha-tecnica/${f.idFicha}`)
    detalle.value = data
    modal.value = true
  } catch (e) {
    Swal.fire('Error', e.response?.data?.message || 'No se pudo abrir', 'error')
  }
}

const descargar = async (f) => {
  try {
    const { data } = await api.get(`/ficha-tecnica/${f.idFicha}/pdf`, { responseType: 'blob' })
    const url = window.URL.createObjectURL(data)
    const a = document.createElement('a')
    a.href = url
    a.download = `Ficha_Tecnica_${(f.nombreFraternidad || 'fraternidad').replace(/\s+/g, '_')}.pdf`
    a.click()
    window.URL.revokeObjectURL(url)
  } catch (e) {
    let msg = 'No se pudo descargar'
    if (e.response?.data instanceof Blob) {
      try {
        const text = await e.response.data.text()
        msg = JSON.parse(text).message || msg
      } catch { /* ignore */ }
    }
    Swal.fire('Error', msg, 'error')
  }
}

onMounted(cargar)
</script>
