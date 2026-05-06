<template>
  <div class="min-h-screen bg-slate-50 font-display flex flex-col">

    <!-- ===== HEADER ===== -->
    <header class="sticky top-0 z-30 bg-white border-b border-slate-200 shadow-sm">
      <div class="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
        <div class="flex items-center gap-4">
          <div class="size-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
            <span class="material-symbols-outlined text-white text-xl">menu_book</span>
          </div>
          <div>
            <h1 class="text-xl font-black text-primary italic uppercase tracking-tighter leading-tight">Reglamentos EFU</h1>
            <p class="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Documentos Oficiales de la Gestión Activa</p>
          </div>
        </div>
        <!-- Contador de documentos -->
        <div v-if="documentos.length" class="hidden sm:flex items-center gap-2 bg-primary/5 border border-primary/20 px-4 py-2 rounded-full">
          <span class="material-symbols-outlined text-primary text-sm">description</span>
          <span class="text-xs font-black text-primary">{{ documentos.length }} documento{{ documentos.length !== 1 ? 's' : '' }}</span>
        </div>
      </div>
    </header>

    <!-- ===== MAIN CONTENT ===== -->
    <div class="flex-1 max-w-7xl mx-auto w-full px-4 md:px-6 py-6 md:py-8 flex flex-col lg:flex-row gap-6">

      <!-- Sidebar: Lista de documentos -->
      <aside class="w-full lg:w-80 shrink-0">
        <div class="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden sticky top-24">
          <div class="bg-primary px-6 py-4 flex items-center gap-3">
            <span class="material-symbols-outlined text-white text-xl">folder_open</span>
            <h2 class="text-sm font-black text-white uppercase tracking-widest">Índice de Documentos</h2>
          </div>

          <!-- Loading -->
          <div v-if="loading" class="flex flex-col items-center justify-center py-12 text-slate-300">
            <span class="material-symbols-outlined animate-spin text-4xl mb-3">progress_activity</span>
            <p class="text-xs font-bold uppercase tracking-widest">Cargando...</p>
          </div>

          <!-- Empty state -->
          <div v-else-if="documentos.length === 0" class="flex flex-col items-center justify-center py-12 px-6 text-center text-slate-400">
            <span class="material-symbols-outlined text-5xl mb-3 opacity-30">folder_off</span>
            <p class="text-sm font-bold">Sin documentos disponibles</p>
            <p class="text-xs mt-1 text-slate-300">El administrador aún no ha publicado reglamentos.</p>
          </div>

          <!-- Lista -->
          <nav v-else class="p-3 space-y-1 max-h-[70vh] overflow-y-auto custom-scrollbar">
            <button
              v-for="doc in documentos"
              :key="doc.idDocumento"
              @click="seleccionar(doc)"
              class="w-full text-left p-3 rounded-2xl transition-all group flex items-start gap-3"
              :class="docActivo?.idDocumento === doc.idDocumento
                ? 'bg-primary text-white shadow-lg shadow-primary/25'
                : 'hover:bg-slate-50 text-slate-700'"
            >
              <!-- Ícono tipo -->
              <div
                class="size-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 transition-colors"
                :class="docActivo?.idDocumento === doc.idDocumento ? 'bg-white/20' : 'bg-slate-100 group-hover:bg-primary/10'"
              >
                <span
                  class="material-symbols-outlined text-[18px] transition-colors"
                  :class="docActivo?.idDocumento === doc.idDocumento ? 'text-white' : 'text-primary'"
                >{{ iconoPorTipo(doc.tipo) }}</span>
              </div>
              <div class="min-w-0 flex-1">
                <p class="font-bold text-sm leading-tight truncate" :class="docActivo?.idDocumento === doc.idDocumento ? 'text-white' : 'text-slate-800'">
                  {{ doc.titulo }}
                </p>
                <p
                  class="text-[10px] font-black uppercase tracking-wider mt-0.5 truncate"
                  :class="docActivo?.idDocumento === doc.idDocumento ? 'text-white/60' : 'text-slate-400'"
                >{{ etiquetaTipo(doc.tipo) }}</p>
              </div>
              <!-- Indicador activo -->
              <span
                v-if="docActivo?.idDocumento === doc.idDocumento"
                class="material-symbols-outlined text-white/80 text-sm shrink-0 mt-1"
              >chevron_right</span>
            </button>
          </nav>
        </div>
      </aside>

      <!-- Área principal: Visor PDF -->
      <main class="flex-1 min-h-[600px] flex flex-col">

        <!-- Empty / no selection -->
        <div
          v-if="!docActivo && !loading"
          class="flex-1 flex flex-col items-center justify-center bg-white rounded-3xl border border-slate-200 shadow-sm text-center px-8 py-20"
        >
          <div class="size-24 bg-primary/5 rounded-3xl flex items-center justify-center mb-6 border border-primary/10">
            <span class="material-symbols-outlined text-5xl text-primary/30">menu_book</span>
          </div>
          <h3 class="text-2xl font-black text-slate-800 italic uppercase tracking-tighter">Selecciona un Reglamento</h3>
          <p class="text-slate-400 text-sm font-medium mt-2 max-w-sm">
            Elige un documento del panel izquierdo para leerlo aquí.
          </p>
        </div>

        <!-- Sin documentos -->
        <div
          v-else-if="documentos.length === 0 && !loading"
          class="flex-1 flex flex-col items-center justify-center bg-white rounded-3xl border border-slate-200 shadow-sm text-center px-8 py-20"
        >
          <div class="size-24 bg-slate-100 rounded-3xl flex items-center justify-center mb-6">
            <span class="material-symbols-outlined text-5xl text-slate-300">folder_off</span>
          </div>
          <h3 class="text-xl font-black text-slate-700 italic uppercase tracking-tighter">Sin Documentos</h3>
          <p class="text-slate-400 text-sm font-medium mt-2">Los reglamentos serán publicados próximamente.</p>
        </div>

        <!-- Visor PDF -->
        <div v-else-if="docActivo" class="flex-1 flex flex-col bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <!-- Doc header -->
          <div class="border-b border-slate-100 px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div class="flex items-center gap-3">
              <div class="size-10 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
                <span class="material-symbols-outlined text-primary text-xl">{{ iconoPorTipo(docActivo.tipo) }}</span>
              </div>
              <div>
                <h2 class="text-lg font-black text-slate-900 italic uppercase tracking-tighter leading-tight">{{ docActivo.titulo }}</h2>
                <p class="text-[10px] text-slate-400 font-black uppercase tracking-widest">{{ etiquetaTipo(docActivo.tipo) }}</p>
              </div>
            </div>
            <div class="flex items-center gap-2 shrink-0">
              <!-- Abrir en nueva pestaña -->
              <a
                :href="getImageUrl(docActivo.urlPdf)"
                target="_blank"
                class="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs transition-all"
              >
                <span class="material-symbols-outlined text-sm">open_in_new</span>
                <span class="hidden sm:inline">Abrir</span>
              </a>
              <!-- Descargar -->
              <a
                :href="getImageUrl(docActivo.urlPdf)"
                :download="docActivo.titulo + '.pdf'"
                class="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-blue-900 text-white rounded-xl font-bold text-xs transition-all shadow-md shadow-primary/20"
              >
                <span class="material-symbols-outlined text-sm">download</span>
                <span class="hidden sm:inline">Descargar</span>
              </a>
            </div>
          </div>

          <!-- Descripción si existe -->
          <div v-if="docActivo.descripcion" class="px-6 py-3 bg-amber-50 border-b border-amber-100 flex items-start gap-2">
            <span class="material-symbols-outlined text-amber-500 text-sm mt-0.5">info</span>
            <p class="text-xs text-amber-800 font-medium leading-relaxed">{{ docActivo.descripcion }}</p>
          </div>

          <!-- iFrame PDF -->
          <div class="flex-1 relative bg-slate-200" style="min-height: 600px;">
            <iframe
              :src="getImageUrl(docActivo.urlPdf) + '#toolbar=1&navpanes=0'"
              class="w-full h-full absolute inset-0"
              style="min-height: 600px; border: none;"
              :title="docActivo.titulo"
            ></iframe>
          </div>
        </div>

      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import api from '../services/api'
