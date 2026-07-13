<template>
  <div class="dashboard-page max-w-5xl">
    <!-- Header -->
    <div class="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <h2 class="text-3xl font-black text-primary tracking-tighter uppercase italic">Gestiones Anuales</h2>
        <p class="text-slate-500 text-sm mt-1">Selecciona una gestión para administrar sus fases de evaluación.</p>
      </div>
      <div class="flex gap-2">
        <button @click="abrirModalClonar" class="bg-indigo-50 text-indigo-700 px-4 py-3 rounded-xl font-black shadow-sm shadow-indigo-100 hover:bg-indigo-100 transition-all flex items-center gap-2">
          <span class="material-symbols-outlined">content_copy</span>
          CLONAR
        </button>
        <button @click="abrirModalNuevaGestion" class="bg-primary text-white px-6 py-3 rounded-xl font-black shadow-lg shadow-primary/20 hover:bg-blue-900 transition-all flex items-center gap-2">
          <span class="material-symbols-outlined">add_circle</span>
          NUEVA GESTIÓN
        </button>
      </div>
    </div>

    <!-- Cargando -->
    <div v-if="cargando" class="flex items-center justify-center py-20 text-slate-400">
      <v-progress-circular indeterminate color="primary" size="40" class="mr-3"></v-progress-circular>
      <span class="font-bold">Cargando gestiones...</span>
    </div>

    <!-- Grid de Gestiones -->
    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div
        v-for="g in gestiones"
        :key="g.idGestion"
        @click="abrirGestion(g)"
        class="group relative bg-white border-2 rounded-3xl p-6 cursor-pointer transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
        :class="g.activa ? 'border-primary shadow-lg shadow-primary/10' : 'border-slate-200 hover:border-primary/40'"
      >
        <!-- Badge Activa -->
        <div v-if="g.activa" class="absolute top-4 right-4 flex items-center gap-1.5 bg-emerald-100 text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
          <span class="size-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
          Activa
        </div>
        <div v-else class="absolute top-4 right-4 flex items-center gap-1 bg-slate-100 text-slate-500 border border-slate-200 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
          <span class="material-symbols-outlined text-[11px]">lock</span>
          Histórica
        </div>

        <!-- Año -->
        <div class="text-6xl font-black text-primary/10 group-hover:text-primary/20 transition-all leading-none mb-4">
          {{ g.anio }}
        </div>
        <h3 class="text-2xl font-black text-primary italic">Gestión {{ g.anio }}</h3>
        <p v-if="g.lema" class="text-xs text-slate-500 mt-1 italic">"{{ g.lema }}"</p>

        <!-- Stats -->
        <div class="mt-5 grid grid-cols-3 gap-3 text-center">
          <div class="bg-slate-50 rounded-xl py-2">
            <p class="text-lg font-black text-slate-700">{{ g.cantidadFases }}</p>
            <p class="text-[9px] uppercase font-black text-slate-400 tracking-widest">Fases</p>
          </div>
          <div class="bg-blue-50 rounded-xl py-2">
            <p class="text-lg font-black text-blue-700">{{ g.pesoEFUTotal }}%</p>
            <p class="text-[9px] uppercase font-black text-blue-400 tracking-widest">EFU</p>
          </div>
          <div class="bg-amber-50 rounded-xl py-2">
            <p class="text-lg font-black text-amber-700">{{ g.fasesExternas }}</p>
            <p class="text-[9px] uppercase font-black text-amber-400 tracking-widest">Externos</p>
          </div>
        </div>

        <!-- Barra presupuesto EFU -->
        <div class="mt-4">
          <div class="flex justify-between items-center mb-1">
            <span class="text-[9px] uppercase font-black text-slate-400 tracking-widest">Presupuesto EFU</span>
            <span class="text-[10px] font-black" :class="g.disponibleEFU === 0 ? 'text-emerald-600' : g.disponibleEFU < 20 ? 'text-amber-600' : 'text-slate-500'">
              {{ g.disponibleEFU }}% libre
            </span>
          </div>
          <div class="h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              class="h-full rounded-full transition-all"
              :class="g.pesoEFUTotal >= 100 ? 'bg-emerald-500' : g.pesoEFUTotal >= 80 ? 'bg-amber-500' : 'bg-primary'"
              :style="{ width: Math.min(g.pesoEFUTotal, 100) + '%' }"
            ></div>
          </div>
        </div>

        <!-- CTA & Actions -->
        <div class="mt-5 flex items-center justify-between border-t border-slate-50 pt-4">
          <div class="flex items-center gap-2 font-black text-sm group-hover:gap-3 transition-all"
            :class="g.activa ? 'text-primary' : 'text-slate-400'">
            <span class="material-symbols-outlined text-[18px]">{{ g.activa ? 'arrow_forward' : 'visibility' }}</span>
            <span>{{ g.activa ? 'Gestionar' : 'Ver Historial' }}</span>
          </div>
          
          <div class="flex items-center gap-2">
            <button @click.stop="activarGestion(g)" class="size-8 bg-slate-50 text-slate-500 hover:bg-primary hover:text-white rounded-lg flex items-center justify-center transition-all shadow-sm group/btn" :title="g.activa ? 'Configurar Gestión' : 'Configurar y Activar'">
              <span class="material-symbols-outlined text-[18px]">settings_suggest</span>
            </button>
            <button @click.stop="eliminarGestion(g)" class="size-8 bg-red-50 text-red-600 hover:bg-red-500 hover:text-white rounded-lg flex items-center justify-center transition-all shadow-sm" title="Eliminar Gestión">
              <span class="material-symbols-outlined text-[18px]">delete</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- MODAL NUEVA GESTION -->
    <v-dialog v-model="modalOpen" max-width="450px">
      <v-card class="rounded-3xl">
        <v-card-title class="bg-slate-800 text-white pa-6">
          <h3 class="text-lg font-black italic uppercase tracking-tighter">Crear Gestión</h3>
          <p class="text-slate-300 text-[10px] uppercase tracking-widest mt-0.5">Configura una nueva temporada</p>
        </v-card-title>
        <v-card-text class="pa-6 space-y-5">
          <div>
            <label class="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Año de la Gestión</label>
            <input v-model="form.anio" type="number" class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-primary outline-none font-bold transition-all" />
          </div>
          <div>
            <label class="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Lema o Tenor</label>
            <textarea v-model="form.lema" rows="2" class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-primary outline-none text-sm transition-all resize-none"></textarea>
          </div>
          <div class="p-4 bg-blue-50 rounded-xl border border-blue-100 flex items-center justify-between">
            <div>
              <p class="text-xs font-black text-blue-800 uppercase">Establecer Activa</p>
              <p class="text-[9px] text-blue-600 uppercase font-bold">Inactivará la gestión actual</p>
            </div>
            <input type="checkbox" v-model="form.activa" class="size-5 accent-primary cursor-pointer" />
          </div>
        </v-card-text>
        <v-card-actions class="pa-4 border-t border-slate-100 bg-slate-50">
          <v-spacer></v-spacer>
          <button @click="modalOpen = false" class="px-4 py-2 text-slate-500 font-bold text-sm hover:text-slate-800 transition-colors">Cancelar</button>
          <button @click="guardarGestion" :disabled="saving" class="px-6 py-2 bg-primary text-white rounded-xl font-black text-sm shadow-lg shadow-primary/20 hover:bg-blue-900 transition-all">
            {{ saving ? 'Guardando...' : 'Crear Gestión' }}
          </button>
        </v-card-actions>
      </v-card>
    </v-dialog>
    <!-- MODAL CLONAR GESTION -->
    <v-dialog v-model="modalClonarOpen" max-width="500px">
      <v-card class="rounded-3xl">
        <v-card-title class="bg-indigo-900 text-white pa-6">
          <h3 class="text-lg font-black italic uppercase tracking-tighter">Clonar Gestión</h3>
          <p class="text-indigo-200 text-[10px] uppercase tracking-widest mt-0.5">Copia configuración básica</p>
        </v-card-title>
        <v-card-text class="pa-6 space-y-5">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Gestión origen</label>
              <select v-model="formClonar.idOrigen" class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-indigo-500 outline-none font-bold text-sm">
                <option value="">Seleccione...</option>
                <option v-for="g in gestiones" :key="g.idGestion" :value="g.idGestion">{{ g.anio }}</option>
              </select>
            </div>
            <div>
              <label class="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Gestión destino</label>
              <select v-model="formClonar.idDestino" class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-indigo-500 outline-none font-bold text-sm">
                <option value="">Seleccione...</option>
                <option v-for="g in gestiones" :key="g.idGestion" :value="g.idGestion" :disabled="g.idGestion === formClonar.idOrigen">{{ g.anio }}</option>
              </select>
            </div>
          </div>
          <div class="pt-2">
            <label class="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3">¿Qué desea clonar? (Checklist)</label>
            <div class="space-y-2">
              <label class="flex items-center gap-3 p-3 bg-slate-50 border border-slate-100 rounded-xl cursor-pointer hover:bg-indigo-50 transition-colors">
                <input type="checkbox" v-model="formClonar.modules" value="fases_criterios" class="size-4 accent-indigo-600" />
                <div>
                  <div class="text-sm font-bold text-slate-800">Fases y Criterios</div>
                  <div class="text-[10px] text-slate-500 uppercase tracking-wider">Toda la estructura de calificación</div>
                </div>
              </label>
              <label class="flex items-center gap-3 p-3 bg-slate-50 border border-slate-100 rounded-xl cursor-pointer hover:bg-indigo-50 transition-colors">
                <input type="checkbox" v-model="formClonar.modules" value="categorias" class="size-4 accent-indigo-600" />
                <div>
                  <div class="text-sm font-bold text-slate-800">Categorías de Participación</div>
                  <div class="text-[10px] text-slate-500 uppercase tracking-wider">Danhz, Auqui, etc.</div>
                </div>
              </label>
              <label class="flex items-center gap-3 p-3 bg-slate-50 border border-slate-100 rounded-xl cursor-pointer hover:bg-indigo-50 transition-colors">
                <input type="checkbox" v-model="formClonar.modules" value="infracciones" class="size-4 accent-indigo-600" />
                <div>
                  <div class="text-sm font-bold text-slate-800">Reglas de Infracción</div>
                  <div class="text-[10px] text-slate-500 uppercase tracking-wider">Penalizaciones generales</div>
                </div>
              </label>
              <label class="flex items-center gap-3 p-3 bg-slate-50 border border-slate-100 rounded-xl cursor-pointer hover:bg-indigo-50 transition-colors">
                <input type="checkbox" v-model="formClonar.modules" value="fraternidades_base" class="size-4 accent-indigo-600" />
                <div>
                  <div class="text-sm font-bold text-slate-800">Fraternidades - Listado Base</div>
                  <div class="text-[10px] text-slate-500 uppercase tracking-wider">Nombres y facultad (sin registros activos ni notas)</div>
                </div>
              </label>
            </div>
          </div>
        </v-card-text>
        <v-card-actions class="pa-4 border-t border-slate-100 bg-slate-50">
          <v-spacer></v-spacer>
          <button @click="modalClonarOpen = false" class="px-4 py-2 text-slate-500 font-bold text-sm hover:text-slate-800 transition-colors">Cancelar</button>
          <button @click="guardarClonacion" :disabled="cloning || !formClonar.idOrigen || !formClonar.idDestino || formClonar.modules.length===0" class="px-6 py-2 bg-indigo-600 text-white rounded-xl font-black text-sm shadow-lg shadow-indigo-600/20 hover:bg-indigo-800 transition-all disabled:opacity-50">
            {{ cloning ? 'Clonando...' : 'Iniciar Clonación' }}
          </button>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import api from '../services/api'
