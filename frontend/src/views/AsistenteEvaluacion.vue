<template>
  <v-layout class="andean-pattern font-display text-slate-800 antialiased min-h-screen">
    <!-- Navigation App Bar using Vuetify -->
    <v-app-bar color="rgba(255, 255, 255, 0.8)" class="backdrop-blur-md border-b border-slate-200" elevation="0" absolute>
      <div class="d-flex align-center justify-space-between w-100 px-4">
        <div class="d-flex align-center gap-4">
          <v-btn icon @click="$emit('volver')" variant="flat" color="transparent" class="hover:bg-slate-100 border border-slate-200 mr-2" size="small">
            <span class="material-symbols-outlined text-slate-600">arrow_back</span>
          </v-btn>
          <div class="text-secondary hidden sm:flex align-center">
            <span class="material-symbols-outlined text-3xl">auto_fix_high</span>
          </div>
          <div class="d-flex flex-column text-left">
             <h2 class="text-primary text-lg font-bold leading-tight tracking-tight mb-0">
                Ev<span class="text-primary">alu</span><span class="text-secondary">a</span><span class="text-primary">ción</span> Wizard
             </h2>
            <p class="text-slate-500 text-xs uppercase tracking-widest font-semibold hidden sm:block mb-0 mt-1">Entrada UMSA • Jurado 04 - {{ faseSeleccionada.toUpperCase() }}</p>
          </div>
        </div>
        
        <div class="d-flex align-center gap-3">
          <button class="flex items-center justify-center rounded-lg h-10 w-10 bg-slate-50 text-slate-600 hover:bg-slate-100 transition-colors border border-slate-200">
            <span class="material-symbols-outlined text-[20px] text-secondary">notifications</span>
          </button>
          <button class="flex items-center justify-center rounded-lg h-10 px-4 bg-white text-primary gap-2 text-sm font-bold hover:bg-slate-50 transition-colors border border-primary/30">
            <span class="material-symbols-outlined text-[20px] text-secondary">account_circle</span>
            <span class="hidden md:inline">Perfil Jurado</span>
          </button>
        </div>
      </div>
    </v-app-bar>
    
    <v-main class="flex-1 d-flex flex-column align-center w-full bg-transparent px-4 py-8 mt-4">
        <v-container class="max-w-6xl w-full pt-10 px-0">
            <!-- Progress Bar Section -->
            <div class="w-full mb-8">
                <div class="d-flex justify-space-between align-end mb-3 px-2">
                    <div class="text-left">
                        <span class="text-secondary font-bold text-xs uppercase tracking-widest d-block border-l-2 border-secondary pl-2">Progreso de Calificación</span>
                        <h3 class="text-2xl font-black text-primary mt-1">Paso {{ currentIndex + 1 }}: {{ criterioActual.tituloCorto }}</h3>
                    </div>
                    <div class="text-right">
                        <span class="text-slate-500 text-xs font-bold uppercase d-block">Criterio {{ currentIndex + 1 }} de {{ criterios.length }}</span>
                        <p class="text-primary font-black text-xl mt-1">
                          {{ progresoPorcentaje }}%<span class="d-inline-block w-1.5 h-1.5 rounded-full bg-secondary ml-1 align-middle"></span>
                        </p>
                    </div>
                </div>
                <v-progress-linear
                  v-model="progresoPorcentaje"
                  color="primary"
                  bg-color="rgba(0,0,0,0.05)"
                  height="12"
                  rounded
                  class="shadow-sm"
                ></v-progress-linear>
            </div>

            <!-- Wizard Slider Container -->
            <v-row>
                <!-- Main Content Card -->
                <v-col cols="12" lg="8" class="d-flex flex-column">
                    <v-card class="flex-grow-1 d-flex flex-column bg-white rounded-xl overflow-hidden shadow-sm relative border-t-4 border-t-primary border-l border-r border-b border-slate-200" color="white" elevation="0">
                        <transition name="fade" mode="out-in">
                            <div :key="currentIndex" class="d-flex flex-column flex-grow-1 w-full h-full">
                                <div class="aspect-video relative w-full overflow-hidden shrink-0 bg-black">
                                    <div class="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent z-10"></div>
                                    <div class="absolute top-4 left-4 z-20 bg-secondary px-3 py-1 rounded-sm text-[10px] font-black uppercase tracking-widest text-white shadow-lg">En Evaluación</div>
                                    <div class="w-full h-full bg-cover bg-center transition-transform duration-700 hover:scale-105"
                                        :style="{ backgroundImage: `url(${criterioActual.imagen})` }">
                                    </div>
                                </div>
                                
                                <v-card-text class="pa-6 pa-md-8 d-flex flex-column flex-grow-1 text-left bg-white opacity-100">
                                    <div class="mb-6">
                                        <div class="d-flex align-center gap-2 mb-2">
                                            <span class="h-px w-8 bg-secondary"></span>
                                            <h4 class="text-xl font-black text-primary">{{ criterioActual.titulo }}</h4>
                                        </div>
                                        <p class="text-slate-500 text-sm leading-relaxed">{{ criterioActual.descripcion }}</p>
                                    </div>
                                    
                                    <div class="mt-auto pt-4 child-spacing">
                                        <!-- Score Control Section via Vuetify -->
                                        <v-sheet class="bg-slate-50 pa-6 rounded-xl border border-slate-200" color="transparent">
                                            <div class="d-flex justify-space-between align-center mb-6 flex-wrap gap-4">
                                                <label class="text-primary font-bold text-sm d-flex align-center gap-2 uppercase tracking-wide">
                                                    <span class="material-symbols-outlined text-secondary text-[20px]">analytics</span>
                                                    Puntaje del Criterio
                                                </label>
                                                <div class="d-flex align-center gap-3">
                                                    <input
                                                        v-model.number="criterios[currentIndex].puntaje"
                                                        class="w-20 bg-white border border-slate-300 text-primary font-black text-center rounded-lg py-2 focus:ring-primary focus:border-primary"
                                                        max="100" min="0" type="number" />
                                                    <span class="text-slate-400 font-bold text-sm">/ 100</span>
                                                </div>
                                            </div>
                                            
                                            <v-slider
                                                v-model="criterios[currentIndex].puntaje"
                                                color="primary"
                                                track-color="rgba(0,0,0,0.05)"
                                                min="0"
                                                max="100"
                                                step="1"
                                                hide-details
                                                class="mt-2 text-slate-600 u-glow-slider"
                                            >
                                                <template v-slot:prepend>
                                                    <span class="text-xs font-bold text-slate-400 mr-2">0</span>
                                                </template>
                                                <template v-slot:append>
                                                    <span class="text-xs font-bold text-slate-400 ml-2">100</span>
                                                </template>
                                            </v-slider>
                                        </v-sheet>
                                        
                                        <!-- Navigation Buttons -->
                                        <div class="d-flex align-center justify-space-between mt-8 gap-4 flex-wrap sm:flex-nowrap">
                                            <button 
                                                @click="pasoAnterior"
                                                :disabled="currentIndex === 0"
                                                class="d-flex align-center justify-center gap-2 px-6 py-3 rounded-lg bg-white text-slate-600 font-bold text-sm hover:bg-slate-50 transition-all border border-slate-200 flex-1 sm:flex-none disabled:opacity-50"
                                                style="height: 52px;"
                                            >
                                                <span class="material-symbols-outlined text-[20px]">arrow_back</span>
                                                <span class="hidden sm:inline">{{ currentIndex > 0 ? 'Anterior' : 'Anterior' }}</span>
                                            </button>
                                            
                                            <button 
                                                @click="pasoSiguiente"
                                                class="flex-1 d-flex align-center justify-center gap-2 px-6 py-3 rounded-lg bg-primary text-white font-bold text-sm hover:brightness-110 shadow-[0_4px_15px_rgba(0,74,153,0.2)] transition-all border border-blue-900"
                                                style="height: 52px;"
                                            >
                                                {{ isUltimoPaso ? 'Finalizar Evaluación' : 'Siguiente Criterio' }}
                                                <span class="material-symbols-outlined text-[20px]">{{ isUltimoPaso ? 'check_circle' : 'arrow_forward' }}</span>
                                            </button>
                                        </div>
                                    </div>
                                </v-card-text>
                            </div>
                        </transition>
                    </v-card>
                </v-col>

                <!-- Sidebar / Next Step Preview & Stats -->
                <v-col cols="12" lg="4" class="d-flex flex-column gap-6">
                    <!-- Mini Card: Preview Next Step -->
                    <!-- Mini Card: Preview Next Step -->
                    <v-card v-if="criterioSiguiente" @click="pasoSiguiente"
                        class="bg-white border-dashed border-2 border-slate-200 rounded-xl pa-5 d-flex flex-column opacity-80 hover:opacity-100 transition-all cursor-pointer group"
                        color="white" elevation="0"
                    >
                        <div class="d-flex align-center gap-3 mb-4">
                            <div class="size-10 rounded-lg bg-slate-50 d-flex align-center justify-center text-slate-400 group-hover:text-secondary transition-colors border border-slate-100">
                                <span class="material-symbols-outlined">{{ criterioSiguiente.icono }}</span>
                            </div>
                            <div class="text-left">
                                <p class="text-[9px] text-secondary font-black uppercase tracking-widest mb-0">Siguiente Paso</p>
                                <p class="text-primary font-bold text-sm mb-0">Paso {{ currentIndex + 2 }}: {{ criterioSiguiente.tituloCorto }}</p>
                            </div>
                        </div>
                        <div class="aspect-video rounded-lg overflow-hidden border border-slate-200 relative w-full grayscale group-hover:grayscale-0 transition-all">
                            <div class="w-full h-full bg-cover bg-center" :style="{ backgroundImage: `url(${criterioSiguiente.imagen})` }"></div>
                        </div>
                    </v-card>
                    
                    <v-card v-else class="bg-slate-50 border-dashed border-2 border-slate-200 rounded-xl pa-5 d-flex flex-column align-center justify-center text-center min-h-[220px]" color="transparent" elevation="0">
                        <span class="material-symbols-outlined text-4xl text-emerald-500 mb-2">task_alt</span>
                        <p class="text-primary font-bold mb-0">Último Criterio</p>
                        <p class="text-xs text-slate-500 mt-1 mb-0">Revise antes de finalizar</p>
                    </v-card>

                    <!-- Score Summary Widget -->
                    <div class="bg-white border-2 border-black rounded-xl p-6 flex-1 flex flex-col justify-center items-center text-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] relative overflow-hidden h-full min-h-[160px]">
                        <div class="absolute -top-4 -right-4 size-24 bg-slate-50 rounded-full"></div>
                        <div class="size-14 rounded-full bg-secondary flex items-center justify-center text-white mb-4 shadow-lg border-2 border-white relative z-10">
                            <span class="material-symbols-outlined text-3xl">workspace_premium</span>
                        </div>
                        <h5 class="text-slate-500 font-black mb-1 uppercase text-[10px] tracking-[0.2em] relative z-10">Promedio Actual</h5>
                        <p class="text-6xl font-black text-primary mb-3 relative z-10">{{ Math.floor(promedioActual) }}<span class="text-secondary">.</span>{{ (promedioActual % 1 * 10).toFixed(0) }}</p>
                        <div class="inline-flex items-center px-4 py-1 rounded-full bg-primary text-white text-[9px] font-black uppercase tracking-widest relative z-10">
                            {{ promedioActual > 80 ? 'Calificación Alta' : (promedioActual > 50 ? 'Calificación Media' : 'Calificación Baja') }}
                        </div>
                    </div>
                    
                    <!-- Quick Notes -->
                    <div class="bg-white border-l-4 border-l-secondary rounded-xl p-5 text-left border-y border-r border-slate-200 shadow-sm">
                        <label class="d-flex align-center gap-2 text-primary text-xs font-black mb-3 uppercase tracking-widest">
                            <span class="material-symbols-outlined text-lg text-secondary">edit_note</span>
                            Observaciones Rápidas
                        </label>
                        <textarea
                            v-model="criterios[currentIndex].observacion"
                            class="w-full bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:ring-primary focus:border-primary min-h-[100px] placeholder:text-slate-400 p-3"
                            :placeholder="`Escriba aquí sus comentarios sobre ${criterioActual.tituloCorto.toLowerCase()}...`"
                        ></textarea>
                    </div>
                </v-col>
            </v-row>
            
            <!-- Footer Info -->
            <div class="mt-8 mb-4 w-full text-slate-500 text-[9px] uppercase font-black tracking-[0.15em] d-flex flex-column flex-md-row align-center justify-center gap-4 md:gap-12 pb-8">
                <div class="d-flex align-center gap-2 hover:text-secondary transition-colors cursor-default">
                    <span class="material-symbols-outlined text-sm text-secondary">verified_user</span>
                    Sesión segura: Jurado #UMSA-2024-X
                </div>
                <div class="d-flex align-center gap-2 hover:text-primary transition-colors cursor-default">
                    <span class="material-symbols-outlined text-sm text-primary">schedule</span>
                    Tiempo restante: 12:45 min
                </div>
                <div class="d-flex align-center gap-2 text-green-600">
                    <span class="material-symbols-outlined text-sm">cloud_done</span>
                    Guardado automático activado
                </div>
            </div>
        </v-container>
    </v-main>

    <!-- Modal de Confirmación Final -->
    <v-dialog v-model="mostrarModalFinal" max-width="500" persistent>
      <v-card class="bg-white border border-slate-200 rounded-xl text-slate-900 shadow-2xl">
        <v-card-title class="text-xl font-bold border-b border-slate-100 pa-6 d-flex align-center gap-3">
          <span class="material-symbols-outlined text-primary text-3xl">fact_check</span>
          Confirmar Calificación
        </v-card-title>
        
        <v-card-text class="pa-6">
          <p class="text-slate-500 mb-6">Ha completado la evaluación de la fase. Por favor, revise las notas asignadas a cada criterio antes de enviar definitivamente los resultados al servidor:</p>
          
          <v-list bg-color="transparent" class="pa-0 border border-slate-100 rounded-lg overflow-hidden">
            <v-list-item v-for="(criterio, index) in criterios" :key="index" class="border-b border-slate-100 pa-4 bg-slate-50">
              <template v-slot:prepend>
                <v-avatar color="primary" variant="tonal" size="36" class="mr-4 font-bold text-primary">
                  {{ index + 1 }}
                </v-avatar>
              </template>
              <v-list-item-title class="font-bold text-slate-800">{{ criterio.tituloCorto }}</v-list-item-title>
              <template v-slot:append>
                <span class="font-black text-lg text-primary">
                  {{ criterio.puntaje }}<span class="text-xs text-slate-400 ml-1">/100</span>
                </span>
              </template>
            </v-list-item>
          </v-list>
          
          <div class="mt-6 d-flex align-center justify-space-between bg-primary/5 pa-4 rounded-lg border border-primary/20 relative overflow-hidden">
            <div class="absolute top-0 right-0 w-32 h-32 bg-primary/10 blur-xl rounded-full -mr-16 -mt-16"></div>
            <span class="font-bold text-slate-500 uppercase tracking-widest text-sm relative z-10">Promedio Final</span>
            <span class="font-black text-3xl text-primary relative z-10">{{ promedioActual.toFixed(1) }}</span>
          </div>
        </v-card-text>
        
        <v-card-actions class="pa-6 pt-0 d-flex gap-4">
          <v-btn
            variant="outlined"
            color="slate-600"
            class="flex-1 rounded-lg text-none font-weight-bold border-slate-200"
            height="48"
            @click="mostrarModalFinal = false"
          >
            Revisar
          </v-btn>
          <v-btn
            class="flex-1 bg-primary text-white rounded-lg text-none font-weight-bold shadow-lg shadow-primary/20"
            height="48"
            elevation="0"
            @click="confirmarFinalizar"
          >
            Confirmar y Enviar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-layout>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  faseSeleccionada: {
      type: String,
      default: 'entrada'
  }
})

