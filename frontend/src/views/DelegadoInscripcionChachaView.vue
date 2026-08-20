<template>
  <div class="dashboard-page max-w-4xl">
    <div class="mb-6">
      <h2 class="dashboard-page-title text-primary italic uppercase">Inscripción Chacha-Warmi</h2>
      <p class="text-slate-500 text-sm font-medium mt-1">
        Completa los datos de la pareja y sube los documentos. Al enviar, la pareja queda registrada en Concursantes Chacha-Warmi para revisión y calificación.
      </p>
    </div>

    <div v-if="loading" class="py-20 text-center text-slate-400">
      <span class="material-symbols-outlined animate-spin text-4xl">progress_activity</span>
    </div>

    <div
      v-else-if="fraternidadNoAprobada"
      class="rounded-3xl border border-dashed border-amber-200 bg-amber-50 p-10 text-center"
    >
      <span class="material-symbols-outlined text-5xl text-amber-400 mb-3">lock</span>
      <p class="font-bold text-amber-900 text-sm max-w-md mx-auto">{{ mensajeBloqueo }}</p>
    </div>

    <div
      v-else-if="sinFase"
      class="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-10 text-center"
    >
      <span class="material-symbols-outlined text-5xl text-slate-300 mb-3">event_busy</span>
      <p class="font-bold text-slate-600 text-sm max-w-md mx-auto">{{ mensajeSinFase }}</p>
    </div>

    <template v-else-if="insc">
      <div class="mb-6 flex flex-wrap items-center gap-3">
        <span
          class="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border"
          :class="badgeEstado(insc.estado)"
        >{{ insc.estado }}</span>
        <span v-if="insc.fase" class="text-xs font-bold text-slate-500">{{ insc.fase.nombre }}</span>
        <span v-if="insc.fraternidad" class="text-xs font-bold text-slate-500">· {{ insc.fraternidad.nombre }}</span>
      </div>

      <div
        v-if="insc.estado === 'OBSERVADO' && insc.observacionAdmin"
        class="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900"
      >
        <p class="font-black text-[10px] uppercase tracking-widest mb-1">Observación del administrador</p>
        {{ insc.observacionAdmin }}
      </div>

      <!-- Stepper -->
      <div class="mb-8 flex items-center justify-center gap-3 sm:gap-6">
        <button
          v-for="s in steps"
          :key="s.n"
          type="button"
          @click="irPaso(s.n)"
          class="flex flex-col items-center gap-2 group"
        >
          <div
            class="size-11 rounded-2xl border-2 flex items-center justify-center font-black text-sm transition-all"
            :class="stepClass(s.n)"
          >
            <span v-if="paso > s.n" class="material-symbols-outlined text-lg">check</span>
            <span v-else>{{ s.n }}</span>
          </div>
          <span
            class="text-[9px] font-black uppercase tracking-widest text-center max-w-[6rem] leading-tight"
            :class="paso === s.n ? 'text-primary' : 'text-slate-400'"
          >{{ s.label }}</span>
        </button>
      </div>

      <!-- PASO 1: Datos personas -->
      <div v-if="paso === 1" class="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
        <section
          v-if="herencia"
          class="bg-slate-50 rounded-3xl border border-slate-200 p-5 sm:p-7 space-y-4"
        >
          <div class="flex items-center gap-3">
            <div class="size-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
              <span class="material-symbols-outlined">account_balance</span>
            </div>
            <div>
              <h3 class="text-base font-black italic uppercase text-slate-800">Instancia de la fraternidad</h3>
              <p class="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                Heredada de la inscripción oficial aprobada · no editable
              </p>
            </div>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="lbl">Fraternidad</label>
              <input :value="herencia.nombreFraternidad" class="inp inp-locked" readonly tabindex="-1" />
            </div>
            <div>
              <label class="lbl">Instancia</label>
              <input :value="herencia.instanciaRepresentacion || '—'" class="inp inp-locked" readonly tabindex="-1" />
            </div>
            <div
              v-if="herencia.instanciaRepresentacion === 'Facultad' || herencia.instanciaRepresentacion === 'Carrera'"
            >
              <label class="lbl">Facultad</label>
              <input :value="herencia.facultadNombre || herencia.facultadCarrera" class="inp inp-locked" readonly tabindex="-1" />
            </div>
            <div v-if="herencia.instanciaRepresentacion === 'Carrera'">
              <label class="lbl">Carrera</label>
              <input :value="herencia.carreraNombre || '—'" class="inp inp-locked" readonly tabindex="-1" />
            </div>
            <div v-if="herencia.instanciaRepresentacion === 'Externo'" class="md:col-span-2">
              <label class="lbl">Institución externa</label>
              <input :value="herencia.institucionNombre || herencia.facultadCarrera" class="inp inp-locked" readonly tabindex="-1" />
            </div>
            <div
              v-if="['UMSA', 'FEDSIDUMSA', 'STUMSA'].includes(herencia.instanciaRepresentacion)"
              class="md:col-span-2"
            >
              <label class="lbl">Representación</label>
              <input :value="herencia.facultadCarrera || herencia.instanciaRepresentacion" class="inp inp-locked" readonly tabindex="-1" />
            </div>
            <div v-if="!herencia.instanciaRepresentacion && herencia.facultadCarrera" class="md:col-span-2">
              <label class="lbl">Facultad / Carrera / Otros</label>
              <input :value="herencia.facultadCarrera" class="inp inp-locked" readonly tabindex="-1" />
            </div>
          </div>
        </section>

        <section class="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 sm:p-7 space-y-5">
          <div class="flex items-center gap-3">
            <div class="size-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
              <span class="material-symbols-outlined">person</span>
            </div>
            <div>
              <h3 class="text-base font-black italic uppercase text-slate-800">1ª persona — Chacha</h3>
              <p class="text-[10px] font-bold uppercase tracking-widest text-slate-400">Datos del primer postulante</p>
            </div>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div
              v-for="campo in camposPersona1"
              :key="campo.clave"
              :class="campo.tipo === 'textarea' ? 'md:col-span-2' : ''"
            >
              <label class="lbl">
                {{ campo.etiqueta }}
                <span v-if="campo.obligatorio" class="text-secondary">*</span>
              </label>
              <textarea
                v-if="campo.tipo === 'textarea'"
                v-model="formDatos[campo.clave]"
                :disabled="!editable"
                rows="3"
                class="inp"
              />
              <select
                v-else-if="campo.tipo === 'select'"
                v-model="formDatos[campo.clave]"
                :disabled="!editable"
                class="inp"
              >
                <option value="">Seleccionar…</option>
                <option v-for="op in (campo.opciones || [])" :key="op" :value="op">{{ op }}</option>
              </select>
              <input
                v-else
                v-model="formDatos[campo.clave]"
                :type="campo.tipo === 'email' ? 'email' : campo.tipo === 'tel' ? 'tel' : 'text'"
                :disabled="!editable"
                class="inp"
              />
            </div>
          </div>
        </section>

        <section class="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 sm:p-7 space-y-5">
          <div class="flex items-center gap-3">
            <div class="size-10 rounded-2xl bg-secondary/10 text-secondary flex items-center justify-center">
              <span class="material-symbols-outlined">person_2</span>
            </div>
            <div>
              <h3 class="text-base font-black italic uppercase text-slate-800">2ª persona — Warmi</h3>
              <p class="text-[10px] font-bold uppercase tracking-widest text-slate-400">Datos del segundo postulante</p>
            </div>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div
              v-for="campo in camposPersona2"
              :key="campo.clave"
              :class="campo.tipo === 'textarea' ? 'md:col-span-2' : ''"
            >
              <label class="lbl">
                {{ etiquetaPareja(campo) }}
                <span v-if="campo.obligatorio" class="text-secondary">*</span>
              </label>
              <textarea
                v-if="campo.tipo === 'textarea'"
                v-model="formDatos[campo.clave]"
                :disabled="!editable"
                rows="3"
                class="inp"
              />
              <select
                v-else-if="campo.tipo === 'select'"
                v-model="formDatos[campo.clave]"
                :disabled="!editable"
                class="inp"
              >
                <option value="">Seleccionar…</option>
                <option v-for="op in (campo.opciones || [])" :key="op" :value="op">{{ op }}</option>
              </select>
              <input
                v-else
                v-model="formDatos[campo.clave]"
                :type="campo.tipo === 'email' ? 'email' : campo.tipo === 'tel' ? 'tel' : 'text'"
                :disabled="!editable"
                class="inp"
              />
            </div>
            <p v-if="!camposPersona2.length" class="md:col-span-2 text-xs text-slate-400 font-medium">
              Esta fase no tiene campos de pareja configurados. El admin puede agregarlos en Gestión de Fases.
            </p>
          </div>
        </section>

        <div class="flex flex-col sm:flex-row justify-between gap-3">
          <button
            v-if="editable"
            type="button"
            @click="guardarDatos"
            :disabled="saving"
            class="px-5 py-3 bg-slate-800 text-white rounded-xl text-xs font-black uppercase tracking-widest disabled:opacity-50"
          >
            {{ saving ? 'Guardando…' : 'Guardar borrador' }}
          </button>
          <button
            type="button"
            @click="siguienteDesdeDatos"
            class="sm:ml-auto px-8 py-3 bg-primary text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-primary/20"
          >
            Continuar a documentos
            <span class="material-symbols-outlined text-sm align-middle ml-1">arrow_forward</span>
          </button>
        </div>
      </div>

      <!-- PASO 2: Documentos -->
      <div v-else class="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
        <section class="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 sm:p-7 space-y-5">
          <div>
            <h3 class="text-base font-black italic uppercase text-slate-800">Documentos de inscripción</h3>
            <p class="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-1">
              Arrastra o selecciona los archivos solicitados
            </p>
          </div>

          <div
            v-for="doc in requisitos.documentos"
            :key="doc.clave"
            class="rounded-2xl border-2 border-dashed p-4 sm:p-5 transition-colors"
            :class="dragOverClave === doc.clave
              ? 'border-primary bg-primary/5'
              : archivosDe(doc.clave).length
                ? 'border-emerald-200 bg-emerald-50/40'
                : 'border-slate-200 bg-slate-50/50'"
            @dragover.prevent="editable && (dragOverClave = doc.clave)"
            @dragleave.prevent="dragOverClave = null"
            @drop.prevent="onDrop(doc, $event)"
          >
            <div class="flex flex-col sm:flex-row sm:items-start gap-4">
              <div class="size-12 rounded-2xl bg-white border border-slate-100 flex items-center justify-center shrink-0 text-primary">
                <span class="material-symbols-outlined text-2xl">{{ iconoDoc(doc) }}</span>
              </div>
              <div class="flex-1 min-w-0">
                <p class="font-bold text-sm text-slate-800">
                  {{ doc.etiqueta }}
                  <span v-if="doc.obligatorio" class="text-secondary">*</span>
                </p>
                <p class="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">
                  {{ (doc.mime || []).join(', ') }} · máx {{ doc.maxArchivos || 1 }} archivo(s)
                  <span v-if="doc.maxMb"> · hasta {{ doc.maxMb }} MB</span>
                </p>

                <div class="mt-3 space-y-2">
                  <div
                    v-for="arch in archivosDe(doc.clave)"
                    :key="arch.idArchivo"
                    class="flex items-center justify-between gap-2 bg-white rounded-xl px-3 py-2 border border-slate-100"
                  >
                    <a :href="getImageUrl(arch.url)" target="_blank" class="text-xs font-bold text-primary truncate flex items-center gap-2">
                      <span class="material-symbols-outlined text-base">description</span>
                      {{ arch.nombreOriginal || 'Archivo' }}
                    </a>
                    <button
                      v-if="editable"
                      type="button"
                      @click="eliminarArchivo(arch.idArchivo)"
                      class="text-secondary text-xs font-bold shrink-0"
                    >Quitar</button>
                  </div>
                </div>

                <label
                  v-if="editable"
                  class="mt-3 flex flex-col items-center justify-center gap-2 py-5 rounded-xl bg-white border border-slate-100 cursor-pointer hover:border-primary/40 hover:bg-primary/5 transition-colors"
                >
                  <span class="material-symbols-outlined text-primary text-3xl">cloud_upload</span>
                  <span class="text-[11px] font-black uppercase tracking-widest text-slate-600">
                    Arrastra aquí o haz clic para subir
                  </span>
                  <input
                    type="file"
                    class="hidden"
                    :accept="acceptFor(doc)"
                    :multiple="(doc.maxArchivos || 1) > 1"
                    @change="(e) => onFileInput(doc, e)"
                  />
                </label>
              </div>
            </div>
          </div>
        </section>

        <div class="flex flex-col sm:flex-row justify-between gap-3">
          <button
            type="button"
            @click="paso = 1"
            class="px-5 py-3 bg-slate-100 text-slate-700 rounded-xl text-xs font-black uppercase tracking-widest"
          >
            <span class="material-symbols-outlined text-sm align-middle mr-1">arrow_back</span>
            Volver a datos
          </button>
          <button
            v-if="editable"
            type="button"
            @click="enviar"
            :disabled="sending"
            class="px-8 py-3 bg-primary text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-primary/20 disabled:opacity-50"
          >
            {{ sending ? 'Enviando…' : 'Enviar inscripción' }}
          </button>
        </div>

        <div v-if="!editable && insc.estado === 'PENDIENTE'" class="rounded-2xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-900 font-medium">
          Inscripción en revisión por el administrador.
        </div>
        <div v-else-if="!editable && insc.estado === 'APROBADO'" class="rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-sm text-emerald-900 font-medium">
          Inscripción aprobada.
          <span v-if="insc.participante || insc.participantePareja">
            Participantes:
            <b>{{ insc.participante?.nombre || '—' }}</b> (Chacha)
            · <b>{{ insc.participantePareja?.nombre || '—' }}</b> (Warmi).
          </span>
        </div>
        <div v-else-if="!editable && insc.estado === 'RECHAZADO'" class="rounded-2xl border border-red-100 bg-red-50 p-4 text-sm text-red-900 font-medium">
          Inscripción rechazada.{{ insc.observacionAdmin ? ` Motivo: ${insc.observacionAdmin}` : '' }}
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import Swal from 'sweetalert2'
import api from '../services/api'
import { getImageUrl } from '../utils/url'

