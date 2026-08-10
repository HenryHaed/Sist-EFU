<template>
  <div class="dashboard-page max-w-4xl">
    <div class="mb-6">
      <h2 class="dashboard-page-title text-primary">Mi inscripción al concurso</h2>
      <p class="text-slate-500 text-sm font-medium mt-1">
        Completa los datos y documentos solicitados para
        <span class="font-bold text-slate-700">{{ insc?.fase?.nombre || 'tu concurso' }}</span>.
      </p>
    </div>

    <div v-if="loading" class="py-20 text-center text-slate-400">
      <span class="material-symbols-outlined animate-spin text-4xl">progress_activity</span>
    </div>

    <template v-else-if="insc">
      <div class="mb-6 flex flex-wrap items-center gap-3">
        <span
          class="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border"
          :class="badgeEstado(insc.estado)"
        >{{ insc.estado }}</span>
        <span v-if="insc.fraternidad" class="text-xs font-bold text-slate-500">
          Fraternidad: {{ insc.fraternidad.nombre }}
        </span>
      </div>

      <div
        v-if="insc.estado === 'OBSERVADO' && insc.observacionAdmin"
        class="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900"
      >
        <p class="font-black text-[10px] uppercase tracking-widest mb-1">Observación del administrador</p>
        {{ insc.observacionAdmin }}
      </div>

      <div class="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-6 mb-6">
        <h3 class="text-sm font-black uppercase tracking-widest text-slate-700">Datos solicitados</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div v-for="campo in requisitos.campos" :key="campo.clave" :class="campo.tipo === 'textarea' ? 'md:col-span-2' : ''">
            <label class="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
              {{ campo.etiqueta }}
              <span v-if="campo.obligatorio" class="text-secondary">*</span>
            </label>
            <textarea
              v-if="campo.tipo === 'textarea'"
              v-model="formDatos[campo.clave]"
              :disabled="!editable"
              rows="3"
              class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 outline-none focus:border-primary disabled:opacity-60"
            />
            <select
              v-else-if="campo.tipo === 'select'"
              v-model="formDatos[campo.clave]"
              :disabled="!editable"
              class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 outline-none focus:border-primary disabled:opacity-60"
            >
              <option value="">Seleccionar…</option>
              <option v-for="op in (campo.opciones || [])" :key="op" :value="op">{{ op }}</option>
            </select>
            <input
              v-else
              v-model="formDatos[campo.clave]"
              :type="campo.tipo === 'email' ? 'email' : campo.tipo === 'tel' ? 'tel' : 'text'"
              :disabled="!editable"
              class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 outline-none focus:border-primary disabled:opacity-60"
            />
          </div>
        </div>
        <div v-if="editable" class="flex justify-end">
          <button
            type="button"
            @click="guardarDatos"
            :disabled="saving"
            class="px-5 py-2.5 bg-slate-800 text-white rounded-xl text-xs font-black uppercase tracking-widest disabled:opacity-50"
          >
            {{ saving ? 'Guardando…' : 'Guardar datos' }}
          </button>
        </div>
      </div>

      <div class="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-4 mb-6">
        <h3 class="text-sm font-black uppercase tracking-widest text-slate-700">Documentos</h3>
        <div v-for="doc in requisitos.documentos" :key="doc.clave" class="border border-slate-100 rounded-2xl p-4">
          <div class="flex items-start justify-between gap-3 mb-3">
            <div>
              <p class="font-bold text-sm text-slate-800">
                {{ doc.etiqueta }}
                <span v-if="doc.obligatorio" class="text-secondary">*</span>
              </p>
              <p class="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">
                {{ (doc.mime || []).join(', ') }} · máx {{ doc.maxArchivos || 1 }} archivo(s)
              </p>
            </div>
          </div>
          <div class="space-y-2 mb-3">
            <div
              v-for="arch in archivosDe(doc.clave)"
              :key="arch.idArchivo"
              class="flex items-center justify-between gap-2 bg-slate-50 rounded-xl px-3 py-2"
            >
              <a :href="getImageUrl(arch.url)" target="_blank" class="text-xs font-bold text-primary truncate">
                {{ arch.nombreOriginal || 'Archivo' }}
              </a>
              <button
                v-if="editable"
                type="button"
                @click="eliminarArchivo(arch.idArchivo)"
                class="text-secondary text-xs font-bold"
              >Quitar</button>
            </div>
          </div>
          <input
            v-if="editable"
            type="file"
            :accept="acceptFor(doc)"
            @change="(e) => subirArchivo(doc.clave, e)"
            class="text-xs w-full"
          />
        </div>
      </div>

      <div v-if="editable" class="flex justify-end">
        <button
          type="button"
          @click="enviar"
          :disabled="sending"
          class="px-8 py-3 bg-primary text-white rounded-xl text-sm font-black uppercase tracking-widest shadow-lg shadow-primary/20 disabled:opacity-50"
        >
          {{ sending ? 'Enviando…' : 'Enviar inscripción' }}
        </button>
      </div>

      <div v-else-if="insc.estado === 'PENDIENTE'" class="rounded-2xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-900 font-medium">
        Tu inscripción está en revisión. Te notificaremos si hay observaciones.
      </div>
      <div v-else-if="insc.estado === 'APROBADO'" class="rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-sm text-emerald-900 font-medium">
        Inscripción aprobada. Ya figuras como participante del concurso.
      </div>
      <div v-else-if="insc.estado === 'RECHAZADO'" class="rounded-2xl border border-red-100 bg-red-50 p-4 text-sm text-red-900 font-medium">
        Inscripción rechazada.{{ insc.observacionAdmin ? ` Motivo: ${insc.observacionAdmin}` : '' }}
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
const formDatos = ref({})

