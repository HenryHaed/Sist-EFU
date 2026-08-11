<template>
  <div class="min-h-full bg-slate-50">
    <!-- Móvil: aviso -->
    <div class="lg:hidden dashboard-page max-w-lg w-full mx-auto px-4 py-16 flex flex-col items-center text-center">
      <div class="size-20 rounded-3xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mb-6">
        <span class="material-symbols-outlined text-4xl">desktop_windows</span>
      </div>
      <h2 class="text-2xl font-black uppercase italic text-primary tracking-tight mb-3">
        Vista no disponible en móvil
      </h2>
      <p class="text-slate-600 text-sm font-medium leading-relaxed max-w-sm">
        La revisión de inscripciones a concursos requiere pantalla de escritorio para ver datos y documentos a la vez.
      </p>
    </div>

    <div class="hidden lg:block dashboard-page max-w-7xl">
      <div class="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
        <div>
          <h2 class="dashboard-page-title text-primary">Inscripciones a concursos externos</h2>
          <p class="text-slate-500 text-sm font-medium mt-1">
            Revisa expedientes (fotografía / otros / Chacha-Warmi) con checklist y vista de documentos, igual que las solicitudes de fraternidad.
          </p>
        </div>
        <select
          v-model="filtroFase"
          @change="cargar"
          class="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none focus:border-primary"
        >
          <option value="">Todos los concursos</option>
          <option v-for="f in fasesExternas" :key="f.idFase" :value="f.idFase">{{ f.nombre }}</option>
        </select>
      </div>

      <div class="flex flex-wrap gap-2 mb-5">
        <button
          v-for="tab in tabsEstado"
          :key="tab.filter"
          type="button"
          @click="filtroEstado = tab.filter"
          class="px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all"
          :class="filtroEstado === tab.filter
            ? 'bg-primary text-white border-primary'
            : 'bg-white text-slate-500 border-slate-200 hover:border-primary/40'"
        >
          {{ tab.label }}
          <span class="ml-1 opacity-80">({{ tab.count }})</span>
        </button>
      </div>

      <div v-if="loading" class="py-20 text-center text-slate-400">
        <span class="material-symbols-outlined animate-spin text-4xl">progress_activity</span>
      </div>

      <div v-else class="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div v-if="listaFiltrada.length === 0" class="py-16 text-center text-slate-400">
          <span class="material-symbols-outlined text-5xl mb-2 opacity-30">inbox</span>
          <p class="font-bold text-sm">No hay inscripciones en este filtro.</p>
        </div>
        <div v-else class="divide-y divide-slate-100">
          <div
            v-for="item in listaFiltrada"
            :key="item.idInscripcion"
            class="p-4 sm:p-5 hover:bg-slate-50/80 transition-colors flex flex-col lg:flex-row lg:items-center gap-4"
          >
            <div class="flex-1 min-w-0">
              <p class="font-black text-slate-900 truncate">
                <template v-if="esChacha(item)">
                  {{ item.datos?.nombreCompleto || 'Pareja Chacha-Warmi' }}
                  <span v-if="item.datos?.nombreCompletoPareja" class="font-bold text-slate-600">
                    / {{ item.datos.nombreCompletoPareja }}
                  </span>
                </template>
                <template v-else>
                  {{ item.datos?.nombreCompleto || `${item.usuario?.nombres || ''} ${item.usuario?.primerApellido || ''}`.trim() || 'Inscripción' }}
                </template>
              </p>
              <p class="text-xs text-slate-500 font-medium mt-0.5">
                {{ item.fase?.nombre }}
                <span v-if="item.fraternidad || item.usuario?.fraternidad">
                  · {{ (item.fraternidad || item.usuario.fraternidad).nombre }}
                </span>
                <span v-if="esChacha(item)" class="text-amber-700"> · vía delegado</span>
                <span v-else-if="item.usuario?.ci"> · CI {{ item.usuario.ci }}</span>
              </p>
            </div>
            <span
              class="self-start px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border"
              :class="badgeEstado(item.estado)"
            >{{ item.estado }}</span>
            <button
              type="button"
              @click="abrirDetalle(item)"
              class="px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-xl text-xs font-black uppercase tracking-widest"
            >
              Revisar
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- ===== PANEL DETALLE (split datos | PDF) ===== -->
    <transition name="slide-right">
      <div v-if="detalle" class="fixed inset-0 z-50 hidden lg:flex">
        <div class="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" @click="cerrarDetalle"></div>

        <div class="relative ml-auto w-full h-full bg-white shadow-2xl flex flex-col overflow-hidden" style="max-width: min(1400px, 95vw)">
          <!-- Header -->
          <div class="shrink-0 bg-primary px-4 sm:px-6 py-5 flex items-center justify-between gap-4">
            <div class="min-w-0">
              <p class="text-[10px] text-white/60 font-black uppercase tracking-widest mb-1">
                Inscripción #{{ detalle.idInscripcion }}
              </p>
              <h2 class="text-2xl font-black text-white uppercase tracking-tight leading-tight">
                Aprobación de datos y documentos
              </h2>
              <p class="text-sm font-black text-white/95 italic uppercase tracking-tighter mt-1">
                {{ detalle.fase?.nombre || 'Concurso' }}
              </p>
              <p class="text-xs text-white/70 font-medium mt-1">
                <span v-if="detalle.fraternidad || detalle.usuario?.fraternidad">
                  {{ (detalle.fraternidad || detalle.usuario.fraternidad).nombre }} ·
                </span>
                {{ esChacha(detalle) ? 'Chacha-Warmi (delegado)' : 'Concursante' }}
              </p>
            </div>
            <div class="flex items-center gap-3 shrink-0">
              <div
                class="px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border"
                :class="badgeEstado(detalle.estado)"
              >
                {{ detalle.estado }}
              </div>
              <button
                type="button"
                @click="cerrarDetalle"
                class="size-9 bg-white/10 hover:bg-white/20 rounded-xl flex items-center justify-center text-white"
              >
                <span class="material-symbols-outlined">close</span>
              </button>
            </div>
          </div>

          <!-- Progreso -->
          <div class="shrink-0 px-6 py-3 bg-slate-50 border-b border-slate-100">
            <div class="flex items-center justify-between gap-3 mb-2">
              <p class="text-[10px] font-black uppercase tracking-widest text-slate-500">Progreso de revisión</p>
              <div class="flex items-center gap-3">
                <p class="text-[10px] font-black text-primary">{{ revisionProgreso.revisados }} / {{ revisionProgreso.total }}</p>
                <button
                  type="button"
                  @click="guardarProgreso"
                  :disabled="actualizando || guardandoProgreso || !hayProgresoSinGuardar"
                  class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider border transition-all disabled:opacity-40"
                  :class="hayProgresoSinGuardar
                    ? 'bg-primary text-white border-primary hover:bg-primary/90 shadow-sm'
                    : 'bg-white text-slate-400 border-slate-200'"
                >
                  <span class="material-symbols-outlined text-sm">{{ guardandoProgreso ? 'hourglass_top' : 'save' }}</span>
                  {{ guardandoProgreso ? 'Guardando…' : (hayProgresoSinGuardar ? 'Guardar progreso' : 'Progreso guardado') }}
                </button>
              </div>
            </div>
            <div class="h-2 bg-slate-200 rounded-full overflow-hidden">
              <div class="h-full bg-primary transition-all duration-500 rounded-full" :style="{ width: revisionProgreso.porcentaje + '%' }"></div>
            </div>
            <p v-if="hayProgresoSinGuardar" class="mt-2 text-[10px] text-amber-700 font-medium">
              Hay marcas sin guardar. Usa «Guardar progreso» antes de cerrar.
            </p>
            <div class="flex flex-wrap gap-2 mt-3">
              <button
                v-for="sec in secciones"
                :key="sec.id"
                type="button"
                @click="irASeccion(sec.id)"
                class="px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider border transition-all"
                :class="seccionActiva === sec.id ? 'bg-primary text-white border-primary' : 'bg-white text-slate-500 border-slate-200 hover:border-primary/40'"
              >
                {{ sec.label }}
              </button>
            </div>
          </div>

          <!-- Split -->
          <div class="flex-1 min-h-0 flex">
            <!-- Izquierda: datos + checklist -->
            <div ref="panelScroll" class="flex-1 overflow-y-auto custom-scrollbar lg:w-[48%] lg:border-r border-slate-100">
              <section
                v-if="detalle.observacionAdmin && (detalle.estado === 'OBSERVADO' || detalle.estado === 'RECHAZADO')"
                class="px-5 py-4 border-b border-amber-100 bg-amber-50"
              >
                <p class="text-[10px] font-black uppercase tracking-widest text-amber-800 mb-1">
                  {{ detalle.estado === 'RECHAZADO' ? 'Motivo del rechazo' : 'Observación vigente' }}
                </p>
                <p class="text-sm text-amber-950 whitespace-pre-wrap">{{ detalle.observacionAdmin }}</p>
              </section>

              <!-- Datos personales -->
              <section id="sec-datos" class="px-5 py-5 border-b border-slate-100">
                <div class="flex flex-wrap items-center justify-between gap-2 mb-3">
                  <h3 class="text-[11px] font-black uppercase tracking-widest text-slate-500">Datos del expediente</h3>
                  <div class="flex gap-2">
                    <button type="button" @click="aceptarItems(itemsDatos)" class="btn-masiva btn-ok">Aceptar todo</button>
                    <button type="button" @click="rechazarItems(itemsDatos)" class="btn-masiva btn-x">Rechazar todo</button>
                  </div>
                </div>
                <div class="space-y-3">
                  <div v-for="item in itemsDatos" :key="item.key" class="rounded-2xl border border-slate-100 bg-slate-50 p-3">
                    <div class="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                      <div class="min-w-0 flex-1">
                        <div class="flex flex-wrap items-center gap-2 mb-0.5">
                          <p class="text-[10px] uppercase tracking-widest text-slate-400 font-bold">
                            {{ item.label }}<span v-if="item.required" class="text-secondary"> *</span>
                          </p>
                          <span :class="badgeReq(item.required)">{{ item.required ? 'Obligatorio' : 'Opcional' }}</span>
                        </div>
                        <p class="text-sm font-medium text-slate-800 break-words whitespace-pre-wrap">{{ item.value || '—' }}</p>
                      </div>
                      <div class="flex items-center gap-2 shrink-0">
                        <button type="button" @click.stop="setChecklistEstado(item, 'OK')" :class="['size-9 rounded-xl border text-sm font-black flex items-center justify-center', checklistBotonClase(item.key, 'OK')]">✓</button>
                        <button type="button" @click.stop="setChecklistEstado(item, 'X')" :class="['size-9 rounded-xl border text-sm font-black flex items-center justify-center', checklistBotonClase(item.key, 'X')]">✕</button>
                      </div>
                    </div>
                    <div v-if="checklistEstado(item.key) === 'X'" class="mt-3 pt-3 border-t border-red-100">
                      <label class="block text-[9px] font-black uppercase tracking-widest text-red-600 mb-1">Motivo</label>
                      <textarea
                        :value="checklistComentario(item.key)"
                        @input="setChecklistComentario(item.key, $event.target.value)"
                        rows="2"
                        placeholder="Indique por qué se observa este dato…"
                        class="w-full px-3 py-2 bg-white border border-red-200 rounded-xl text-xs text-slate-700 resize-none focus:ring-2 focus:ring-red-200 outline-none"
                      ></textarea>
                    </div>
                  </div>
                  <p v-if="!itemsDatos.length" class="text-xs text-slate-400">Sin campos de datos en la plantilla.</p>
                </div>
              </section>

              <!-- Documentos -->
              <section id="sec-docs" class="px-5 py-5 border-b border-slate-100">
                <div class="flex flex-wrap items-center justify-between gap-2 mb-3">
                  <h3 class="text-[11px] font-black uppercase tracking-widest text-slate-500">Documentos</h3>
                  <div class="flex gap-2">
                    <button type="button" @click="aceptarItems(itemsDocumentos)" class="btn-masiva btn-ok">Aceptar todo</button>
                    <button type="button" @click="rechazarItems(itemsDocumentos)" class="btn-masiva btn-x">Rechazar todo</button>
                  </div>
                </div>
                <p class="text-[10px] text-slate-400 font-medium mb-3">Haz clic en un documento para verlo a la derecha. Marca ✓ o ✕.</p>
                <div class="space-y-3">
                  <div
                    v-for="doc in itemsDocumentos"
                    :key="doc.key"
                    class="rounded-2xl border p-3 cursor-pointer transition-colors"
                    :class="pdfSeleccionado?.key === doc.key ? 'border-primary bg-primary/5' : 'border-slate-200 bg-white hover:border-primary/40'"
                    @click="seleccionarPdf(doc)"
                  >
                    <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div class="min-w-0 flex-1">
                        <div class="flex flex-wrap items-center gap-2 mb-0.5">
                          <p class="text-[10px] uppercase tracking-widest text-slate-400 font-bold">
                            {{ doc.label }}<span v-if="doc.required" class="text-secondary"> *</span>
                          </p>
                          <span :class="badgeReq(doc.required)">{{ doc.required ? 'Obligatorio' : 'Opcional' }}</span>
                        </div>
                        <p class="text-xs font-medium" :class="doc.url ? 'text-primary' : 'text-amber-600'">
                          {{ doc.url ? (doc.nombreOriginal || 'Archivo adjunto') : 'No entregado' }}
                          <span v-if="doc.archivosExtra > 0" class="text-slate-400"> (+{{ doc.archivosExtra }} más)</span>
                        </p>
                      </div>
                      <div class="flex items-center gap-2 shrink-0" @click.stop>
                        <button type="button" @click="setChecklistEstado(doc, 'OK')" :class="['size-8 rounded-lg border text-sm font-black flex items-center justify-center', checklistBotonClase(doc.key, 'OK')]">✓</button>
                        <button type="button" @click="setChecklistEstado(doc, 'X')" :class="['size-8 rounded-lg border text-sm font-black flex items-center justify-center', checklistBotonClase(doc.key, 'X')]">✕</button>
                      </div>
                    </div>
                    <div v-if="checklistEstado(doc.key) === 'X'" class="mt-3 pt-3 border-t border-red-100" @click.stop>
                      <label class="block text-[9px] font-black uppercase tracking-widest text-red-600 mb-1">Motivo</label>
                      <textarea
                        :value="checklistComentario(doc.key)"
                        @input="setChecklistComentario(doc.key, $event.target.value)"
                        rows="2"
                        placeholder="Ej. ilegible, incompleto, no corresponde…"
                        class="w-full px-3 py-2 bg-slate-50 border border-red-200 rounded-xl text-xs text-slate-700 resize-none focus:ring-2 focus:ring-red-200 outline-none"
                      ></textarea>
                    </div>
                  </div>
                  <p v-if="!itemsDocumentos.length" class="text-xs text-slate-400">Sin documentos requeridos.</p>
                </div>
              </section>

              <!-- Decisión -->
              <section id="sec-decision" class="px-5 py-5">
                <h3 class="text-[11px] font-black uppercase tracking-widest text-slate-500 mb-4">Decisión administrativa</h3>
                <div class="flex flex-wrap gap-3">
                  <button
                    type="button"
                    @click="guardarProgreso"
                    :disabled="actualizando || guardandoProgreso || !hayProgresoSinGuardar"
                    class="flex items-center gap-2 px-5 py-3 bg-white hover:bg-slate-50 text-primary border-2 border-primary/30 rounded-xl font-black text-xs uppercase tracking-widest disabled:opacity-50"
                  >
                    <span class="material-symbols-outlined text-sm">save</span>
                    Guardar progreso
                  </button>
                  <button
                    v-if="detalle.estado !== 'APROBADO' && detalle.estado !== 'BORRADOR'"
                    type="button"
                    @click="decidir('aprobar')"
                    :disabled="actualizando || !puedeAprobar"
                    class="flex items-center gap-2 px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-lg shadow-emerald-500/20 disabled:opacity-50"
                  >
                    <span class="material-symbols-outlined text-sm">check_circle</span>
                    Aprobar
                  </button>
                  <button
                    v-if="detalle.estado === 'PENDIENTE' || detalle.estado === 'OBSERVADO'"
                    type="button"
                    @click="decidir('observar')"
                    :disabled="actualizando || !tieneItemsObservados"
                    class="flex items-center gap-2 px-5 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-lg shadow-orange-500/20 disabled:opacity-50"
                  >
                    <span class="material-symbols-outlined text-sm">edit_note</span>
                    Observar para corrección
                  </button>
                  <button
                    v-if="detalle.estado !== 'RECHAZADO' && detalle.estado !== 'BORRADOR'"
                    type="button"
                    @click="decidir('rechazar')"
                    :disabled="actualizando"
                    class="flex items-center gap-2 px-5 py-3 bg-secondary hover:bg-red-800 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-lg shadow-secondary/20 disabled:opacity-50"
                  >
                    <span class="material-symbols-outlined text-sm">cancel</span>
                    Rechazar
                  </button>
                </div>
                <p v-if="!puedeAprobar && detalle.estado !== 'APROBADO'" class="mt-3 text-[10px] text-slate-400 font-medium">
                  Para aprobar, marca todos los datos y documentos con ✓. Para observar, marca al menos un ✕ con motivo.
                </p>
              </section>
            </div>

            <!-- Derecha: visor -->
            <div class="flex-1 flex flex-col min-h-0 lg:w-[52%] bg-slate-50">
              <div v-if="pdfSeleccionado" class="shrink-0 flex flex-col gap-2 px-4 py-3 bg-slate-800 text-white border-b border-white/10">
                <div class="flex items-center justify-between gap-2">
                  <div class="min-w-0 flex-1">
                    <div class="flex flex-wrap items-center gap-2">
                      <p class="text-[10px] font-black uppercase tracking-widest truncate">{{ pdfSeleccionado.label }}</p>
                      <span
                        class="text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded shrink-0"
                        :class="pdfSeleccionado.required ? 'bg-red-500/20 text-red-200' : 'bg-white/10 text-white/60'"
                      >
                        {{ pdfSeleccionado.required ? 'Obligatorio' : 'Opcional' }}
                      </span>
                    </div>
                    <p v-if="!pdfSeleccionado.url" class="text-[9px] text-amber-300 font-bold uppercase tracking-widest mt-0.5">
                      Documento no entregado
                    </p>
                  </div>
                  <div class="flex items-center gap-1 shrink-0">
                    <button type="button" @click="setChecklistEstado(pdfSeleccionado, 'OK')" :class="['size-8 rounded-lg border text-sm font-black flex items-center justify-center', checklistBotonClase(pdfSeleccionado.key, 'OK')]">✓</button>
                    <button type="button" @click="setChecklistEstado(pdfSeleccionado, 'X')" :class="['size-8 rounded-lg border text-sm font-black flex items-center justify-center', checklistBotonClase(pdfSeleccionado.key, 'X')]">✕</button>
                    <a
                      v-if="pdfSeleccionado.url"
                      :href="urlActiva"
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
                    placeholder="Motivo de la observación…"
                    class="w-full px-3 py-2 bg-slate-900 border border-red-400/50 rounded-lg text-xs text-white placeholder:text-white/40 resize-none outline-none"
                  ></textarea>
                </div>
                <!-- Varios archivos de la misma clave -->
                <div v-if="(pdfSeleccionado.todos || []).length > 1" class="flex flex-wrap gap-1">
                  <button
                    v-for="(a, idx) in pdfSeleccionado.todos"
                    :key="a.idArchivo"
                    type="button"
                    @click="cambiarArchivoDoc(idx)"
                    class="px-2 py-1 rounded text-[9px] font-black uppercase"
                    :class="pdfSeleccionado.archivoIdx === idx ? 'bg-white text-slate-900' : 'bg-white/10 hover:bg-white/20'"
                  >
                    Archivo {{ idx + 1 }}
                  </button>
                </div>
              </div>
              <div v-else class="shrink-0 px-4 py-3 border-b border-slate-200 bg-white">
                <p class="text-[10px] font-black uppercase tracking-widest text-slate-500">Vista previa del documento</p>
                <p class="text-[11px] text-slate-400 mt-1">Selecciona un documento a la izquierda para previsualizarlo.</p>
              </div>

              <div class="flex-1 min-h-[240px] flex flex-col">
                <iframe
                  v-if="pdfSeleccionado?.url && esPdf(pdfSeleccionado)"
                  :src="urlActiva + '#toolbar=1'"
                  class="flex-1 w-full border-none bg-white"
                  :title="pdfSeleccionado.label"
                ></iframe>
                <div
                  v-else-if="pdfSeleccionado?.url && esImagen(pdfSeleccionado)"
                  class="flex-1 overflow-auto bg-slate-200 flex items-center justify-center p-4"
                >
                  <img :src="urlActiva" :alt="pdfSeleccionado.label" class="max-w-full max-h-full object-contain shadow-lg" />
                </div>
                <div
                  v-else-if="pdfSeleccionado?.url && esAudio(pdfSeleccionado)"
                  class="flex-1 flex flex-col items-center justify-center gap-4 p-6 bg-white"
                >
                  <span class="material-symbols-outlined text-5xl text-primary">audio_file</span>
                  <p class="text-sm font-bold text-slate-700">{{ pdfSeleccionado.nombreOriginal || 'Pista de audio' }}</p>
                  <audio :src="urlActiva" controls class="w-full max-w-md" />
                </div>
                <div v-else-if="pdfSeleccionado && !pdfSeleccionado.url" class="flex-1 flex flex-col items-center justify-center text-slate-400 gap-3 p-6">
                  <span class="material-symbols-outlined text-5xl text-amber-400">folder_off</span>
                  <p class="text-sm font-black text-slate-600 uppercase tracking-widest text-center">Documento no entregado</p>
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
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import Swal from 'sweetalert2'
import api from '../services/api'
import { getImageUrl } from '../utils/url'

