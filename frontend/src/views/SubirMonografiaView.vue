<template>
  <div class="dashboard-page max-w-3xl">
    <div class="mb-8 sm:mb-10 text-left">
      <div class="flex items-center gap-3 mb-2">
        <span class="h-6 sm:h-8 w-2 bg-secondary rounded-full shrink-0"></span>
        <h2 class="dashboard-page-title italic uppercase text-primary">Subir Monografía</h2>
      </div>
      <p class="text-slate-500 font-medium">
        Sube el documento PDF de la monografía de tu fraternidad. Solo puede existir un archivo por fraternidad.
      </p>
    </div>

    <div v-if="loading" class="py-24 flex flex-col items-center text-slate-400">
      <span class="material-symbols-outlined animate-spin text-5xl text-primary mb-4">sync</span>
      <p class="font-bold uppercase tracking-widest text-xs">Cargando...</p>
    </div>

    <div v-else-if="!fraternidad" class="bg-amber-50 border border-amber-200 rounded-2xl p-8 text-center">
      <span class="material-symbols-outlined text-5xl text-amber-500 mb-4">warning</span>
      <h3 class="text-lg font-black text-amber-800 uppercase italic mb-2">Sin fraternidad asignada</h3>
      <p class="text-amber-700 text-sm font-medium">
        Debes completar tu inscripción y tener una fraternidad vinculada antes de subir la monografía.
      </p>
    </div>

    <template v-else>
      <div class="bg-white rounded-2xl border border-slate-100 shadow-xl overflow-hidden mb-6">
        <div class="bg-slate-900 px-6 py-4 flex items-center gap-3">
          <span class="material-symbols-outlined text-secondary">groups</span>
          <div>
            <p class="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Fraternidad</p>
            <h3 class="text-white font-black italic uppercase">{{ fraternidad.nombre }}</h3>
          </div>
        </div>

        <div class="p-6 sm:p-8">
          <div v-if="monografia" class="mb-8 p-5 bg-emerald-50 border border-emerald-100 rounded-xl">
            <div class="flex items-start gap-4">
              <div class="size-12 bg-emerald-100 rounded-xl flex items-center justify-center shrink-0">
                <span class="material-symbols-outlined text-emerald-600 text-2xl">picture_as_pdf</span>
              </div>
              <div class="min-w-0 flex-1">
                <p class="text-[10px] font-black uppercase tracking-widest text-emerald-600 mb-1">Monografía actual</p>
                <p class="font-bold text-slate-800 truncate" :title="monografia.nombreArchivo">
                  {{ monografia.nombreArchivo || 'monografia.pdf' }}
                </p>
                <p class="text-xs text-slate-500 mt-1">
                  Subida el {{ formatFecha(monografia.fechaSubida) }}
                </p>
              </div>
              <button
                @click="abrirVisor"
                class="shrink-0 px-4 py-2 bg-primary text-white rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-blue-900 transition-colors"
              >
                Ver PDF
              </button>
            </div>
          </div>

          <div v-else class="mb-8 p-5 bg-slate-50 border border-dashed border-slate-200 rounded-xl text-center">
            <span class="material-symbols-outlined text-4xl text-slate-300 mb-2">upload_file</span>
            <p class="text-slate-500 font-medium text-sm">Aún no has subido la monografía de tu fraternidad.</p>
          </div>

          <div
            class="border-2 border-dashed rounded-2xl p-8 text-center transition-colors"
            :class="dragOver ? 'border-primary bg-primary/5' : 'border-slate-200 bg-slate-50/50'"
            @dragover.prevent="dragOver = true"
            @dragleave.prevent="dragOver = false"
            @drop.prevent="onDrop"
          >
            <span class="material-symbols-outlined text-5xl text-primary/40 mb-4">cloud_upload</span>
            <p class="font-black text-slate-700 uppercase text-sm mb-1">
              {{ monografia ? 'Reemplazar monografía' : 'Subir monografía' }}
            </p>
            <p class="text-slate-400 text-xs mb-4">Solo archivos PDF, máximo 20 MB</p>

            <label class="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl font-black uppercase text-[10px] tracking-widest cursor-pointer hover:bg-blue-900 transition-colors shadow-lg shadow-primary/20">
              <span class="material-symbols-outlined text-lg">folder_open</span>
              Seleccionar archivo
              <input type="file" accept=".pdf,application/pdf" class="hidden" @change="onFileSelect" />
            </label>

            <p v-if="archivoSeleccionado" class="mt-4 text-sm font-bold text-slate-600 truncate">
              {{ archivoSeleccionado.name }}
            </p>
          </div>

          <div class="mt-6 flex justify-end">
            <button
              @click="subir"
              :disabled="!archivoSeleccionado || uploading"
              class="px-8 py-4 bg-secondary text-white rounded-xl font-black uppercase text-[10px] tracking-widest shadow-lg shadow-secondary/20 hover:bg-red-800 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <span class="material-symbols-outlined text-lg" :class="{ 'animate-spin': uploading }">
                {{ uploading ? 'sync' : 'save' }}
              </span>
              {{ uploading ? 'Subiendo...' : (monografia ? 'Actualizar monografía' : 'Guardar monografía') }}
            </button>
          </div>
        </div>
      </div>
    </template>

    <PdfViewerModal
      v-if="visorAbierto && monografia"
      :url="getImageUrl(monografia.urlArchivo)"
      :titulo="`Monografía — ${fraternidad?.nombre || ''}`"
      @cerrar="visorAbierto = false"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '../store/auth'
