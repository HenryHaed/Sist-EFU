<template>
  <div class="p-6 md:p-8 max-w-7xl mx-auto min-h-[calc(100vh-4rem)]">
    <div class="flex items-center justify-between mb-8 overflow-hidden">
      <div>
        <h2 class="text-3xl font-black text-primary tracking-tighter uppercase italic">Gestión de Organización</h2>
        <p class="text-slate-500 font-medium text-sm mt-1">
          Administra las facultades, carreras e instituciones externas que participan en el evento.
        </p>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
      
      <!-- FACULTADES SECTION -->
      <div class="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        <div class="bg-primary px-6 py-4 flex items-center justify-between text-white shrink-0">
          <div class="flex items-center gap-3">
            <span class="material-symbols-outlined">account_balance</span>
            <h3 class="font-black uppercase tracking-widest text-sm">Facultades (UMSA)</h3>
          </div>
          <button @click="abrirModalFacultad()" class="size-8 bg-white/20 hover:bg-white/30 rounded-lg flex items-center justify-center transition-colors">
            <span class="material-symbols-outlined text-sm">add</span>
          </button>
        </div>

        <div class="p-6 flex-1 overflow-y-auto max-h-[600px] space-y-3">
          <div v-if="loadingFacultades" class="flex justify-center py-10">
            <span class="material-symbols-outlined animate-spin text-primary">progress_activity</span>
          </div>

          <div 
            v-for="fac in facultades" :key="fac.idFacultad"
            class="group p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-primary/30 transition-all cursor-pointer"
            :class="facultadSeleccionada?.idFacultad === fac.idFacultad ? 'ring-2 ring-primary border-transparent bg-primary/5' : ''"
            @click="seleccionarFacultad(fac)"
          >
            <div class="flex items-center justify-between">
              <div>
                <p class="text-[10px] font-black text-primary uppercase tracking-widest">{{ fac.sigla || 'UMSA' }}</p>
                <h4 class="font-bold text-slate-800 leading-tight">{{ fac.nombre }}</h4>
              </div>
              <div class="flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                <button @click.stop="abrirModalFacultad(fac)" class="size-8 text-slate-400 hover:text-primary flex items-center justify-center">
                    <span class="material-symbols-outlined text-[18px]">edit</span>
                </button>
                <button @click.stop="eliminarFacultad(fac)" class="size-8 text-slate-400 hover:text-secondary flex items-center justify-center">
                    <span class="material-symbols-outlined text-[18px]">delete</span>
                </button>
              </div>
            </div>
          </div>

          <div v-if="facultades.length === 0 && !loadingFacultades" class="text-center py-10 opacity-40">
             <span class="material-symbols-outlined text-4xl mb-2">account_balance</span>
             <p class="text-xs font-bold uppercase tracking-widest">No hay facultades registradas</p>
          </div>
        </div>
      </div>

      <!-- CARRERAS SECTION -->
      <div class="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        <div class="bg-secondary px-6 py-4 flex items-center justify-between text-white shrink-0">
          <div class="flex items-center gap-3">
            <span class="material-symbols-outlined">school</span>
            <h3 class="font-black uppercase tracking-widest text-sm">
              Carreras de {{ facultadSeleccionada ? facultadSeleccionada.sigla || 'Facultad' : '...' }}
            </h3>
          </div>
          <button 
            v-if="facultadSeleccionada" 
            @click="abrirModalCarrera()" 
            class="size-8 bg-white/20 hover:bg-white/30 rounded-lg flex items-center justify-center transition-colors"
          >
            <span class="material-symbols-outlined text-sm">add</span>
          </button>
        </div>

        <div class="p-6 flex-1 overflow-y-auto max-h-[600px] space-y-3">
          <div v-if="!facultadSeleccionada" class="flex flex-col items-center justify-center py-20 text-slate-300">
             <span class="material-symbols-outlined text-5xl mb-3">arrow_back</span>
             <p class="text-xs font-bold uppercase tracking-widest">Selecciona una facultad para ver sus carreras</p>
          </div>
          
          <template v-else>
            <div v-if="loadingCarreras" class="flex justify-center py-10">
              <span class="material-symbols-outlined animate-spin text-secondary">progress_activity</span>
            </div>

            <div 
              v-for="car in carreras" :key="car.idCarrera"
              class="group p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between"
            >
              <h4 class="font-bold text-slate-800">{{ car.nombre }}</h4>
              <div class="flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                 <button @click="abrirModalCarrera(car)" class="size-8 text-slate-400 hover:text-primary flex items-center justify-center">
                    <span class="material-symbols-outlined text-[18px]">edit</span>
                 </button>
                 <button @click="eliminarCarrera(car)" class="size-8 text-slate-400 hover:text-secondary flex items-center justify-center">
                    <span class="material-symbols-outlined text-[18px]">delete</span>
                 </button>
              </div>
            </div>

            <div v-if="carreras.length === 0 && !loadingCarreras" class="text-center py-10 opacity-40">
              <span class="material-symbols-outlined text-4xl mb-2">school</span>
              <p class="text-xs font-bold uppercase tracking-widest">No hay carreras en esta facultad</p>
            </div>
          </template>
        </div>
      </div>
    </div>

    <!-- PANE INSTITUCIONES EXTERNAS -->
    <div class="mt-8 bg-white rounded-3xl border-2 border-dashed border-slate-200 p-8 flex flex-col items-center">
        <h3 class="font-black text-slate-400 uppercase tracking-widest text-xs mb-6">Instituciones Externas Habilitadas</h3>
        <div class="flex flex-wrap justify-center gap-3">
            <div v-for="inst in instituciones" :key="inst.idInstitucionExterna" class="px-4 py-2 bg-slate-100 rounded-xl flex items-center gap-3 group border border-transparent hover:border-slate-300 transition-all">
                <div @click="abrirModalInstitucion(inst)" class="flex flex-col cursor-pointer">
                  <span v-if="inst.sigla" class="text-[9px] font-black text-primary uppercase leading-tight">{{ inst.sigla }}</span>
                  <span class="font-bold text-slate-600 text-sm italic leading-tight">{{ inst.nombre }}</span>
                </div>
                <button @click="eliminarInstitucion(inst)" class="size-5 flex items-center justify-center text-slate-300 hover:text-secondary opacity-0 group-hover:opacity-100 transition-all">
                    <span class="material-symbols-outlined text-[14px]">close</span>
                </button>
            </div>
            <button @click="abrirModalInstitucion()" class="px-4 py-2 border border-slate-200 rounded-xl flex items-center gap-2 hover:bg-slate-50 transition-colors">
                <span class="material-symbols-outlined text-slate-400">add</span>
                <span class="font-bold text-slate-400 text-sm">Nueva Institución</span>
            </button>
        </div>
    </div>

    <!-- MODALES -->
    <div v-if="modalFacultad" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div class="bg-white w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl p-8">
        <h3 class="font-black uppercase tracking-tight text-xl text-primary mb-6 italic underline decoration-secondary decoration-4 underline-offset-4">
            {{ editandoFacultad ? 'Editar' : 'Nueva' }} Facultad
        </h3>
        <div class="space-y-4">
          <div>
            <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 px-1">Sigla</label>
            <input v-model="formFacultad.sigla" placeholder="Ej: FCPN" class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none focus:border-primary appearance-none transition-all" />
          </div>
          <div>
            <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 px-1">Nombre Completo</label>
            <input v-model="formFacultad.nombre" placeholder="Ej: Facultad de Ciencias..." class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none focus:border-primary appearance-none transition-all" />
          </div>
        </div>
        <div class="mt-8 flex gap-3">
          <button @click="modalFacultad = false" class="flex-1 py-3 text-slate-400 font-bold uppercase text-[10px] tracking-widest hover:bg-slate-50 rounded-2xl transition-colors">Cancelar</button>
          <button @click="guardarFacultad" :disabled="!formFacultad.nombre" class="flex-[2] py-3 bg-primary text-white font-black uppercase text-[10px] tracking-widest rounded-2xl shadow-lg shadow-primary/20 hover:brightness-110 transition-all disabled:opacity-50">
              {{ editandoFacultad ? 'Actualizar' : 'Crear Registro' }}
          </button>
        </div>
      </div>
    </div>

    <div v-if="modalCarrera" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div class="bg-white w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl p-8">
        <h3 class="font-black uppercase tracking-tight text-xl text-secondary mb-6 italic underline decoration-primary decoration-4 underline-offset-4">
            {{ editandoCarrera ? 'Editar' : 'Nueva' }} Carrera
        </h3>
        <p class="text-[10px] font-bold text-slate-400 uppercase mb-6">Asignada a: {{ facultadSeleccionada.nombre }}</p>
        <div>
          <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 px-1">Nombre de la Carrera</label>
          <input v-model="formCarrera.nombre" placeholder="Ej: Informatica" class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none focus:border-secondary appearance-none transition-all" />
        </div>
        <div class="mt-8 flex gap-3">
          <button @click="modalCarrera = false" class="flex-1 py-3 text-slate-400 font-bold uppercase text-[10px] tracking-widest hover:bg-slate-50 rounded-2xl transition-colors">Cancelar</button>
          <button @click="guardarCarrera" :disabled="!formCarrera.nombre" class="flex-[2] py-3 bg-secondary text-white font-black uppercase text-[10px] tracking-widest rounded-2xl shadow-lg shadow-secondary/20 hover:brightness-110 transition-all disabled:opacity-50">
              {{ editandoCarrera ? 'Actualizar' : 'Añadir Carrera' }}
          </button>
        </div>
      </div>
    </div>

    <div v-if="modalInstitucion" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div class="bg-white w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl p-8 text-center">
        <span class="material-symbols-outlined text-4xl text-slate-300 mb-2">domain</span>
        <h3 class="font-black uppercase tracking-tight text-xl text-slate-800 mb-6">
            {{ editandoInstitucion ? 'Editar' : 'Nueva' }} Institución
        </h3>
        <div class="space-y-4">
          <div>
            <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 px-1">Sigla / Acrónimo</label>
            <input v-model="formInstitucion.sigla" placeholder="Ej: UPEA" class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none focus:border-slate-800 text-center transition-all" />
          </div>
          <div>
            <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 px-1">Nombre de la Institución</label>
            <input v-model="formInstitucion.nombre" placeholder="Ej: Universidad Pública..." class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none focus:border-slate-800 text-center transition-all" />
          </div>
        </div>
        <div class="mt-8 flex gap-3">
          <button @click="modalInstitucion = false" class="flex-1 py-3 text-slate-400 font-bold uppercase text-[10px] tracking-widest hover:bg-slate-50 rounded-2xl transition-colors">Cancelar</button>
          <button @click="guardarInstitucion" :disabled="!formInstitucion.nombre" class="flex-[2] py-3 bg-slate-800 text-white font-black uppercase text-[10px] tracking-widest rounded-2xl shadow-lg transition-all disabled:opacity-50">
              {{ editandoInstitucion ? 'Guardar Cambios' : 'Registrar Institución' }}
          </button>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import api from '../services/api'
