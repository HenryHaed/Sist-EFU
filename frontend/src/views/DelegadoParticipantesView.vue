<template>
  <div class="dashboard-page max-w-7xl min-h-full">

    <!-- STEP 1: SELECT CONTEST -->
    <div v-if="!faseSeleccionada" class="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div class="mb-10">
        <h2 class="text-3xl font-black text-primary tracking-tighter uppercase italic">Participantes de Concursos</h2>
        <p class="text-slate-500 font-medium text-sm mt-1">
          Concursantes aprobados en concursos externos. En Chacha-Warmi se agrupan por fraternidad.
        </p>
      </div>

      <div v-if="loadingFases" class="flex justify-center py-20">
        <span class="material-symbols-outlined animate-spin text-4xl text-primary">progress_activity</span>
      </div>

      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div
          v-for="f in fasesExternas"
          :key="f.idFase"
          class="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm hover:shadow-xl hover:border-primary/30 transition-all cursor-pointer group relative overflow-hidden"
          @click="seleccionarFase(f)"
        >
          <div class="absolute top-0 right-0 size-24 bg-primary/5 rounded-bl-full -mr-10 -mt-10 group-hover:bg-primary/10 transition-colors"></div>
          <span class="material-symbols-outlined text-4xl text-primary mb-4">
            {{ esFaseChacha(f) ? 'diversity_3' : 'emoji_events' }}
          </span>
          <h3 class="font-black text-xl text-slate-800 uppercase tracking-tighter leading-tight mb-2">{{ f.nombre }}</h3>
          <p class="text-[10px] font-black uppercase tracking-widest text-slate-400">
            {{ etiquetaPlantilla(f) }}
          </p>
          <div class="mt-6 flex items-center justify-between">
            <span class="text-xs font-bold text-slate-500">
              {{ esFaseChacha(f) ? 'Ver fraternidades' : 'Ver participantes' }}
            </span>
            <span class="material-symbols-outlined text-primary group-hover:translate-x-1 transition-transform">arrow_forward</span>
          </div>
        </div>

        <div v-if="fasesExternas.length === 0" class="col-span-full py-20 text-center bg-slate-50 rounded-3xl border border-dashed border-slate-200">
          <span class="material-symbols-outlined text-5xl text-slate-200 mb-2">event_busy</span>
          <p class="text-slate-400 font-bold uppercase tracking-widest">No hay concursos externos activos para esta gestión.</p>
        </div>
      </div>
    </div>

    <!-- STEP 2: LISTADO SEGÚN TIPO -->
    <div v-else class="animate-in fade-in slide-in-from-right-4 duration-500">
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div class="flex items-center gap-4">
          <button
            type="button"
            @click="volverAFases"
            class="size-10 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl flex items-center justify-center transition-colors shadow-sm"
          >
            <span class="material-symbols-outlined">arrow_back</span>
          </button>
          <div>
            <h2 class="text-3xl font-black text-primary tracking-tighter uppercase italic leading-none">{{ faseSeleccionada.nombre }}</h2>
            <p class="text-slate-500 font-medium text-sm mt-1">
              {{ esChachaActiva
                ? 'Fraternidades con pareja Chacha-Warmi inscrita'
                : 'Listado de concursantes aprobados / inscritos' }}
            </p>
          </div>
        </div>

        <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <button
            v-if="esChachaActiva"
            type="button"
            @click="descargarAudiosZip"
            :disabled="descargandoAudios"
            class="px-5 py-3 bg-slate-900 text-white font-black rounded-2xl shadow-lg hover:bg-black transition-all flex items-center justify-center gap-2 uppercase text-xs tracking-widest disabled:opacity-50"
          >
            <span class="material-symbols-outlined text-[20px]" :class="{ 'animate-spin': descargandoAudios }">
              {{ descargandoAudios ? 'progress_activity' : 'folder_zip' }}
            </span>
            Descargar audios ZIP
          </button>
          <button
            v-if="!esChachaActiva"
            type="button"
            @click="abrirModalCrear"
            class="px-6 py-3 bg-secondary text-white font-black rounded-2xl shadow-lg shadow-secondary/20 hover:brightness-110 transition-all flex items-center justify-center gap-2 uppercase text-xs tracking-widest"
          >
            <span class="material-symbols-outlined text-[20px]">person_add</span>
            Inscribir Participante
          </button>
        </div>
      </div>

      <div v-if="loadingParticipantes" class="flex justify-center py-20">
        <span class="material-symbols-outlined animate-spin text-4xl text-primary">progress_activity</span>
      </div>

      <!-- CHACHA: listado de fraternidades -->
      <template v-else-if="esChachaActiva">
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <button
            v-for="grupo in fraternidadesChacha"
            :key="grupo.idFraternidad || 'sin-frat'"
            type="button"
            class="text-left bg-white rounded-3xl border border-slate-200 shadow-sm hover:shadow-xl hover:border-primary/30 transition-all p-6 group relative overflow-hidden"
            @click="abrirModalFraternidad(grupo)"
          >
            <div class="absolute top-0 right-0 size-20 bg-primary/5 rounded-bl-full -mr-8 -mt-8 group-hover:bg-primary/10 transition-colors"></div>
            <div class="flex items-start justify-between gap-3 mb-4">
              <div class="size-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <span class="material-symbols-outlined text-3xl">groups</span>
              </div>
              <span class="px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest bg-emerald-50 text-emerald-700 border border-emerald-100">
                {{ grupo.participantes.length }}
                {{ grupo.participantes.length === 1 ? 'participante' : 'participantes' }}
              </span>
            </div>
            <h4 class="font-black text-lg text-slate-800 uppercase tracking-tighter leading-tight mb-2">
              {{ grupo.nombre }}
            </h4>
            <div class="space-y-1.5 mb-4">
              <p v-if="grupo.instancia || grupo.facultadCarrera" class="text-[11px] font-medium text-slate-600 flex items-start gap-1.5">
                <span class="material-symbols-outlined text-slate-400 text-[16px] mt-0.5">account_balance</span>
                <span class="leading-snug">
                  <span v-if="grupo.instancia" class="font-bold">{{ grupo.instancia }}</span>
                  <span v-if="grupo.instancia && grupo.facultadCarrera"> · </span>
                  {{ grupo.facultadCarrera }}
                </span>
              </p>
              <p v-if="grupo.danza" class="text-[11px] font-medium text-slate-600 flex items-center gap-1.5">
                <span class="material-symbols-outlined text-slate-400 text-[16px]">nightlife</span>
                {{ grupo.danza }}
                <span v-if="grupo.categoria" class="text-slate-400">· {{ grupo.categoria }}</span>
              </p>
              <p class="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                {{ resumenTipos(grupo.participantes) }}
              </p>
            </div>
            <div class="flex items-center justify-between text-xs font-bold text-primary">
              <span>Ver pareja / concursantes</span>
              <span class="material-symbols-outlined text-base group-hover:translate-x-1 transition-transform">arrow_forward</span>
            </div>
          </button>

          <div
            v-if="fraternidadesChacha.length === 0"
            class="col-span-full py-20 text-center bg-white rounded-3xl border border-dashed border-slate-200"
          >
            <span class="material-symbols-outlined text-5xl text-slate-200 mb-2">groups</span>
            <p class="text-slate-400 font-bold uppercase tracking-widest max-w-md mx-auto">
              Aún no hay parejas. Aparecerán cuando el delegado envíe la inscripción Chacha-Warmi.
            </p>
          </div>
        </div>
      </template>

      <!-- OTROS CONCURSOS: listado plano -->
      <template v-else>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div
            v-for="p in participantes"
            :key="p.idParticipante"
            class="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col group"
          >
            <div class="p-6 flex-1">
              <div class="flex justify-between items-start mb-4">
                <div class="size-12 rounded-2xl bg-primary/5 text-primary flex items-center justify-center shrink-0">
                  <span class="material-symbols-outlined text-3xl">person</span>
                </div>
                <div class="flex gap-1">
                  <button
                    type="button"
                    @click="abrirModalEditar(p)"
                    class="size-8 rounded-lg bg-slate-50 text-slate-400 hover:bg-primary/10 hover:text-primary transition-colors flex items-center justify-center"
                  >
                    <span class="material-symbols-outlined text-[18px]">edit</span>
                  </button>
                  <button
                    type="button"
                    @click="confirmarEliminar(p)"
                    class="size-8 rounded-lg bg-slate-50 text-slate-400 hover:bg-secondary/10 hover:text-secondary transition-colors flex items-center justify-center"
                  >
                    <span class="material-symbols-outlined text-[18px]">delete</span>
                  </button>
                </div>
              </div>

              <h4 class="font-black text-xl text-slate-800 uppercase tracking-tighter leading-tight mb-1">{{ p.nombre }}</h4>
              <p class="text-primary font-black text-[10px] uppercase tracking-widest mb-4">{{ p.tipo || 'PARTICIPANTE' }}</p>

              <div class="flex flex-col gap-2 p-3 bg-slate-50 rounded-2xl border border-slate-100">
                <div class="flex items-center gap-2">
                  <span class="material-symbols-outlined text-slate-400 text-sm">account_balance</span>
                  <div>
                    <p class="text-[8px] font-black uppercase text-slate-400 leading-none mb-1">Institución</p>
                    <p class="text-xs font-bold text-slate-700 truncate max-w-[180px]">
                      {{ p.esUmsa ? `${p.facultad?.nombre || ''} - ${p.carrera?.nombre || ''}`.replace(/^ - | - $/g, '') || 'UMSA' : (p.institucionExterna || 'EXTERNO') }}
                    </p>
                  </div>
                </div>
                <div v-if="p.perteneceFraternidad || p.fraternidad" class="flex items-center gap-2 border-t border-slate-200 pt-2">
                  <span class="material-symbols-outlined text-primary text-sm">groups</span>
                  <div>
                    <p class="text-[8px] font-black uppercase text-slate-400 leading-none mb-1">Fraternidad</p>
                    <p class="text-xs font-bold text-slate-700 truncate max-w-[180px]">{{ p.fraternidad?.nombre || 'SIN ESPECIFICAR' }}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div
            v-if="participantes.length === 0"
            class="col-span-full py-20 text-center bg-white rounded-3xl border border-dashed border-slate-200"
          >
            <span class="material-symbols-outlined text-5xl text-slate-200 mb-2">groups</span>
            <p class="text-slate-400 font-bold uppercase tracking-widest max-w-md mx-auto">
              No hay participantes. Aparecerán al aprobar inscripciones de concursantes.
            </p>
          </div>
        </div>
      </template>
    </div>

    <!-- MODAL: concursantes de una fraternidad (Chacha-Warmi) -->
    <div
      v-if="modalFraternidad"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm"
      @click.self="modalFraternidad = null"
    >
      <div class="bg-white w-full max-w-3xl rounded-[2rem] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 max-h-[92vh] flex flex-col border border-slate-100">
        <!-- Header fraternidad -->
        <div class="relative shrink-0 overflow-hidden">
          <div class="absolute inset-0 bg-gradient-to-br from-primary via-[#002b80] to-secondary opacity-95"></div>
          <div class="absolute -right-10 -top-10 size-40 rounded-full bg-white/10"></div>
          <div class="absolute -left-6 bottom-0 size-28 rounded-full bg-white/5"></div>
          <div class="relative px-6 sm:px-8 pt-6 pb-7 text-white">
            <div class="flex items-start justify-between gap-4 mb-5">
              <div class="min-w-0">
                <p class="text-[10px] font-black uppercase tracking-[0.2em] text-white/60 mb-2">
                  Expediente Chacha-Warmi
                </p>
                <h3 class="font-black italic uppercase tracking-tight text-2xl sm:text-3xl leading-none">
                  {{ modalFraternidad.nombre }}
                </h3>
              </div>
              <button
                type="button"
                @click="modalFraternidad = null"
                class="size-10 rounded-2xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors shrink-0"
              >
                <span class="material-symbols-outlined">close</span>
              </button>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div class="rounded-2xl bg-white/10 border border-white/10 px-4 py-3 backdrop-blur-sm">
                <p class="text-[9px] font-black uppercase tracking-widest text-white/55 mb-1 flex items-center gap-1.5">
                  <span class="material-symbols-outlined text-sm">account_balance</span>
                  Instancia
                </p>
                <p class="text-sm font-black leading-tight">
                  {{ metaFraternidadModal.instancia || '—' }}
                </p>
                <p v-if="metaFraternidadModal.facultadCarrera" class="text-[11px] text-white/75 font-medium mt-1 leading-snug">
                  {{ metaFraternidadModal.facultadCarrera }}
                </p>
              </div>
              <div class="rounded-2xl bg-white/10 border border-white/10 px-4 py-3 backdrop-blur-sm">
                <p class="text-[9px] font-black uppercase tracking-widest text-white/55 mb-1 flex items-center gap-1.5">
                  <span class="material-symbols-outlined text-sm">nightlife</span>
                  Tipo de danza
                </p>
                <p class="text-sm font-black leading-tight">
                  {{ metaFraternidadModal.danza || '—' }}
                </p>
                <p v-if="metaFraternidadModal.categoria" class="text-[11px] text-white/75 font-medium mt-1">
                  {{ metaFraternidadModal.categoria }}
                </p>
              </div>
              <div class="rounded-2xl bg-white/10 border border-white/10 px-4 py-3 backdrop-blur-sm">
                <p class="text-[9px] font-black uppercase tracking-widest text-white/55 mb-1 flex items-center gap-1.5">
                  <span class="material-symbols-outlined text-sm">diversity_3</span>
                  Pareja inscrita
                </p>
                <p class="text-sm font-black leading-tight">
                  {{ modalFraternidad.participantes.length }} persona(s)
                </p>
                <p class="text-[11px] text-white/75 font-medium mt-1">
                  {{ resumenTipos(modalFraternidad.participantes) }}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div class="px-6 sm:px-8 py-5 overflow-y-auto space-y-4 flex-1 bg-slate-50/80">
          <p class="text-[10px] font-black uppercase tracking-widest text-slate-400">
            Concursantes de la pareja
          </p>

          <div
            v-for="p in participantesOrdenadosModal"
            :key="p.idParticipante"
            class="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden"
          >
            <div
              class="h-1.5 w-full"
              :class="p.tipo === 'Warmi' ? 'bg-secondary' : 'bg-primary'"
            ></div>
            <div class="p-5 sm:p-6">
              <div class="flex flex-col sm:flex-row sm:items-start gap-4">
                <div
                  class="size-14 rounded-2xl flex items-center justify-center shrink-0 shadow-inner"
                  :class="p.tipo === 'Warmi' ? 'bg-secondary/10 text-secondary' : 'bg-primary/10 text-primary'"
                >
                  <span class="material-symbols-outlined text-3xl">
                    {{ p.tipo === 'Warmi' ? 'woman' : 'man' }}
                  </span>
                </div>

                <div class="flex-1 min-w-0">
                  <div class="flex flex-wrap items-center gap-2 mb-2">
                    <span
                      class="px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border"
                      :class="p.tipo === 'Warmi'
                        ? 'bg-secondary/5 text-secondary border-secondary/20'
                        : 'bg-primary/5 text-primary border-primary/20'"
                    >
                      {{ p.tipo || 'Participante' }}
                    </span>
                  </div>
                  <h4 class="font-black text-slate-900 uppercase tracking-tighter text-xl leading-tight">
                    {{ p.nombre }}
                  </h4>

                  <div class="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div class="rounded-2xl bg-slate-50 border border-slate-100 px-3.5 py-3">
                      <p class="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1 flex items-center gap-1">
                        <span class="material-symbols-outlined text-[14px]">account_balance</span>
                        Facultad / instancia
                      </p>
                      <p class="text-sm font-bold text-slate-800 leading-snug">
                        {{ labelFacultadParticipante(p) }}
                      </p>
                      <p v-if="labelInstanciaParticipante(p)" class="text-[11px] text-slate-500 font-medium mt-1">
                        Instancia: {{ labelInstanciaParticipante(p) }}
                      </p>
                    </div>
                    <div class="rounded-2xl bg-slate-50 border border-slate-100 px-3.5 py-3">
                      <p class="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1 flex items-center gap-1">
                        <span class="material-symbols-outlined text-[14px]">nightlife</span>
                        Tipo de danza
                      </p>
                      <p class="text-sm font-bold text-slate-800 leading-snug">
                        {{ p.tipoDanzaNombre || metaFraternidadModal.danza || '—' }}
                      </p>
                      <p v-if="p.categoriaNombre || metaFraternidadModal.categoria" class="text-[11px] text-slate-500 font-medium mt-1">
                        {{ p.categoriaNombre || metaFraternidadModal.categoria }}
                      </p>
                    </div>
                    <div v-if="p.ci" class="rounded-2xl bg-slate-50 border border-slate-100 px-3.5 py-3">
                      <p class="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Cédula</p>
                      <p class="text-sm font-bold text-slate-800">{{ p.ci }}</p>
                    </div>
                    <div v-if="p.celular || p.correo" class="rounded-2xl bg-slate-50 border border-slate-100 px-3.5 py-3">
                      <p class="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Contacto</p>
                      <p v-if="p.celular" class="text-sm font-bold text-slate-800">{{ p.celular }}</p>
                      <p v-if="p.correo" class="text-[11px] text-slate-500 font-medium truncate">{{ p.correo }}</p>
                    </div>
                  </div>
                </div>

                <div class="flex sm:flex-col gap-2 shrink-0 self-start">
                  <button
                    type="button"
                    @click="abrirModalEditar(p)"
                    class="size-10 rounded-xl bg-slate-50 border border-slate-200 text-slate-500 hover:text-primary hover:border-primary/30 flex items-center justify-center transition-colors"
                    title="Editar"
                  >
                    <span class="material-symbols-outlined text-[18px]">edit</span>
                  </button>
                  <button
                    type="button"
                    @click="confirmarEliminar(p)"
                    class="size-10 rounded-xl bg-slate-50 border border-slate-200 text-slate-500 hover:text-secondary hover:border-secondary/30 flex items-center justify-center transition-colors"
                    title="Eliminar"
                  >
                    <span class="material-symbols-outlined text-[18px]">delete</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="p-4 sm:px-8 bg-white border-t border-slate-100 flex justify-end shrink-0">
          <button
            type="button"
            @click="modalFraternidad = null"
            class="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl font-black text-xs uppercase tracking-widest transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>

    <!-- CREATE/EDIT MODAL -->
    <div v-if="modalAbierto" class="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div class="bg-white w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
        <div class="bg-primary px-6 py-4 flex items-center justify-between text-white">
          <h3 class="font-black italic uppercase tracking-widest text-lg">{{ editando ? 'Editar Inscripción' : 'Nueva Inscripción' }}</h3>
          <button type="button" @click="modalAbierto = false" class="text-white/60 hover:text-white transition-colors">
            <span class="material-symbols-outlined">close</span>
          </button>
        </div>

        <div class="p-8 space-y-6 max-h-[70vh] overflow-y-auto">
          <div>
            <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Nombre Completo</label>
            <input
              v-model="form.nombre"
              type="text"
              placeholder="Ej. Juan Pérez"
              class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none focus:border-primary transition-all shadow-inner"
            />
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Tipo / Categoría</label>
              <select v-model="form.tipo" class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none focus:border-primary appearance-none">
                <option value="Chacha">Chacha</option>
                <option value="Warmi">Warmi</option>
                <option value="Fotógrafo">Fotógrafo</option>
                <option value="Diseñador">Diseñador</option>
                <option value="Participante">Participante</option>
                <option value="Otro">Otro</option>
              </select>
            </div>
            <div>
              <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Procedencia</label>
              <select v-model="form.esUmsa" class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none focus:border-primary appearance-none">
                <option :value="true">Pertenece a la UMSA</option>
                <option :value="false">Es Externo</option>
              </select>
            </div>
          </div>

          <div v-if="form.esUmsa" class="grid grid-cols-1 gap-4 animate-in fade-in duration-300">
            <div>
              <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Facultad</label>
              <select v-model="form.idFacultad" class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none focus:border-primary appearance-none">
                <option :value="null" disabled>Selecciona Facultad</option>
                <option v-for="f in facultades" :key="f.idFacultad" :value="f.idFacultad">{{ f.nombre }}</option>
              </select>
            </div>
            <div>
              <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Carrera</label>
              <select
                v-model="form.idCarrera"
                class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none focus:border-primary appearance-none"
                :disabled="!form.idFacultad || loadingCarreras"
              >
                <option :value="null" disabled>{{ loadingCarreras ? 'Cargando...' : 'Selecciona Carrera' }}</option>
                <option v-for="c in carreras" :key="c.idCarrera" :value="c.idCarrera">{{ c.nombre }}</option>
              </select>
            </div>
          </div>

          <div v-else class="animate-in fade-in duration-300">
            <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Institución / Lugar de procedencia</label>
            <input
              v-model="form.institucionExterna"
              type="text"
              placeholder="Ej. Institución ABC"
              class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none focus:border-primary transition-all shadow-inner"
            />
          </div>

          <div v-if="!esDelegado" class="space-y-4 pt-2">
            <div class="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <div class="flex items-center gap-3">
                <span class="material-symbols-outlined text-primary">groups</span>
                <span class="text-xs font-bold text-slate-700 uppercase tracking-wider">¿Pertenece a una Fraternidad?</span>
              </div>
              <v-switch v-model="form.perteneceFraternidad" color="primary" density="compact" hide-details></v-switch>
            </div>

            <div v-if="form.perteneceFraternidad" class="animate-in slide-in-from-top-2 duration-300">
              <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Seleccionar Fraternidad</label>
              <select v-model="form.idFraternidad" class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none focus:border-primary appearance-none">
                <option :value="null" disabled>Selecciona Fraternidad</option>
                <option v-for="f in fraternidades" :key="f.idFraternidad" :value="f.idFraternidad">{{ f.nombre }}</option>
              </select>
            </div>
          </div>
        </div>

        <div class="p-6 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
          <button type="button" @click="modalAbierto = false" class="px-5 py-3 text-slate-500 hover:bg-slate-200 rounded-xl font-bold text-xs uppercase tracking-widest transition-colors">Cancelar</button>
          <button
            type="button"
            @click="guardar"
            :disabled="!form.nombre || (form.esUmsa && (!form.idFacultad || !form.idCarrera)) || (!form.esUmsa && !form.institucionExterna) || (form.perteneceFraternidad && !form.idFraternidad) || guardando"
            class="px-8 py-3 bg-primary text-white font-black rounded-2xl text-xs uppercase tracking-widest shadow-lg shadow-primary/20 hover:brightness-110 active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50"
          >
            <span v-if="guardando" class="material-symbols-outlined animate-spin text-[16px]">sync</span>
            {{ editando ? 'Actualizar' : 'Confirmar Inscripción' }}
          </button>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, onMounted, watch, computed } from 'vue'
