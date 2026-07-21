<template>
  <div class="min-h-full bg-slate-50">

    <!-- Aviso: vista no disponible en móvil -->
    <div class="lg:hidden dashboard-page max-w-lg w-full mx-auto px-4 py-16 flex flex-col items-center text-center">
      <div class="size-20 rounded-3xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mb-6">
        <span class="material-symbols-outlined text-4xl">desktop_windows</span>
      </div>
      <h2 class="text-2xl font-black uppercase italic text-primary tracking-tight mb-3">
        Vista no disponible en móvil
      </h2>
      <p class="text-slate-600 text-sm font-medium leading-relaxed max-w-sm">
        Esta sección de solicitudes de inscripción no está disponible para ver en dispositivos móviles.
        Favor de acceder desde una
        <strong class="text-slate-800">computadora</strong>
        para un manejo óptimo del sistema.
      </p>
      <div class="mt-8 px-4 py-3 rounded-2xl bg-slate-100 border border-slate-200 text-[10px] font-black uppercase tracking-widest text-slate-500">
        Recomendado: pantalla de escritorio o tablet horizontal
      </div>
    </div>

    <div class="hidden lg:block">
    <!-- ===== DETALLE SOLICITUD (panel deslizante) ===== -->
    <transition name="slide-right">
      <div v-if="solicitudActiva" class="fixed inset-0 z-50 flex">
        <!-- Backdrop -->
        <div class="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" @click="cerrarDetalle"></div>

        <!-- Panel -->
        <div class="relative ml-auto w-full h-full bg-white shadow-2xl flex flex-col overflow-hidden" style="max-width: min(1400px, 95vw)">

          <!-- Header del panel -->
          <div class="shrink-0 bg-primary px-4 sm:px-6 py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div class="min-w-0">
              <p class="text-[10px] text-white/60 font-black uppercase tracking-widest mb-1">
                Solicitud #{{ solicitudActiva.idSolicitud }}
              </p>
              <h2 class="text-2xl sm:text-3xl font-black text-white uppercase tracking-tight leading-tight">
                APROBACION DE DATOS Y DOCUMENTOS
              </h2>
              <p class="text-base sm:text-lg font-black text-white/95 italic uppercase tracking-tighter mt-2 leading-tight">
                {{ solicitudActiva.nombreFraternidad }}
              </p>
              <p class="text-xs text-white/70 font-medium mt-1">
                {{ solicitudActiva.categoria?.nombre }} · {{ instanciaLabel(solicitudActiva) }}
              </p>
            </div>
            <div class="flex items-center gap-2 sm:gap-3 self-end sm:self-auto">
              <button
                v-if="!modoEdicionAdmin && solicitudActiva.estado !== 'RECHAZADO'"
                type="button"
                @click="activarEdicionAdmin"
                class="px-3 py-2 rounded-xl bg-amber-500/90 hover:bg-amber-500 text-white text-[9px] font-black uppercase tracking-widest transition-colors"
              >
                Editar datos de entrada
              </button>
              <template v-if="modoEdicionAdmin">
                <button type="button" @click="guardarEdicionAdmin" :disabled="guardandoAdmin" class="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[9px] font-black uppercase tracking-widest disabled:opacity-50">
                  Guardar
                </button>
                <button type="button" @click="cancelarEdicionAdmin" class="px-3 py-2 rounded-xl bg-white/20 hover:bg-white/30 text-white text-[9px] font-black uppercase tracking-widest">
                  Cancelar
                </button>
              </template>
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

          <!-- Barra de progreso -->
          <div v-if="modoEdicionAdmin" class="shrink-0 px-6 py-3 bg-amber-50 border-b border-amber-200">
            <p class="text-[10px] font-black uppercase tracking-widest text-amber-800 flex items-center gap-2">
              <span class="material-symbols-outlined text-sm">edit</span>
              Modo edición activo — los cambios se guardan al pulsar Guardar
            </p>
          </div>
          <div class="shrink-0 px-6 py-3 bg-slate-50 border-b border-slate-100">
            <div class="flex items-center justify-between gap-3 mb-2">
              <p class="text-[10px] font-black uppercase tracking-widest text-slate-500">Progreso de revisión</p>
              <p class="text-[10px] font-black text-primary">{{ revisionProgreso.revisados }} / {{ revisionProgreso.total }}</p>
            </div>
            <div class="h-2 bg-slate-200 rounded-full overflow-hidden">
              <div class="h-full bg-primary transition-all duration-500 rounded-full" :style="{ width: revisionProgreso.porcentaje + '%' }"></div>
            </div>
            <div class="flex flex-wrap gap-2 mt-3">
              <button
                v-for="sec in seccionesRevision"
                :key="sec.id"
                type="button"
                @click="irASeccion(sec.id)"
                class="px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider border transition-all"
                :class="seccionActiva === sec.id ? 'bg-primary text-white border-primary' : 'bg-white text-slate-500 border-slate-200 hover:border-primary/40'"
              >
                {{ sec.label }}
              </button>
            </div>
            <!-- Tabs móvil -->
            <div class="flex lg:hidden gap-2 mt-3">
              <button
                type="button"
                @click="mobileTab = 'datos'"
                class="flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border"
                :class="mobileTab === 'datos' ? 'bg-primary text-white border-primary' : 'bg-white text-slate-500 border-slate-200'"
              >Datos</button>
              <button
                type="button"
                @click="mobileTab = 'pdfs'"
                class="flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border"
                :class="mobileTab === 'pdfs' ? 'bg-primary text-white border-primary' : 'bg-white text-slate-500 border-slate-200'"
              >PDFs</button>
            </div>
          </div>

          <!-- Split: datos | PDFs -->
          <div class="flex-1 min-h-0 flex flex-col lg:flex-row">
            <!-- IZQUIERDA: datos + checklist -->
            <div
              ref="panelDetalleScroll"
              class="flex-1 overflow-y-auto custom-scrollbar lg:w-[48%] lg:border-r border-slate-100"
              :class="mobileTab === 'datos' ? 'block' : 'hidden lg:block'"
            >
              <!-- DELEGADO -->
              <section id="sec-delegado" class="px-5 py-5 border-b border-slate-100">
                <div class="flex flex-wrap items-center justify-between gap-2 mb-3">
                  <h3 class="section-title mb-0">Delegado</h3>
                  <div class="flex flex-wrap gap-2 shrink-0">
                    <button type="button" @click="aceptarSeccion('delegado')" class="btn-revision-masiva btn-revision-aceptar">Aceptar todo</button>
                    <button type="button" @click="rechazarSeccion('delegado')" class="btn-revision-masiva btn-revision-rechazar">Rechazar todo</button>
                  </div>
                </div>
                <div class="space-y-3">
                  <div v-for="item in itemsDelegado" :key="item.key" class="rounded-2xl border border-slate-100 bg-slate-50 p-3">
                    <div class="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                      <div class="min-w-0 flex-1">
                        <p class="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-0.5">{{ item.label }}</p>
                        <p class="text-sm font-medium text-slate-800 break-words">{{ item.value || '—' }}</p>
                      </div>
                      <div class="flex items-center gap-2 shrink-0">
                        <button type="button" @click.stop="setChecklistEstado(item, 'OK')" :class="['size-9 rounded-xl border text-sm font-black transition-all flex items-center justify-center', checklistBotonClase(item.key, 'OK')]">✓</button>
                        <button type="button" @click.stop="setChecklistEstado(item, 'X')" :class="['size-9 rounded-xl border text-sm font-black transition-all flex items-center justify-center', checklistBotonClase(item.key, 'X')]">✕</button>
                      </div>
                    </div>
                    <div v-if="checklistEstado(item.key) === 'X'" class="mt-3 pt-3 border-t border-red-100">
                      <label class="block text-[9px] font-black uppercase tracking-widest text-red-600 mb-1">Motivo del rechazo</label>
                      <textarea
                        :value="checklistComentario(item.key)"
                        @input="setChecklistComentario(item.key, $event.target.value)"
                        rows="2"
                        placeholder="Indique por qué se rechaza este dato..."
                        class="w-full px-3 py-2 bg-white border border-red-200 rounded-xl text-xs text-slate-700 resize-none focus:ring-2 focus:ring-red-200 outline-none"
                      ></textarea>
                    </div>
                  </div>
                </div>
              </section>

              <!-- FRATERNIDAD -->
              <section id="sec-fraternidad" class="px-5 py-5 border-b border-slate-100">
                <div class="flex flex-wrap items-center justify-between gap-2 mb-3">
                  <h3 class="section-title mb-0">Fraternidad</h3>
                  <div class="flex flex-wrap gap-2 shrink-0">
                    <button type="button" @click="aceptarSeccion('fraternidad')" class="btn-revision-masiva btn-revision-aceptar">Aceptar todo</button>
                    <button type="button" @click="rechazarSeccion('fraternidad')" class="btn-revision-masiva btn-revision-rechazar">Rechazar todo</button>
                  </div>
                </div>
                <div class="space-y-3">
                  <div v-for="item in itemsFraternidad" :key="item.key" class="rounded-2xl border border-slate-100 bg-white p-3">
                    <div class="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                      <div class="min-w-0 flex-1">
                        <p class="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-0.5">{{ item.label }}</p>
                        <div v-if="modoEdicionAdmin && adminCampoEditable(item.key)" class="mt-1">
                          <input
                            v-if="item.key === 'nombreFraternidad' || item.key === 'institucionExterna'"
                            v-model="adminFormDraft[adminFieldKey(item.key)]"
                            type="text"
                            class="w-full px-3 py-2 border border-amber-300 rounded-lg text-sm bg-white"
                          />
                          <select
                            v-else-if="item.key === 'instancia'"
                            v-model="adminFormDraft.instanciaRepresentacion"
                            class="w-full px-3 py-2 border border-amber-300 rounded-lg text-sm bg-white"
                          >
                            <option v-for="inst in instanciasOpciones" :key="inst" :value="inst">{{ inst }}</option>
                          </select>
                          <select
                            v-else-if="item.key === 'categoria'"
                            v-model="adminFormDraft.idCategoria"
                            class="w-full px-3 py-2 border border-amber-300 rounded-lg text-sm bg-white"
                          >
                            <option v-for="c in adminOpciones.categorias" :key="c.idCategoria" :value="c.idCategoria">{{ c.nombre }}</option>
                          </select>
                          <div v-else-if="item.key === 'tipoDanza'" class="space-y-2">
                            <select
                              v-model="adminFormDraft.idTipoDanza"
                              class="w-full px-3 py-2 border border-amber-300 rounded-lg text-sm bg-white"
                              title="Escribe una letra para saltar al primer tipo de danza que comience con ella"
                            >
                              <option v-for="t in adminOpciones.tiposDanza" :key="t.idTipoDanza" :value="t.idTipoDanza">{{ t.nombre }}</option>
                              <option value="otro">Otro</option>
                            </select>
                            <input
                              v-if="adminFormDraft.idTipoDanza === 'otro'"
                              v-model.trim="adminFormDraft.tipoDanzaOtro"
                              type="text"
                              minlength="2"
                              maxlength="120"
                              placeholder="Escribe el tipo de danza"
                              class="w-full px-3 py-2 border border-amber-300 rounded-lg text-sm bg-white"
                            />
                          </div>
                          <div v-else-if="item.key === 'costosParticipacion'" class="space-y-2">
                            <label class="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500 flex-wrap">
                              <span :class="!adminFormDraft.costosParticipacion?.multiple ? 'text-primary' : ''">Costo único</span>
                              <input
                                type="checkbox"
                                :checked="adminFormDraft.costosParticipacion?.multiple"
                                class="rounded border-slate-300"
                                @change="toggleAdminCostosMultiples($event.target.checked)"
                              />
                              <span :class="adminFormDraft.costosParticipacion?.multiple ? 'text-primary' : ''">Costo variado (detallar)</span>
                            </label>
                            <div
                              v-for="(cItem, cIdx) in (adminFormDraft.costosParticipacion?.items || [])"
                              :key="'admin-costo-' + cIdx"
                              class="flex flex-col sm:flex-row gap-2"
                            >
                              <input
                                v-if="adminFormDraft.costosParticipacion?.multiple"
                                v-model.trim="cItem.concepto"
                                type="text"
                                placeholder="Concepto"
                                class="flex-1 px-3 py-2 border border-amber-300 rounded-lg text-sm bg-white"
                              />
                              <input
                                v-model.number="cItem.monto"
                                type="number"
                                min="0"
                                step="0.01"
                                placeholder="Monto Bs"
                                class="w-full sm:w-28 px-3 py-2 border border-amber-300 rounded-lg text-sm bg-white"
                              />
                              <button
                                v-if="adminFormDraft.costosParticipacion?.multiple"
                                type="button"
                                class="px-2 py-2 text-xs font-bold text-red-600"
                                :disabled="(adminFormDraft.costosParticipacion?.items || []).length <= 1"
                                @click="quitarAdminCosto(cIdx)"
                              >
                                Quitar
                              </button>
                            </div>
                            <button
                              v-if="adminFormDraft.costosParticipacion?.multiple"
                              type="button"
                              class="text-[10px] font-black uppercase tracking-widest text-primary"
                              @click="agregarAdminCosto"
                            >
                              + Agregar costo
                            </button>
                          </div>
                          <select
                            v-else-if="item.key === 'facultad'"
                            v-model="adminFormDraft.idFacultad"
                            class="w-full px-3 py-2 border border-amber-300 rounded-lg text-sm bg-white"
                          >
                            <option :value="null">—</option>
                            <option v-for="f in adminOpciones.facultades" :key="f.idFacultad" :value="f.idFacultad">{{ f.nombre }}</option>
                          </select>
                          <select
                            v-else-if="item.key === 'carrera'"
                            v-model="adminFormDraft.idCarrera"
                            class="w-full px-3 py-2 border border-amber-300 rounded-lg text-sm bg-white"
                          >
                            <option :value="null">—</option>
                            <option v-for="c in adminCarrerasFiltradas" :key="c.idCarrera" :value="c.idCarrera">{{ c.nombre }}</option>
                          </select>
                        </div>
                        <p v-else class="text-sm font-medium text-slate-800 break-words">{{ item.value || '—' }}</p>
                      </div>
                      <div class="flex items-center gap-2 shrink-0">
                        <button type="button" @click.stop="setChecklistEstado(item, 'OK')" :class="['size-9 rounded-xl border text-sm font-black transition-all flex items-center justify-center', checklistBotonClase(item.key, 'OK')]">✓</button>
                        <button type="button" @click.stop="setChecklistEstado(item, 'X')" :class="['size-9 rounded-xl border text-sm font-black transition-all flex items-center justify-center', checklistBotonClase(item.key, 'X')]">✕</button>
                      </div>
                    </div>
                    <div v-if="checklistEstado(item.key) === 'X'" class="mt-3 pt-3 border-t border-red-100">
                      <label class="block text-[9px] font-black uppercase tracking-widest text-red-600 mb-1">Motivo del rechazo</label>
                      <textarea
                        :value="checklistComentario(item.key)"
                        @input="setChecklistComentario(item.key, $event.target.value)"
                        rows="2"
                        placeholder="Indique por qué se rechaza este dato..."
                        class="w-full px-3 py-2 bg-white border border-red-200 rounded-xl text-xs text-slate-700 resize-none focus:ring-2 focus:ring-red-200 outline-none"
                      ></textarea>
                    </div>
                  </div>
                </div>
              </section>

              <!-- DIRECTIVA -->
              <section id="sec-directiva" class="px-5 py-5 border-b border-slate-100">
                <h3 class="section-title">Directiva</h3>
                <p class="text-[10px] text-slate-400 font-medium mb-4 -mt-2">Revisa datos y documentos de respaldo por cargo. Puedes aprobar un dato y rechazar su PDF.</p>
                <div class="space-y-4">
                  <div v-for="cargo in directiva" :key="cargo.label" class="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                    <div class="flex flex-wrap items-center justify-between gap-2 mb-3">
                      <p class="text-[9px] font-black uppercase tracking-widest text-primary">{{ cargo.label }}</p>
                      <div class="flex flex-wrap gap-2 shrink-0">
                        <button type="button" @click="aceptarSeccionCargo(cargo)" class="btn-revision-masiva btn-revision-aceptar">Aceptar todo</button>
                        <button type="button" @click="rechazarSeccionCargo(cargo)" class="btn-revision-masiva btn-revision-rechazar">Rechazar todo</button>
                      </div>
                    </div>
                    <div class="space-y-2">
                      <div v-for="parte in cargo.checklistItems" :key="parte.key" class="bg-white rounded-xl border border-slate-100 p-3">
                        <div class="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                          <div class="min-w-0 flex-1">
                            <p class="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-0.5">{{ parte.label }}</p>
                            <input
                              v-if="modoEdicionAdmin && parte.adminField"
                              v-model="adminFormDraft[parte.adminField]"
                              type="text"
                              class="w-full px-3 py-2 border border-amber-300 rounded-lg text-sm bg-white"
                            />
                            <p v-else class="text-sm font-medium text-slate-800 break-words">{{ parte.value || '—' }}</p>
                          </div>
                          <div class="flex items-center gap-2 shrink-0">
                            <button type="button" @click.stop="setChecklistEstado(parte, 'OK')" :class="['size-9 rounded-xl border text-sm font-black transition-all flex items-center justify-center', checklistBotonClase(parte.key, 'OK')]">✓</button>
                            <button type="button" @click.stop="setChecklistEstado(parte, 'X')" :class="['size-9 rounded-xl border text-sm font-black transition-all flex items-center justify-center', checklistBotonClase(parte.key, 'X')]">✕</button>
                          </div>
                        </div>
                        <div v-if="checklistEstado(parte.key) === 'X'" class="mt-3 pt-3 border-t border-red-100">
                          <label class="block text-[9px] font-black uppercase tracking-widest text-red-600 mb-1">Motivo del rechazo</label>
                          <textarea
                            :value="checklistComentario(parte.key)"
                            @input="setChecklistComentario(parte.key, $event.target.value)"
                            rows="2"
                            placeholder="Indique por qué se rechaza este dato..."
                            class="w-full px-3 py-2 bg-slate-50 border border-red-200 rounded-xl text-xs text-slate-700 resize-none focus:ring-2 focus:ring-red-200 outline-none"
                          ></textarea>
                        </div>
                      </div>
                    </div>
                    <div class="mt-4 pt-4 border-t border-slate-200">
                      <p class="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-3">Documentos de respaldo — {{ cargo.label }}</p>
                      <div class="space-y-2">
                        <div
                          v-for="doc in cargo.documentos"
                          :key="doc.key"
                          class="rounded-xl border p-3 transition-all"
                          :class="pdfSeleccionado?.key === doc.key ? 'border-primary bg-primary/5' : 'border-slate-200 bg-white'"
                        >
                          <div class="flex flex-wrap items-center justify-between gap-2">
                            <button type="button" @click="seleccionarPdf(doc)" class="flex-1 min-w-0 text-left">
                              <p class="text-[10px] font-bold text-slate-700 leading-tight">{{ doc.btnLabel }}</p>
                              <p class="text-[9px] uppercase tracking-widest mt-0.5" :class="doc.url ? 'text-slate-400' : 'text-amber-600 font-bold'">
                                {{ doc.url ? 'Adjunto' : 'Sin archivo entregado' }}
                              </p>
                            </button>
                            <div class="flex items-center gap-1.5 shrink-0">
                              <button type="button" @click="setChecklistEstado(docChecklistItem(doc), 'OK')" :class="['size-8 rounded-lg border text-sm font-black flex items-center justify-center', checklistBotonClase(doc.key, 'OK')]">✓</button>
                              <button type="button" @click="setChecklistEstado(docChecklistItem(doc), 'X')" :class="['size-8 rounded-lg border text-sm font-black flex items-center justify-center', checklistBotonClase(doc.key, 'X')]">✕</button>
                            </div>
                          </div>
                          <div v-if="checklistEstado(doc.key) === 'X'" class="mt-3 pt-3 border-t border-red-100">
                            <label class="block text-[9px] font-black uppercase tracking-widest text-red-600 mb-1">Motivo del rechazo</label>
                            <textarea
                              :value="checklistComentario(doc.key)"
                              @input="setChecklistComentario(doc.key, $event.target.value)"
                              rows="2"
                              placeholder="Indique por qué se observa o rechaza este documento (ej. no entregado, ilegible, incompleto)..."
                              class="w-full px-3 py-2 bg-slate-50 border border-red-200 rounded-xl text-xs text-slate-700 resize-none focus:ring-2 focus:ring-red-200 outline-none"
                            ></textarea>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              <!-- DOCUMENTOS INSTITUCIONALES -->
              <section id="sec-institucionales" class="px-5 py-5 border-b border-slate-100">
                <div class="flex flex-wrap items-center justify-between gap-2 mb-3">
                  <h3 class="section-title mb-0">Documentos institucionales</h3>
                  <div class="flex flex-wrap gap-2 shrink-0">
                    <button type="button" @click="aceptarSeccion('institucionales')" class="btn-revision-masiva btn-revision-aceptar">Aceptar todo</button>
                    <button type="button" @click="rechazarSeccion('institucionales')" class="btn-revision-masiva btn-revision-rechazar">Rechazar todo</button>
                  </div>
                </div>
                <div class="space-y-2">
                  <div
                    v-for="doc in documentosInstitucionales"
                    :key="doc.key"
                    class="rounded-xl border p-3 transition-all"
                    :class="pdfSeleccionado?.key === doc.key ? 'border-primary bg-primary/5' : 'border-slate-200 bg-white'"
                  >
                    <div class="flex flex-wrap items-center justify-between gap-2">
                      <button type="button" @click="seleccionarPdf(doc)" class="flex-1 min-w-0 text-left">
                        <p class="text-xs font-bold text-slate-700">{{ doc.label }}</p>
                        <p class="text-[9px] uppercase tracking-widest" :class="doc.url ? 'text-slate-400' : 'text-amber-600 font-bold'">
                          {{ doc.url ? 'Adjunto' : 'Sin archivo entregado' }}
                        </p>
                      </button>
                      <div class="flex items-center gap-1.5 shrink-0">
                        <button type="button" @click="setChecklistEstado(docChecklistItem(doc), 'OK')" :class="['size-8 rounded-lg border text-sm font-black flex items-center justify-center', checklistBotonClase(doc.key, 'OK')]">✓</button>
                        <button type="button" @click="setChecklistEstado(docChecklistItem(doc), 'X')" :class="['size-8 rounded-lg border text-sm font-black flex items-center justify-center', checklistBotonClase(doc.key, 'X')]">✕</button>
                      </div>
                    </div>
                    <div v-if="checklistEstado(doc.key) === 'X'" class="mt-3 pt-3 border-t border-red-100">
                      <label class="block text-[9px] font-black uppercase tracking-widest text-red-600 mb-1">Motivo del rechazo</label>
                      <textarea
                        :value="checklistComentario(doc.key)"
                        @input="setChecklistComentario(doc.key, $event.target.value)"
                        rows="2"
                        placeholder="Indique por qué se observa este documento (ej. no entregado, ilegible)..."
                        class="w-full px-3 py-2 bg-slate-50 border border-red-200 rounded-xl text-xs text-slate-700 resize-none focus:ring-2 focus:ring-red-200 outline-none"
                      ></textarea>
                    </div>
                  </div>
                </div>
              </section>

              <!-- DECISIÓN -->
              <section id="sec-decision" class="px-5 py-5">
                <h3 class="section-title">Decisión Administrativa</h3>
                <div v-if="solicitudActiva.delegado?.correo" class="mb-4 p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-2">
                  <span class="material-symbols-outlined text-slate-400 text-lg">mail</span>
                  <p class="text-[11px] text-slate-600 font-medium">
                    Correo del delegado:
                    <strong class="text-slate-800">{{ solicitudActiva.delegado.correo }}</strong>
                    <span class="text-slate-400"> — se notificará al aprobar, observar o rechazar.</span>
                  </p>
                </div>
                <div v-else class="mb-4 p-3 rounded-xl bg-amber-50 border border-amber-200 flex items-center gap-2">
                  <span class="material-symbols-outlined text-amber-600 text-lg">warning</span>
                  <p class="text-[11px] text-amber-800 font-medium">
                    El delegado no tiene correo registrado. No se podrá enviar notificación por email.
                  </p>
                </div>
                <div class="space-y-4">
                  <div class="flex flex-wrap gap-3">
                    <button
                      v-if="solicitudActiva.estado !== 'APROBADO'"
                      @click="confirmarCambioEstado('APROBADO')"
                      :disabled="actualizando || !puedeAprobarSolicitud"
                      class="flex items-center gap-2 px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50"
                    >
                      <span class="material-symbols-outlined text-sm">check_circle</span>
                      Aprobar Solicitud
                    </button>
                    <button
                      v-if="solicitudActiva.estado !== 'OBSERVADO' && solicitudActiva.estado !== 'RECHAZADO'"
                      @click="confirmarCambioEstado('OBSERVADO')"
                      :disabled="actualizando || !tieneItemsObservados"
                      class="flex items-center gap-2 px-5 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-orange-500/20 disabled:opacity-50"
                    >
                      <span class="material-symbols-outlined text-sm">edit_note</span>
                      {{ solicitudActiva.estado === 'APROBADO' ? 'Volver a observar' : 'Observar para corrección' }}
                    </button>
                    <button
                      v-if="solicitudActiva.estado !== 'RECHAZADO'"
                      @click="confirmarCambioEstado('RECHAZADO')"
                      :disabled="actualizando"
                      class="flex items-center gap-2 px-5 py-3 bg-secondary hover:bg-red-800 text-white rounded-xl font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-secondary/20 disabled:opacity-50"
                    >
                      <span class="material-symbols-outlined text-sm">cancel</span>
                      Rechazar y anular
                    </button>
                    <button
                      v-if="!['PENDIENTE', 'APROBADO'].includes(solicitudActiva.estado)"
                      @click="confirmarCambioEstado('PENDIENTE')"
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
                      class="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-indigo-500/20 disabled:opacity-50 mt-2 w-full justify-center"
                    >
                      <span class="material-symbols-outlined text-sm">verified</span>
                      Completar Inscripción Manualmente
                    </button>
                    <div v-if="solicitudActiva.estado === 'APROBADO' && solicitudActiva.fraternidadCreada" class="mt-2 w-full bg-indigo-50 border border-indigo-100 p-4 rounded-xl flex items-center gap-3">
                      <span class="material-symbols-outlined text-indigo-600 text-2xl">task_alt</span>
                      <div>
                        <p class="text-xs font-black uppercase text-indigo-800">Fraternidad Registrada</p>
                        <p class="text-[11px] text-indigo-600 font-medium">
                          {{ solicitudActiva.fraternidadCreada.nombre }} ya está disponible en fraternidades y evaluaciones.
                          <span
                            v-if="solicitudActiva.fraternidadCreada.esExcedente"
                            class="ml-1 inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-amber-50 text-amber-800 border border-amber-200"
                          >
                            Excedente
                          </span>
                        </p>
                      </div>
                    </div>
                  </div>
                  <p v-if="solicitudActiva.estado === 'RECHAZADO' && solicitudActiva.observaciones" class="text-xs text-slate-500 bg-red-50 border border-red-200 p-3 rounded-xl">
                    <span class="font-black text-red-700">Motivo del rechazo:</span> {{ solicitudActiva.observaciones }}
                  </p>
                </div>
              </section>
            </div>

            <!-- DERECHA: visor PDF con revisión -->
            <div
              class="flex-1 flex flex-col min-h-0 lg:w-[52%] bg-slate-50"
              :class="mobileTab === 'pdfs' ? 'flex' : 'hidden lg:flex'"
            >
              <div v-if="pdfSeleccionado" class="shrink-0 flex flex-col gap-2 px-4 py-3 bg-slate-800 text-white border-b border-white/10">
                <div class="flex items-center justify-between gap-2">
                  <div class="min-w-0 flex-1">
                    <p class="text-[10px] font-black uppercase tracking-widest truncate">{{ pdfSeleccionado.titulo || pdfSeleccionado.label }}</p>
                    <p v-if="!pdfSeleccionado.url" class="text-[9px] text-amber-300 font-bold uppercase tracking-widest mt-0.5">
                      Documento no entregado
                    </p>
                  </div>
                  <div class="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      @click="setChecklistEstado(pdfChecklistItem, 'OK')"
                      :class="['size-8 rounded-lg border text-sm font-black flex items-center justify-center', checklistBotonClase(pdfSeleccionado.key, 'OK')]"
                    >✓</button>
                    <button
                      type="button"
                      @click="setChecklistEstado(pdfChecklistItem, 'X')"
                      :class="['size-8 rounded-lg border text-sm font-black flex items-center justify-center', checklistBotonClase(pdfSeleccionado.key, 'X')]"
                    >✕</button>
                    <button
                      v-if="pdfSeleccionado.url"
                      type="button"
                      @click="ampliarPdf"
                      class="px-2 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-[9px] font-black uppercase"
                    >Ampliar</button>
                    <a
                      v-if="pdfSeleccionado.url"
                      :href="pdfUrlActivo"
                      target="_blank"
                      class="px-2 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-[9px] font-black uppercase"
                    >Abrir</a>
                  </div>
                </div>
                <div v-if="checklistEstado(pdfSeleccionado.key) === 'X'" class="pb-1">
                  <textarea
                    :value="checklistComentario(pdfSeleccionado.key)"
                    @input="setChecklistComentario(pdfSeleccionado.key, $event.target.value)"
                    rows="2"
                    placeholder="Motivo de la observación (ej. no entregado, ilegible, incompleto)..."
                    class="w-full px-3 py-2 bg-slate-900 border border-red-400/50 rounded-lg text-xs text-white placeholder:text-white/40 resize-none focus:ring-2 focus:ring-red-400/30 outline-none"
                  ></textarea>
                </div>
              </div>
              <div v-else class="shrink-0 px-4 py-3 border-b border-slate-200 bg-white">
                <p class="text-[10px] font-black uppercase tracking-widest text-slate-500">Vista previa del documento</p>
                <p class="text-[11px] text-slate-400 mt-1">Selecciona un documento de respaldo en la directiva o documentos institucionales.</p>
              </div>
              <div class="flex-1 min-h-[240px] flex flex-col">
                <iframe
                  v-if="pdfSeleccionado?.url"
                  :src="pdfUrlActivo + '#toolbar=1'"
                  class="flex-1 w-full border-none bg-white"
                  :title="pdfSeleccionado.label"
                ></iframe>
                <div v-else-if="pdfSeleccionado && !pdfSeleccionado.url" class="flex-1 flex flex-col items-center justify-center text-slate-400 gap-3 p-6">
                  <span class="material-symbols-outlined text-5xl text-amber-400">folder_off</span>
                  <p class="text-sm font-black text-slate-600 uppercase tracking-widest text-center">Documento no entregado</p>
                  <p class="text-xs text-slate-400 text-center max-w-xs">
                    El delegado no adjuntó este archivo. Puedes marcarlo con ✕ e indicar el motivo de la observación.
                  </p>
                  <div class="flex items-center gap-2 mt-2">
                    <button
                      type="button"
                      @click="setChecklistEstado(pdfChecklistItem, 'OK')"
                      :class="['size-10 rounded-xl border text-base font-black flex items-center justify-center', checklistBotonClase(pdfSeleccionado.key, 'OK')]"
                    >✓</button>
                    <button
                      type="button"
                      @click="setChecklistEstado(pdfChecklistItem, 'X')"
                      :class="['size-10 rounded-xl border text-base font-black flex items-center justify-center', checklistBotonClase(pdfSeleccionado.key, 'X')]"
                    >✕</button>
                  </div>
                </div>
                <div v-else class="flex-1 flex flex-col items-center justify-center text-slate-400 gap-2 p-6">
                  <span class="material-symbols-outlined text-4xl">picture_as_pdf</span>
                  <p class="text-xs font-bold text-center">Selecciona un documento para previsualizar</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </transition>

    <!-- ===== VISOR PDF FULLSCREEN (ampliar) ===== -->
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
    <div class="dashboard-page max-w-7xl w-full">

      <!-- Header -->
      <div class="mb-8">
        <div class="flex items-center gap-2 mb-1">
          <span class="h-1 w-10 bg-secondary inline-block"></span>
          <h2 class="dashboard-page-title tracking-tight text-primary uppercase italic truncate">Solicitudes de Preinscripción</h2>
        </div>
        <p class="text-slate-500 text-sm font-medium">Revisa las solicitudes enviadas por delegados de fraternidad.</p>
      </div>

      <!-- Filtros y Stats -->
      <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
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
                <span v-if="tieneObservacionesPendientes(sol)" class="flex items-center gap-1 text-[11px] text-amber-600 font-bold">
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
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import api from '../services/api'
import { getImageUrl } from '../utils/url'
import Swal from 'sweetalert2'
import { notify } from '../utils/notify'
import { useRouter } from 'vue-router'
import { PERSONAS_DIRECTIVA, nombreCompletoPersona, formatCiSoloBase, normalizarComplementoCi, DOCUMENTOS_POR_PERSONA, DOCUMENTOS_INSTITUCIONALES } from '../utils/personaDirectiva'

