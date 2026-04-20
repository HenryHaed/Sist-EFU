<template>
  <div class="p-6 md:p-8 max-w-7xl mx-auto min-h-[calc(100vh-4rem)]">
    
    <!-- STEP 1: SELECT CONTEST (FASE) -->
    <div v-if="!faseSeleccionada" class="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div class="mb-10">
        <h2 class="text-3xl font-black text-primary tracking-tighter uppercase italic">Inscripción a Concursos</h2>
        <p class="text-slate-500 font-medium text-sm mt-1">
          Selecciona un concurso externo para gestionar sus participantes y competidores.
        </p>
      </div>

      <div v-if="loadingFases" class="flex justify-center py-20">
        <span class="material-symbols-outlined animate-spin text-4xl text-primary">progress_activity</span>
      </div>

      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div 
          v-for="f in fasesExternas" :key="f.idFase"
          class="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm hover:shadow-xl hover:border-primary/30 transition-all cursor-pointer group relative overflow-hidden"
          @click="seleccionarFase(f)"
        >
          <div class="absolute top-0 right-0 size-24 bg-primary/5 rounded-bl-full -mr-10 -mt-10 group-hover:bg-primary/10 transition-colors"></div>
          <span class="material-symbols-outlined text-4xl text-primary mb-4">emoji_events</span>
          <h3 class="font-black text-xl text-slate-800 uppercase tracking-tighter leading-tight mb-2">{{ f.nombre }}</h3>
          <p class="text-[10px] font-black uppercase tracking-widest text-slate-400">Tipo: {{ f.tipoConcurso }}</p>
          
          <div class="mt-6 flex items-center justify-between">
            <span class="text-xs font-bold text-slate-500">Ver Participantes</span>
            <span class="material-symbols-outlined text-primary group-hover:translate-x-1 transition-transform">arrow_forward</span>
          </div>
        </div>

        <div v-if="fasesExternas.length === 0" class="col-span-full py-20 text-center bg-slate-50 rounded-3xl border border-dashed border-slate-200">
           <span class="material-symbols-outlined text-5xl text-slate-200 mb-2">event_busy</span>
           <p class="text-slate-400 font-bold uppercase tracking-widest">No hay concursos externos activos para esta gestión.</p>
        </div>
      </div>
    </div>

    <!-- STEP 2: MANAGE PARTICIPANTS FOR SELECTED CONTEST -->
    <div v-else class="animate-in fade-in slide-in-from-right-4 duration-500">
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div class="flex items-center gap-4">
          <button @click="faseSeleccionada = null" class="size-10 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl flex items-center justify-center transition-colors shadow-sm">
            <span class="material-symbols-outlined">arrow_back</span>
          </button>
          <div>
            <h2 class="text-3xl font-black text-primary tracking-tighter uppercase italic leading-none">{{ faseSeleccionada.nombre }}</h2>
            <p class="text-slate-500 font-medium text-sm mt-1">Listado de competidores inscritos</p>
          </div>
        </div>

        <button 
          @click="abrirModalCrear"
          class="px-6 py-3 bg-secondary text-white font-black rounded-2xl shadow-lg shadow-secondary/20 hover:brightness-110 transition-all flex items-center justify-center gap-2 uppercase text-xs tracking-widest"
        >
          <span class="material-symbols-outlined text-[20px]">person_add</span>
          Inscribir Participante
        </button>
      </div>

      <!-- Participantes List -->
      <div v-if="loadingParticipantes" class="flex justify-center py-20">
        <span class="material-symbols-outlined animate-spin text-4xl text-primary">progress_activity</span>
      </div>

      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div v-for="p in participantes" :key="p.idParticipante" class="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col group">
          <div class="p-6 flex-1">
             <div class="flex justify-between items-start mb-4">
                <div class="size-12 rounded-2xl bg-primary/5 text-primary flex items-center justify-center shrink-0">
                   <span class="material-symbols-outlined text-3xl">person</span>
                </div>
                <div class="flex gap-1">
                  <button @click="abrirModalEditar(p)" class="size-8 rounded-lg bg-slate-50 text-slate-400 hover:bg-primary/10 hover:text-primary transition-colors flex items-center justify-center">
                    <span class="material-symbols-outlined text-[18px]">edit</span>
                  </button>
                  <button @click="confirmarEliminar(p)" class="size-8 rounded-lg bg-slate-50 text-slate-400 hover:bg-secondary/10 hover:text-secondary transition-colors flex items-center justify-center">
                    <span class="material-symbols-outlined text-[18px]">delete</span>
                  </button>
                </div>
             </div>
             
             <h4 class="font-black text-xl text-slate-800 uppercase tracking-tighter leading-tight mb-1">{{ p.nombre }}</h4>
             <p class="text-primary font-black text-[10px] uppercase tracking-widest mb-4">{{ p.tipo || 'PARTICIPANTE' }}</p>

             <div class="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100">
                <span class="material-symbols-outlined text-slate-400">account_balance</span>
                <div>
                  <p class="text-[8px] font-black uppercase text-slate-400 leading-none mb-1">Fraternidad / Institución</p>
                  <p class="text-xs font-bold text-slate-700 truncate max-w-[180px]">{{ p.fraternidad?.nombre || 'PARTICIPANTE EXTERNO' }}</p>
                </div>
             </div>
          </div>
        </div>

        <div v-if="participantes.length === 0" class="col-span-full py-20 text-center bg-white rounded-3xl border border-dashed border-slate-200">
           <span class="material-symbols-outlined text-5xl text-slate-200 mb-2">groups</span>
           <p class="text-slate-400 font-bold uppercase tracking-widest">No hay participantes registrados para este concurso.</p>
        </div>
      </div>
    </div>

    <!-- CREATE/EDIT MODAL -->
    <div v-if="modalAbierto" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div class="bg-white w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
        <div class="bg-primary px-6 py-4 flex items-center justify-between text-white">
          <h3 class="font-black italic uppercase tracking-widest text-lg">{{ editando ? 'Editar Inscripción' : 'Nueva Inscripción' }}</h3>
          <button @click="modalAbierto = false" class="text-white/60 hover:text-white transition-colors">
            <span class="material-symbols-outlined">close</span>
          </button>
        </div>

        <div class="p-8 space-y-6">
          <div>
            <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Nombre Completo</label>
            <input 
              v-model="form.nombre" 
              type="text" 
              placeholder="Ej. Juan Pérez"
              class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none focus:border-primary transition-all shadow-inner"
            />
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Tipo / Categoría</label>
              <select v-model="form.tipo" class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none focus:border-primary appearance-none">
                <option value="Chacha">Chacha</option>
                <option value="Warmi">Warmi</option>
                <option value="Fotógrafo">Fotógrafo</option>
                <option value="Diseñador">Diseñador</option>
                <option value="Participante">Participante</option>
                <option value="Otro">Otro</option>
              </select>
            </div>
            <div>
              <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Origen</label>
              <select v-model="form.isExternal" class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none focus:border-primary appearance-none">
                <option :value="false">De Fraternidad</option>
                <option :value="true">Externo / Independiente</option>
              </select>
            </div>
          </div>

          <div v-if="!form.isExternal">
            <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Fraternidad Perteneciente</label>
            <div class="relative">
              <select v-model="form.idFraternidad" class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none focus:border-primary appearance-none">
                <option v-for="f in fraternidades" :key="f.idFraternidad" :value="f.idFraternidad">{{ f.nombre }}</option>
              </select>
              <span class="absolute right-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-400 pointer-events-none">expand_more</span>
            </div>
          </div>
        </div>

        <div class="p-6 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
          <button @click="modalAbierto = false" class="px-5 py-3 text-slate-500 hover:bg-slate-200 rounded-xl font-bold text-xs uppercase tracking-widest transition-colors">Cancelar</button>
          <button 
            @click="guardar" 
            :disabled="!form.nombre || (!form.isExternal && !form.idFraternidad) || guardando"
            class="px-8 py-3 bg-primary text-white font-black rounded-2xl text-xs uppercase tracking-widest shadow-lg shadow-primary/20 hover:brightness-110 active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50"
          >
            <span v-if="guardando" class="material-symbols-outlined animate-spin text-[16px]">sync</span>
            {{ editando ? 'Actualizar' : 'Confirmar Inscripción' }}
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

