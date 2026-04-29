<template>
  <div class="p-6 md:p-8 max-w-7xl mx-auto">
    <!-- Botón Volver -->
    <button @click="$emit('volver')" class="flex items-center gap-2 text-slate-500 hover:text-primary font-bold text-xs mb-6 transition-all group uppercase tracking-widest">
      <span class="material-symbols-outlined text-[20px] group-hover:-translate-x-1 transition-transform">arrow_back</span>
      Volver a Fases de Evaluación
    </button>

    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
      <div>
        <p class="text-[10px] uppercase font-black tracking-widest text-primary/60 mb-1 flex items-center gap-2">
          <span class="material-symbols-outlined text-[14px]">info</span>
          Configurando Criterios · Fase {{ fase?.nombre }}
        </p>
        <h2 class="text-3xl font-black text-primary tracking-tighter uppercase italic">Criterios de Evaluación</h2>
        <p class="text-slate-500 font-medium text-sm mt-1">Define qué aspectos serán calificados específicamente para esta fase.</p>
      </div>
      <button 
        v-if="esActiva"
        @click="abrirModal()"
        :disabled="disponiblePuntaje <= 0"
        class="bg-primary hover:bg-blue-900 text-white px-6 py-3 rounded-xl font-black transition-all flex items-center gap-2 shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <span class="material-symbols-outlined">{{ disponiblePuntaje <= 0 ? 'lock' : 'playlist_add_check' }}</span>
        <span class="uppercase tracking-tighter">{{ disponiblePuntaje <= 0 ? (props.fase?.tipoConcurso === 'EFU' ? 'Fase al Límite' : '100% Alcanzado') : 'Nuevo Criterio' }}</span>
      </button>
    </div>

    <!-- Resumen Presupuesto de Criterios (Premium Style) -->
    <div class="mb-8 bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-wrap items-center gap-10">
      <div class="flex-1 min-w-[300px]">
        <div class="flex justify-between items-end mb-2">
          <div>
            <p class="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Puntaje Acumulado (Vs. Techo Fase)</p>
            <p class="text-4xl font-black text-primary">{{ puntajeUsado }}% <span class="text-sm text-slate-400 font-bold tracking-normal italic">/ {{ limiteFase }}%</span></p>
          </div>
          <div class="text-right">
             <p class="text-[10px] font-black uppercase tracking-widest mb-1" :class="disponiblePuntaje <= 0 ? 'text-emerald-500' : 'text-slate-400'">
               {{ disponiblePuntaje <= 0 ? 'Cerrado' : 'Disponible en Fase' }}
             </p>
             <p class="text-xl font-black" :class="disponiblePuntaje <= 0 ? 'text-emerald-500' : 'text-slate-700'">{{ Math.max(0, disponiblePuntaje).toFixed(1) }}%</p>
          </div>
        </div>
        <div class="h-3 bg-slate-100 rounded-full overflow-hidden border border-slate-200 flex p-0.5">
           <div 
             class="h-full transition-all duration-700 rounded-full shadow-sm"
             :class="puntajeUsado >= limiteFase ? 'bg-emerald-500' : puntajeUsado > (limiteFase * 0.9) ? 'bg-amber-500' : 'bg-primary'"
             :style="{ width: Math.min((puntajeUsado / limiteFase) * 100, 100) + '%' }"
           ></div>
        </div>
      </div>
      <div class="grid grid-cols-2 gap-3 shrink-0">
        <div class="size-20 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col items-center justify-center">
          <p class="text-2xl font-black text-primary leading-none">{{ criterios.length }}</p>
          <p class="text-[9px] font-black uppercase tracking-tighter text-slate-400 mt-1">Criterios</p>
        </div>
        <div class="size-20 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col items-center justify-center">
          <p class="text-2xl font-black text-secondary leading-none">{{ (100 - disponiblePuntaje).toFixed(0) }}</p>
          <p class="text-[9px] font-black uppercase tracking-tighter text-slate-400 mt-1">Total Puntos</p>
        </div>
      </div>
    </div>

    <!-- Tabla de Criterios (Visual Excellence) -->
    <div class="bg-white rounded-3xl overflow-hidden border border-slate-200 shadow-sm transition-all hover:shadow-md">
      
      <!-- Vista Desktop (Tabla) -->
      <div class="hidden md:block overflow-x-auto">
        <table class="w-full text-left text-sm whitespace-nowrap">
        <thead class="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-widest font-black text-[10px]">
          <tr>
            <th class="px-8 py-5">#</th>
            <th class="px-8 py-5">Nombre Criterio</th>
            <th class="px-8 py-5">Peso (Valor)</th>
            <th class="px-8 py-5">Referencia</th>
            <th class="px-8 py-5 text-right" v-if="esActiva">Acciones</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100">
          <tr v-for="(c, idx) in criterios" :key="c.idCriterio" class="hover:bg-slate-50/80 transition-all group">
            <td class="px-8 py-4 font-black text-slate-300">#{{ idx + 1 }}</td>
            <td class="px-8 py-4">
               <div>
                  <p class="font-bold text-slate-800 text-base">{{ c.nombre }}</p>
                  <p class="text-[10px] uppercase font-black text-slate-400 tracking-widest">Fase: {{ fase?.nombre }}</p>
               </div>
            </td>
            <td class="px-8 py-4">
              <span class="bg-primary/5 text-primary border border-primary/20 px-3 py-1 rounded-lg font-black text-sm">
                {{ Number(c.puntajeMaximo) }}%
              </span>
            </td>
            <td class="px-8 py-4">
               <div v-if="c.urlImagen" class="size-12 bg-slate-100 rounded-xl overflow-hidden border border-slate-200 shadow-inner group-hover:scale-110 transition-transform cursor-pointer" @click="previsualizarImagen(c.urlImagen)" title="Ver imagen">
                  <img :src="getImageUrl(c.urlImagen)" class="size-full object-cover" />
               </div>
               <div v-else class="size-12 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-200">
                  <span class="material-symbols-outlined text-[20px]">image_not_supported</span>
               </div>
            </td>
            <td class="px-8 py-4 text-right" v-if="esActiva">
              <div class="flex items-center justify-end gap-2">
                <button @click="abrirModal(c)" class="size-10 bg-white border border-slate-200 text-slate-600 hover:bg-primary hover:border-primary hover:text-white rounded-xl transition-all shadow-sm">
                  <span class="material-symbols-outlined text-[20px]">edit_note</span>
                </button>
                <button @click="eliminar(c)" class="size-10 bg-white border border-slate-200 text-slate-400 hover:bg-secondary hover:border-secondary hover:text-white rounded-xl transition-all shadow-sm">
                  <span class="material-symbols-outlined text-[20px]">delete</span>
                </button>
              </div>
            </td>
          </tr>
          <tr v-if="criterios.length === 0">
             <td colspan="5" class="px-8 py-20 text-center text-slate-400">
                <span class="material-symbols-outlined text-5xl mb-3 block opacity-20">rule</span>
                <p class="font-bold uppercase tracking-widest text-[10px]">Esta fase no tiene criterios asignados todavía.</p>
                <button @click="abrirModal()" class="mt-4 text-primary font-black uppercase text-[10px] underline tracking-widest hover:text-red-800 transition-colors">Crear primer criterio</button>
             </td>
          </tr>
        </tbody>
      </table>
      </div>

      <!-- Vista Mobile (Tarjetas) -->
      <div class="md:hidden p-4 space-y-4">
        <div v-if="criterios.length === 0" class="text-center py-10 text-slate-400">
          <span class="material-symbols-outlined text-5xl mb-3 block opacity-20">rule</span>
          <p class="font-bold uppercase tracking-widest text-[10px]">Esta fase no tiene criterios asignados todavía.</p>
          <button @click="abrirModal()" class="mt-4 text-primary font-black uppercase text-[10px] underline tracking-widest hover:text-red-800 transition-colors">Crear primer criterio</button>
        </div>

        <div v-else v-for="(c, idx) in criterios" :key="c.idCriterio + '_mobile'" class="bg-slate-50 border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col gap-3">
          <div class="flex gap-4">
            <div class="flex flex-col items-center justify-center bg-white border border-slate-200 rounded-xl size-12 shrink-0">
              <span class="text-[10px] font-black text-slate-400">#{{ idx + 1 }}</span>
            </div>
            <div class="flex-1 flex flex-col justify-center">
              <p class="font-bold text-slate-800 text-base leading-tight mb-1">{{ c.nombre }}</p>
              <div class="flex items-center gap-2">
                <span class="bg-primary/5 text-primary border border-primary/20 px-2 py-0.5 rounded text-[10px] font-black">
                  {{ Number(c.puntajeMaximo) }}%
                </span>
                <span class="text-[9px] uppercase font-black text-slate-400 tracking-widest">Fase: {{ fase?.nombre }}</span>
              </div>
            </div>
          </div>

          <div class="flex items-center gap-3 bg-white p-2 rounded-xl border border-slate-100 mt-1">
            <div v-if="c.urlImagen" @click="previsualizarImagen(c.urlImagen)" class="size-10 bg-slate-100 rounded-lg overflow-hidden border border-slate-200 shrink-0">
              <img :src="getImageUrl(c.urlImagen)" class="size-full object-cover" />
            </div>
            <div v-else class="size-10 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-300 shrink-0">
              <span class="material-symbols-outlined text-[18px]">image_not_supported</span>
            </div>
            <div class="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
              {{ c.urlImagen ? 'Ver Imagen' : 'Sin Referencia' }}
            </div>
          </div>

          <!-- Acciones -->
          <div v-if="esActiva" class="flex items-center gap-2 pt-2 border-t border-slate-200 mt-1">
            <button @click="abrirModal(c)" class="flex-1 py-2 bg-white text-slate-600 hover:bg-slate-100 rounded-xl border border-slate-200 flex justify-center shadow-sm">
              <span class="material-symbols-outlined text-[18px]">edit_note</span>
            </button>
            <button @click="eliminar(c)" class="flex-1 py-2 bg-white text-slate-400 hover:text-secondary hover:bg-red-50 rounded-xl border border-slate-200 flex justify-center shadow-sm">
              <span class="material-symbols-outlined text-[18px]">delete</span>
            </button>
          </div>
        </div>
      </div>
    </div>
    <!-- Banner de solo lectura -->
    <div v-if="!esActiva" class="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 bg-amber-600 text-white px-6 py-3 rounded-2xl shadow-xl flex items-center gap-3 text-sm font-bold">
      <span class="material-symbols-outlined text-xl">history</span>
      Modo solo lectura — Fase histórica
    </div>

    <!-- MODAL CRITERIO (Premium Design) -->
    <v-dialog v-model="modalOpen" max-width="480px">
      <v-card class="rounded-3xl border border-slate-100 shadow-2xl overflow-hidden">
        <v-card-title class="bg-primary text-white p-8">
          <div class="flex items-center gap-3">
             <span class="material-symbols-outlined text-2xl opacity-50">data_thresholding</span>
             <h3 class="text-2xl font-black italic uppercase tracking-tighter">{{ editandoId ? 'Editar Criterio' : 'Nuevo Criterio' }}</h3>
          </div>
          <p class="text-blue-200 text-[10px] font-bold uppercase tracking-widest mt-1 opacity-80">Configurando parámetros de calificación</p>
        </v-card-title>

        <v-card-text class="p-8 bg-white overflow-y-auto max-h-[60vh] custom-scrollbar">
          <div class="space-y-6">
            <div>
              <label class="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Fase de Aplicación</label>
              <div class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-400 cursor-not-allowed flex items-center justify-between">
                <span>{{ fase?.nombre }}</span>
                <span class="material-symbols-outlined text-[16px]">lock_person</span>
              </div>
            </div>

            <div>
              <label class="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Nombre del Criterio *</label>
              <input v-model="form.nombre" type="text" placeholder="Ej: Coreografía y Compás" class="w-full px-5 py-3.5 bg-slate-50 border-2 border-slate-100 rounded-xl focus:border-primary outline-none font-bold placeholder:text-slate-300 transition-all shadow-inner" />
            </div>

            <div>
              <div class="flex items-center justify-between mb-2">
                <label class="block text-[10px] font-black uppercase tracking-widest text-slate-500">Puntaje / Peso (%) *</label>
                <div class="flex items-center gap-1.5 text-[10px] font-black">
                  <span :class="disponiblePuntajeCalc < 0 ? 'text-secondary' : 'text-primary' " class="transition-colors">
                    {{ disponiblePuntajeCalc < 0 ? '⚠ Exceso sobre Fase:' : 'Disponible en Fase:' }}
                    {{ Math.max(0, disponiblePuntajeCalc).toFixed(1) }}%
                  </span>
                </div>
              </div>
              <div class="relative">
                 <input v-model.number="form.puntajeMaximo" type="number" 
                   :class="disponiblePuntajeCalc < 0 ? 'border-secondary bg-red-50 text-secondary' : 'border-slate-100 bg-slate-50 focus:border-primary text-primary'"
                   class="w-full px-5 py-4 border-2 rounded-xl outline-none font-black text-2xl transition-all shadow-inner" 
                 />
                 <span class="absolute right-5 top-1/2 -translate-y-1/2 font-black text-slate-400 text-xl">%</span>
              </div>
              
              <!-- Mini barra de progreso en modal -->
              <div class="mt-3">
                 <div class="h-1.5 bg-slate-100 rounded-full overflow-hidden border border-slate-50 p-0.5 text-[0px]">
                   <div 
                     class="h-full transition-all duration-300 rounded-full shadow-sm"
                     :class="puntajeUsadoConActual > limiteFase ? 'bg-secondary' : 'bg-primary'"
                     :style="{ width: Math.min((puntajeUsadoConActual / limiteFase) * 100, 100) + '%' }"
                   ></div>
                 </div>
                 <div class="flex justify-between text-[8px] font-black text-slate-300 uppercase tracking-tighter mt-1">
                    <span>Ocupado: {{ puntajeUsadoConActual || 0 }}%</span>
                    <span>Techo Fase: {{ limiteFase }}%</span>
                 </div>
              </div>
            </div>

            <div>
              <label class="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Imagen Referencial (.png, .jpg)</label>
              <div
                class="w-full relative border-2 border-dashed rounded-xl overflow-hidden group transition-all"
                :class="archivoPreview || form.urlImagen ? 'border-primary' : 'border-slate-300 hover:border-primary bg-slate-50'"
              >
                <input
                  type="file"
                  accept="image/png, image/jpeg"
                  @change="handleFileChange"
                  class="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
                <div v-if="archivoPreview || form.urlImagen" class="h-28 w-full relative">
                  <img :src="archivoPreview || getImageUrl(form.urlImagen)" class="w-full h-full object-cover" />
                  <div class="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span class="text-white font-bold text-[10px] uppercase tracking-widest flex items-center gap-2">
                      <span class="material-symbols-outlined text-[16px]">upload</span> Cambiar Imagen
                    </span>
                  </div>
                </div>
                <div v-else class="h-28 flex flex-col items-center justify-center text-slate-400 group-hover:text-primary transition-colors">
                  <span class="material-symbols-outlined text-3xl mb-1">add_photo_alternate</span>
                  <span class="text-[10px] font-black uppercase tracking-widest">Arrastra o haz clic para subir</span>
                </div>
              </div>
            </div>
          </div>
        </v-card-text>

        <v-card-actions class="p-8 border-t border-slate-50 bg-slate-50/50">
          <v-spacer></v-spacer>
          <button @click="modalOpen = false" class="px-8 py-3 text-slate-400 font-black uppercase tracking-widest text-[10px] hover:text-slate-600 transition-colors">Cancelar</button>
          <button 
            @click="guardar" 
            :disabled="puntajeUsadoConActual > 100"
            class="bg-primary hover:bg-blue-900 text-white px-10 py-3 rounded-2xl font-black uppercase tracking-tighter shadow-xl shadow-primary/30 transition-all disabled:bg-slate-300 disabled:shadow-none disabled:cursor-not-allowed"
          >
            {{ editandoId ? 'Actualizar Criterio' : 'Guardar Criterio' }}
          </button>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import api from '../services/api'
