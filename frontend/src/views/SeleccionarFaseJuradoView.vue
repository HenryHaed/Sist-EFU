<template>
  <div class="p-6 md:p-8 max-w-7xl mx-auto min-h-[calc(100vh-4rem)]">
    <div class="mb-8">
      <h2 class="text-3xl font-black text-primary tracking-tighter uppercase italic">
        {{ tipoConcurso === 'EFU' ? 'Calificar Fases EFU' : 'Concursos Externos' }}
      </h2>
      <p class="text-slate-500 font-medium text-sm mt-1">
        {{ tipoConcurso === 'EFU' ? 'Selecciona el módulo de evaluación de la Entrada Universitaria.' : 'Califica a los participantes de los concursos y actividades externas.' }}
      </p>
    </div>

    <!-- Error/Loading state -->
    <div v-if="loading" class="flex justify-center py-20">
      <span class="material-symbols-outlined animate-spin text-4xl text-primary">progress_activity</span>
    </div>
    
    <div v-else-if="error" class="bg-red-50 p-6 rounded-2xl border border-red-200 text-center">
      <span class="material-symbols-outlined text-4xl text-red-500 mb-2">error</span>
      <h3 class="text-red-800 font-bold">Error al cargar las fases</h3>
      <p class="text-red-600 text-sm mt-1">{{ error }}</p>
      <button @click="cargarFases" class="mt-4 px-4 py-2 bg-red-100 hover:bg-red-200 text-red-800 rounded-lg text-sm font-bold transition-colors">Reintentar</button>
    </div>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      
      <!-- FASE CARD -->
      <div 
        v-for="fase in fases" 
        :key="fase.idFase"
        class="relative bg-white rounded-3xl overflow-hidden border border-slate-200 shadow-sm transition-all group"
        :class="fase.accesible ? 'hover:shadow-xl hover:shadow-primary/10 hover:border-primary/30 cursor-pointer' : 'opacity-80 grayscale-[30%] cursor-not-allowed'"
        @click="fase.accesible ? seleccionarFase(fase) : null"
      >
        <!-- Overlay de Bloqueo -->
        <div v-if="!fase.accesible" class="absolute inset-0 bg-slate-900/40 z-10 flex flex-col items-center justify-center backdrop-blur-[2px]">
          <div class="bg-white/90 p-4 rounded-full mb-3 shadow-lg">
            <span class="material-symbols-outlined text-4xl text-secondary">lock</span>
          </div>
          <p class="text-white font-bold px-6 text-center text-sm shadow-black drop-shadow-md">
            {{ fase.mensajeBloqueo || 'No tienes permiso para calificar esta FASE' }}
          </p>
        </div>

        <div class="h-40 bg-slate-100 relative overflow-hidden">
          <!-- Si no hay urlImagen, usamos degradado -->
          <img v-if="fase.urlImagen" :src="getImageUrl(fase.urlImagen)" class="w-full h-full object-cover" />
          <div v-else class="absolute inset-0 bg-gradient-to-br from-primary to-blue-900 opacity-90"></div>
          
          <div class="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent flex flex-col justify-end p-5">
            <span class="text-white/60 text-xs font-black tracking-widest uppercase mb-1">Evaluación {{ fase.pesoPorcentaje }}%</span>
            <h3 class="text-2xl font-black text-white leading-tight drop-shadow-sm">{{ fase.nombre }}</h3>
          </div>
        </div>

        <div class="p-5">
          <div class="flex items-center gap-2 mb-4 text-xs text-slate-500 font-medium">
            <span class="material-symbols-outlined text-sm">calendar_month</span>
            <span>Inicio: {{ formatearFecha(fase.fechaInicio) }}</span>
          </div>

          <button 
            class="w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all active:scale-95"
            :class="fase.accesible ? (tipoConcurso === 'EFU' ? 'bg-primary/5 text-primary hover:bg-primary hover:!text-white shadow-sm hover:shadow-primary/20' : 'bg-secondary/5 text-secondary hover:bg-secondary hover:!text-white shadow-sm hover:shadow-secondary/20') : 'bg-slate-100 text-slate-400'"
          >
            {{ fase.accesible ? (tipoConcurso === 'EFU' ? 'Ingresar a Calificar' : 'Ver Participantes') : 'Acceso Restringido' }}
            <span class="material-symbols-outlined text-[20px]">{{ fase.accesible ? 'arrow_forward' : 'block' }}</span>
          </button>
        </div>
      </div>
      
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import api from '../services/api'

import { getImageUrl } from '../utils/url'


const props = defineProps({
  tipoConcurso: {
    type: String,
    default: 'EFU'
  }
})

const emit = defineEmits(['fase-seleccionada'])

const fases = ref([])
const loading = ref(true)
const error = ref('')

const cargarFases = async () => {
  loading.value = true
  error.value = ''
  try {
    const { data } = await api.get('/evaluaciones/fases-auth')
    // Filter by type
    fases.value = data.filter(f => f.tipoConcurso === props.tipoConcurso)
  } catch (err) {
    error.value = err.response?.data?.message || 'Error de conexión con el servidor.'
  } finally {
    loading.value = false
  }
}

const seleccionarFase = (fase) => {
  emit('fase-seleccionada', fase)
}

const formatearFecha = (fechaString) => {
  if (!fechaString) return 'Sin fecha'
  const fecha = new Date(fechaString)
  return fecha.toLocaleDateString('es-BO', { day: '2-digit', month: 'short', year: 'numeric' })
}

onMounted(() => {
  cargarFases()
})
</script>
