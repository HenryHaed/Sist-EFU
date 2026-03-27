<template>
  <div class="p-4 md:p-8 max-w-6xl mx-auto w-full">
    <!-- Header -->
    <div class="mb-6 flex items-center justify-between flex-wrap gap-4">
      <div>
        <button @click="$emit('volver')" class="flex items-center gap-1 text-slate-500 hover:text-primary text-sm font-bold mb-3 transition-colors group">
          <span class="material-symbols-outlined text-[18px] group-hover:-translate-x-1 transition-transform">arrow_back</span>
          Cambiar Fase
        </button>
        <!-- Progress -->
        <div class="flex items-center gap-2 mb-1">
          <span class="text-secondary font-black text-xs uppercase tracking-widest border-l-2 border-secondary pl-2">Progreso de Calificación</span>
        </div>
        <h3 class="text-2xl font-black text-primary mt-1">Paso {{ currentIndex + 1 }}: {{ criterioActual.tituloCorto }}</h3>
        <p class="text-xs text-slate-500 font-bold uppercase mt-1">{{ fraternidad?.nombre }} · Fase: {{ faseSeleccionada.toUpperCase() }}</p>
      </div>
      <div class="text-right">
        <span class="text-slate-500 text-xs font-bold uppercase d-block">Criterio {{ currentIndex + 1 }} de {{ criterios.length }}</span>
        <p class="text-primary font-black text-2xl mt-1">{{ progresoPorcentaje }}%<span class="inline-block size-2 rounded-full bg-secondary ml-1 align-middle"></span></p>
      </div>
    </div>

    <!-- Progress bar -->
    <v-progress-linear
      v-model="progresoPorcentaje"
      color="primary"
      bg-color="rgba(0,0,0,0.05)"
      height="10"
      rounded
      class="mb-8 shadow-sm"
    ></v-progress-linear>

    <!-- Wizard Slider -->
    <v-row>
      <!-- Main Card -->
      <v-col cols="12" lg="8" class="d-flex flex-column">
        <v-card class="flex-grow-1 d-flex flex-column bg-white rounded-xl overflow-hidden shadow-sm relative border-t-4 border-t-primary border border-slate-200" color="white" elevation="0">
          <transition name="fade" mode="out-in">
            <div :key="currentIndex" class="d-flex flex-column flex-grow-1 w-full h-full">
              <!-- Image -->
              <div class="aspect-video relative w-full overflow-hidden shrink-0 bg-black">
                <div class="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent z-10"></div>
                <div class="absolute top-4 left-4 z-20 bg-secondary px-3 py-1 rounded-sm text-[10px] font-black uppercase tracking-widest text-white shadow-lg">En Evaluación</div>
                <div class="w-full h-full bg-cover bg-center transition-transform duration-700 hover:scale-105"
                  :style="{ backgroundImage: `url(${criterioActual.imagen})` }"></div>
              </div>

              <v-card-text class="pa-6 pa-md-8 d-flex flex-column flex-grow-1 text-left bg-white">
                <div class="mb-6">
                  <div class="d-flex align-center gap-2 mb-2">
                    <span class="h-px w-8 bg-secondary inline-block"></span>
                    <h4 class="text-xl font-black text-primary">{{ criterioActual.titulo }}</h4>
                  </div>
                  <p class="text-slate-500 text-sm leading-relaxed">{{ criterioActual.descripcion }}</p>
                </div>

                <div class="mt-auto space-y-6">
                  <!-- Score control -->
                  <v-sheet class="bg-slate-50 pa-6 rounded-xl border border-slate-200" color="transparent">
                    <div class="d-flex justify-space-between align-center mb-6 flex-wrap gap-4">
                      <label class="text-primary font-bold text-sm d-flex align-center gap-2 uppercase tracking-wide">
                        <span class="material-symbols-outlined text-secondary text-[20px]">analytics</span>
                        Puntaje del Criterio
                      </label>
                      <div class="d-flex align-center gap-3">
                        <input
                          v-model.number="criterios[currentIndex].puntaje"
                          class="w-20 bg-white border border-slate-300 text-primary font-black text-center rounded-lg py-2 focus:outline-none"
                          :max="criterioActual.puntajeMaximo" min="0" type="number"
                        />
                        <span class="text-slate-400 font-bold text-sm">/ {{ criterioActual.puntajeMaximo }}</span>
                      </div>
                    </div>
                    <v-slider
                      v-model="criterios[currentIndex].puntaje"
                      color="primary"
                      track-color="rgba(0,0,0,0.05)"
                      min="0" :max="criterioActual.puntajeMaximo" step="1"
                      hide-details
                      class="mt-2 u-glow-slider"
                    >
                      <template v-slot:prepend><span class="text-xs font-bold text-slate-400 mr-2">0</span></template>
                      <template v-slot:append><span class="text-xs font-bold text-slate-400 ml-2">{{ criterioActual.puntajeMaximo }}</span></template>
                    </v-slider>
                  </v-sheet>

                  <!-- Nav buttons -->
                  <div class="d-flex align-center justify-space-between gap-4 flex-wrap">
                    <button
                      @click="pasoAnterior"
                      :disabled="currentIndex === 0"
                      class="d-flex align-center justify-center gap-2 px-6 py-3 rounded-lg bg-white text-slate-600 font-bold text-sm hover:bg-slate-50 transition-all border border-slate-200 flex-1 sm:flex-none disabled:opacity-40"
                      style="height: 52px;"
                    >
                      <span class="material-symbols-outlined text-[20px]">arrow_back</span>
                      Anterior
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

      <!-- Sidebar widgets -->
      <v-col cols="12" lg="4" class="d-flex flex-column gap-6">
        <!-- Next step preview -->
        <v-card v-if="criterioSiguiente" @click="pasoSiguiente"
          class="bg-white border-dashed border-2 border-slate-200 rounded-xl pa-5 d-flex flex-column opacity-80 hover:opacity-100 transition-all cursor-pointer group"
          color="white" elevation="0">
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

        <v-card v-else class="bg-slate-50 border-dashed border-2 border-slate-200 rounded-xl pa-5 d-flex flex-column align-center justify-center text-center min-h-[180px]" color="transparent" elevation="0">
          <span class="material-symbols-outlined text-4xl text-emerald-500 mb-2">task_alt</span>
          <p class="text-primary font-bold mb-0">Último Criterio</p>
          <p class="text-xs text-slate-500 mt-1 mb-0">Revise antes de finalizar</p>
        </v-card>

        <!-- Score summary (neobrutal) -->
        <div class="bg-white border-2 border-black rounded-xl p-6 flex flex-col justify-center items-center text-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] relative overflow-hidden min-h-[160px]">
          <div class="absolute -top-4 -right-4 size-24 bg-slate-50 rounded-full"></div>
          <div class="size-14 rounded-full bg-secondary flex items-center justify-center text-white mb-4 shadow-lg border-2 border-white relative z-10">
            <span class="material-symbols-outlined text-3xl">workspace_premium</span>
          </div>
          <h5 class="text-slate-500 font-black mb-1 uppercase text-[10px] tracking-[0.2em] relative z-10">Puntaje Obtenido</h5>
          <p class="text-6xl font-black text-primary mb-3 relative z-10">{{ promedioActual }}</p>
          <div class="inline-flex items-center px-4 py-1 rounded-full bg-primary text-white text-[9px] font-black uppercase tracking-widest relative z-10">
            Sobre {{ puntajeTotalFase }} puntos
          </div>
        </div>

        <!-- Notes -->
        <div class="bg-white border-l-4 border-l-secondary rounded-xl p-5 text-left border border-slate-200 shadow-sm">
          <label class="d-flex align-center gap-2 text-primary text-xs font-black mb-3 uppercase tracking-widest">
            <span class="material-symbols-outlined text-lg text-secondary">edit_note</span>
            Observaciones Rápidas
          </label>
          <textarea
            v-model="criterios[currentIndex].observacion"
            class="w-full bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 min-h-[90px] placeholder:text-slate-400 p-3 focus:outline-none focus:ring-2 focus:ring-primary"
            :placeholder="`Comentarios sobre ${criterioActual.tituloCorto.toLowerCase()}...`"
          ></textarea>
        </div>
      </v-col>
    </v-row>

    <!-- Modal de confirmación -->
    <v-dialog v-model="mostrarModal" max-width="500" persistent>
      <v-card class="bg-white border border-slate-200 rounded-xl text-slate-900 shadow-2xl">
        <v-card-title class="text-xl font-bold border-b border-slate-100 pa-6 d-flex align-center gap-3">
          <span class="material-symbols-outlined text-primary text-3xl">fact_check</span>
          Confirmar Calificación
        </v-card-title>
        <v-card-text class="pa-6">
          <p class="text-slate-500 mb-6">Revise las notas asignadas a cada criterio antes de enviar definitivamente:</p>
          <v-list bg-color="transparent" class="pa-0 border border-slate-100 rounded-lg overflow-hidden mb-4">
            <v-list-item v-for="(criterio, index) in criterios" :key="index" class="border-b border-slate-100 pa-4 bg-slate-50">
              <template v-slot:prepend>
                <v-avatar color="primary" variant="tonal" size="36" class="mr-4 font-bold text-primary">{{ index + 1 }}</v-avatar>
              </template>
              <v-list-item-title class="font-bold text-slate-800">{{ criterio.tituloCorto }}</v-list-item-title>
              <template v-slot:append>
                <span class="font-black text-lg text-primary">{{ criterio.puntaje }}<span class="text-xs text-slate-400 ml-1">/{{ criterio.puntajeMaximo }}</span></span>
              </template>
            </v-list-item>
          </v-list>
          <div class="d-flex align-center justify-space-between bg-primary/5 pa-4 rounded-lg border border-primary/20">
            <span class="font-bold text-slate-500 uppercase tracking-widest text-sm">Puntaje Final</span>
            <span class="font-black text-3xl text-primary">{{ promedioActual }} <span class="text-sm text-slate-500">/ {{ puntajeTotalFase }}</span></span>
          </div>
        </v-card-text>
        <v-card-actions class="pa-6 pt-0 d-flex gap-4">
          <v-btn variant="outlined" color="slate" class="flex-1 rounded-lg text-none font-weight-bold border-slate-200" height="48" @click="mostrarModal = false">Revisar</v-btn>
          <v-btn class="flex-1 bg-primary text-white rounded-lg text-none font-weight-bold shadow-lg shadow-primary/20" height="48" elevation="0" @click="confirmar">
            Confirmar y Enviar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  faseSeleccionada: { type: String, default: 'entrada' },
  fraternidad: { type: Object, default: null }
})