const phases = ref([])
const fasesExternas = ref([])
const loadingFases = ref(true)

const faseSeleccionada = ref(null)
const participantes = ref([])
const loadingParticipantes = ref(false)

const fraternidades = ref([])
const modalAbierto = ref(false)
const editando = ref(false)
const guardando = ref(false)

const form = ref({
  idParticipante: null,
  nombre: '',
  tipo: 'Participante',
  isExternal: false,
  idFraternidad: null
})

const cargarFases = async () => {
  loadingFases.value = true
  try {
    const { data } = await api.get('/evaluaciones/fases-auth')
    fasesExternas.value = data.filter(f => f.tipoConcurso === 'EXTERNO')
  } catch (error) {
    Swal.fire('Error', 'No se pudieron cargar los concursos externos', 'error')
  } finally {
    loadingFases.value = false
  }
}

const seleccionarFase = async (fase) => {
  faseSeleccionada.value = fase
  cargarParticipantes()
}

const cargarParticipantes = async () => {
  loadingParticipantes.value = true
  try {
    const { data } = await api.get(`/participantes/fase/${faseSeleccionada.value.idFase}`)
    participantes.value = data
  } catch (error) {
    Swal.fire('Error', 'No se pudieron cargar los participantes', 'error')
  } finally {
    loadingParticipantes.value = false
  }
}