import { notify } from '../utils/notify'
import Swal from 'sweetalert2'

const getImageUrl = (url) => {
  if (!url) return ''
  if (url.startsWith('http')) return url
  const filename = url.split('/').pop()
  return `${api.defaults.baseURL}/archivos/criterios/${filename}`
}


const props = defineProps({
  fase: { type: Object, required: true },
  esActiva: { type: Boolean, default: true }
})
defineEmits(['volver'])

const criterios = ref([])
const modalOpen = ref(false)
const editandoId = ref(null)
const archivoImagen = ref(null)
const archivoPreview = ref(null)

const handleFileChange = (e) => {
  const file = e.target.files[0]
  if (file) {
    if (!['image/jpeg', 'image/png'].includes(file.type)) {
      return notify.error('Formato Inválido', 'Solo se permiten imágenes JPG y PNG')
    }
    archivoImagen.value = file
    archivoPreview.value = URL.createObjectURL(file)
  }
}

const previsualizarImagen = (url) => {
  Swal.fire({
    imageUrl: getImageUrl(url),
    imageWidth: '100%',
    imageAlt: 'Imagen del criterio',
    showConfirmButton: false,
    showCloseButton: true,
  })
}

const form = ref({ idFase: '', nombre: '', puntajeMaximo: 20, urlImagen: '' })

