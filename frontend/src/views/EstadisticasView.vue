<template>
  <div class="dashboard-page max-w-7xl w-full">
    <!-- Page Title -->
    <div class="dashboard-toolbar items-end mb-6 sm:mb-8 flex-wrap gap-4">
      <div class="min-w-0">
        <div class="flex items-center gap-2 mb-1">
          <span class="h-1 w-8 bg-secondary inline-block shrink-0"></span>
          <h2 class="dashboard-page-title text-primary uppercase">Panel de Estadísticas</h2>
        </div>
        <p class="text-slate-500 text-sm mt-1 font-medium">Monitoreo dinámico del desempeño institucional {{ gestionData.anio }}</p>
      </div>
      <div class="flex flex-col xs:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
        <button
          @click="cargarEstadisticas"
          class="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-bold text-slate-600 shadow-sm hover:border-primary hover:text-primary transition-all active:scale-95"
        >
          <span class="material-symbols-outlined text-lg" :class="{ 'animate-spin': loading }">sync</span>
          <span>Actualizar</span>
        </button>
        <button
          @click="$emit('ir-calificar')"
          class="flex items-center gap-2 px-6 py-2 bg-primary text-white rounded-lg text-sm font-black shadow-lg shadow-primary/20 hover:brightness-110 transition-all border-b-4 border-blue-900 active:border-b-0 active:translate-y-1"
        >
          <span class="material-symbols-outlined text-lg">grade</span>
          <span>PUNTUAR</span>
        </button>
      </div>
    </div>

    <!-- Loading Overlay -->
    <div v-if="loading && !stats.length" class="flex flex-col items-center justify-center py-20 text-slate-400">
      <div class="relative size-20 mb-4">
        <div class="absolute inset-0 border-4 border-slate-100 rounded-full"></div>
        <div class="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
      <p class="font-black tracking-widest uppercase text-[10px]">Analizando Datos en Tiempo Real...</p>
    </div>

    <div v-else class="space-y-8 animate-in fade-in duration-700">
      <!-- Stats Cards -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div v-for="stat in stats" :key="stat.label"
          class="bg-white p-6 rounded-2xl border border-slate-200 shadow-[2px_2px_0px_0px_rgba(226,232,240,1)] relative overflow-hidden group hover:translate-y-[-4px] transition-all duration-300">
          <div class="absolute -right-4 -top-4 size-24 rounded-full group-hover:scale-110 transition-transform opacity-10" :style="{ backgroundColor: stat.colorHex || '#003399' }"></div>
          
          <div class="flex justify-between items-start mb-4">
            <p class="text-[10px] font-black text-slate-500 uppercase tracking-widest">{{ stat.label }}</p>
            <span class="material-symbols-outlined text-slate-300 group-hover:text-primary transition-colors">analytics</span>
          </div>

          <div class="flex items-baseline gap-2 mb-4">
            <span class="text-4xl font-black text-slate-900 tracking-tighter">{{ stat.valor }}</span>
            <span class="text-[10px] font-black px-2 py-0.5 rounded-md flex items-center gap-1" :style="{ backgroundColor: stat.badgeBg || '#f1f5f9', color: stat.badgeColor || '#64748b' }">
              <span class="material-symbols-outlined text-[12px]">{{ stat.progreso > 0 ? 'trending_up' : 'trending_flat' }}</span>
              {{ stat.badge }}
            </span>
          </div>
          
          <div class="space-y-1">
             <div class="flex justify-between text-[9px] font-black uppercase text-slate-400 tracking-tighter">
                <span>Progreso Local</span>
                <span>{{ stat.progreso || 0 }}%</span>
             </div>
             <div class="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                <div class="h-full bg-secondary transition-all duration-1000" :style="{ width: (stat.progreso || 0) + '%' }"></div>
             </div>
          </div>
        </div>
      </div>

      <!-- MAIN CHART SECTION -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <!-- Vertical Bar Chart (ApexCharts) -->
        <div class="lg:col-span-2 bg-white p-8 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden">
          <div class="flex items-center justify-between mb-8">
            <div>
              <h3 class="text-lg font-black text-primary uppercase italic tracking-tighter flex items-center gap-2">
                <span class="material-symbols-outlined text-secondary">bar_chart</span>
                Puntajes más Altos - EFU {{ gestionData.anio }}
              </h3>
              <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Promedio de fases cerradas por fraternidad</p>
            </div>
            <div class="flex items-center gap-2 bg-slate-50 p-1.5 rounded-lg border border-slate-100">
                <span class="size-2 rounded-full bg-primary"></span>
                <span class="text-[9px] font-black text-slate-500 uppercase">Puntaje / 100</span>
            </div>
          </div>

          <div v-if="rankingEfu.length > 0" class="h-80 w-full min-h-[320px]">
            <apexchart
              type="bar"
              height="100%"
              width="100%"
              :options="chartOptions"
              :series="chartSeries"
            ></apexchart>
          </div>
          
          <div v-else class="h-80 flex flex-col items-center justify-center text-slate-300 bg-slate-50/50 rounded-2xl border-2 border-dashed border-slate-100">
            <span class="material-symbols-outlined text-6xl mb-4 animate-pulse">query_stats</span>
            <p class="text-sm font-black uppercase tracking-widest">Esperando que cierren las actas de evaluación</p>
          </div>
        </div>

        <!-- TOP 5 RANKING LIST -->
        <div class="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm flex flex-col">
          <div class="flex items-center justify-between mb-8">
            <h3 class="text-lg font-black text-primary uppercase italic tracking-tighter">Podio EFU</h3>
            <span class="size-8 bg-amber-100 rounded-full flex items-center justify-center text-amber-600">
                <span class="material-symbols-outlined text-sm">emoji_events</span>
            </span>
          </div>

          <div v-if="rankingEfu.length > 0" class="space-y-3 flex-1 overflow-y-auto custom-scrollbar pr-1">
            <div
              v-for="(item, i) in rankingEfu.slice(0, 7)"
              :key="item.nombre"
              class="group flex items-center justify-between p-4 rounded-2xl border transition-all duration-300"
              :class="i === 0 ? 'bg-primary text-white border-primary shadow-xl shadow-primary/10 -rotate-1 active:rotate-0' : 'bg-white border-slate-100 hover:border-primary/30 hover:bg-slate-50'"
            >
              <div class="flex items-center gap-4 overflow-hidden">
                <div 
                  class="size-8 flex items-center justify-center text-xs font-black rounded-xl shrink-0 transition-transform group-hover:scale-110"
                  :class="i === 0 ? 'bg-white text-primary' : (i < 3 ? 'bg-secondary text-white' : 'bg-slate-100 text-slate-400')"
                >
                  {{ i + 1 }}
                </div>
                <div class="overflow-hidden">
                  <p class="text-xs font-black truncate leading-none mb-1">{{ item.nombre }}</p>
                  <p class="text-[9px] uppercase font-bold opacity-60 truncate">{{ item.tipo }}</p>
                </div>
              </div>
              <div class="text-right ml-4 shrink-0">
                <span class="text-lg font-black tracking-tighter">{{ item.puntaje }}</span>
                <span class="text-[8px] font-black block -mt-1 opacity-60 uppercase">pts</span>
              </div>
            </div>
          </div>
          
          <div v-else class="flex-1 flex flex-col items-center justify-center text-slate-300">
            <p class="text-[10px] font-black uppercase tracking-[0.2em]">Sin datos disponibles</p>
          </div>

          <button @click="$emit('ir-calificar')" class="mt-8 py-3 w-full bg-slate-50 border border-slate-200 rounded-xl text-[10px] font-black text-slate-500 uppercase tracking-widest hover:text-primary hover:border-primary transition-all">Ver todos los resultados</button>
        </div>
      </div>

      <!-- Institutional Footer -->
      <div class="bg-black text-white p-10 rounded-[32px] shadow-2xl relative overflow-hidden group">
        <div class="absolute top-0 right-0 w-1/3 h-full bg-primary opacity-20 skew-x-12 translate-x-1/2"></div>
        <div class="absolute bottom-0 left-0 size-64 bg-secondary/10 rounded-full blur-3xl -ml-32 -mb-32"></div>
        
        <div class="relative z-10 flex flex-col md:flex-row justify-between items-center gap-10">
          <div class="max-w-md">
            <div class="flex items-center gap-3 mb-4">
                <div class="size-8 bg-white rounded flex items-center justify-center text-black font-black">U</div>
                <p class="text-[10px] font-black tracking-[0.4em] uppercase opacity-60">Universidad Mayor de San Andrés</p>
            </div>
            <h4 class="text-3xl font-black italic tracking-tighter uppercase mb-2">Compromiso con la Cultura</h4>
            <p class="text-slate-400 text-sm leading-relaxed">Este sistema garantiza la transparencia en la calificación de la XXXV Entrada Folclórica Universitaria - Gestión {{ gestionData.anio }}.</p>
          </div>
          
          <div class="flex gap-8 items-center shrink-0 border-l border-white/10 pl-10 h-full">
            <div class="text-center group-hover:scale-110 transition-transform">
              <p class="text-5xl font-black text-secondary tracking-tighter mb-1">{{ gestionData.edicion || 'XXXV' }}</p>
              <p class="text-[10px] uppercase font-black opacity-40 tracking-widest">Edición</p>
            </div>
            <div class="w-px h-16 bg-white/10"></div>
            <div class="text-center group-hover:scale-110 transition-transform delay-75">
              <p class="text-5xl font-black text-white tracking-tighter mb-1">{{ stats.length ? stats[0].valor : '0' }}</p>
              <p class="text-[10px] uppercase font-black opacity-40 tracking-widest">Fraternidades</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed, defineComponent } from 'vue'