const loading = ref(true)
const saving = ref(false)
const sending = ref(false)
const insc = ref(null)
const sinFase = ref(false)
const mensajeSinFase = ref('')
const fraternidadNoAprobada = ref(false)
const mensajeBloqueo = ref('')
const herencia = ref(null)
const formDatos = ref({})
const paso = ref(1)
const dragOverClave = ref(null)

const steps = [
  { n: 1, label: 'Datos pareja' },
  { n: 2, label: 'Documentos' },
]

const requisitos = computed(() => insc.value?.requisitos || { campos: [], documentos: [] })
const editable = computed(() => ['BORRADOR', 'OBSERVADO'].includes(insc.value?.estado))

const esCampoPareja = (clave) => /pareja/i.test(String(clave || ''))
const esCampoHeredado = (clave) =>
  ['facultadCarrera', 'facultadCarreraPareja', 'instanciaRepresentacion'].includes(String(clave || ''))

const camposPersona1 = computed(() =>
  (requisitos.value.campos || []).filter((c) => !esCampoPareja(c.clave) && !esCampoHeredado(c.clave)),
)
const camposPersona2 = computed(() =>
  (requisitos.value.campos || []).filter((c) => esCampoPareja(c.clave) && !esCampoHeredado(c.clave)),
)

const etiquetaPareja = (campo) => {
  const e = String(campo.etiqueta || '')
  return e.replace(/\s*\(segundo postulante\)/i, '').trim() || campo.etiqueta
}

