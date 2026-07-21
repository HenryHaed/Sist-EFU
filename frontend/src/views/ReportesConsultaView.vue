<template>
  <div class="w-full">
    <!-- Tipo de reporte -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
      <button
        v-for="tipo in tiposReporte"
        :key="tipo.id"
        type="button"
        @click="seleccionarTipo(tipo.id)"
        class="rounded-2xl border-2 p-4 text-left transition-all"
        :class="filtros.tipoReporte === tipo.id
          ? 'border-primary bg-primary/5 shadow-sm'
          : 'border-slate-200 bg-white hover:border-primary/30'"
      >
        <span class="material-symbols-outlined text-2xl mb-2" :class="filtros.tipoReporte === tipo.id ? 'text-primary' : 'text-slate-400'">
          {{ tipo.icon }}
        </span>
        <p class="text-xs font-black uppercase tracking-widest text-slate-800">{{ tipo.label }}</p>
        <p class="text-[11px] text-slate-500 mt-1">{{ tipo.desc }}</p>
      </button>
    </div>

    <!-- Filtros -->
    <div class="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 mb-6">
      <button
        type="button"
        @click="filtrosAbiertos = !filtrosAbiertos"
        class="w-full flex items-center justify-between text-left mb-4"
      >
        <span class="text-[10px] font-black uppercase tracking-widest text-primary">Filtros y orden</span>
        <span class="material-symbols-outlined text-slate-400">{{ filtrosAbiertos ? 'expand_less' : 'expand_more' }}</span>
      </button>

      <div v-show="filtrosAbiertos" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <!-- 1. Gestión -->
        <div>
          <label class="label-xs">Gestión</label>
          <select v-model="filtros.idGestion" class="form-input !py-2 !text-sm" @change="onGestionChange">
            <option :value="null">Ninguno</option>
            <option :value="TODOS">Todos</option>
            <option v-for="g in opciones.gestiones" :key="g.idGestion" :value="g.idGestion">
              {{ g.anio }}{{ g.activa ? ' (activa)' : '' }}
            </option>
          </select>
          <p v-if="filtros.tipoReporte === 'calificaciones'" class="text-[9px] text-amber-600 font-bold mt-1 uppercase">Obligatoria para calificaciones</p>
        </div>

        <!-- 2. Instancia -->
        <div>
          <label class="label-xs">Instancia</label>
          <select v-model="filtros.instanciaRepresentacion" class="form-input !py-2 !text-sm" @change="onInstanciaChange">
            <option :value="null">Ninguno</option>
            <option :value="TODOS">Todos</option>
            <option v-for="inst in opciones.instancias" :key="inst" :value="inst">{{ inst }}</option>
          </select>
        </div>

        <!-- 3. Facultad (solo instancia Facultad o Carrera) -->
        <div v-if="mostrarFiltroFacultad">
          <label class="label-xs">Facultad</label>
          <select v-model="filtros.idFacultad" class="form-input !py-2 !text-sm" @change="onFacultadChange">
            <option :value="null">Ninguno</option>
            <option :value="TODOS">Todos</option>
            <option v-for="f in opciones.facultades" :key="f.idFacultad" :value="f.idFacultad">
              {{ f.nombre }}
            </option>
          </select>
        </div>

        <!-- 3b. Carrera (solo instancia Carrera) -->
        <div v-if="mostrarFiltroCarrera">
          <label class="label-xs">Carrera</label>
          <select v-model="filtros.idCarrera" class="form-input !py-2 !text-sm" :disabled="!filtros.idFacultad || filtros.idFacultad === TODOS">
            <option :value="null">Ninguno</option>
            <option :value="TODOS">Todos</option>
            <option v-for="c in carrerasFiltradas" :key="c.idCarrera" :value="c.idCarrera">
              {{ c.nombre }}
            </option>
          </select>
        </div>

        <!-- 4. Tipo de danza -->
        <div>
          <label class="label-xs">Tipo de danza</label>
          <select v-model="filtros.idTipoDanza" class="form-input !py-2 !text-sm">
            <option :value="null">Ninguno</option>
            <option :value="TODOS">Todos</option>
            <option v-for="td in opciones.tiposDanza" :key="td.idTipoDanza" :value="td.idTipoDanza">
              {{ td.nombre }}
            </option>
          </select>
        </div>

        <!-- 5. Categoría -->
        <div>
          <label class="label-xs">Categoría</label>
          <select v-model="filtros.idCategoria" class="form-input !py-2 !text-sm">
            <option :value="null">Ninguno</option>
            <option :value="TODOS">Todos</option>
            <option v-for="c in opciones.categorias" :key="c.idCategoria" :value="c.idCategoria">
              {{ c.nombre }}
            </option>
          </select>
        </div>

        <div class="sm:col-span-2 lg:col-span-3">
          <label class="label-xs">Búsqueda (nombre fraternidad o danza)</label>
          <input v-model="filtros.busqueda" type="text" class="form-input !py-2 !text-sm" placeholder="Ej. Morenada, Tinku..." />
        </div>

        <div>
          <label class="label-xs">Ordenar por</label>
          <select v-model="filtros.ordenarPor" class="form-input !py-2 !text-sm">
            <option v-for="o in opcionesOrden" :key="o.value" :value="o.value">{{ o.label }}</option>
          </select>
        </div>

        <div>
          <label class="label-xs">Orden</label>
          <select v-model="filtros.orden" class="form-input !py-2 !text-sm">
            <option value="ASC">Ascendente</option>
            <option value="DESC">Descendente</option>
          </select>
        </div>
      </div>

      <div class="flex flex-wrap gap-3 mt-6">
        <button
          type="button"
          @click="buscar(1)"
          :disabled="loading"
          class="px-6 py-3 bg-primary text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-lg shadow-primary/20 hover:brightness-110 disabled:opacity-50 transition-all flex items-center gap-2"
        >
          <span v-if="loading" class="material-symbols-outlined animate-spin text-lg">progress_activity</span>
          <span v-else class="material-symbols-outlined text-lg">search</span>
          Buscar
        </button>
        <button
          type="button"
          @click="descargarPdf"
          :disabled="generandoPdf || !resultado"
          class="px-6 py-3 bg-slate-800 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-slate-900 disabled:opacity-50 transition-all flex items-center gap-2"
        >
          <span v-if="generandoPdf" class="material-symbols-outlined animate-spin text-lg">progress_activity</span>
          <span v-else class="material-symbols-outlined text-lg">picture_as_pdf</span>
          Descargar PDF
        </button>
      </div>
    </div>

    <!-- Resultados -->
    <div v-if="error" class="mb-4 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm font-medium">
      {{ error }}
    </div>

    <div v-if="resultado" class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div class="px-6 py-4 bg-slate-50 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2">
        <p class="text-[10px] font-black uppercase tracking-widest text-primary">
          {{ resultado.total }} registro(s) encontrado(s)
        </p>
        <p class="text-[11px] text-slate-500">Página {{ resultado.page }} · {{ resultado.limit }} por página</p>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full text-left min-w-[720px]">
          <thead>
            <tr class="bg-white border-b border-slate-100">
              <th v-for="col in columnas" :key="col.key" class="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400">
                {{ col.label }}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="!resultado.data?.length">
              <td :colspan="columnas.length" class="px-6 py-12 text-center text-slate-400 text-sm">
                No hay resultados con los filtros aplicados.
              </td>
            </tr>
            <tr
              v-for="(row, idx) in resultado.data"
              :key="idx"
              class="border-b border-slate-50 hover:bg-slate-50/50"
            >
              <td v-for="col in columnas" :key="col.key" class="px-4 py-3 text-sm text-slate-700">
                <span
                  v-if="col.key === 'cupo' || col.key === 'esExcedente'"
                  class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border"
                  :class="row.esExcedente
                    ? 'bg-amber-50 text-amber-800 border-amber-200'
                    : 'bg-emerald-50 text-emerald-700 border-emerald-200'"
                >
                  {{ row.esExcedente ? 'Excedente' : 'Dentro de cupo' }}
                </span>
                <template v-else>{{ formatCell(row, col.key) }}</template>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="totalPaginas > 1" class="px-6 py-4 border-t border-slate-100 flex items-center justify-center gap-2">
        <button
          type="button"
          :disabled="resultado.page <= 1 || loading"
          @click="buscar(resultado.page - 1)"
          class="px-3 py-2 rounded-lg border border-slate-200 text-xs font-bold disabled:opacity-40"
        >
          Anterior
        </button>
        <span class="text-xs text-slate-500 font-medium">{{ resultado.page }} / {{ totalPaginas }}</span>
        <button
          type="button"
          :disabled="resultado.page >= totalPaginas || loading"
          @click="buscar(resultado.page + 1)"
          class="px-3 py-2 rounded-lg border border-slate-200 text-xs font-bold disabled:opacity-40"
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
import { notify } from '../utils/notify'