import api from '../services/api'
import VueApexCharts from 'vue3-apexcharts'

// Registering local component for script setup
const apexchart = VueApexCharts

defineEmits(['ir-calificar'])

const loading = ref(true)
const stats = ref([])
const rankingEfu = ref([])
const concursos = ref([])
const gestionData = ref({})

// ApexCharts Configuration
const chartSeries = computed(() => {
  return [{
    name: 'Puntaje',
    data: rankingEfu.value.slice(0, 10).map(r => r.puntaje)
  }]
})

const chartOptions = computed(() => {
  return {
    chart: {
      type: 'bar',
      width: '100%',
      toolbar: { show: false },
      fontFamily: 'Inter, sans-serif'
    },
    plotOptions: {
      bar: {
        borderRadius: 6,
        columnWidth: '75%',
        distributed: true,
        dataLabels: { position: 'top' }
      }
    },
    colors: ['#003399', '#C8102E', '#F1C40F', '#003399', '#C8102E', '#F1C40F', '#003399', '#C8102E', '#003399', '#C8102E'],
    dataLabels: {
      enabled: true,
      formatter: (val) => val,
      offsetY: -20,
      style: { fontSize: '12px', fontWeight: '900', colors: ["#304758"] }
    },
    legend: { show: false },
    xaxis: {
      categories: rankingEfu.value.slice(0, 10).map(r => r.nombre.length > 15 ? r.nombre.substring(0, 12) + '...' : r.nombre),
      labels: { style: { fontSize: '10px', fontWeight: '700', colors: '#64748b' } },
      axisBorder: { show: false },
      axisTicks: { show: false }
    },
    yaxis: {
      min: 0,
      max: 100,
      tickAmount: 10,
      labels: { 
        style: { fontWeight: '700', colors: '#64748b', fontSize: '10px' },
        formatter: (val) => val.toFixed(0)
      }
    },
    grid: { 
      borderColor: '#f1f5f9', 
      strokeDashArray: 4,
      padding: { left: 0, right: 0 }
    },
    tooltip: { theme: 'dark' }
  }
})