const emit = defineEmits(['volver', 'finalizar'])

const criterios = ref([
  {
      id: 1,
      tituloCorto: 'Vestimenta',
      titulo: 'Evaluación de Indumentaria Tradicional',
      descripcion: 'Analice la autenticidad de los tejidos, la complejidad de los bordados y la fidelidad histórica del traje típico de la fraternidad. Considere el uso de accesorios y la uniformidad del bloque.',
      imagen: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDEhLuv-4xnk7qdF5-khUYBCEvOTYCYxOuKfJ6vPk-QiIKHFR3eL_FyNoytKMXE468KcZ3R5-RT5NVwP9r3x5jOoQz6aXM-nabsQW_dp6tMvMc5qyRWnexuqhfG--Gsx-jzORI3VpW2XlfjGaoeduRelnWzLAH3S34n4MACPl5ctIlwLjt9QYYuys3K4EHQ-l0jlyNcfur-I3wbBU1qm_WswvV5R8wxeuojVW1FNf90zUl1o1QgnSEx5ELg7n2RKjqH0aKgCvm_NyA',
      icono: 'apparel',
      puntaje: 85,
      observacion: ''
  },
  {
      id: 2,
      tituloCorto: 'Coreografía',
      titulo: 'Evaluación de Coreografía y Desplazamiento',
      descripcion: 'Evalúe la coordinación, el dominio de pasos, la complejidad de las figuras y la sincronía del bloque durante el recorrido. Considere la energía y la ocupación del espacio escénico.',
      imagen: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDde-XodLO9Z5qEUe1VOTZTikN-Cs2rBjFa3p4CtpnF1WmwUhvXOD18hzmQlAYQ-73fudtDGDaf3IxygxooW2oSuSjHtaBvDN_jsJb4ybxUK2pBySNhFbPQqDaS0mo-1OH-C7epOj7vCH9YI11lhxpIvEWylqbx32AdQyGmi1T-cKk87NDJ7BxOVVvpINAre8mffr3FF4M9_ZQWHMfIXFE-_ggSUhQyFIW4Gy11VyXFKmRnafRGO_kgshW4dOIHbScBje2btCIJVqo',
      icono: 'directions_run',
      puntaje: 75,
      observacion: ''
  },
  {
      id: 3,
      tituloCorto: 'Música',
      titulo: 'Evaluación de Ejecución Musical',
      descripcion: 'Ritmo, armonía, repertorio tradicional y desempeño general de la banda o grupo autóctono que acompaña a la fraternidad.',
      imagen: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBN4R1jgU1rT0O6bb4CUV33YEz8NfpbS2NZcJ0x5WdFSsYp0DNDfJM3SJ9VAhH-KffLn0rogAas5AaFVtAIxXt4HnqBMLuz442e2aNshqQ6pvq_nRWKvWads88h_s-a1FoK7Tkn3cG1-UE0VcersvjFOgQeWzwbY_5-Vj_zWxKe-f0t0FvvYxcAryMSURWbwiyQSye3yOXVvET9LGvFW30j_szuCRfnKLyC2tWh9t-AT2Q9L4k-ToDSLDnsQJo-uL5KF0oChCgVls0',
      icono: 'music_note',
      puntaje: 80,
      observacion: ''
  }
])

