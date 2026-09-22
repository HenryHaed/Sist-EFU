<template>
  <div class="relative flex flex-col w-full max-w-full min-w-0 h-full min-h-0 wizard-gradient overflow-x-hidden overflow-y-hidden">
    
    <!-- Wizard Header -->
    <div class="shrink-0 z-40 w-full max-w-full border-b border-slate-100 px-3 sm:px-6 py-2.5 sm:py-4 bg-white/95 backdrop-blur-md shadow-sm">
      <div class="flex items-center gap-2 sm:gap-3 min-w-0 w-full">
        <button
          data-tutorial="volver"
          type="button"
          @click="$emit('volver')"
          class="flex items-center justify-center rounded-lg h-9 w-9 sm:h-10 sm:w-10 bg-slate-50 text-slate-500 hover:bg-slate-200 transition-colors border border-slate-200 shrink-0"
        >
          <span class="material-symbols-outlined text-[20px] sm:text-[24px]">arrow_back</span>
        </button>
        <div class="flex flex-col min-w-0 flex-1 overflow-hidden">
          <h2 class="text-primary text-sm sm:text-xl font-black italic leading-snug tracking-tight uppercase truncate">
            <template v-if="participanteNombre">{{ participanteNombre }}</template>
            <template v-else>{{ fraternidad?.nombre || 'Evaluación' }}</template>
          </h2>
          <p class="text-slate-500 text-[9px] sm:text-[10px] uppercase tracking-widest font-bold truncate">
            {{ faseSeleccionada?.nombre }}
            <span class="text-primary normal-case tracking-normal font-bold">
              · {{ criterioActualIndex + 1 }}/{{ totalCriterios || 0 }}
            </span>
            <span v-if="participanteTipo" class="text-amber-600 ml-1">· {{ participanteTipo }}</span>
          </p>
        </div>
        <div
          class="flex items-center gap-1 px-2 py-1.5 rounded-lg border shrink-0"
          :class="urgenciaStatus.textClass"
        >
          <span class="material-symbols-outlined text-[14px] sm:text-sm animate-pulse">schedule</span>
          <span class="text-[10px] sm:text-xs font-black tabular-nums whitespace-nowrap">{{ countdownText }}</span>
        </div>
        <button
          type="button"
          class="hidden sm:inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 font-black text-[10px] uppercase tracking-widest transition-colors shrink-0"
          @click="abrirTutorial"
        >
          <span class="material-symbols-outlined text-[16px]">school</span>
          Tutorial
        </button>
        <button
          v-if="esFaseMonografia && fraternidad"
          type="button"
          @click="abrirMonografia"
          :disabled="cargandoMonografia"
          class="hidden sm:flex items-center gap-2 px-3 py-2 bg-amber-50 text-amber-800 rounded-lg font-black text-[10px] uppercase tracking-widest border border-amber-200 hover:bg-amber-100 transition-colors disabled:opacity-50 shrink-0"
        >
          <span class="material-symbols-outlined text-sm">picture_as_pdf</span>
          Monografía
        </button>
        <div
          v-if="estadoOriginal === 'COMPLETADO'"
          class="hidden sm:flex items-center gap-1.5 px-3 py-2 bg-emerald-100 text-emerald-700 rounded-lg font-black text-[10px] uppercase tracking-widest border border-emerald-200 shrink-0"
        >
          <span class="material-symbols-outlined text-sm">verified_user</span>
          Sellada
        </div>
      </div>
    </div>

    <TutorialCalificarModal v-model="tutorialAbierto" :variant="tutorialVariant" />

    <!-- Main scrollable content -->
    <main class="flex-1 min-h-0 min-w-0 w-full overflow-y-auto overflow-x-hidden">
      <div class="flex flex-col items-stretch w-full max-w-6xl mx-auto min-w-0 px-3 sm:px-6 md:px-8 pt-3 sm:pt-6 pb-4 sm:pb-8">
      
      <!-- Loading State -->
      <div v-if="loading" class="flex flex-col items-center justify-center py-20 text-slate-400">
        <span class="material-symbols-outlined animate-spin text-5xl text-primary mb-4">sync</span>
        <p class="font-bold tracking-widest uppercase text-xs">Preparando Criterios...</p>
      </div>

      <template v-else-if="criterios.length > 0">
        <!-- Progress -->
        <div class="w-full min-w-0 mb-3 sm:mb-6">
          <div class="sm:hidden mb-2">
            <div class="h-1.5 bg-slate-200 rounded-full overflow-hidden">
              <div class="h-full bg-primary rounded-full transition-all" :style="{ width: `${porcentajeProgreso}%` }" />
            </div>
          </div>
          <h3 class="text-base sm:text-2xl font-black text-slate-900 italic tracking-tighter uppercase leading-snug break-words">
            <span class="sm:hidden line-clamp-2">{{ criterioActual.nombre }}</span>
            <span class="hidden sm:inline">Paso {{ criterioActualIndex + 1 }}: Evalúa {{ criterioActual.nombre }}</span>
          </h3>
          <p class="text-slate-500 text-[11px] sm:text-sm font-medium mt-1 break-words">
            <template v-if="esFaseDisciplina">¿Cumple este criterio? · SI = {{ Number(criterioActual.puntajeMaximo) || 0 }} · NO = 0</template>
            <template v-else>Máximo {{ escalaActual }} pts</template>
            <span class="text-slate-400"> · paso {{ criterioActualIndex + 1 }} de {{ totalCriterios }}</span>
          </p>
        </div>

        <!-- Layout Grid -->
        <div class="relative w-full min-w-0 max-w-full grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-8 items-start mb-4 sm:mb-10">
          
          <!-- LEFT CARD -->
          <div class="lg:col-span-8 flex flex-col min-w-0 max-w-full glass-panel rounded-2xl overflow-hidden border-t-4 border-t-primary bg-white shadow-xl">
            <div class="hidden lg:block aspect-video relative w-full overflow-hidden bg-slate-100">
              <div class="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/20 to-transparent z-10 pointer-events-none"></div>
              <div class="absolute top-4 left-4 z-20 bg-primary px-3 py-1 rounded text-[10px] font-black uppercase tracking-widest text-white shadow-lg border-l-4 border-secondary flex items-center gap-1">
                <span class="material-symbols-outlined text-[14px]" v-if="estadoOriginal === 'COMPLETADO'">lock</span>
                <span class="material-symbols-outlined text-[14px]" v-else>radio_button_checked</span>
                {{ estadoOriginal === 'COMPLETADO' ? 'Lectura' : 'En Evaluación' }}
              </div>
              <div class="absolute bottom-4 right-4 z-20 bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-lg text-white font-black text-xs border border-white/30 shadow-lg">
                <template v-if="esFaseDisciplina">Decisión SI / NO</template>
                <template v-else>Máximo: {{ escalaActual }} pts</template>
              </div>
              <img
                v-if="criterioActual.urlImagen"
                :src="getImageUrl(criterioActual.urlImagen)"
                class="w-full h-full object-cover"
                alt="Imagen Criterio"
              />
              <div v-else class="w-full h-full andean-pattern flex items-center justify-center opacity-80 mix-blend-multiply bg-primary/10">
                <span class="material-symbols-outlined text-6xl text-primary/20">school</span>
              </div>
            </div>
            
            <div class="flex-1 flex flex-col bg-white min-w-0 p-3 sm:p-6 md:p-10">
              <!-- Descripción solo desktop / tablet -->
              <div class="hidden sm:block mb-4 lg:mb-8 order-2 lg:order-1 min-w-0">
                <div class="hidden lg:flex items-center gap-2 mb-3 min-w-0">
                  <span class="size-2 rounded-full bg-secondary shrink-0"></span>
                  <h4 class="text-2xl font-black text-slate-900 italic tracking-tighter uppercase leading-tight break-words min-w-0">
                    Evalúa {{ criterioActual.nombre }}
                  </h4>
                </div>
                <p class="text-slate-600 text-sm leading-relaxed font-medium line-clamp-4 lg:line-clamp-none break-words">
                  <template v-if="esFaseDisciplina">
                    {{ criterioActual.descripcion || 'Indique si la fraternidad cumple o no este criterio de disciplina.' }}
                  </template>
                  <template v-else>
                    {{ criterioActual.descripcion || 'Asigne el puntaje correspondiente de acuerdo a los criterios observados durante el desarrollo del recorrido.' }}
                  </template>
                </p>
              </div>

              <div class="mt-0 lg:mt-auto order-1 lg:order-2 space-y-5 sm:space-y-8 min-w-0">
                <!-- Disciplina: decisión SI / NO -->
                <div
                  v-if="esFaseDisciplina"
                  class="bg-slate-50 rounded-2xl border border-slate-200 p-4 sm:p-6 min-w-0"
                  data-tutorial="puntaje"
                >
                  <label class="text-slate-800 font-black text-sm uppercase tracking-widest flex items-center gap-2 mb-4 sm:mb-5">
                    <span class="material-symbols-outlined text-primary text-2xl sm:text-xl">rule</span>
                    <span>¿Cumple el criterio?</span>
                  </label>

                  <div class="grid grid-cols-2 gap-3 sm:gap-4">
                    <button
                      type="button"
                      :disabled="estadoOriginal === 'COMPLETADO'"
                      @click="setDecisionDisciplina(criterioActual.idCriterio, 1)"
                      class="flex flex-col items-center justify-center gap-2 min-h-[5.5rem] sm:min-h-[6.5rem] rounded-2xl border-2 font-black uppercase tracking-widest transition-all"
                      :class="formValues[criterioActual.idCriterio] === 1
                        ? 'bg-emerald-600 border-emerald-700 text-white shadow-lg shadow-emerald-600/30'
                        : 'bg-white border-slate-200 text-slate-500 hover:border-emerald-400 hover:text-emerald-700'"
                    >
                      <span class="material-symbols-outlined text-3xl sm:text-4xl">check_circle</span>
                      <span class="text-lg sm:text-xl">Sí</span>
                      <span class="text-[10px] opacity-80 normal-case tracking-normal font-bold">{{ Number(criterioActual.puntajeMaximo) || 0 }} pts</span>
                    </button>
                    <button
                      type="button"
                      :disabled="estadoOriginal === 'COMPLETADO'"
                      @click="setDecisionDisciplina(criterioActual.idCriterio, 0)"
                      class="flex flex-col items-center justify-center gap-2 min-h-[5.5rem] sm:min-h-[6.5rem] rounded-2xl border-2 font-black uppercase tracking-widest transition-all"
                      :class="formValues[criterioActual.idCriterio] === 0
                        ? 'bg-secondary border-red-800 text-white shadow-lg shadow-secondary/30'
                        : 'bg-white border-slate-200 text-slate-500 hover:border-red-300 hover:text-secondary'"
                    >
                      <span class="material-symbols-outlined text-3xl sm:text-4xl">cancel</span>
                      <span class="text-lg sm:text-xl">No</span>
                      <span class="text-[10px] opacity-80 normal-case tracking-normal font-bold">0 pts</span>
                    </button>
                  </div>
                </div>

                <!-- Otras fases: puntaje numérico -->
                <div
                  v-else
                  class="bg-slate-50 rounded-2xl border border-slate-200 p-4 sm:p-6 min-w-0"
                  data-tutorial="puntaje"
                >
                  <div class="flex justify-between items-center gap-3 mb-4 sm:mb-6 min-w-0">
                    <label class="text-slate-800 font-black text-sm uppercase tracking-widest flex items-center gap-2 shrink-0">
                      <span class="material-symbols-outlined text-primary text-2xl sm:text-xl">analytics</span>
                      <span>Puntaje</span>
                    </label>
                    <div class="flex items-center gap-2 sm:gap-3 shrink-0">
                      <input
                        ref="puntajeInputRef"
                        type="number"
                        inputmode="decimal"
                        enterkeyhint="done"
                        v-model.number="formValues[criterioActual.idCriterio]"
                        min="0"
                        :max="escalaActual"
                        @input="validarPuntaje(criterioActual)"
                        @blur="validarPuntaje(criterioActual)"
                        class="w-24 sm:w-28 px-3 py-3 sm:py-2.5 bg-white border-2 border-slate-300 text-primary font-black text-3xl sm:text-3xl text-center rounded-xl focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all outline-none"
                        :disabled="estadoOriginal === 'COMPLETADO'"
                      />
                      <span class="text-slate-400 font-bold text-base sm:text-lg whitespace-nowrap">/ {{ escalaActual }}</span>
                    </div>
                  </div>
                  
                  <div class="relative flex items-center gap-3 sm:gap-4 min-w-0" v-if="estadoOriginal !== 'COMPLETADO'">
                    <span class="text-xs font-black text-slate-400 shrink-0">0</span>
                    <div class="flex-1 min-w-0 relative flex items-center">
                      <input
                        type="range"
                        v-model.number="formValues[criterioActual.idCriterio]"
                        min="0"
                        :max="escalaActual"
                        step="0.01"
                        class="w-full max-w-full h-4 sm:h-3 bg-slate-200 rounded-full appearance-none cursor-pointer accent-primary focus:outline-none focus:ring-4 focus:ring-primary/20 transition-all custom-range shadow-inner"
                      />
                    </div>
                    <span class="text-xs font-black text-slate-400 shrink-0">{{ escalaActual }}</span>
                  </div>
                </div>

                <!-- Observación opcional (disciplina) -->
                <div
                  v-if="esFaseDisciplina"
                  class="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 min-w-0"
                >
                  <label class="text-slate-800 font-black text-[11px] sm:text-sm uppercase tracking-widest flex items-center gap-2 mb-2">
                    <span class="material-symbols-outlined text-amber-600 text-xl">visibility</span>
                    Observación
                    <span class="text-[9px] font-bold text-slate-400 normal-case tracking-normal">(opcional)</span>
                  </label>
                  <textarea
                    v-model="observacionDisciplina"
                    rows="3"
                    maxlength="2000"
                    :disabled="estadoOriginal === 'COMPLETADO'"
                    placeholder="Declare una observación si corresponde (queda registrada en el acta)…"
                    class="w-full px-3 py-2.5 bg-slate-50 border-2 border-slate-200 rounded-xl text-sm text-slate-800 font-medium outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 resize-y min-h-[4.5rem] disabled:opacity-60"
                  />
                  <p class="mt-1.5 text-[10px] text-slate-400 font-medium">
                    {{ observacionDisciplina.length }}/2000
                  </p>
                </div>

                <div
                  v-if="esFaseDisciplina"
                  class="sm:hidden flex items-center justify-between gap-2 px-1 text-xs font-bold text-slate-600 min-w-0"
                >
                  <span>Acumulado</span>
                  <span class="text-primary font-black tabular-nums">
                    {{ formatNum(puntajeCalculado) }} / {{ formatNum(puntajePosible) }}
                  </span>
                </div>

                <!-- Desktop nav -->
                <div class="hidden sm:flex flex-row items-center justify-between gap-3 pt-4 border-t border-slate-100 min-w-0">
                  <button
                    data-tutorial="anterior"
                    type="button"
                    @click="pasoAnterior"
                    :disabled="criterioActualIndex === 0"
                    class="flex items-center justify-center gap-2 px-6 py-4 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all border-2 disabled:opacity-30 disabled:cursor-not-allowed shrink-0"
                    :class="criterioActualIndex === 0 ? 'bg-slate-50 border-slate-100 text-slate-400' : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50 shadow-sm'"
                  >
                    <span class="material-symbols-outlined text-lg">arrow_back</span>
                    Anterior
                  </button>

                  <div class="flex gap-3 justify-end min-w-0 flex-wrap">
                    <button
                      v-if="estadoOriginal !== 'COMPLETADO'"
                      data-tutorial="guardar"
                      type="button"
                      @click="guardar(false)"
                      :disabled="saving || tiempoRestante <= 0"
                      class="flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-white border-2 border-primary text-primary font-black uppercase text-[10px] tracking-widest hover:bg-primary/5 transition-all shadow-sm disabled:opacity-50"
                    >
                      <span class="material-symbols-outlined text-lg" :class="{ 'animate-spin': saving }">{{ saving ? 'sync' : 'save' }}</span>
                      {{ tiempoRestante <= 0 ? 'Fase Cerrada' : 'Guardar evaluación' }}
                    </button>

                    <button
                      v-if="criterioActualIndex < totalCriterios - 1"
                      data-tutorial="siguiente"
                      type="button"
                      @click="pasoSiguiente"
                      class="flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-primary text-white font-black uppercase text-[10px] tracking-widest hover:bg-blue-900 transition-all glow-blue shadow-lg shadow-primary/30 border-b-4 border-blue-900 active:border-b-0 active:translate-y-1"
                    >
                      Siguiente
                      <span class="material-symbols-outlined text-lg">arrow_forward</span>
                    </button>

                    <button
                      v-else-if="estadoOriginal !== 'COMPLETADO'"
                      data-tutorial="finalizar"
                      type="button"
                      @click="abrirResumenModal"
                      :disabled="tiempoRestante <= 0"
                      class="flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-secondary text-white font-black uppercase text-[10px] tracking-widest hover:bg-red-800 transition-all shadow-lg shadow-secondary/30 border-b-4 border-red-900 active:border-b-0 active:translate-y-1 disabled:bg-slate-200 disabled:text-slate-400 disabled:border-transparent"
                    >
                      <span class="material-symbols-outlined text-lg">{{ tiempoRestante <= 0 ? 'lock' : 'verified' }}</span>
                      {{ tiempoRestante <= 0 ? 'Fase Cerrada' : 'Finalizar evaluación' }}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- RIGHT SIDEBAR (solo desktop) -->
          <div class="hidden lg:flex lg:col-span-4 flex-col gap-6">
            
            <!-- Summary Global -->
            <div class="bg-slate-900 text-white border border-slate-800 rounded-2xl p-8 flex flex-col justify-center items-center text-center shadow-2xl shadow-slate-900/20 relative overflow-hidden">
              <div class="absolute top-0 left-0 w-full h-2 bg-secondary"></div>
              
              <template v-if="esFaseDisciplina">
                <h5 class="text-slate-400 font-bold mb-1 uppercase text-[10px] tracking-widest">Puntaje acumulado</h5>
                <div class="flex items-end gap-1 mb-2">
                  <p class="text-5xl font-black italic tracking-tighter">{{ formatNum(puntajeCalculado) }}</p>
                  <p class="text-lg text-slate-500 font-bold mb-1.5">/ {{ formatNum(puntajePosible) }}</p>
                </div>
              </template>
              <template v-else>
                <h5 class="text-slate-400 font-bold mb-1 uppercase text-[10px] tracking-widest">Puntaje acumulado</h5>
                <div class="flex items-end gap-1 mb-2">
                  <p class="text-7xl font-black italic tracking-tighter">{{ formatNum(puntajeCalculado) }}</p>
                  <p class="text-xl text-slate-500 font-bold mb-2">/ {{ formatNum(puntajePosible) }}</p>
                </div>
              </template>
              
              <div class="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 text-slate-300 text-[9px] font-black uppercase tracking-widest mt-2 border border-white/5">
                <span class="material-symbols-outlined text-[14px]">done_all</span>
                {{ criteriosLlenados }} de {{ totalCriterios }} Completados
              </div>
            </div>

            <!-- Próximo Paso Preview -->
            <div 
              v-if="criterioSiguiente"
              @click="pasoSiguiente"
              class="glass-panel rounded-2xl p-5 flex flex-col opacity-90 hover:opacity-100 transition-all cursor-pointer group bg-white border-2 border-slate-100 hover:border-primary shadow-sm hover:shadow-lg"
            >
              <div class="flex items-center justify-between mb-4">
                <div class="flex items-center gap-3">
                  <div class="size-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 group-hover:text-primary group-hover:bg-primary/10 transition-colors">
                    <span class="material-symbols-outlined text-[18px]">forward_step</span>
                  </div>
                  <div>
                    <p class="text-[9px] text-slate-400 font-black uppercase tracking-widest">Próximo</p>
                    <p class="text-slate-900 font-bold text-sm tracking-tight truncate max-w-[150px]">{{ criterioSiguiente.nombre }}</p>
                  </div>
                </div>
                <span class="material-symbols-outlined text-slate-300 group-hover:text-primary group-hover:translate-x-1 transition-all">chevron_right</span>
              </div>
              
              <div class="aspect-[21/9] rounded-xl overflow-hidden border border-slate-200 relative bg-slate-50">
                <div class="absolute inset-0 bg-primary/10 group-hover:bg-transparent transition-colors z-10"></div>
                <img 
                  v-if="criterioSiguiente.urlImagen"
                  :src="getImageUrl(criterioSiguiente.urlImagen)" 
                  class="w-full h-full object-cover grayscale mix-blend-multiply group-hover:grayscale-0 group-hover:mix-blend-normal transition-all duration-500"
                />
                <div v-else class="w-full h-full andean-pattern flex items-center justify-center opacity-60">
                   <span class="material-symbols-outlined text-2xl text-primary/30">image</span>
                </div>
              </div>
            </div>
            
            <div v-else class="glass-panel rounded-2xl p-6 flex flex-col items-center justify-center text-center bg-emerald-50 border-2 border-emerald-200 text-emerald-800">
              <span class="material-symbols-outlined text-4xl text-emerald-500 mb-2">task_alt</span>
              <p class="font-black text-sm uppercase tracking-widest">Último Criterio</p>
              <p class="text-xs font-medium mt-1 text-emerald-600/80">Estás en el paso final.</p>
            </div>

            <div class="glass-panel rounded-2xl bg-white border-2 border-slate-100 p-5 mt-auto">
                <p class="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-3 flex items-center gap-1">
                  <span class="material-symbols-outlined text-[14px]">info</span> Criterios Evaluados
                </p>
                <div class="space-y-2">
                  <div v-for="(c, idx) in criterios" :key="c.idCriterio" 
                    class="flex items-center justify-between p-2 rounded-lg"
                    :class="formValues[c.idCriterio] != null ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-50 text-slate-400'"
                  >
                    <div class="flex items-center gap-2 truncate">
                      <span class="material-symbols-outlined text-[14px]">{{ formValues[c.idCriterio] != null ? 'check_circle' : 'radio_button_unchecked' }}</span>
                      <span class="text-xs font-bold truncate max-w-[120px]">{{ idx + 1 }}. {{ c.nombre }}</span>
                    </div>
                    <span class="text-xs font-black">
                      <template v-if="esFaseDisciplina">
                        <span v-if="formValues[c.idCriterio] === 1" class="text-emerald-700">SÍ</span>
                        <span v-else-if="formValues[c.idCriterio] === 0" class="text-secondary">NO</span>
                        <span v-else>-</span>
                      </template>
                      <template v-else>
                        {{ formValues[c.idCriterio] ?? '-' }} / {{ Number(c.puntajeMaximo) }}
                      </template>
                    </span>
                  </div>
                </div>
            </div>

          </div>
        </div>
      </template>

      <!-- Fallback general -->
      <div v-else class="text-center py-20 bg-white rounded-3xl border border-slate-200 shadow-sm w-full min-w-0">
        <span class="material-symbols-outlined text-5xl text-slate-300">inventory_2</span>
        <p class="mt-4 font-bold text-slate-600 text-lg break-words px-4">No existen criterios definidos para esta fase.</p>
        <button type="button" @click="$emit('volver')" class="mt-6 px-6 py-2 bg-slate-100 text-slate-700 font-bold rounded-lg hover:bg-slate-200">Volver al Listado</button>
      </div>

      </div>
    </main>

    <!-- Barra de acciones móvil -->
    <div
      v-if="!loading && criterios.length > 0"
      class="sm:hidden shrink-0 z-30 w-full max-w-full border-t border-slate-200 bg-white/95 backdrop-blur px-3 py-3"
      style="padding-bottom: max(0.75rem, env(safe-area-inset-bottom))"
    >
      <div class="flex flex-col gap-2 w-full min-w-0">
        <div class="flex items-center gap-2 w-full">
          <button
            type="button"
            data-tutorial="anterior"
            @click="pasoAnterior"
            :disabled="criterioActualIndex === 0"
            class="flex items-center justify-center gap-1.5 h-12 px-3 rounded-xl bg-white border-2 border-slate-200 text-slate-700 font-black uppercase text-[11px] tracking-widest shrink-0 disabled:opacity-30"
          >
            <span class="material-symbols-outlined text-[20px]">arrow_back</span>
            Anterior
          </button>

          <button
            v-if="estadoOriginal !== 'COMPLETADO'"
            type="button"
            data-tutorial="guardar"
            @click="guardar(false)"
            :disabled="saving || tiempoRestante <= 0"
            class="flex items-center justify-center gap-1.5 flex-1 min-w-0 h-12 px-3 rounded-xl bg-white border-2 border-primary text-primary font-black uppercase text-[11px] tracking-widest disabled:opacity-50"
          >
            <span class="material-symbols-outlined text-[20px]" :class="{ 'animate-spin': saving }">{{ saving ? 'sync' : 'save' }}</span>
            {{ tiempoRestante <= 0 ? 'Fase cerrada' : 'Guardar' }}
          </button>
        </div>

        <button
          v-if="criterioActualIndex < totalCriterios - 1"
          type="button"
          data-tutorial="siguiente"
          @click="pasoSiguiente"
          class="flex items-center justify-center gap-2 w-full h-12 px-3 rounded-xl bg-primary text-white font-black uppercase text-[11px] tracking-widest shadow-md"
        >
          Siguiente criterio
          <span class="material-symbols-outlined text-[20px]">arrow_forward</span>
        </button>

        <button
          v-else-if="estadoOriginal !== 'COMPLETADO'"
          type="button"
          data-tutorial="finalizar"
          @click="abrirResumenModal"
          :disabled="tiempoRestante <= 0"
          class="flex items-center justify-center gap-2 w-full h-12 px-3 rounded-xl bg-secondary text-white font-black uppercase text-[11px] tracking-widest shadow-md disabled:bg-slate-200 disabled:text-slate-400"
        >
          <span class="material-symbols-outlined text-[20px]">{{ tiempoRestante <= 0 ? 'lock' : 'verified' }}</span>
          {{ tiempoRestante <= 0 ? 'Fase cerrada' : 'Finalizar evaluación' }}
        </button>
      </div>
    </div>

    <!-- MODAL RESUMEN FINAL -->
    <v-dialog v-model="modalResumen" :max-width="esFaseDisciplina ? '560px' : '500px'" persistent scrollable>
      <v-card class="rounded-3xl border-4 border-secondary overflow-hidden">
        <v-card-title class="bg-secondary text-white pa-4 sm:pa-6 text-center flex flex-col items-center shrink-0">
          <span class="material-symbols-outlined text-3xl sm:text-5xl mb-1 sm:mb-2 opacity-90">verified_user</span>
          <h3 class="text-base sm:text-2xl font-black italic uppercase tracking-tighter shadow-sm">Confirmar finalización</h3>
          <p class="text-[10px] sm:text-xs text-white/80 font-medium tracking-wide mt-0.5 sm:mt-1 uppercase">Revisión final</p>
        </v-card-title>
        
        <v-card-text class="pa-0 bg-slate-50 flex-grow-1 overflow-y-auto" style="max-height: 65vh;">
          <!-- Disciplina: solo puntaje que calificó el controlador -->
          <template v-if="esFaseDisciplina">
            <div class="bg-white border-b border-slate-200 p-4 sm:p-6 text-center">
              <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Puntaje total</p>
              <p class="text-2xl sm:text-4xl font-black text-primary tabular-nums leading-tight">
                {{ formatNum(puntajeCalculado) }}
                <span class="text-base sm:text-xl font-bold text-slate-400">/ {{ formatNum(puntajePosible) }}</span>
              </p>
              <div class="mt-3 mx-auto max-w-xs h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  class="h-full bg-primary rounded-full transition-all"
                  :style="{ width: `${pctDecisionesDisciplina}%` }"
                />
              </div>
            </div>

            <div class="p-3 sm:p-5">
              <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 sm:mb-3 px-0.5">
                Desglose · {{ totalCriterios }} criterios
              </p>
              <div class="space-y-1.5 sm:space-y-2">
                <div
                  v-for="(row, idx) in desgloseDisciplina"
                  :key="row.idCriterio"
                  class="bg-white border border-slate-200 rounded-xl px-3 py-2.5 sm:p-3.5 flex items-center gap-2.5 min-w-0"
                >
                  <span class="size-6 shrink-0 bg-slate-100 text-slate-600 rounded-lg font-black text-[10px] flex items-center justify-center">
                    {{ idx + 1 }}
                  </span>
                  <p class="min-w-0 flex-1 text-xs sm:text-sm font-bold text-slate-800 leading-snug break-words">
                    {{ row.nombre }}
                  </p>
                  <span
                    class="shrink-0 text-xs sm:text-sm font-black uppercase tracking-widest px-2 py-1 rounded-lg"
                    :class="row.valor === 1 ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-secondary'"
                  >
                    {{ row.valor === 1 ? `Sí · ${row.pts}` : 'No · 0' }}
                  </span>
                </div>
              </div>

              <div
                v-if="observacionDisciplina.trim()"
                class="mt-3 sm:mt-4 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5 text-left"
              >
                <p class="text-[10px] font-black uppercase tracking-widest text-amber-700 mb-1">Observación</p>
                <p class="text-xs sm:text-sm text-amber-900 font-medium whitespace-pre-wrap break-words">{{ observacionDisciplina.trim() }}</p>
              </div>
            </div>
          </template>

          <!-- Otras fases -->
          <template v-else>
            <div class="bg-white border-b border-slate-200 p-8 text-center flex flex-col items-center">
              <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Puntaje total</p>
              <div class="flex items-end justify-center gap-1">
                <span class="text-4xl sm:text-6xl font-black text-slate-900 italic tracking-tighter">{{ formatNum(puntajeCalculado) }}</span>
                <span class="text-lg sm:text-xl text-slate-500 font-bold mb-1.5">/ {{ formatNum(puntajePosible) }} pts</span>
              </div>
            </div>

            <div class="p-6">
              <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 text-center">Desglose por criterio</p>
              <div class="space-y-2">
                <div v-for="(c, idx) in criterios" :key="c.idCriterio" class="flex justify-between items-center p-3 bg-white border border-slate-200 rounded-xl gap-3 min-w-0">
                  <div class="flex items-center gap-3 min-w-0">
                    <span class="size-6 shrink-0 bg-slate-100 text-slate-500 rounded font-black text-xs flex items-center justify-center">{{ idx + 1 }}</span>
                    <span class="font-bold text-sm text-slate-700 break-words min-w-0">{{ c.nombre }}</span>
                  </div>
                  <div class="font-black text-primary text-lg shrink-0">
                    {{ formValues[c.idCriterio] ?? '0' }} <span class="text-xs text-slate-400 font-bold">/ {{ Number(c.puntajeMaximo) }}</span>
                  </div>
                </div>
              </div>
            </div>
          </template>
          
          <div class="px-3 sm:px-6 pb-3 sm:pb-5 text-center">
             <div class="bg-amber-50 border border-amber-200 text-amber-800 text-[11px] sm:text-xs font-bold p-2.5 sm:p-3 rounded-xl flex items-center gap-2 text-left">
               <span class="material-symbols-outlined text-amber-500 shrink-0 text-[18px] sm:text-[24px]">warning</span>
               Al finalizar ya no podrás modificar estas calificaciones.
             </div>
          </div>
        </v-card-text>

        <v-card-actions class="pa-3 sm:pa-6 bg-white border-t border-slate-200 flex flex-col sm:flex-row gap-2 sm:gap-4">
          <button @click="modalResumen = false" class="w-full sm:flex-1 py-2.5 sm:py-3 text-slate-500 font-bold hover:bg-slate-50 rounded-xl transition-colors border-2 border-transparent hover:border-slate-200 text-sm">
            Revisar
          </button>
          <button @click="confirmarSello" :disabled="saving" class="w-full sm:flex-1 bg-secondary text-white font-black py-2.5 sm:py-3 px-3 rounded-xl uppercase tracking-widest text-[10px] sm:text-xs flex items-center justify-center gap-2 shadow-lg shadow-secondary/30 hover:bg-red-800 transition-colors">
             <span v-if="saving" class="material-symbols-outlined animate-spin text-sm">sync</span>
             <span v-else class="material-symbols-outlined text-sm">lock</span>
             <span class="sm:hidden">Cerrar evaluación</span>
             <span class="hidden sm:inline">Finalizar y cerrar evaluación</span>
          </button>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- MODAL POST-CIERRE -->
    <v-dialog v-model="modalPostCierre" max-width="480px" persistent>
      <v-card class="rounded-3xl border-4 border-emerald-500 overflow-hidden">
        <v-card-title class="bg-emerald-600 text-white pa-6 text-center flex flex-col items-center">
          <span class="material-symbols-outlined text-5xl mb-2 opacity-90">check_circle</span>
          <h3 class="text-xl sm:text-2xl font-black italic uppercase tracking-tighter">Evaluación finalizada</h3>
        </v-card-title>
        <v-card-text class="pa-6 bg-white text-center space-y-3">
          <p class="text-slate-700 text-sm font-medium leading-relaxed">
            La calificación quedó cerrada correctamente.
          </p>
          <div class="rounded-xl bg-slate-50 border border-slate-200 p-4 text-left space-y-1.5">
            <p class="text-[10px] font-black uppercase tracking-widest text-slate-400">Fase en la que calificaste</p>
            <p class="text-base font-black text-primary uppercase italic">{{ faseSeleccionada?.nombre || '—' }}</p>
            <p v-if="participanteNombre || fraternidad" class="text-xs text-slate-600 font-medium">
              {{ participanteNombre || fraternidad?.nombre }}
              <span v-if="participanteNombre && fraternidad"> · {{ fraternidad.nombre }}</span>
            </p>
            <p class="text-xs text-slate-500 font-bold pt-1">
              <template v-if="esFaseDisciplina">
                Puntaje: {{ formatNum(puntajeCalculado) }} / {{ formatNum(puntajePosible) }}
              </template>
              <template v-else>
                Puntaje: {{ formatNum(puntajeCalculado) }} / {{ formatNum(puntajePosible) }}
              </template>
            </p>
          </div>
        </v-card-text>
        <v-card-actions class="pa-6 pt-0 bg-white flex flex-col gap-3">
          <button
            type="button"
            @click="irDestinoPostCierre('estadisticas')"
            class="w-full py-3.5 rounded-xl bg-primary text-white font-black uppercase text-[11px] tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-primary/20 hover:bg-blue-900"
          >
            <span class="material-symbols-outlined text-[18px]">analytics</span>
            Ir a estadísticas
          </button>
          <button
            type="button"
            @click="irDestinoPostCierre('listado')"
            class="w-full py-3.5 rounded-xl bg-white border-2 border-slate-200 text-slate-700 font-black uppercase text-[11px] tracking-widest flex items-center justify-center gap-2 hover:bg-slate-50"
          >
            <span class="material-symbols-outlined text-[18px]">groups</span>
            Volver a calificar otra fraternidad
          </button>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <PdfViewerModal
      v-if="visorMonografiaAbierto && monografiaFraternidad"
      :url="getImageUrl(monografiaFraternidad.urlArchivo)"
      :titulo="`Monografía —  ${fraternidad?.nombre || ''}`"
      @cerrar="visorMonografiaAbierto = false"
    />

  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'