const emit = defineEmits(['volver', 'finalizar'])

const criteriosPorFase = {
  entrada: [
    { id: 1, tituloCorto: 'Vestimenta', titulo: 'Evaluación de Indumentaria Tradicional', descripcion: 'Analice la autenticidad de los tejidos, la complejidad de los bordados y la fidelidad histórica del traje típico de la fraternidad. Considere el uso de accesorios y la uniformidad del bloque.', imagen: '/src/assets/img/caporal.jpg', icono: 'apparel', puntaje: 0, puntajeMaximo: 15, observacion: '' },
    { id: 2, tituloCorto: 'Coreografía', titulo: 'Evaluación de Coreografía y Desplazamiento', descripcion: 'Evalúe la coordinación, el dominio de pasos, la complejidad de las figuras y la sincronía del bloque durante el recorrido.', imagen: '/src/assets/img/tinkus.jpg', icono: 'directions_run', puntaje: 0, puntajeMaximo: 15, observacion: '' },
    { id: 3, tituloCorto: 'Música', titulo: 'Evaluación de Ejecución Musical', descripcion: 'Ritmo, armonía, repertorio tradicional y desempeño general de la banda que acompaña a la fraternidad.', imagen: '/src/assets/img/morenada.jpg', icono: 'music_note', puntaje: 0, puntajeMaximo: 10, observacion: '' }
  ],
  monografia: [
    { id: 1, tituloCorto: 'Presentación', titulo: 'Presentación de Monografía', descripcion: 'Evaluación del documento escrito, investigación y fundamentación histórica.', imagen: '/src/assets/img/monografia.png', icono: 'menu_book', puntaje: 0, puntajeMaximo: 15, observacion: '' },
    { id: 2, tituloCorto: 'Defensa', titulo: 'Defensa de Monografía', descripcion: 'Evaluación de la exposición oral, dominio del tema y respuestas a preguntas.', imagen: '/src/assets/img/monografia.png', icono: 'record_voice_over', puntaje: 0, puntajeMaximo: 15, observacion: '' }
  ],
  disciplina: [
    { id: 1, tituloCorto: 'Comportamiento', titulo: 'Evaluación de Disciplina', descripcion: 'Comportamiento de la fraternidad, organización durante el recorrido y cumplimiento del reglamento.', imagen: '/src/assets/img/disciplina.png', icono: 'gavel', puntaje: 0, puntajeMaximo: 100, observacion: '' }
  ]
}

