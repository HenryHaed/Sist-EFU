<template>
  <div class="p-6 md:p-8 max-w-7xl mx-auto w-full">
    <!-- Page Title -->
    <div class="flex justify-between items-end mb-8 flex-wrap gap-4">
      <div>
        <div class="flex items-center gap-2 mb-1">
          <span class="h-1 w-8 bg-secondary inline-block"></span>
          <h2 class="text-3xl font-black tracking-tight text-primary uppercase">Panel de Estadísticas</h2>
        </div>
        <p class="text-slate-500 text-sm mt-1">Monitoreo en tiempo real de la Entrada Universitaria Folklórica</p>
      </div>
      <div class="flex gap-3">
        <button class="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium shadow-sm hover:border-primary transition-colors">
          <span class="material-symbols-outlined text-lg text-primary">calendar_today</span>
          <span>Gestión {{ gestionData.anio || 'Actual' }}</span>
        </button>
        <button
          @click="$emit('ir-calificar')"
          class="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-bold shadow-lg shadow-primary/20 hover:brightness-110 transition-all border border-blue-900"
        >
          <span class="material-symbols-outlined text-lg">grade</span>
          <span>Calificar Ahora</span>
        </button>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex flex-col items-center justify-center py-20 text-slate-400">
      <span class="material-symbols-outlined animate-spin text-5xl text-primary mb-4">sync</span>
      <p class="font-bold tracking-widest uppercase text-xs">Cargando Estadísticas...</p>
    </div>

    <div v-else>
      <!-- Stats Grid -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div v-for="stat in stats" :key="stat.label"
          class="bg-white p-6 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow">
          <div class="absolute -right-4 -top-4 size-24 rounded-full group-hover:scale-110 transition-transform" :class="stat.bg"></div>
          <p class="text-xs font-black text-slate-500 uppercase tracking-widest mb-2 overflow-hidden text-ellipsis whitespace-nowrap">{{ stat.label }}</p>
          <div class="flex items-baseline gap-2">
            <span class="text-4xl font-black text-slate-900">{{ stat.valor }}</span>
            <span class="text-[10px] font-bold px-2 py-0.5 rounded-full" :class="stat.badgeClass">{{ stat.badge }}</span>
          </div>
          <v-progress-linear v-if="stat.progreso" :model-value="stat.progreso" color="secondary" height="4" rounded class="mt-3 bg-slate-100"></v-progress-linear>
        </div>
      </div>

      <!-- Charts and Ranking Section -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <!-- Bar Chart EFU -->
        <div class="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-200 shadow-sm border-t-4 border-t-primary">
          <div class="flex justify-between items-center mb-6">
            <h3 class="text-lg font-black text-primary flex items-center gap-2">
              <span class="material-symbols-outlined text-secondary">bar_chart</span>
              Puntajes más Altos — Fraternidades
            </h3>
          </div>
          <div v-if="ranking.length > 0" class="h-56 flex items-end justify-between gap-3 px-2 border-b border-slate-100 pb-2 overflow-x-auto">
            <div v-for="item in ranking.slice(0,10)" :key="item.nombre" class="flex flex-col items-center gap-2 flex-1 min-w-[50px]">
              <div class="w-full bg-slate-100 rounded-t-lg relative h-full flex flex-col justify-end overflow-hidden group">
                <span class="absolute -top-6 left-1/2 -translate-x-1/2 font-black text-xs text-primary transition-opacity">{{ item.puntaje }}</span>
                <div
                  class="w-full rounded-t-lg transition-all duration-700 hover:brightness-110"
                  :class="item.color"
                  :style="{ height: item.puntaje + '%' }"
                ></div>
              </div>
              <span class="text-[9px] font-bold text-slate-500 uppercase text-center leading-tight truncate w-full" :title="item.nombre">
                {{ item.nombre.substring(0, 10) }}{{ item.nombre.length > 10 ? '...' : '' }}
              </span>
            </div>
          </div>
          <div v-else class="h-56 flex flex-col items-center justify-center text-slate-400">
            <span class="material-symbols-outlined text-4xl mb-2 text-slate-200">show_chart</span>
            <p class="text-xs uppercase font-bold tracking-widest">Esperando actas selladas...</p>
          </div>
        </div>

        <!-- Top List EFU -->
        <div class="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col">
          <h3 class="text-lg font-black text-primary mb-5 flex items-center justify-between">
            Top 5 Fraternidades
            <span class="material-symbols-outlined text-secondary">emoji_events</span>
          </h3>
          <div v-if="ranking.length > 0" class="space-y-2 flex-1">
            <div
              v-for="(item, i) in ranking.slice(0, 5)"
              :key="item.nombre"
              class="flex items-center justify-between p-3 rounded-lg border transition-colors"
              :class="i === 0 ? 'bg-primary/5 border-primary/10' : 'bg-white border-slate-100 hover:bg-slate-50'"
            >
              <div class="flex items-center gap-3 overflow-hidden">
                <span
                  class="size-6 flex items-center justify-center text-xs font-black rounded-full shrink-0"
                  :class="i === 0 ? 'bg-primary text-white' : 'bg-slate-100 text-slate-500'"
                >{{ i + 1 }}</span>
                <div class="overflow-hidden">
                  <p class="text-xs font-bold text-slate-900 truncate" :title="item.nombre">{{ item.nombre }}</p>
                  <p class="text-[9px] text-slate-500 uppercase font-bold truncate">{{ item.tipo }}</p>
                </div>
              </div>
              <span class="font-black ml-2" :class="i === 0 ? 'text-primary text-lg' : 'text-slate-700'">{{ item.puntaje }}</span>
            </div>
          </div>
          <div v-else class="flex-1 flex flex-col items-center justify-center text-slate-400 py-10">
            <p class="text-[10px] uppercase font-bold tracking-widest">Aún no hay resultados</p>
          </div>
        </div>
      </div>

      <!-- Concursos Externos Section (Dynamic) -->
      <div v-if="concursos.length > 0">
        <div class="flex justify-between items-end mb-6">
           <h3 class="text-xl font-black text-slate-800 uppercase italic tracking-tighter">Concursos Externos</h3>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <div 
            v-for="concurso in concursos" :key="concurso.nombre"
            class="bg-white p-6 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden"
          >
            <div class="absolute right-0 top-0 size-24 bg-gradient-to-bl from-amber-500/10 to-transparent rounded-bl-full -mr-4 -mt-4"></div>
            <h4 class="text-md font-black text-primary uppercase tracking-tighter mb-4">{{ concurso.nombre }}</h4>
            
            <div v-if="concurso.top.length > 0" class="space-y-3 relative z-10">
              <div 
                v-for="(part, idx) in concurso.top" :key="part.id"
                class="flex justify-between items-center group cursor-default"
              >
                <div class="flex items-center gap-3 overflow-hidden">
                  <div class="size-6 rounded-md flex items-center justify-center font-black text-[10px]"
                       :class="idx === 0 ? 'bg-amber-100 text-amber-700' : 'bg-slate-50 text-slate-400 border border-slate-200'">
                    #{{ idx + 1 }}
                  </div>
                  <div class="overflow-hidden">
                    <p class="text-xs font-bold text-slate-800 truncate" :title="part.nombre">{{ part.nombre }}</p>
                    <p class="text-[9px] text-slate-400 uppercase font-bold tracking-widest truncate">{{ part.fraternidad }}</p>
                  </div>
                </div>
                <!-- Puntos -->
                <div class="text-right ml-2 shrink-0">
                  <span class="text-sm font-black" :class="idx === 0 ? 'text-amber-600' : 'text-slate-600'">{{ part.puntaje }}</span>
                  <span class="text-[8px] text-slate-400 block -mt-1 font-bold">PTS</span>
                </div>
              </div>
            </div>
            
            <div v-else class="py-8 text-center text-slate-400">
               <span class="material-symbols-outlined mb-1">hourglass_empty</span>
               <p class="text-[10px] font-bold uppercase tracking-widest">En espera de resultados</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Institutional Banner -->
      <div class="bg-white p-8 rounded-xl border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] relative overflow-hidden grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
        <div class="absolute top-0 right-0 size-48 bg-slate-50 rounded-full blur-3xl -mr-24 -mt-24"></div>
        <div class="relative z-10 border-l-4 border-secondary pl-6">
          <h4 class="text-2xl font-black mb-2 uppercase italic tracking-tighter text-slate-900">Hacia la excelencia institucional</h4>
          <p class="text-slate-500 text-sm font-medium">Sistema de evaluación oficial gestionado por la Universidad Mayor de San Andrés.</p>
        </div>
        <div class="relative z-10 flex md:justify-end gap-10 items-center">
          <div class="text-center">
            <p class="text-4xl font-black text-primary">{{ gestionData.anio || '2024' }}</p>
            <p class="text-[10px] uppercase font-black text-slate-400">Gestión</p>
          </div>
          <div class="w-px h-12 bg-slate-200"></div>
          <div class="text-center">
            <p class="text-4xl font-black text-secondary">{{ gestionData.edicion || 'XXXV' }}</p>
            <p class="text-[10px] uppercase font-black text-slate-400">Edición</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import api from '../services/api'

defineEmits(['ir-calificar'])

const loading = ref(true)

const stats = ref([])
const ranking = ref([])
const concursos = ref([])
const gestionData = ref({})

const cargarEstadisticas = async () => {
  loading.value = true
  try {
    const { data } = await api.get('/evaluaciones/estadisticas')
    stats.value = data.basico || []
    ranking.value = data.rankingEfu || []
    concursos.value = data.concursos || []
    gestionData.value = data.gestion || {}
  } catch (error) {
    console.error('Error al cargar métricas:', error)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  cargarEstadisticas()
})
</script>