const INSTANCIAS_OPCIONES = ['Facultad', 'Carrera', 'UMSA', 'FEDSIDUMSA', 'STUMSA', 'Externo']
const DELEGADO_KEYS_NO_EDITABLES = new Set(['delegadoNombre', 'delegadoCi', 'fechaSolicitud', 'gestion'])

const DOC_BTN_LABELS = {
  ci: 'Ver CI',
  matricula: 'Ver Matrícula',
  deudaFrat: 'Ver cert. no deudas con la fraternidad',
  deudaAreas: 'Ver cert. no deudas con las áreas desconcentradas',
}

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
const pdfSeleccionado = ref(null)
const mobileTab = ref('datos')
const panelDetalleScroll = ref(null)
const seccionActiva = ref('sec-delegado')
const modoEdicionAdmin = ref(false)
const adminFormDraft = ref({})
const guardandoAdmin = ref(false)
const adminOpciones = ref({ categorias: [], tiposDanza: [], facultades: [], carreras: [] })
const instanciasOpciones = INSTANCIAS_OPCIONES

const seccionesRevision = [
  { id: 'sec-delegado', label: 'Delegado' },
  { id: 'sec-fraternidad', label: 'Fraternidad' },
  { id: 'sec-directiva', label: 'Directiva' },
  { id: 'sec-institucionales', label: 'Docs. inst.' },
  { id: 'sec-decision', label: 'Decisión' },
]

