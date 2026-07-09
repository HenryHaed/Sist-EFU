<template>
  <div class="dashboard-page max-w-7xl w-full">
    <!-- Header -->
    <div class="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
      <div>
        <div class="flex items-center gap-2 mb-1">
          <span class="h-1 w-8 bg-secondary inline-block"></span>
          <h2 class="dashboard-page-title tracking-tight text-primary uppercase italic">Gestión de Fraternidades</h2>
        </div>
        <p class="text-slate-500 text-sm mt-1 font-medium">
          Administración completa del listado oficial de fraternidades para la Entrada 2026.
        </p>
      </div>

      <button
        @click="abrirModalCrear"
        class="w-full sm:w-auto bg-primary text-white px-6 py-3 rounded-xl font-black text-sm uppercase tracking-wider shadow-lg shadow-primary/20 hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2"
      >
        <span class="material-symbols-outlined">add_circle</span>
        Nueva Fraternidad
      </button>
    </div>

    <!-- Table Card -->
    <div class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div v-if="loading" class="p-20 flex flex-col items-center justify-center gap-4 text-slate-400">
        <span class="material-symbols-outlined animate-spin text-5xl">progress_activity</span>
        <p class="font-bold uppercase tracking-widest text-xs">Cargando datos...</p>
      </div>

      <div v-else-if="fraternidades.length === 0" class="p-20 flex flex-col items-center justify-center gap-4 text-slate-300 italic">
        <span class="material-symbols-outlined text-6xl">groups_3</span>
        <p class="text-lg">No hay fraternidades registradas.</p>
      </div>

      <div v-else class="hidden md:block overflow-x-auto">
        <table class="w-full text-left">
          <thead>
            <tr class="bg-slate-50/50 border-b border-slate-100">
              <th
                @click="toggleSort('nombre')"
                class="px-6 py-4 text-[10px] font-black uppercase tracking-widest cursor-pointer select-none transition-colors hover:text-primary"
                :class="sortField === 'nombre' ? 'text-primary' : 'text-slate-400'"
              >
                <span class="inline-flex items-center gap-1">
                  Nombre / Origen
                  <span class="material-symbols-outlined text-[14px]" :class="sortField === 'nombre' ? 'text-primary' : 'text-slate-300'">
                    {{ sortIcon('nombre') }}
                  </span>
                </span>
              </th>
              <th
                @click="toggleSort('categoria')"
                class="px-6 py-4 text-[10px] font-black uppercase tracking-widest cursor-pointer select-none transition-colors hover:text-primary"
                :class="sortField === 'categoria' ? 'text-primary' : 'text-slate-400'"
              >
                <span class="inline-flex items-center gap-1">
                  Categoría
                  <span class="material-symbols-outlined text-[14px]" :class="sortField === 'categoria' ? 'text-primary' : 'text-slate-300'">
                    {{ sortIcon('categoria') }}
                  </span>
                </span>
              </th>
              <th
                @click="toggleSort('pertenencia')"
                class="px-6 py-4 text-[10px] font-black uppercase tracking-widest cursor-pointer select-none transition-colors hover:text-primary"
                :class="sortField === 'pertenencia' ? 'text-primary' : 'text-slate-400'"
              >
                <span class="inline-flex items-center gap-1">
                  Pertenencia
                  <span class="material-symbols-outlined text-[14px]" :class="sortField === 'pertenencia' ? 'text-primary' : 'text-slate-300'">
                    {{ sortIcon('pertenencia') }}
                  </span>
                </span>
              </th>
              <th
                @click="toggleSort('estado')"
                class="px-6 py-4 text-[10px] font-black uppercase tracking-widest cursor-pointer select-none transition-colors hover:text-primary"
                :class="sortField === 'estado' ? 'text-primary' : 'text-slate-400'"
              >
                <span class="inline-flex items-center gap-1">
                  Estado
                  <span class="material-symbols-outlined text-[14px]" :class="sortField === 'estado' ? 'text-primary' : 'text-slate-300'">
                    {{ sortIcon('estado') }}
                  </span>
                </span>
              </th>
              <th class="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr v-for="f in fraternidadesOrdenadas" :key="f.idFraternidad" class="hover:bg-slate-50/50 transition-colors group">
              <td class="px-6 py-4">
                <div class="flex items-center gap-3">
                  <div v-if="f.logoUrl" class="size-10 rounded-lg overflow-hidden border border-slate-200">
                    <img :src="getFullUrl(f.logoUrl)" :alt="f.nombre" class="w-full h-full object-cover" />
                  </div>
                  <div v-else class="size-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 font-bold group-hover:bg-primary/10 group-hover:text-primary transition-colors uppercase">
                    {{ f.nombre.substring(0, 2) }}
                  </div>
                  <div>
                    <p class="font-bold text-slate-900 leading-none mb-1">{{ f.nombre }}</p>
                    <p class="text-[10px] font-black text-slate-400 uppercase tracking-tighter">{{ f.nivelRepresentacion || '—' }}</p>
                  </div>
                </div>
              </td>
              <td class="px-6 py-4">
                <span class="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-[10px] font-black uppercase tracking-wider">
                  {{ f.categoria?.nombre || 'General' }}
                </span>
              </td>
              <td class="px-6 py-4">
                <p class="text-xs font-bold text-slate-700">
                  {{ f.facultad?.sigla || f.institucionExterna?.sigla || f.institucionExterna?.nombre || '—' }}
                </p>
                <p class="text-[9px] text-slate-400 font-medium">
                  {{ f.carrera?.nombre || 'Carrera/Institución' }}
                </p>
              </td>
              <td class="px-6 py-4">
                <div class="flex items-center gap-2">
                  <div class="size-2 rounded-full" :class="f.habilitadoEfu ? 'bg-green-500' : 'bg-red-500'"></div>
                  <span class="text-[10px] font-black uppercase tracking-widest" :class="f.habilitadoEfu ? 'text-green-600' : 'text-red-600'">
                    {{ f.habilitadoEfu ? 'Activa' : 'Inactiva' }}
                  </span>
                </div>
              </td>
              <td class="px-6 py-4 text-right">
                <div class="flex justify-end gap-2">
                  <button
                    @click="verDirectiva(f)"
                    class="px-3 py-1.5 rounded-lg flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-100 transition-all"
                    title="Ver directiva"
                  >
                    <span class="material-symbols-outlined text-[16px]">badge</span>
                    Ver Directiva
                  </button>
                  <button @click="editarFraternidad(f)" class="size-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-primary hover:bg-primary/5 transition-all">
                    <span class="material-symbols-outlined text-[18px]">edit</span>
                  </button>
                  <button @click="confirmarBorrar(f)" class="size-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-secondary hover:bg-secondary/5 transition-all">
                    <span class="material-symbols-outlined text-[18px]">delete</span>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Vista Mobile (Tarjetas) -->
      <div class="md:hidden p-4 space-y-4">
        <div v-for="f in fraternidadesOrdenadas" :key="f.idFraternidad + '_mobile'" class="bg-slate-50 border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col gap-3 relative overflow-hidden">
          
          <div class="absolute left-0 top-0 bottom-0 w-1.5" :class="f.habilitadoEfu ? 'bg-green-500' : 'bg-red-500'"></div>

          <div class="flex items-start gap-3 pl-2">
            <div v-if="f.logoUrl" class="size-12 rounded-lg overflow-hidden border border-slate-200 shrink-0">
              <img :src="getFullUrl(f.logoUrl)" :alt="f.nombre" class="w-full h-full object-cover" />
            </div>
            <div v-else class="size-12 rounded-lg bg-white border border-slate-200 shrink-0 flex items-center justify-center text-slate-400 font-bold uppercase text-lg">
              {{ f.nombre.substring(0, 2) }}
            </div>
            
            <div class="flex-1">
              <p class="font-black text-slate-900 leading-tight mb-1">{{ f.nombre }}</p>
              <div class="flex flex-wrap gap-1.5 mt-1">
                <span class="px-2 py-0.5 bg-white text-slate-600 rounded text-[9px] font-black uppercase tracking-wider border border-slate-200">
                  {{ f.categoria?.nombre || 'General' }}
                </span>
                <span v-if="f.nivelRepresentacion" class="text-[9px] font-black text-slate-400 uppercase tracking-tighter self-center ml-1">{{ f.nivelRepresentacion }}</span>
              </div>
            </div>
          </div>

          <div class="pl-2 flex flex-col gap-1 text-[10px] text-slate-600 bg-white p-2 rounded-lg border border-slate-100">
            <p class="text-xs font-bold text-slate-700">
              {{ f.facultad?.sigla || f.institucionExterna?.sigla || f.institucionExterna?.nombre || '—' }}
            </p>
            <p class="text-[9px] text-slate-400 font-medium">
              {{ f.carrera?.nombre || 'Carrera/Institución' }}
            </p>
          </div>

          <div class="pl-2 flex justify-between items-center">
            <span class="text-[10px] font-black uppercase tracking-widest" :class="f.habilitadoEfu ? 'text-green-600' : 'text-red-600'">
              {{ f.habilitadoEfu ? 'Activa' : 'Inactiva' }}
            </span>
            
            <div class="flex gap-2">
              <button
                @click="verDirectiva(f)"
                class="px-3 py-1.5 rounded-lg flex items-center gap-1 text-[9px] font-black uppercase tracking-wider text-indigo-700 bg-white border border-indigo-200 shadow-sm"
              >
                <span class="material-symbols-outlined text-[14px]">badge</span>
                Directiva
              </button>
              <button @click="editarFraternidad(f)" class="size-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-600 shadow-sm">
                <span class="material-symbols-outlined text-[16px]">edit</span>
              </button>
              <button @click="confirmarBorrar(f)" class="size-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-secondary shadow-sm">
                <span class="material-symbols-outlined text-[16px]">delete</span>
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>

    <!-- Modal Form -->
    <v-dialog v-model="modalAbierto" max-width="600">
      <v-card class="rounded-2xl">
        <v-card-text class="pa-6 max-h-[70vh] overflow-y-auto">
          <div class="mb-6">
            <h3 class="text-2xl font-black text-primary uppercase italic">{{ editando ? 'Editar' : 'Nueva' }} Fraternidad</h3>
            <p class="text-slate-500 text-sm">Completa los datos de la institución folklórica.</p>
          </div>

          <v-form @submit.prevent="guardar">
            <div class="space-y-6">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div class="col-span-2">
                  <label class="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Nombre de la Fraternidad</label>
                  <input v-model="form.nombre" type="text" placeholder="Ej. Morenada Central" class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none transition-all font-bold" />
                </div>

                <div class="col-span-2">
                  <label class="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Instancia (Nivel de Representación)</label>
                  <select v-model="form.nivelRepresentacion" class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold">
                    <option value="Facultad">Facultad</option>
                    <option value="Carrera">Carrera</option>
                    <option value="UMSA">UMSA (Nivel Central)</option>
                    <option value="FEDSIDUMSA">FEDSIDUMSA</option>
                    <option value="STUMSA">STUMSA</option>
                    <option value="Externo">Externo (Institución)</option>
                  </select>
                </div>

                <template v-if="form.nivelRepresentacion === 'Facultad' || form.nivelRepresentacion === 'Carrera'">
                  <div class="col-span-2 md:col-span-1">
                    <label class="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Facultad</label>
                    <select v-model="form.idFacultad" @change="onFacultadChange" class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold">
                      <option :value="null">-- Ninguna --</option>
                      <option v-for="fac in listFacultades" :key="fac.idFacultad" :value="fac.idFacultad">{{ fac.nombre }}</option>
                    </select>
                  </div>
                  <div v-if="form.nivelRepresentacion === 'Carrera'" class="col-span-2 md:col-span-1">
                    <label class="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Carrera</label>
                    <select v-model="form.idCarrera" :disabled="!form.idFacultad" class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold disabled:opacity-50">
                      <option :value="null">-- Ninguna --</option>
                      <option v-for="car in listCarreras" :key="car.idCarrera" :value="car.idCarrera">{{ car.nombre }}</option>
                    </select>
                  </div>
                </template>

                <template v-if="form.nivelRepresentacion === 'Externo'">
                  <div class="col-span-2">
                    <label class="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Institución de Procedencia</label>
                    <select v-model="form.idInstitucionExterna" class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold">
                      <option :value="null">-- Seleccionar Institución --</option>
                      <option v-for="inst in listInstituciones" :key="inst.idInstitucion" :value="inst.idInstitucion">{{ inst.nombre }}</option>
                    </select>
                  </div>
                </template>

                <div class="col-span-2">
                  <label class="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Categoría según Reglamento</label>
                  <select v-model="form.idCategoria" class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold transition-all focus:border-primary">
                    <option v-for="c in categorias" :key="c.idCategoria" :value="c.idCategoria">{{ c.nombre }}</option>
                  </select>
                  
                  <transition name="fade">
                    <div v-if="selectedCategoryDescription" class="mt-3 p-4 bg-primary/5 border border-primary/10 rounded-xl flex gap-3 animate-in fade-in slide-in-from-top-1 duration-300">
                      <span class="material-symbols-outlined text-primary text-lg">info</span>
                      <p class="text-[11px] font-medium text-slate-600 leading-relaxed">
                        <span class="font-black text-primary uppercase tracking-tighter block mb-1">Definición oficial:</span>
                        {{ selectedCategoryDescription }}
                      </p>
                    </div>
                  </transition>
                </div>

                <div class="col-span-2 flex items-center gap-3 py-2">
                  <input type="checkbox" v-model="form.habilitadoEfu" class="size-5 rounded border-slate-300 text-primary focus:ring-primary/20" />
                  <span class="text-sm font-bold text-slate-700">Habilitado para la Entrada Universitaria (EFU)</span>
                </div>
              </div>
            </div>
          </v-form>
        </v-card-text>

        <v-card-actions class="p-6 border-t border-slate-100 flex justify-end gap-4">
          <button type="button" @click="modalAbierto = false" class="px-6 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-100 transition-colors uppercase text-xs">Cancelar</button>
          <button type="submit" @click="guardar" class="px-8 py-3 bg-primary text-white rounded-xl font-black uppercase text-xs shadow-lg shadow-primary/20 hover:brightness-110 active:scale-95 transition-all">
            {{ editando ? 'Actualizar' : 'Crear Registro' }}
          </button>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import api from '../services/api'