import { notify } from '../utils/notify'
import api from '../services/api'

import { getImageUrl } from '../utils/url'
import PdfViewerModal from '../components/PdfViewerModal.vue'
import TutorialCalificarModal from '../components/TutorialCalificarModal.vue'
import { TUTORIAL_VARIANT, hasSeenTutorial } from '../utils/tutorialCalificar'

const props = defineProps({
  faseSeleccionada: {
    type: Object,
    required: true
  },
  fraternidad: {
    type: Object,
    required: false,
    default: null
  },
  participanteNombre: {
    type: String,
    default: null
  },
  participanteTipo: {
    type: String,
    default: null
  },
  participanteId: {
    type: Number,
    default: null
  }
})
const emit = defineEmits(['volver', 'finalizar'])

const esExterno = computed(() =>
  props.participanteId != null || !!props.participanteNombre,
)
const tutorialVariant = computed(() =>
  esExterno.value ? TUTORIAL_VARIANT.WIZARD_EXTERNO : TUTORIAL_VARIANT.WIZARD_EFU,
)
const tutorialAbierto = ref(false)
function abrirTutorial() {
  tutorialAbierto.value = true
}

const esFaseDisciplina = computed(() =>
  String(props.faseSeleccionada?.nombre || '').toLowerCase().includes('disciplina'),
)

