<template>
  <div class="dashboard-page max-w-7xl">
    <div class="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
      <div>
        <h2 class="dashboard-page-title text-primary">Inscripciones de Concursantes</h2>
        <p class="text-slate-500 text-sm font-medium mt-1">Revisa, observa o aprueba las preinscripciones a concursos externos.</p>
      </div>
      <select
        v-model="filtroFase"
        @change="cargar"
        class="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none focus:border-primary"
      >
        <option value="">Todos los concursos</option>
        <option v-for="f in fasesExternas" :key="f.idFase" :value="f.idFase">{{ f.nombre }}</option>
      </select>
    </div>

    <div v-if="loading" class="py-20 text-center text-slate-400">
      <span class="material-symbols-outlined animate-spin text-4xl">progress_activity</span>
    </div>

    <div v-else class="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
      <div v-if="lista.length === 0" class="py-16 text-center text-slate-400">
        <span class="material-symbols-outlined text-5xl mb-2 opacity-30">inbox</span>
        <p class="font-bold text-sm">No hay inscripciones aún.</p>
      </div>
      <div v-else class="divide-y divide-slate-100">
        <div
          v-for="item in lista"
          :key="item.idInscripcion"
          class="p-4 sm:p-5 hover:bg-slate-50/80 transition-colors flex flex-col lg:flex-row lg:items-center gap-4"
        >
          <div class="flex-1 min-w-0">
            <p class="font-black text-slate-900 truncate">
              {{ item.usuario?.nombres }} {{ item.usuario?.primerApellido }}
            </p>
            <p class="text-xs text-slate-500 font-medium mt-0.5">
              CI {{ item.usuario?.ci }} · {{ item.fase?.nombre }}
              <span v-if="item.usuario?.fraternidad"> · {{ item.usuario.fraternidad.nombre }}</span>
            </p>
          </div>
          <span
            class="self-start px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border"
            :class="badgeEstado(item.estado)"
          >{{ item.estado }}</span>
          <div class="flex flex-wrap gap-2">
            <button type="button" @click="verDetalle(item)" class="px-3 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-bold text-slate-700">
              Ver
            </button>
            <button
              v-if="item.estado === 'PENDIENTE' || item.estado === 'OBSERVADO'"
              type="button"
              @click="revisar(item, 'aprobar')"
              class="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold"
            >Aprobar</button>
            <button
              v-if="item.estado === 'PENDIENTE'"
              type="button"
              @click="revisar(item, 'observar')"
              class="px-3 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold"
            >Observar</button>
            <button
              v-if="item.estado === 'PENDIENTE' || item.estado === 'OBSERVADO'"
              type="button"
              @click="revisar(item, 'rechazar')"
              class="px-3 py-2 bg-secondary hover:bg-red-700 text-white rounded-xl text-xs font-bold"
            >Rechazar</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Detalle modal -->
    <v-dialog v-model="modalDetalle" max-width="720px">
      <v-card v-if="detalle" class="rounded-2xl">
        <v-card-title class="bg-primary text-white pa-5">
          <h3 class="text-lg font-black italic uppercase">Detalle de inscripción</h3>
          <p class="text-blue-200 text-xs mt-1">{{ detalle.fase?.nombre }} · {{ detalle.estado }}</p>
        </v-card-title>
        <v-card-text class="pa-6 max-h-[70vh] overflow-y-auto space-y-4">
          <div>
            <p class="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Datos</p>
            <dl class="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
              <div v-for="(val, key) in (detalle.datos || {})" :key="key" class="bg-slate-50 rounded-xl p-3">
                <dt class="text-[9px] font-black uppercase text-slate-400">{{ key }}</dt>
                <dd class="font-bold text-slate-800 mt-0.5 whitespace-pre-wrap">{{ val || '—' }}</dd>
              </div>
            </dl>
          </div>
          <div>
            <p class="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Archivos</p>
            <div class="space-y-2">
              <a
                v-for="a in (detalle.archivos || [])"
                :key="a.idArchivo"
                :href="getImageUrl(a.url)"
                target="_blank"
                class="flex items-center gap-2 p-3 bg-slate-50 rounded-xl text-sm font-bold text-primary hover:bg-primary/5"
              >
                <span class="material-symbols-outlined text-base">description</span>
                {{ a.claveDocumento }} — {{ a.nombreOriginal || 'archivo' }}
              </a>
              <p v-if="!(detalle.archivos || []).length" class="text-xs text-slate-400">Sin archivos</p>
            </div>
          </div>
        </v-card-text>
        <v-card-actions class="pa-4 border-t">
          <button type="button" @click="modalDetalle = false" class="px-4 py-2 font-bold text-slate-600">Cerrar</button>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import Swal from 'sweetalert2'