import { notify } from '../utils/notify'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

const fraternidades = ref([])
const loading = ref(true)
const modalAbierto = ref(false)
const editando = ref(false)
const sortField = ref('nombre')
const sortDir = ref('asc')

const categorias = ref([])
const loadingCategorias = ref(true)


const listFacultades = ref([])
const listCarreras = ref([])
const listInstituciones = ref([])

const getFullUrl = (url) => {
  if (!url) return ''
  if (url.startsWith('http')) return url
  return `http://localhost:3000${url}`
}

const verDirectiva = (f) => {
  router.push({
    query: {
      v: 'directiva_fraternidad',
      idFraternidad: f.idFraternidad,
    },
  })
}

const form = ref({
  idFraternidad: null,
  nombre: '',
  nivelRepresentacion: 'Facultad',
  idCategoria: 1,
  idFacultad: null,
  idCarrera: null,
  idInstitucionExterna: null,
  habilitadoEfu: true,
  idSolicitud: null // Para guardar si viene desde una preinscripción
})

const cargarCategorias = async () => {
  try {
    const response = await api.get('/categorias') // Asumiendo que existe el endpoint o se cargará via fraternidades
    // Si no tienes endpoint de categorias todavía, usaré el listado oficial por ahora
    categorias.value = response.data.length > 0 ? response.data : [
      { idCategoria: 1, nombre: 'CATEGORÍA A', descripcion: 'Danzas tradicionales o criollo mestizas que han tenido origen en la ciudad y se las interpreta con bandas que tienen instrumentos de metal.' },
      { idCategoria: 2, nombre: 'CATEGORÍA B', descripcion: 'Danzas autóctonas de origen rural que en la actualidad se bailan con el acompañamiento de bandas que tienen instrumentos de metal.' },
      { idCategoria: 3, nombre: 'CATEGORÍA C', descripcion: 'Danzas autóctonas de origen rural, que se interpretan con instrumentos nativos' },
    ]
  } catch (e) {
    categorias.value = [
      { idCategoria: 1, nombre: 'CATEGORÍA A', descripcion: 'Danzas tradicionales o criollo mestizas que han tenido origen en la ciudad y se las interpreta con bandas que tienen instrumentos de metal.' },
      { idCategoria: 2, nombre: 'CATEGORÍA B', descripcion: 'Danzas autóctonas de origen rural que en la actualidad se bailan con el acompañamiento de bandas que tienen instrumentos de metal.' },
      { idCategoria: 3, nombre: 'CATEGORÍA C', descripcion: 'Danzas autóctonas de origen rural, que se interpretan con instrumentos nativos' },
    ]
  } finally {
    loadingCategorias.value = false
  }
}