const escalaActual = computed(() => {
  const c = criterioActual.value
  if (!c) return 1
  return Number(c.puntajeMaximo) || 0
})

const loading = ref(true)
const saving = ref(false)
const criterios = ref([])
const formValues = ref({})
const observacionDisciplina = ref('')
const estadoOriginal = ref('PENDIENTE')
const puntajeInputRef = ref(null)

// Wizard State
const criterioActualIndex = ref(0)
const totalCriterios = computed(() => criterios.value.length)
const criterioActual = computed(() => criterios.value[criterioActualIndex.value] || null)
const criterioSiguiente = computed(() => criterios.value[criterioActualIndex.value + 1] || null)

const porcentajeProgreso = computed(() => {
  if (totalCriterios.value === 0) return 0
  return Math.round(((criterioActualIndex.value + 1) / totalCriterios.value) * 100)
})

const criteriosLlenados = computed(() => {
  return criterios.value.filter(c => {
    const val = formValues.value[c.idCriterio]
    return val !== null && val !== undefined && val !== ''
  }).length
})

// Modales
const modalResumen = ref(false)
const modalPostCierre = ref(false)
const promedioFinalizado = ref(0)

const enfocarPuntajeMovil = async () => {
  if (estadoOriginal.value === 'COMPLETADO') return
  if (typeof window !== 'undefined' && window.matchMedia('(min-width: 1024px)').matches) return
  await nextTick()
  const el = puntajeInputRef.value
  if (el && typeof el.focus === 'function') {
    try {
      el.focus({ preventScroll: false })
    } catch {
      el.focus()
    }
  }
}