const irASeccion = (id) => {
  seccionActiva.value = id
  mobileTab.value = 'datos'
  nextTick(() => {
    const el = document.getElementById(id)
    if (el && panelDetalleScroll.value) {
      const top = el.offsetTop - panelDetalleScroll.value.offsetTop - 8
      panelDetalleScroll.value.scrollTo({ top, behavior: 'smooth' })
    }
  })
}

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
  { label: 'Observadas', filter: 'OBSERVADO', count: solicitudes.value.filter(s => s.estado === 'OBSERVADO').length, icon: 'edit_note', color: 'bg-orange-50 text-orange-700 border-orange-200' },
  { label: 'Rechazadas', filter: 'RECHAZADO', count: solicitudes.value.filter(s => s.estado === 'RECHAZADO').length, icon: 'block', color: 'bg-red-50 text-red-700 border-red-200' },
  { label: 'Aprobadas', filter: 'APROBADO', count: solicitudes.value.filter(s => s.estado === 'APROBADO').length, icon: 'check_circle', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
])

// ── Detalle ───────────────────────────────────────────────────────────────────
const abrirDetalle = async (sol) => {
  try {
    const { data } = await api.get(`/inscripciones/${sol.idSolicitud}`)
    solicitudActiva.value = data
    obsForm.value = data.estado === 'RECHAZADO' ? (data.observaciones || '') : ''
    revisionChecklistDraft.value = data.revisionChecklist ? JSON.parse(JSON.stringify(data.revisionChecklist)) : {}
    seccionActiva.value = 'sec-delegado'
    mobileTab.value = 'datos'
    pdfSeleccionado.value = null
    await nextTick()
    panelDetalleScroll.value?.scrollTo({ top: 0, behavior: 'smooth' })
    // Preseleccionar primer PDF disponible
    const docs = [...documentosInstitucionales.value]
    directiva.value.forEach((cargo) => {
      const primeroCargo = cargo.documentos?.find((d) => d.url)
      if (primeroCargo) docs.unshift(primeroCargo)
    })
    const primero = docs.find((d) => d.url)
    if (primero) seleccionarPdf(primero)
  } catch {
    notify.error('Error', 'No se pudo cargar el detalle.')
  }
}
const cerrarDetalle = () => {
  solicitudActiva.value = null
  pdfSeleccionado.value = null
  pdfViewer.value.abierto = false
  modoEdicionAdmin.value = false
  adminFormDraft.value = {}
}