const selectedCategoryDescription = computed(() => {
  const cat = categorias.value.find(c => c.idCategoria === form.value.idCategoria)
  return cat ? cat.descripcion : ''
})

const getPertenenciaSortKey = (f) => {
  const principal = f.facultad?.sigla || f.facultad?.nombre || f.institucionExterna?.sigla || f.institucionExterna?.nombre || ''
  const secundario = f.carrera?.nombre || ''
  return `${principal} ${secundario}`.trim().toLowerCase()
}

const toggleSort = (field) => {
  if (sortField.value === field) {
    sortDir.value = sortDir.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortField.value = field
    sortDir.value = 'asc'
  }
}

const sortIcon = (field) => {
  if (sortField.value !== field) return 'unfold_more'
  return sortDir.value === 'asc' ? 'arrow_upward' : 'arrow_downward'
}

const fraternidadesOrdenadas = computed(() => {
  const list = [...fraternidades.value]
  const dir = sortDir.value === 'asc' ? 1 : -1

  const compareText = (a, b) => {
    if (a < b) return -1 * dir
    if (a > b) return 1 * dir
    return 0
  }

  list.sort((a, b) => {
    switch (sortField.value) {
      case 'nombre': {
        const byNombre = compareText((a.nombre || '').toLowerCase(), (b.nombre || '').toLowerCase())
        if (byNombre !== 0) return byNombre
        return compareText((a.nivelRepresentacion || '').toLowerCase(), (b.nivelRepresentacion || '').toLowerCase())
      }
      case 'categoria':
        return compareText((a.categoria?.nombre || 'General').toLowerCase(), (b.categoria?.nombre || 'General').toLowerCase())
      case 'pertenencia':
        return compareText(getPertenenciaSortKey(a), getPertenenciaSortKey(b))
      case 'estado': {
        const valA = a.habilitadoEfu ? 1 : 0
        const valB = b.habilitadoEfu ? 1 : 0
        if (valA < valB) return -1 * dir
        if (valA > valB) return 1 * dir
        return compareText((a.nombre || '').toLowerCase(), (b.nombre || '').toLowerCase())
      }
      default:
        return 0
    }
  })

  return list
})