const INSTANCIAS_CENTRALES = ['UMSA', 'FEDSIDUMSA', 'STUMSA']
/** Valor sentinela: incluir todos sin filtrar por ese criterio */
const TODOS = '__TODOS__'

const esValorFiltroActivo = (val) => val !== null && val !== '' && val !== TODOS

const tiposReporte = [
  { id: 'fraternidades', label: 'Fraternidades', icon: 'groups', desc: 'Listado con tipo de danza, categoría e instancia.' },
  { id: 'directiva', label: 'Directiva', icon: 'badge', desc: 'Integrantes por cargo de cada fraternidad.' },
  { id: 'calificaciones', label: 'Calificaciones', icon: 'leaderboard', desc: 'Puesto y puntaje final por gestión.' },
]

const filtros = ref({
  tipoReporte: 'fraternidades',
  idGestion: null,
  idTipoDanza: null,
  idFacultad: null,
  idCarrera: null,
  idCategoria: null,
  instanciaRepresentacion: null,
  busqueda: '',
  ordenarPor: 'nombreFraternidad',
  orden: 'ASC',
  page: 1,
  limit: 50,
})

const opciones = ref({
  gestiones: [],
  facultades: [],
  carreras: [],
  categorias: [],
  tiposDanza: [],
  instancias: [],
})