const itemsDelegado = computed(() => {
  if (!solicitudActiva.value) return []
  const s = solicitudActiva.value
  const nombre = `${s.delegado?.nombres || ''} ${s.delegado?.primerApellido || ''} ${s.delegado?.segundoApellido || ''}`.trim()
  return [
    { key: 'delegadoNombre', label: 'Nombre Completo', value: nombre },
    { key: 'delegadoCi', label: 'CI Delegado', value: s.delegado?.ci || '' },
    { key: 'fechaSolicitud', label: 'Fecha de Solicitud', value: formatFecha(s.createdAt) || '' },
    { key: 'gestion', label: 'Gestión', value: String(s.gestion?.anio || '') },
  ]
})

const itemsFraternidad = computed(() => {
  if (!solicitudActiva.value) return []
  const s = solicitudActiva.value
  const items = [
    { key: 'nombreFraternidad', label: 'Nombre Fraternidad', value: s.nombreFraternidad || '' },
    { key: 'tipoDanza', label: 'Tipo de danza', value: s.tipoDanza?.nombre || '—' },
    { key: 'costosParticipacion', label: 'Costo de participación', value: formatearCostosParticipacion(s.costosParticipacion) },
    { key: 'categoria', label: 'Categoría', value: s.categoria?.nombre || '' },
    { key: 'instancia', label: 'Instancia', value: instanciaLabel(s) || '' },
  ]
  if (s.facultad) items.push({ key: 'facultad', label: 'Facultad', value: s.facultad?.nombre || '' })
  if (s.carrera) items.push({ key: 'carrera', label: 'Carrera', value: s.carrera?.nombre || '' })
  if (s.nombreInstitucionExterna) items.push({ key: 'institucionExterna', label: 'Institución Externa', value: s.nombreInstitucionExterna || '' })
  return items
})