const loading = ref(true)
const lista = ref([])
const fasesExternas = ref([])
const filtroFase = ref('')
const filtroEstado = ref('PENDIENTE')
const detalle = ref(null)
const revisionChecklistDraft = ref({})
const revisionChecklistGuardado = ref('{}')
const pdfSeleccionado = ref(null)
const seccionActiva = ref('sec-datos')
const panelScroll = ref(null)
const actualizando = ref(false)
const guardandoProgreso = ref(false)

const esChacha = (item) => item?.fase?.plantillaRequisitos === 'chacha_warmi'

const badgeEstado = (estado) => ({
  BORRADOR: 'bg-slate-100 text-slate-600 border-slate-200',
  PENDIENTE: 'bg-blue-50 text-blue-700 border-blue-100',
  OBSERVADO: 'bg-amber-50 text-amber-700 border-amber-100',
  APROBADO: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  RECHAZADO: 'bg-red-50 text-red-700 border-red-100',
}[estado] || 'bg-slate-100 text-slate-600 border-slate-200')

const badgeReq = (required) =>
  required
    ? 'text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded bg-red-50 text-red-600 border border-red-100'
    : 'text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded bg-slate-100 text-slate-500 border border-slate-200'

const tabsEstado = computed(() => {
  const count = (est) => lista.value.filter((i) => i.estado === est).length
  return [
    { label: 'Pendientes', filter: 'PENDIENTE', count: count('PENDIENTE') },
    { label: 'Observadas', filter: 'OBSERVADO', count: count('OBSERVADO') },
    { label: 'Aprobadas', filter: 'APROBADO', count: count('APROBADO') },
    { label: 'Rechazadas', filter: 'RECHAZADO', count: count('RECHAZADO') },
    { label: 'Borradores', filter: 'BORRADOR', count: count('BORRADOR') },
    { label: 'Todas', filter: '', count: lista.value.length },
  ]
})

