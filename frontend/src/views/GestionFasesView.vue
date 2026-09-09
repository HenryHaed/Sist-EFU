<template>
  <div class="dashboard-page max-w-7xl">

    <!-- Breadcrumb / volver -->
    <button v-if="gestionSeleccionada" @click="$emit('volver')" class="flex items-center gap-2 text-slate-500 hover:text-primary font-bold text-sm mb-6 transition-all group">
      <span class="material-symbols-outlined text-[20px] group-hover:-translate-x-1 transition-transform">arrow_back</span>
      Todas las Gestiones
    </button>

    <!-- Header -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
      <div>
        <p class="text-[10px] uppercase font-black tracking-widest text-primary/60 mb-1">
          {{ gestionSeleccionada ? `Gestión ${gestionSeleccionada.anio}` : 'Fases de la Gestión Activa' }}
        </p>
        <h2 class="dashboard-page-title text-primary tracking-tighter uppercase italic">Fases de Evaluación</h2>
        <p class="text-slate-500 text-sm mt-1" v-if="resumen.gestion?.lema">"{{ resumen.gestion.lema }}"</p>
      </div>
      <button
        @click="abrirModal()"
        class="w-full sm:w-auto bg-primary hover:bg-blue-900 text-white px-6 py-3 rounded-xl font-black transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
      >
        <span class="material-symbols-outlined">add_circle</span>
        Nueva Fase
      </button>
    </div>

    <!-- Resumen Presupuesto EFU -->
    <div class="mb-6 bg-white border border-slate-200 rounded-2xl px-4 sm:px-6 py-4 sm:py-5 flex flex-wrap items-center gap-6 sm:gap-8 shadow-sm">
      <div>
        <p class="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Presupuesto EFU Total</p>
        <div class="flex items-end gap-2">
          <p class="text-4xl font-black text-primary">
            {{ resumen.pesoEFUTotal || 0 }}%
          </p>
          <p class="text-sm text-slate-400 font-bold pb-1">/ 100%</p>
        </div>
        <div class="mt-2 h-2 w-48 bg-slate-100 rounded-full overflow-hidden">
          <div
            class="h-full rounded-full transition-all duration-500 bg-primary"
            :style="{ width: Math.min(resumen.pesoEFUTotal || 0, 100) + '%' }"
          ></div>
        </div>
      </div>
      <div class="flex gap-6">
        <div class="text-center">
          <p class="text-2xl font-black text-primary">{{ resumen.fases?.filter(f => f.tipoConcurso === 'EFU').length || 0 }}</p>
          <p class="text-[10px] uppercase font-black text-slate-400 tracking-widest">Fases EFU</p>
        </div>
        <div class="text-center">
          <p class="text-2xl font-black text-secondary">{{ resumen.fases?.filter(f => f.tipoConcurso === 'EXTERNO').length || 0 }}</p>
          <p class="text-[10px] uppercase font-black text-slate-400 tracking-widest">Concursos Externos</p>
        </div>
        <div class="text-center">
          <p class="text-2xl font-black text-slate-600">
            {{ resumen.disponibleEFU ?? 100 }}%
          </p>
          <p class="text-[10px] uppercase font-black text-slate-400 tracking-widest">EFU Disponible</p>
        </div>
      </div>
    </div>

    <!-- Cargando -->
    <div v-if="cargando" class="flex items-center justify-center py-16 text-slate-400">
      <v-progress-circular indeterminate color="primary" size="36" class="mr-3"></v-progress-circular>
      <span class="font-bold">Cargando fases...</span>
    </div>

    <!-- Tabla de Fases -->
    <div v-else class="bg-white rounded-3xl overflow-hidden border border-slate-200 shadow-sm">
      <div v-if="!resumen.fases?.length" class="text-center py-16 text-slate-400">
        <span class="material-symbols-outlined text-5xl mb-3 block">layers</span>
        <p class="font-bold">No hay fases configuradas aún.</p>
        <p class="text-sm mt-1">Crea la primera fase de esta gestión.</p>
      </div>
      
      <!-- Vista Desktop (Tabla) -->
      <div v-else class="hidden md:block overflow-x-auto">
        <table class="w-full text-left text-sm">
          <thead class="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-black text-[10px]">
          <tr>
            <th class="px-6 py-4">Fase</th>
            <th class="px-6 py-4">Tipo</th>
            <th class="px-6 py-4">Ponderación</th>
            <th class="px-6 py-4">Calificación / Inscripción</th>
            <th class="px-6 py-4">Estado</th>
            <th class="px-6 py-4">Jurados</th>
            <th class="px-6 py-4 text-right">Acciones</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100">
          <tr v-for="fase in resumen.fases" :key="fase.idFase" class="hover:bg-slate-50 transition-colors">
            <td class="px-6 py-4">
              <div class="flex items-center gap-3">
                <div class="size-10 bg-slate-100 rounded-xl overflow-hidden border border-slate-200 flex-shrink-0">
                  <img v-if="fase.urlImagen" :src="getImageUrl(fase.urlImagen)" class="size-full object-cover" />
                  <div v-else class="size-full flex items-center justify-center text-slate-300">
                    <span class="material-symbols-outlined text-[18px]">layers</span>
                  </div>
                </div>
                <span class="font-bold text-primary italic">{{ fase.nombre }}</span>
                <p v-if="fase.cupoFinalistas" class="text-[9px] font-black uppercase tracking-widest text-amber-700 mt-0.5">
                  Cupo finalistas: {{ fase.cupoFinalistas }}
                </p>
                <p v-if="fase.idFaseHija" class="text-[9px] font-black uppercase tracking-widest text-emerald-700 mt-0.5">
                  Fase hija: {{ fase.faseHijaNombre || ('#' + fase.idFaseHija) }}
                </p>
                <p v-if="fase.idFasePadre" class="text-[9px] font-black uppercase tracking-widest text-slate-400 mt-0.5">
                  Hereda de: {{ fase.fasePadreNombre || ('#' + fase.idFasePadre) }}
                </p>
              </div>
            </td>
            <td class="px-6 py-4">
              <span v-if="fase.tipoConcurso === 'EFU'"
                class="inline-flex items-center gap-1.5 bg-blue-50 text-primary border border-primary/20 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                <span class="size-1.5 bg-primary rounded-full"></span>EFU
              </span>
              <span v-else
                class="inline-flex items-center gap-1.5 bg-red-50 text-secondary border border-secondary/20 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                <span class="size-1.5 bg-secondary rounded-full"></span>Externo
              </span>
            </td>
            <td class="px-6 py-4">
              <span class="bg-slate-50 text-slate-700 border-slate-200 px-3 py-1 rounded-full font-black text-xs border">
                {{ fase.pesoPorcentaje }}%
              </span>
            </td>
            <td class="px-6 py-4 text-xs text-slate-600 font-medium">
              <div class="flex flex-col gap-1.5">
                <div class="flex flex-col gap-0.5">
                  <span class="text-[9px] font-black text-slate-400 uppercase">Calificación</span>
                  <span>Desde {{ fmtFecha(fase.fechaInicio) }}</span>
                  <span>Hasta {{ fmtFecha(fase.fechaFin) }}</span>
                </div>
                <div v-if="fase.tipoConcurso === 'EXTERNO'" class="flex flex-col gap-0.5 pt-1 border-t border-slate-100">
                  <span class="text-[9px] font-black text-secondary uppercase">Inscripción</span>
                  <span v-if="fase.fechaInicioInscripcion && fase.fechaFinInscripcion">
                    Desde {{ fmtFecha(fase.fechaInicioInscripcion) }} · Hasta {{ fmtFecha(fase.fechaFinInscripcion) }}
                  </span>
                  <span v-else class="text-slate-400 italic">Sin ventana definida (abierta)</span>
                </div>
              </div>
            </td>
            <td class="px-6 py-4">
              <div :class="fase.estaActiva ? 'bg-primary/10 text-primary' : 'bg-slate-100 text-slate-500'"
                class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-slate-200">
                <span class="size-1.5 rounded-full" :class="fase.estaActiva ? 'bg-primary animate-pulse' : 'bg-slate-400'"></span>
                {{ fase.estaActiva ? 'Activa' : 'Inactiva' }}
              </div>
            </td>
            <td class="px-6 py-4">
              <div class="flex items-center gap-2">
                <div class="flex -space-x-2">
                  <div v-for="j in (fase.jurados || []).slice(0,3)" :key="j.idJurado"
                    class="size-7 rounded-full bg-primary/10 border-2 border-white flex items-center justify-center"
                    :title="j.usuario?.nombres || j.nombre">
                    <span class="material-symbols-outlined text-[12px] text-primary">person</span>
                  </div>
                </div>
                <span class="text-[9px] font-black text-slate-500 uppercase">
                  {{ (fase.jurados || []).length }} jurado{{ (fase.jurados || []).length !== 1 ? 's' : '' }}
                </span>
                <button v-if="esGestionActiva"
                  @click="abrirModalJurados(fase)"
                  class="ml-1 px-2 py-1 bg-slate-100 hover:bg-primary hover:text-white text-slate-600 rounded-lg text-[9px] font-black uppercase transition-all flex items-center gap-1">
                  <span class="material-symbols-outlined text-[12px]">edit</span>
                  Asignar
                </button>
              </div>
            </td>
            <td class="px-6 py-4 text-right flex items-center justify-end gap-2">
              <button 
                @click="$emit('gestionar-criterios', fase)" 
                class="px-3 py-1.5 bg-primary text-white hover:bg-blue-900 rounded-lg transition-all flex items-center gap-2 shadow-sm shadow-primary/20"
              >
                <span class="material-symbols-outlined text-[18px]">rule</span>
                <span class="text-[10px] font-black uppercase tracking-widest">Editar Criterios</span>
              </button>
              <button @click="abrirModal(fase)" :disabled="!esGestionActiva"
                class="size-9 bg-slate-50 text-slate-600 hover:bg-primary hover:text-white rounded-lg transition-all border border-slate-200 shadow-sm disabled:opacity-40 disabled:cursor-not-allowed" title="Editar Fase">
                <span class="material-symbols-outlined text-[20px]">edit</span>
              </button>
              <button @click="eliminar(fase)" :disabled="!esGestionActiva"
                class="size-9 bg-slate-50 text-slate-400 hover:bg-secondary hover:text-white rounded-lg transition-all border border-slate-200 shadow-sm disabled:opacity-40 disabled:cursor-not-allowed" title="Eliminar Fase">
                <span class="material-symbols-outlined text-[20px]">delete</span>
              </button>
            </td>
          </tr>
        </tbody>
      </table>
      </div>

      <!-- Vista Mobile (Tarjetas) -->
      <div v-if="resumen.fases?.length" class="md:hidden p-4 space-y-4">
        <div v-for="fase in resumen.fases" :key="fase.idFase + '_mobile'" class="bg-slate-50 border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col gap-4 relative overflow-hidden">
          
          <!-- Indicador Estado Activa -->
          <div class="absolute left-0 top-0 bottom-0 w-1.5" :class="fase.estaActiva ? 'bg-primary' : 'bg-slate-300'"></div>

          <div class="flex items-start gap-4 pl-2">
            <div class="size-12 bg-white rounded-xl overflow-hidden border border-slate-200 flex-shrink-0">
              <img v-if="fase.urlImagen" :src="getImageUrl(fase.urlImagen)" class="size-full object-cover" />
              <div v-else class="size-full flex items-center justify-center text-slate-300">
                <span class="material-symbols-outlined text-[20px]">layers</span>
              </div>
            </div>
            <div class="flex-1">
              <p class="font-black text-primary text-base leading-tight">{{ fase.nombre }}</p>
              <div class="flex items-center gap-2 mt-1">
                <span v-if="fase.tipoConcurso === 'EFU'" class="bg-blue-50 text-primary border border-primary/20 px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest">EFU</span>
                <span v-else class="bg-red-50 text-secondary border border-secondary/20 px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest">Externo</span>
                
                <span class="bg-white text-slate-700 border border-slate-200 px-2 py-0.5 rounded font-black text-[9px]">{{ fase.pesoPorcentaje }}%</span>
              </div>
            </div>
          </div>

          <div class="pl-2 flex flex-col gap-1 text-[10px] text-slate-600 bg-white p-2 rounded-lg border border-slate-100">
            <div class="flex justify-between"><span class="font-black uppercase tracking-widest">Calif. inicio:</span> <span>{{ fmtFecha(fase.fechaInicio) }}</span></div>
            <div class="flex justify-between"><span class="font-black uppercase tracking-widest">Calif. fin:</span> <span>{{ fmtFecha(fase.fechaFin) }}</span></div>
            <template v-if="fase.tipoConcurso === 'EXTERNO'">
              <div class="flex justify-between border-t border-slate-100 pt-1 mt-0.5">
                <span class="font-black uppercase tracking-widest text-secondary">Insc. inicio:</span>
                <span>{{ fase.fechaInicioInscripcion ? fmtFecha(fase.fechaInicioInscripcion) : '—' }}</span>
              </div>
              <div class="flex justify-between">
                <span class="font-black uppercase tracking-widest text-secondary">Insc. fin:</span>
                <span>{{ fase.fechaFinInscripcion ? fmtFecha(fase.fechaFinInscripcion) : '—' }}</span>
              </div>
            </template>
          </div>

          <div class="pl-2 flex items-center justify-between">
            <div class="flex items-center gap-2">
              <span class="text-[9px] font-black text-slate-500 uppercase">{{ (fase.jurados || []).length }} jurados</span>
              <button v-if="esGestionActiva" @click="abrirModalJurados(fase)" class="px-2 py-1 bg-white border border-slate-200 hover:bg-primary hover:text-white text-slate-600 rounded text-[9px] font-black uppercase transition-all">Asignar</button>
            </div>
            <span class="text-[10px] font-black uppercase tracking-widest" :class="fase.estaActiva ? 'text-primary' : 'text-slate-400'">{{ fase.estaActiva ? 'Activa' : 'Inactiva' }}</span>
          </div>

          <!-- Acciones -->
          <div class="flex items-center gap-2 pt-2 border-t border-slate-200 mt-1 pl-2">
            <button @click="$emit('gestionar-criterios', fase)" class="flex-[2] py-2.5 bg-primary text-white hover:bg-blue-900 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all shadow-md shadow-primary/20">
              Criterios
            </button>
            <button @click="abrirModal(fase)" :disabled="!esGestionActiva" class="flex-1 py-2.5 bg-white text-slate-600 hover:bg-slate-100 rounded-xl border border-slate-200 flex justify-center disabled:opacity-40">
              <span class="material-symbols-outlined text-[18px]">edit</span>
            </button>
            <button @click="eliminar(fase)" :disabled="!esGestionActiva" class="flex-1 py-2.5 bg-white text-slate-400 hover:text-secondary hover:bg-red-50 rounded-xl border border-slate-200 flex justify-center disabled:opacity-40">
              <span class="material-symbols-outlined text-[18px]">delete</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Banner: Gestión Histórica (Solo Lectura) -->
    <div v-if="!esGestionActiva" class="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 bg-amber-600 text-white px-6 py-3 rounded-2xl shadow-xl flex items-center gap-3 text-sm font-bold">
      <span class="material-symbols-outlined text-xl">history</span>
      Modo solo lectura — Gestión histórica {{ resumen.gestion?.anio }}
    </div>

    <!-- MODAL ASIGNACIÓN JURADOS -->
    <v-dialog v-model="modalJuradosOpen" max-width="720" scrollable>
      <v-card class="rounded-2xl overflow-hidden">
        <v-card-title class="bg-slate-800 text-white pa-4 sm:pa-6 shrink-0">
          <h3 class="text-base sm:text-lg font-black italic uppercase tracking-tighter">Asignar Jurados</h3>
          <p class="text-slate-300 text-xs font-medium mt-0.5">{{ faseParaJurados?.nombre }}</p>
          <p class="text-[10px] text-slate-400 font-medium mt-1">
            {{ esFaseDisciplina(faseParaJurados) ? 'Controladores HCU' : faseParaJurados?.tipoConcurso }} ·
            {{ juradosSeleccionados.length }} seleccionado(s)
          </p>
        </v-card-title>
        <v-card-text class="pa-4 sm:pa-6">
          <div class="relative mb-3">
            <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[20px]">search</span>
            <input
              v-model="busquedaAsignacionJurados"
              type="search"
              :placeholder="esFaseDisciplina(faseParaJurados) ? 'Buscar controlador por nombre o CI…' : 'Buscar jurado por nombre o CI…'"
              class="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:border-primary"
            />
          </div>

          <div class="flex flex-col sm:flex-row gap-2 mb-4">
            <button
              type="button"
              @click="seleccionarJuradosVisibles"
              class="flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 transition-colors"
            >
              Seleccionar visibles
            </button>
            <button
              type="button"
              @click="limpiarSeleccionJurados"
              class="flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100 transition-colors"
            >
              Limpiar selección
            </button>
          </div>

          <p class="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">
            {{ esFaseDisciplina(faseParaJurados) ? controladoresFiltrados.length : juradosParaFaseFiltrados.length }}
            {{ esFaseDisciplina(faseParaJurados) ? 'controlador(es)' : 'jurado(s)' }}
            disponibles
          </p>

          <div class="space-y-2 max-h-72 sm:max-h-80 overflow-y-auto custom-scrollbar">
            <!-- LISTADO PARA DISCIPLINA (CONTROLADORES) -->
            <template v-if="esFaseDisciplina(faseParaJurados)">
              <label v-for="c in controladoresFiltrados" :key="c.idUsuario"
                class="flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all"
                :class="usuariosSeleccionados.includes(c.idUsuario)
                  ? 'border-emerald-300 bg-emerald-50/60'
                  : 'border-slate-100 hover:border-primary/30 hover:bg-primary/5'"
              >
                <input type="checkbox" :value="c.idUsuario" v-model="usuariosSeleccionados" class="size-4 accent-primary rounded mt-1 shrink-0" />
                <div class="size-8 rounded-full bg-emerald-50 flex items-center justify-center flex-shrink-0">
                  <span class="material-symbols-outlined text-[16px] text-emerald-600">shield_person</span>
                </div>
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-bold text-slate-800 truncate">{{ c.nombre }}</p>
                  <p class="text-[9px] uppercase font-black tracking-widest text-emerald-600">
                    Controlador HCU · CI: {{ c.ci }}
                  </p>
                  <p v-if="c.fasesHabilitadas?.length" class="text-[9px] text-slate-500 mt-1 truncate">
                    {{ c.fasesHabilitadas.length }} fase(s) en perfil
                  </p>
                </div>
              </label>
            </template>

            <!-- LISTADO PARA OTRAS FASES (JURADOS) -->
            <template v-else>
              <label v-for="j in juradosParaFaseFiltrados" :key="j.idJurado"
                class="flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all"
                :class="juradosSeleccionados.includes(j.idJurado)
                  ? 'border-primary/40 bg-primary/5'
                  : 'border-slate-100 hover:border-primary/30 hover:bg-primary/5'"
              >
                <input type="checkbox" :value="j.idJurado" v-model="juradosSeleccionados" class="size-4 accent-primary rounded mt-1 shrink-0" />
                <div class="size-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <span class="material-symbols-outlined text-[16px] text-primary">person</span>
                </div>
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-bold text-slate-800 truncate">{{ j.nombre }}</p>
                  <p class="text-[9px] uppercase font-black tracking-widest"
                    :class="j.tipoJurado === 'EFU' ? 'text-blue-500' : j.tipoJurado === 'EXTERNO' ? 'text-amber-500' : 'text-emerald-500'">
                    {{ j.tipoJurado }} · CI: {{ j.ci }}
                  </p>
                  <p class="text-[9px] text-slate-500 mt-1 leading-snug">
                    <span v-if="j.fasesHabilitadas?.length">{{ resumenFasesJurado(j) }}</span>
                    <span v-if="j.cantidadFraternidades > 0"> · {{ j.cantidadFraternidades }} fraternidad(es) restringidas</span>
                    <span v-else-if="j.tipoJurado !== 'EXTERNO'"> · Todas las fraternidades</span>
                  </p>
                </div>
              </label>
            </template>

            <p v-if="(!esFaseDisciplina(faseParaJurados) && juradosParaFaseFiltrados.length === 0) || (esFaseDisciplina(faseParaJurados) && controladoresFiltrados.length === 0)"
              class="text-center text-slate-400 italic text-sm py-8">
              {{ busquedaAsignacionJurados.trim() ? 'Sin resultados para la búsqueda.' : 'No hay personal registrado para este tipo de fase.' }}
            </p>
          </div>
        </v-card-text>
        <v-card-actions class="pa-4 border-t border-slate-100 bg-slate-50 flex flex-col sm:flex-row gap-2">
          <button @click="modalJuradosOpen = false" class="w-full sm:w-auto px-4 py-2.5 text-slate-500 font-bold text-sm hover:text-slate-800 transition-colors">Cancelar</button>
          <v-spacer class="hidden sm:block" />
          <button @click="guardarAsignacionJurados" :disabled="savingJurados"
            class="w-full sm:w-auto px-6 py-2.5 bg-primary text-white rounded-xl font-black text-sm shadow-lg shadow-primary/20 hover:bg-blue-900 transition-all flex items-center justify-center gap-2 disabled:opacity-60">
            <span v-if="savingJurados" class="material-symbols-outlined animate-spin text-[16px]">progress_activity</span>
            {{ savingJurados ? 'Guardando…' : 'Confirmar asignación' }}
          </button>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- MODAL CREAR / EDITAR FASE -->
    <v-dialog v-model="modalOpen" max-width="1100px" scrollable persistent>
      <v-card class="rounded-2xl flex flex-col max-h-[92vh]">
        <v-card-title class="bg-primary text-white pa-5 sm:pa-6 shrink-0">
          <div class="flex items-start justify-between gap-3 w-full">
            <div>
              <h3 class="text-xl sm:text-2xl font-black italic uppercase tracking-tighter">{{ editandoId ? 'Editar Fase' : 'Nueva Fase' }}</h3>
              <p class="text-blue-200 text-xs font-medium mt-0.5">Gestión {{ resumen.gestion?.anio }} · completa todos los datos necesarios</p>
            </div>
            <button type="button" @click="modalOpen = false" class="text-white/80 hover:text-white shrink-0">
              <span class="material-symbols-outlined">close</span>
            </button>
          </div>
        </v-card-title>

        <v-card-text class="pa-5 sm:pa-6 overflow-y-auto flex-1 min-h-0">
          <div class="space-y-6">
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <div>
                <label class="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Nombre de la Fase *</label>
                <input
                  v-model="form.nombre"
                  type="text"
                  placeholder="Ej: Primer Convite, Fotografía, Chacha Warmi…"
                  class="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-xl focus:border-primary outline-none font-bold transition-all"
                />
              </div>
              <div>
                <label class="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Categoría *</label>
                <div class="grid grid-cols-2 gap-3">
                  <button type="button" @click="form.tipoConcurso = 'EFU'; resetRequisitosSiEfu()"
                    :class="form.tipoConcurso === 'EFU' ? 'border-primary bg-primary/5 text-primary' : 'border-slate-200 text-slate-400 hover:border-primary/30'"
                    class="flex flex-col items-center gap-1.5 border-2 rounded-xl py-3 px-2 transition-all">
                    <span class="material-symbols-outlined text-xl">school</span>
                    <p class="text-[10px] font-black uppercase tracking-widest">EFU</p>
                  </button>
                  <button type="button" @click="onSeleccionarExterno()"
                    :class="form.tipoConcurso === 'EXTERNO' ? 'border-secondary bg-secondary/5 text-secondary' : 'border-slate-200 text-slate-400 hover:border-secondary/30'"
                    class="flex flex-col items-center gap-1.5 border-2 rounded-xl py-3 px-2 transition-all">
                    <span class="material-symbols-outlined text-xl">emoji_events</span>
                    <p class="text-[10px] font-black uppercase tracking-widest">Externo</p>
                  </button>
                </div>
              </div>
            </div>

            <div v-if="form.tipoConcurso === 'EXTERNO' && esFaseHijaForm" class="border-2 border-emerald-100 bg-emerald-50/60 rounded-2xl p-4 sm:p-5 space-y-3">
              <div class="flex items-start gap-3">
                <span class="material-symbols-outlined text-emerald-700 text-2xl">account_tree</span>
                <div>
                  <p class="text-[11px] font-black uppercase tracking-widest text-emerald-800">Fase hija · hereda finalistas</p>
                  <p class="text-[12px] text-slate-600 font-medium mt-1 leading-relaxed">
                    No pide documentos ni inscripción propia. Los inscritos llegan al promover los
                    <b>N finalistas</b> desde la fase padre
                    <template v-if="form.fasePadreNombre"> (<b>{{ form.fasePadreNombre }}</b>)</template>.
                    El enlace lo define la fase padre en su modal.
                  </p>
                </div>
              </div>
              <label
                v-if="!form.idFasePadre"
                class="flex items-center gap-2.5 cursor-pointer select-none"
              >
                <input type="checkbox" v-model="form.heredaFinalistas" class="size-4 accent-emerald-700" />
                <span class="text-xs font-bold text-slate-700">Confirmar: esta fase hereda finalistas (sin requisitos de inscripción)</span>
              </label>
            </div>

            <div v-if="form.tipoConcurso === 'EXTERNO' && !esFaseHijaForm" class="border-2 border-amber-100 bg-amber-50/50 rounded-2xl p-4 sm:p-5 space-y-5">
              <div>
                <label class="block text-[10px] font-black uppercase tracking-widest text-amber-800 mb-2">Plantilla base *</label>
                <p class="text-[10px] text-amber-900/80 font-medium mb-3 leading-relaxed">
                  Elige una plantilla y luego <b>agrega o quita</b> campos/documentos del catálogo según necesites.
                  Fotografía/Otros → rol concursante · Chacha Warmi → delegado.
                </p>
                <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <button
                    v-for="p in plantillasMeta"
                    :key="p.id"
                    type="button"
                    @click="aplicarPlantilla(p.id)"
                    class="text-left border-2 rounded-xl p-3.5 transition-all"
                    :class="form.plantillaRequisitos === p.id ? 'border-secondary bg-white shadow-sm' : 'border-slate-200 bg-white/70 hover:border-secondary/40'"
                  >
                    <p class="text-[10px] font-black uppercase tracking-widest text-slate-800">{{ p.etiqueta }}</p>
                    <p class="text-[9px] text-slate-500 mt-1 leading-snug">{{ p.descripcion }}</p>
                  </button>
                </div>
              </div>

              <div class="grid grid-cols-1 lg:grid-cols-2 gap-5">
                <div>
                  <div class="flex items-center justify-between gap-2 mb-2">
                    <p class="text-[10px] font-black uppercase tracking-widest text-slate-500">Campos de datos a pedir</p>
                    <span class="text-[9px] font-black uppercase tracking-widest text-primary">{{ form.clavesCampos?.length || 0 }} seleccionados</span>
                  </div>
                  <p class="text-[9px] text-slate-400 font-medium mb-2">Marca los que deben aparecer en el formulario de inscripción.</p>
                  <div class="grid grid-cols-1 gap-1.5 max-h-64 overflow-y-auto pr-1 bg-white rounded-xl border border-slate-100 p-2">
                    <label
                      v-for="c in catalogoCampos"
                      :key="c.clave"
                      class="flex items-start gap-2.5 rounded-lg p-2.5 cursor-pointer transition-colors"
                      :class="form.clavesCampos.includes(c.clave) ? 'bg-primary/5 border border-primary/20' : 'hover:bg-slate-50 border border-transparent'"
                    >
                      <input type="checkbox" class="mt-0.5 accent-primary size-4" :value="c.clave" v-model="form.clavesCampos" />
                      <span class="min-w-0">
                        <span class="text-xs font-bold text-slate-800 leading-tight block">{{ c.etiqueta }}</span>
                        <span class="text-[9px] text-slate-400 font-medium">{{ c.clave }} · {{ c.tipo }}</span>
                      </span>
                    </label>
                  </div>
                </div>

                <div>
                  <div class="flex items-center justify-between gap-2 mb-2">
                    <p class="text-[10px] font-black uppercase tracking-widest text-slate-500">Documentos / archivos</p>
                    <span class="text-[9px] font-black uppercase tracking-widest text-secondary">{{ form.clavesDocumentos?.length || 0 }} seleccionados</span>
                  </div>
                  <p class="text-[9px] text-slate-400 font-medium mb-2">PDFs, imágenes o audio que deberá subir el inscrito.</p>
                  <div class="grid grid-cols-1 gap-1.5 max-h-64 overflow-y-auto pr-1 bg-white rounded-xl border border-slate-100 p-2">
                    <label
                      v-for="d in catalogoDocumentos"
                      :key="d.clave"
                      class="flex items-start gap-2.5 rounded-lg p-2.5 cursor-pointer transition-colors"
                      :class="form.clavesDocumentos.includes(d.clave) ? 'bg-secondary/5 border border-secondary/20' : 'hover:bg-slate-50 border border-transparent'"
                    >
                      <input type="checkbox" class="mt-0.5 accent-secondary size-4" :value="d.clave" v-model="form.clavesDocumentos" />
                      <span class="min-w-0">
                        <span class="text-xs font-bold text-slate-800 leading-tight block">{{ d.etiqueta }}</span>
                        <span class="text-[9px] text-slate-400 font-medium">{{ d.clave }} · máx {{ d.maxArchivos || 1 }}</span>
                      </span>
                    </label>
                  </div>
                </div>
              </div>

              <label
                v-if="esFaseChachaWarmi({ nombre: form.nombre, plantillaRequisitos: form.plantillaRequisitos })"
                class="flex items-start gap-2.5 cursor-pointer select-none rounded-xl border border-emerald-200 bg-white/80 p-3"
              >
                <input type="checkbox" v-model="form.heredaFinalistas" class="mt-0.5 size-4 accent-emerald-700" />
                <span class="min-w-0">
                  <span class="text-xs font-black uppercase tracking-widest text-emerald-800 block">Convertir en fase hija</span>
                  <span class="text-[11px] text-slate-600 font-medium leading-relaxed">
                    Sin documentos ni inscripción. Luego la fase padre la elige como hija y hereda los N finalistas.
                  </span>
                </span>
              </label>
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-3 gap-5">
              <div>
                <div class="flex items-end justify-between mb-2">
                  <label class="text-[10px] font-black uppercase tracking-widest text-slate-500">Ponderación (%) *</label>
                  <div v-if="form.tipoConcurso === 'EFU'" class="text-[10px] font-black" :class="disponibleEFUCalc < 0 ? 'text-secondary' : 'text-primary'">
                    Disp. {{ Math.max(0, disponibleEFUCalc) }}%
                  </div>
                  <span v-else class="text-[9px] font-black text-secondary uppercase">Indep.</span>
                </div>
                <input
                  v-model.number="form.pesoPorcentaje"
                  type="number"
                  min="1"
                  max="100"
                  :class="form.tipoConcurso === 'EFU' && disponibleEFUCalc < 0 ? 'border-red-400 bg-red-50' : 'border-slate-100 bg-slate-50 focus:border-primary'"
                  class="w-full px-4 py-3 border-2 rounded-xl outline-none font-bold transition-all"
                />
                <div v-if="form.tipoConcurso === 'EFU'" class="mt-2">
                  <div class="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      class="h-full rounded-full transition-all duration-300"
                      :class="pesoEFUConActual > 100 ? 'bg-secondary' : 'bg-primary'"
                      :style="{ width: Math.min(pesoEFUConActual, 100) + '%' }"
                    ></div>
                  </div>
                </div>
              </div>
              <div>
                <label class="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Inicio calificación (jurados)</label>
                <input v-model="form.fechaInicio" type="datetime-local" class="w-full px-3 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm" />
              </div>
              <div>
                <label class="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Fin calificación (jurados)</label>
                <input v-model="form.fechaFin" type="datetime-local" class="w-full px-3 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm" />
              </div>
            </div>

            <div
              v-if="form.tipoConcurso === 'EXTERNO'"
              class="rounded-2xl border border-secondary/20 bg-red-50/40 p-4 space-y-4"
            >
              <div
                v-if="esFaseChachaWarmi({ nombre: form.nombre, plantillaRequisitos: form.plantillaRequisitos }) && !esFaseHijaForm"
                class="grid grid-cols-1 sm:grid-cols-2 gap-4"
              >
                <div>
                  <label class="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">
                    Cupo de finalistas (N)
                  </label>
                  <input
                    v-model.number="form.cupoFinalistas"
                    type="number"
                    min="1"
                    placeholder="Ej. 10"
                    class="w-full px-3 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold"
                  />
                  <p class="text-[10px] text-slate-500 mt-1 font-medium">
                    Fraternidades que pasan a la fase hija al promover.
                    Si hay empate en el cupo, el Decisor debe resolverlo antes de promover (no se puede superar el cupo).
                  </p>
                </div>
                <div>
                  <label class="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">
                    Fase hija (elige una)
                  </label>
                  <select
                    v-model="form.idFaseHija"
                    class="w-full px-3 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold"
                  >
                    <option :value="null">Ninguna</option>
                    <option
                      v-for="fh in fasesHijaOpciones"
                      :key="fh.idFase"
                      :value="fh.idFase"
                    >
                      {{ fh.nombre }}
                    </option>
                  </select>
                  <p class="text-[10px] text-slate-500 mt-1 font-medium">
                    La fase padre elige a su hija. Solo puede seleccionarse una; hereda los N finalistas promovidos (sin inscripción propia).
                  </p>
                </div>
              </div>

              <div v-if="!esFaseHijaForm">
                <p class="text-[10px] font-black uppercase tracking-widest text-secondary mb-1">Periodo de inscripción</p>
                <p class="text-[11px] text-slate-600 font-medium leading-relaxed">
                  {{ esFaseChachaWarmi({ nombre: form.nombre, plantillaRequisitos: form.plantillaRequisitos })
                    ? 'Define cuándo los delegados pueden inscribir a sus participantes Chacha-Warmi.'
                    : 'Define cuándo los concursantes pueden completar su inscripción.' }}
                  <span> Si dejas ambas vacías, la inscripción permanece abierta.</span>
                </p>
              </div>
              <div v-if="!esFaseHijaForm" class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label class="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Inicio inscripción</label>
                  <input
                    v-model="form.fechaInicioInscripcion"
                    type="datetime-local"
                    class="w-full px-3 py-3 bg-white border border-slate-200 rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label class="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Fin inscripción</label>
                  <input
                    v-model="form.fechaFinInscripcion"
                    type="datetime-local"
                    class="w-full px-3 py-3 bg-white border border-slate-200 rounded-xl text-sm"
                  />
                </div>
              </div>
              <p v-else class="text-[11px] text-slate-600 font-medium leading-relaxed">
                Sin periodo de inscripción: los participantes se heredan al promover desde la fase padre.
              </p>
            </div>

            <div class="flex items-center gap-4">
              <label class="text-[10px] font-black uppercase tracking-widest text-slate-500">Estado</label>
              <v-switch v-model="form.estaActiva" color="primary" density="compact" inset hide-details></v-switch>
              <span class="text-xs font-bold text-slate-600">{{ form.estaActiva ? 'Activa' : 'Inactiva' }}</span>
            </div>

            <div>
              <label class="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Imagen de portada (.png, .jpg)</label>
              <div
                class="w-full relative border-2 border-dashed rounded-xl overflow-hidden group transition-all"
                :class="archivoPreview || form.urlImagen ? 'border-primary' : 'border-slate-300 hover:border-primary bg-slate-50'"
              >
                <input
                  type="file"
                  accept="image/png, image/jpeg"
                  @change="handleFileChange"
                  class="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
                <div v-if="archivoPreview || form.urlImagen" class="h-36 w-full relative">
                  <img :src="archivoPreview || getImageUrl(form.urlImagen)" class="w-full h-full object-cover" />
                  <div class="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span class="text-white font-bold text-[10px] uppercase tracking-widest flex items-center gap-2"><span class="material-symbols-outlined text-[16px]">upload</span> Cambiar imagen</span>
                  </div>
                </div>
                <div v-else class="h-36 flex flex-col items-center justify-center text-slate-400 group-hover:text-primary transition-colors">
                  <span class="material-symbols-outlined text-3xl mb-1">add_photo_alternate</span>
                  <span class="text-[10px] font-black uppercase tracking-widest">Arrastra o haz clic para subir</span>
                </div>
              </div>
            </div>

            <div class="border-t border-slate-100 pt-5">
              <label class="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 flex items-center justify-between gap-2">
                <span>Asignar jurados especialistas</span>
                <span class="text-[9px] text-primary font-black">{{ form.juradosIds?.length || 0 }} seleccionados</span>
              </label>
              <div class="bg-slate-50 border-2 border-slate-100 p-3 rounded-xl max-h-52 overflow-y-auto space-y-1">
                <div v-if="juradosDisponibles.length === 0" class="text-xs text-slate-400 italic py-6 text-center">
                  <span class="material-symbols-outlined block mb-1 opacity-50">person_search</span>
                  No hay jurados de tipo {{ form.tipoConcurso }} registrados{{ editandoId && form.tipoConcurso === 'EFU' ? ' y habilitados para esta fase' : '' }}.
                </div>
                <label v-for="jurado in juradosDisponibles" :key="jurado.idJurado"
                  class="flex items-center gap-3 cursor-pointer p-2.5 hover:bg-white rounded-lg transition-all">
                  <input type="checkbox" :value="jurado.idJurado" v-model="form.juradosIds" class="size-4 accent-primary rounded" />
                  <div>
                    <p class="font-bold text-sm text-slate-700">{{ jurado.nombre }}</p>
                    <p class="text-[10px] uppercase font-black tracking-widest text-slate-400">CI: {{ jurado.ci }}</p>
                  </div>
                </label>
              </div>
            </div>
          </div>
        </v-card-text>

        <v-card-actions class="pa-5 sm:pa-6 border-t border-slate-100 shrink-0 bg-white">
          <v-spacer></v-spacer>
          <button type="button" @click="modalOpen = false" class="px-6 py-2.5 text-slate-500 font-bold hover:text-primary transition-all">Cancelar</button>
          <button
            type="button"
            @click="guardar"
            class="bg-primary hover:bg-blue-900 shadow-lg shadow-primary/20 text-white px-8 py-2.5 rounded-xl font-black uppercase tracking-tighter transition-all"
          >
            Guardar Fase
          </button>
        </v-card-actions>
      </v-card>
    </v-dialog>

  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import api from '../services/api'