import api from '../services/api'
import Swal from 'sweetalert2'
import { useAuthStore } from '../store/auth'
import { esFaseChachaWarmi } from '../utils/chachaWarmi'

const authStore = useAuthStore()
const esDelegado = computed(() => authStore.userRole === 'delegado')

const fasesExternas = ref([])
const loadingFases = ref(true)

const faseSeleccionada = ref(null)
const participantes = ref([])
const loadingParticipantes = ref(false)
const modalFraternidad = ref(null)
const descargandoAudios = ref(false)

const fraternidades = ref([])
const modalAbierto = ref(false)
const editando = ref(false)
const guardando = ref(false)

const form = ref({
  idParticipante: null,
  nombre: '',
  tipo: 'Participante',
  esUmsa: true,
  idFacultad: null,
  idCarrera: null,
  institucionExterna: '',
  perteneceFraternidad: false,
  idFraternidad: null,
})

const facultades = ref([])
const carreras = ref([])
const loadingCarreras = ref(false)

const esFaseChacha = (f) => esFaseChachaWarmi(f)

const esChachaActiva = computed(() => esFaseChachaWarmi(faseSeleccionada.value))

const etiquetaPlantilla = (f) => {
  if (esFaseChachaWarmi(f)) return 'Chacha-Warmi'
  const p = String(f?.plantillaRequisitos || '').toLowerCase()
  if (p === 'fotografia') return 'Fotografía'
  if (p === 'generico') return 'Otros'
  return f?.tipoConcurso || 'EXTERNO'
}