const stepClass = (n) => {
  if (paso.value > n) return 'bg-emerald-500 border-emerald-100 text-white'
  if (paso.value === n) return 'bg-primary border-blue-100 text-white shadow-lg shadow-primary/30'
  return 'bg-white border-slate-200 text-slate-400'
}

const badgeEstado = (estado) => ({
  BORRADOR: 'bg-slate-100 text-slate-600 border-slate-200',
  PENDIENTE: 'bg-blue-50 text-blue-700 border-blue-100',
  OBSERVADO: 'bg-amber-50 text-amber-700 border-amber-100',
  APROBADO: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  RECHAZADO: 'bg-red-50 text-red-700 border-red-100',
}[estado] || 'bg-slate-100 text-slate-600 border-slate-200')

const archivosDe = (clave) => (insc.value?.archivos || []).filter((a) => a.claveDocumento === clave)

const acceptFor = (doc) => {
  const mime = doc.mime || []
  if (mime.some((m) => m.includes('pdf'))) return '.pdf,application/pdf'
  if (mime.some((m) => m.includes('jpeg') || m.includes('jpg'))) return '.jpg,.jpeg,image/jpeg'
  if (mime.some((m) => m.includes('mpeg') || m.includes('mp3'))) return '.mp3,audio/mpeg'
  return '*/*'
}