import { notify } from '../utils/notify'
import Swal from 'sweetalert2'

import { getImageUrl } from '../utils/url'
import { esFaseChachaWarmi } from '../utils/chachaWarmi'


const props = defineProps({
  gestionSeleccionada: { type: Object, default: null }
})
const emit = defineEmits(['volver', 'gestionar-criterios'])

const resumen = ref({ fases: [], pesoEFUTotal: 0, disponibleEFU: 100, gestion: null })
const juradosList = ref([])
const controladoresList = ref([])
const cargando = ref(true)
const modalOpen = ref(false)
const editandoId = ref(null)
const errorFormulario = ref('')

// Modal asignación de jurados
const modalJuradosOpen = ref(false)
const faseParaJurados = ref(null)
const juradosSeleccionados = ref([])
const usuariosSeleccionados = ref([])
const savingJurados = ref(false)
const busquedaAsignacionJurados = ref('')

// Computed: solo mostrar escritura si la gestión está activa
const esGestionActiva = computed(() => resumen.value.gestion?.activa !== false)

const archivoImagen = ref(null)
const archivoPreview = ref(null)

const handleFileChange = (e) => {
  const file = e.target.files[0]
  if (file) {
    if (!['image/jpeg', 'image/png'].includes(file.type)) {
      return notify.error('Formato Inválido', 'Solo se permiten imágenes JPG y PNG')
    }
    archivoImagen.value = file
    archivoPreview.value = URL.createObjectURL(file)
  }
}