const cargarFraternidades = async () => {
  try {
    const { data } = await api.get('/fraternidades')
    fraternidades.value = data
  } catch (e) {}
}

const abrirModalCrear = () => {
  editando.value = false
  form.value = {
    nombre: '',
    tipo: 'Participante',
    isExternal: false,
    idFraternidad: fraternidades.value[0]?.idFraternidad
  }
  modalAbierto.value = true
}

const abrirModalEditar = (p) => {
  editando.value = true
  form.value = {
    idParticipante: p.idParticipante,
    nombre: p.nombre,
    tipo: p.tipo,
    isExternal: !p.fraternidad,
    idFraternidad: p.fraternidad?.idFraternidad || fraternidades.value[0]?.idFraternidad
  }
  modalAbierto.value = true
}

const guardar = async () => {
  guardando.value = true
  try {
    const payload = {
      nombre: form.value.nombre,
      tipo: form.value.tipo,
      idFase: faseSeleccionada.value.idFase,
      idFraternidad: form.value.isExternal ? null : form.value.idFraternidad
    }

    if (editando.value) {
      await api.put(`/participantes/${form.value.idParticipante}`, payload)
    } else {
      await api.post('/participantes', payload)
    }

    modalAbierto.value = false
    Swal.fire({
      icon: 'success', 
      title: 'Realizado', 
      text: 'Inscripción procesada correctamente.',
      toast: true, position: 'top-end', showConfirmButton: false, timer: 2000
    })
    cargarParticipantes()
  } catch (error) {
    Swal.fire('Error', 'Error al procesar la inscripción.', 'error')
  } finally {
    guardando.value = false
  }
}

const confirmarEliminar = (p) => {
  Swal.fire({
    title: '¿Eliminar Inscripción?',
    text: `Se borrará a ${p.nombre} de este concurso. Esta acción no se puede deshacer.`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#d33',
    confirmButtonText: 'Sí, eliminar',
    cancelButtonText: 'Cancelar'
  }).then(async (result) => {
    if (result.isConfirmed) {
      try {
        await api.delete(`/participantes/${p.idParticipante}`)
        cargarParticipantes()
        Swal.fire('Eliminado', 'El participante ha sido removido.', 'success')
      } catch (e) {
        Swal.fire('Error', 'No se pudo eliminar.', 'error')
      }
    }
  })
}

onMounted(() => {
  cargarFases()
  cargarFraternidades()
})
</script>
