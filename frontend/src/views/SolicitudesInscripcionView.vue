<template>
  <div class="min-h-full bg-slate-50">

    <!-- ===== DETALLE SOLICITUD (panel deslizante) ===== -->
    <transition name="slide-right">
      <div v-if="solicitudActiva" class="fixed inset-0 z-50 flex">
        <!-- Backdrop -->
        <div class="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" @click="cerrarDetalle"></div>

        <!-- Panel -->
        <div class="relative ml-auto w-full max-w-5xl h-full bg-white shadow-2xl flex flex-col overflow-hidden">

          <!-- Header del panel -->
          <div class="shrink-0 bg-primary px-6 py-5 flex items-center justify-between">
            <div>
              <p class="text-[10px] text-white/60 font-black uppercase tracking-widest">Solicitud #{{ solicitudActiva.idSolicitud }}</p>
              <h2 class="text-xl font-black text-white italic uppercase tracking-tighter leading-tight">
                {{ solicitudActiva.nombreFraternidad }}
              </h2>
              <p class="text-xs text-white/70 font-medium mt-0.5">
                {{ solicitudActiva.categoria?.nombre }} · {{ instanciaLabel(solicitudActiva) }}
              </p>
            </div>
            <div class="flex items-center gap-3">
              <!-- Badge estado -->
              <div
                class="px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border"
                :class="estadoStyle(solicitudActiva.estado).badge"
              >
                {{ solicitudActiva.estado }}
              </div>
              <button @click="cerrarDetalle" class="size-9 bg-white/10 hover:bg-white/20 rounded-xl flex items-center justify-center text-white transition-colors">
                <span class="material-symbols-outlined">close</span>
              </button>
            </div>
          </div>

          <!-- Contenido scrollable -->
          <div class="flex-1 overflow-y-auto custom-scrollbar">

            <!-- === DELEGADO === -->
            <section class="px-6 py-5 border-b border-slate-100">
              <h3 class="section-title">Delegado</h3>
              <div class="space-y-3">
                <div class="flex flex-col gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-4 md:flex-row md:items-end md:justify-between">
                  <div class="min-w-0 flex-1">
                    <p class="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-0.5">Nombre Completo</p>
                    <p class="text-sm font-medium text-slate-800 break-words">{{ `${solicitudActiva.delegado?.nombres || ''} ${solicitudActiva.delegado?.primerApellido || ''} ${solicitudActiva.delegado?.segundoApellido || ''}` || '—' }}</p>
                  </div>
                  <div class="flex items-center gap-2 shrink-0">
                    <button @click.stop="setChecklistEstado({ key: 'delegadoNombre', label: 'Delegado - Nombre Completo', value: `${solicitudActiva.delegado?.nombres || ''} ${solicitudActiva.delegado?.primerApellido || ''} ${solicitudActiva.delegado?.segundoApellido || ''}` }, 'OK')" :class="['size-9 rounded-xl border text-sm font-black transition-all flex items-center justify-center', checklistBotonClase('delegadoNombre', 'OK')]" aria-label="Marcar correcto">✓</button>
                    <button @click.stop="setChecklistEstado({ key: 'delegadoNombre', label: 'Delegado - Nombre Completo', value: `${solicitudActiva.delegado?.nombres || ''} ${solicitudActiva.delegado?.primerApellido || ''} ${solicitudActiva.delegado?.segundoApellido || ''}` }, 'X')" :class="['size-9 rounded-xl border text-sm font-black transition-all flex items-center justify-center', checklistBotonClase('delegadoNombre', 'X')]" aria-label="Marcar incorrecto">✕</button>
                  </div>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div class="flex flex-col gap-3 rounded-2xl border border-slate-100 bg-white p-4 md:flex-row md:items-end md:justify-between">
                    <div class="min-w-0 flex-1">
                      <p class="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-0.5">CI Delegado</p>
                      <p class="text-sm font-medium text-slate-800 break-words">{{ solicitudActiva.delegado?.ci || '—' }}</p>
                    </div>
                    <div class="flex items-center gap-2 shrink-0">
                      <button @click.stop="setChecklistEstado({ key: 'delegadoCi', label: 'Delegado - CI', value: solicitudActiva.delegado?.ci || '' }, 'OK')" :class="['size-9 rounded-xl border text-sm font-black transition-all flex items-center justify-center', checklistBotonClase('delegadoCi', 'OK')]" aria-label="Marcar correcto">✓</button>
                      <button @click.stop="setChecklistEstado({ key: 'delegadoCi', label: 'Delegado - CI', value: solicitudActiva.delegado?.ci || '' }, 'X')" :class="['size-9 rounded-xl border text-sm font-black transition-all flex items-center justify-center', checklistBotonClase('delegadoCi', 'X')]" aria-label="Marcar incorrecto">✕</button>
                    </div>
                  </div>
                  <div class="flex flex-col gap-3 rounded-2xl border border-slate-100 bg-white p-4 md:flex-row md:items-end md:justify-between">
                    <div class="min-w-0 flex-1">
                      <p class="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-0.5">Fecha de Solicitud</p>
                      <p class="text-sm font-medium text-slate-800 break-words">{{ formatFecha(solicitudActiva.createdAt) || '—' }}</p>
                    </div>
                    <div class="flex items-center gap-2 shrink-0">
                      <button @click.stop="setChecklistEstado({ key: 'fechaSolicitud', label: 'Fecha de Solicitud', value: formatFecha(solicitudActiva.createdAt) || '' }, 'OK')" :class="['size-9 rounded-xl border text-sm font-black transition-all flex items-center justify-center', checklistBotonClase('fechaSolicitud', 'OK')]" aria-label="Marcar correcto">✓</button>
                      <button @click.stop="setChecklistEstado({ key: 'fechaSolicitud', label: 'Fecha de Solicitud', value: formatFecha(solicitudActiva.createdAt) || '' }, 'X')" :class="['size-9 rounded-xl border text-sm font-black transition-all flex items-center justify-center', checklistBotonClase('fechaSolicitud', 'X')]" aria-label="Marcar incorrecto">✕</button>
                    </div>
                  </div>
                  <div class="flex flex-col gap-3 rounded-2xl border border-slate-100 bg-white p-4 md:flex-row md:items-end md:justify-between md:col-span-2">
                    <div class="min-w-0 flex-1">
                      <p class="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-0.5">Gestión</p>
                      <p class="text-sm font-medium text-slate-800 break-words">{{ solicitudActiva.gestion?.anio || '—' }}</p>
                    </div>
                    <div class="flex items-center gap-2 shrink-0">
                      <button @click.stop="setChecklistEstado({ key: 'gestion', label: 'Gestión', value: String(solicitudActiva.gestion?.anio || '') }, 'OK')" :class="['size-9 rounded-xl border text-sm font-black transition-all flex items-center justify-center', checklistBotonClase('gestion', 'OK')]" aria-label="Marcar correcto">✓</button>
                      <button @click.stop="setChecklistEstado({ key: 'gestion', label: 'Gestión', value: String(solicitudActiva.gestion?.anio || '') }, 'X')" :class="['size-9 rounded-xl border text-sm font-black transition-all flex items-center justify-center', checklistBotonClase('gestion', 'X')]" aria-label="Marcar incorrecto">✕</button>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <!-- === IDENTIFICACIÓN FRATERNIDAD === -->
            <section class="px-6 py-5 border-b border-slate-100">
              <h3 class="section-title">Identificación de la Fraternidad</h3>
              <div class="space-y-3">
                <div class="flex flex-col gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-4 md:flex-row md:items-end md:justify-between">
                  <div class="min-w-0 flex-1">
                    <p class="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-0.5">Nombre Fraternidad</p>
                    <p class="text-sm font-medium text-slate-800 break-words">{{ solicitudActiva.nombreFraternidad || '—' }}</p>
                  </div>
                  <div class="flex items-center gap-2 shrink-0">
                    <button @click.stop="setChecklistEstado({ key: 'nombreFraternidad', label: 'Nombre Fraternidad', value: solicitudActiva.nombreFraternidad || '' }, 'OK')" :class="['size-9 rounded-xl border text-sm font-black transition-all flex items-center justify-center', checklistBotonClase('nombreFraternidad', 'OK')]" aria-label="Marcar correcto">✓</button>
                    <button @click.stop="setChecklistEstado({ key: 'nombreFraternidad', label: 'Nombre Fraternidad', value: solicitudActiva.nombreFraternidad || '' }, 'X')" :class="['size-9 rounded-xl border text-sm font-black transition-all flex items-center justify-center', checklistBotonClase('nombreFraternidad', 'X')]" aria-label="Marcar incorrecto">✕</button>
                  </div>
                </div>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div class="flex flex-col gap-3 rounded-2xl border border-slate-100 bg-white p-4 md:flex-row md:items-end md:justify-between">
                    <div class="min-w-0 flex-1">
                      <p class="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-0.5">Categoría</p>
                      <p class="text-sm font-medium text-slate-800 break-words">{{ solicitudActiva.categoria?.nombre || '—' }}</p>
                    </div>
                    <div class="flex items-center gap-2 shrink-0">
                      <button @click.stop="setChecklistEstado({ key: 'categoria', label: 'Categoría', value: solicitudActiva.categoria?.nombre || '' }, 'OK')" :class="['size-9 rounded-xl border text-sm font-black transition-all flex items-center justify-center', checklistBotonClase('categoria', 'OK')]" aria-label="Marcar correcto">✓</button>
                      <button @click.stop="setChecklistEstado({ key: 'categoria', label: 'Categoría', value: solicitudActiva.categoria?.nombre || '' }, 'X')" :class="['size-9 rounded-xl border text-sm font-black transition-all flex items-center justify-center', checklistBotonClase('categoria', 'X')]" aria-label="Marcar incorrecto">✕</button>
                    </div>
                  </div>
                  <div class="flex flex-col gap-3 rounded-2xl border border-slate-100 bg-white p-4 md:flex-row md:items-end md:justify-between">
                    <div class="min-w-0 flex-1">
                      <p class="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-0.5">Instancia</p>
                      <p class="text-sm font-medium text-slate-800 break-words">{{ instanciaLabel(solicitudActiva) || '—' }}</p>
                    </div>
                    <div class="flex items-center gap-2 shrink-0">
                      <button @click.stop="setChecklistEstado({ key: 'instancia', label: 'Instancia', value: instanciaLabel(solicitudActiva) || '' }, 'OK')" :class="['size-9 rounded-xl border text-sm font-black transition-all flex items-center justify-center', checklistBotonClase('instancia', 'OK')]" aria-label="Marcar correcto">✓</button>
                      <button @click.stop="setChecklistEstado({ key: 'instancia', label: 'Instancia', value: instanciaLabel(solicitudActiva) || '' }, 'X')" :class="['size-9 rounded-xl border text-sm font-black transition-all flex items-center justify-center', checklistBotonClase('instancia', 'X')]" aria-label="Marcar incorrecto">✕</button>
                    </div>
                  </div>
                  <div v-if="solicitudActiva.facultad" class="flex flex-col gap-3 rounded-2xl border border-slate-100 bg-white p-4 md:flex-row md:items-end md:justify-between">
                    <div class="min-w-0 flex-1">
                      <p class="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-0.5">Facultad</p>
                      <p class="text-sm font-medium text-slate-800 break-words">{{ solicitudActiva.facultad?.nombre || '—' }}</p>
                    </div>
                    <div class="flex items-center gap-2 shrink-0">
                      <button @click.stop="setChecklistEstado({ key: 'facultad', label: 'Facultad', value: solicitudActiva.facultad?.nombre || '' }, 'OK')" :class="['size-9 rounded-xl border text-sm font-black transition-all flex items-center justify-center', checklistBotonClase('facultad', 'OK')]" aria-label="Marcar correcto">✓</button>
                      <button @click.stop="setChecklistEstado({ key: 'facultad', label: 'Facultad', value: solicitudActiva.facultad?.nombre || '' }, 'X')" :class="['size-9 rounded-xl border text-sm font-black transition-all flex items-center justify-center', checklistBotonClase('facultad', 'X')]" aria-label="Marcar incorrecto">✕</button>
                    </div>
                  </div>
                  <div v-if="solicitudActiva.carrera" class="flex flex-col gap-3 rounded-2xl border border-slate-100 bg-white p-4 md:flex-row md:items-end md:justify-between">
                    <div class="min-w-0 flex-1">
                      <p class="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-0.5">Carrera</p>
                      <p class="text-sm font-medium text-slate-800 break-words">{{ solicitudActiva.carrera?.nombre || '—' }}</p>
                    </div>
                    <div class="flex items-center gap-2 shrink-0">
                      <button @click.stop="setChecklistEstado({ key: 'carrera', label: 'Carrera', value: solicitudActiva.carrera?.nombre || '' }, 'OK')" :class="['size-9 rounded-xl border text-sm font-black transition-all flex items-center justify-center', checklistBotonClase('carrera', 'OK')]" aria-label="Marcar correcto">✓</button>
                      <button @click.stop="setChecklistEstado({ key: 'carrera', label: 'Carrera', value: solicitudActiva.carrera?.nombre || '' }, 'X')" :class="['size-9 rounded-xl border text-sm font-black transition-all flex items-center justify-center', checklistBotonClase('carrera', 'X')]" aria-label="Marcar incorrecto">✕</button>
                    </div>
                  </div>
                  <div v-if="solicitudActiva.nombreInstitucionExterna" class="flex flex-col gap-3 rounded-2xl border border-slate-100 bg-white p-4 md:flex-row md:items-end md:justify-between md:col-span-2">
                    <div class="min-w-0 flex-1">
                      <p class="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-0.5">Institución Externa</p>
                      <p class="text-sm font-medium text-slate-800 break-words">{{ solicitudActiva.nombreInstitucionExterna || '—' }}</p>
                    </div>
                    <div class="flex items-center gap-2 shrink-0">
                      <button @click.stop="setChecklistEstado({ key: 'institucionExterna', label: 'Institución Externa', value: solicitudActiva.nombreInstitucionExterna || '' }, 'OK')" :class="['size-9 rounded-xl border text-sm font-black transition-all flex items-center justify-center', checklistBotonClase('institucionExterna', 'OK')]" aria-label="Marcar correcto">✓</button>
                      <button @click.stop="setChecklistEstado({ key: 'institucionExterna', label: 'Institución Externa', value: solicitudActiva.nombreInstitucionExterna || '' }, 'X')" :class="['size-9 rounded-xl border text-sm font-black transition-all flex items-center justify-center', checklistBotonClase('institucionExterna', 'X')]" aria-label="Marcar incorrecto">✕</button>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <!-- === DIRECTIVA === -->
            <section class="px-6 py-5 border-b border-slate-100">
              <h3 class="section-title">Directiva</h3>
              <div class="space-y-3">
                <div v-for="cargo in directiva" :key="cargo.label" class="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                  <p class="text-[9px] font-black uppercase tracking-widest text-primary mb-2">{{ cargo.label }}</p>
                  <div class="space-y-3">
                    <div class="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                      <div class="min-w-0 flex-1">
                        <p class="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-0.5">Nombre</p>
                        <p class="text-sm font-medium text-slate-800 break-words">{{ cargo.nombre || '—' }}</p>
                      </div>
                      <div class="flex items-center gap-2 shrink-0">
                        <button @click.stop="setChecklistEstado({ key: `${cargo.label}-nombre`, label: `${cargo.label} - Nombre`, value: cargo.nombre || '' }, 'OK')" :class="['size-9 rounded-xl border text-sm font-black transition-all flex items-center justify-center', checklistBotonClase(`${cargo.label}-nombre`, 'OK')]" aria-label="Marcar correcto">✓</button>
                        <button @click.stop="setChecklistEstado({ key: `${cargo.label}-nombre`, label: `${cargo.label} - Nombre`, value: cargo.nombre || '' }, 'X')" :class="['size-9 rounded-xl border text-sm font-black transition-all flex items-center justify-center', checklistBotonClase(`${cargo.label}-nombre`, 'X')]" aria-label="Marcar incorrecto">✕</button>
                      </div>
                    </div>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div class="flex flex-col gap-3 rounded-xl border border-slate-100 bg-white p-4 md:flex-row md:items-end md:justify-between">
                        <div class="min-w-0 flex-1">
                          <p class="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-0.5">CI</p>
                          <p class="text-sm font-medium text-slate-800 break-words">{{ cargo.ci || '—' }}</p>
                        </div>
                        <div class="flex items-center gap-2 shrink-0">
                          <button @click.stop="setChecklistEstado({ key: `${cargo.label}-ci`, label: `${cargo.label} - CI`, value: cargo.ci || '' }, 'OK')" :class="['size-9 rounded-xl border text-sm font-black transition-all flex items-center justify-center', checklistBotonClase(`${cargo.label}-ci`, 'OK')]" aria-label="Marcar correcto">✓</button>
                          <button @click.stop="setChecklistEstado({ key: `${cargo.label}-ci`, label: `${cargo.label} - CI`, value: cargo.ci || '' }, 'X')" :class="['size-9 rounded-xl border text-sm font-black transition-all flex items-center justify-center', checklistBotonClase(`${cargo.label}-ci`, 'X')]" aria-label="Marcar incorrecto">✕</button>
                        </div>
                      </div>
                      <div v-if="cargo.celular !== undefined" class="flex flex-col gap-3 rounded-xl border border-slate-100 bg-white p-4 md:flex-row md:items-end md:justify-between">
                        <div class="min-w-0 flex-1">
                          <p class="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-0.5">Celular</p>
                          <p class="text-sm font-medium text-slate-800 break-words">{{ cargo.celular || '—' }}</p>
                        </div>
                        <div class="flex items-center gap-2 shrink-0">
                          <button @click.stop="setChecklistEstado({ key: `${cargo.label}-celular`, label: `${cargo.label} - Celular`, value: cargo.celular || '' }, 'OK')" :class="['size-9 rounded-xl border text-sm font-black transition-all flex items-center justify-center', checklistBotonClase(`${cargo.label}-celular`, 'OK')]" aria-label="Marcar correcto">✓</button>
                          <button @click.stop="setChecklistEstado({ key: `${cargo.label}-celular`, label: `${cargo.label} - Celular`, value: cargo.celular || '' }, 'X')" :class="['size-9 rounded-xl border text-sm font-black transition-all flex items-center justify-center', checklistBotonClase(`${cargo.label}-celular`, 'X')]" aria-label="Marcar incorrecto">✕</button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <!-- === DOCUMENTOS === -->
            <section class="px-6 py-5 border-b border-slate-100">
              <h3 class="section-title">Documentos Adjuntos</h3>
              <div class="grid grid-cols-1 gap-3">
                <div
                  v-for="doc in documentos"
                  :key="doc.label"
                  class="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-3 hover:border-primary/30 transition-all group md:flex-row md:items-center md:justify-between"
                >
                  <div class="flex items-center gap-3 min-w-0">
                    <div class="size-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <span class="material-symbols-outlined text-primary text-sm">picture_as_pdf</span>
                    </div>
                    <div class="min-w-0">
                      <span class="text-xs font-bold text-slate-700 truncate block">{{ doc.label }}</span>
                      <p class="text-[10px] text-slate-400 uppercase tracking-widest mt-0.5">{{ doc.url ? 'Documento adjunto' : 'Sin archivo' }}</p>
                    </div>
                  </div>
                  <div class="flex items-center gap-2 shrink-0 flex-wrap">
                    <button @click.stop="setChecklistEstado({ key: doc.key, label: doc.label, value: doc.url || '' }, 'OK')" :class="['size-9 rounded-xl border text-sm font-black transition-all flex items-center justify-center', checklistBotonClase(doc.key, 'OK')]" aria-label="Marcar correcto">✓</button>
                    <button @click.stop="setChecklistEstado({ key: doc.key, label: doc.label, value: doc.url || '' }, 'X')" :class="['size-9 rounded-xl border text-sm font-black transition-all flex items-center justify-center', checklistBotonClase(doc.key, 'X')]" aria-label="Marcar incorrecto">✕</button>
                    <button
                      @click="verPdf(doc)"
                      class="shrink-0 px-3 py-2 bg-slate-100 hover:bg-primary text-slate-600 hover:text-white rounded-lg text-[10px] font-black uppercase tracking-widest transition-all"
                    >
                      Ver
                    </button>
                  </div>
                </div>
              </div>
            </section>

            <!-- === ACCIÓN ADMINISTRATIVA === -->
            <section class="px-6 py-5">
              <h3 class="section-title">Decisión Administrativa</h3>
              <div class="space-y-4">
                <div>
                  <label class="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Observaciones / Motivo</label>
                  <textarea
                    v-model="obsForm"
                    rows="3"
                    placeholder="Escriba observaciones o el motivo de la decisión..."
                    class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 font-medium resize-none focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  ></textarea>
                </div>
                <div class="flex flex-wrap gap-3">
                  <button
                    v-if="solicitudActiva.estado !== 'APROBADO'"
                    @click="cambiarEstado('APROBADO')"
                    :disabled="actualizando || !puedeAprobarSolicitud"
                    class="flex items-center gap-2 px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50"
                  >
                    <span class="material-symbols-outlined text-sm">check_circle</span>
                    Aprobar Solicitud
                  </button>

                  <button
                    v-if="solicitudActiva.estado !== 'RECHAZADO'"
                    @click="cambiarEstado('RECHAZADO')"
                    :disabled="actualizando"
                    class="flex items-center gap-2 px-5 py-3 bg-secondary hover:bg-red-800 text-white rounded-xl font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-secondary/20 disabled:opacity-50"
                  >
                    <span class="material-symbols-outlined text-sm">cancel</span>
                    Rechazar
                  </button>
                  <button
                    v-if="solicitudActiva.estado !== 'PENDIENTE'"
                    @click="cambiarEstado('PENDIENTE')"
                    :disabled="actualizando"
                    class="flex items-center gap-2 px-5 py-3 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl font-black text-xs uppercase tracking-widest transition-all disabled:opacity-50"
                  >
                    <span class="material-symbols-outlined text-sm">history</span>
                    Marcar Pendiente
                  </button>
                  <button
                    v-if="solicitudActiva.estado === 'APROBADO' && !solicitudActiva.fraternidadCreada"
                    @click="inscribirFraternidad"
                    :disabled="actualizando"
                    class="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-indigo-500/20 disabled:opacity-50 mt-4 w-full justify-center"
                  >
                    <span class="material-symbols-outlined text-sm">verified</span>
                    Completar Inscripción Manualmente
                  </button>

                  <div v-if="solicitudActiva.estado === 'APROBADO' && solicitudActiva.fraternidadCreada" class="mt-4 w-full bg-indigo-50 border border-indigo-100 p-4 rounded-xl flex items-center gap-3">
                    <span class="material-symbols-outlined text-indigo-600 text-2xl">task_alt</span>
                    <div>
                      <p class="text-xs font-black uppercase text-indigo-800">Fraternidad Registrada</p>
                      <p class="text-[11px] text-indigo-600 font-medium">
                        {{ solicitudActiva.fraternidadCreada.nombre }} ya está disponible en fraternidades y evaluaciones.
                      </p>
                    </div>
                  </div>
                </div>
                <p v-if="solicitudActiva.observaciones" class="text-xs text-slate-500 bg-amber-50 border border-amber-200 p-3 rounded-xl">
                  <span class="font-black text-amber-700">Última observación:</span> {{ solicitudActiva.observaciones }}
                </p>
              </div>
            </section>

          </div>
        </div>
      </div>
    </transition>

    <!-- ===== VISOR PDF ===== -->
    <transition name="fade">
      <div v-if="pdfViewer.abierto" class="fixed inset-0 z-[60] flex flex-col bg-slate-900/95 backdrop-blur-md">
        <div class="shrink-0 flex items-center justify-between px-6 py-4 bg-slate-900 border-b border-white/10">
          <div class="flex items-center gap-3">
            <span class="material-symbols-outlined text-white text-xl">picture_as_pdf</span>
            <p class="text-white font-black text-sm uppercase tracking-widest">{{ pdfViewer.titulo }}</p>
          </div>
          <div class="flex items-center gap-2">
            <a :href="pdfViewer.url" target="_blank" download
              class="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-black transition-all">
              <span class="material-symbols-outlined text-sm">download</span> Descargar
            </a>
            <button @click="pdfViewer.abierto = false"
              class="size-9 bg-white/10 hover:bg-white/20 text-white rounded-xl flex items-center justify-center transition-all">
              <span class="material-symbols-outlined">close</span>
            </button>
          </div>
        </div>
        <div class="flex-1">
          <iframe :src="pdfViewer.url + '#toolbar=1'" class="w-full h-full border-none" :title="pdfViewer.titulo"></iframe>
        </div>
      </div>
    </transition>

    <!-- ===== LISTADO PRINCIPAL ===== -->
    <div class="p-6 md:p-8 max-w-7xl mx-auto w-full">

      <!-- Header -->
      <div class="mb-8">
        <div class="flex items-center gap-2 mb-1">
          <span class="h-1 w-10 bg-secondary inline-block"></span>
          <h2 class="text-3xl font-black tracking-tight text-primary uppercase italic">Solicitudes de Preinscripción</h2>
        </div>
        <p class="text-slate-500 text-sm font-medium">Revisa las solicitudes enviadas por delegados de fraternidad.</p>
      </div>

      <!-- Filtros y Stats -->
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <button
          v-for="s in statsCards"
          :key="s.label"
          @click="filtroEstado = s.filter"
          class="flex flex-col items-center justify-center p-4 rounded-2xl border transition-all text-center"
          :class="[s.color, filtroEstado === s.filter ? 'ring-2 ring-primary ring-offset-2 shadow-lg' : 'hover:-translate-y-1 hover:shadow-md']"
        >
          <span class="material-symbols-outlined text-2xl mb-1 opacity-80">{{ s.icon }}</span>
          <span class="text-2xl font-black leading-none mb-1">{{ s.count }}</span>
          <span class="text-[10px] font-black uppercase tracking-widest opacity-70">{{ s.label }}</span>
        </button>
      </div>

      <!-- Buscador -->
      <div class="flex flex-col sm:flex-row gap-3 mb-6">
        <div class="flex-1 relative">
          <span class="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xl">search</span>
          <input
            v-model="busqueda"
            type="text"
            placeholder="Buscar por nombre de fraternidad o delegado..."
            class="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-medium text-slate-700 focus:ring-2 focus:ring-primary/20 outline-none transition-all shadow-sm"
          />
        </div>
        <button @click="cargarSolicitudes" class="flex items-center gap-2 px-5 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-black text-slate-600 hover:bg-slate-50 transition-all shadow-sm">
          <span class="material-symbols-outlined text-slate-400">refresh</span>
          Actualizar
        </button>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="flex flex-col items-center justify-center py-24 text-slate-400">
        <span class="material-symbols-outlined animate-spin text-5xl text-primary mb-4">progress_activity</span>
        <p class="text-xs font-black uppercase tracking-widest">Cargando solicitudes...</p>
      </div>

      <!-- Empty -->
      <div v-else-if="solicitudesFiltradas.length === 0" class="flex flex-col items-center justify-center py-24 bg-white rounded-3xl border border-slate-200 shadow-sm text-center">
        <span class="material-symbols-outlined text-5xl text-slate-200 mb-4">inbox</span>
        <p class="text-slate-600 font-black text-lg">Sin solicitudes</p>
        <p class="text-slate-400 text-sm mt-1">{{ busqueda || filtroEstado ? 'No hay resultados para los filtros aplicados.' : 'Aún no hay solicitudes de inscripción.' }}</p>
      </div>

      <!-- Tarjetas -->
      <div v-else class="space-y-3">
        <div
          v-for="sol in solicitudesFiltradas"
          :key="sol.idSolicitud"
          @click="abrirDetalle(sol)"
          class="group bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-lg hover:border-primary/30 transition-all cursor-pointer overflow-hidden"
        >
          <div class="flex items-center gap-4 p-5">
            <!-- Color lateral según estado -->
            <div class="w-1.5 self-stretch rounded-full shrink-0" :class="estadoStyle(sol.estado).bar"></div>

            <!-- Ícono -->
            <div class="size-12 rounded-2xl flex items-center justify-center shrink-0" :class="estadoStyle(sol.estado).iconBg">
              <span class="material-symbols-outlined text-2xl" :class="estadoStyle(sol.estado).iconColor">groups</span>
            </div>

            <!-- Info principal -->
            <div class="flex-1 min-w-0">
              <div class="flex items-start justify-between gap-3 flex-wrap">
                <div class="min-w-0">
                  <h3 class="font-black text-slate-900 text-base leading-tight truncate group-hover:text-primary transition-colors">
                    {{ sol.nombreFraternidad }}
                  </h3>
                  <p class="text-xs text-slate-500 font-medium mt-0.5">
                    {{ instanciaLabel(sol) }}
                    <span v-if="sol.categoria" class="mx-1 text-slate-300">·</span>
                    <span v-if="sol.categoria" class="font-bold text-slate-600">{{ sol.categoria.nombre }}</span>
                  </p>
                </div>
                <div class="flex items-center gap-2 shrink-0">
                  <span
                    class="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border"
                    :class="estadoStyle(sol.estado).badge"
                  >{{ sol.estado }}</span>
                </div>
              </div>
              <div class="flex items-center gap-4 mt-2 flex-wrap">
                <span class="flex items-center gap-1 text-[11px] text-slate-400 font-medium">
                  <span class="material-symbols-outlined text-[14px]">person</span>
                  {{ sol.delegado?.nombres }} {{ sol.delegado?.primerApellido }}
                </span>
                <span class="flex items-center gap-1 text-[11px] text-slate-400 font-medium">
                  <span class="material-symbols-outlined text-[14px]">schedule</span>
                  {{ formatFecha(sol.createdAt) }}
                </span>
                <span v-if="sol.observaciones" class="flex items-center gap-1 text-[11px] text-amber-600 font-bold">
                  <span class="material-symbols-outlined text-[14px]">info</span>
                  Tiene observaciones
                </span>
              </div>
            </div>

            <!-- Flecha -->
            <span class="material-symbols-outlined text-slate-300 group-hover:text-primary group-hover:translate-x-1 transition-all shrink-0">chevron_right</span>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import api from '../services/api'