// ── Computed Properties (Budget Logic) ────────────────────────────────────
const limiteFase = computed(() => {
  if (props.fase?.tipoConcurso === 'EFU') return Number(props.fase.pesoPorcentaje || 0)
  return 100
})

const puntajeUsado = computed(() => {
  return (criterios.value || []).reduce((s, c) => s + Number(c.puntajeMaximo || 0), 0)
})

const disponiblePuntaje = computed(() => limiteFase.value - puntajeUsado.value)

const puntajeUsadoSinActual = computed(() => {
  return (criterios.value || [])
    .filter(c => c.idCriterio !== editandoId.value)
    .reduce((s, c) => s + Number(c.puntajeMaximo || 0), 0)
})

const puntajeUsadoConActual = computed(() => {
  const sum = Number(puntajeUsadoSinActual.value) + Number(form.value.puntajeMaximo || 0)
  return parseFloat(sum.toFixed(2))
})

const disponiblePuntajeCalc = computed(() => {
  const disp = limiteFase.value - puntajeUsadoSinActual.value - Number(form.value.puntajeMaximo || 0)
  return parseFloat(disp.toFixed(2))
})

// ── Data Management ────────────────────────────────────────────────────────
const cargarDatos = async () => {
  if (!props.fase?.idFase) return
  try {
    const res = await api.get(`/evaluaciones/fase/${props.fase.idFase}/criterios`)
    criterios.value = res.data || []
  } catch (e) { 
    console.error('Error al cargar criterios:', e) 
  }
}