const iconoDoc = (doc) => {
  const mime = (doc.mime || []).join(' ')
  if (mime.includes('pdf')) return 'picture_as_pdf'
  if (mime.includes('image') || mime.includes('jpeg')) return 'image'
  if (mime.includes('audio') || mime.includes('mpeg')) return 'audio_file'
  return 'upload_file'
}

const aplicarRespuesta = (data) => {
  if (data?.fraternidadNoAprobada) {
    fraternidadNoAprobada.value = true
    mensajeBloqueo.value = data.mensaje || 'Tu fraternidad aún no está aprobada.'
    sinFase.value = false
    insc.value = null
    herencia.value = data.herencia || null
    return
  }
  if (data?.sinFase) {
    sinFase.value = true
    fraternidadNoAprobada.value = false
    mensajeSinFase.value = data.mensaje || 'No hay fase Chacha-Warmi.'
    insc.value = null
    herencia.value = data.herencia || null
    return
  }
  sinFase.value = false
  fraternidadNoAprobada.value = false
  insc.value = data
  herencia.value = data.herencia || null
  formDatos.value = { ...(data.datos || {}) }
}

const mensajeApi = (e, fallback) => {
  const msg = e?.response?.data?.message
  if (Array.isArray(msg)) return msg.join('. ')
  if (typeof msg === 'string' && msg.trim()) return msg
  return fallback
}