const form = ref({
  nombre: '',
  tipoConcurso: 'EFU',
  pesoPorcentaje: 20,
  fechaInicio: '',
  fechaFin: '',
  fechaInicioInscripcion: '',
  fechaFinInscripcion: '',
  estaActiva: true,
  urlImagen: '',
  juradosIds: [],
  plantillaRequisitos: 'generico',
  clavesCampos: [],
  clavesDocumentos: [],
  cupoFinalistas: null,
  idFaseHija: null,
  idFasePadre: null,
  fasePadreNombre: '',
  heredaFinalistas: false,
})

/** Fase hija: ya enlazada por el padre, o marcada para heredar finalistas. */
const esFaseHijaForm = computed(() => !!(form.value.idFasePadre || form.value.heredaFinalistas))

/** Opciones que el padre puede elegir como única hija. */
const fasesHijaOpciones = computed(() => {
  const fases = resumen.value.fases || []
  return fases.filter((f) => {
    if (f.tipoConcurso !== 'EXTERNO') return false
    if (editandoId.value && f.idFase === editandoId.value) return false
    // No elegir otra fase que ya es padre (tiene hija propia)
    if (f.idFaseHija) return false
    // No elegir otra fase de inscripción (con cupo) salvo la ya vinculada
    if (f.cupoFinalistas && f.idFase !== form.value.idFaseHija) return false
    const esChacha = esFaseChachaWarmi(f) || String(f.plantillaRequisitos || '').toLowerCase() === 'chacha_warmi'
    const yaHijaDeEste = form.value.idFaseHija === f.idFase || f.idFasePadre === editandoId.value
    const sinReqs = !(f.requisitosInscripcion?.campos?.length || f.requisitosInscripcion?.documentos?.length)
    return esChacha || yaHijaDeEste || sinReqs || !!f.idFasePadre
  })
})