const cargarDatos = async () => {
  loading.value = true
  try {
    const [resFrat, resFac, resInst] = await Promise.all([
      api.get('/fraternidades'),
      api.get('/organizacion/facultades'),
      api.get('/organizacion/instituciones')
    ])
    fraternidades.value = resFrat.data
    listFacultades.value = resFac.data
    listInstituciones.value = resInst.data
    await cargarCategorias()

    // Lógica para pre-llenar si viene desde "Inscribir Oficialmente"
    if (route.query.inscribirSolicitud) {
      const idSolicitud = route.query.inscribirSolicitud
      try {
        const { data: sol } = await api.get(`/inscripciones/admin/todas`)
        const solicitud = sol.find(s => s.idSolicitud == idSolicitud)
        if (solicitud) {
          abrirModalInscribirSolicitud(solicitud)
        }
      } catch (err) {
        console.error('Error al cargar solicitud', err)
      }
    }
  } catch (error) {
    console.error('Error al cargar fraternidades:', error)
  } finally {
    loading.value = false
  }
}

const abrirModalInscribirSolicitud = async (solicitud) => {
  editando.value = false
  form.value = {
    idFraternidad: null,
    nombre: solicitud.nombreFraternidad,
    nivelRepresentacion: solicitud.instanciaRepresentacion,
    idCategoria: solicitud.categoria ? solicitud.categoria.idCategoria : 1,
    idFacultad: solicitud.facultad ? solicitud.facultad.idFacultad : null,
    idCarrera: solicitud.carrera ? solicitud.carrera.idCarrera : null,
    idInstitucionExterna: null,
    habilitadoEfu: true,
    idSolicitud: solicitud.idSolicitud
  }
  
  if (form.value.idFacultad) {
    await onFacultadChange() // Cargar carreras de esa facultad
    form.value.idCarrera = solicitud.carrera ? solicitud.carrera.idCarrera : null
  }

  modalAbierto.value = true
}

