<template>
  <v-layout class="andean-pattern font-display text-slate-800 min-h-screen relative w-full overflow-hidden">
    <!-- Sidebar -->
    <v-navigation-drawer
      v-model="drawer"
      border="none"
      permanent
      color="white"
      class="border-r border-slate-200 hidden lg:block"
      width="288"
      v-if="isDesktop"
    >
      <div class="p-6 flex items-center gap-3">
        <div class="bg-primary size-10 rounded-lg flex items-center justify-center text-white border-2 border-primary shadow-[2px_2px_0px_0px_rgba(200,16,46,1)]">
          <span class="material-symbols-outlined">account_balance</span>
        </div>
        <div>
           <h1 class="text-primary font-black leading-tight">ENTRADA UMSA</h1>
          <p class="text-secondary text-[10px] uppercase tracking-wider font-bold">Jurado Calificador</p>
        </div>
      </div>
      
      <v-list nav class="px-4 mt-2">
        <v-list-item class="mb-2 text-slate-500 hover:text-primary hover:bg-slate-50 rounded-lg px-4 border border-transparent hover:border-slate-200" rounded="lg">
          <template v-slot:prepend>
             <span class="material-symbols-outlined mr-3 text-slate-400">dashboard</span>
          </template>
          <v-list-item-title class="font-medium">Dashboard</v-list-item-title>
        </v-list-item>
        
        <v-list-item class="mb-2 bg-slate-50 text-primary border-l-4 border-l-secondary rounded-lg px-4 font-bold" rounded="lg" active>
          <template v-slot:prepend>
             <span class="material-symbols-outlined mr-3 text-secondary">assignment_turned_in</span>
          </template>
          <v-list-item-title class="font-bold">Evaluaciones</v-list-item-title>
        </v-list-item>
        
        <v-list-item class="mb-2 text-slate-500 hover:text-primary hover:bg-slate-50 rounded-lg px-4" rounded="lg">
          <template v-slot:prepend>
             <span class="material-symbols-outlined mr-3 text-slate-400">menu_book</span>
          </template>
          <v-list-item-title class="font-medium">Reglamento</v-list-item-title>
        </v-list-item>
        
        <v-list-item class="mb-2 text-slate-500 hover:text-primary hover:bg-slate-50 rounded-lg px-4" rounded="lg">
          <template v-slot:prepend>
             <span class="material-symbols-outlined mr-3 text-slate-400">analytics</span>
          </template>
          <v-list-item-title class="font-medium">Estadísticas</v-list-item-title>
        </v-list-item>
      </v-list>

      <div class="px-8 py-2 mt-2">
        <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Configuración</p>
      </div>

      <v-list nav class="px-4">
        <v-list-item class="mb-2 text-slate-500 hover:text-primary hover:bg-slate-50 rounded-lg px-4" rounded="lg">
          <template v-slot:prepend>
             <span class="material-symbols-outlined mr-3 text-slate-400">settings</span>
          </template>
          <v-list-item-title class="font-medium">Ajustes</v-list-item-title>
        </v-list-item>

        <v-list-item class="mb-2 text-slate-500 hover:text-secondary hover:bg-red-50 rounded-lg px-4" rounded="lg">
          <template v-slot:prepend>
             <span class="material-symbols-outlined mr-3 text-slate-400">logout</span>
          </template>
          <v-list-item-title class="font-medium">Cerrar sesión</v-list-item-title>
        </v-list-item>
      </v-list>

      <template v-slot:append>
        <div class="p-6">
          <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-[2px_2px_0px_0px_#e2e8f0]">
            <div class="flex items-center gap-3 mb-3">
              <img alt="Avatar" class="size-10 rounded-full border-2 border-secondary" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBNMuwPMtYdQW1ru2UC_VjRVaNNfaPkd01NVLXHCWmqKoWP5byTMp1RqCn81LX9g_pqHukWA4YN4a6QHVubLa5AnQLFNn-vzJbk1GSMnTowqTUrkaKxDQCGIwEiJds09pU203xjHBMSvDN-Lm6H9OVzKm8U9hYpkFMGp5r3saekKqCcFviWJcGHyYqRHFLi2A45O11F__nAthlYbTkgxliS9zxjdEQldVHWAVVnS-CtTz2jXdL7zuBeIvKS05eK1aeLa_S21OMBniM" />
              <div>
                <p class="text-sm font-bold text-primary">Dr. Arancibia</p>
                <p class="text-[10px] text-slate-500">ID: #44920</p>
              </div>
            </div>
            <v-progress-linear model-value="65" color="secondary" height="6" rounded class="bg-slate-100"></v-progress-linear>
            <p class="text-[10px] text-slate-500 mt-2 text-right font-bold">65% Completado</p>
          </div>
        </div>
      </template>
    </v-navigation-drawer>

    <!-- Drawer mobile -->
    <v-navigation-drawer v-model="drawer" temporary class="bg-white border-slate-200 z-50">
       <div class="p-6 flex items-center gap-3 border-b border-slate-100 mb-2">
          <h1 class="text-slate-900 font-bold leading-tight">Entrada UMSA</h1>
       </div>
       <v-list nav class="px-2">
        <v-list-item class="mb-1 text-white bg-primary"> <v-list-item-title>Evaluaciones</v-list-item-title> </v-list-item>
       </v-list>
    </v-navigation-drawer>

    <!-- Main Content -->
    <v-main class="flex-1 flex flex-col min-w-0 bg-transparent min-h-screen">
      <!-- Top Bar -->
      <v-app-bar color="rgba(255, 255, 255, 0.95)" elevation="0" class="border-b border-slate-200" height="64" absolute>
        <div class="d-flex align-center justify-space-between w-100 px-4 md:px-8">
            <div class="flex items-center gap-4">
              <button @click.stop="drawer = !drawer" class="lg:hidden text-slate-700 d-flex align-center justify-center">
                <span class="material-symbols-outlined">menu</span>
              </button>
              <h2 class="text-primary font-black tracking-tight text-lg sm:text-lg">
                <span class="text-secondary bg-secondary/10 px-2 py-0.5 rounded-md mr-1">Evaluación</span>
                Entrada Universitaria
              </h2>
            </div>
            
            <div class="flex items-center gap-4 hidden sm:flex">
              <button class="size-10 rounded-lg flex items-center justify-center text-slate-500 hover:text-primary transition-colors">
                <span class="material-symbols-outlined text-[20px]">search</span>
              </button>
              <button class="bg-white border border-slate-200 size-10 rounded-lg flex items-center justify-center text-slate-500 hover:text-secondary transition-colors relative">
                <span class="material-symbols-outlined text-[20px]">notifications</span>
                <span class="absolute top-2 right-2 size-2 bg-secondary rounded-full border-2 border-white"></span>
              </button>
              <div class="h-8 w-px bg-slate-200 mx-2"></div>
              <div class="flex items-center gap-3 px-4 py-2 bg-white rounded-lg border border-slate-200 shadow-sm">
                <span class="material-symbols-outlined text-secondary text-[20px]">timer</span>
                <span class="text-sm font-black text-slate-700 tracking-wider">14:23:05</span>
              </div>
            </div>
        </div>
      </v-app-bar>

      <!-- Content Body -->
      <v-container class="px-6 py-10 md:px-12 md:py-12 max-w-7xl mx-auto w-full">
        <div class="mb-10 text-left">
          <div class="d-flex align-center gap-2 mb-2">
            <span class="h-1 w-8 bg-secondary"></span>
            <h3 class="text-3xl lg:text-4xl font-black text-primary tracking-tight">Selección de Fase</h3>
          </div>
          <p class="text-slate-500 text-sm font-medium">Habilite el proceso de calificación seleccionando la fase correspondiente del recorrido.</p>
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
              :style="{ 'transform': fase.activo ? 'translateY(-2px)' : 'none', 'z-index': fase.activo ? '10' : '1' }"
            >
              <div class="relative h-64 overflow-hidden w-full shrink-0 border-b-4" :class="fase.activo ? 'border-b-secondary' : 'border-b-slate-200'">
                <div class="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-110"
                  :style="{ backgroundImage: `url(${fase.imagen})` }">
                </div>
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
                <div class="mb-4 text-left">
                  <h4 class="text-xl font-black text-primary mb-2">{{ fase.titulo }}</h4>
                  <p class="text-sm text-slate-500 leading-relaxed">{{ fase.descripcion }}</p>
                </div>
                <div class="mt-auto pt-6 border-t border-slate-100 w-full">
                  <v-btn
                    block
                    rounded="lg"
                    :class="fase.activo ? 'bg-primary text-white border-2 border-primary shadow-[0_4px_15px_rgba(0,74,153,0.3)]' : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-300'"
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
        <v-card class="mt-12 bg-white rounded-xl p-8 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] relative overflow-hidden text-left" color="white" elevation="0">
          <div class="absolute top-0 right-0 w-64 h-64 bg-slate-50 rounded-full blur-3xl -mr-32 -mt-32"></div>
          <h4 class="text-primary text-lg font-black mb-6 relative z-10 w-full uppercase tracking-wide d-flex align-center gap-2">
            <span class="material-symbols-outlined text-secondary">bar_chart</span>
            Resumen de Progreso
          </h4>
          <v-row class="relative z-10">
            <v-col cols="12" sm="6" md="3">
              <v-card class="bg-white pa-4 rounded-lg border border-slate-200 text-left shadow-none" color="transparent" elevation="0">
                <p class="text-secondary text-[10px] font-black uppercase tracking-widest mb-1">Fraternidades</p>
                <p class="text-3xl font-black text-primary m-0">42<span class="text-sm text-slate-400 font-bold">/68</span></p>
                <v-progress-linear model-value="61" color="secondary" height="4" rounded class="mt-2 bg-slate-100"></v-progress-linear>
              </v-card>
            </v-col>
            <v-col cols="12" sm="6" md="3">
              <v-card class="bg-white pa-4 rounded-lg border border-slate-200 text-left shadow-none" color="transparent" elevation="0">
                <p class="text-secondary text-[10px] font-black uppercase tracking-widest mb-1">Evaluaciones</p>
                <p class="text-3xl font-black text-primary m-0">126</p>
              </v-card>
            </v-col>
            <v-col cols="12" sm="6" md="3">
              <v-card class="bg-white pa-4 rounded-lg border border-slate-200 text-left shadow-none" color="transparent" elevation="0">
                <p class="text-secondary text-[10px] font-black uppercase tracking-widest mb-1">Tiempo Promedio</p>
                <p class="text-3xl font-black text-primary m-0">8:45<span class="text-sm text-slate-400 font-bold">m</span></p>
              </v-card>
            </v-col>
            <v-col cols="12" sm="6" md="3">
              <v-card class="bg-white pa-4 rounded-lg border border-slate-200 text-left shadow-none" color="transparent" elevation="0">
                <p class="text-secondary text-[10px] font-black uppercase tracking-widest mb-1">Puntos Emitidos</p>
                <p class="text-3xl font-black text-primary m-0">8,420</p>
              </v-card>
            </v-col>
          </v-row>
        </v-card>
      </v-container>
    </v-main>
  </v-layout>
</template>

<script setup>
import { ref, watchEffect } from 'vue'

const emit = defineEmits(['seleccionar-fase'])
const drawer = ref(false)
const isDesktop = ref(true)

watchEffect(() => {
    // Just a simple heuristic for vuetify without using $vuetify inside script setup directly here to avoid issues if plugin hasn't loaded fully
    if(typeof window !== 'undefined'){
       isDesktop.value = window.innerWidth >= 1024;
    }
})

const fases = ref([
  {
      id: 'entrada',
      titulo: 'Fase 1: Entrada',
      descripcion: 'Evaluación técnica inicial: presentación general, puntualidad, formación y entrada inicial.',
      imagen: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDPSF15yW7YQVn7feTKWr4kF4hHjPBTldojdh6uCXsYGtONmFS4vuoue5zjsxTd9tKrKcojMY73bTwMc1au3fZq6hrwB9-qUCBPSQNu2zImUrhsSXhHQVWu_uCGoqKa4adcgzHAuJLwroQmzSg4NaNPV9W7FgA96V1T0JIfS39qD3ZOWzKEj9qz3s4aAiV_VDsW7M3UlYwCfGzYHtdlNi_RwJEbvzfxIXUMv3qg_1r0voO4dbe6aGDXhYJ1Itj01ZtNJpGnE8wmIsY',
      activo: false
  },
  {
      id: 'monografia',
      titulo: 'Fase 2: Monografía',
      descripcion: 'Calificación de la monografía presentada, fundamentación histórica, investigación y aportes culturales.',
      imagen: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC0ty1HlDkoVlMt_wQzLOzUythD-ARFSd672Qw0mRnQL-lxdUP5ZQnWSKA8HbiSIOnZJxE4rJvCL7tMnAtGXW3D7-WJ75wY0RsWBD5fGcf3wlx_gjBvMkbexNlrXMfgNUSdv9Pp2KaFFu9oR4FkWVtQ576E3VxUAC_qf6pz5CJzoybSpAXvP4zIrHJr7ZM0sKGIjdclOtOTJLUHggX9K8oz4XCTZQEJ7ueLyekpCRziDM5roOdwqXSi64dV0sphbzjkPBk-6dPz2zg',
      activo: true
  },
  {
      id: 'disciplina',
      titulo: 'Fase 3: Disciplina',
      descripcion: 'Comportamiento de la fraternidad, organización durante el recorrido y cumplimiento del reglamento.',
      imagen: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBwrXqPyWcIGrQZGEtyrVyCVy1Gy_g_J0o7srEy7KWaSqHI1rHaMchLcskEgT71yVqiHnjFKQsfp4qFki6janJikZ6tOmvNQpJjMF_KVniWiLTonuP1pLzG-HnFfxYUyVt1x49hssxQUFAhDQiaat8HcqDaOfU5d3GOC4wjvE6LSAvu0vVT62WEWCFvgnOS9-6eMtfgPhMumtxTBjnAwQcbnbA4HVnfaogs7Raoq4j-m3jZRDXdwKp-R7YGIwFmvuK_TtqiNpFhexw',
      activo: false
  }
])

const evaluar = (fase) => {
  emit('seleccionar-fase', fase.id)
}
</script>

<style scoped>
.andean-pattern {
    background-color: #fff;
    background-image: linear-gradient(rgba(255, 255, 255, 0.75), rgba(255, 255, 255, 0.75)), url('@/assets/img/Textura-Andina.png');
    background-repeat: repeat;
    background-size: 500px;
    background-attachment: fixed;
}
</style>