const formatearCostosParticipacion = (costos) => {
  if (!costos?.items?.length) return '—'
  return costos.items
    .map((item) => `${item.concepto || 'Costo'}: ${Number(item.monto)} Bs`)
    .join(' · ')
}

const checklistItems = computed(() => {
  if (!solicitudActiva.value) return []
  return [
    ...itemsDelegado.value,
    ...itemsFraternidad.value,
    ...directiva.value.flatMap((c) => c.checklistItems),
    ...documentosTodos.value.map((doc) => ({
      key: doc.key,
      label: doc.label,
      value: doc.url || '',
      isDoc: true,
    })),
  ]
})

const checklistEstado = (key) => revisionChecklistDraft.value?.[key]?.estado || 'PENDIENTE'

const checklistComentario = (key) => revisionChecklistDraft.value?.[key]?.comentario || ''

const setChecklistComentario = (key, comentario) => {
  const actual = revisionChecklistDraft.value?.[key] || {}
  revisionChecklistDraft.value = {
    ...revisionChecklistDraft.value,
    [key]: { ...actual, comentario },
  }
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
  const prev = revisionChecklistDraft.value?.[item.key] || {}
  const entry = {
    estado,
    label: item.label,
    value: item.value || '',
  }
  if (estado === 'OK') {
    entry.comentario = undefined
  } else if (estado === 'X' && prev.comentario) {
    entry.comentario = prev.comentario
  }
  revisionChecklistDraft.value = {
    ...revisionChecklistDraft.value,
    [item.key]: entry,
  }
}

