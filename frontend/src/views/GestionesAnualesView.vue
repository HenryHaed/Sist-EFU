<template>
  <div class="p-6 md:p-8 max-w-5xl mx-auto">
    <!-- Header -->
    <div class="mb-8">
      <h2 class="text-3xl font-black text-primary tracking-tighter uppercase italic">Gestiones Anuales</h2>
      <p class="text-slate-500 text-sm mt-1">Selecciona una gestión para administrar sus fases de evaluación.</p>
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
        <div v-else class="absolute top-4 right-4 bg-slate-100 text-slate-500 border border-slate-200 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
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

        <!-- CTA -->
        <div class="mt-5 flex items-center gap-2 text-primary font-black text-sm group-hover:gap-3 transition-all">
          <span>Ver Fases</span>
          <span class="material-symbols-outlined text-[18px]">arrow_forward</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import api from '../services/api'

const emit = defineEmits(['seleccionar-gestion'])
const gestiones = ref([])
const cargando = ref(true)

const cargar = async () => {
  cargando.value = true
  try {
    const { data } = await api.get('/evaluaciones/gestiones')
    gestiones.value = data
  } catch (e) { console.error(e) }
  finally { cargando.value = false }
}

const abrirGestion = (g) => emit('seleccionar-gestion', g)

onMounted(cargar)
</script>