const listaFiltrada = computed(() => {
  if (!filtroEstado.value) return lista.value
  return lista.value.filter((i) => i.estado === filtroEstado.value)
})

const requisitos = computed(() => detalle.value?.requisitos || { campos: [], documentos: [] })

const itemsDatos = computed(() =>
  (requisitos.value.campos || []).map((c) => ({
    key: c.clave,
    label: c.etiqueta,
    value: detalle.value?.datos?.[c.clave] ?? '',
    required: !!c.obligatorio,
  })),
)

const itemsDocumentos = computed(() => {
  const archivos = detalle.value?.archivos || []
  return (requisitos.value.documentos || []).map((d) => {
    const matches = archivos.filter((a) => a.claveDocumento === d.clave)
    const primero = matches[0]
    return {
      key: d.clave,
      label: d.etiqueta,
      required: !!d.obligatorio,
      url: primero?.url || '',
      mime: primero?.mime || (d.mime || [])[0] || '',
      nombreOriginal: primero?.nombreOriginal || '',
      archivosExtra: Math.max(0, matches.length - 1),
      todos: matches,
      archivoIdx: 0,
      value: primero?.url || '',
      isDoc: true,
    }
  })
})

const checklistKeys = computed(() => [
  ...itemsDatos.value.map((i) => i.key),
  ...itemsDocumentos.value.map((i) => i.key),
])