const fraternidadesChacha = computed(() => {
  const map = new Map()
  for (const p of participantes.value) {
    const id = p.fraternidad?.idFraternidad ?? null
    const key = id ?? 'sin'
    if (!map.has(key)) {
      map.set(key, {
        idFraternidad: id,
        nombre: p.fraternidad?.nombre || 'Sin fraternidad asignada',
        fraternidad: p.fraternidad || null,
        instancia: p.instanciaRepresentacion || p.fraternidad?.nivelRepresentacion || '',
        danza: p.tipoDanzaNombre || p.fraternidad?.tipoDanza?.nombre || '',
        categoria: p.categoriaNombre || p.fraternidad?.categoria?.nombre || '',
        facultadCarrera: p.facultadCarreraLabel || '',
        participantes: [],
      })
    }
    const g = map.get(key)
    g.participantes.push(p)
    if (!g.instancia && (p.instanciaRepresentacion || p.fraternidad?.nivelRepresentacion)) {
      g.instancia = p.instanciaRepresentacion || p.fraternidad?.nivelRepresentacion
    }
    if (!g.danza && (p.tipoDanzaNombre || p.fraternidad?.tipoDanza?.nombre)) {
      g.danza = p.tipoDanzaNombre || p.fraternidad?.tipoDanza?.nombre
    }
    if (!g.facultadCarrera && p.facultadCarreraLabel) {
      g.facultadCarrera = p.facultadCarreraLabel
    }
  }
  return Array.from(map.values()).sort((a, b) =>
    String(a.nombre).localeCompare(String(b.nombre), 'es'),
  )
})