import api from '../services/api'
import { notify } from '../utils/notify'
import { getImageUrl } from '../utils/url'
import PdfViewerModal from '../components/PdfViewerModal.vue'

const authStore = useAuthStore()
const loading = ref(true)
const uploading = ref(false)
const monografia = ref(null)
const archivoSeleccionado = ref(null)
const dragOver = ref(false)
const visorAbierto = ref(false)

const fraternidad = computed(() => authStore.user?.fraternidad || null)

const formatFecha = (fecha) => {
  if (!fecha) return ''
  return new Date(fecha).toLocaleDateString('es-BO', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const cargarMonografia = async () => {
  loading.value = true
  try {
    const res = await api.get('/monografias/mi-fraternidad')
    monografia.value = res.data || null
  } catch (error) {
    if (error.response?.status !== 400) {
      notify.error('Error', error.response?.data?.message || 'No se pudo cargar la monografía.')
    }
    monografia.value = null
  } finally {
    loading.value = false
  }
}

const setArchivo = (file) => {
  if (!file) return
  if (!file.name.toLowerCase().endsWith('.pdf')) {
    notify.warning('Formato inválido', 'Solo se permiten archivos PDF.')
    return
  }
  if (file.size > 20 * 1024 * 1024) {
    notify.warning('Archivo muy grande', 'El PDF no puede superar 20 MB.')
    return
  }
  archivoSeleccionado.value = file
}

const onFileSelect = (e) => {
  const file = e.target.files?.[0]
  setArchivo(file)
  e.target.value = ''
}

const onDrop = (e) => {
  dragOver.value = false
  setArchivo(e.dataTransfer.files?.[0])
}

const subir = async () => {
  if (!archivoSeleccionado.value) return
  uploading.value = true
  try {
    const formData = new FormData()
    formData.append('file', archivoSeleccionado.value)
    const res = await api.post('/monografias/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    monografia.value = res.data
    archivoSeleccionado.value = null
    notify.success('Monografía guardada', 'El documento se subió correctamente.')
  } catch (error) {
    notify.error('Error', error.response?.data?.message || 'No se pudo subir la monografía.')
  } finally {
    uploading.value = false
  }
}

const abrirVisor = () => {
  visorAbierto.value = true
}

onMounted(cargarMonografia)
</script>