import { notify } from '../utils/notify'

const emit = defineEmits(['seleccionar-gestion', 'ir-ajustes-gestion'])
const gestiones = ref([])
const cargando = ref(true)

const modalOpen = ref(false)
const saving = ref(false)
const form = ref({
  anio: new Date().getFullYear(),
  lema: '',
  activa: true
})

const modalClonarOpen = ref(false)
const cloning = ref(false)
const formClonar = ref({
  idOrigen: '',
  idDestino: '',
  modules: ['fases_criterios', 'categorias', 'infracciones', 'fraternidades_base']
})

const abrirModalClonar = () => {
  formClonar.value = { idOrigen: '', idDestino: '', modules: ['fases_criterios', 'categorias', 'infracciones', 'fraternidades_base'] }
  modalClonarOpen.value = true
}

const guardarClonacion = async () => {
  if (formClonar.value.idOrigen === formClonar.value.idDestino) return notify.error('Error', 'El origen y destino no pueden ser iguales')
  cloning.value = true
  try {
    await api.post(`/evaluaciones/gestiones/${formClonar.value.idOrigen}/clonar`, {
      idDestino: formClonar.value.idDestino,
      modules: formClonar.value.modules
    })
    modalClonarOpen.value = false
    notify.success('Clonado', 'Configuración clonada correctamente')
    cargar()
  } catch (e) {
    notify.error('Error', e.response?.data?.message || 'No se pudo clonar la configuración')
  } finally {
    cloning.value = false
  }
}