// Cronómetro
// Monografía (fase MONOGRAFIA)
const esFaseMonografia = computed(() => {
  const f = props.faseSeleccionada
  if (!f) return false
  if (f.categoriaEfu === 'MONOGRAFIA') return true
  return (f.nombre || '').toLowerCase().includes('monograf')
})
const monografiaFraternidad = ref(null)
const visorMonografiaAbierto = ref(false)
const cargandoMonografia = ref(false)

const abrirMonografia = async () => {
  if (!props.fraternidad?.idFraternidad) return
  cargandoMonografia.value = true
  try {
    const res = await api.get(`/monografias/fraternidad/${props.fraternidad.idFraternidad}`)
    monografiaFraternidad.value = res.data
    visorMonografiaAbierto.value = true
  } catch (error) {
    notify.warning(
      'Sin monografía',
      error.response?.data?.message || 'Esta fraternidad aún no ha subido su monografía.',
    )
  } finally {
    cargandoMonografia.value = false
  }
}

const tiempoRestante = ref(0)
let timerInterval = null

const cargarDatos = async () => {
  loading.value = true
  try {
    const resCriterios = await api.get(`/evaluaciones/fase/${props.faseSeleccionada.idFase}/criterios`)
    criterios.value = resCriterios.data
    criterios.value.forEach(c => { formValues.value[c.idCriterio] = null })

    let resEval;
    if (props.participanteId) {
      resEval = await api.get(`/evaluaciones/fase/${props.faseSeleccionada.idFase}/participante/${props.participanteId}/evaluacion`)
    } else if (props.fraternidad) {
      resEval = await api.get(`/evaluaciones/fase/${props.faseSeleccionada.idFase}/fraternidades/${props.fraternidad.idFraternidad}/evaluacion`)
    }

    if (resEval && resEval.data) {
      estadoOriginal.value = resEval.data.estado
      observacionDisciplina.value = resEval.data.observacion || ''
      const jsonb = resEval.data.criteriosEvaluados
      if (jsonb) {
        Object.keys(jsonb).forEach((key) => {
          const raw = jsonb[key]
          if (esFaseDisciplina.value) {
            formValues.value[key] = normalizarDecisionLocal(raw)
          } else if (raw != null && typeof raw === 'object' && ('visual' in raw || 'real' in raw || 'valor' in raw)) {
            formValues.value[key] = raw.valor != null
              ? Number(raw.valor)
              : raw.visual != null
                ? Number(raw.visual)
                : Number(raw.real)
          } else {
            formValues.value[key] = raw
          }
        })
      }
    }
    
    const parseSafeDate = (d, isEnd = true) => {
      if (!d) return null
      const datePart = typeof d === 'string' ? d.split('T')[0].split(' ')[0] : ''
      if (!datePart) return new Date(d)
      const parts = datePart.split('-')
      if (parts.length === 3) {
        const year = parseInt(parts[0], 10)
        const month = parseInt(parts[1], 10) - 1
        const day = parseInt(parts[2], 10)
        if (isEnd) return new Date(year, month, day, 23, 59, 59, 999)
        return new Date(year, month, day, 0, 0, 0, 0)
      }
      return new Date(d)
    }

    const fechaFin = parseSafeDate(props.faseSeleccionada?.fechaFin, true)
    if (fechaFin) {
      iniciarCronometro(fechaFin)
    }
  } catch (error) {
    notify.error('Error', 'Problema al cargar la evaluación.')
    emit('volver')
  } finally {
    loading.value = false
    enfocarPuntajeMovil()
  }
}

