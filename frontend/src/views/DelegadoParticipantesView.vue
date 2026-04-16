<template>
  <div class="p-6 md:p-8 max-w-7xl mx-auto min-h-[calc(100vh-4rem)]">
    <div class="flex items-center justify-between mb-8">
      <div>
        <h2 class="text-3xl font-black text-primary tracking-tighter uppercase italic">Participantes Concursos</h2>
        <p class="text-slate-500 font-medium text-sm mt-1">
          Gestiona los competidores (Chacha-Warmi, Afiche, etc.) de las fraternidades.
        </p>
      </div>
    </div>

    <!-- Error/Loading state -->
    <div v-if="loading" class="flex justify-center py-20">
      <span class="material-symbols-outlined animate-spin text-4xl text-primary">progress_activity</span>
    </div>

    <div v-else class="grid grid-cols-1 gap-6">
      <div v-for="frat in fraternidades" :key="frat.idFraternidad" class="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col md:flex-row items-stretch justify-between">
        
        <div class="p-6 flex items-center gap-4 flex-1">
          <div class="size-12 rounded-full bg-primary/5 text-primary flex items-center justify-center shrink-0">
            <span class="material-symbols-outlined text-2xl">groups</span>
          </div>
          <div>
            <h3 class="font-black text-lg text-slate-800 uppercase tracking-tighter leading-tight">{{ frat.nombre }}</h3>
            <p class="text-sm text-slate-500 font-medium mt-1">
               {{ frat.participantesParsed?.length || 0 }} competidor(es) registrados
            </p>
          </div>
        </div>

        <div class="p-6 bg-slate-50 border-t md:border-t-0 md:border-l border-slate-100 flex items-center justify-end shrink-0">
          <button 
            @click="abrirGestor(frat)"
            class="px-5 py-2.5 bg-primary hover:bg-blue-900 text-white font-bold rounded-xl text-sm transition-all shadow-md shadow-primary/20 flex items-center gap-2 w-full md:w-auto"
          >
            <span class="material-symbols-outlined text-[20px]">group_add</span>
            Gestionar Participantes
          </button>
        </div>
      </div>
    </div>

    <!-- Modal Modal CRUD de Participantes -->
    <div v-if="modalAbierto" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div class="bg-white w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        
        <div class="bg-primary px-6 py-4 flex items-center justify-between text-white shrink-0">
          <div>
             <h3 class="font-black italic uppercase tracking-widest text-lg">Inscripción / Gestión</h3>
             <p class="text-[10px] font-bold opacity-80 uppercase tracking-widest">{{ fraternidadActiva?.nombre }}</p>
          </div>
          <button @click="modalAbierto = false" class="text-white/60 hover:text-white transition-colors">
            <span class="material-symbols-outlined">close</span>
          </button>
        </div>

        <div class="p-6 overflow-y-auto flex-1 bg-slate-50">
           <!-- Formulario de Agregado Rápido -->
           <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm mb-6 flex flex-col md:flex-row gap-3">
              <div class="flex-1">
                 <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Concurso / Tipo</label>
                 <select v-model="nuevoParticipante.tipo" class="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none focus:border-primary">
                    <option value="" disabled>Seleccionar concurso...</option>
                    <option value="Chacha">Chacha Universitario</option>
                    <option value="Warmi">Warmi Universitaria</option>
                    <option value="Afiche">Concurso de Afiche</option>
                    <option value="Fotografia">Concurso de Fotografía</option>
                    <option value="Monografia">Concurso de Monografía</option>
                 </select>
              </div>
              <div class="flex-[2]">
                 <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Nombre Completo del Participante</label>
                 <input 
                    type="text" 
                    v-model="nuevoParticipante.nombre" 
                    placeholder="Ej. Juan Pérez"
                    @keyup.enter="agregarParticipanteALista"
                    class="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none focus:border-primary"
                 />
              </div>
              <div class="flex items-end">
                 <button 
                  @click="agregarParticipanteALista"
                  :disabled="!nuevoParticipante.tipo || !nuevoParticipante.nombre"
                  class="w-full md:w-auto h-[42px] px-5 bg-secondary text-white font-black rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                 >
                    Añadir
                 </button>
              </div>
           </div>

           <!-- Lista Actual -->
           <h4 class="text-sm font-black text-slate-800 uppercase italic tracking-tighter mb-4">Competidores en la Lista</h4>
           
           <div v-if="listaEditando.length === 0" class="text-center py-10 bg-white rounded-2xl border border-slate-200 border-dashed">
              <span class="material-symbols-outlined text-4xl text-slate-300 mb-2">person_off</span>
              <p class="text-slate-500 font-bold text-sm">No hay participantes registrados.</p>
           </div>
           
           <div v-else class="space-y-3">
              <div 
                 v-for="(partic, idx) in listaEditando" :key="idx"
                 class="flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-200 shadow-sm"
              >
                 <div class="flex items-center gap-3">
                    <div class="size-10 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 font-black text-[10px] uppercase tracking-widest">
                       {{ partic.tipo.substring(0, 2) }}
                    </div>
                    <div>
                       <p class="text-[9px] font-black text-slate-400 uppercase tracking-widest">{{ partic.tipo }}</p>
                       <p class="font-bold text-slate-800 text-sm">{{ partic.nombre }}</p>
                    </div>
                 </div>
                 <button @click="quitar(idx)" class="size-8 flex items-center justify-center text-slate-400 hover:text-secondary hover:bg-secondary/10 rounded-lg transition-colors">
                    <span class="material-symbols-outlined text-[18px]">delete</span>
                 </button>
              </div>
           </div>
        </div>

        <div class="p-6 bg-white border-t border-slate-200 flex justify-end gap-3 shrink-0">
          <button @click="modalAbierto = false" class="px-5 py-2.5 text-slate-500 hover:bg-slate-100 rounded-xl font-bold text-xs uppercase tracking-widest transition-colors">Cancelar</button>
          <button 
             @click="guardarCambios"
             :disabled="guardando"
             class="px-6 py-2.5 bg-primary text-white font-black rounded-xl text-xs uppercase tracking-widest flex items-center gap-2 shadow-lg hover:bg-blue-900 transition-colors disabled:opacity-50"
          >
             <span v-if="guardando" class="material-symbols-outlined animate-spin text-[16px]">sync</span>
             Guardar Registros
          </button>
        </div>

      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import Swal from 'sweetalert2'