const metaFraternidadModal = computed(() => {
  const g = modalFraternidad.value
  if (!g) return { instancia: '', danza: '', categoria: '', facultadCarrera: '' }
  const first = g.participantes?.[0]
  const frat = g.fraternidad || first?.fraternidad
  const instancia =
    g.instancia ||
    first?.instanciaRepresentacion ||
    frat?.nivelRepresentacion ||
    ''
  const facultadFromFrat = [frat?.facultad?.nombre, frat?.carrera?.nombre].filter(Boolean).join(' — ')
  return {
    instancia,
    danza: g.danza || first?.tipoDanzaNombre || frat?.tipoDanza?.nombre || '',
    categoria: g.categoria || first?.categoriaNombre || frat?.categoria?.nombre || '',
    facultadCarrera:
      g.facultadCarrera ||
      first?.facultadCarreraLabel ||
      facultadFromFrat ||
      frat?.institucionExterna?.nombre ||
      '',
  }
})

const labelFacultadParticipante = (p) =>
  p.facultadCarreraLabel ||
  [p.facultad?.nombre, p.carrera?.nombre].filter(Boolean).join(' — ') ||
  metaFraternidadModal.value.facultadCarrera ||
  (p.esUmsa ? 'UMSA' : p.institucionExterna || '—')