const cargar = async () => {
  loading.value = true
  try {
    const { data } = await api.get('/inscripciones-concurso/mi-chacha')
    aplicarRespuesta(data)
  } catch (e) {
    Swal.fire('Error', mensajeApi(e, 'No se pudo cargar la inscripción Chacha-Warmi'), 'error')
  } finally {
    loading.value = false
  }
}

const validarCamposPaso1 = () => {
  const faltantes = []
  for (const campo of [...camposPersona1.value, ...camposPersona2.value].filter((c) => c.obligatorio)) {
    const val = formDatos.value?.[campo.clave]
    if (val === undefined || val === null || String(val).trim() === '') {
      faltantes.push(campo.etiqueta)
    }
  }
  return faltantes
}

const guardarDatos = async ({ silent = false } = {}) => {
  saving.value = true
  try {
    const { data } = await api.put('/inscripciones-concurso/mi-chacha/datos', { datos: formDatos.value })
    aplicarRespuesta(data)
    if (!silent) {
      Swal.fire({ icon: 'success', title: 'Datos guardados', toast: true, position: 'top-end', timer: 2000, showConfirmButton: false })
    }
    return true
  } catch (e) {
    Swal.fire('Error', e.response?.data?.message || 'No se pudieron guardar los datos', 'error')
    return false
  } finally {
    saving.value = false
  }
}