const filtrosAbiertos = ref(true)
const loading = ref(false)
const generandoPdf = ref(false)
const error = ref('')
const resultado = ref(null)

const carrerasFiltradas = computed(() => {
  const idFac = filtros.value.idFacultad
  if (!esValorFiltroActivo(idFac)) return opciones.value.carreras
  return opciones.value.carreras.filter((c) => c.facultad?.idFacultad === idFac)
})

const mostrarFiltroFacultad = computed(() => {
  const inst = filtros.value.instanciaRepresentacion
  return inst === 'Facultad' || inst === 'Carrera'
})

const mostrarFiltroCarrera = computed(() => filtros.value.instanciaRepresentacion === 'Carrera')

const onInstanciaChange = () => {
  const inst = filtros.value.instanciaRepresentacion
  if (!esValorFiltroActivo(inst) || INSTANCIAS_CENTRALES.includes(inst) || inst === 'Externo') {
    filtros.value.idFacultad = null
    filtros.value.idCarrera = null
  } else if (inst === 'Facultad') {
    filtros.value.idCarrera = null
  }
}

const onFacultadChange = () => {
  if (filtros.value.instanciaRepresentacion === 'Carrera') {
    filtros.value.idCarrera = null
  }
}

const columnasPorTipo = {
  fraternidades: [
    { key: 'nombreFraternidad', label: 'Fraternidad' },
    { key: 'tipoDanza', label: 'Tipo de danza' },
    { key: 'cupo', label: 'Cupo' },
    { key: 'categoria', label: 'Categoría' },
    { key: 'instancia', label: 'Instancia' },
    { key: 'pertenencia', label: 'Pertenencia' },
    { key: 'gestionAnio', label: 'Gestión' },
  ],
  directiva: [
    { key: 'nombreFraternidad', label: 'Fraternidad' },
    { key: 'tipoDanza', label: 'Danza' },
    { key: 'cargo', label: 'Cargo' },
    { key: 'nombreIntegrante', label: 'Nombre' },
    { key: 'ci', label: 'CI' },
    { key: 'celular', label: 'Celular' },
  ],
  calificaciones: [
    { key: 'puesto', label: 'Puesto' },
    { key: 'nombreFraternidad', label: 'Fraternidad' },
    { key: 'tipoDanza', label: 'Danza' },
    { key: 'categoria', label: 'Categoría' },
    { key: 'promedioJurado', label: 'Prom. jurado' },
    { key: 'impactoSanciones', label: 'Sanciones' },
    { key: 'puntajeFinal', label: 'Puntaje final' },
  ],
}

const columnas = computed(() => columnasPorTipo[filtros.value.tipoReporte] || columnasPorTipo.fraternidades)