const currentIndex = ref(0)
const criterioActual = computed(() => criterios.value[currentIndex.value])
const isUltimoPaso = computed(() => currentIndex.value === criterios.value.length - 1)
const criterioSiguiente = computed(() => isUltimoPaso.value ? null : criterios.value[currentIndex.value + 1])
const progresoPorcentaje = computed(() => {
  return Math.round(((currentIndex.value + 1) / criterios.value.length) * 100)
})

const promedioActual = computed(() => {
  const sum = criterios.value.reduce((acc, curr) => acc + Number(curr.puntaje), 0)
  return sum / criterios.value.length
})

const mostrarModalFinal = ref(false)

const pasoSiguiente = () => {
  if (isUltimoPaso.value) {
      mostrarModalFinal.value = true
  } else {
      currentIndex.value++
  }
}

const confirmarFinalizar = () => {
    mostrarModalFinal.value = false
    emit('finalizar', {
        criterios: criterios.value,
        promedio: promedioActual.value
    })
}

const pasoAnterior = () => {
  if (currentIndex.value > 0) {
      currentIndex.value--
  }
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

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.fade-enter-from {
  opacity: 0;
  transform: translateX(20px);
}

.fade-leave-to {
  opacity: 0;
  transform: translateX(-20px);
}

.child-spacing > * + * {
    margin-top: 2rem;
}

:deep(.custom-textarea .v-field) {
    box-shadow: none !important;
    border: 1px solid rgba(0,0,0,0.05); border-radius: 8px;
}

:deep(.custom-textarea .v-field__input) {
    color: #1e293b !important;
    padding-top: 12px;
}

:deep(.u-glow-slider .v-slider-thumb) {
    border: 3px solid white !important;
    box-shadow: 0 0 10px rgba(0, 74, 153, 0.3) !important;
}
</style>