const plantillasMeta = ref([])
const catalogoCampos = ref([])
const catalogoDocumentos = ref([])
const plantillasPorId = ref({})

const cargarPlantillas = async () => {
  try {
    const { data } = await api.get('/evaluaciones/plantillas-requisitos-concurso')
    plantillasMeta.value = data.plantillas || []
    catalogoCampos.value = data.catalogoCampos || []
    catalogoDocumentos.value = data.catalogoDocumentos || []
    plantillasPorId.value = data.porPlantilla || {}
  } catch (e) {
    console.error('Error cargando plantillas', e)
  }
}

const aplicarPlantilla = (id) => {
  form.value.plantillaRequisitos = id
  const plantilla = plantillasPorId.value[id]
  if (!plantilla) return
  form.value.clavesCampos = (plantilla.campos || []).map((c) => c.clave)
  form.value.clavesDocumentos = (plantilla.documentos || []).map((d) => d.clave)
}

const onSeleccionarExterno = () => {
  form.value.tipoConcurso = 'EXTERNO'
  if (!form.value.plantillaRequisitos) form.value.plantillaRequisitos = 'generico'
  if (!form.value.clavesCampos?.length && !form.value.clavesDocumentos?.length) {
    aplicarPlantilla(form.value.plantillaRequisitos || 'generico')
  }
}