const normalizarDecisionLocal = (raw) => {
  if (raw == null || raw === '') return null
  if (typeof raw === 'boolean') return raw ? 1 : 0
  if (typeof raw === 'string') {
    const s = raw.trim().toLowerCase()
    if (['si', 'sí', '1', 'true', 'cumple', 'yes', 's'].includes(s)) return 1
    if (['no', '0', 'false', 'no_cumple', 'n'].includes(s)) return 0
  }
  if (typeof raw === 'object') {
    if ('decision' in raw) return normalizarDecisionLocal(raw.decision)
    if ('valor' in raw) return Number(raw.valor) > 0 ? 1 : 0
    if ('real' in raw) return Number(raw.real) > 0 ? 1 : 0
    if ('visual' in raw) return Number(raw.visual) > 0 ? 1 : 0
  }
  const n = Number(raw)
  if (!Number.isFinite(n)) return null
  return n > 0 ? 1 : 0
}

const setDecisionDisciplina = (idCriterio, valor) => {
  if (estadoOriginal.value === 'COMPLETADO') return
  formValues.value[idCriterio] = valor === 1 ? 1 : 0
}

const validarPuntaje = (criterio) => {
  if (esFaseDisciplina.value) return
  const id = criterio.idCriterio
  let val = formValues.value[id]
  const max = Number(criterio.puntajeMaximo)
  
  if (val === null || val === undefined || val === '') return

  if (isNaN(val) || val < 0) {
    formValues.value[id] = 0
  } else if (val > max) {
    formValues.value[id] = max
  }
}

