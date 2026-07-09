<template>
  <div :class="embedded ? 'w-full' : 'dashboard-page max-w-6xl'">
    <div v-if="!embedded" class="mb-8 sm:mb-10">
      <div class="flex items-center gap-3 mb-2">
        <span class="h-6 sm:h-8 w-2 bg-secondary rounded-full shrink-0"></span>
        <h2 class="dashboard-page-title italic uppercase text-primary">Auditoría del Sistema</h2>
      </div>
      <p class="text-slate-500 font-medium text-sm">
        Registro de inicios de sesión y cambios realizados, organizados por gestión anual.
      </p>
    </div>

    <!-- Selector de gestión -->
    <div class="mb-6">
      <label class="label-xs mb-2 block">Filtrar por gestión</label>
      <div class="flex flex-wrap gap-2">
        <button
          type="button"
          @click="seleccionarGestion('todas')"
          class="px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wide border-2 transition-all"
          :class="filtroGestion === 'todas'
            ? 'bg-primary text-white border-primary'
            : 'bg-white text-slate-600 border-slate-200 hover:border-primary/40'"
        >
          Todas las gestiones
        </button>
        <button
          type="button"
          @click="seleccionarGestion('global')"
          class="px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wide border-2 transition-all"
          :class="filtroGestion === 'global'
            ? 'bg-slate-700 text-white border-slate-700'
            : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'"
        >
          Sistema global
          <span class="ml-1 opacity-70">({{ resumen?.global?.totalAcciones || 0 }})</span>
        </button>
        <button
          v-for="g in resumen?.porGestion || []"
          :key="g.idGestion"
          type="button"
          @click="seleccionarGestion(g.idGestion)"
          class="px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wide border-2 transition-all"
          :class="filtroGestion === g.idGestion
            ? 'bg-primary text-white border-primary'
            : 'bg-white text-slate-600 border-slate-200 hover:border-primary/40'"
        >
          {{ g.anio }}
          <span v-if="g.activa" class="ml-1 text-[8px] bg-emerald-400/30 px-1 rounded">activa</span>
          <span class="ml-1 opacity-70">({{ g.totalAcciones }})</span>
        </button>
      </div>
      <p v-if="etiquetaGestion" class="text-xs text-slate-500 mt-2 font-medium">
        Mostrando datos de: <strong class="text-primary">{{ etiquetaGestion }}</strong>
      </p>
    </div>

    <!-- Tabs -->
    <div class="flex gap-2 mb-6 border-b border-slate-200">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        @click="cambiarTab(tab.id)"
        class="pb-3 px-3 text-[10px] sm:text-xs font-black uppercase tracking-widest transition-all relative"
        :class="activeTab === tab.id ? 'text-primary' : 'text-slate-400 hover:text-slate-600'"
      >
        {{ tab.label }}
        <div v-if="activeTab === tab.id" class="absolute bottom-0 left-0 w-full h-0.5 bg-secondary rounded-t-full"></div>
      </button>
    </div>

    <!-- Filtros -->
    <div class="bg-white rounded-2xl border border-slate-200 p-4 mb-6 flex flex-wrap gap-3 items-end">
      <div>
        <label class="label-xs">Desde</label>
        <input v-model="filtros.desde" type="date" class="form-input !py-2 !text-sm" />
      </div>
      <div>
        <label class="label-xs">Hasta</label>
        <input v-model="filtros.hasta" type="date" class="form-input !py-2 !text-sm" />
      </div>
      <div v-if="activeTab === 'acciones'">
        <label class="label-xs">Módulo</label>
        <select v-model="filtros.modulo" class="form-input !py-2 !text-sm">
          <option value="">Todos</option>
          <option v-for="m in modulos" :key="m" :value="m">{{ m }}</option>
        </select>
      </div>
      <button
        @click="cargarDatos(1)"
        class="px-5 py-2.5 bg-primary text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-900 transition-all"
      >
        Filtrar
      </button>
      <label v-if="activeTab === 'sesiones'" class="flex items-center gap-2 text-xs font-bold text-slate-600 cursor-pointer ml-auto">
        <input v-model="filtros.soloActivas" type="checkbox" class="rounded border-slate-300" @change="cargarDatos(1)" />
        Solo sesiones activas
      </label>
    </div>

    <!-- Cargando -->
    <div v-if="cargando" class="flex justify-center py-16 text-slate-400">
      <span class="material-symbols-outlined animate-spin text-3xl mr-2">progress_activity</span>
      <span class="font-bold">Cargando registros...</span>
    </div>

    <!-- Tabla sesiones -->
    <div v-else-if="activeTab === 'sesiones'" class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead class="bg-slate-50 border-b border-slate-200">
            <tr>
              <th class="text-left px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500">Usuario</th>
              <th class="text-left px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500">Rol</th>
              <th class="text-left px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500">Gestión</th>
              <th class="text-left px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500">Inicio</th>
              <th class="text-left px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500">Fin</th>
              <th class="text-left px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500">Duración</th>
              <th class="text-left px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500">Estado</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="!sesiones.length">
              <td colspan="7" class="px-4 py-10 text-center text-slate-400 font-medium">No hay sesiones registradas para este filtro.</td>
            </tr>
            <tr
              v-for="s in sesiones"
              :key="s.idSesion"
              class="border-b border-slate-100 hover:bg-slate-50/80 transition-colors"
            >
              <td class="px-4 py-3">
                <p class="font-bold text-primary">{{ nombreUsuario(s.usuario) }}</p>
                <p class="text-[10px] text-slate-400 font-bold">CI {{ s.usuario?.ci }}</p>
              </td>
              <td class="px-4 py-3 text-xs font-bold uppercase text-slate-600">{{ s.usuario?.rol || '—' }}</td>
              <td class="px-4 py-3 text-xs font-bold text-slate-600">
                {{ s.gestion ? `Gestión ${s.gestion.anio}` : 'Global' }}
              </td>
              <td class="px-4 py-3 text-xs font-mono text-slate-700">{{ formatearFecha(s.inicioSesion) }}</td>
              <td class="px-4 py-3 text-xs font-mono text-slate-700">{{ s.finSesion ? formatearFecha(s.finSesion) : '—' }}</td>
              <td class="px-4 py-3 text-xs text-slate-600">
                {{ s.duracionMinutos != null ? `${s.duracionMinutos} min` : s.activa ? 'En curso' : '—' }}
              </td>
              <td class="px-4 py-3">
                <span
                  class="text-[9px] font-black uppercase px-2 py-1 rounded-full"
                  :class="s.activa ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'"
                >
                  {{ s.activa ? 'Activa' : 'Cerrada' }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Tabla acciones -->
    <div v-else class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead class="bg-slate-50 border-b border-slate-200">
            <tr>
              <th class="text-left px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500">Fecha/Hora</th>
              <th class="text-left px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500">Usuario</th>
              <th class="text-left px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500">Gestión</th>
              <th class="text-left px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500">Módulo</th>
              <th class="text-left px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500">Acción</th>
              <th class="text-left px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500">Ruta</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="!acciones.length">
              <td colspan="6" class="px-4 py-10 text-center text-slate-400 font-medium">No hay cambios registrados para este filtro.</td>
            </tr>
            <tr
              v-for="a in acciones"
              :key="a.idRegistro"
              class="border-b border-slate-100 hover:bg-slate-50/80 transition-colors"
            >
              <td class="px-4 py-3 text-xs font-mono text-slate-700 whitespace-nowrap">{{ formatearFecha(a.createdAt) }}</td>
              <td class="px-4 py-3">
                <p class="font-bold text-primary text-xs">{{ nombreUsuario(a.usuario) }}</p>
                <p class="text-[10px] text-slate-400">{{ a.usuario?.rol }}</p>
              </td>
              <td class="px-4 py-3 text-xs font-bold text-slate-600">
                {{ a.gestion ? a.gestion.anio : 'Global' }}
              </td>
              <td class="px-4 py-3">
                <span class="text-[9px] font-black uppercase bg-slate-100 text-slate-600 px-2 py-1 rounded">{{ a.modulo || '—' }}</span>
              </td>
              <td class="px-4 py-3">
                <span
                  class="text-[9px] font-black uppercase px-2 py-1 rounded"
                  :class="metodoClass(a.metodo)"
                >{{ a.metodo }}</span>
              </td>
              <td class="px-4 py-3 text-[10px] text-slate-500 font-mono max-w-[200px] truncate" :title="a.ruta">{{ a.ruta }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Paginación -->
    <div v-if="paginacion.totalPages > 1" class="flex items-center justify-between mt-6">
      <p class="text-xs text-slate-500 font-medium">
        {{ paginacion.total }} registro(s) — página {{ paginacion.page }} de {{ paginacion.totalPages }}
      </p>
      <div class="flex gap-2">
        <button
          :disabled="paginacion.page <= 1"
          @click="cargarDatos(paginacion.page - 1)"
          class="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold disabled:opacity-40 hover:bg-slate-50"
        >
          Anterior
        </button>
        <button
          :disabled="paginacion.page >= paginacion.totalPages"
          @click="cargarDatos(paginacion.page + 1)"
          class="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold disabled:opacity-40 hover:bg-slate-50"
        >
          Siguiente
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import api from '../services/api'

defineProps({
  embedded: { type: Boolean, default: false },
})

const tabs = [
  { id: 'sesiones', label: 'Inicios de sesión' },
  { id: 'acciones', label: 'Cambios realizados' },
]

const modulos = [
  'evaluaciones', 'fraternidades', 'inscripciones', 'asistencias',
  'participantes', 'monografias', 'usuarios', 'organizacion', 'mail', 'auth',
]

const activeTab = ref('sesiones')
const filtroGestion = ref('todas')
const resumen = ref(null)
const sesiones = ref([])
const acciones = ref([])
const cargando = ref(false)
const paginacion = ref({ page: 1, totalPages: 1, total: 0 })

const filtros = ref({
  desde: '',
  hasta: '',
  modulo: '',
  soloActivas: false,
})

const etiquetaGestion = computed(() => {
  if (filtroGestion.value === 'todas') return 'Todas las gestiones'
  if (filtroGestion.value === 'global') return 'Sistema global (usuarios, organización, correos)'
  const g = resumen.value?.porGestion?.find((x) => x.idGestion === filtroGestion.value)
  return g ? `Gestión ${g.anio}${g.activa ? ' (activa)' : ''}` : `Gestión #${filtroGestion.value}`
})

const buildGestionParams = () => {
  if (filtroGestion.value === 'global') return { idGestion: 'global' }
  if (filtroGestion.value === 'todas') return {}
  return { idGestion: filtroGestion.value }
}

const cargarResumen = async () => {
  try {
    const { data } = await api.get('/auditoria/resumen')
    resumen.value = data
  } catch {
    resumen.value = { porGestion: [], global: {} }
  }
}

const cargarDatos = async (page = 1) => {
  cargando.value = true
  try {
    const params = {
      page,
      limit: 25,
      ...buildGestionParams(),
      ...(filtros.value.desde ? { desde: `${filtros.value.desde}T00:00:00` } : {}),
      ...(filtros.value.hasta ? { hasta: `${filtros.value.hasta}T23:59:59` } : {}),
    }

    if (activeTab.value === 'sesiones') {
      if (filtros.value.soloActivas) params.activas = 'true'
      const { data } = await api.get('/auditoria/sesiones', { params })
      sesiones.value = data.items || []
      paginacion.value = { page: data.page, totalPages: data.totalPages, total: data.total }
    } else {
      if (filtros.value.modulo) params.modulo = filtros.value.modulo
      const { data } = await api.get('/auditoria/acciones', { params })
      acciones.value = data.items || []
      paginacion.value = { page: data.page, totalPages: data.totalPages, total: data.total }
    }
  } catch {
    sesiones.value = []
    acciones.value = []
  } finally {
    cargando.value = false
  }
}

const seleccionarGestion = (id) => {
  filtroGestion.value = id
  cargarDatos(1)
}

const cambiarTab = (tab) => {
  activeTab.value = tab
  cargarDatos(1)
}

const nombreUsuario = (u) => {
  if (!u) return 'Sistema'
  return [u.nombres, u.primerApellido].filter(Boolean).join(' ')
}

const formatearFecha = (fecha) => {
  if (!fecha) return '—'
  return new Date(fecha).toLocaleString('es-BO', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  })
}

const metodoClass = (metodo) => {
  const map = {
    POST: 'bg-emerald-100 text-emerald-700',
    PUT: 'bg-blue-100 text-blue-700',
    PATCH: 'bg-amber-100 text-amber-700',
    DELETE: 'bg-red-100 text-red-700',
  }
  return map[metodo] || 'bg-slate-100 text-slate-600'
}

onMounted(async () => {
  await cargarResumen()
  await cargarDatos(1)
})
</script>