const resetRequisitosSiEfu = () => {
  form.value.plantillaRequisitos = 'generico'
  form.value.clavesCampos = []
  form.value.clavesDocumentos = []
}

// ── Computed validación en tiempo real ────────────────────────────────────
const pesoEFUSinActual = computed(() => {
  const fases = resumen.value.fases || []
  return fases
    .filter(f => f.tipoConcurso === 'EFU' && f.idFase !== editandoId.value)
    .reduce((s, f) => s + Number(f.pesoPorcentaje), 0)
})

const pesoEFUConActual = computed(() => {
  if (form.value.tipoConcurso !== 'EFU') return pesoEFUSinActual.value
  return pesoEFUSinActual.value + Number(form.value.pesoPorcentaje || 0)
})

const disponibleEFUCalc = computed(() => {
  return 100 - pesoEFUSinActual.value - Number(form.value.pesoPorcentaje || 0)
})

const guardadoBloqueado = computed(() => {
  return false; // Desactivar bloqueo duro para permitir mostrar las alertas visuales
})

// Jurados filtrados por tipo de la fase seleccionada
const juradosParaFase = computed(() => {
  if (!faseParaJurados.value) return juradosList.value
  const tipo = faseParaJurados.value.tipoConcurso
  return juradosList.value.filter(j =>
    j.tipoJurado === tipo || j.tipoJurado === 'AMBOS'
  )
})