const onFacultadChange = async () => {
  form.value.idCarrera = null
  if (form.value.idFacultad) {
    const { data } = await api.get(`/organizacion/facultades/${form.value.idFacultad}/carreras`)
    listCarreras.value = data
  } else {
    listCarreras.value = []
  }
}

const abrirModalCrear = () => {
  editando.value = false
  form.value = {
    idFraternidad: null,
    nombre: '',
    nivelRepresentacion: 'Facultad',
    idCategoria: categorias.value.length > 0 ? categorias.value[0].idCategoria : 1,
    idFacultad: null,
    idCarrera: null,
    idInstitucionExterna: null,
    habilitadoEfu: true,
    idSolicitud: null
  }
  modalAbierto.value = true
}

const editarFraternidad = async (fraternidad) => {
  editando.value = true
  form.value = { 
    ...fraternidad,
    idCategoria: fraternidad.categoria ? fraternidad.categoria.idCategoria : (categorias.value.length > 0 ? categorias.value[0].idCategoria : null),
    idFacultad: fraternidad.facultad ? fraternidad.facultad.idFacultad : null,
    idCarrera: fraternidad.carrera ? fraternidad.carrera.idCarrera : null,
    idInstitucionExterna: fraternidad.institucionExterna ? fraternidad.institucionExterna.idInstitucion : null
  }
  
  if (form.value.idFacultad) {
    await onFacultadChange() // Cargar carreras de esa facultad
    form.value.idCarrera = fraternidad.carrera ? fraternidad.carrera.idCarrera : null // Re-asignar después de cargar lista
  }

  modalAbierto.value = true
}

