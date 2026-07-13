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
              <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Máximo 7 fraternidades visibles en barras; el resto se ve en Podio EFU</p>
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

        <!-- Podio EFU (vista previa) -->
        <div id="podio-efu" class="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm flex flex-col">
          <div class="flex items-center justify-between mb-8">
            <h3 class="text-lg font-black text-primary uppercase italic tracking-tighter">Podio EFU</h3>
            <span class="size-8 bg-amber-100 rounded-full flex items-center justify-center text-amber-600">
                <span class="material-symbols-outlined text-sm">emoji_events</span>
            </span>
          </div>

          <div v-if="rankingEfu.length > 0" class="space-y-3 flex-1">
            <div
              v-for="(item, i) in rankingEfuPreview"
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

          <p v-if="rankingEfu.length > 7" class="mt-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">
            Mostrando top 7 de {{ rankingEfu.length }} fraternidades
          </p>

          <button
            type="button"
            @click="abrirPodioCompleto"
            :disabled="!rankingEfu.length"
            class="mt-4 py-3 w-full bg-slate-50 border border-slate-200 rounded-xl text-[10px] font-black text-slate-500 uppercase tracking-widest hover:text-primary hover:border-primary disabled:opacity-40 transition-all"
          >
            Ir a Podio EFU
          </button>
        </div>
      </div>

      <div class="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
        <div class="flex items-center justify-between mb-8 gap-4 flex-wrap">
          <div>
            <h3 class="text-lg font-black text-primary uppercase italic tracking-tighter flex items-center gap-2">
              <span class="material-symbols-outlined text-secondary">military_tech</span>
              Concursos Externos - Top 3 por categoría
            </h3>
            <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
              Chacha, Warmi, Fotografía, Diseñador y cualquier concurso externo creado en la gestión
            </p>
          </div>
          <div class="text-[10px] font-black uppercase tracking-widest text-slate-400">
            {{ concursosTop3.length }} concurso(s)
          </div>
        </div>

        <div v-if="concursosTop3.length" class="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <div
            v-for="concurso in concursosTop3"
            :key="concurso.nombreConcurso"
            class="rounded-2xl border border-slate-200 overflow-hidden bg-slate-50/40"
          >
            <div class="px-5 py-4 bg-white border-b border-slate-100">
              <h4 class="text-sm font-black text-slate-800 uppercase tracking-wide">
                {{ concurso.nombreConcurso }}
              </h4>
              <p class="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">
                Mejores 3 concursantes
              </p>
            </div>

            <div class="p-4 space-y-3">
              <div
                v-for="participante in concurso.participantes"
                :key="`${concurso.nombreConcurso}-${participante.puesto}-${participante.nombre}`"
                class="flex items-start justify-between gap-4 rounded-2xl border border-slate-100 bg-white p-4"
              >
                <div class="flex items-start gap-3 min-w-0">
                  <div
                    class="size-8 rounded-xl flex items-center justify-center text-xs font-black shrink-0"
                    :class="participante.puesto === 1 ? 'bg-amber-100 text-amber-700' : participante.puesto === 2 ? 'bg-slate-200 text-slate-700' : 'bg-orange-100 text-orange-700'"
                  >
                    {{ participante.puesto }}
                  </div>
                  <div class="min-w-0">
                    <p class="text-sm font-black text-slate-800 leading-tight break-words">
                      {{ participante.nombre }}
                    </p>
                    <p class="text-[10px] uppercase font-bold text-slate-400 tracking-widest mt-1">
                      {{ participante.tipo }}
                    </p>
                    <p class="text-xs text-slate-500 mt-1 break-words">
                      {{ participante.fraternidad }}
                    </p>
                  </div>
                </div>
                <div class="text-right shrink-0">
                  <p class="text-lg font-black tracking-tighter text-primary">{{ participante.puntajeFinal }}</p>
                  <p class="text-[8px] font-black uppercase tracking-widest text-slate-400">pts</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div v-else class="py-16 text-center text-slate-300 bg-slate-50/50 rounded-2xl border-2 border-dashed border-slate-100">
          <span class="material-symbols-outlined text-5xl mb-3">emoji_events</span>
          <p class="text-[10px] font-black uppercase tracking-[0.2em]">Sin concursos externos calificados aún</p>
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
            <p class="text-slate-400 text-sm leading-relaxed">Este sistema garantiza la transparencia en la calificación de la XXXV Entrada Folklórica Universitaria — Gestión {{ gestionData.anio }}.</p>
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

    <!-- Modal: Podio EFU completo -->
    <v-dialog v-model="mostrarPodioCompleto" max-width="960" scrollable>
      <v-card class="rounded-3xl overflow-hidden">
        <v-card-title class="bg-primary text-white px-6 py-5 flex items-center justify-between gap-4">
          <div>
            <p class="text-[10px] font-black uppercase tracking-[0.25em] opacity-70 mb-1">Ranking oficial</p>
            <h3 class="text-lg font-black uppercase italic tracking-tight">Podio EFU {{ gestionData.anio }}</h3>
          </div>
          <button
            type="button"
            @click="mostrarPodioCompleto = false"
            class="size-10 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
          >
            <span class="material-symbols-outlined">close</span>
          </button>
        </v-card-title>

        <v-card-text class="pa-6 bg-slate-50">
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div class="bg-white rounded-2xl border border-slate-200 p-4">
              <p class="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Fraternidades</p>
              <p class="text-2xl font-black text-primary">{{ rankingEfu.length }}</p>
            </div>
            <div class="bg-white rounded-2xl border border-slate-200 p-4">
              <p class="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Líder actual</p>
              <p class="text-sm font-black text-slate-800 truncate">{{ rankingEfu[0]?.nombre || '—' }}</p>
            </div>
            <div class="bg-white rounded-2xl border border-slate-200 p-4">
              <p class="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Puntaje máximo</p>
              <p class="text-2xl font-black text-secondary">{{ rankingEfu[0]?.puntaje ?? '—' }}</p>
            </div>
          </div>

          <div v-if="rankingEfu.length" class="bg-white rounded-2xl border border-slate-200 overflow-hidden mb-8">
            <div class="px-5 py-4 border-b border-slate-100">
              <h4 class="text-[10px] font-black uppercase tracking-widest text-primary">Clasificación general EFU</h4>
            </div>
            <div class="max-h-[50vh] overflow-y-auto custom-scrollbar">
              <table class="w-full text-left">
                <thead class="sticky top-0 bg-slate-50 z-10">
                  <tr class="border-b border-slate-100">
                    <th class="px-5 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400 w-16">#</th>
                    <th class="px-5 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400">Fraternidad</th>
                    <th class="px-5 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400">Categoría</th>
                    <th class="px-5 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Puntaje</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="(item, i) in rankingEfu"
                    :key="`podio-full-${item.nombre}-${i}`"
                    class="border-b border-slate-50 hover:bg-slate-50/80"
                  >
                    <td class="px-5 py-3">
                      <span
                        class="inline-flex size-8 items-center justify-center rounded-xl text-xs font-black"
                        :class="i === 0 ? 'bg-amber-100 text-amber-700' : i < 3 ? 'bg-secondary text-white' : 'bg-slate-100 text-slate-500'"
                      >
                        {{ i + 1 }}
                      </span>
                    </td>
                    <td class="px-5 py-3 text-sm font-bold text-slate-800">{{ item.nombre }}</td>
                    <td class="px-5 py-3 text-xs font-bold uppercase tracking-wide text-slate-500">{{ item.tipo }}</td>
                    <td class="px-5 py-3 text-right">
                      <span class="text-lg font-black text-primary">{{ item.puntaje }}</span>
                      <span class="text-[9px] font-black text-slate-400 uppercase ml-1">pts</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div v-if="concursosTop3.length" class="space-y-4">
            <h4 class="text-[10px] font-black uppercase tracking-widest text-primary px-1">Concursos externos — Top 3</h4>
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div
                v-for="concurso in concursosTop3"
                :key="`modal-${concurso.nombreConcurso}`"
                class="bg-white rounded-2xl border border-slate-200 overflow-hidden"
              >
                <div class="px-5 py-3 border-b border-slate-100 bg-slate-50">
                  <p class="text-sm font-black text-slate-800">{{ concurso.nombreConcurso }}</p>
                </div>
                <div class="divide-y divide-slate-100">
                  <div
                    v-for="p in concurso.participantes"
                    :key="`${concurso.nombreConcurso}-${p.puesto}`"
                    class="px-5 py-3 flex items-center justify-between gap-3"
                  >
                    <div class="min-w-0">
                      <p class="text-xs font-black text-slate-800">
                        <span class="text-slate-400 mr-2">#{{ p.puesto }}</span>{{ p.nombre }}
                      </p>
                      <p class="text-[10px] text-slate-500 mt-0.5">{{ p.tipo }} · {{ p.fraternidad }}</p>
                    </div>
                    <span class="text-sm font-black text-primary shrink-0">{{ p.puntajeFinal }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div v-else-if="!rankingEfu.length" class="py-16 text-center text-slate-400">
            <span class="material-symbols-outlined text-5xl mb-3">emoji_events</span>
            <p class="text-[10px] font-black uppercase tracking-widest">Aún no hay datos de podio</p>
          </div>
        </v-card-text>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
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
const mostrarPodioCompleto = ref(false)
const rankingBarras = computed(() => rankingEfu.value.slice(0, 7))
const rankingEfuPreview = computed(() => rankingEfu.value.slice(0, 7))
const concursosTop3 = computed(() => concursos.value || [])

const abrirPodioCompleto = () => {
  if (!rankingEfu.value.length) return
  mostrarPodioCompleto.value = true
}

// ApexCharts Configuration
const chartSeries = computed(() => {
  return [{
    name: 'Puntaje',
    data: rankingBarras.value.map(r => r.puntaje)
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
    colors: ['#003399', '#C8102E', '#F1C40F', '#003399', '#C8102E', '#F1C40F', '#003399'],
    dataLabels: {
      enabled: true,
      formatter: (val) => val,
      offsetY: -20,
      style: { fontSize: '12px', fontWeight: '900', colors: ["#304758"] }
    },
    legend: { show: false },
    xaxis: {
      categories: rankingBarras.value.map(r => r.nombre.length > 15 ? r.nombre.substring(0, 12) + '...' : r.nombre),
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
