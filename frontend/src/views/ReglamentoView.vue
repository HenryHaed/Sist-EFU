<template>
  <div class="min-h-full bg-slate-50 font-display flex flex-col">

    <!-- ===== HEADER ===== -->
    <header class="sticky top-0 z-30 bg-white border-b border-slate-200 shadow-sm">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between gap-3">
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
                <!-- Badge visibilidad (solo visible para admins) -->
                <span
                  v-if="esAdmin"
                  class="inline-flex items-center gap-0.5 text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-full mt-1"
                  :class="doc.esPublico
                    ? (docActivo?.idDocumento === doc.idDocumento ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-700')
                    : (docActivo?.idDocumento === doc.idDocumento ? 'bg-white/10 text-white/60' : 'bg-slate-100 text-slate-400')"
                >
                  <span class="material-symbols-outlined" style="font-size:9px">{{ doc.esPublico ? 'public' : 'lock' }}</span>
                  {{ doc.esPublico ? 'Público' : 'Solo sistema' }}
                </span>
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
          <h3 class="text-xl font-black text-slate-700 italic uppercase tracking-tighter">Sin documentos</h3>
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

  <!-- Modal de Aviso de Nuevos Comunicados/Reglamentos -->
  <v-dialog v-model="mostrarAvisoNuevoDoc" max-width="600" transition="dialog-bottom-transition" persistent>
    <v-card class="rounded-3xl overflow-hidden border-4 border-secondary">
      <v-card-title class="bg-secondary text-white d-flex align-center gap-3 pa-4 relative">
        <div class="d-flex align-center gap-2 font-black italic uppercase tracking-tighter">
          <span class="material-symbols-outlined animate-bounce">campaign</span>
          ¡Nuevo Comunicado Oficial!
        </div>
        <v-btn icon="close" variant="text" color="white" class="absolute right-2 top-2" @click="cerrarAvisoNuevoDoc"></v-btn>
      </v-card-title>
      
      <v-card-text class="pa-6 bg-slate-50 text-left">
        <div v-if="nuevoDocumento" class="flex flex-col gap-4">
          <div class="d-flex align-center justify-space-between gap-4">
            <span class="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full bg-emerald-100 text-emerald-800">
              <span class="material-symbols-outlined text-sm">picture_as_pdf</span>
              {{ etiquetaTipo(nuevoDocumento.tipo) }}
            </span>
            <span class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Publicado recientemente
            </span>
          </div>
          
          <h3 class="text-2xl font-black text-slate-900 italic uppercase leading-tight mt-2">
            {{ nuevoDocumento.titulo }}
          </h3>
          
          <p v-if="nuevoDocumento.descripcion" class="text-slate-600 font-medium text-sm leading-relaxed my-2">
            {{ nuevoDocumento.descripcion }}
          </p>
          
          <div class="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3 mt-2">
            <span class="material-symbols-outlined text-amber-500 shrink-0">info</span>
            <p class="text-xs text-amber-800 font-medium leading-relaxed">
              Este documento ha sido publicado recientemente por la Comisión Organizadora. Puedes abrirlo ahora o consultarlo en tu panel.
            </p>
          </div>
        </div>
      </v-card-text>

      <v-card-actions class="bg-white pa-4 border-t border-slate-100">
        <v-spacer></v-spacer>
        <v-btn
          color="slate-400"
          variant="outlined"
          rounded="pill"
          class="font-black px-6 text-slate-600 hover:bg-slate-50"
          @click="cerrarAvisoNuevoDoc"
        >
          Cerrar
        </v-btn>
        <v-btn
          v-if="nuevoDocumento"
          color="primary"
          variant="flat"
          rounded="pill"
          class="font-black px-6 bg-primary text-white"
          @click="verNuevoDoc"
        >
          <span class="material-symbols-outlined mr-1">visibility</span>
          Ver en el panel
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import api from '../services/api'
import { getImageUrl } from '../utils/url'
import { useAuthStore } from '../store/auth'

const auth = useAuthStore()
const esAdmin = computed(() =>
  ['superusuario', 'admin'].includes(auth.user?.rol?.nombre)
)

const documentos = ref([])
const docActivo = ref(null)
const loading = ref(true)
const mostrarAvisoNuevoDoc = ref(false)
const nuevoDocumento = ref(null)

const cargarDocumentos = async () => {
  loading.value = true
  try {
    const { data } = await api.get('/evaluaciones/documentos-gestion')
    documentos.value = data || []
    // Seleccionar el primero automáticamente
    if (documentos.value.length > 0) {
      docActivo.value = documentos.value[0]

      // Buscar el documento público más reciente
      const docsPublicos = documentos.value.filter(doc => doc.esPublico === true)
      if (docsPublicos.length > 0) {
        const docsSortedById = [...docsPublicos].sort((a, b) => b.idDocumento - a.idDocumento)
        const latestDoc = docsSortedById[0]
        const ultimoVistoId = localStorage.getItem('ultimo_doc_visto_id')

        if (latestDoc) {
          if (!ultimoVistoId) {
            // Si nunca ha entrado, mostrar si se creó hace poco (ej. menos de 3 días)
            const fechaCreacion = new Date(latestDoc.createdAt)
            const haceTresDias = new Date()
            haceTresDias.setDate(haceTresDias.getDate() - 3)
            if (fechaCreacion >= haceTresDias) {
              nuevoDocumento.value = latestDoc
              mostrarAvisoNuevoDoc.value = true
            } else {
              localStorage.setItem('ultimo_doc_visto_id', String(latestDoc.idDocumento))
            }
          } else if (latestDoc.idDocumento > parseInt(ultimoVistoId)) {
            nuevoDocumento.value = latestDoc
            mostrarAvisoNuevoDoc.value = true
          }
        }
      }
    }
  } catch (err) {
    console.error('Error al cargar documentos:', err)
    documentos.value = []
  } finally {
    loading.value = false
  }
}

const cerrarAvisoNuevoDoc = () => {
  mostrarAvisoNuevoDoc.value = false
  if (nuevoDocumento.value) {
    localStorage.setItem('ultimo_doc_visto_id', String(nuevoDocumento.value.idDocumento))
  }
}

const verNuevoDoc = () => {
  if (nuevoDocumento.value) {
    seleccionar(nuevoDocumento.value)
  }
  cerrarAvisoNuevoDoc()
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