const cargarEstadisticas = async () => {
    loading.value = true
    try {
        const { data } = await api.get('/evaluaciones/estadisticas')
        
        // Mapping stats to ensure Tailwind or inline colors work
        const basico = data.basico || []
        const colors = [
          { main: '#003399', badgeBg: '#eef2ff', badgeText: '#4338ca' },
          { main: '#C8102E', badgeBg: '#fef2f2', badgeText: '#b91c1c' },
          { main: '#0ea5e9', badgeBg: '#f0f9ff', badgeText: '#0369a1' }
        ]
        
        stats.value = basico.map((s, i) => ({
            ...s,
            colorHex: colors[i % colors.length].main,
            badgeBg: colors[i % colors.length].badgeBg,
            badgeColor: colors[i % colors.length].badgeText
        }))
        
        rankingEfu.value = data.rankingEfu || []
        concursos.value = data.concursos || []
        gestionData.value = data.gestion || {}
    } catch (error) {
        console.error('Error al cargar métricas:', error)
    } finally {
        loading.value = false
    }
}

let refreshInterval = null

onMounted(() => {
    cargarEstadisticas()
    // Auto-actualizar cada 15 segundos en el dashboard interno
    refreshInterval = setInterval(cargarEstadisticas, 15000)
})

onUnmounted(() => {
    if (refreshInterval) clearInterval(refreshInterval)
})
</script>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: #f1f5f9;
  border-radius: 10px;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 10px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}

/* Animations */
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
.animate-in {
  animation: fadeIn 0.6s ease-out forwards;
}
</style>