import { getImageUrl } from '../utils/url'

const documentos = ref([])
const docActivo = ref(null)
const loading = ref(true)

const cargarDocumentos = async () => {
  loading.value = true
  try {
    const { data } = await api.get('/evaluaciones/documentos-gestion')
    documentos.value = data || []
    // Seleccionar el primero automáticamente
    if (documentos.value.length > 0) {
      docActivo.value = documentos.value[0]
    }
  } catch (err) {
    console.error('Error al cargar documentos:', err)
    documentos.value = []
  } finally {
    loading.value = false
  }
}

const seleccionar = (doc) => {
  docActivo.value = doc
}

const iconoPorTipo = (tipo) => {
  const iconos = {
    reglamento_efu: 'gavel',
    reglamento_afiche: 'image',
    reglamento_chachawarmi: 'diversity_3',
    reglamento_fotografia: 'photo_camera',
    circular: 'mail',
    convocatoria: 'campaign',
    otro: 'description',
  }
  return iconos[tipo] || 'description'
}

const etiquetaTipo = (tipo) => {
  const etiquetas = {
    reglamento_efu: 'Reglamento EFU',
    reglamento_afiche: 'Reglamento Afiche',
    reglamento_chachawarmi: 'Reglamento Chachawarmi',
    reglamento_fotografia: 'Reglamento Fotografía',
    circular: 'Circular Oficial',
    convocatoria: 'Convocatoria',
    otro: 'Documento',
  }
  return etiquetas[tipo] || 'Documento'
}

onMounted(() => cargarDocumentos())
</script>

<style scoped>
.font-display { font-family: 'Inter', sans-serif; }
.custom-scrollbar { scrollbar-width: thin; scrollbar-color: #e2e8f0 transparent; }
.custom-scrollbar::-webkit-scrollbar { width: 4px; }
.custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 99px; }
</style>