const labelInstanciaParticipante = (p) =>
  p.instanciaRepresentacion ||
  p.datosExpediente?.instanciaRepresentacion ||
  metaFraternidadModal.value.instancia ||
  ''

const participantesOrdenadosModal = computed(() => {
  const list = [...(modalFraternidad.value?.participantes || [])]
  const orden = { Chacha: 0, Warmi: 1 }
  return list.sort((a, b) => {
    const oa = orden[a.tipo] ?? 9
    const ob = orden[b.tipo] ?? 9
    if (oa !== ob) return oa - ob
    return String(a.nombre || '').localeCompare(String(b.nombre || ''), 'es')
  })
})

const resumenTipos = (lista) => {
  const chacha = lista.filter((p) => p.tipo === 'Chacha').length
  const warmi = lista.filter((p) => p.tipo === 'Warmi').length
  const partes = []
  if (chacha) partes.push(`${chacha} Chacha`)
  if (warmi) partes.push(`${warmi} Warmi`)
  if (!partes.length) partes.push(`${lista.length} inscrito(s)`)
  return partes.join(' · ')
}

const cargarFases = async () => {
  loadingFases.value = true
  try {
    const { data } = await api.get('/evaluaciones/fases-auth')
    fasesExternas.value = (data || []).filter((f) => f.tipoConcurso === 'EXTERNO')
  } catch {
    Swal.fire('Error', 'No se pudieron cargar los concursos externos', 'error')
  } finally {
    loadingFases.value = false
  }
}