const opcionesOrden = computed(() => {
  const base = [
    { value: 'nombreFraternidad', label: 'Nombre fraternidad' },
    { value: 'tipoDanza', label: 'Tipo de danza' },
    { value: 'facultad', label: 'Facultad' },
    { value: 'categoria', label: 'Categoría' },
  ]
  if (filtros.value.tipoReporte === 'calificaciones') {
    base.push({ value: 'puntajeFinal', label: 'Puntaje final' }, { value: 'puesto', label: 'Puesto' })
  }
  return base
})

const totalPaginas = computed(() => {
  if (!resultado.value?.total) return 1
  return Math.max(1, Math.ceil(resultado.value.total / (resultado.value.limit || 50)))
})

const formatCell = (row, key) => {
  const val = row[key]
  if (val === null || val === undefined || val === '') return '—'
  if (key === 'promedioJurado' || key === 'puntajeFinal') return Number(val).toFixed(2)
  if (key === 'fechaHoraCalificacion' && val) {
    return new Date(val).toLocaleString('es-BO')
  }
  return val
}

const buildPayload = (page) => {
  const p = { ...filtros.value, page: page || filtros.value.page }
  const inst = p.instanciaRepresentacion
  if (!esValorFiltroActivo(inst)) {
    delete p.instanciaRepresentacion
    delete p.idFacultad
    delete p.idCarrera
  } else if (INSTANCIAS_CENTRALES.includes(inst) || inst === 'Externo') {
    delete p.idFacultad
    delete p.idCarrera
  } else if (inst === 'Facultad') {
    delete p.idCarrera
  }
  Object.keys(p).forEach((k) => {
    if (p[k] === null || p[k] === '' || p[k] === TODOS) delete p[k]
  })
  return p
}

const cargarOpciones = async (idGestion) => {
  const params = idGestion ? { idGestion } : {}
  const { data } = await api.get('/reportes/opciones-filtro', { params })
  opciones.value = {
    gestiones: data.gestiones || [],
    facultades: data.facultades || [],
    carreras: data.carreras || [],
    categorias: data.categorias || [],
    tiposDanza: data.tiposDanza || [],
    instancias: data.instancias || [],
  }
}

const onGestionChange = async () => {
  const idGestion = esValorFiltroActivo(filtros.value.idGestion) ? filtros.value.idGestion : null
  await cargarOpciones(idGestion)
  filtros.value.idCategoria = null
}

const seleccionarTipo = (id) => {
  filtros.value.tipoReporte = id
  if (id === 'calificaciones') {
    filtros.value.ordenarPor = 'puesto'
    filtros.value.orden = 'ASC'
  } else {
    filtros.value.ordenarPor = 'nombreFraternidad'
    filtros.value.orden = 'ASC'
  }
  resultado.value = null
  error.value = ''
}

const buscar = async (page = 1) => {
  if (filtros.value.tipoReporte === 'calificaciones' && !esValorFiltroActivo(filtros.value.idGestion)) {
    error.value = 'Selecciona una gestión específica para consultar calificaciones.'
    return
  }

  loading.value = true
  error.value = ''
  try {
    const { data } = await api.post('/reportes/consultar', buildPayload(page))
    resultado.value = data
    filtros.value.page = page
  } catch (e) {
    error.value = e.response?.data?.message || 'No se pudo ejecutar la consulta.'
    resultado.value = null
  } finally {
    loading.value = false
  }
}

const descargarPdf = async () => {
  if (filtros.value.tipoReporte === 'calificaciones' && !esValorFiltroActivo(filtros.value.idGestion)) {
    notify.warning('Gestión requerida', 'Selecciona una gestión específica para el PDF de calificaciones.')
    return
  }

  generandoPdf.value = true
  try {
    const { data } = await api.post('/reportes/consultar/pdf', buildPayload(1), { responseType: 'blob' })
    const url = URL.createObjectURL(data)
    const link = document.createElement('a')
    link.href = url
    link.download = `Reporte_${filtros.value.tipoReporte}_${Date.now()}.pdf`
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
    notify.success('PDF generado', 'El reporte se descargó correctamente.')
  } catch {
    notify.error('Error', 'No se pudo generar el PDF.')
  } finally {
    generandoPdf.value = false
  }
}

onMounted(async () => {
  try {
    await cargarOpciones(null)
    const activa = opciones.value.gestiones.find((g) => g.activa)
    if (activa) filtros.value.idGestion = activa.idGestion
    await cargarOpciones(filtros.value.idGestion)
  } catch {
    error.value = 'No se pudieron cargar las opciones de filtro.'
  }
})
</script>