import { getImageUrl } from '../utils/url'
import Swal from 'sweetalert2'
import { notify } from '../utils/notify'
import { useRouter } from 'vue-router'

// ── Estado ────────────────────────────────────────────────────────────────────
const solicitudes = ref([])
const loading = ref(true)
const actualizando = ref(false)
const filtroEstado = ref('')
const busqueda = ref('')
const solicitudActiva = ref(null)
const obsForm = ref('')
const revisionChecklistDraft = ref({})
const pdfViewer = ref({ abierto: false, url: '', titulo: '' })

// ── Carga de datos ─────────────────────────────────────────────────────────────
const cargarSolicitudes = async () => {
  loading.value = true
  try {
    const { data } = await api.get('/inscripciones/admin/todas')
    solicitudes.value = data || []
  } catch (e) {
    notify.error('Error', 'No se pudieron cargar las solicitudes.')
  } finally {
    loading.value = false
  }
}

// ── Filtros y búsqueda ────────────────────────────────────────────────────────
const solicitudesFiltradas = computed(() => {
  return solicitudes.value.filter(s => {
    const matchEstado = !filtroEstado.value || s.estado === filtroEstado.value
    const q = busqueda.value.toLowerCase()
    const matchBusq = !q ||
      s.nombreFraternidad?.toLowerCase().includes(q) ||
      s.delegado?.nombres?.toLowerCase().includes(q) ||
      s.delegado?.primerApellido?.toLowerCase().includes(q)
    return matchEstado && matchBusq
  })
})