const criterios = ref([...(criteriosPorFase[props.faseSeleccionada] || criteriosPorFase['entrada']).map(c => ({...c}))])

const currentIndex = ref(0)
const mostrarModal = ref(false)

const criterioActual = computed(() => criterios.value[currentIndex.value])
const isUltimoPaso = computed(() => currentIndex.value === criterios.value.length - 1)
const criterioSiguiente = computed(() => isUltimoPaso.value ? null : criterios.value[currentIndex.value + 1])
const progresoPorcentaje = computed(() => Math.round(((currentIndex.value + 1) / criterios.value.length) * 100))
const promedioActual = computed(() => {
  return criterios.value.reduce((acc, c) => acc + Number(c.puntaje || 0), 0)
})
const puntajeTotalFase = computed(() => {
  return criterios.value.reduce((acc, c) => acc + Number(c.puntajeMaximo || 0), 0)
})

const pasoSiguiente = () => {
  if (isUltimoPaso.value) mostrarModal.value = true
  else currentIndex.value++
}

const pasoAnterior = () => {
  if (currentIndex.value > 0) currentIndex.value--
}

const confirmar = () => {
  mostrarModal.value = false
  emit('finalizar', { criterios: criterios.value, promedio: promedioActual.value })
}
</script>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.3s ease, transform 0.3s ease; }
.fade-enter-from { opacity: 0; transform: translateX(20px); }
.fade-leave-to { opacity: 0; transform: translateX(-20px); }

:deep(.u-glow-slider .v-slider-thumb) {
  border: 3px solid white !important;
  box-shadow: 0 0 10px rgba(0, 74, 153, 0.3) !important;
}
</style>