import Swal from 'sweetalert2'

const facultades = ref([])
const carreras = ref([])
const instituciones = ref([])

const loadingFacultades = ref(false)
const loadingCarreras = ref(false)
const facultadSeleccionada = ref(null)

const modalFacultad = ref(false)
const modalCarrera = ref(false)
const modalInstitucion = ref(false)

const editandoFacultad = ref(false)
const editandoCarrera = ref(false)
const editandoInstitucion = ref(false)

const formFacultad = ref({ idFacultad: null, nombre: '', sigla: '' })
const formCarrera = ref({ idCarrera: null, nombre: '' })
const formInstitucion = ref({ idInstitucion: null, nombre: '', sigla: '' })

const cargarDatos = async () => {
    loadingFacultades.value = true
    try {
        const [resFac, resInst] = await Promise.all([
            api.get('/organizacion/facultades'),
            api.get('/organizacion/instituciones')
        ])
        facultades.value = resFac.data
        instituciones.value = resInst.data
    } finally {
        loadingFacultades.value = false
    }
}

const seleccionarFacultad = async (fac) => {
    facultadSeleccionada.value = fac
    loadingCarreras.value = true
    try {
        const { data } = await api.get(`/organizacion/facultades/${fac.idFacultad}/carreras`)
        carreras.value = data
    } finally {
        loadingCarreras.value = false
    }
}

