<template>
  <div class="animate-in fade-in duration-500">
    <!-- Header -->
    <div class="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <h2 class="text-2xl font-black italic uppercase tracking-tighter text-primary flex items-center gap-2">
          <span class="material-symbols-outlined text-3xl">how_to_reg</span>
          Control de Asistencia Delegados
        </h2>
        <p class="text-slate-500 text-sm font-medium">Gestiona la presencia de los delegados y aplica sanciones automáticas.</p>
      </div>

      <div class="relative w-full md:w-96">
        <span class="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">search</span>
        <input 
          v-model="search" 
          type="text" 
          placeholder="Buscar delegado o fraternidad..." 
          class="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all shadow-sm font-medium text-sm"
        />
      </div>
    </div>

    <!-- Stats Bar -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <div class="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-4">
        <div class="size-12 bg-indigo-50 text-primary rounded-2xl flex items-center justify-center">
          <span class="material-symbols-outlined">groups</span>
        </div>
        <div>
          <p class="text-[10px] font-black uppercase text-slate-400 tracking-widest">Total Delegados</p>
          <p class="text-2xl font-black text-slate-800">{{ delegados.length }}</p>
        </div>
      </div>
      <div class="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-4">
        <div class="size-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center">
          <span class="material-symbols-outlined">warning</span>
        </div>
        <div>
          <p class="text-[10px] font-black uppercase text-slate-400 tracking-widest">Sanciones de Hoy</p>
          <p class="text-2xl font-black text-slate-800">{{ sancionesHoy }}</p>
        </div>
      </div>
      <div class="bg-primary p-6 rounded-[2rem] shadow-xl shadow-primary/20 flex items-center gap-4">
        <div class="size-12 bg-white/20 text-white rounded-2xl flex items-center justify-center">
          <span class="material-symbols-outlined">gavel</span>
        </div>
        <div>
          <p class="text-[10px] font-black uppercase text-white/60 tracking-widest">Descuento Aplicado</p>
          <p class="text-2xl font-black text-white">-10 pts <span class="text-xs font-medium text-white/60">en Disciplina</span></p>
        </div>
      </div>
    </div>

    <!-- Delegates Grid -->
    <div v-if="loading" class="py-20 flex flex-col items-center justify-center">
      <span class="material-symbols-outlined animate-spin text-4xl text-primary mb-4">progress_activity</span>
      <p class="text-slate-400 font-bold uppercase tracking-widest text-xs">Cargando delegados...</p>
    </div>

    <div v-else-if="filteredDelegados.length === 0" class="py-20 text-center">
      <div class="size-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300 border-2 border-dashed border-slate-200">
        <span class="material-symbols-outlined text-4xl">person_search</span>
      </div>
      <h3 class="text-lg font-bold text-slate-400 uppercase tracking-widest">No se encontraron delegados</h3>
    </div>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div 
        v-for="del in filteredDelegados" 
        :key="`${del.idSolicitud}-${del.nombreDelegado}`"
        class="group bg-white rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-500 overflow-hidden"
      >
        <!-- Card Header: Fraternidad -->
        <div class="bg-slate-50 p-6 border-b border-slate-100 flex items-center justify-between">
          <div class="flex flex-col">
            <span class="text-[9px] font-black uppercase text-secondary tracking-widest mb-1">{{ del.categoria }}</span>
            <h3 class="font-black text-slate-800 uppercase italic tracking-tight leading-none group-hover:text-primary transition-colors">
              {{ del.nombreFraternidad }}
            </h3>
          </div>
          <div class="size-10 bg-white rounded-xl shadow-sm border border-slate-100 flex items-center justify-center text-slate-400">
            <span class="material-symbols-outlined text-xl">account_balance</span>
          </div>
        </div>

        <!-- Card Body: Delegado -->
        <div class="p-6">
          <div class="flex items-center gap-4 mb-6">
             <div class="size-14 rounded-[1.2rem] bg-indigo-50 flex items-center justify-center text-primary border border-indigo-100">
                <span class="material-symbols-outlined text-3xl">person</span>
             </div>
             <div>
                <p class="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-1">Delegado {{ del.tipo }}</p>
                <p class="text-base font-black text-slate-800 uppercase tracking-tight">{{ del.nombreDelegado }}</p>
                <p class="text-[10px] font-medium text-slate-500">CI: {{ del.ciDelegado }}</p>
             </div>
          </div>

          <!-- Actions -->
          <div class="flex gap-2">
            <button 
              @click="confirmarInasistencia(del)"
              class="flex-1 bg-red-50 hover:bg-secondary text-secondary hover:text-white font-black uppercase text-[10px] tracking-widest py-3 rounded-2xl border border-red-100 transition-all flex items-center justify-center gap-2"
            >
              <span class="material-symbols-outlined text-sm">block</span>
              No se presentó
            </button>
            <button 
              class="px-4 bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-2xl transition-all"
              title="Ver contacto"
              @click="showContact(del)"
            >
              <span class="material-symbols-outlined text-lg">call</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- MODAL CONFIRMACIÓN SANCION -->
    <v-dialog v-model="modalSancion" max-width="450">
      <v-card class="rounded-[2.5rem] overflow-hidden p-0 border-none shadow-2xl">
        <div class="bg-secondary p-8 text-white text-center">
          <div class="size-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-6 border-2 border-white/50 animate-bounce">
            <span class="material-symbols-outlined text-5xl">warning</span>
          </div>
          <h3 class="text-2xl font-black italic uppercase tracking-tighter mb-2">¿Confirmar Inasistencia?</h3>
          <p class="text-white/80 text-sm font-medium">Esta acción aplicará una sanción automática de **-10 puntos** en disciplina a la fraternidad.</p>
        </div>

        <div class="p-8 bg-white">
          <div class="bg-red-50 border border-red-100 p-4 rounded-2xl mb-6">
            <p class="text-[10px] font-black uppercase text-secondary mb-1">Delegado Ausente:</p>
            <p class="text-sm font-bold text-slate-800 uppercase">{{ delSeleccionado?.nombreDelegado }}</p>
            <p class="text-[10px] text-slate-500 uppercase mt-2">Fraternidad: <span class="font-black text-slate-700">{{ delSeleccionado?.nombreFraternidad }}</span></p>
          </div>

          <p class="text-xs text-slate-400 font-bold uppercase tracking-widest mb-4 flex items-center gap-2">
            <span class="material-symbols-outlined text-sm">info</span>
            Esta acción es irreversible una vez guardada.
          </p>

          <textarea 
            v-model="motivo"
            placeholder="Observación u motivo (opcional)..."
            class="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:border-secondary transition-all text-sm mb-6"
            rows="3"
          ></textarea>

          <div class="flex gap-4">
            <button 
              @click="modalSancion = false"
              class="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-slate-200 transition-all"
            >
              Cancelar
            </button>
            <button 
              @click="guardarSancion"
              :disabled="saving"
              class="flex-[2] py-4 bg-secondary text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-secondary/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
              <span v-if="saving" class="material-symbols-outlined animate-spin text-sm">progress_activity</span>
              Confirmar Sanción
            </button>
          </div>
        </div>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import api from '../services/api'