const juradosDisponibles = computed(() => {
  return juradosList.value.filter(j => j.tipoJurado === form.value.tipoConcurso || j.tipoJurado === 'AMBOS')
})

const normalizarTextoBusqueda = (valor) =>
  String(valor || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()

const juradosParaFaseFiltrados = computed(() => {
  const q = normalizarTextoBusqueda(busquedaAsignacionJurados.value)
  const list = juradosParaFase.value
  if (!q) return list
  return list.filter((j) =>
    normalizarTextoBusqueda([j.nombre, j.ci, j.tipoJurado].join(' ')).includes(q),
  )
})

const controladoresFiltrados = computed(() => {
  const q = normalizarTextoBusqueda(busquedaAsignacionJurados.value)
  const list = controladoresList.value
  if (!q) return list
  return list.filter((c) =>
    normalizarTextoBusqueda([c.nombre, c.ci].join(' ')).includes(q),
  )
})

const resumenFasesJurado = (j) => {
  const fases = j.fasesHabilitadas || []
  if (!fases.length) return 'Sin fases en perfil'
  const nombres = fases.slice(0, 3).map((f) => f.nombre).join(', ')
  return fases.length > 3 ? `${nombres}… (+${fases.length - 3})` : nombres
}

const seleccionarJuradosVisibles = () => {
  if (esFaseDisciplina(faseParaJurados.value)) {
    const ids = controladoresFiltrados.value.map((c) => c.idUsuario)
    usuariosSeleccionados.value = Array.from(new Set([...usuariosSeleccionados.value, ...ids]))
    return
  }
  const ids = juradosParaFaseFiltrados.value.map((j) => j.idJurado)
  juradosSeleccionados.value = Array.from(new Set([...juradosSeleccionados.value, ...ids]))
}

const limpiarSeleccionJurados = () => {
  if (esFaseDisciplina(faseParaJurados.value)) {
    usuariosSeleccionados.value = []
  } else {
    juradosSeleccionados.value = []
  }
}

// ── Carga de datos ────────────────────────────────────────────────────────
const cargarFases = async () => {
  cargando.value = true
  try {
    const idGestion = props.gestionSeleccionada?.idGestion
    const url = idGestion ? `/evaluaciones/gestiones/${idGestion}/fases` : '/evaluaciones/gestiones/activa/fases'
    const { data } = await api.get(idGestion ? `/evaluaciones/gestiones/${idGestion}/fases` : '/evaluaciones/fases-auth')
    // Para la vista admin usamos el endpoint de gestión
    if (idGestion) {
      resumen.value = data
    } else {
      resumen.value = { fases: data, pesoEFUTotal: 0, disponibleEFU: 100, gestion: null }
    }
  } catch (e) { console.error(e) }
  finally { cargando.value = false }
}

const cargarJurados = async () => {
  try {
    const { data } = await api.get('/usuarios/jurados')
    juradosList.value = data
  } catch (e) { console.error(e) }
}

const abrirModalJurados = async (fase) => {
  faseParaJurados.value = fase
  busquedaAsignacionJurados.value = ''
  await Promise.all([cargarJurados(), cargarControladores()])
  juradosSeleccionados.value = (fase.jurados || []).map(j => j.idJurado)
  if (esFaseDisciplina(fase)) {
    usuariosSeleccionados.value = (fase.jurados || [])
      .filter(j => j.usuario && j.usuario.rol?.nombre === 'controladorhcu')
      .map(j => j.usuario.idUsuario)
  } else {
    usuariosSeleccionados.value = []
  }
  modalJuradosOpen.value = true
}

const esFaseDisciplina = (fase) => {
  return fase?.nombre?.toLowerCase().includes('disciplina')
}

const cargarControladores = async () => {
  try {
    const { data } = await api.get('/usuarios/controladores')
    controladoresList.value = data
  } catch (e) { console.error(e) }
}

const guardarAsignacionJurados = async () => {
  savingJurados.value = true
  try {
    const payload = {}
    if (esFaseDisciplina(faseParaJurados.value)) {
      payload.juradoIds = []
      payload.usuarioIds = usuariosSeleccionados.value
    } else {
      payload.juradoIds = juradosSeleccionados.value
    }

    await api.post(`/usuarios/fases/${faseParaJurados.value.idFase}/jurados`, payload)
    savingJurados.value = false
    modalJuradosOpen.value = false
    notify.success('Asignación guardada', `${juradosSeleccionados.value.length || usuariosSeleccionados.value.length} persona(s) asignada(s) a "${faseParaJurados.value.nombre}"`)
    await cargarFases()
  } catch (e) {
    notify.error('Error', e?.response?.data?.message || 'No se pudo guardar la asignación de jurados.')
  } finally {
    savingJurados.value = false
  }
}

const toLocalISOString = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
};