const guardar = async () => {
  if (!form.value.nombre) {
    notify.error('Faltan datos', 'Ingresa el nombre de la fraternidad')
    return
  }

  const payload = {
    nombre: form.value.nombre,
    nivelRepresentacion: form.value.nivelRepresentacion,
    categoria: { idCategoria: form.value.idCategoria },
    idFacultad: form.value.idFacultad,
    idCarrera: form.value.idCarrera,
    idInstitucionExterna: form.value.idInstitucionExterna,
    habilitadoEfu: form.value.habilitadoEfu
  }

  try {
    if (form.value.idSolicitud) {
      await api.post(`/inscripciones/inscribir-desde-solicitud/${form.value.idSolicitud}`, payload)
      router.replace({ query: { v: 'fraternidades_crud' } })
    } else if (editando.value) {
      await api.put(`/fraternidades/${form.value.idFraternidad}`, payload)
    } else {
      await api.post('/fraternidades', payload)
    }
    modalAbierto.value = false
    notify.success('¡Guardado!', `Fraternidad ${editando.value || form.value.idSolicitud ? 'actualizada e inscrita' : 'registrada'} correctamente.`)
    cargarDatos()
  } catch (error) {
    console.error('Error al guardar:', error)
    notify.error('Error', 'No se pudo guardar la fraternidad.')
  }
}

const confirmarBorrar = async (f) => {
  const r = await notify.confirm('¿Eliminar fraternidad?', `¿Estás seguro de eliminar "${f.nombre}"? Esta acción no se puede deshacer.`, 'Sí, eliminar')
  if (r.isConfirmed) {
    try {
      await api.delete(`/fraternidades/${f.idFraternidad}`)
      notify.success('Eliminado', 'La fraternidad ha sido removida del listado.')
      cargarDatos()
    } catch (error) {
      console.error('Error al borrar:', error)
      notify.error('Error', 'No se pudo eliminar la fraternidad.')
    }
  }
}

onMounted(cargarDatos)
</script>