const requisitos = computed(() => insc.value?.requisitos || { campos: [], documentos: [] })
const editable = computed(() => ['BORRADOR', 'OBSERVADO'].includes(insc.value?.estado))

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

const cargar = async () => {
  loading.value = true
  try {
    const { data } = await api.get('/inscripciones-concurso/mi')
    insc.value = data
    formDatos.value = { ...(data.datos || {}) }
  } catch (e) {
    Swal.fire('Error', e.response?.data?.message || 'No se pudo cargar la inscripción', 'error')
  } finally {
    loading.value = false
  }
}

const guardarDatos = async () => {
  saving.value = true
  try {
    const { data } = await api.put('/inscripciones-concurso/mi/datos', { datos: formDatos.value })
    insc.value = data
    formDatos.value = { ...(data.datos || {}) }
    Swal.fire({ icon: 'success', title: 'Datos guardados', toast: true, position: 'top-end', timer: 2000, showConfirmButton: false })
  } catch (e) {
    Swal.fire('Error', e.response?.data?.message || 'No se pudieron guardar los datos', 'error')
  } finally {
    saving.value = false
  }
}

const subirArchivo = async (claveDocumento, e) => {
  const file = e.target.files?.[0]
  if (!file) return
  const fd = new FormData()
  fd.append('archivo', file)
  fd.append('claveDocumento', claveDocumento)
  try {
    await api.post('/inscripciones-concurso/mi/archivos', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
    await cargar()
    Swal.fire({ icon: 'success', title: 'Archivo subido', toast: true, position: 'top-end', timer: 2000, showConfirmButton: false })
  } catch (err) {
    Swal.fire('Error', err.response?.data?.message || 'No se pudo subir el archivo', 'error')
  } finally {
    e.target.value = ''
  }
}

const eliminarArchivo = async (idArchivo) => {
  try {
    await api.delete(`/inscripciones-concurso/mi/archivos/${idArchivo}`)
    await cargar()
  } catch (e) {
    Swal.fire('Error', e.response?.data?.message || 'No se pudo eliminar', 'error')
  }
}

const enviar = async () => {
  const conf = await Swal.fire({
    title: '¿Enviar inscripción?',
    text: 'Se enviará a revisión del administrador.',
    icon: 'question',
    showCancelButton: true,
    confirmButtonText: 'Sí, enviar',
    cancelButtonText: 'Cancelar',
    confirmButtonColor: '#003399',
  })
  if (!conf.isConfirmed) return
  sending.value = true
  try {
    await api.put('/inscripciones-concurso/mi/datos', { datos: formDatos.value })
    const { data } = await api.post('/inscripciones-concurso/mi/enviar')
    insc.value = data
    Swal.fire('Enviado', 'Tu inscripción está en revisión.', 'success')
  } catch (e) {
    Swal.fire('Error', e.response?.data?.message || 'No se pudo enviar', 'error')
  } finally {
    sending.value = false
  }
}

onMounted(cargar)
</script>