const pasoSiguiente = () => {
  if (criterioActualIndex.value < totalCriterios.value - 1) {
    criterioActualIndex.value++
  }
}
const pasoAnterior = () => {
  if (criterioActualIndex.value > 0) {
    criterioActualIndex.value--
  }
}

watch(criterioActualIndex, () => {
  enfocarPuntajeMovil()
})

const abrirResumenModal = () => {
  const sinLlenar = criterios.value.some(c => {
    const v = formValues.value[c.idCriterio]
    return v === null || v === undefined || v === ''
  })
  const superaLimites = criterios.value.some(c => {
    const v = formValues.value[c.idCriterio]
    if (esFaseDisciplina.value) {
      return v !== 0 && v !== 1
    }
    const max = Number(c.puntajeMaximo)
    return Number(v) > max || Number(v) < 0
  })

  if (sinLlenar) {
    notify.warning('Atención', 'Asegúrate de llenar todos los criterios antes de finalizar.')
    return
  }
  if (superaLimites) {
    notify.error('Error', esFaseDisciplina.value
      ? 'Cada criterio debe ser SI o NO.'
      : 'Existen puntajes fuera del rango permitido.')
    return
  }
  
  modalResumen.value = true
}

const confirmarSello = async () => {
  await guardar(true)
}