// ── Stats ─────────────────────────────────────────────────────────────────────
const statsCards = computed(() => [
  { label: 'Total', filter: '', count: solicitudes.value.length, icon: 'inbox', color: 'bg-slate-100 text-slate-600 border-slate-200' },
  { label: 'Pendientes', filter: 'PENDIENTE', count: solicitudes.value.filter(s => s.estado === 'PENDIENTE').length, icon: 'hourglass_empty', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  { label: 'Aprobadas', filter: 'APROBADO', count: solicitudes.value.filter(s => s.estado === 'APROBADO').length, icon: 'check_circle', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
])

// ── Detalle ───────────────────────────────────────────────────────────────────
const abrirDetalle = async (sol) => {
  try {
    const { data } = await api.get(`/inscripciones/${sol.idSolicitud}`)
    solicitudActiva.value = data
    obsForm.value = data.observaciones || ''
    revisionChecklistDraft.value = data.revisionChecklist ? JSON.parse(JSON.stringify(data.revisionChecklist)) : {}
  } catch {
    notify.error('Error', 'No se pudo cargar el detalle.')
  }
}
const cerrarDetalle = () => { solicitudActiva.value = null }

const checklistItems = computed(() => {
  if (!solicitudActiva.value) return []
  const s = solicitudActiva.value
  return [
    { key: 'nombreFraternidad', label: 'Nombre de la fraternidad', value: s.nombreFraternidad },
    { key: 'origenFraternidad', label: 'Origen / Tipo de Danza', value: s.origenFraternidad },
    { key: 'categoria', label: 'Categoría', value: s.categoria?.nombre },
    { key: 'instancia', label: 'Instancia de representación', value: instanciaLabel(s) },
    { key: 'facultad', label: 'Facultad', value: s.facultad?.nombre },
    { key: 'carrera', label: 'Carrera', value: s.carrera?.nombre },
    { key: 'institucionExterna', label: 'Institución externa', value: s.nombreInstitucionExterna },
    { key: 'presiNombre', label: 'Presidente - Nombre', value: s.presiNombre },
    { key: 'presiCi', label: 'Presidente - CI', value: s.presiCi },
    { key: 'presiCelular', label: 'Presidente - Celular', value: s.presiCelular },
    { key: 'viceNombre', label: 'Vicepresidente - Nombre', value: s.viceNombre },
    { key: 'viceCi', label: 'Vicepresidente - CI', value: s.viceCi },
    { key: 'viceCelular', label: 'Vicepresidente - Celular', value: s.viceCelular },
    { key: 'secGenNombre', label: 'Secretario General - Nombre', value: s.secGenNombre },
    { key: 'secGenCi', label: 'Secretario General - CI', value: s.secGenCi },
    { key: 'secHaciNombre', label: 'Secretario de Hacienda - Nombre', value: s.secHaciNombre },
    { key: 'secHaciCi', label: 'Secretario de Hacienda - CI', value: s.secHaciCi },
    { key: 'secActasNombre', label: 'Secretario de Actas - Nombre', value: s.secActasNombre },
    { key: 'secActasCi', label: 'Secretario de Actas - CI', value: s.secActasCi },
    { key: 'secPrensaNombre', label: 'Secretario de Prensa - Nombre', value: s.secPrensaNombre },
    { key: 'secPrensaCi', label: 'Secretario de Prensa - CI', value: s.secPrensaCi },
    { key: 'vocalNombre', label: 'Vocal - Nombre', value: s.vocalNombre },
    { key: 'vocalCi', label: 'Vocal - CI', value: s.vocalCi },
    { key: 'delCogobNombre', label: 'Delegado a Co-Gobierno - Nombre', value: s.delCogobNombre },
    { key: 'delCogobCi', label: 'Delegado a Co-Gobierno - CI', value: s.delCogobCi },
    { key: 'delCogobCelular', label: 'Delegado a Co-Gobierno - Celular', value: s.delCogobCelular },
    { key: 'delTitularNombre', label: 'Delegado Titular - Nombre', value: s.delTitularNombre },
    { key: 'delTitularCi', label: 'Delegado Titular - CI', value: s.delTitularCi },
    { key: 'delTitularCelular', label: 'Delegado Titular - Celular', value: s.delTitularCelular },
    { key: 'delSuplenteNombre', label: 'Delegado Suplente - Nombre', value: s.delSuplenteNombre },
    { key: 'delSuplenteCi', label: 'Delegado Suplente - CI', value: s.delSuplenteCi },
    { key: 'delSuplenteCelular', label: 'Delegado Suplente - Celular', value: s.delSuplenteCelular },
    { key: 'ciMatriculaPreViceDel', label: 'Documento 29', value: s.urlCiMatriculaPreViceDel, isDoc: true },
    { key: 'ciMatriculaSecVocDel', label: 'Documento 30', value: s.urlCiMatriculaSecVocDel, isDoc: true },
    { key: 'cartaCompromiso', label: 'Documento 31', value: s.urlCartaCompromiso, isDoc: true },
    { key: 'resolucion', label: 'Documento 32', value: s.urlResolucion, isDoc: true },
    { key: 'actaDirectiva', label: 'Documento 33', value: s.urlActaDirectiva, isDoc: true },
  ]
})

const checklistEstado = (key) => revisionChecklistDraft.value?.[key]?.estado || 'PENDIENTE'

const checklistClase = (estado) => {
  if (estado === 'OK') return 'bg-emerald-50 text-emerald-700 border-emerald-200'
  if (estado === 'X') return 'bg-red-50 text-secondary border-red-200'
  return 'bg-slate-50 text-slate-500 border-slate-200'
}

const checklistBotonClase = (key, estadoEsperado) => {
  const estadoActual = checklistEstado(key)
  if (estadoActual === estadoEsperado) {
    return estadoEsperado === 'OK'
      ? 'bg-emerald-600 border-emerald-600 text-white shadow-md shadow-emerald-500/20'
      : 'bg-secondary border-secondary text-white shadow-md shadow-red-500/20'
  }

  return estadoEsperado === 'OK'
    ? 'bg-white border-emerald-200 text-emerald-700 hover:bg-emerald-50'
    : 'bg-white border-red-200 text-secondary hover:bg-red-50'
}

const setChecklistEstado = (item, estado) => {
  revisionChecklistDraft.value = {
    ...revisionChecklistDraft.value,
    [item.key]: { estado, label: item.label, value: item.value || '' }
  }
}

const puedeAprobarSolicitud = computed(() => {
  const items = Object.values(revisionChecklistDraft.value || {})
  return items.length > 0 && items.every(item => item?.estado === 'OK')
})

// ── Directiva computada ───────────────────────────────────────────────────────
const directiva = computed(() => {
  if (!solicitudActiva.value) return []
  const s = solicitudActiva.value
  return [
    { label: 'Presidente', nombre: s.presiNombre, ci: s.presiCi, celular: s.presiCelular },
    { label: 'Vicepresidente', nombre: s.viceNombre, ci: s.viceCi, celular: s.viceCelular },
    { label: 'Secretario General', nombre: s.secGenNombre, ci: s.secGenCi },
    { label: 'Secretario de Hacienda', nombre: s.secHaciNombre, ci: s.secHaciCi },
    { label: 'Secretario de Actas', nombre: s.secActasNombre, ci: s.secActasCi },
    { label: 'Secretario de Prensa', nombre: s.secPrensaNombre, ci: s.secPrensaCi },
    { label: 'Vocal', nombre: s.vocalNombre, ci: s.vocalCi },
    { label: 'Delegado a Co-Gobierno', nombre: s.delCogobNombre, ci: s.delCogobCi, celular: s.delCogobCelular },
    { label: 'Delegado Titular', nombre: s.delTitularNombre, ci: s.delTitularCi, celular: s.delTitularCelular },
    { label: 'Delegado Suplente', nombre: s.delSuplenteNombre, ci: s.delSuplenteCi, celular: s.delSuplenteCelular },
  ].filter(d => d.nombre)
})

// ── Documentos adjuntos ───────────────────────────────────────────────────────
const documentos = computed(() => {
  if (!solicitudActiva.value) return []
  const s = solicitudActiva.value
  return [
    { key: 'ciMatriculaPreViceDel', label: 'CI y Matrícula: Presidente, Vice, Delegados', url: s.urlCiMatriculaPreViceDel },
    { key: 'ciMatriculaSecVocDel', label: 'CI y Matrícula: Secretarios, Vocal, Del. Cogobierno', url: s.urlCiMatriculaSecVocDel },
    { key: 'cartaCompromiso', label: 'Carta de Compromiso', url: s.urlCartaCompromiso },
    { key: 'resolucion', label: 'Resolución HCU/HCF/HCC', url: s.urlResolucion },
    { key: 'actaDirectiva', label: 'Acta de Conformación de Directiva', url: s.urlActaDirectiva },
  ].filter(d => d.url)
})

// ── Cambio de estado ───────────────────────────────────────────────────────────
const cambiarEstado = async (nuevoEstado) => {
  actualizando.value = true
  try {
    const { data } = await api.put(`/inscripciones/${solicitudActiva.value.idSolicitud}/estado`, {
      estado: nuevoEstado,
      observaciones: obsForm.value || undefined,
      revisionChecklist: revisionChecklistDraft.value,
    })
    solicitudActiva.value = { ...solicitudActiva.value, ...data }
    const idx = solicitudes.value.findIndex(s => s.idSolicitud === data.idSolicitud)
    if (idx !== -1) solicitudes.value[idx] = { ...solicitudes.value[idx], ...data }
    const msg = nuevoEstado === 'APROBADO' && data.fraternidadCreada
      ? `La solicitud fue aprobada y la fraternidad "${data.fraternidadCreada.nombre}" quedó registrada oficialmente.`
      : `La solicitud fue marcada como ${nuevoEstado}.`
    notify.success('Estado actualizado', msg)
  } catch (e) {
    notify.error('Error', e.response?.data?.message || 'No se pudo actualizar el estado.')
  } finally {
    actualizando.value = false
  }
}

// ── Visor PDF ─────────────────────────────────────────────────────────────────
const verPdf = ({ url, titulo }) => {
  pdfViewer.value = { abierto: true, url: getImageUrl(url), titulo }
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const formatFecha = (f) => f ? new Date(f).toLocaleDateString('es-BO', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'

const instanciaLabel = (sol) => {
  if (sol.facultad?.nombre) return `Facultad: ${sol.facultad.nombre}`
  if (sol.carrera?.nombre) return `Carrera: ${sol.carrera.nombre}`
  if (sol.nombreInstitucionExterna) return `Externo: ${sol.nombreInstitucionExterna}`
  return sol.instanciaRepresentacion || '—'
}

const estadoStyle = (estado) => {
  const map = {
    PENDIENTE: { badge: 'bg-amber-50 text-amber-700 border-amber-300', bar: 'bg-amber-400', iconBg: 'bg-amber-50', iconColor: 'text-amber-500' },
    OBSERVADO: { badge: 'bg-orange-50 text-orange-700 border-orange-300', bar: 'bg-orange-400', iconBg: 'bg-orange-50', iconColor: 'text-orange-500' },
    APROBADO: { badge: 'bg-emerald-50 text-emerald-700 border-emerald-300', bar: 'bg-emerald-500', iconBg: 'bg-emerald-50', iconColor: 'text-emerald-500' },
    RECHAZADO: { badge: 'bg-red-50 text-red-700 border-red-300', bar: 'bg-secondary', iconBg: 'bg-red-50', iconColor: 'text-secondary' },
  }
  return map[estado] || map.PENDIENTE
}

const router = useRouter()

const inscribirFraternidad = async () => {
  if (!solicitudActiva.value || solicitudActiva.value.estado !== 'APROBADO') return

  const result = await Swal.fire({
    title: '¿Continuar Inscripción?',
    text: `Serás redirigido a la gestión de fraternidades para revisar los datos heredados de ${solicitudActiva.value.nombreFraternidad} antes de oficializarla.`,
    icon: 'info',
    showCancelButton: true,
    confirmButtonColor: '#4f46e5',
    cancelButtonColor: '#64748b',
    confirmButtonText: 'Sí, ir a revisar',
    cancelButtonText: 'Cancelar'
  })

  if (result.isConfirmed) {
    router.push({ 
      path: '/dashboard', 
      query: { v: 'fraternidades_crud', inscribirSolicitud: solicitudActiva.value.idSolicitud } 
    })
  }
}

onMounted(cargarSolicitudes)
</script>


<style scoped>
.section-title {
  font-size: 10px;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--color-primary);
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
.section-title::before {
  content: '';
  display: inline-block;
  width: 1.5rem;
  height: 0.125rem;
  background-color: var(--color-secondary);
}
.custom-scrollbar { scrollbar-width: thin; scrollbar-color: #e2e8f0 transparent; }
.custom-scrollbar::-webkit-scrollbar { width: 4px; }
.custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 99px; }

/* Panel slide */
.slide-right-enter-active, .slide-right-leave-active { transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1); }
.slide-right-enter-from { opacity: 0; }
.slide-right-leave-to { opacity: 0; }
.slide-right-enter-from .relative, .slide-right-leave-to .relative { transform: translateX(100%); }
.slide-right-enter-active .relative, .slide-right-leave-active .relative { transition: transform 0.35s cubic-bezier(0.4, 0, 0.2, 1); }

/* Fade */
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