// --- CRUD FACULTADES ---
const abrirModalFacultad = (fac = null) => {
    if (fac) {
        editandoFacultad.value = true
        formFacultad.value = { ...fac }
    } else {
        editandoFacultad.value = false
        formFacultad.value = { idFacultad: null, nombre: '', sigla: '' }
    }
    modalFacultad.value = true
}

const guardarFacultad = async () => {
    try {
        if (editandoFacultad.value) {
            await api.put(`/organizacion/facultades/${formFacultad.value.idFacultad}`, formFacultad.value)
        } else {
            await api.post('/organizacion/facultades', formFacultad.value)
        }
        modalFacultad.value = false
        cargarDatos()
        Swal.fire({ icon: 'success', title: editandoFacultad.value ? 'Actualizado' : 'Creado', toast: true, position: 'top-end', showConfirmButton: false, timer: 2000 })
    } catch (e) { Swal.fire('Error', 'No se pudo guardar', 'error') }
}

const eliminarFacultad = async (fac) => {
    const res = await Swal.fire({ title: '¿Eliminar Facultad?', text: 'Se borrarán sus carreras vinculadas.', icon: 'warning', showCancelButton: true, confirmButtonColor: '#d33' })
    if (res.isConfirmed) {
        await api.delete(`/organizacion/facultades/${fac.idFacultad}`)
        if (facultadSeleccionada.value?.idFacultad === fac.idFacultad) facultadSeleccionada.value = null
        cargarDatos()
    }
}

