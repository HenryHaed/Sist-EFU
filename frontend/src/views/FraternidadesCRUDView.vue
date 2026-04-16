<template>
  <div class="p-6 md:p-8 max-w-7xl mx-auto w-full">
    <!-- Header -->
    <div class="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
      <div>
        <div class="flex items-center gap-2 mb-1">
          <span class="h-1 w-8 bg-secondary inline-block"></span>
          <h2 class="text-3xl font-black tracking-tight text-primary uppercase italic">Gestión de Fraternidades</h2>
        </div>
        <p class="text-slate-500 text-sm mt-1 font-medium">
          Administración completa del listado oficial de fraternidades para la Entrada 2026.
        </p>
      </div>

      <button
        @click="abrirModalCrear"
        class="bg-primary text-white px-6 py-3 rounded-xl font-black text-sm uppercase tracking-wider shadow-lg shadow-primary/20 hover:brightness-110 active:scale-95 transition-all flex items-center gap-2"
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

      <div v-else class="overflow-x-auto">
        <table class="w-full text-left">
          <thead>
            <tr class="bg-slate-50/50 border-b border-slate-100">
              <th class="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Nombre / Origen</th>
              <th class="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Categoría</th>
              <th class="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Pertenencia</th>
              <th class="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Estado</th>
              <th class="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr v-for="f in fraternidades" :key="f.idFraternidad" class="hover:bg-slate-50/50 transition-colors group">
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
                    <p class="text-[10px] font-black text-slate-400 uppercase tracking-tighter">{{ f.origenFraternidad }}</p>
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
                  {{ f.facultad?.sigla || f.institucionExterna?.nombre || '—' }}
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
    </div>

    <!-- Modal Form (Simplified version using a simple dialog pattern) -->
    <v-dialog v-model="modalAbierto" max-width="600">
      <v-card class="rounded-2xl p-4 md:p-8">
        <div class="mb-8">
          <h3 class="text-2xl font-black text-primary uppercase italic">{{ editando ? 'Editar' : 'Nueva' }} Fraternidad</h3>
          <p class="text-slate-500 text-sm">Completa los datos de la institución folklórica.</p>
        </div>

        <v-form @submit.prevent="guardar">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div class="col-span-2">
              <label class="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Nombre de la Fraternidad</label>
              <input v-model="form.nombre" type="text" placeholder="Ej. Morenada Central" class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none transition-all font-bold" />
            </div>

            <div class="col-span-2">
              <label class="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Logo de la Fraternidad (Imagen)</label>
              
              <div 
                @dragover.prevent="dragging = true" 
                @dragleave.prevent="dragging = false"
                @drop.prevent="onDrop"
                @click="$refs.fileInput.click()"
                :class="[
                  'relative h-32 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-all gap-2 overflow-hidden',
                  dragging ? 'border-primary bg-primary/5' : 'border-slate-200 bg-slate-50 hover:border-slate-300'
                ]"
              >
                <input type="file" ref="fileInput" class="hidden" accept="image/*" @change="onFileSelected" />
                
                <template v-if="form.logoUrl">
                  <img :src="getFullUrl(form.logoUrl)" class="absolute inset-0 w-full h-full object-contain p-2 bg-white" />
                  <div class="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 flex items-center justify-center transition-opacity">
                    <span class="text-white text-[10px] font-black uppercase">Cambiar Imagen</span>
                  </div>
                </template>
                <template v-else>
                  <span class="material-symbols-outlined text-slate-300 text-3xl">add_photo_alternate</span>
                  <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center px-4">
                    Arrastra una imagen o <span class="text-primary">haz clic para buscar</span>
                  </p>
                </template>

                <!-- Loading overlay for upload -->
                <div v-if="uploading" class="absolute inset-0 bg-white/80 flex flex-col items-center justify-center gap-2">
                  <span class="material-symbols-outlined animate-spin text-primary">progress_activity</span>
                  <span class="text-[9px] font-black text-primary uppercase">Subiendo...</span>
                </div>
              </div>
            </div>
            
            <div>
              <label class="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Origen (UMSA, Invitada...)</label>
              <select v-model="form.origenFraternidad" class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold">
                <option value="Interna (UMSA)">Interna (UMSA)</option>
                <option value="Externa">Externa / Invitada</option>
              </select>
            </div>

            <div class="col-span-2">
              <label class="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Categoría según Reglamento</label>
              <select v-model="form.idCategoria" class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold transition-all focus:border-primary">
                <option v-for="c in categorias" :key="c.idCategoria" :value="c.idCategoria">{{ c.nombre }}</option>
              </select>
              
              <!-- Category Description Tooltip Area -->
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

            <div class="col-span-2">
              <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Participantes para Concursos Externos (Opcional)</label>
              <textarea 
                v-model="participantesStr" 
                rows="3" 
                placeholder='Ej: [{"tipo": "Chacha", "nombre": "Juan Pérez"}, {"tipo": "Warmi", "nombre": "María López"}]'
                class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none text-xs font-mono text-slate-600 focus:border-amber-500 transition-colors"
              ></textarea>
              <p class="text-[9px] text-slate-400 mt-1 font-bold">Usa formato JSON válido. Cada participante necesita un "tipo" y "nombre".</p>
            </div>
          </div>

          <div class="flex justify-end gap-4">
            <button type="button" @click="modalAbierto = false" class="px-6 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-100 transition-colors uppercase text-xs">Cancelar</button>
            <button type="submit" class="px-8 py-3 bg-primary text-white rounded-xl font-black uppercase text-xs shadow-lg shadow-primary/20 hover:brightness-110 active:scale-95 transition-all">
              {{ editando ? 'Actualizar' : 'Crear Registro' }}
            </button>
          </div>
        </v-form>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import api from '../services/api'