const irDestinoPostCierre = (destino) => {
  modalPostCierre.value = false
  emit('finalizar', { promedio: promedioFinalizado.value, destino })
}

// Stats & Guardado
const formatNum = (n) => {
  const v = Number(n)
  if (!Number.isFinite(v)) return '0'
  return Number.isInteger(v) ? String(v) : v.toFixed(2)
}

const desgloseDisciplina = computed(() => {
  return criterios.value.map((c) => {
    const raw = formValues.value[c.idCriterio]
    const valor = raw === 1 ? 1 : raw === 0 ? 0 : null
    const max = Number(c.puntajeMaximo) || 0
    return {
      idCriterio: c.idCriterio,
      nombre: c.nombre,
      valor,
      max,
      pts: valor === 1 ? max : valor === 0 ? 0 : 0,
    }
  })
})

const totalDecisionesSi = computed(() =>
  desgloseDisciplina.value.reduce((s, r) => s + (r.valor === 1 ? 1 : 0), 0),
)
const pctDecisionesDisciplina = computed(() => {
  const max = Number(puntajePosible.value) || 0
  if (!max) return 0
  return Math.min(100, (Number(puntajeCalculado.value) / max) * 100)
})

const puntajeCalculado = computed(() => {
  if (esFaseDisciplina.value) {
    return desgloseDisciplina.value.reduce((t, r) => t + (r.valor === 1 ? r.max : 0), 0)
  }
  const sum = Object.values(formValues.value).reduce((t, val) => t + (Number(val) || 0), 0)
  return Number(Number(sum).toFixed(2))
})