const docChecklistItem = (doc) => ({
  key: doc.key,
  label: doc.label,
  value: doc.url || '',
})

const pdfChecklistItem = computed(() => {
  if (!pdfSeleccionado.value) return { key: '', label: '', value: '' }
  return docChecklistItem(pdfSeleccionado.value)
})

const aceptarItems = (items) => {
  const next = { ...revisionChecklistDraft.value }
  items.forEach((item) => {
    next[item.key] = { estado: 'OK', label: item.label, value: item.value || '' }
  })
  revisionChecklistDraft.value = next
}

const rechazarItems = (items) => {
  const next = { ...revisionChecklistDraft.value }
  items.forEach((item) => {
    const prev = next[item.key] || {}
    next[item.key] = {
      estado: 'X',
      label: item.label,
      value: item.value || '',
      comentario: prev.comentario || '',
    }
  })
  revisionChecklistDraft.value = next
}

const aceptarSeccion = (tipo) => {
  if (tipo === 'delegado') aceptarItems(itemsDelegado.value)
  else if (tipo === 'fraternidad') aceptarItems(itemsFraternidad.value)
  else if (tipo === 'institucionales') {
    aceptarItems(documentosInstitucionales.value.map((d) => docChecklistItem(d)))
  }
}

const rechazarSeccion = (tipo) => {
  if (tipo === 'delegado') rechazarItems(itemsDelegado.value)
  else if (tipo === 'fraternidad') rechazarItems(itemsFraternidad.value)
  else if (tipo === 'institucionales') {
    rechazarItems(documentosInstitucionales.value.map((d) => docChecklistItem(d)))
  }
}

const documentosDeCargo = (prefix) => {
  if (!solicitudActiva.value) return []
  const s = solicitudActiva.value
  return DOCUMENTOS_POR_PERSONA
    .filter((d) => d.prefix === prefix)
    .map(({ fileKey, urlField, label, type, cargoLabel }) => ({
      key: fileKey,
      label: `${label} — ${cargoLabel}`,
      btnLabel: DOC_BTN_LABELS[type] || label,
      url: s[urlField],
      type,
    }))
}

const aceptarSeccionCargo = (cargo) => {
  aceptarItems(cargo.checklistItems || [])
  aceptarItems(cargo.documentos.map((d) => docChecklistItem(d)))
}

const rechazarSeccionCargo = (cargo) => {
  rechazarItems(cargo.checklistItems || [])
  rechazarItems(cargo.documentos.map((d) => docChecklistItem(d)))
}

const puedeAprobarSolicitud = computed(() => {
  const items = checklistItems.value
  if (!items.length) return false
  return items.every((item) => revisionChecklistDraft.value?.[item.key]?.estado === 'OK')
})

const tieneItemsObservados = computed(() =>
  Object.values(revisionChecklistDraft.value || {}).some((item) => item?.estado === 'X'),
)

const itemsObservadosSinMotivo = computed(() =>
  Object.values(revisionChecklistDraft.value || {}).filter(
    (item) => item?.estado === 'X' && !item?.comentario?.trim(),
  ),
)

const tieneObservacionesPendientes = (sol) => {
  if (sol.estado !== 'OBSERVADO') return false
  let checklist = sol.revisionChecklist || {}
  if (typeof checklist === 'string') {
    try { checklist = JSON.parse(checklist) } catch { return false }
  }
  return Object.values(checklist).some((item) => item?.estado === 'X')
}

const revisionProgreso = computed(() => {
  const items = checklistItems.value
  const total = items.length
  const revisados = items.filter((item) => {
    const estado = revisionChecklistDraft.value?.[item.key]?.estado
    return estado === 'OK' || estado === 'X'
  }).length
  return {
    total,
    revisados,
    porcentaje: total > 0 ? Math.round((revisados / total) * 100) : 0,
  }
})

// ── Directiva computada ───────────────────────────────────────────────────────
const directiva = computed(() => {
  if (!solicitudActiva.value) return []
  const s = solicitudActiva.value
  return PERSONAS_DIRECTIVA.map(({ prefix, label, hasCelular }) => {
    const complemento = normalizarComplementoCi(s[`${prefix}CiComplemento`] || '')
    const ciBase = formatCiSoloBase(s[`${prefix}Ci`])
    const checklistItemsCargo = [
      { key: `${label}-nombres`, label: 'Nombres', value: s[`${prefix}Nombres`] || '', adminField: `${prefix}Nombres` },
      { key: `${label}-paterno`, label: 'Paterno', value: s[`${prefix}PrimerApellido`] || '', adminField: `${prefix}PrimerApellido` },
      { key: `${label}-materno`, label: 'Materno', value: s[`${prefix}SegundoApellido`] || '', adminField: `${prefix}SegundoApellido` },
      { key: `${label}-ci`, label: 'CI', value: ciBase, adminField: `${prefix}Ci` },
    ]
    if (complemento) {
      checklistItemsCargo.push({
        key: `${label}-ci-complemento`,
        label: 'Complemento CI',
        value: complemento,
        adminField: `${prefix}CiComplemento`,
      })
    }
    if (hasCelular) {
      checklistItemsCargo.push({
        key: `${label}-celular`,
        label: 'Celular',
        value: s[`${prefix}Celular`] || '',
        adminField: `${prefix}Celular`,
      })
    }
    return {
      prefix,
      label,
      hasCelular,
      nombreCompleto: nombreCompletoPersona(s, prefix),
      ci: s[`${prefix}Ci`],
      complemento,
      ciDisplay: complemento ? `${ciBase} ${complemento}` : ciBase,
      celular: hasCelular ? s[`${prefix}Celular`] : undefined,
      checklistItems: checklistItemsCargo,
      documentos: documentosDeCargo(prefix),
    }
  }).filter((d) => d.nombreCompleto || d.ci)
})

// ── Documentos adjuntos ───────────────────────────────────────────────────────
const documentosInstitucionales = computed(() => {
  if (!solicitudActiva.value) return []
  const s = solicitudActiva.value
  return DOCUMENTOS_INSTITUCIONALES.map(({ fileKey, urlField, label }) => ({
    key: fileKey,
    label,
    url: s[urlField],
  }))
})

const documentosTodos = computed(() => {
  if (!solicitudActiva.value) return []
  const s = solicitudActiva.value
  const prefixesConDatos = new Set(directiva.value.map((d) => d.prefix))
  return [
    ...DOCUMENTOS_POR_PERSONA
      .filter((d) => prefixesConDatos.has(d.prefix))
      .map(({ fileKey, urlField, shortLabel, cargoLabel }) => ({
        key: fileKey,
        label: `${shortLabel} — ${cargoLabel}`,
        url: s[urlField],
      })),
    ...documentosInstitucionales.value,
  ]
})

const pdfUrlActivo = computed(() => {
  if (!pdfSeleccionado.value?.url) return ''
  return getImageUrl(pdfSeleccionado.value.url)
})