watch(() => props.fase, cargarDatos, { immediate: true })

// ── Actions ───────────────────────────────────────────────────────────────
const abrirModal = (item = null) => {
  if (item) {
    editandoId.value = item.idCriterio
    form.value = { ...item, idFase: props.fase.idFase, puntajeMaximo: Number(item.puntajeMaximo) }
  } else {
    editandoId.value = null
    const sugerido = disponiblePuntaje.value > 0 ? Math.min(20, disponiblePuntaje.value) : 0
    form.value = { idFase: props.fase.idFase, nombre: '', puntajeMaximo: sugerido, urlImagen: '' }
  }
  archivoImagen.value = null
  archivoPreview.value = null
  modalOpen.value = true
}

const guardar = async () => {
  if (!form.value.idFase) return notify.error('Error', 'No hay una fase vinculada.')
  if (!form.value.nombre?.trim()) return notify.error('Error', 'El nombre del criterio es obligatorio.')
  if (form.value.puntajeMaximo <= 0) return notify.error('Error', 'El puntaje debe ser mayor a 0%.')
  
  if (puntajeUsadoConActual.value > limiteFase.value) {
    const disp = (limiteFase.value - puntajeUsadoSinActual.value).toFixed(2)
    const extra = props.fase?.tipoConcurso === 'EFU' ? ` (Peso de Fase: ${limiteFase.value}%)` : ''
    return notify.warning('Presupuesto excedido', `La suma de criterios de la fase no puede superar el techo permitido${extra}. Solo tienes disponible un ${disp}%.`)
  }

  try {
    const payload = { ...form.value, fase: { idFase: form.value.idFase } }
    delete payload.idFase

    const formData = new FormData()
    formData.append('data', JSON.stringify(payload))
    if (archivoImagen.value) {
      formData.append('imagen', archivoImagen.value)
    }

    if (editandoId.value) {
      await api.put(`/evaluaciones/criterios/${editandoId.value}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } })
    } else {
      await api.post('/evaluaciones/criterios', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
    }
    
    modalOpen.value = false
    notify.success('¡Guardado!', 'Criterio configurado correctamente.')
    cargarDatos()
  } catch (e) { 
    const msg = e.response?.data?.message || 'No se pudo guardar el criterio.'
    notify.error('Error', msg) 
  }
}

const eliminar = async (item) => {
  const result = await notify.confirm('¿Eliminar criterio?', `"${item.nombre}" será borrado de forma permanente y se perderán las calificaciones asociadas.`, 'Sí, eliminar')

  if (result.isConfirmed) {
    try {
      await api.delete(`/evaluaciones/criterios/${item.idCriterio}`)
      cargarDatos()
      notify.success('Eliminado', 'El criterio ha sido removido.')
    } catch (e) {
      notify.error('Error', 'No se pudo eliminar el criterio.')
    }
  }
}

onMounted(cargarDatos)
</script>

<style scoped>
/* Transición suave para barras de progreso */
.v-card-text {
  scrollbar-width: thin;
  scrollbar-color: #cbd5e1 #f1f1f1;
}

input[type=number]::-webkit-inner-spin-button, 
input[type=number]::-webkit-outer-spin-button { 
  -webkit-appearance: none; 
  margin: 0; 
}
</style>
