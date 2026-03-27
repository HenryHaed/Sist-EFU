<template>
  <div class="p-6 md:p-8 max-w-7xl mx-auto w-full">
    <!-- Page Title -->
    <div class="mb-8">
      <div class="flex items-center gap-2 mb-1">
        <span class="h-1 w-8 bg-secondary inline-block"></span>
        <h2 class="text-3xl font-black tracking-tight text-primary">Calificar Fraternidades</h2>
      </div>
      <p class="text-slate-500 text-sm mt-1">Entrada Universitaria UMSA — Gestión 2026</p>
    </div>

    <!-- Search bar -->
    <div class="relative max-w-lg mb-6">
      <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[20px]">search</span>
      <input
        v-model="busqueda"
        class="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary text-sm shadow-sm transition-all"
        placeholder="Buscar fraternidad (Morenada, Caporales...)..."
      />
    </div>

    <!-- Tabs -->
    <div class="flex gap-6 border-b border-slate-200 mb-8 overflow-x-auto">
      <button
        v-for="tab in tabs"
        :key="tab.value"
        @click="tabActivo = tab.value"
        :class="tabActivo === tab.value ? 'border-b-2 border-primary text-primary font-black' : 'text-slate-500 hover:text-primary font-bold'"
        class="pb-3 text-sm whitespace-nowrap transition-colors"
      >
        {{ tab.label }}
      </button>
    </div>

    <!-- Grid of Fraternidades -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
      <div
        v-for="fra in fraternidadesFiltradas"
        :key="fra.id"
        @click="seleccionar(fra)"
        class="bg-white rounded-xl overflow-hidden border border-slate-200 hover:shadow-xl hover:border-primary transition-all duration-300 group cursor-pointer"
        :class="fra.calificado ? 'opacity-80' : ''"
      >
        <!-- Image -->
        <div class="relative h-44 overflow-hidden border-b-4" :class="fra.calificado ? 'border-b-emerald-500' : 'border-b-secondary'">
          <img
            :src="getFullUrl(fra.imagen)"
            :alt="fra.nombre"
            class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          <div class="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
          <!-- Badge -->
          <div class="absolute top-3 right-3">
            <span
              class="text-[10px] font-black px-2 py-1 rounded-sm uppercase tracking-widest border flex items-center gap-1"
              :class="fra.calificado ? 'bg-emerald-500 text-white border-emerald-400' : 'bg-secondary text-white border-secondary/40'"
            >
              <span class="material-symbols-outlined text-[12px]">{{ fra.calificado ? 'check_circle' : 'pending' }}</span>
              {{ fra.calificado ? 'Calificado' : 'Pendiente' }}
            </span>
          </div>
          <!-- Name overlay -->
          <div class="absolute bottom-3 left-3">
            <p class="text-white font-black text-sm leading-tight">{{ fra.nombre }}</p>
            <p class="text-white/70 text-[10px] uppercase tracking-wide">{{ fra.facultad }}</p>
          </div>
        </div>

        <!-- Card Body -->
        <div class="p-4">
          <p class="text-xs text-slate-500 mb-3">{{ fra.tipo }} · {{ fra.facultad }}</p>
          <button
            class="w-full py-2.5 rounded-lg text-sm font-black flex items-center justify-center gap-2 transition-all border-2"
            :class="fra.calificado
              ? 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              : 'bg-primary text-white border-primary shadow-[0_4px_15px_rgba(0,74,153,0.3)] hover:brightness-110'"
            @click.stop="seleccionar(fra)"
          >
            <span class="material-symbols-outlined text-[18px]">{{ fra.calificado ? 'visibility' : 'edit_note' }}</span>
            {{ fra.calificado ? 'Ver Detalle' : 'Calificar' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import api from '../services/api'

const emit = defineEmits(['seleccionar-fraternidad'])

const busqueda = ref('')
const tabActivo = ref('todas')
const loading = ref(true)
const fraternidades = ref([])

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1590076215667-873d31484126?q=80&w=800&auto=format&fit=crop'

const tabs = [
  { label: 'Todas', value: 'todas' },
  { label: 'CATEGORÍA A', value: 'CATEGORÍA A' },
  { label: 'CATEGORÍA B', value: 'CATEGORÍA B' },
  { label: 'CATEGORÍA C', value: 'CATEGORÍA C' },
  { label: 'Pendientes', value: 'pendiente' },
]

const getFullUrl = (url) => {
  if (!url) return FALLBACK_IMAGE
  if (url.startsWith('http')) return url
  return `http://localhost:3000${url}`
}

const cargarFraternidades = async () => {
  loading.value = true
  try {
    const response = await api.get('/fraternidades')
    // Mapeamos la data del API a nuestra estructura visual
    fraternidades.value = response.data.map(f => ({
      id: f.idFraternidad,
      nombre: f.nombre,
      facultad: f.facultad?.sigla || f.origenFraternidad,
      tipo: f.categoria?.nombre || 'General',
      categoria: f.categoria?.nombre,
      calificado: false, // Esto se conectará luego con las evaluaciones reales
      imagen: f.logoUrl || FALLBACK_IMAGE
    }))
  } catch (error) {
    console.error('Error al cargar fraternidades:', error)
  } finally {
    loading.value = false
  }
}

onMounted(cargarFraternidades)

const fraternidadesFiltradas = computed(() => {
  let lista = fraternidades.value
  if (tabActivo.value !== 'todas') {
    if (tabActivo.value === 'pendiente') {
      lista = lista.filter(f => !f.calificado)
    } else {
      lista = lista.filter(f => f.categoria === tabActivo.value)
    }
  }
  if (busqueda.value.trim()) {
    const q = busqueda.value.toLowerCase()
    lista = lista.filter(f => 
      f.nombre.toLowerCase().includes(q) || 
      f.facultad.toLowerCase().includes(q) || 
      f.tipo.toLowerCase().includes(q)
    )
  }
  return lista
})

const seleccionar = (fra) => {
  emit('seleccionar-fraternidad', fra)
}
</script>
