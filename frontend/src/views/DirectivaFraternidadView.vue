<template>
  <div class="dashboard-page max-w-5xl w-full">
    <div class="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <button
          type="button"
          @click="volver"
          class="mb-3 flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-primary transition-colors"
        >
          <span class="material-symbols-outlined text-sm">arrow_back</span>
          Volver a Fraternidades
        </button>
        <div class="flex items-center gap-2 mb-1">
          <span class="h-1 w-8 bg-secondary inline-block"></span>
          <h2 class="dashboard-page-title tracking-tight text-primary uppercase italic">Directiva</h2>
        </div>
        <p v-if="directiva" class="text-slate-500 text-sm font-medium mt-1">
          {{ directiva.fraternidad.nombre }}
          <span class="text-slate-300 mx-1">·</span>
          {{ directiva.fraternidad.categoria || 'Sin categoría' }}
        </p>
      </div>

      <button
        v-if="directiva"
        type="button"
        @click="descargarPdf"
        :disabled="generandoPdf"
        class="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-primary text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-lg shadow-primary/20 hover:brightness-110 disabled:opacity-50 transition-all"
      >
        <span v-if="generandoPdf" class="material-symbols-outlined animate-spin text-lg">progress_activity</span>
        <span v-else class="material-symbols-outlined text-lg">picture_as_pdf</span>
        {{ generandoPdf ? 'Generando PDF...' : 'Generar reporte PDF' }}
      </button>
    </div>

    <div v-if="loading" class="py-24 flex flex-col items-center text-slate-400">
      <span class="material-symbols-outlined animate-spin text-5xl text-primary mb-4">progress_activity</span>
      <p class="text-xs font-black uppercase tracking-widest">Cargando directiva...</p>
    </div>

    <div v-else-if="error" class="py-16 px-8 text-center bg-white rounded-3xl border border-slate-200 shadow-sm">
      <span class="material-symbols-outlined text-5xl text-slate-300 mb-4">groups_off</span>
      <h3 class="text-lg font-black text-slate-600 uppercase mb-2">Sin directiva registrada</h3>
      <p class="text-sm text-slate-500 max-w-md mx-auto mb-6">{{ error }}</p>
      <button type="button" @click="volver" class="px-6 py-3 bg-slate-800 text-white rounded-xl font-black text-xs uppercase tracking-widest">
        Volver al listado
      </button>
    </div>

    <template v-else-if="directiva">
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div class="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <p class="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Instancia</p>
          <p class="text-sm font-bold text-slate-800">{{ directiva.solicitud.instancia }}</p>
        </div>
        <div class="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <p class="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Gestión</p>
          <p class="text-sm font-bold text-slate-800">{{ directiva.fraternidad.gestionAnio || '—' }}</p>
        </div>
        <div class="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <p class="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Solicitud</p>
          <p class="text-sm font-bold text-slate-800">#{{ directiva.solicitud.idSolicitud }}</p>
        </div>
      </div>

      <div class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div class="px-6 py-4 bg-slate-50 border-b border-slate-100">
          <h3 class="text-[10px] font-black uppercase tracking-widest text-primary">Integrantes de la directiva</h3>
          <p class="text-[11px] text-slate-500 mt-1">{{ directiva.miembros.length }} cargo(s) registrado(s) desde la inscripción aprobada.</p>
        </div>

        <div class="hidden md:block overflow-x-auto">
          <table class="w-full text-left">
            <thead>
              <tr class="bg-white border-b border-slate-100">
                <th class="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400">Cargo</th>
                <th class="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400">Nombre</th>
                <th class="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400">CI</th>
                <th class="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400">Celular</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-50">
              <tr v-for="m in directiva.miembros" :key="m.prefix" class="hover:bg-slate-50/50">
                <td class="px-6 py-4">
                  <span class="text-[10px] font-black uppercase tracking-wider text-primary">{{ m.cargo }}</span>
                </td>
                <td class="px-6 py-4 text-sm font-bold text-slate-800">{{ m.nombre || '—' }}</td>
                <td class="px-6 py-4 text-sm font-medium text-slate-600">{{ m.ci || '—' }}</td>
                <td class="px-6 py-4 text-sm font-medium text-slate-600">{{ m.celular || '—' }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="md:hidden p-4 space-y-3">
          <div
            v-for="m in directiva.miembros"
            :key="m.prefix + '_m'"
            class="rounded-2xl border border-slate-100 bg-slate-50 p-4"
          >
            <p class="text-[9px] font-black uppercase tracking-widest text-primary mb-2">{{ m.cargo }}</p>
            <p class="text-sm font-black text-slate-800 mb-2">{{ m.nombre || '—' }}</p>
            <div class="flex flex-wrap gap-3 text-[11px] text-slate-500">
              <span><strong class="text-slate-400">CI:</strong> {{ m.ci || '—' }}</span>
              <span v-if="m.celular"><strong class="text-slate-400">Cel:</strong> {{ m.celular }}</span>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import api from '../services/api'
import { notify } from '../utils/notify'

const props = defineProps({
  idFraternidad: {
    type: [Number, String],
    required: true,
  },
})

const router = useRouter()
const loading = ref(true)
const generandoPdf = ref(false)
const directiva = ref(null)
const error = ref('')

const cargarDirectiva = async () => {
  if (!props.idFraternidad) {
    error.value = 'No se indicó la fraternidad.'
    loading.value = false
    return
  }

  loading.value = true
  error.value = ''
  directiva.value = null

  try {
    const { data } = await api.get(`/fraternidades/${props.idFraternidad}/directiva`)
    directiva.value = data
  } catch (e) {
    error.value = e.response?.data?.message || 'No se pudo cargar la directiva de esta fraternidad.'
  } finally {
    loading.value = false
  }
}

const volver = () => {
  router.push({ query: { v: 'fraternidades_crud' } })
}

const descargarPdf = async () => {
  if (!props.idFraternidad || generandoPdf.value) return
  generandoPdf.value = true
  try {
    const { data } = await api.get(`/fraternidades/${props.idFraternidad}/directiva/pdf`, {
      responseType: 'blob',
    })
    const nombre = directiva.value?.fraternidad?.nombre?.replace(/[^a-zA-Z0-9_-]/g, '_') || 'fraternidad'
    const url = URL.createObjectURL(data)
    const link = document.createElement('a')
    link.href = url
    link.download = `Directiva_${nombre}.pdf`
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
    notify.success('PDF generado', 'El reporte de directiva se descargó correctamente.')
  } catch (e) {
    notify.error('Error', 'No se pudo generar el PDF de la directiva.')
  } finally {
    generandoPdf.value = false
  }
}

watch(() => props.idFraternidad, cargarDirectiva)
onMounted(cargarDirectiva)
</script>