// ── CRUD ──────────────────────────────────────────────────────────────────
const abrirModal = (item = null) => {
  if (item) {
    editandoId.value = item.idFase
    const req = item.requisitosInscripcion || {}
    const esHija = !!item.idFasePadre
    form.value = {
      nombre: item.nombre,
      tipoConcurso: item.tipoConcurso || 'EFU',
      pesoPorcentaje: Number(item.pesoPorcentaje),
      fechaInicio: toLocalISOString(item.fechaInicio),
      fechaFin: toLocalISOString(item.fechaFin),
      fechaInicioInscripcion: toLocalISOString(item.fechaInicioInscripcion),
      fechaFinInscripcion: toLocalISOString(item.fechaFinInscripcion),
      estaActiva: item.estaActiva,
      urlImagen: item.urlImagen || '',
      juradosIds: item.jurados?.map(j => j.idJurado) || [],
      plantillaRequisitos: item.plantillaRequisitos || 'generico',
      clavesCampos: (req.campos || []).map((c) => c.clave),
      clavesDocumentos: (req.documentos || []).map((d) => d.clave),
      cupoFinalistas: item.cupoFinalistas ?? null,
      idFaseHija: item.idFaseHija ?? null,
      idFasePadre: item.idFasePadre ?? null,
      fasePadreNombre: item.fasePadreNombre || '',
      heredaFinalistas: esHija,
    }
    if (!esHija && form.value.tipoConcurso === 'EXTERNO' && !form.value.clavesCampos.length && !form.value.clavesDocumentos.length) {
      aplicarPlantilla(form.value.plantillaRequisitos)
    }
    // Migrar documentos legados de Chacha-Warmi (CI ambos) a CI/matrícula separados
    if (
      !esHija &&
      form.value.tipoConcurso === 'EXTERNO' &&
      esFaseChachaWarmi({ nombre: form.value.nombre, plantillaRequisitos: form.value.plantillaRequisitos }) &&
      !form.value.clavesDocumentos.includes('ci_chacha_pdf')
    ) {
      aplicarPlantilla('chacha_warmi')
    }
  } else {
    editandoId.value = null
    form.value = {
      nombre: '', tipoConcurso: 'EFU', pesoPorcentaje: 20,
      fechaInicio: '', fechaFin: '', fechaInicioInscripcion: '', fechaFinInscripcion: '',
      estaActiva: true, urlImagen: '', juradosIds: [],
      plantillaRequisitos: 'generico', clavesCampos: [], clavesDocumentos: [],
      cupoFinalistas: null, idFaseHija: null, idFasePadre: null, fasePadreNombre: '',
      heredaFinalistas: false,
    }
  }
  
  archivoImagen.value = null
  archivoPreview.value = null
  modalOpen.value = true
  if (!plantillasMeta.value.length) cargarPlantillas()
}