const fraternidades = ref([])
const loading = ref(true)
const modalAbierto = ref(false)
const editando = ref(false)

const categorias = ref([])
const loadingCategorias = ref(true)
const dragging = ref(false)
const uploading = ref(false)
const fileInput = ref(null)

const getFullUrl = (url) => {
  if (!url) return ''
  if (url.startsWith('http')) return url
  return `http://localhost:3000${url}`
}

const onDrop = (e) => {
  dragging.value = false
  const file = e.dataTransfer.files[0]
  if (file && file.type.startsWith('image/')) {
    uploadFile(file)
  }
}

const onFileSelected = (e) => {
  const file = e.target.files[0]
  if (file) {
    uploadFile(file)
  }
}

const uploadFile = async (file) => {
  uploading.value = true
  const formData = new FormData()
  formData.append('file', file)

  try {
    const response = await api.post('/fraternidades/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    form.value.logoUrl = response.data.url
  } catch (error) {
    console.error('Error al subir archivo:', error)
    alert('Error al subir la imagen. Intenta con otro formato.')
  } finally {
    uploading.value = false
  }
}

const participantesStr = ref('')

const form = ref({
  idFraternidad: null,
  nombre: '',
  origenFraternidad: 'Interna (UMSA)',
  idCategoria: 1,
  habilitadoEfu: true,
  logoUrl: '',
  participantesConcurso: null
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

const cargarDatos = async () => {
  loading.value = true
  try {
    const response = await api.get('/fraternidades')
    fraternidades.value = response.data
    await cargarCategorias()
  } catch (error) {
    console.error('Error al cargar fraternidades:', error)
  } finally {
    loading.value = false
  }
}

const abrirModalCrear = () => {
  editando.value = false
  participantesStr.value = ''
  form.value = {
    nombre: '',
    origenFraternidad: 'Interna (UMSA)',
    idCategoria: categorias.value.length > 0 ? categorias.value[0].idCategoria : 1,
    habilitadoEfu: true,
    logoUrl: '',
    participantesConcurso: null
  }
  modalAbierto.value = true
}

const editarFraternidad = (fraternidad) => {
  editando.value = true
  participantesStr.value = fraternidad.participantesConcurso 
    ? (typeof fraternidad.participantesConcurso === 'string' ? fraternidad.participantesConcurso : JSON.stringify(fraternidad.participantesConcurso))
    : ''
  form.value = { 
    ...fraternidad,
    idCategoria: fraternidad.categoria ? fraternidad.categoria.idCategoria : (categorias.value.length > 0 ? categorias.value[0].idCategoria : null)
  }
  modalAbierto.value = true
}

const guardar = async () => {
  if (!form.value.nombre) {
    alert('Ingresa el nombre de la fraternidad')
    return
  }

  // Parse participantes
  let particObj = null
  if (participantesStr.value.trim()) {
     try {
        particObj = JSON.parse(participantesStr.value)
     } catch (e) {
        alert('El formato de participantes no es un JSON válido.')
        return
     }
  }

  const payload = {
    nombre: form.value.nombre,
    origenFraternidad: form.value.origenFraternidad,
    categoria: { idCategoria: form.value.idCategoria },
    habilitadoEfu: form.value.habilitadoEfu,
    logoUrl: form.value.logoUrl,
    participantesConcurso: particObj
  }

  try {
    if (editando.value) {
      await api.put(`/fraternidades/${form.value.idFraternidad}`, payload)
    } else {
      await api.post('/fraternidades', payload)
    }
    modalAbierto.value = false
    cargarDatos()
  } catch (error) {
    console.error('Error al guardar:', error)
  }
}

const confirmarBorrar = async (f) => {
  if (confirm(`¿Estás seguro de eliminar la fraternidad "${f.nombre}"?`)) {
    try {
      await api.delete(`/fraternidades/${f.idFraternidad}`)
      cargarDatos()
    } catch (error) {
      console.error('Error al borrar:', error)
    }
  }
}

onMounted(cargarDatos)
</script>