const irPaso = (n) => {
  if (n === 2 && editable.value) {
    const faltantes = validarCamposPaso1()
    if (faltantes.length) {
      Swal.fire('Completa los datos', `Falta: ${faltantes.join(', ')}`, 'warning')
      return
    }
  }
  paso.value = n
}

const siguienteDesdeDatos = async () => {
  if (editable.value) {
    const faltantes = validarCamposPaso1()
    if (faltantes.length) {
      Swal.fire('Completa los datos', `Falta: ${faltantes.join(', ')}`, 'warning')
      return
    }
    const ok = await guardarDatos({ silent: true })
    if (!ok) return
  }
  paso.value = 2
}

const subirArchivoFile = async (doc, file) => {
  if (!file || !editable.value) return
  const fd = new FormData()
  fd.append('archivo', file)
  fd.append('claveDocumento', doc.clave)
  try {
    const { data } = await api.post('/inscripciones-concurso/mi-chacha/archivos', fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    aplicarRespuesta(data)
    Swal.fire({ icon: 'success', title: 'Archivo subido', toast: true, position: 'top-end', timer: 1800, showConfirmButton: false })
  } catch (err) {
    Swal.fire('Error', err.response?.data?.message || 'No se pudo subir el archivo', 'error')
  }
}

const onFileInput = async (doc, e) => {
  const files = Array.from(e.target.files || [])
  for (const file of files) {
    await subirArchivoFile(doc, file)
  }
  e.target.value = ''
}

const onDrop = async (doc, e) => {
  dragOverClave.value = null
  if (!editable.value) return
  const files = Array.from(e.dataTransfer?.files || [])
  for (const file of files) {
    await subirArchivoFile(doc, file)
  }
}

const eliminarArchivo = async (idArchivo) => {
  try {
    const { data } = await api.delete(`/inscripciones-concurso/mi-chacha/archivos/${idArchivo}`)
    aplicarRespuesta(data)
  } catch (e) {
    Swal.fire('Error', e.response?.data?.message || 'No se pudo eliminar', 'error')
  }
}

const enviar = async () => {
  const conf = await Swal.fire({
    title: '¿Enviar inscripción Chacha-Warmi?',
    text: 'Se enviará a revisión. La pareja Chacha y Warmi quedará visible en Concursantes y en calificación.',
    icon: 'question',
    showCancelButton: true,
    confirmButtonText: 'Sí, enviar',
    cancelButtonText: 'Cancelar',
    confirmButtonColor: '#003399',
  })
  if (!conf.isConfirmed) return
  sending.value = true
  try {
    await api.put('/inscripciones-concurso/mi-chacha/datos', { datos: formDatos.value })
    const { data } = await api.post('/inscripciones-concurso/mi-chacha/enviar')
    aplicarRespuesta(data)
    Swal.fire(
      'Enviado',
      'Inscripción en revisión. La pareja ya figura en Participantes Concursos (Chacha-Warmi).',
      'success',
    )
  } catch (e) {
    Swal.fire('Error', e.response?.data?.message || 'No se pudo enviar', 'error')
  } finally {
    sending.value = false
  }
}

onMounted(cargar)
</script>

<style scoped>
.lbl {
  display: block;
  font-size: 10px;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: #94a3b8;
  margin-bottom: 0.25rem;
}
.inp {
  width: 100%;
  padding: 0.75rem 1rem;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 0.75rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: #1e293b;
  outline: none;
}
.inp:focus { border-color: #003399; }
.inp:disabled { opacity: 0.6; }
.inp-locked {
  background: #f1f5f9;
  color: #475569;
  cursor: default;
}
</style>