const revisionProgreso = computed(() => {
  const total = checklistKeys.value.length
  const revisados = checklistKeys.value.filter((k) => {
    const e = checklistEstado(k)
    return e === 'OK' || e === 'X'
  }).length
  return {
    total,
    revisados,
    porcentaje: total ? Math.round((revisados / total) * 100) : 0,
  }
})

const hayProgresoSinGuardar = computed(
  () => JSON.stringify(revisionChecklistDraft.value || {}) !== revisionChecklistGuardado.value,
)

const puedeAprobar = computed(() =>
  checklistKeys.value.length > 0 &&
  checklistKeys.value.every((k) => checklistEstado(k) === 'OK'),
)

const tieneItemsObservados = computed(() =>
  checklistKeys.value.some((k) => checklistEstado(k) === 'X'),
)

const secciones = [
  { id: 'sec-datos', label: 'Datos' },
  { id: 'sec-docs', label: 'Documentos' },
  { id: 'sec-decision', label: 'Decisión' },
]

const urlActiva = computed(() => getImageUrl(pdfSeleccionado.value?.url || ''))

const checklistEstado = (key) => revisionChecklistDraft.value?.[key]?.estado || 'PENDIENTE'
const checklistComentario = (key) => revisionChecklistDraft.value?.[key]?.comentario || ''

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