// --- CRUD CARRERAS ---
const abrirModalCarrera = (car = null) => {
    if (car) {
        editandoCarrera.value = true
        formCarrera.value = { ...car }
    } else {
        editandoCarrera.value = false
        formCarrera.value = { idCarrera: null, nombre: '' }
    }
    modalCarrera.value = true
}

const guardarCarrera = async () => {
    try {
        if (editandoCarrera.value) {
            await api.put(`/organizacion/carreras/${formCarrera.value.idCarrera}`, formCarrera.value)
        } else {
            await api.post(`/organizacion/facultades/${facultadSeleccionada.value.idFacultad}/carreras`, formCarrera.value)
        }
        modalCarrera.value = false
        seleccionarFacultad(facultadSeleccionada.value)
    } catch (e) { Swal.fire('Error', 'No se pudo guardar', 'error') }
}

const eliminarCarrera = async (car) => {
    if (confirm('¿Eliminar carrera?')) {
        await api.delete(`/organizacion/carreras/${car.idCarrera}`)
        seleccionarFacultad(facultadSeleccionada.value)
    }
}

// --- CRUD INSTITUCIONES ---
const abrirModalInstitucion = (inst = null) => {
    if (inst) {
        editandoInstitucion.value = true
        // El backend responde idInstitucion en el PK pero en el template use idInstitucionExterna, chequear
        formInstitucion.value = { ...inst, idInstitucion: inst.idInstitucionExterna || inst.idInstitucion }
    } else {
        editandoInstitucion.value = false
        formInstitucion.value = { idInstitucion: null, nombre: '', sigla: '' }
    }
    modalInstitucion.value = true
}

const guardarInstitucion = async () => {
    try {
        if (editandoInstitucion.value) {
            await api.put(`/organizacion/instituciones/${formInstitucion.value.idInstitucion}`, formInstitucion.value)
        } else {
            await api.post('/organizacion/instituciones', formInstitucion.value)
        }
        modalInstitucion.value = false
        cargarDatos()
    } catch (e) { Swal.fire('Error', 'No se pudo guardar', 'error') }
}

const eliminarInstitucion = async (inst) => {
    await api.delete(`/organizacion/instituciones/${inst.idInstitucionExterna || inst.idInstitucion }`)
    cargarDatos()
}

onMounted(cargarDatos)
</script>