const seleccionarPdf = (doc) => {
  if (!doc) return
  pdfSeleccionado.value = { ...doc, titulo: doc.label }
  if (typeof window !== 'undefined' && window.innerWidth < 1024) {
    mobileTab.value = 'pdfs'
  }
}

const ampliarPdf = () => {
  if (!pdfSeleccionado.value?.url) return
  pdfViewer.value = {
    abierto: true,
    url: pdfUrlActivo.value,
    titulo: pdfSeleccionado.value.label,
  }
}

const verPdf = ({ url, titulo }) => {
  pdfViewer.value = { abierto: true, url: getImageUrl(url), titulo }
}

const adminFieldKey = (itemKey) => {
  const map = {
    nombreFraternidad: 'nombreFraternidad',
    tipoDanza: 'idTipoDanza',
    costosParticipacion: 'costosParticipacion',
    categoria: 'idCategoria',
    instancia: 'instanciaRepresentacion',
    facultad: 'idFacultad',
    carrera: 'idCarrera',
    institucionExterna: 'nombreInstitucionExterna',
  }
  return map[itemKey] || itemKey
}

const adminCampoEditable = (key) => !DELEGADO_KEYS_NO_EDITABLES.has(key)

const hidratarCostosAdmin = (s) => {
  const raw = s.costosParticipacion
  if (!raw?.items?.length) {
    return { multiple: false, items: [{ concepto: 'Costo por participar', monto: null }] }
  }
  return {
    multiple: Boolean(raw.multiple) || raw.items.length > 1,
    items: raw.items.map((item) => ({
      concepto: item.concepto || 'Costo por participar',
      monto: item.monto ?? null,
    })),
  }
}

const toggleAdminCostosMultiples = (multiple) => {
  const actual = adminFormDraft.value.costosParticipacion || { items: [] }
  if (multiple) {
    adminFormDraft.value.costosParticipacion = {
      multiple: true,
      items: actual.items?.length
        ? actual.items.map((i) => ({ ...i }))
        : [{ concepto: '', monto: null }, { concepto: '', monto: null }],
    }
  } else {
    adminFormDraft.value.costosParticipacion = {
      multiple: false,
      items: [{ concepto: 'Costo por participar', monto: actual.items?.[0]?.monto ?? null }],
    }
  }
}

const agregarAdminCosto = () => {
  if (!adminFormDraft.value.costosParticipacion) {
    adminFormDraft.value.costosParticipacion = { multiple: true, items: [] }
  }
  adminFormDraft.value.costosParticipacion.items.push({ concepto: '', monto: null })
}

const quitarAdminCosto = (idx) => {
  const items = adminFormDraft.value.costosParticipacion?.items
  if (!items || items.length <= 1) return
  items.splice(idx, 1)
}

const hidratarAdminFormDesdeSolicitud = (s) => {
  const draft = {
    nombreFraternidad: s.nombreFraternidad || '',
    instanciaRepresentacion: s.instanciaRepresentacion || 'Facultad',
    nombreInstitucionExterna: s.nombreInstitucionExterna || '',
    idCategoria: s.categoria?.idCategoria || null,
    idTipoDanza: s.tipoDanza?.idTipoDanza || null,
    tipoDanzaOtro: '',
    costosParticipacion: hidratarCostosAdmin(s),
    idFacultad: s.facultad?.idFacultad || null,
    idCarrera: s.carrera?.idCarrera || null,
  }
  PERSONAS_DIRECTIVA.forEach(({ prefix, hasCelular }) => {
    draft[`${prefix}Nombres`] = s[`${prefix}Nombres`] || ''
    draft[`${prefix}PrimerApellido`] = s[`${prefix}PrimerApellido`] || ''
    draft[`${prefix}SegundoApellido`] = s[`${prefix}SegundoApellido`] || ''
    draft[`${prefix}Ci`] = s[`${prefix}Ci`] || ''
    draft[`${prefix}CiComplemento`] = s[`${prefix}CiComplemento`] || ''
    if (hasCelular) draft[`${prefix}Celular`] = s[`${prefix}Celular`] || ''
  })
  adminFormDraft.value = draft
}

const cargarAdminOpciones = async (idGestion) => {
  try {
    const [cats, facs, cars, tipos] = await Promise.all([
      api.get('/categorias', { params: idGestion ? { idGestion } : {} }),
      api.get('/organizacion/facultades'),
      api.get('/organizacion/carreras'),
      api.get('/reportes/tipos-danza'),
    ])
    adminOpciones.value = {
      categorias: cats.data || [],
      facultades: facs.data || [],
      carreras: cars.data || [],
      tiposDanza: tipos.data || [],
    }
  } catch {
    notify.error('Error', 'No se pudieron cargar opciones para edición.')
  }
}

const adminCarrerasFiltradas = computed(() => {
  if (!adminFormDraft.value.idFacultad) return adminOpciones.value.carreras
  return adminOpciones.value.carreras.filter(
    (c) => c.facultad?.idFacultad === adminFormDraft.value.idFacultad,
  )
})

const activarEdicionAdmin = async () => {
  const { isConfirmed } = await Swal.fire({
    title: '¿Editar datos de entrada?',
    html: 'Modificarás los datos enviados por el delegado en la preinscripción.<br><span class="text-sm text-slate-500">Usa esta opción solo para corregir errores de captura antes de la decisión final.</span>',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Sí, editar',
    cancelButtonText: 'Cancelar',
    confirmButtonColor: '#d97706',
    focusCancel: true,
  })
  if (!isConfirmed) return
  await cargarAdminOpciones(solicitudActiva.value?.gestion?.idGestion)
  hidratarAdminFormDesdeSolicitud(solicitudActiva.value)
  modoEdicionAdmin.value = true
}

const cancelarEdicionAdmin = () => {
  modoEdicionAdmin.value = false
  adminFormDraft.value = {}
}

const guardarEdicionAdmin = async () => {
  if (!solicitudActiva.value) return
  guardandoAdmin.value = true
  try {
    const payload = { ...adminFormDraft.value }
    if (payload.costosParticipacion) {
      const multiple = Boolean(payload.costosParticipacion.multiple)
      const items = (payload.costosParticipacion.items || []).map((item) => ({
        concepto: multiple ? String(item.concepto || '').trim() : 'Costo por participar',
        monto: Number(item.monto),
      }))
      payload.costosParticipacion = { multiple, items }
    }
    const { data } = await api.put(`/inscripciones/${solicitudActiva.value.idSolicitud}/admin-datos`, payload)
    solicitudActiva.value = data
    const idx = solicitudes.value.findIndex((s) => s.idSolicitud === data.idSolicitud)
    if (idx !== -1) solicitudes.value[idx] = { ...solicitudes.value[idx], ...data }
    modoEdicionAdmin.value = false
    notify.success('Datos actualizados', 'Los datos de la preinscripción fueron guardados.')
    const { data: refreshed } = await api.get(`/inscripciones/${solicitudActiva.value.idSolicitud}`)
    solicitudActiva.value = refreshed
    revisionChecklistDraft.value = refreshed.revisionChecklist
      ? JSON.parse(JSON.stringify(refreshed.revisionChecklist))
      : {}
  } catch (e) {
    notify.error('Error', e?.response?.data?.message || 'No se pudieron guardar los datos.')
  } finally {
    guardandoAdmin.value = false
  }
}

