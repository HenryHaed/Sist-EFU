<template>
  <div class="p-6 md:p-8 max-w-7xl mx-auto">
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
      <div>
        <h2 class="text-3xl font-black text-primary tracking-tighter uppercase italic">Configuración de Criterios</h2>
        <p class="text-slate-500 font-medium text-sm mt-1">Define qué aspectos serán calificados en cada fase del evento.</p>
      </div>
      <button 
        @click="abrirModal()"
        class="bg-primary hover:bg-blue-900 text-white px-6 py-3 rounded-xl font-black transition-all flex items-center gap-2 shadow-lg shadow-primary/20"
      >
        <span class="material-symbols-outlined">playlist_add_check</span>
        Nuevo Criterio
      </button>
    </div>

    <!-- Filtro de Fase -->
    <div class="mb-6 flex items-center gap-3">
      <span class="text-[10px] font-black uppercase text-slate-400 tracking-widest">Filtrar por Fase:</span>
      <select v-model="faseFiltroId" class="bg-white border rounded-lg px-3 py-1.5 font-bold text-sm text-primary outline-none border-slate-200">
        <option :value="null">Todas las Fases</option>
        <option v-for="f in fases" :key="f.idFase" :value="f.idFase">{{ f.nombre }}</option>
      </select>
    </div>

    <!-- Tabla de Criterios -->
    <div class="bg-white rounded-3xl overflow-hidden border border-slate-200 shadow-sm">
      <table class="w-full text-left text-sm">
        <thead class="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-black text-[10px]">
          <tr>
            <th class="px-6 py-4">Fase Vinculada</th>
            <th class="px-6 py-4">Nombre Criterio</th>
            <th class="px-6 py-4">Puntaje Máx.</th>
            <th class="px-6 py-4">Imagen Referencia</th>
            <th class="px-6 py-4 text-right">Acciones</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100">
          <tr v-for="c in criteriosFiltrados" :key="c.idCriterio" class="hover:bg-slate-50 transition-colors">
            <td class="px-6 py-4">
              <span class="bg-primary/5 text-primary text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-tighter border border-primary/10">
                {{ c.fase?.nombre || '-' }}
              </span>
            </td>
            <td class="px-6 py-4 font-bold text-slate-800">{{ c.nombre }}</td>
            <td class="px-6 py-4">
              <span class="text-lg font-black text-secondary">{{ Number(c.puntajeMaximo) }}</span>
              <span class="text-[10px] uppercase font-black text-slate-400 ml-1">pts</span>
            </td>
            <td class="px-6 py-4">
               <div v-if="c.urlImagen" class="size-10 bg-slate-100 rounded-lg overflow-hidden border border-slate-200">
                  <img :src="c.urlImagen" class="size-full object-cover" />
               </div>
               <span v-else class="text-xs text-slate-300 italic">Sin imagen</span>
            </td>
            <td class="px-6 py-4 text-right space-x-2">
              <button @click="abrirModal(c)" class="size-9 bg-slate-100 text-slate-600 hover:bg-primary hover:text-white rounded-lg transition-all"><span class="material-symbols-outlined text-[20px]">edit_note</span></button>
              <button @click="eliminar(c)" class="size-9 bg-red-50 text-red-600 hover:bg-red-600 hover:text-white rounded-lg transition-all"><span class="material-symbols-outlined text-[20px]">delete</span></button>
            </td>
          </tr>
          <tr v-if="criteriosFiltrados.length === 0">
             <td colspan="5" class="px-6 py-10 text-center text-slate-400">No se encontraron criterios para esta selección.</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- MODAL CRITERIO -->
    <v-dialog v-model="modalOpen" max-width="450px">
      <v-card class="rounded-2xl">
        <v-card-title class="bg-secondary text-white pa-6">
          <h3 class="text-xl font-black italic uppercase tracking-tighter">{{ editandoId ? 'Editar Criterio' : 'Nuevo Criterio' }}</h3>
        </v-card-title>
        <v-card-text class="pa-8">
          <div class="space-y-4">
            <div>
              <label class="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Fase de Aplicación</label>
              <select v-model="form.idFase" class="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-xl focus:border-secondary outline-none font-bold transition-all">
                <option value="">Selecciona una fase...</option>
                <option v-for="f in fases" :key="f.idFase" :value="f.idFase">{{ f.nombre }}</option>
              </select>
            </div>
            <div>
              <label class="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Descripción del Criterio</label>
              <input v-model="form.nombre" type="text" placeholder="Ej: Coreografía y Compás" class="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-xl focus:border-secondary outline-none font-bold" />
            </div>
            <div>
              <label class="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Puntaje Máximo Permitido</label>
              <input v-model.number="form.puntajeMaximo" type="number" class="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-xl focus:border-secondary outline-none font-bold text-lg text-primary" />
            </div>
            <div>
              <label class="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">URL Imagen Referencial (Opcional)</label>
              <input v-model="form.urlImagen" type="text" placeholder="http://..." class="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-xl focus:border-secondary outline-none text-xs" />
            </div>
          </div>
        </v-card-text>
        <v-card-actions class="pa-6 border-t border-slate-100">
          <v-spacer></v-spacer>
          <button @click="modalOpen = false" class="px-6 py-2 text-slate-500 font-bold hover:text-secondary">Cancelar</button>
          <button @click="guardar" class="bg-secondary text-white px-8 py-2 rounded-xl font-black uppercase tracking-tighter shadow-lg shadow-secondary/20">Guardar Criterio</button>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import api from '../services/api'