const puntajePosible = computed(() => {
  if (esFaseDisciplina.value) {
    return criterios.value.reduce((a, c) => a + (Number(c.puntajeMaximo) || 0), 0)
  }
  return criterios.value.reduce((a, c) => a + Number(c.puntajeMaximo), 0)
})

const guardar = async (finalizar = false) => {
  saving.value = true
  const payloadCriterios = {}
  Object.keys(formValues.value).forEach((k) => {
    if (formValues.value[k] !== null && formValues.value[k] !== '') {
      if (esFaseDisciplina.value) {
        payloadCriterios[k] = formValues.value[k] === 1 ? 1 : 0
      } else {
        payloadCriterios[k] = formValues.value[k]
      }
    }
  })

  try {
    await api.post('/evaluaciones/guardar', {
      idFase: props.faseSeleccionada.idFase,
      idFraternidad: props.fraternidad ? props.fraternidad.idFraternidad : undefined,
      idParticipante: props.participanteId || undefined,
      criterios: payloadCriterios,
      finalizar,
      observacion: esFaseDisciplina.value
        ? (observacionDisciplina.value.trim() || null)
        : undefined,
    })

    if (finalizar) {
      notify.success('Evaluación finalizada', 'La calificación se oficializó correctamente.')
      estadoOriginal.value = 'COMPLETADO'
      promedioFinalizado.value = puntajeCalculado.value
      modalResumen.value = false
      modalPostCierre.value = true
    } else {
      notify.success('Progreso Guardado', 'Los cambios se almacenaron como borrador.')
      estadoOriginal.value = 'EN_PROGRESO'
    }
  } catch (error) {
    notify.error('Error', error.response?.data?.message || 'Falló el guardado')
  } finally {
    saving.value = false
  }
}

// Timer
const iniciarCronometro = (fechaFin) => {
  if (!fechaFin || isNaN(fechaFin.getTime())) return
  const actualizar = () => {
    const agora = new Date().getTime()
    const fin = fechaFin.getTime()
    tiempoRestante.value = Math.max(0, fin - agora)
  }
  actualizar()
  timerInterval = setInterval(actualizar, 1000)
}
const countdownText = computed(() => {
  if (isNaN(tiempoRestante.value) || tiempoRestante.value <= 0) return 'FINALIZADO'
  const horas = Math.floor(tiempoRestante.value / (1000 * 60 * 60))
  const min = Math.floor((tiempoRestante.value % (1000 * 60 * 60)) / (1000 * 60))
  return `${horas} H / ${min} M`
})
const urgenciaStatus = computed(() => {
  if (isNaN(tiempoRestante.value)) return { textClass: 'text-slate-400 bg-slate-50' }
  const horas = Math.floor(tiempoRestante.value / (1000 * 60 * 60))
  if (horas < 1) return { textClass: 'text-secondary bg-red-50' }
  return { textClass: 'text-primary bg-blue-50' }
})

onMounted(() => {
  cargarDatos()
})

watch(loading, (isLoading) => {
  if (!isLoading && !hasSeenTutorial(tutorialVariant.value)) {
    tutorialAbierto.value = true
  }
})
onUnmounted(() => { if (timerInterval) clearInterval(timerInterval) })
</script>

<style scoped>
.wizard-gradient {
  background: radial-gradient(circle at top right, #fdfdfd 0%, #f1f5f9 100%);
  background-attachment: fixed;
}
.glass-panel {
  background: rgba(255, 255, 255, 1);
  box-shadow: 0 10px 30px -5px rgba(0, 51, 153, 0.08);
}
.glow-blue {
  box-shadow: 0 4px 15px rgba(0, 51, 153, 0.25);
}

/* Custom Range Input */
input[type=range].custom-range::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 28px;
  height: 28px;
  background: #003399;
  cursor: pointer;
  border-radius: 50%;
  border: 3px solid white;
  box-shadow: 0 0 10px rgba(0, 51, 153, 0.3);
  transition: transform 0.1s ease;
}
@media (min-width: 640px) {
  input[type=range].custom-range::-webkit-slider-thumb {
    width: 24px;
    height: 24px;
  }
}
input[type=range].custom-range::-webkit-slider-thumb:hover {
  transform: scale(1.1);
  background: #E30613; /* Secondary Red pulse */
}
input[type=range].custom-range::-moz-range-thumb {
  width: 24px;
  height: 24px;
  background: #003399;
  cursor: pointer;
  border-radius: 50%;
  border: 3px solid white;
  box-shadow: 0 0 10px rgba(0, 51, 153, 0.3);
}

.andean-pattern {
  background-color: transparent;
  background-image: linear-gradient(rgba(255,255,255,0.7), rgba(255,255,255,0.7)), url('@/assets/img/Textura-Andina.png');
  background-repeat: repeat;
  background-size: 200px;
}
</style>
