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
          <span>Gestión 2024</span>
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

    <!-- Stats Grid -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <div v-for="stat in stats" :key="stat.label"
        class="bg-white p-6 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow">
        <div class="absolute -right-4 -top-4 size-24 rounded-full group-hover:scale-110 transition-transform" :class="stat.bg"></div>
        <p class="text-xs font-black text-slate-500 uppercase tracking-widest mb-2">{{ stat.label }}</p>
        <div class="flex items-baseline gap-2">
          <span class="text-4xl font-black text-slate-900">{{ stat.valor }}</span>
          <span class="text-xs font-bold px-2 py-0.5 rounded-full" :class="stat.badgeClass">{{ stat.badge }}</span>
        </div>
        <v-progress-linear v-if="stat.progreso" :model-value="stat.progreso" color="secondary" height="4" rounded class="mt-3 bg-slate-100"></v-progress-linear>
      </div>
    </div>

    <!-- Charts and Ranking Section -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
      <!-- Bar Chart -->
      <div class="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-200 shadow-sm border-t-4 border-t-primary">
        <div class="flex justify-between items-center mb-6">
          <h3 class="text-lg font-black text-primary flex items-center gap-2">
            <span class="material-symbols-outlined text-secondary">bar_chart</span>
            Puntajes más Altos — Comparativo
          </h3>
        </div>
        <div class="h-56 flex items-end justify-between gap-3 px-2 border-b border-slate-100 pb-2">
          <div v-for="item in ranking" :key="item.nombre" class="flex flex-col items-center gap-2 flex-1">
            <div class="w-full bg-slate-100 rounded-t-lg relative h-full flex flex-col justify-end overflow-hidden">
              <span class="absolute -top-6 left-1/2 -translate-x-1/2 font-black text-xs text-primary">{{ item.puntaje }}</span>
              <div
                class="w-full rounded-t-lg transition-all duration-700"
                :class="item.color"
                :style="{ height: item.puntaje + '%' }"
              ></div>
            </div>
            <span class="text-[9px] font-bold text-slate-500 uppercase text-center leading-tight">{{ item.nombre }}</span>
          </div>
        </div>
      </div>

      <!-- Top List -->
      <div class="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <h3 class="text-lg font-black text-primary mb-5 flex items-center justify-between">
          Top 5 Fraternidades
          <span class="material-symbols-outlined text-secondary">emoji_events</span>
        </h3>
        <div class="space-y-2">
          <div
            v-for="(item, i) in ranking.slice(0, 5)"
            :key="item.nombre"
            class="flex items-center justify-between p-3 rounded-lg border transition-colors"
            :class="i === 0 ? 'bg-primary/5 border-primary/10' : 'bg-white border-slate-100 hover:bg-slate-50'"
          >
            <div class="flex items-center gap-3">
              <span
                class="size-6 flex items-center justify-center text-xs font-black rounded-full"
                :class="i === 0 ? 'bg-primary text-white' : 'bg-slate-100 text-slate-500'"
              >{{ i + 1 }}</span>
              <div>
                <p class="text-sm font-bold text-slate-900 truncate max-w-[100px]">{{ item.nombre }}</p>
                <p class="text-[9px] text-slate-500 uppercase font-bold">{{ item.tipo }}</p>
              </div>
            </div>
            <span class="font-black" :class="i === 0 ? 'text-primary text-lg' : 'text-slate-700'">{{ item.puntaje }}</span>
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
          <p class="text-4xl font-black text-primary">2024</p>
          <p class="text-[10px] uppercase font-black text-slate-400">Gestión</p>
        </div>
        <div class="w-px h-12 bg-slate-200"></div>
        <div class="text-center">
          <p class="text-4xl font-black text-secondary">XXXV</p>
          <p class="text-[10px] uppercase font-black text-slate-400">Edición</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

defineEmits(['ir-calificar'])

const stats = ref([
  { label: 'Total Fraternidades', valor: 65, badge: '100% Registro', bg: 'bg-primary/5', badgeClass: 'text-primary bg-primary/10', progreso: 100 },
  { label: 'Evaluadas', valor: 42, badge: '64.6% Avance', bg: 'bg-emerald-500/5', badgeClass: 'text-emerald-600 bg-emerald-500/10', progreso: 64 },
  { label: 'Pendientes', valor: 23, badge: '35.4% Restante', bg: 'bg-secondary/5', badgeClass: 'text-secondary bg-secondary/10', progreso: 35 },
])

const ranking = ref([
  { nombre: 'Morenada FCU', tipo: 'Danza Pesada', puntaje: 94.5, color: 'bg-primary' },
  { nombre: 'Cullawada Der.', tipo: 'Danza Liviana', puntaje: 89.2, color: 'bg-primary' },
  { nombre: 'Tinkus Wistus', tipo: 'Autóctono', puntaje: 85.0, color: 'bg-secondary' },
  { nombre: 'Diablada Med.', tipo: 'Danza Pesada', puntaje: 82.8, color: 'bg-primary' },
  { nombre: 'Caporales Ing.', tipo: 'Danza Liviana', puntaje: 78.4, color: 'bg-primary' },
])
</script>