import Swal from 'sweetalert2'

const fases = ref([])
const criterios = ref([])
const faseFiltroId = ref(null)
const modalOpen = ref(false)
const editandoId = ref(null)

const form = ref({ idFase: '', nombre: '', puntajeMaximo: 20, urlImagen: '' })

const cargarDatos = async () => {
  try {
    const resF = await api.get('/evaluaciones/fases-auth')
    fases.value = resF.data
    
    // Cargar todos los criterios (esto requeriría un endpoint GET /evaluaciones/criterios-all si no queremos filtrar uno por uno)
    // Para simplificar, cargaré criterios de todas las fases
    const allCriterios = []
    for (const f of fases.value) {
       const resC = await api.get(`/evaluaciones/fase/${f.idFase}/criterios`)
       resC.data.forEach(item => {
         allCriterios.push({ ...item, fase: f })
       })
    }
    criterios.value = allCriterios
  } catch (e) { console.error(e) }
}

const criteriosFiltrados = computed(() => {
  if (!faseFiltroId.value) return criterios.value
  return criterios.value.filter(c => c.fase?.idFase === faseFiltroId.value)
})

const abrirModal = (item = null) => {
  if (item) {
    editandoId.value = item.idCriterio
    form.value = { ...item, idFase: item.fase?.idFase }
  } else {
    editandoId.value = null
    form.value = { idFase: faseFiltroId.value || '', nombre: '', puntajeMaximo: 25, urlImagen: '' }
  }
  modalOpen.value = true
}

const guardar = async () => {
  if (!form.value.idFase) return Swal.fire('Error', 'Debes elegir una fase.', 'error')
  try {
    const payload = { ...form.value, fase: { idFase: form.value.idFase } }
    delete payload.idFase 

    if (editandoId.value) {
      await api.put(`/evaluaciones/criterios/${editandoId.value}`, payload)
    } else {
      await api.post('/evaluaciones/criterios', payload)
    }
    modalOpen.value = false
    Swal.fire('Éxito', 'Criterio guardado', 'success')
    cargarDatos()
  } catch (e) { Swal.fire('Error', 'No se pudo guardar', 'error') }
}

const eliminar = async (item) => {
  const result = await Swal.fire({ title: '¿Eliminar criterio?', text: 'Se perderán las notas asociadas.', icon: 'error', showCancelButton: true })
  if (result.isConfirmed) {
    await api.delete(`/evaluaciones/criterios/${item.idCriterio}`)
    cargarDatos()
  }
}

onMounted(cargarDatos)
</script>