const cargar = async () => {
  cargando.value = true
  try {
    const { data } = await api.get('/evaluaciones/gestiones')
    gestiones.value = data
  } catch (e) { console.error(e) }
  finally { cargando.value = false }
}

const abrirGestion = (g) => emit('seleccionar-gestion', g)

const abrirModalNuevaGestion = () => {
  form.value = { anio: new Date().getFullYear(), lema: '', activa: true }
  modalOpen.value = true
}

const guardarGestion = async () => {
  if (!form.value.anio) return notify.error('Error', 'El año es obligatorio')
  saving.value = true
  try {
    await api.post('/evaluaciones/gestiones', form.value)
    modalOpen.value = false
    notify.success('Creado', 'Gestión creada correctamente')
    cargar()
  } catch (e) {
    notify.error('Error', 'No se pudo crear la gestión')
  } finally {
    saving.value = false
  }
}

const activarGestion = (g) => {
  emit('ir-ajustes-gestion', g.idGestion)
}

const eliminarGestion = async (g) => {
  let timerInterval
  notify.confirm(
    '¿Estás absolutamente seguro?',
    `Esta acción eliminará permanentemente la Gestión ${g.anio} y TODAS sus fases, criterios y evaluaciones asociadas. Esta acción NO se puede deshacer.`,
    'Eliminar permanentemente',
    {
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Eliminar (10s)',
      didOpen: () => {
        const confirmBtn = notify.swal.getConfirmButton()
        confirmBtn.disabled = true
        let seconds = 10
        timerInterval = setInterval(() => {
          seconds--
          confirmBtn.innerText = `Eliminar (${seconds}s)`
          if (seconds <= 0) {
            confirmBtn.disabled = false
            confirmBtn.innerText = 'Eliminar permanentemente'
            clearInterval(timerInterval)
          }
        }, 1000)
      },
      willClose: () => {
        clearInterval(timerInterval)
      }
    }
  ).then(async (result) => {
    if (result.isConfirmed) {
      try {
        await api.delete(`/evaluaciones/gestiones/${g.idGestion}`)
        notify.success('Eliminado', `La gestión ${g.anio} ha sido eliminada.`)
        cargar()
      } catch (e) {
        notify.error('Error', e.response?.data?.message || 'No se pudo eliminar la gestión.')
      }
    }
  })
}

onMounted(cargar)
</script>