const guardar = async () => {
  if (!form.value.nombre?.trim()) {
    return notify.error('Error', 'El nombre de la fase no puede estar vacío.')
  }
  if (form.value.pesoPorcentaje <= 0 || !form.value.pesoPorcentaje) {
    return notify.error('Error', 'El porcentaje de ponderación no puede ser 0 o negativo.')
  }
  if (form.value.tipoConcurso === 'EFU' && pesoEFUConActual.value > 100) {
    return notify.error('Error', `La suma de fases EFU no puede superar el 100%. Disponible: ${disponibleEFUCalc.value + Number(form.value.pesoPorcentaje || 0)}%`)
  }
  const esHija = esFaseHijaForm.value
  if (form.value.tipoConcurso === 'EXTERNO' && !esHija) {
    if (!form.value.clavesCampos?.length && !form.value.clavesDocumentos?.length) {
      return notify.error('Error', 'Selecciona al menos un campo o documento a solicitar en el concurso externo.')
    }
    // Si el nombre indica Chacha-Warmi y no eligieron plantilla, forzar la correcta (inscripción por delegado).
    if (
      esFaseChachaWarmi({ nombre: form.value.nombre, plantillaRequisitos: form.value.plantillaRequisitos }) &&
      form.value.plantillaRequisitos !== 'chacha_warmi'
    ) {
      form.value.plantillaRequisitos = 'chacha_warmi'
      if (!form.value.clavesCampos?.length) aplicarPlantilla('chacha_warmi')
    }
  }
  if (form.value.fechaInicio && form.value.fechaFin) {
    if (new Date(form.value.fechaFin) < new Date(form.value.fechaInicio)) {
      return notify.error('Error Lógico', 'La fecha fin de calificación debe ser posterior o igual a la de inicio.')
    }
  }
  if (form.value.tipoConcurso === 'EXTERNO' && !esHija) {
    const iniIns = form.value.fechaInicioInscripcion
    const finIns = form.value.fechaFinInscripcion
    if ((iniIns && !finIns) || (!iniIns && finIns)) {
      return notify.error('Error', 'Indica inicio y fin de inscripción, o deja ambos vacíos.')
    }
    if (iniIns && finIns && new Date(finIns) < new Date(iniIns)) {
      return notify.error('Error Lógico', 'La fecha fin de inscripción debe ser posterior o igual a la de inicio.')
    }
  }

  try {
    const payloadInfo = {
      ...form.value,
      gestionId: props.gestionSeleccionada?.idGestion || null,
    }
    delete payloadInfo.idFasePadre
    delete payloadInfo.fasePadreNombre
    if (payloadInfo.tipoConcurso !== 'EXTERNO') {
      delete payloadInfo.plantillaRequisitos
      delete payloadInfo.clavesCampos
      delete payloadInfo.clavesDocumentos
      delete payloadInfo.fechaInicioInscripcion
      delete payloadInfo.fechaFinInscripcion
      delete payloadInfo.cupoFinalistas
      delete payloadInfo.idFaseHija
      delete payloadInfo.heredaFinalistas
    } else if (esHija) {
      payloadInfo.heredaFinalistas = true
      payloadInfo.clavesCampos = []
      payloadInfo.clavesDocumentos = []
      payloadInfo.fechaInicioInscripcion = null
      payloadInfo.fechaFinInscripcion = null
      payloadInfo.cupoFinalistas = null
      delete payloadInfo.idFaseHija
      if (!payloadInfo.plantillaRequisitos) payloadInfo.plantillaRequisitos = 'chacha_warmi'
    } else {
      payloadInfo.heredaFinalistas = false
      if (payloadInfo.cupoFinalistas === '' || Number.isNaN(Number(payloadInfo.cupoFinalistas))) {
        payloadInfo.cupoFinalistas = null
      }
      if (!esFaseChachaWarmi({ nombre: payloadInfo.nombre, plantillaRequisitos: payloadInfo.plantillaRequisitos })) {
        delete payloadInfo.cupoFinalistas
        delete payloadInfo.idFaseHija
      } else if (payloadInfo.idFaseHija === '' || payloadInfo.idFaseHija === undefined) {
        payloadInfo.idFaseHija = null
      }
    }
    
    const formData = new FormData()
    formData.append('data', JSON.stringify(payloadInfo))
    
    if (archivoImagen.value) {
      formData.append('imagen', archivoImagen.value)
    }

    if (editandoId.value) {
      await api.put(`/evaluaciones/fases/${editandoId.value}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } })
    } else {
      await api.post('/evaluaciones/fases', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
    }
    
    modalOpen.value = false

    notify.success('¡Guardado!', 'Fase guardada correctamente.')
    cargarFases()
  } catch (e) {
    const msg = e?.response?.data?.message || 'No se pudo guardar la fase.'
    notify.error('Error', msg)
  }
}

const eliminar = async (fase) => {
  const r = await notify.confirm('¿Eliminar fase?', `"${fase.nombre}" y todos sus criterios serán eliminados.`, 'Sí, eliminar')
  if (r.isConfirmed) {
    await api.delete(`/evaluaciones/fases/${fase.idFase}`)
    notify.success('Eliminado', 'Fase eliminada.')
    cargarFases()
  }
}

const fmtFecha = (s) => s ? new Date(s).toLocaleString('es-BO', {
  year: 'numeric', month: '2-digit', day: '2-digit',
  hour: '2-digit', minute: '2-digit'
}) : '—'

// Recargar si cambia la gestión seleccionada
watch(() => props.gestionSeleccionada, cargarFases)

onMounted(() => {
  cargarFases()
  cargarJurados()
  cargarControladores()
})
</script>
