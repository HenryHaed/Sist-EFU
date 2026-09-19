<template>
  <div class="relative min-h-full flex flex-col bg-slate-50">
    <div class="dashboard-sticky-header shadow-sm space-y-3">
      <div class="flex flex-col lg:flex-row lg:items-center gap-3 lg:gap-4">
        <div class="flex items-center gap-3 min-w-0 flex-1">
          <button
            data-tutorial="volver"
            @click="$emit('volver')"
            class="size-10 shrink-0 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl flex items-center justify-center transition-colors"
          >
            <span class="material-symbols-outlined">arrow_back</span>
          </button>
          <div class="min-w-0">
            <h2 class="text-[1.2rem] sm:text-xl font-black text-primary uppercase italic tracking-tighter truncate">{{ fase?.nombre || 'Cargando...' }}</h2>
            <p class="text-sm sm:text-xs text-slate-500 font-medium mt-0.5 truncate">Pendientes arriba · ya calificadas al final</p>
          </div>
        </div>

        <div class="flex flex-row flex-wrap items-center gap-2 lg:gap-2.5 shrink-0">
          <button
            type="button"
            class="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 font-black text-[10px] uppercase tracking-widest transition-colors"
            @click="abrirTutorial"
          >
            <span class="material-symbols-outlined text-[18px]">school</span>
            <span class="hidden xs:inline sm:inline">Tutorial</span>
          </button>
          <button
            v-if="esAdmin"
            type="button"
            @click="abrirPanelAdmin()"
            class="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 hover:bg-amber-100 font-black text-[10px] uppercase tracking-widest transition-colors"
          >
            <span class="material-symbols-outlined text-[18px]">monitoring</span>
            <span class="hidden md:inline">Admin</span>
          </button>
          <div
            data-tutorial="tiempo"
            class="inline-flex items-center gap-2 px-3 py-2 border rounded-xl"
            :class="urgenciaStatus.bgClass"
          >
            <span class="material-symbols-outlined animate-pulse text-[18px]" :class="urgenciaStatus.textClass">schedule</span>
            <div class="leading-tight">
              <p class="text-[9px] font-black uppercase tracking-widest text-slate-500">Tiempo fase</p>
              <p class="text-xs sm:text-sm font-black whitespace-nowrap" :class="urgenciaStatus.textClass">{{ countdownText }}</p>
            </div>
          </div>
        </div>
      </div>

      <div v-if="!loading" class="flex flex-col md:flex-row md:items-center gap-2.5 md:gap-3 pt-1 border-t border-slate-100">
        <div class="relative flex-1 min-w-0" data-tutorial="buscar">
          <span class="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-[20px]">search</span>
          <input
            v-model="busqueda"
            type="search"
            placeholder="Buscar fraternidad o categoría..."
            class="w-full pl-11 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all shadow-sm font-medium text-sm"
          />
        </div>
        <div class="flex flex-wrap items-center gap-1.5 md:gap-2 shrink-0">
          <span class="text-[10px] font-black uppercase tracking-widest text-slate-400 mr-0.5">Ordenar</span>
          <button
            v-for="opt in opcionesOrden"
            :key="opt.id"
            type="button"
            @click="setOrden(opt.id)"
            class="px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all"
            :class="ordenCriterio === opt.id
              ? 'bg-primary text-white border-primary'
              : 'bg-white text-slate-500 border-slate-200 hover:border-primary/40'"
          >
            {{ opt.label }}
          </button>
        </div>
      </div>
    </div>

    <TutorialCalificarModal v-model="tutorialAbierto" :variant="tutorialVariant" />

    <!-- MAIN LISTING -->
    <div class="flex-1 dashboard-page max-w-7xl">
      <div v-if="loading" class="flex justify-center py-20">
        <span class="material-symbols-outlined animate-spin text-4xl text-primary">progress_activity</span>
      </div>

      <div v-else class="space-y-4">
        <div v-if="fraternidadesFiltradas.length === 0" class="bg-white rounded-3xl border border-slate-200 py-16 text-center text-slate-400">
          <span class="material-symbols-outlined text-5xl mb-3">search_off</span>
          <p class="text-base sm:text-sm font-medium">
            {{ busqueda.trim() ? `Ninguna fraternidad coincide con “${busqueda}”.` : 'No hay fraternidades habilitadas en esta fase.' }}
          </p>
        </div>

      <div v-else class="space-y-6">
        <!-- ========== PENDIENTES ========== -->
        <section class="bg-white rounded-3xl overflow-hidden border border-slate-200 shadow-sm">
          <div class="px-4 sm:px-6 py-3.5 sm:py-3 bg-amber-50 border-b border-amber-100 flex items-center justify-between gap-3">
            <div class="flex items-center gap-2 min-w-0">
              <span class="material-symbols-outlined text-amber-700 text-[22px]">pending_actions</span>
              <h3 class="text-base sm:text-sm font-black text-amber-900 uppercase tracking-wide truncate">Pendientes de calificar</h3>
            </div>
            <span class="shrink-0 px-2.5 py-1 rounded-lg bg-amber-200/80 text-amber-950 text-sm sm:text-xs font-black">{{ fraternidadesPendientes.length }}</span>
          </div>

          <div v-if="fraternidadesPendientes.length === 0" class="px-6 py-10 text-center text-slate-400 text-base sm:text-sm font-medium">
            No hay fraternidades pendientes. ¡Todo calificado!
          </div>

          <!-- Desktop pendientes -->
          <div v-else class="hidden md:block overflow-x-auto">
            <table class="w-full text-left text-sm">
              <thead class="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-black text-[10px]">
                <tr>
                  <th class="px-6 py-4">Fraternidad</th>
                  <th class="px-6 py-4">Fecha solicitud</th>
                  <th class="px-6 py-4">Instancia</th>
                  <th class="px-6 py-4 text-center">Estado</th>
                  <th class="px-6 py-4 text-center">Puntaje</th>
                  <th class="px-6 py-4">Tiempos</th>
                  <th class="px-6 py-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                <tr
                  v-for="item in fraternidadesPendientes"
                  :key="'p-' + item.idFraternidad"
                  class="transition-colors"
                  :class="tieneSancionGrave(item) ? 'bg-red-50/80 hover:bg-red-50' : 'hover:bg-slate-50'"
                >
                  <td class="px-6 py-4">
                    <p class="font-bold" :class="tieneSancionGrave(item) ? 'text-red-800' : 'text-primary'">{{ item.nombre }}</p>
                    <p class="text-xs text-slate-500">{{ item.categoria || 'Sin categoría' }}</p>
                    <div v-if="item.penalizaciones && item.penalizaciones.length > 0" class="mt-2 flex flex-wrap gap-1.5">
                      <div v-for="p in item.penalizaciones" :key="p.idIncidencia"
                        class="inline-flex items-center gap-1.5 rounded-lg font-black uppercase tracking-wide"
                        :class="esSancionGrave(p)
                          ? 'bg-red-700 text-white border border-red-900 px-2.5 py-1 text-[10px] shadow-sm shadow-red-200'
                          : 'bg-red-50 border border-red-200 text-[10px] text-red-800 px-2 py-1'"
                      >
                        <span class="material-symbols-outlined text-[14px]">{{ esSancionGrave(p) ? 'gavel' : 'warning' }}</span>
                        {{ etiquetaPenalizacion(p) }}
                        <button v-if="authStore.userRole === 'admin' || authStore.userRole === 'superusuario'"
                          @click="removerPenalizacion(item, p.idIncidencia)"
                          class="ml-0.5 hover:text-white/80"
                          title="Remover (Solo Admin)"
                        >
                          <span class="material-symbols-outlined text-[14px]">close</span>
                        </button>
                      </div>
                    </div>
                  </td>
                  <td class="px-6 py-4">
                    <p class="text-xs font-bold text-slate-600">{{ formatFechaSolicitud(item.fechaSolicitud) }}</p>
                  </td>
                  <td class="px-6 py-4">
                    <p class="text-xs font-bold text-slate-600">{{ item.instanciaRepresentacion || '—' }}</p>
                  </td>
                  <td class="px-6 py-4 text-center">
                    <button
                      type="button"
                      class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black uppercase tracking-wide border pointer-events-none"
                      :class="item.estadoEvaluacion === 'EN_PROGRESO'
                        ? 'bg-amber-100 text-amber-800 border-amber-200'
                        : 'bg-orange-100 text-orange-800 border-orange-200'"
                    >
                      <span class="material-symbols-outlined text-[14px]">
                        {{ item.estadoEvaluacion === 'EN_PROGRESO' ? 'sync' : 'radio_button_unchecked' }}
                      </span>
                      {{ item.estadoEvaluacion === 'EN_PROGRESO' ? 'En progreso' : 'No calificado' }}
                    </button>
                  </td>
                  <td class="px-6 py-4 text-center">
                    <div class="text-lg font-black text-primary">
                      {{ ptsMostrados(item) || 0 }} <span class="text-[10px] text-slate-400">pts</span>
                    </div>
                  </td>
                  <td class="px-6 py-4">
                    <div v-if="item.fechaApertura" class="text-xs text-slate-500 flex flex-col gap-1">
                      <p><span class="font-bold">Inició:</span> {{ formatearHora(item.fechaApertura) }}</p>
                      <p v-if="item.fechaCierre"><span class="font-bold">Finalizó:</span> {{ formatearHora(item.fechaCierre) }}</p>
                    </div>
                    <p v-else class="text-xs text-slate-400 italic">No iniciada</p>
                  </td>
                  <td class="px-6 py-4 text-right space-x-2 whitespace-nowrap">
                    <template v-if="item.urlPdf">
                      <button @click="verPdf(item.urlPdf, item.nombre)" title="Ver PDF Embebido" class="inline-flex size-9 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-colors">
                        <span class="material-symbols-outlined text-[20px]">visibility</span>
                      </button>
                      <a :href="getImageUrl(item.urlPdf)" target="_blank" download title="Descargar PDF" class="inline-flex size-9 items-center justify-center rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors">
                        <span class="material-symbols-outlined text-[20px]">download</span>
                      </a>
                    </template>
                    <button v-if="esAdmin" type="button" @click="abrirPanelAdmin(item.idFraternidad)" title="Ver calificaciones" class="inline-flex size-9 items-center justify-center rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200 transition-colors">
                      <span class="material-symbols-outlined text-[20px]">monitoring</span>
                    </button>
                    <button
                      @click="iniciarEvaluacion(item)"
                      :disabled="tiempoRestante <= 0"
                      :data-tutorial="item.idFraternidad === primerPendienteId ? 'calificar' : undefined"
                      class="inline-flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-xs transition-colors"
                      :class="tiempoRestante <= 0
                        ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                        : (item.estadoEvaluacion === 'EN_PROGRESO' ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-md' : 'bg-primary hover:bg-blue-900 text-white shadow-md')"
                    >
                      {{ tiempoRestante <= 0 ? 'Fase Cerrada' : (item.estadoEvaluacion === 'EN_PROGRESO' ? 'Continuar Eval.' : 'Iniciar Eval.') }}
                      <span v-if="tiempoRestante > 0" class="material-symbols-outlined text-[16px]">{{ item.estadoEvaluacion === 'EN_PROGRESO' ? 'play_arrow' : 'edit_document' }}</span>
                      <span v-else class="material-symbols-outlined text-[16px]">lock</span>
                    </button>
                    <template v-if="esFaseDisciplina">
                      <button
                        v-if="banderasHabilitadas.amarilla"
                        @click="aplicarPenalizacion(item, 'AMARILLA')"
                        title="Bandera Amarilla (nota final EFU)"
                        class="inline-flex size-9 items-center justify-center rounded-lg bg-yellow-400 text-white hover:brightness-110 shadow-sm"
                      >
                        <span class="material-symbols-outlined text-[20px]">flag</span>
                      </button>
                      <button
                        v-if="banderasHabilitadas.roja"
                        @click="aplicarPenalizacion(item, 'ROJA')"
                        title="Bandera Roja (nota final EFU)"
                        class="inline-flex size-9 items-center justify-center rounded-lg bg-red-600 text-white hover:brightness-110 shadow-sm"
                      >
                        <span class="material-symbols-outlined text-[20px]">flag</span>
                      </button>
                      <button @click="abrirSanciones(item)" title="Sanciones Graves (nota final EFU)" class="inline-flex h-9 items-center gap-2 px-3 rounded-lg bg-red-700 text-white hover:bg-red-800 shadow-sm shadow-red-200 transition-all">
                        <span class="material-symbols-outlined text-[18px]">gavel</span>
                        <span class="text-[10px] font-black uppercase tracking-widest">Sanciones</span>
                      </button>
                    </template>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Mobile pendientes -->
          <div v-if="fraternidadesPendientes.length" class="md:hidden p-4 space-y-4">
            <div
              v-for="item in fraternidadesPendientes"
              :key="'pm-' + item.idFraternidad"
              class="rounded-2xl p-4 shadow-sm flex flex-col gap-4 relative overflow-hidden"
              :class="tieneSancionGrave(item) ? 'bg-red-50 border-2 border-red-600' : 'bg-slate-50 border border-slate-200'"
            >
              <div class="absolute left-0 top-0 bottom-0 w-1.5" :class="tieneSancionGrave(item) ? 'bg-red-700' : (item.estadoEvaluacion === 'EN_PROGRESO' ? 'bg-amber-500' : 'bg-orange-400')" />
              <div class="flex justify-between items-start pl-2 gap-3">
                <div class="min-w-0">
                  <p class="font-black text-lg leading-tight" :class="tieneSancionGrave(item) ? 'text-red-800' : 'text-primary'">{{ item.nombre }}</p>
                  <p class="text-sm text-slate-500 mt-0.5">{{ item.categoria || 'Sin categoría' }}</p>
                </div>
                <div class="text-right shrink-0">
                  <p class="text-2xl font-black leading-none" :class="tieneSancionGrave(item) ? 'text-red-700' : 'text-primary'">{{ ptsMostrados(item) || 0 }}</p>
                  <p class="text-xs text-slate-400 font-bold uppercase mt-0.5">pts</p>
                </div>
              </div>
              <div class="flex flex-wrap gap-2 pl-2">
                <button
                  type="button"
                  class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black uppercase tracking-wide border pointer-events-none"
                  :class="item.estadoEvaluacion === 'EN_PROGRESO'
                    ? 'bg-amber-100 text-amber-800 border-amber-200'
                    : 'bg-orange-100 text-orange-800 border-orange-200'"
                >
                  <span class="material-symbols-outlined text-[16px]">
                    {{ item.estadoEvaluacion === 'EN_PROGRESO' ? 'sync' : 'radio_button_unchecked' }}
                  </span>
                  {{ item.estadoEvaluacion === 'EN_PROGRESO' ? 'En progreso' : 'No calificado' }}
                </button>
                <div
                  v-for="p in (item.penalizaciones || [])"
                  :key="p.idIncidencia + '_m'"
                  class="inline-flex items-center gap-1 rounded-lg font-black uppercase"
                  :class="esSancionGrave(p) ? 'bg-red-700 text-white px-2.5 py-1 text-xs' : 'bg-red-100 text-red-800 border border-red-200 px-2 py-1 text-xs'"
                >
                  <span class="material-symbols-outlined text-[14px]">{{ esSancionGrave(p) ? 'gavel' : 'warning' }}</span>
                  {{ etiquetaPenalizacion(p) }}
                </div>
              </div>
              <div v-if="esFaseDisciplina" class="flex items-center gap-2 pl-2">
                <button v-if="banderasHabilitadas.amarilla" @click="aplicarPenalizacion(item, 'AMARILLA')" class="flex-1 py-2.5 rounded-xl bg-yellow-400 text-white flex items-center justify-center shadow-sm">
                  <span class="material-symbols-outlined text-[20px]">flag</span>
                </button>
                <button v-if="banderasHabilitadas.roja" @click="aplicarPenalizacion(item, 'ROJA')" class="flex-1 py-2.5 rounded-xl bg-red-600 text-white flex items-center justify-center shadow-sm">
                  <span class="material-symbols-outlined text-[20px]">flag</span>
                </button>
                <button @click="abrirSanciones(item)" class="flex-[2] py-2.5 rounded-xl bg-red-700 text-white flex items-center justify-center gap-2 font-black text-xs uppercase tracking-widest shadow-sm shadow-red-200">
                  <span class="material-symbols-outlined text-[18px]">gavel</span>
                  Sanciones
                </button>
              </div>
              <div v-if="item.fechaApertura" class="text-xs text-slate-500 bg-white p-2.5 rounded-lg border border-slate-100 pl-2">
                <div class="flex justify-between"><span class="font-bold">Inició:</span> <span>{{ formatearHora(item.fechaApertura) }}</span></div>
                <div class="flex justify-between mt-1" v-if="item.fechaCierre"><span class="font-bold">Finalizó:</span> <span>{{ formatearHora(item.fechaCierre) }}</span></div>
              </div>
              <div class="flex items-center gap-2 pt-2 border-t border-slate-200 mt-1 pl-2">
                <template v-if="item.urlPdf">
                  <button @click="verPdf(item.urlPdf, item.nombre)" class="flex-1 inline-flex items-center justify-center gap-1 py-3 rounded-xl bg-indigo-50 text-indigo-600 font-bold text-sm border border-indigo-100 hover:bg-indigo-100">
                    <span class="material-symbols-outlined text-[18px]">visibility</span>
                  </button>
                </template>
                <button v-if="esAdmin" type="button" @click="abrirPanelAdmin(item.idFraternidad)" class="flex-1 inline-flex items-center justify-center gap-1 py-3 rounded-xl bg-amber-50 text-amber-700 font-bold text-sm border border-amber-200" title="Ver calificaciones">
                  <span class="material-symbols-outlined text-[18px]">monitoring</span>
                </button>
                <button
                  @click="iniciarEvaluacion(item)"
                  :disabled="tiempoRestante <= 0"
                  :data-tutorial="item.idFraternidad === primerPendienteId ? 'calificar' : undefined"
                  class="flex-[3] inline-flex justify-center items-center gap-2 py-3 rounded-xl font-black text-sm transition-all uppercase tracking-wide"
                  :class="tiempoRestante <= 0
                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                    : (item.estadoEvaluacion === 'EN_PROGRESO' ? 'bg-amber-500 text-white shadow-md' : 'bg-primary text-white shadow-md shadow-primary/20')"
                >
                  {{ tiempoRestante <= 0 ? 'Cerrada' : (item.estadoEvaluacion === 'EN_PROGRESO' ? 'Continuar' : 'Evaluar') }}
                  <span class="material-symbols-outlined text-[18px]">{{ tiempoRestante <= 0 ? 'lock' : (item.estadoEvaluacion === 'EN_PROGRESO' ? 'play_arrow' : 'edit_document') }}</span>
                </button>
              </div>
            </div>
          </div>
        </section>

        <!-- ========== CALIFICADAS ========== -->
        <section v-if="fraternidadesCalificadas.length" class="bg-white rounded-3xl overflow-hidden border border-slate-200 shadow-sm">
          <div class="px-4 sm:px-6 py-3.5 sm:py-3 bg-emerald-50 border-b border-emerald-100 flex items-center justify-between gap-3">
            <div class="flex items-center gap-2 min-w-0">
              <span class="material-symbols-outlined text-emerald-700 text-[22px]">verified</span>
              <h3 class="text-base sm:text-sm font-black text-emerald-900 uppercase tracking-wide truncate">Ya calificadas</h3>
            </div>
            <span class="shrink-0 px-2.5 py-1 rounded-lg bg-emerald-200/80 text-emerald-950 text-sm sm:text-xs font-black">{{ fraternidadesCalificadas.length }}</span>
          </div>

          <div class="hidden md:block overflow-x-auto">
            <table class="w-full text-left text-sm">
              <thead class="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-black text-[10px]">
                <tr>
                  <th class="px-6 py-4">Fraternidad</th>
                  <th class="px-6 py-4">Fecha solicitud</th>
                  <th class="px-6 py-4">Instancia</th>
                  <th class="px-6 py-4 text-center">Estado</th>
                  <th class="px-6 py-4 text-center">Puntaje</th>
                  <th class="px-6 py-4">Tiempos</th>
                  <th class="px-6 py-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                <tr
                  v-for="item in fraternidadesCalificadas"
                  :key="'c-' + item.idFraternidad"
                  class="transition-colors opacity-90"
                  :class="tieneSancionGrave(item) ? 'bg-red-50/80 hover:bg-red-50' : 'hover:bg-slate-50'"
                >
                  <td class="px-6 py-4">
                    <p class="font-bold" :class="tieneSancionGrave(item) ? 'text-red-800' : 'text-primary'">{{ item.nombre }}</p>
                    <p class="text-xs text-slate-500">{{ item.categoria || 'Sin categoría' }}</p>
                    <div v-if="item.penalizaciones && item.penalizaciones.length > 0" class="mt-2 flex flex-wrap gap-1.5">
                      <div v-for="p in item.penalizaciones" :key="p.idIncidencia"
                        class="inline-flex items-center gap-1.5 rounded-lg font-black uppercase tracking-wide"
                        :class="esSancionGrave(p)
                          ? 'bg-red-700 text-white border border-red-900 px-2.5 py-1 text-[10px]'
                          : 'bg-red-50 border border-red-200 text-[10px] text-red-800 px-2 py-1'"
                      >
                        <span class="material-symbols-outlined text-[14px]">{{ esSancionGrave(p) ? 'gavel' : 'warning' }}</span>
                        {{ etiquetaPenalizacion(p) }}
                        <button v-if="authStore.userRole === 'admin' || authStore.userRole === 'superusuario'" @click="removerPenalizacion(item, p.idIncidencia)" class="ml-0.5" title="Remover">
                          <span class="material-symbols-outlined text-[14px]">close</span>
                        </button>
                      </div>
                    </div>
                  </td>
                  <td class="px-6 py-4"><p class="text-xs font-bold text-slate-600">{{ formatFechaSolicitud(item.fechaSolicitud) }}</p></td>
                  <td class="px-6 py-4"><p class="text-xs font-bold text-slate-600">{{ item.instanciaRepresentacion || '—' }}</p></td>
                  <td class="px-6 py-4 text-center">
                    <div class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">
                      <span class="material-symbols-outlined text-[14px]">check_circle</span>
                      Calificado
                    </div>
                  </td>
                  <td class="px-6 py-4 text-center">
                    <div class="text-lg font-black text-primary">{{ ptsMostrados(item) || 0 }} <span class="text-[10px] text-slate-400">pts</span></div>
                  </td>
                  <td class="px-6 py-4">
                    <div v-if="item.fechaApertura" class="text-xs text-slate-500 flex flex-col gap-1">
                      <p><span class="font-bold">Inició:</span> {{ formatearHora(item.fechaApertura) }}</p>
                      <p v-if="item.fechaCierre"><span class="font-bold">Finalizó:</span> {{ formatearHora(item.fechaCierre) }}</p>
                    </div>
                    <p v-else class="text-xs text-slate-400 italic">—</p>
                  </td>
                  <td class="px-6 py-4 text-right space-x-2 whitespace-nowrap">
                    <template v-if="item.urlPdf">
                      <button @click="verPdf(item.urlPdf, item.nombre)" class="inline-flex size-9 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100"><span class="material-symbols-outlined text-[20px]">visibility</span></button>
                    </template>
                    <button v-if="esAdmin" type="button" @click="abrirPanelAdmin(item.idFraternidad)" class="inline-flex size-9 items-center justify-center rounded-lg bg-amber-50 text-amber-700 border border-amber-200"><span class="material-symbols-outlined text-[20px]">monitoring</span></button>
                    <button disabled class="inline-flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-xs bg-slate-100 text-slate-400 cursor-not-allowed">
                      Nota Sellada
                      <span class="material-symbols-outlined text-[16px]">lock</span>
                    </button>
                    <template v-if="esFaseDisciplina">
                      <button v-if="banderasHabilitadas.amarilla" @click="aplicarPenalizacion(item, 'AMARILLA')" class="inline-flex size-9 items-center justify-center rounded-lg bg-yellow-400 text-white"><span class="material-symbols-outlined text-[20px]">flag</span></button>
                      <button v-if="banderasHabilitadas.roja" @click="aplicarPenalizacion(item, 'ROJA')" class="inline-flex size-9 items-center justify-center rounded-lg bg-red-600 text-white"><span class="material-symbols-outlined text-[20px]">flag</span></button>
                      <button @click="abrirSanciones(item)" class="inline-flex h-9 items-center gap-2 px-3 rounded-lg bg-red-700 text-white"><span class="material-symbols-outlined text-[18px]">gavel</span><span class="text-[10px] font-black uppercase">Sanciones</span></button>
                    </template>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="md:hidden p-4 space-y-4">
            <div
              v-for="item in fraternidadesCalificadas"
              :key="'cm-' + item.idFraternidad"
              class="rounded-2xl p-4 shadow-sm flex flex-col gap-4 relative overflow-hidden opacity-95"
              :class="tieneSancionGrave(item) ? 'bg-red-50 border-2 border-red-600' : 'bg-slate-50 border border-slate-200'"
            >
              <div class="absolute left-0 top-0 bottom-0 w-1.5 bg-emerald-500" />
              <div class="flex justify-between items-start pl-2 gap-3">
                <div class="min-w-0">
                  <p class="font-black text-lg leading-tight" :class="tieneSancionGrave(item) ? 'text-red-800' : 'text-primary'">{{ item.nombre }}</p>
                  <p class="text-sm text-slate-500 mt-0.5">{{ item.categoria || 'Sin categoría' }}</p>
                </div>
                <div class="text-right shrink-0">
                  <p class="text-2xl font-black leading-none text-primary">{{ ptsMostrados(item) || 0 }}</p>
                  <p class="text-xs text-slate-400 font-bold uppercase mt-0.5">pts</p>
                </div>
              </div>
              <div class="flex flex-wrap gap-2 pl-2">
                <div class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black uppercase tracking-wide bg-emerald-100 text-emerald-700 border border-emerald-200">
                  <span class="material-symbols-outlined text-[16px]">check_circle</span>
                  Calificado
                </div>
              </div>
              <div v-if="esFaseDisciplina" class="flex items-center gap-2 pl-2">
                <button v-if="banderasHabilitadas.amarilla" @click="aplicarPenalizacion(item, 'AMARILLA')" class="flex-1 py-2.5 rounded-xl bg-yellow-400 text-white flex items-center justify-center"><span class="material-symbols-outlined text-[20px]">flag</span></button>
                <button v-if="banderasHabilitadas.roja" @click="aplicarPenalizacion(item, 'ROJA')" class="flex-1 py-2.5 rounded-xl bg-red-600 text-white flex items-center justify-center"><span class="material-symbols-outlined text-[20px]">flag</span></button>
                <button @click="abrirSanciones(item)" class="flex-[2] py-2.5 rounded-xl bg-red-700 text-white flex items-center justify-center gap-2 font-black text-xs uppercase"><span class="material-symbols-outlined text-[18px]">gavel</span>Sanciones</button>
              </div>
              <div class="flex items-center gap-2 pt-2 border-t border-slate-200 pl-2">
                <button v-if="esAdmin" type="button" @click="abrirPanelAdmin(item.idFraternidad)" class="flex-1 inline-flex items-center justify-center py-3 rounded-xl bg-amber-50 text-amber-700 border border-amber-200"><span class="material-symbols-outlined text-[18px]">monitoring</span></button>
                <button disabled class="flex-[3] inline-flex justify-center items-center gap-2 py-3 rounded-xl font-black text-sm uppercase bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed">
                  Sellada <span class="material-symbols-outlined text-[18px]">lock</span>
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>
      </div>
    </div>

    <!-- VISOR PDF COMPONENTE -->
    <PdfViewerModal 
      v-if="visorPdfAbierto" 
      :url="pdfUrlActual" 
      :titulo="pdfTituloActual"
      @cerrar="visorPdfAbierto = false" 
    />

    <ModalResumenCalificacionesAdmin
      v-if="modalResumenAdmin"
      :key="modalAdminKey"
      v-model="modalResumenAdmin"
      :id-fase="props.faseSeleccionada.idFase"
      :nombre-fase="fase?.nombre || props.faseSeleccionada?.nombre"
      tipo-concurso="EFU"
      :initial-id-fraternidad="resumenAdminIdFraternidad"
      @actas-cerradas="cargarFaseData"
    />

    <!-- MODAL DE SANCIONES GRAVES -->
    <v-dialog v-model="modalSanciones" max-width="600" max-height="90dvh" scrollable persistent>
      <v-card class="rounded-2xl overflow-hidden border-4 border-red-800 flex flex-col max-h-[90dvh]">
        <div class="bg-red-800 p-6 text-white text-center relative shrink-0">
          <button @click="modalSanciones = false" class="absolute right-4 top-4 size-8 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors">
            <span class="material-symbols-outlined text-xl text-white">close</span>
          </button>
          <div class="size-16 bg-white/15 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-white/30">
            <span class="material-symbols-outlined text-4xl text-white">gavel</span>
          </div>
          <h3 class="text-2xl font-black italic uppercase tracking-tighter">Sanciones graves</h3>
          <p class="text-white/80 text-xs font-bold mt-1 uppercase tracking-widest">{{ fraternidadParaSancion?.nombre }}</p>
        </div>

        <v-card-text class="pa-6 sm:pa-8 bg-red-50 overflow-y-auto flex-1 min-h-0 custom-scrollbar">
          <p class="text-red-900 text-sm mb-6 font-medium leading-relaxed">
            Seleccione una sanción del catálogo (valores dinámicos por gestión).
            <b class="uppercase">Impactan la nota final EFU</b> (todas las fases), no el puntaje de la fase Disciplina.
          </p>
          
          <div class="grid gap-3">
            <button v-for="s in sancionesCatalogo" :key="s.idInfraccion"
              @click="preconfirmarSancion(s)"
              class="w-full p-4 rounded-xl border-2 border-red-200 bg-white hover:border-red-700 hover:bg-red-100 text-left transition-all flex items-center gap-4 group"
            >
              <div class="size-11 rounded-lg bg-red-100 group-hover:bg-red-700 flex items-center justify-center text-red-700 group-hover:text-white shrink-0">
                <span class="material-symbols-outlined">{{ iconoInfraccion(s) }}</span>
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-sm font-black text-red-950">{{ s.nombre }}</p>
                <p class="text-[10px] text-red-700 uppercase tracking-widest font-black mt-0.5">
                  {{ etiquetaImpactoInfraccion(s) }}
                </p>
              </div>
              <span class="material-symbols-outlined text-red-300 group-hover:text-red-700 shrink-0">chevron_right</span>
            </button>
            <p v-if="!sancionesCatalogo.length" class="text-sm text-red-700/80 text-center py-4">
              No hay infracciones en el catálogo. {{ esAdmin ? 'Crea una abajo.' : 'Contacta al administrador.' }}
            </p>
          </div>

          <div v-if="esAdmin" class="mt-6 pt-5 border-t border-red-200 space-y-3">
            <p class="text-[10px] font-black uppercase tracking-widest text-red-800">Nueva infracción (catálogo)</p>
            <input
              v-model="nuevaInfraccion.nombre"
              type="text"
              placeholder="Nombre / motivo"
              class="w-full px-3 py-2.5 rounded-xl border border-red-200 bg-white text-sm font-medium outline-none focus:border-red-500"
            />
            <div class="grid grid-cols-2 gap-2">
              <select v-model="nuevaInfraccion.tipoImpacto" class="px-3 py-2.5 rounded-xl border border-red-200 bg-white text-sm font-bold">
                <option value="RESTA_PUNTOS">Resta puntos</option>
                <option value="SUSPENSION">Suspensión</option>
              </select>
              <input
                v-model.number="nuevaInfraccion.valorImpacto"
                type="number"
                step="0.01"
                placeholder="Impacto (ej. -5)"
                class="px-3 py-2.5 rounded-xl border border-red-200 bg-white text-sm font-bold"
              />
            </div>
            <button
              type="button"
              :disabled="guardandoInfraccion || !nuevaInfraccion.nombre?.trim()"
              @click="crearInfraccionCatalogo"
              class="w-full py-2.5 rounded-xl bg-slate-800 text-white text-[10px] font-black uppercase tracking-widest disabled:opacity-40"
            >
              {{ guardandoInfraccion ? 'Guardando…' : 'Agregar al catálogo' }}
            </button>
          </div>
        </v-card-text>

        <v-card-actions class="pa-4 sm:pa-6 bg-white border-t border-red-100 shrink-0">
          <v-btn block height="48" variant="tonal" color="error" class="rounded-xl font-bold" @click="modalSanciones = false">Cancelar</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- MODAL DE CONFIRMACIÓN CON CUENTA REGRESIVA -->
    <v-dialog v-model="modalConfirmacion" max-width="450" persistent>
      <v-card class="rounded-2xl border-4 border-red-600">
        <div class="bg-red-600 p-6 text-white text-center">
          <h3 class="text-2xl font-black italic uppercase tracking-tighter">¿Está Seguro?</h3>
          <p class="text-white/80 text-xs font-bold mt-2">ESTA ACCIÓN NO SE PUEDE DESHACER</p>
        </div>
        
        <v-card-text class="pa-8 text-center bg-red-50">
          <p class="text-red-950 font-black text-lg mb-2">{{ sancionSeleccionada?.nombre || sancionSeleccionada?.titulo }}</p>
          <p class="text-red-800 text-sm mb-2 font-bold uppercase tracking-widest">{{ etiquetaImpactoInfraccion(sancionSeleccionada) || sancionSeleccionada?.penalidad }}</p>
          <p class="text-red-700/80 text-sm mb-6">Se aplicará esta infracción del catálogo al puntaje final de la fraternidad.</p>

          <div v-if="contador > 0" class="size-16 rounded-full border-4 border-slate-100 flex items-center justify-center mx-auto mb-4">
             <span class="text-2xl font-black text-primary">{{ contador }}</span>
          </div>
          <p v-if="contador > 0" class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Espere para confirmar...</p>
        </v-card-text>

        <v-card-actions class="pa-6 pt-0 bg-white flex flex-col gap-2">
          <button
            :disabled="contador > 0 || cargandoSancion"
            @click="confirmarSancion"
            class="w-full h-[52px] rounded-xl font-black shadow-lg transition-all flex items-center justify-center text-sm uppercase tracking-widest"
            :class="contador > 0 
              ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
              : 'bg-red-600 text-white hover:bg-red-700 active:scale-95'"
          >
            {{ cargandoSancion ? 'Aplicando...' : 'Confirmar Sanción' }}
          </button>
          
          <button 
            @click="modalConfirmacion = false"
            class="w-full h-[48px] text-slate-500 font-bold text-sm hover:text-slate-800 transition-colors"
          >
            Arrepentirse y Cancelar
          </button>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import Swal from 'sweetalert2'
import api from '../services/api'
import PdfViewerModal from '../components/PdfViewerModal.vue'
import ModalResumenCalificacionesAdmin from '../components/ModalResumenCalificacionesAdmin.vue'
import TutorialCalificarModal from '../components/TutorialCalificarModal.vue'
import { getImageUrl } from '../utils/url'
import { useAuthStore } from '../store/auth'
import { ORDEN_CRITERIOS, formatFechaSolicitud, ordenarListado, ordenarPendientesCalificacion, ordenarCalificadosAlFinal } from '../utils/ordenListado'
import { TUTORIAL_VARIANT, hasSeenTutorial } from '../utils/tutorialCalificar'

const authStore = useAuthStore()
const esAdmin = computed(() => ['admin', 'superusuario'].includes(authStore.userRole))
const props = defineProps({
  faseSeleccionada: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['volver', 'evaluar-fraternidad'])

const tutorialVariant = TUTORIAL_VARIANT.LISTADO_EFU
const tutorialAbierto = ref(false)
function abrirTutorial() {
  tutorialAbierto.value = true
}

const fase = ref(null)
const fraternidades = ref([])
const busqueda = ref('')
const loading = ref(true)
const ordenCriterio = ref('ordenOficial')
const ordenDir = ref('asc')
const opcionesOrden = ORDEN_CRITERIOS

const setOrden = (id) => {
  if (ordenCriterio.value === id) {
    ordenDir.value = ordenDir.value === 'asc' ? 'desc' : 'asc'
  } else {
    ordenCriterio.value = id
    ordenDir.value = 'asc'
  }
}

const fraternidadesFiltradas = computed(() => {
  const q = busqueda.value.trim().toLowerCase()
  let list = fraternidades.value
  if (q) {
    list = list.filter((f) => {
      const haystack = [f.nombre, f.categoria, f.instanciaRepresentacion]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      return haystack.includes(q)
    })
  }
  return ordenarListado(list, ordenCriterio.value, ordenDir.value, {
    fecha: (x) => x.fechaSolicitud,
    nombre: (x) => x.nombre,
    instancia: (x) => x.instanciaRepresentacion,
    orden: (x) => x.ordenDesfile,
    id: (x) => x.idFraternidad,
  })
})

const estaCalificado = (item) => item?.estadoEvaluacion === 'COMPLETADO'

const fraternidadesPendientes = computed(() =>
  ordenarPendientesCalificacion(
    fraternidadesFiltradas.value.filter((f) => !estaCalificado(f)),
  ),
)
const fraternidadesCalificadas = computed(() =>
  ordenarCalificadosAlFinal(
    fraternidadesFiltradas.value.filter((f) => estaCalificado(f)),
  ),
)

const primerPendienteId = computed(
  () => fraternidadesPendientes.value[0]?.idFraternidad ?? fraternidadesFiltradas.value[0]?.idFraternidad,
)

// Temporizador Regresivo Global
const tiempoRestante = ref(0)
let timerInterval = null

// PDF Visor
const visorPdfAbierto = ref(false)
const pdfUrlActual = ref('')
const pdfTituloActual = ref('')

// Resumen calificaciones (admin)
const modalResumenAdmin = ref(false)
const modalAdminKey = ref(0)
const resumenAdminIdFraternidad = ref(null)

const abrirPanelAdmin = (idFraternidad = null) => {
  resumenAdminIdFraternidad.value = idFraternidad
  modalAdminKey.value += 1
  modalResumenAdmin.value = true
}

// Disciplina / Sanciones
const modalSanciones = ref(false)
const modalConfirmacion = ref(false)
const fraternidadParaSancion = ref(null)
const sancionSeleccionada = ref(null)
const contador = ref(5)
const cargandoSancion = ref(false)
let countdownInterval = null

const sancionesCatalogo = ref([])
const nuevaInfraccion = ref({ nombre: '', tipoImpacto: 'RESTA_PUNTOS', valorImpacto: -1 })
const guardandoInfraccion = ref(false)
const banderasHabilitadas = ref({ amarilla: true, roja: true })

const esFaseDisciplina = computed(() =>
  String(fase.value?.nombre || props.faseSeleccionada?.nombre || '')
    .toLowerCase()
    .includes('disciplina'),
)

const ptsMostrados = (item) => {
  if (esFaseDisciplina.value && item.puntajeFaseMerged != null) {
    return item.puntajeFaseMerged
  }
  return item.puntajeActual ?? item.puntajeFase ?? 0
}

const esSancionGrave = (p) => p?.tipoImpacto === 'SUSPENSION' || Number(p?.valor) <= -10
const tieneSancionGrave = (item) => (item?.penalizaciones || []).some(esSancionGrave)
const etiquetaPenalizacion = (p) => {
  if (!p) return ''
  if (p.tipoImpacto === 'SUSPENSION') return p.nombre
  if (Number(p.valor)) return `${p.nombre} (${p.valor})`
  return p.nombre
}

const etiquetaImpactoInfraccion = (s) => {
  if (!s) return ''
  if (s.tipoImpacto === 'SUSPENSION') return 'Suspensión'
  const v = Number(s.valorImpacto)
  if (Number.isFinite(v) && v !== 0) return `${v > 0 ? '+' : ''}${v} pts`
  return s.penalidad || 'Sin descuento numérico'
}

const iconoInfraccion = (s) => {
  const n = String(s?.nombre || '').toLowerCase()
  if (n.includes('alcohol')) return 'local_bar'
  if (n.includes('agres')) return 'person_off'
  if (n.includes('banda') || n.includes('músic')) return 'music_off'
  if (n.includes('ajeno')) return 'group_remove'
  if (n.includes('roja')) return 'flag'
  if (n.includes('amarilla')) return 'flag'
  return 'gavel'
}

const cargarInfracciones = async () => {
  // Solo fase disciplina / roles con acceso al catálogo; evita 403 ruidoso en calificar normal
  const rol = String(authStore.userRole || '').toLowerCase()
  const puedeCatalogo = ['admin', 'superusuario', 'controladorhcu', 'jurado'].includes(rol)
  const esDisciplina = String(props.faseSeleccionada?.nombre || '').toLowerCase().includes('disciplina')
  if (!puedeCatalogo || (!esDisciplina && !['admin', 'superusuario', 'controladorhcu'].includes(rol))) {
    sancionesCatalogo.value = []
    return
  }
  try {
    const { data } = await api.get('/evaluaciones/infracciones')
    const items = data.items || []
    // En el modal de sanciones graves: excluir banderas (tienen botones propios)
    sancionesCatalogo.value = items.filter(
      (i) => i.codigoPreset !== 'AMARILLA' && i.codigoPreset !== 'ROJA',
    )
  } catch (e) {
    if (e.response?.status !== 403) {
      console.error('No se pudo cargar catálogo de infracciones', e)
    }
    sancionesCatalogo.value = []
  }
}

const crearInfraccionCatalogo = async () => {
  if (!nuevaInfraccion.value.nombre?.trim()) return
  guardandoInfraccion.value = true
  try {
    await api.post('/evaluaciones/infracciones', {
      nombre: nuevaInfraccion.value.nombre.trim(),
      tipoImpacto: nuevaInfraccion.value.tipoImpacto,
      valorImpacto: Number(nuevaInfraccion.value.valorImpacto) || 0,
    })
    nuevaInfraccion.value = { nombre: '', tipoImpacto: 'RESTA_PUNTOS', valorImpacto: -1 }
    await cargarInfracciones()
    Swal.fire('Catálogo', 'Infracción agregada. Ya se puede aplicar a fraternidades.', 'success')
  } catch (e) {
    Swal.fire('Error', e.response?.data?.message || 'No se pudo crear la infracción.', 'error')
  } finally {
    guardandoInfraccion.value = false
  }
}

const cargarFaseData = async () => {
  loading.value = true
  try {
    const { data } = await api.get(`/evaluaciones/fase/${props.faseSeleccionada.idFase}/fraternidades`)
    fase.value = data.fase
    fraternidades.value = data.listado
    banderasHabilitadas.value = {
      amarilla: data.banderas?.amarilla !== false,
      roja: data.banderas?.roja !== false,
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
        if (isEnd) {
          return new Date(year, month, day, 23, 59, 59, 999)
        }
        return new Date(year, month, day, 0, 0, 0, 0)
      }
      return new Date(d)
    }

    const fechaFin = parseSafeDate(props.faseSeleccionada.fechaFin, true)
    if (fechaFin) {
      iniciarCronometro(fechaFin)
    }
    lanzarModalBienvenida(props.faseSeleccionada)
  } catch (err) {
    Swal.fire('Error', 'No se pudo cargar el listado. Intente de nuevo.', 'error')
    emit('volver')
  } finally {
    loading.value = false
  }
}

const iniciarCronometro = (fechaFin) => {
  if (!fechaFin || isNaN(fechaFin.getTime())) return
  const actualizar = () => {
    const ahora = new Date().getTime()
    const fin = fechaFin.getTime()
    tiempoRestante.value = Math.max(0, fin - ahora)
  }
  
  actualizar() // primera vez
  timerInterval = setInterval(actualizar, 1000)
}

const countdownText = computed(() => {
  if (isNaN(tiempoRestante.value) || tiempoRestante.value <= 0) return 'TIEMPO FINALIZADO'
  
  const dias = Math.floor(tiempoRestante.value / (1000 * 60 * 60 * 24))
  const horas = Math.floor((tiempoRestante.value % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const min = Math.floor((tiempoRestante.value % (1000 * 60 * 60)) / (1000 * 60))
  return `${dias} Días / ${horas} Hrs / ${min} Min`
})

const urgenciaStatus = computed(() => {
  if (isNaN(tiempoRestante.value)) return { bgClass: 'bg-slate-50 border-slate-200', textClass: 'text-slate-400' }
  const dias = Math.floor(tiempoRestante.value / (1000 * 60 * 60 * 24))
  if (dias <= 1) return { bgClass: 'bg-secondary/10 border-secondary', textClass: 'text-secondary' }
  if (dias <= 2) return { bgClass: 'bg-orange-50 border-orange-200', textClass: 'text-orange-600' }
  return { bgClass: 'bg-emerald-50 border-emerald-200', textClass: 'text-emerald-700' }
})

const urgenteIcon = (fFin) => {
  if (!fFin) return 'info'
  const dias = Math.floor(Math.max(0, fFin.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
  return dias <= 1 ? 'warning' : 'info'
}

const lanzarModalBienvenida = (faseInfo) => {
  const key = `fase_bienvenida_${faseInfo.idFase}`
  if (sessionStorage.getItem(key)) return

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
  const fInicio = parseSafeDate(props.faseSeleccionada.fechaInicio, false)
  const fFin = parseSafeDate(props.faseSeleccionada.fechaFin, true)

  const inicioFmt = fInicio
    ? fInicio.toLocaleDateString('es-BO', { day: '2-digit', month: 'long', year: 'numeric' })
    : 'Pendiente'
  const finFmt = fFin
    ? fFin.toLocaleDateString('es-BO', { day: '2-digit', month: 'long', year: 'numeric' })
    : 'Pendiente'

  let restanteHtml = ''
  if (fFin) {
    const ms = Math.max(0, fFin.getTime() - Date.now())
    const dias = Math.floor(ms / (1000 * 60 * 60 * 24))
    const horas = Math.floor((ms % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    const min = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60))
    const urgente = dias <= 1
    restanteHtml = `
      <div style="margin-top:14px;padding:12px 14px;border-radius:12px;border:1px solid ${urgente ? '#fecaca' : '#bbf7d0'};background:${urgente ? '#fef2f2' : '#ecfdf5'};text-align:left">
        <p style="margin:0 0 4px;font-size:11px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;color:${urgente ? '#b91c1c' : '#047857'}">Tiempo restante para calificar</p>
        <p style="margin:0;font-size:18px;font-weight:900;color:${urgente ? '#991b1b' : '#065f46'}">${dias} días · ${horas} hrs · ${min} min</p>
      </div>`
  }

  Swal.fire({
    icon: urgenteIcon(fFin),
    title: 'Tiempo para calificar',
    html: `
      <p style="margin:0 0 8px;color:#475569;font-size:14px;line-height:1.45">
        Fase <b>${faseInfo.nombre || ''}</b><br>
        Del <b>${inicioFmt}</b> al <b>${finFmt}</b>.
      </p>
      <p style="margin:0;color:#64748b;font-size:13px">Cuando termine el plazo, el acceso para calificar se restringe.</p>
      ${restanteHtml}
    `,
    confirmButtonColor: '#003399',
    confirmButtonText: 'Entendido',
  }).then(() => {
    sessionStorage.setItem(key, 'true')
  })
}

const formatearHora = (fechaString) => {
  return new Date(fechaString).toLocaleString('es-BO', {
    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
  })
}

const verPdf = (url, titulo) => {
  pdfUrlActual.value = getImageUrl(url)
  pdfTituloActual.value = titulo
  visorPdfAbierto.value = true
}

const iniciarEvaluacion = (fraternidad) => {
  // Emitimos el evento hacia el Dashboard superior para cambiar la vista al Wizard
  emit('evaluar-fraternidad', {
    fase: fase.value,
    fraternidad,
    idEvaluacionGuardada: fraternidad.idEvaluacion
  })
}

// LÓGICA DE DISCIPLINA
const aplicarPenalizacion = async (fraternidad, tipo) => {
  const pts = tipo === 'AMARILLA' ? '1 punto' : '2 puntos'
  const result = await Swal.fire({
    title: tipo === 'AMARILLA' ? '¿Bandera Amarilla?' : '¿Bandera Roja?',
    text: `Se registrará sobre la nota final EFU (no altera el puntaje de la fase Disciplina). Catálogo: −${pts}.`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: tipo === 'AMARILLA' ? '#facc15' : '#dc2626',
    confirmButtonText: 'Sí, aplicar penalización',
    cancelButtonText: 'Cancelar'
  })

  if (result.isConfirmed) {
    try {
      await api.post(`/evaluaciones/fase/${fase.value.idFase}/fraternidad/${fraternidad.idFraternidad}/penalizar`, { tipo })
      Swal.fire('Aplicado', 'La penalización se registró sobre la nota final EFU.', 'success')
      cargarFaseData()
    } catch (e) {
      Swal.fire('Error', e.response?.data?.message || 'No se pudo aplicar la penalización.', 'error')
    }
  }
}

const abrirSanciones = async (fraternidad) => {
  fraternidadParaSancion.value = fraternidad
  await cargarInfracciones()
  modalSanciones.value = true
}

const preconfirmarSancion = (sancion) => {
  sancionSeleccionada.value = sancion
  contador.value = 5
  modalConfirmacion.value = true
  
  if (countdownInterval) clearInterval(countdownInterval)
  countdownInterval = setInterval(() => {
    contador.value--
    if (contador.value <= 0) clearInterval(countdownInterval)
  }, 1000)
}

const confirmarSancion = async () => {
  cargandoSancion.value = true
  try {
    const payload = sancionSeleccionada.value.idInfraccion
      ? { idInfraccion: sancionSeleccionada.value.idInfraccion }
      : { tipo: sancionSeleccionada.value.tipo || sancionSeleccionada.value.codigoPreset }
    await api.post(
      `/evaluaciones/fase/${fase.value.idFase}/fraternidad/${fraternidadParaSancion.value.idFraternidad}/penalizar`,
      payload,
    )
    modalConfirmacion.value = false
    modalSanciones.value = false
    Swal.fire('Sanción Aplicada', 'Se ha registrado la sanción en el puntaje final.', 'error')
    cargarFaseData()
  } catch (e) {
    Swal.fire('Error', e.response?.data?.message || 'No se pudo aplicar la sanción.', 'error')
  } finally {
    cargandoSancion.value = false
  }
}

const removerPenalizacion = async (fraternidad, idIncidencia) => {
  const result = await Swal.fire({
    title: '¿Remover Penalización?',
    text: 'Esta acción revertirá el descuento de puntos. Solo debe hacerse en caso de error.',
    icon: 'question',
    showCancelButton: true,
    confirmButtonColor: '#334155',
    confirmButtonText: 'Sí, remover',
    cancelButtonText: 'Cancelar'
  })

  if (result.isConfirmed) {
    try {
      await api.delete(`/evaluaciones/fase/${fase.value.idFase}/fraternidad/${fraternidad.idFraternidad}/penalizaciones/${idIncidencia}`)
      Swal.fire('Removida', 'La penalización fue eliminada.', 'success')
      cargarFaseData()
    } catch (e) {
      Swal.fire('Error', 'No se pudo remover la penalización.', 'error')
    }
  }
}

onMounted(() => {
  cargarFaseData()
  cargarInfracciones()
})

watch(loading, (isLoading) => {
  if (!isLoading && !hasSeenTutorial(tutorialVariant)) {
    tutorialAbierto.value = true
  }
})

onUnmounted(() => {
  if (timerInterval) clearInterval(timerInterval)
})
</script>

<style scoped>
.custom-scrollbar {
  scrollbar-width: thin;
  scrollbar-color: #cbd5e1 transparent;
}

.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 10px;
}
</style>