import api from '../services/api'

const fraternidades = ref([])
const loading = ref(true)
const guardando = ref(false)

const modalAbierto = ref(false)
const fraternidadActiva = ref(null)
const listaEditando = ref([])

const nuevoParticipante = ref({ tipo: '', nombre: '' })

const cargarDatos = async () => {
  loading.value = true
  try {
    const { data } = await api.get('/fraternidades')
    
    // Parse JSON
    fraternidades.value = data.map(f => {
       let parsed = []
       if (f.participantesConcurso) {
          try {
             const raw = typeof f.participantesConcurso === 'string' ? JSON.parse(f.participantesConcurso) : f.participantesConcurso
             if (Array.isArray(raw)) parsed = raw
             else parsed = Object.keys(raw).map(k => ({ tipo: k, nombre: raw[k] }))
          } catch(e) {}
       }
       return { ...f, participantesParsed: parsed }
    })
  } catch (error) {
    Swal.fire('Error', 'No se pudieron cargar las fraternidades', 'error')
  } finally {
    loading.value = false
  }
}

const abrirGestor = (frat) => {
   fraternidadActiva.value = frat
   // Hacemos una copia profunda
   listaEditando.value = JSON.parse(JSON.stringify(frat.participantesParsed || []))
   nuevoParticipante.value = { tipo: '', nombre: '' }
   modalAbierto.value = true
}

const agregarParticipanteALista = () => {
   if (!nuevoParticipante.value.tipo || !nuevoParticipante.value.nombre.trim()) return
   listaEditando.value.push({ ...nuevoParticipante.value })
   nuevoParticipante.value = { tipo: '', nombre: '' } // reiniciar
}

const quitar = (idx) => {
   listaEditando.value.splice(idx, 1)
}

const guardarCambios = async () => {
   guardando.value = true
   try {
      const payload = {
         ...fraternidadActiva.value,
         categoria: fraternidadActiva.value.categoria, // si ya viene el objeto 
         participantesConcurso: listaEditando.value
      }

      await api.put(`/fraternidades/${fraternidadActiva.value.idFraternidad}`, payload)
      
      Swal.fire({
         icon: 'success',
         title: 'Participantes actualizados',
         toast: true,
         position: 'top-end',
         showConfirmButton: false,
         timer: 2000
      })
      modalAbierto.value = false
      cargarDatos()
   } catch(e) {
      Swal.fire('Error', 'Hubo un error al guardar los participantes.', 'error')
   } finally {
      guardando.value = false
   }
}

onMounted(() => {
  cargarDatos()
})
</script>