const seleccionarFase = async (fase) => {
  faseSeleccionada.value = fase
  modalFraternidad.value = null
  await cargarParticipantes()
}

const volverAFases = () => {
  faseSeleccionada.value = null
  participantes.value = []
  modalFraternidad.value = null
}

const cargarParticipantes = async () => {
  if (!faseSeleccionada.value) return
  loadingParticipantes.value = true
  try {
    const { data } = await api.get(`/participantes/fase/${faseSeleccionada.value.idFase}`)
    participantes.value = data || []
    // Si el modal de fraternidad está abierto, refrescar su lista
    if (modalFraternidad.value) {
      const id = modalFraternidad.value.idFraternidad
      const grupo = fraternidadesChacha.value.find((g) => g.idFraternidad === id)
        || (id == null ? fraternidadesChacha.value.find((g) => g.idFraternidad == null) : null)
      modalFraternidad.value = grupo || null
    }
  } catch (error) {
    const msg = error.response?.data?.message || 'No se pudieron cargar los participantes'
    Swal.fire('Error', msg, 'error')
  } finally {
    loadingParticipantes.value = false
  }
}

const descargarAudiosZip = async () => {
  if (!faseSeleccionada.value?.idFase) return
  descargandoAudios.value = true
  try {
    const { data } = await api.get(
      `/participantes/fase/${faseSeleccionada.value.idFase}/audios-zip`,
      { responseType: 'blob' },
    )
    const blob = data instanceof Blob ? data : new Blob([data], { type: 'application/zip' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    const safeName = String(faseSeleccionada.value.nombre || 'ChachaWarmi')
      .replace(/[^\w\-]+/g, '_')
      .slice(0, 40)
    a.download = `Audios_${safeName}.zip`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  } catch (error) {
    let msg = 'No se pudo descargar el ZIP de audios.'
    const blob = error.response?.data
    if (blob instanceof Blob) {
      try {
        const text = await blob.text()
        const parsed = JSON.parse(text)
        msg = parsed.message || msg
      } catch { /* ignore */ }
    } else if (error.response?.data?.message) {
      msg = error.response.data.message
    }
    Swal.fire('Sin audios', msg, 'info')
  } finally {
    descargandoAudios.value = false
  }
}

const abrirModalFraternidad = (grupo) => {
  modalFraternidad.value = grupo
}

const cargarFraternidades = async () => {
  try {
    const { data } = await api.get('/fraternidades')
    fraternidades.value = data
  } catch {
    fraternidades.value = []
  }
}

const cargarFacultades = async () => {
  try {
    const { data } = await api.get('/organizacion/facultades')
    facultades.value = data
  } catch {
    facultades.value = []
  }
}

const cargarCarreras = async (idFacultad) => {
  if (!idFacultad) {
    carreras.value = []
    return
  }
  loadingCarreras.value = true
  try {
    const { data } = await api.get(`/organizacion/facultades/${idFacultad}/carreras`)
    carreras.value = data
  } catch {
    carreras.value = []
  } finally {
    loadingCarreras.value = false
  }
}

watch(() => form.value.idFacultad, (newVal) => {
  if (newVal) cargarCarreras(newVal)
  else carreras.value = []
})

const abrirModalCrear = () => {
  editando.value = false
  form.value = {
    nombre: '',
    tipo: 'Participante',
    esUmsa: true,
    idFacultad: null,
    idCarrera: null,
    institucionExterna: '',
    perteneceFraternidad: false,
    idFraternidad: null,
  }
  modalAbierto.value = true
}

const abrirModalEditar = (p) => {
  editando.value = true
  form.value = {
    idParticipante: p.idParticipante,
    nombre: p.nombre,
    tipo: p.tipo,
    esUmsa: !!p.esUmsa,
    idFacultad: p.facultad?.idFacultad || null,
    idCarrera: p.carrera?.idCarrera || null,
    institucionExterna: p.institucionExterna || '',
    perteneceFraternidad: !!p.perteneceFraternidad,
    idFraternidad: p.fraternidad?.idFraternidad || null,
  }
  if (p.facultad?.idFacultad) cargarCarreras(p.facultad.idFacultad)
  modalAbierto.value = true
}

const guardar = async () => {
  guardando.value = true
  try {
    const payload = {
      nombre: form.value.nombre,
      tipo: form.value.tipo,
      idFase: faseSeleccionada.value.idFase,
      esUmsa: form.value.esUmsa,
      idFacultad: form.value.esUmsa ? form.value.idFacultad : null,
      idCarrera: form.value.esUmsa ? form.value.idCarrera : null,
      institucionExterna: !form.value.esUmsa ? form.value.institucionExterna : null,
      perteneceFraternidad: form.value.perteneceFraternidad,
      idFraternidad: form.value.perteneceFraternidad ? form.value.idFraternidad : null,
    }

    if (editando.value) {
      await api.put(`/participantes/${form.value.idParticipante}`, payload)
    } else {
      await api.post('/participantes', payload)
    }

    modalAbierto.value = false
    Swal.fire({
      icon: 'success',
      title: 'Realizado',
      text: 'Inscripción procesada correctamente.',
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      timer: 2000,
    })
    await cargarParticipantes()
  } catch (error) {
    Swal.fire('Error', error.response?.data?.message || 'Error al procesar la inscripción.', 'error')
  } finally {
    guardando.value = false
  }
}

const confirmarEliminar = (p) => {
  Swal.fire({
    title: '¿Eliminar Inscripción?',
    text: `Se borrará a ${p.nombre} de este concurso. Esta acción no se puede deshacer.`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#d33',
    confirmButtonText: 'Sí, eliminar',
    cancelButtonText: 'Cancelar',
  }).then(async (result) => {
    if (result.isConfirmed) {
      try {
        await api.delete(`/participantes/${p.idParticipante}`)
        await cargarParticipantes()
        Swal.fire('Eliminado', 'El participante ha sido removido.', 'success')
      } catch {
        Swal.fire('Error', 'No se pudo eliminar.', 'error')
      }
    }
  })
}

onMounted(() => {
  cargarFases()
  cargarFraternidades()
  cargarFacultades()
})
</script>