const setChecklistComentario = (key, comentario) => {
  const actual = revisionChecklistDraft.value?.[key] || {}
  revisionChecklistDraft.value = {
    ...revisionChecklistDraft.value,
    [key]: { ...actual, comentario },
  }
}

const setChecklistEstado = (item, estado) => {
  const prev = revisionChecklistDraft.value?.[item.key] || {}
  const entry = {
    estado,
    label: item.label,
    value: item.value || item.url || '',
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

const aceptarItems = (items) => {
  const next = { ...revisionChecklistDraft.value }
  items.forEach((item) => {
    next[item.key] = { estado: 'OK', label: item.label, value: item.value || item.url || '' }
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
      value: item.value || item.url || '',
      comentario: prev.comentario || '',
    }
  })
  revisionChecklistDraft.value = next
}

const seleccionarPdf = (doc) => {
  pdfSeleccionado.value = { ...doc, archivoIdx: 0 }
}

const cambiarArchivoDoc = (idx) => {
  if (!pdfSeleccionado.value?.todos?.[idx]) return
  const a = pdfSeleccionado.value.todos[idx]
  pdfSeleccionado.value = {
    ...pdfSeleccionado.value,
    archivoIdx: idx,
    url: a.url,
    mime: a.mime,
    nombreOriginal: a.nombreOriginal,
    value: a.url,
  }
}

const esPdf = (doc) => {
  const m = String(doc?.mime || '').toLowerCase()
  const u = String(doc?.url || '').toLowerCase()
  const n = String(doc?.nombreOriginal || '').toLowerCase()
  return m.includes('pdf') || u.endsWith('.pdf') || n.endsWith('.pdf')
}

const esImagen = (doc) => {
  const m = String(doc?.mime || '').toLowerCase()
  return m.includes('image') || m.includes('jpeg') || m.includes('jpg') || m.includes('png')
}

const esAudio = (doc) => {
  const m = String(doc?.mime || '').toLowerCase()
  return m.includes('audio') || m.includes('mpeg') || m.includes('mp3')
}

const irASeccion = (id) => {
  seccionActiva.value = id
  const el = document.getElementById(id)
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

const aplicarDetalle = (data) => {
  detalle.value = data
  const checklist = data.revisionChecklist ? JSON.parse(JSON.stringify(data.revisionChecklist)) : {}
  revisionChecklistDraft.value = checklist
  revisionChecklistGuardado.value = JSON.stringify(checklist)
  pdfSeleccionado.value = null
  const primerDoc = itemsDocumentos.value.find((d) => d.url)
  if (primerDoc) seleccionarPdf(primerDoc)
}

const abrirDetalle = async (item) => {
  try {
    const { data } = await api.get(`/inscripciones-concurso/${item.idInscripcion}`)
    aplicarDetalle(data)
  } catch (e) {
    Swal.fire('Error', e.response?.data?.message || 'No se pudo abrir el detalle', 'error')
  }
}

const cerrarDetalle = async () => {
  if (hayProgresoSinGuardar.value) {
    const conf = await Swal.fire({
      title: 'Hay progreso sin guardar',
      text: '¿Guardar antes de cerrar?',
      icon: 'warning',
      showCancelButton: true,
      showDenyButton: true,
      confirmButtonText: 'Guardar y cerrar',
      denyButtonText: 'Cerrar sin guardar',
      cancelButtonText: 'Seguir revisando',
      confirmButtonColor: '#003399',
    })
    if (conf.isDismissed) return
    if (conf.isConfirmed) {
      const ok = await guardarProgreso()
      if (!ok) return
    }
  }
  detalle.value = null
  pdfSeleccionado.value = null
}

const guardarProgreso = async () => {
  if (!detalle.value) return false
  if (!hayProgresoSinGuardar.value) {
    Swal.fire({ icon: 'info', title: 'Sin cambios', toast: true, position: 'top-end', timer: 1500, showConfirmButton: false })
    return true
  }
  guardandoProgreso.value = true
  try {
    const { data } = await api.put(
      `/inscripciones-concurso/${detalle.value.idInscripcion}/revision-checklist`,
      { revisionChecklist: revisionChecklistDraft.value },
    )
    aplicarDetalle(data)
    Swal.fire({ icon: 'success', title: 'Progreso guardado', toast: true, position: 'top-end', timer: 1800, showConfirmButton: false })
    return true
  } catch (e) {
    Swal.fire('Error', e.response?.data?.message || 'No se pudo guardar el progreso', 'error')
    return false
  } finally {
    guardandoProgreso.value = false
  }
}

const decidir = async (accion) => {
  if (!detalle.value) return

  if (accion === 'aprobar' && !puedeAprobar.value) {
    Swal.fire('Checklist incompleto', 'Marca todos los ítems con ✓ antes de aprobar.', 'warning')
    return
  }
  if (accion === 'observar' && !tieneItemsObservados.value) {
    Swal.fire('Sin observaciones', 'Marca al menos un ítem con ✕ e indica el motivo.', 'warning')
    return
  }

  let observacion = ''
  if (accion === 'rechazar') {
    const { value, isConfirmed } = await Swal.fire({
      title: 'Motivo de rechazo',
      input: 'textarea',
      inputPlaceholder: 'La inscripción quedará anulada…',
      showCancelButton: true,
      confirmButtonText: 'Rechazar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#C8102E',
      inputValidator: (v) => (!v?.trim() ? 'El motivo es obligatorio' : null),
    })
    if (!isConfirmed) return
    observacion = value
  } else if (accion === 'observar') {
    const sinMotivo = checklistKeys.value.filter(
      (k) => checklistEstado(k) === 'X' && !String(checklistComentario(k) || '').trim(),
    )
    if (sinMotivo.length) {
      Swal.fire('Falta el motivo', 'Completa el motivo en cada ítem marcado con ✕.', 'warning')
      return
    }
    const conf = await Swal.fire({
      title: '¿Observar inscripción?',
      text: 'Se enviará al inscrito el detalle de los ítems marcados con ✕ para corrección.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Observar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#d97706',
    })
    if (!conf.isConfirmed) return
  } else {
    const conf = await Swal.fire({
      title: '¿Aprobar inscripción?',
      text: esChacha(detalle.value)
        ? 'Se crearán/actualizarán los participantes Chacha y Warmi.'
        : 'El concursante pasará al listado de participantes.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Aprobar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#059669',
    })
    if (!conf.isConfirmed) return
  }

  actualizando.value = true
  try {
    const { data } = await api.post(`/inscripciones-concurso/${detalle.value.idInscripcion}/revisar`, {
      accion,
      observacion,
      revisionChecklist: revisionChecklistDraft.value,
    })
    aplicarDetalle(data)
    await cargar()
    Swal.fire({
      icon: 'success',
      title: accion === 'aprobar' ? 'Aprobada' : accion === 'observar' ? 'Observada' : 'Rechazada',
      toast: true,
      position: 'top-end',
      timer: 2200,
      showConfirmButton: false,
    })
  } catch (e) {
    Swal.fire('Error', e.response?.data?.message || 'No se pudo completar la acción', 'error')
  } finally {
    actualizando.value = false
  }
}

const cargarFases = async () => {
  try {
    const { data: g } = await api.get('/evaluaciones/gestion-activa')
    if (!g?.idGestion) return
    const { data } = await api.get(`/evaluaciones/gestiones/${g.idGestion}/fases`)
    fasesExternas.value = (data.fases || []).filter((f) => f.tipoConcurso === 'EXTERNO')
  } catch {
    fasesExternas.value = []
  }
}

const cargar = async () => {
  loading.value = true
  try {
    const params = filtroFase.value ? `?idFase=${filtroFase.value}` : ''
    const { data } = await api.get(`/inscripciones-concurso${params}`)
    lista.value = data || []
  } catch (e) {
    Swal.fire('Error', e.response?.data?.message || 'No se pudieron cargar las inscripciones', 'error')
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  await cargarFases()
  await cargar()
})
</script>

<style scoped>
.btn-masiva {
  padding: 0.35rem 0.75rem;
  border-radius: 0.5rem;
  font-size: 9px;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  border: 1px solid;
}
.btn-ok {
  background: #ecfdf5;
  color: #047857;
  border-color: #a7f3d0;
}
.btn-x {
  background: #fef2f2;
  color: #b91c1c;
  border-color: #fecaca;
}
.slide-right-enter-active,
.slide-right-leave-active {
  transition: opacity 0.25s ease;
}
.slide-right-enter-active > div:last-child,
.slide-right-leave-active > div:last-child {
  transition: transform 0.3s ease;
}
.slide-right-enter-from,
.slide-right-leave-to {
  opacity: 0;
}
.slide-right-enter-from > div:last-child,
.slide-right-leave-to > div:last-child {
  transform: translateX(40px);
}
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 999px;
}
</style>