// ── Cambio de estado ───────────────────────────────────────────────────────────
const confirmarCambioEstado = async (nuevoEstado) => {
  if (!solicitudActiva.value) return

  const nombre = solicitudActiva.value.nombreFraternidad || 'esta fraternidad'
  const eraAprobada = solicitudActiva.value.estado === 'APROBADO'
  const tieneFraternidad = !!solicitudActiva.value.fraternidadCreada

  if (nuevoEstado === 'APROBADO' && !puedeAprobarSolicitud.value) {
    await Swal.fire({
      title: 'Revisión incompleta',
      text: 'Debes marcar todos los ítems del checklist como correctos (✓) antes de aprobar.',
      icon: 'warning',
      confirmButtonColor: '#003399',
    })
    return
  }

  if (nuevoEstado === 'OBSERVADO') {
    if (!tieneItemsObservados.value) {
      await Swal.fire({
        title: 'Sin datos observados',
        text: 'Marca con ✕ al menos un dato o documento incorrecto antes de observar la solicitud.',
        icon: 'warning',
        confirmButtonColor: '#003399',
      })
      return
    }
    if (itemsObservadosSinMotivo.value.length) {
      await Swal.fire({
        title: 'Faltan motivos de rechazo',
        text: 'Indica el motivo en cada dato o documento marcado con ✕ antes de observar.',
        icon: 'warning',
        confirmButtonColor: '#003399',
      })
      return
    }
  }

  if (nuevoEstado === 'RECHAZADO' && !obsForm.value?.trim()) {
    const { value: motivo, isConfirmed } = await Swal.fire({
      title: 'Motivo del rechazo',
      text: 'La inscripción quedará anulada. El delegado no podrá corregir ni reenviar.',
      input: 'textarea',
      inputPlaceholder: 'Escriba el motivo del rechazo por La Comisión...',
      inputValue: obsForm.value || '',
      showCancelButton: true,
      confirmButtonText: 'Continuar',
      cancelButtonText: 'No',
      confirmButtonColor: '#dc2626',
      inputValidator: (value) => (!value?.trim() ? 'El motivo es obligatorio para rechazar.' : undefined),
    })
    if (!isConfirmed) return
    obsForm.value = motivo
  }

  const configs = {
    APROBADO: {
      title: '¿Está seguro de aprobar?',
      html: `La <strong>Comisión</strong> aprobará la preinscripción de <strong>${nombre}</strong>.<br><span class="text-sm text-slate-500">La fraternidad quedará registrada oficialmente si corresponde.</span>`,
      icon: 'question',
      confirmButtonColor: '#059669',
      confirmButtonText: 'Sí, aprobar',
      cancelButtonText: 'No',
      focusCancel: false,
    },
    OBSERVADO: {
      title: eraAprobada ? '¿Volver a observar solicitud aprobada?' : '¿Observar solicitud?',
      html: eraAprobada && tieneFraternidad
        ? `La <strong>Comisión</strong> devolverá la solicitud de <strong>${nombre}</strong> al delegado.<br><span class="text-sm text-red-600 font-bold">Se eliminará la fraternidad registrada</span> hasta que vuelva a aprobarse.`
        : `La <strong>Comisión</strong> devolverá la solicitud de <strong>${nombre}</strong> al delegado para corrección.<br><span class="text-sm text-slate-500">Solo podrá modificar los campos marcados con ✕.</span>`,
      icon: 'warning',
      confirmButtonColor: '#ea580c',
      confirmButtonText: 'Sí, observar',
      cancelButtonText: 'No',
      focusCancel: true,
    },
    RECHAZADO: {
      title: eraAprobada ? '¿Rechazar solicitud ya aprobada?' : '¿Rechazar y anular?',
      html: eraAprobada && tieneFraternidad
        ? `La <strong>Comisión</strong> rechazará la preinscripción de <strong>${nombre}</strong>.<br><span class="text-sm text-red-600 font-bold">Se eliminará la fraternidad registrada.</span> El delegado no podrá corregir ni reenviar.`
        : `La <strong>Comisión</strong> rechazará y <strong>anulará</strong> la preinscripción de <strong>${nombre}</strong>.<br><span class="text-sm text-slate-500">El delegado <strong>no</strong> tendrá derecho a corregir ni reenviar.</span>`,
      icon: 'warning',
      confirmButtonColor: '#dc2626',
      confirmButtonText: 'Sí, rechazar',
      cancelButtonText: 'No',
      focusCancel: true,
    },
    PENDIENTE: {
      title: '¿Está seguro?',
      text: `La solicitud de ${nombre} volverá al estado PENDIENTE.`,
      icon: 'question',
      confirmButtonColor: '#64748b',
      confirmButtonText: 'Sí',
      cancelButtonText: 'No',
    },
  }

  const cfg = configs[nuevoEstado]
  const { isConfirmed } = await Swal.fire({
    ...cfg,
    showCancelButton: true,
    cancelButtonColor: '#94a3b8',
  })

  if (!isConfirmed) return
  await cambiarEstado(nuevoEstado)
}

const mensajeNotificacionEmail = (data) => {
  const n = data?.notificacionDelegado
  if (!n) return ''
  if (n.enviado && n.correo) {
    return `<br><span class="text-sm text-slate-500">Se envió notificación por correo a <strong>${n.correo}</strong>.</span>`
  }
  if (n.error) {
    return `<br><span class="text-sm text-amber-700"><strong>Atención:</strong> ${n.error}</span>`
  }
  return ''
}

const cambiarEstado = async (nuevoEstado) => {
  actualizando.value = true
  try {
    const { data } = await api.put(`/inscripciones/${solicitudActiva.value.idSolicitud}/estado`, {
      estado: nuevoEstado,
      observaciones: nuevoEstado === 'RECHAZADO' ? (obsForm.value || undefined) : undefined,
      revisionChecklist: revisionChecklistDraft.value,
    })
    solicitudActiva.value = { ...solicitudActiva.value, ...data }
    const idx = solicitudes.value.findIndex(s => s.idSolicitud === data.idSolicitud)
    if (idx !== -1) solicitudes.value[idx] = { ...solicitudes.value[idx], ...data }

    if (nuevoEstado === 'APROBADO') {
      await Swal.fire({
        title: '¡Preinscripción aprobada!',
        html: (data.fraternidadCreada
          ? `La Comisión aprobó la solicitud. La fraternidad <strong>${data.fraternidadCreada.nombre}</strong> quedó registrada oficialmente.`
          : `La Comisión aprobó la solicitud de <strong>${data.nombreFraternidad || 'la fraternidad'}</strong>.`)
          + mensajeNotificacionEmail(data),
        icon: 'success',
        confirmButtonText: 'Entendido',
        confirmButtonColor: '#059669',
      })
    } else if (nuevoEstado === 'OBSERVADO') {
      await Swal.fire({
        title: 'Solicitud observada',
        html: 'La Comisión devolvió la solicitud al delegado para corrección.'
          + mensajeNotificacionEmail(data),
        icon: 'info',
        confirmButtonText: 'Entendido',
        confirmButtonColor: '#ea580c',
      })
    } else if (nuevoEstado === 'RECHAZADO') {
      await Swal.fire({
        title: 'Solicitud anulada',
        html: 'La Comisión rechazó y anuló la solicitud.<br><span class="text-sm text-slate-500">El delegado no podrá corregir ni reenviar.</span>'
          + mensajeNotificacionEmail(data),
        icon: 'info',
        confirmButtonText: 'Entendido',
        confirmButtonColor: '#003399',
      })
    } else {
      notify.success('Estado actualizado', `La solicitud fue marcada como ${nuevoEstado}.`)
    }
  } catch (e) {
    notify.error('Error', e.response?.data?.message || 'No se pudo actualizar el estado.')
  } finally {
    actualizando.value = false
  }
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
.section-title.mb-0,
h3.section-title.mb-0 {
  margin-bottom: 0;
}
.btn-revision-masiva {
  padding: 0.35rem 0.75rem;
  border-radius: 0.75rem;
  font-size: 9px;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  transition: all 0.15s;
}
.btn-revision-aceptar {
  background: #059669;
  color: white;
  border: 1px solid #047857;
  box-shadow: 0 4px 14px rgba(5, 150, 105, 0.25);
}
.btn-revision-aceptar:hover {
  background: #047857;
}
.btn-revision-rechazar {
  background: #dc2626;
  color: white;
  border: 1px solid #b91c1c;
  box-shadow: 0 4px 14px rgba(220, 38, 38, 0.25);
}
.btn-revision-rechazar:hover {
  background: #b91c1c;
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
