<template>
  <div class="p-6 md:p-8 max-w-7xl mx-auto">

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
        <h2 class="text-3xl font-black text-primary tracking-tighter uppercase italic">Fases de Evaluación</h2>
        <p class="text-slate-500 text-sm mt-1" v-if="resumen.gestion?.lema">"{{ resumen.gestion.lema }}"</p>
      </div>
      <button
        @click="abrirModal()"
        class="bg-primary hover:bg-blue-900 text-white px-6 py-3 rounded-xl font-black transition-all flex items-center gap-2 shadow-lg shadow-primary/20"
      >
        <span class="material-symbols-outlined">add_circle</span>
        Nueva Fase
      </button>
    </div>

    <!-- Resumen Presupuesto EFU -->
    <div class="mb-6 bg-white border border-slate-200 rounded-2xl px-6 py-5 flex flex-wrap items-center gap-8 shadow-sm">
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
            <th class="px-6 py-4">Vigencia</th>
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
              <div class="flex flex-col gap-0.5">
                <span><span class="text-[9px] font-black text-slate-400 uppercase">Desde</span> {{ fmtFecha(fase.fechaInicio) }}</span>
                <span><span class="text-[9px] font-black text-slate-400 uppercase">Hasta</span> {{ fmtFecha(fase.fechaFin) }}</span>
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
            <div class="flex justify-between"><span class="font-black uppercase tracking-widest">Inicio:</span> <span>{{ fmtFecha(fase.fechaInicio) }}</span></div>
            <div class="flex justify-between"><span class="font-black uppercase tracking-widest">Fin:</span> <span>{{ fmtFecha(fase.fechaFin) }}</span></div>
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
    <v-dialog v-model="modalJuradosOpen" max-width="520px">
      <v-card class="rounded-2xl">
        <v-card-title class="bg-slate-800 text-white pa-6">
          <h3 class="text-lg font-black italic uppercase tracking-tighter">Asignar Jurados</h3>
          <p class="text-slate-300 text-xs font-medium mt-0.5">{{ faseParaJurados?.nombre }}</p>
        </v-card-title>
        <v-card-text class="pa-6">
          <p class="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">
            {{ esFaseDisciplina(faseParaJurados) ? controladoresList.length : juradosParaFase.length }} 
            {{ esFaseDisciplina(faseParaJurados) ? 'Controlador(es)' : 'Jurado(s)' }} 
            disponibles para {{ esFaseDisciplina(faseParaJurados) ? 'esta tarea' : 'este tipo de fase' }}
          </p>
          <div class="space-y-2 max-h-72 overflow-y-auto">
            <!-- LISTADO PARA DISCIPLINA (CONTROLADORES) -->
            <template v-if="esFaseDisciplina(faseParaJurados)">
              <label v-for="c in controladoresList" :key="c.idUsuario"
                class="flex items-center gap-3 p-3 rounded-xl border border-slate-100 hover:border-primary/30 hover:bg-primary/5 cursor-pointer transition-all">
                <input type="checkbox" :value="c.idUsuario" v-model="usuariosSeleccionados" class="size-4 accent-primary rounded" />
                <div class="size-8 rounded-full bg-emerald-50 flex items-center justify-center flex-shrink-0">
                  <span class="material-symbols-outlined text-[16px] text-emerald-600">shield_person</span>
                </div>
                <div class="flex-1">
                  <p class="text-sm font-bold text-slate-800">{{ c.nombre }}</p>
                  <p class="text-[9px] uppercase font-black tracking-widest text-emerald-600">
                    Controlador HCU · CI: {{ c.ci }}
                  </p>
                </div>
              </label>
            </template>

            <!-- LISTADO PARA OTRAS FASES (JURADOS) -->
            <template v-else>
              <label v-for="j in juradosParaFase" :key="j.idJurado"
                class="flex items-center gap-3 p-3 rounded-xl border border-slate-100 hover:border-primary/30 hover:bg-primary/5 cursor-pointer transition-all">
                <input type="checkbox" :value="j.idJurado" v-model="juradosSeleccionados" class="size-4 accent-primary rounded" />
                <div class="size-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <span class="material-symbols-outlined text-[16px] text-primary">person</span>
                </div>
                <div class="flex-1">
                  <p class="text-sm font-bold text-slate-800">{{ j.nombre }}</p>
                  <p class="text-[9px] uppercase font-black tracking-widest"
                    :class="j.tipoJurado === 'EFU' ? 'text-blue-500' : j.tipoJurado === 'EXTERNO' ? 'text-amber-500' : 'text-emerald-500'">
                    {{ j.tipoJurado }} · CI: {{ j.ci }}
                  </p>
                </div>
              </label>
            </template>
            
            <p v-if="(!esFaseDisciplina(faseParaJurados) && juradosParaFase.length === 0) || (esFaseDisciplina(faseParaJurados) && controladoresList.length === 0)" 
              class="text-center text-slate-400 italic text-sm py-6">
              No hay personal registrado para este tipo de fase.
            </p>
          </div>
        </v-card-text>
        <v-card-actions class="pa-4 border-t border-slate-100 bg-slate-50">
          <v-spacer></v-spacer>
          <button @click="modalJuradosOpen = false" class="px-4 py-2 text-slate-500 font-bold text-sm hover:text-slate-800 transition-colors">Cancelar</button>
          <button @click="guardarAsignacionJurados" :disabled="savingJurados"
            class="px-6 py-2 bg-primary text-white rounded-xl font-black text-sm shadow-lg shadow-primary/20 hover:bg-blue-900 transition-all flex items-center gap-2">
            <span v-if="savingJurados" class="material-symbols-outlined animate-spin text-[16px]">progress_activity</span>
            {{ savingJurados ? 'Guardando...' : 'Confirmar Asignación' }}
          </button>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- MODAL CREAR / EDITAR FASE -->
    <v-dialog v-model="modalOpen" max-width="520px">
      <v-card class="rounded-2xl">
        <v-card-title class="bg-primary text-white pa-6">
          <h3 class="text-xl font-black italic uppercase tracking-tighter">{{ editandoId ? 'Editar Fase' : 'Nueva Fase' }}</h3>
          <p class="text-blue-200 text-xs font-medium mt-0.5">Gestión {{ resumen.gestion?.anio }}</p>
        </v-card-title>

        <v-card-text class="pa-6 max-h-[70vh] overflow-y-auto">
          <div class="space-y-5">

            <!-- Nombre -->
            <div>
              <label class="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Nombre de la Fase *</label>
              <input
                v-model="form.nombre"
                type="text"
                placeholder="Ej: Primer Convite, Fotografía, Monografía…"
                class="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-xl focus:border-primary outline-none font-bold transition-all"
              />
            </div>

            <!-- Tipo de Concurso -->
            <div>
              <label class="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3">Categoría *</label>
              <div class="grid grid-cols-2 gap-3">
                <button type="button" @click="form.tipoConcurso = 'EFU'"
                  :class="form.tipoConcurso === 'EFU' ? 'border-primary bg-primary/5 text-primary' : 'border-slate-200 text-slate-400 hover:border-primary/30'"
                  class="flex flex-col items-center gap-2 border-2 rounded-xl py-4 px-2 transition-all">
                  <span class="material-symbols-outlined text-2xl">school</span>
                  <div class="text-center">
                    <p class="text-[10px] font-black uppercase tracking-widest">EFU</p>
                    <p class="text-[9px] text-slate-400 mt-0.5">Evaluación Folclórica Universitaria</p>
                  </div>
                </button>
                <button type="button" @click="form.tipoConcurso = 'EXTERNO'"
                  :class="form.tipoConcurso === 'EXTERNO' ? 'border-secondary bg-secondary/5 text-secondary' : 'border-slate-200 text-slate-400 hover:border-secondary/30'"
                  class="flex flex-col items-center gap-2 border-2 rounded-xl py-4 px-2 transition-all">
                  <span class="material-symbols-outlined text-2xl">emoji_events</span>
                  <div class="text-center">
                    <p class="text-[10px] font-black uppercase tracking-widest">Concurso Externo</p>
                    <p class="text-[9px] text-slate-400 mt-0.5">Independiente de la EFU</p>
                  </div>
                </button>
              </div>
            </div>

            <!-- Ponderación + Indicador en tiempo real -->
            <div>
              <div class="flex items-end justify-between mb-2">
                <label class="text-[10px] font-black uppercase tracking-widest text-slate-500">Ponderación (%) *</label>
                <!-- Indicador solo para EFU -->
                <div v-if="form.tipoConcurso === 'EFU'" class="flex items-center gap-1.5 text-[10px] font-black">
                  <span :class="disponibleEFUCalc < 0 ? 'text-secondary' : 'text-primary'">
                    {{ disponibleEFUCalc < 0 ? '⚠ Techo Excedido' : 'Disponible en Gestión:' }}
                    {{ Math.max(0, disponibleEFUCalc) }}%
                  </span>
                </div>
                <span v-else class="text-[10px] font-black text-secondary uppercase tracking-widest">Independiente</span>
              </div>

              <input
                v-model.number="form.pesoPorcentaje"
                type="number"
                min="1"
                max="100"
                :class="form.tipoConcurso === 'EFU' && disponibleEFUCalc < 0 ? 'border-red-400 bg-red-50' : 'border-slate-100 bg-slate-50 focus:border-primary'"
                class="w-full px-4 py-3 border-2 rounded-xl outline-none font-bold transition-all"
              />

              <!-- Barra visual en tiempo real (solo EFU) -->
              <div v-if="form.tipoConcurso === 'EFU'" class="mt-2">
                <div class="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    class="h-full rounded-full transition-all duration-300"
                    :class="pesoEFUConActual > 100 ? 'bg-secondary' : 'bg-primary'"
                    :style="{ width: Math.min(pesoEFUConActual, 100) + '%' }"
                  ></div>
                </div>
                <div class="flex justify-between text-[9px] text-slate-400 font-black mt-1">
                  <span>0%</span>
                  <span :class="pesoEFUConActual > 100 ? 'text-secondary' : ''">{{ pesoEFUConActual }}% usado</span>
                  <span>100%</span>
                </div>
              </div>
            </div>

            <!-- Estado + Fechas -->
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Fecha Inicio</label>
                <input v-model="form.fechaInicio" type="date" class="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm" />
              </div>
              <div>
                <label class="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Fecha Fin</label>
                <input v-model="form.fechaFin" type="date" class="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm" />
              </div>
            </div>

            <div class="flex items-center gap-4">
              <label class="text-[10px] font-black uppercase tracking-widest text-slate-500">Estado</label>
              <v-switch v-model="form.estaActiva" color="primary" density="compact" inset hide-details></v-switch>
              <span class="text-xs font-bold text-slate-600">{{ form.estaActiva ? 'Activa' : 'Inactiva' }}</span>
            </div>

            <!-- URL Imagen -->
            <div>
              <label class="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Imagen de Portada (.png, .jpg)</label>
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
                <div v-if="archivoPreview || form.urlImagen" class="h-32 w-full relative">
                  <img :src="archivoPreview || getImageUrl(form.urlImagen)" class="w-full h-full object-cover" />
                  <div class="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span class="text-white font-bold text-[10px] uppercase tracking-widest flex items-center gap-2"><span class="material-symbols-outlined text-[16px]">upload</span> Cambiar Imagen</span>
                  </div>
                </div>
                <div v-else class="h-32 flex flex-col items-center justify-center text-slate-400 group-hover:text-primary transition-colors">
                  <span class="material-symbols-outlined text-3xl mb-1">add_photo_alternate</span>
                  <span class="text-[10px] font-black uppercase tracking-widest">Arrastra o haz clic para subir</span>
                </div>
              </div>
            </div>

            <!-- Asignación de Jurados -->
            <div class="border-t border-slate-100 pt-4">
              <label class="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 flex items-center justify-between">
                <span>Asignar Jurados Especialistas</span>
                <span v-if="editandoId && form.tipoConcurso === 'EFU'" class="text-[9px] text-primary italic lowercase font-bold tracking-normal">Filtrados por especialidad en "{{ form.nombre }}"</span>
              </label>
              <div class="bg-slate-50 border-2 border-slate-100 p-3 rounded-xl max-h-40 overflow-y-auto space-y-1">
                <div v-if="juradosDisponibles.length === 0" class="text-xs text-slate-400 italic py-4 text-center">
                  <span class="material-symbols-outlined block mb-1 opacity-50">person_search</span>
                  No hay jurados de tipo {{ form.tipoConcurso }} registrados{{ editandoId && form.tipoConcurso === 'EFU' ? ' y habilitados para esta fase' : '' }}.
                </div>
                <label v-for="jurado in juradosDisponibles" :key="jurado.idJurado"
                  class="flex items-center gap-3 cursor-pointer p-2 hover:bg-white rounded-lg transition-all">
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

        <v-card-actions class="pa-6 border-t border-slate-100">
          <v-spacer></v-spacer>
          <button @click="modalOpen = false" class="px-6 py-2 text-slate-500 font-bold hover:text-primary transition-all">Cancelar</button>
          <button
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
  estaActiva: true,
  urlImagen: '',
  juradosIds: []
})

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