import Swal from 'sweetalert2'

const loading = ref(true)
const search = ref('')
const delegados = ref([])
const sancionesHoy = ref(0)
const saving = ref(false)

const modalSancion = ref(false)
const delSeleccionado = ref(null)
const motivo = ref('')

onMounted(async () => {
  await fetchDelegados()
})

const fetchDelegados = async () => {
  loading.value = true
  try {
    const { data } = await api.get('/asistencias/delegados')
    delegados.value = data
  } catch (err) {
    console.error('Error fetching delegados:', err)
  } finally {
    loading.value = false
  }
}

const filteredDelegados = computed(() => {
  if (!search.value) return delegados.value
  const q = search.value.toLowerCase()
  return delegados.value.filter(d => 
    d.nombreDelegado.toLowerCase().includes(q) || 
    d.nombreFraternidad.toLowerCase().includes(q) ||
    d.ciDelegado.toLowerCase().includes(q)
  )
})

const confirmarInasistencia = (del) => {
  delSeleccionado.value = del
  motivo.value = ''
  modalSancion.value = true
}

const guardarSancion = async () => {
  if (!delSeleccionado.value) return
  
  saving.value = true
  try {
    await api.post('/asistencias/inasistencia', {
      idFraternidad: delSeleccionado.value.idFraternidad,
      nombreDelegado: delSeleccionado.value.nombreDelegado,
      motivo: motivo.value
    })
    
    modalSancion.value = false
    sancionesHoy.value++
    
    Swal.fire({
      icon: 'success',
      title: 'Sanción Aplicada',
      text: 'Se ha descontado 10 puntos en disciplina a la fraternidad.',
      confirmButtonColor: '#C8102E'
    })
  } catch (err) {
    Swal.fire('Error', 'No se pudo registrar la sanción', 'error')
  } finally {
    saving.value = false
  }
}

const showContact = (del) => {
  Swal.fire({
    title: 'Contacto Delegado',
    html: `
      <div class="text-left p-4">
        <p class="font-bold text-slate-800 uppercase">Celular:</p>
        <p class="text-2xl font-black text-primary mb-4">${del.celularDelegado || 'N/A'}</p>
        <p class="text-xs text-slate-500 italic">Delegado de la fraternidad ${del.nombreFraternidad}</p>
      </div>
    `,
    showConfirmButton: false,
    showCloseButton: true
  })
}
</script>

<style scoped>
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
.animate-in {
  animation: fadeIn 0.5s ease-out forwards;
}
</style>