import api from '../services/api'
import { getImageUrl } from '../utils/url'

const loading = ref(true)
const lista = ref([])
const fasesExternas = ref([])
const filtroFase = ref('')
const modalDetalle = ref(false)
const detalle = ref(null)

const badgeEstado = (estado) => ({
  BORRADOR: 'bg-slate-100 text-slate-600 border-slate-200',
  PENDIENTE: 'bg-blue-50 text-blue-700 border-blue-100',
  OBSERVADO: 'bg-amber-50 text-amber-700 border-amber-100',
  APROBADO: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  RECHAZADO: 'bg-red-50 text-red-700 border-red-100',
}[estado] || 'bg-slate-100 text-slate-600 border-slate-200')

const cargarFases = async () => {
  try {
    const { data: g } = await api.get('/evaluaciones/gestion-activa')
    if (!g?.idGestion) return
    const { data } = await api.get(`/evaluaciones/gestiones/${g.idGestion}/fases`)
    fasesExternas.value = (data.fases || []).filter((f) => f.tipoConcurso === 'EXTERNO')
  } catch {
    fasesExternas.value = []
  }
}

const cargar = async () => {
  loading.value = true
  try {
    const params = filtroFase.value ? `?idFase=${filtroFase.value}` : ''
    const { data } = await api.get(`/inscripciones-concurso${params}`)
    lista.value = data || []
  } catch (e) {
    Swal.fire('Error', e.response?.data?.message || 'No se pudieron cargar las inscripciones', 'error')
  } finally {
    loading.value = false
  }
}

const verDetalle = async (item) => {
  try {
    const { data } = await api.get(`/inscripciones-concurso/${item.idInscripcion}`)
    detalle.value = data
    modalDetalle.value = true
  } catch (e) {
    Swal.fire('Error', e.response?.data?.message || 'No se pudo abrir el detalle', 'error')
  }
}

const revisar = async (item, accion) => {
  let observacion = ''
  if (accion === 'observar' || accion === 'rechazar') {
    const { value, isConfirmed } = await Swal.fire({
      title: accion === 'observar' ? 'Observación' : 'Motivo de rechazo',
      input: 'textarea',
      inputPlaceholder: 'Escribe el mensaje para el concursante…',
      showCancelButton: true,
      confirmButtonText: 'Confirmar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: accion === 'observar' ? '#d97706' : '#C8102E',
      inputValidator: (v) => (!v?.trim() && accion === 'observar' ? 'La observación es obligatoria' : null),
    })
    if (!isConfirmed) return
    observacion = value
  } else {
    const conf = await Swal.fire({
      title: '¿Aprobar inscripción?',
      text: 'El concursante pasará al listado de participantes del concurso.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Aprobar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#059669',
    })
    if (!conf.isConfirmed) return
  }

  try {
    await api.post(`/inscripciones-concurso/${item.idInscripcion}/revisar`, { accion, observacion })
    Swal.fire({ icon: 'success', title: 'Actualizado', toast: true, position: 'top-end', timer: 2000, showConfirmButton: false })
    cargar()
  } catch (e) {
    Swal.fire('Error', e.response?.data?.message || 'No se pudo completar la acción', 'error')
  }
}

onMounted(async () => {
  await cargarFases()
  await cargar()
})
</script>
