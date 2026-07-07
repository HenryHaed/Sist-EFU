<template>
  <div class="dashboard-page max-w-7xl w-full">

    <!-- Breadcrumb / Header -->
    <div class="mb-8 flex items-start justify-between flex-wrap gap-4">
      <div>
        <button @click="$emit('volver')" class="flex items-center gap-1 text-slate-500 hover:text-primary text-sm font-bold mb-3 transition-colors group">
          <span class="material-symbols-outlined text-[18px] group-hover:-translate-x-1 transition-transform">arrow_back</span>
          Cambiar Fraternidad
        </button>
        <div class="flex items-center gap-2 mb-1">
          <span class="h-1 w-8 bg-secondary inline-block"></span>
          <h2 class="text-3xl font-black tracking-tight text-primary">Selección de Fase</h2>
        </div>
        <p class="text-slate-500 text-sm mt-1">
          Fraternidad: <span class="font-black text-slate-700">{{ fraternidad?.nombre || '—' }}</span>
          · <span class="text-slate-400">{{ fraternidad?.tipo }}</span>
        </p>
      </div>
      <!-- Fraternidad mini card -->
      <div v-if="fraternidad" class="bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-3 shadow-sm min-w-[220px]">
        <img :src="fraternidad.imagen" :alt="fraternidad.nombre" class="size-12 rounded-lg object-cover border border-slate-200" />
        <div>
          <p class="font-black text-primary text-sm">{{ fraternidad.nombre }}</p>
          <p class="text-[10px] text-slate-500 uppercase font-bold">{{ fraternidad.facultad }}</p>
        </div>
      </div>
    </div>

    <!-- Phase Grid -->
    <v-row class="mb-12">
      <v-col cols="12" md="6" lg="4" v-for="(fase, index) in fases" :key="index">
        <v-card
          @click="evaluar(fase)"
          class="bg-white rounded-xl overflow-hidden group d-flex flex-column transition-all duration-300 relative h-100"
          :class="fase.activo ? 'border-2 border-primary shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] cursor-pointer' : 'border border-slate-300 shadow-sm opacity-90 hover:opacity-100 hover:shadow-md cursor-pointer'"
          color="white"
          elevation="0"
          :style="{ transform: fase.activo ? 'translateY(-2px)' : 'none' }"
        >
          <div class="relative h-52 overflow-hidden w-full shrink-0 border-b-4" :class="fase.activo ? 'border-b-secondary' : 'border-b-slate-200'">
            <div class="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-110"
              :style="{ backgroundImage: `url(${fase.imagen})` }"></div>
            <div class="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/40 to-transparent"></div>
            <div class="absolute top-4 left-4">
              <span v-if="fase.activo" class="px-3 py-1 bg-secondary text-white text-[10px] uppercase font-black tracking-widest rounded-sm border border-secondary/30 flex items-center gap-1 shadow-lg">
                <span class="material-symbols-outlined text-[14px]">sync</span>
                En Progreso
              </span>
              <span v-else class="px-3 py-1 bg-white text-slate-800 text-[10px] uppercase font-black tracking-widest rounded-sm border border-slate-200 flex items-center gap-1 shadow-sm">
                <span class="material-symbols-outlined text-[14px] text-green-600">check_circle</span>
                Disponible
              </span>
            </div>
          </div>

          <v-card-text class="pa-6 flex-1 d-flex flex-column text-left bg-white">
            <div class="mb-4">
              <h4 class="text-xl font-black text-primary mb-2">{{ fase.titulo }}</h4>
              <p class="text-sm text-slate-500 leading-relaxed">{{ fase.descripcion }}</p>
            </div>
            <div class="mt-auto pt-5 border-t border-slate-100 w-full">
              <v-btn
                block
                rounded="lg"
                :class="fase.activo
                  ? 'bg-primary text-white border-2 border-primary shadow-[0_4px_15px_rgba(0,74,153,0.3)]'
                  : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-300'"
                height="48"
                class="font-black text-body-1"
                style="text-transform: none; letter-spacing: normal;"
                elevation="0"
              >
                <span class="material-symbols-outlined mr-2 text-[20px]">{{ fase.activo ? 'edit_document' : 'play_arrow' }}</span>
                {{ fase.activo ? 'Continuar Calificando' : 'Iniciar Evaluación' }}
              </v-btn>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Stats Overview -->
    <v-card class="bg-white rounded-xl p-8 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] relative overflow-hidden text-left" color="white" elevation="0">
      <div class="absolute top-0 right-0 w-64 h-64 bg-slate-50 rounded-full blur-3xl -mr-32 -mt-32"></div>
      <h4 class="text-primary text-lg font-black mb-6 relative z-10 w-full uppercase tracking-wide d-flex align-center gap-2">
        <span class="material-symbols-outlined text-secondary">bar_chart</span>
        Resumen de Progreso
      </h4>
      <v-row class="relative z-10">
        <v-col cols="12" sm="6" md="3" v-for="stat in statsResumen" :key="stat.label">
          <v-card class="bg-white pa-4 rounded-lg border border-slate-200 text-left shadow-none" color="transparent" elevation="0">
            <p class="text-secondary text-[10px] font-black uppercase tracking-widest mb-1">{{ stat.label }}</p>
            <p class="text-3xl font-black text-primary m-0">{{ stat.valor }}</p>
            <v-progress-linear v-if="stat.progreso" :model-value="stat.progreso" color="secondary" height="4" rounded class="mt-2 bg-slate-100"></v-progress-linear>
          </v-card>
        </v-col>
      </v-row>
    </v-card>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const props = defineProps({
  fraternidad: { type: Object, default: null }
})

const emit = defineEmits(['seleccionar-fase', 'volver'])

const fases = ref([
  {
    id: 'monografia',
    titulo: 'Fase 1: Monografía',
    descripcion: 'Calificación de la monografía presentada, fundamentación histórica, investigación y aportes culturales.',
    imagen: '/src/assets/img/monografia.png',
    activo: true
  },
  {
    id: 'entrada',
    titulo: 'Fase 2: Entrada',
    descripcion: 'Evaluación técnica inicial: presentación general, puntualidad, formación y entrada inicial al recorrido.',
    imagen: '/src/assets/img/entrada.png',
    activo: false
  },
  {
    id: 'disciplina',
    titulo: 'Fase 3: Disciplina',
    descripcion: 'Comportamiento de la fraternidad, organización durante el recorrido y cumplimiento del reglamento.',
    imagen: '/src/assets/img/disciplina.png',
    activo: false
  }
])

const statsResumen = ref([
  { label: 'Fraternidades', valor: '42/68', progreso: 61 },
  { label: 'Evaluaciones', valor: '126' },
  { label: 'Tiempo Promedio', valor: '8:45m' },
  { label: 'Puntos Emitidos', valor: '8,420' },
])

const evaluar = (fase) => {
  emit('seleccionar-fase', fase.id)
}
</script>