const abrirModalJurados = (fase) => {
  faseParaJurados.value = fase
  // Pre-seleccionar los jurados ya asignados
  juradosSeleccionados.value = (fase.jurados || []).map(j => j.idJurado)
  // Pre-seleccionar los controladores si es fase de disciplina
  if (esFaseDisciplina(fase)) {
    usuariosSeleccionados.value = (fase.jurados || [])
      .filter(j => j.usuario && j.usuario.rol?.nombre === 'controladorhcu')
      .map(j => j.usuario.idUsuario)
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
    const payload = {
      juradoIds: juradosSeleccionados.value
    }
    if (esFaseDisciplina(faseParaJurados.value)) {
      payload.usuarioIds = usuariosSeleccionados.value
    }

    await api.post(`/usuarios/fases/${faseParaJurados.value.idFase}/jurados`, payload)
    modalJuradosOpen.value = false
    notify.success('Asignación guardada', `Personal asignado a "${faseParaJurados.value.nombre}"`)
    cargarFases()
  } catch (e) {
    notify.error('Error', 'No se pudo guardar la asignación de jurados.')
  } finally {
    savingJurados.value = false
  }
}

// ── CRUD ──────────────────────────────────────────────────────────────────
const abrirModal = (item = null) => {
  if (item) {
    editandoId.value = item.idFase
    form.value = {
      nombre: item.nombre,
      tipoConcurso: item.tipoConcurso || 'EFU',
      pesoPorcentaje: Number(item.pesoPorcentaje),
      fechaInicio: item.fechaInicio?.split('T')[0] || '',
      fechaFin: item.fechaFin?.split('T')[0] || '',
      estaActiva: item.estaActiva,
      urlImagen: item.urlImagen || '',
      juradosIds: item.jurados?.map(j => j.idJurado) || []
    }
  } else {
    editandoId.value = null
    form.value = {
      nombre: '', tipoConcurso: 'EFU', pesoPorcentaje: 20,
      fechaInicio: '', fechaFin: '', estaActiva: true, urlImagen: '', juradosIds: []
    }
  }
  
  archivoImagen.value = null
  archivoPreview.value = null
  modalOpen.value = true

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
  if (form.value.fechaInicio && form.value.fechaFin) {
    if (new Date(form.value.fechaFin) < new Date(form.value.fechaInicio)) {
      return notify.error('Error Lógico', 'La fecha de fin debe ser estrictamente posterior o igual a la fecha de inicio.')
    }
  }

  try {
    const payloadInfo = {
      ...form.value,
      gestionId: props.gestionSeleccionada?.idGestion || null
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

const fmtFecha = (s) => s ? new Date(s).toLocaleDateString('es-BO') : '—'

// Recargar si cambia la gestión seleccionada
watch(() => props.gestionSeleccionada, cargarFases)

onMounted(() => {
  cargarFases()
  cargarJurados()
  cargarControladores()
})
</script>
