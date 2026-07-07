<template>
  <div class="dashboard-page max-w-5xl w-full">
    <!-- Header -->
    <div class="mb-10">
      <div class="flex items-center gap-2 mb-2">
        <span class="h-1 w-10 bg-secondary inline-block"></span>
        <h2 class="text-3xl font-black tracking-tight text-primary uppercase italic">Ajustes del Sistema</h2>
      </div>
      <p class="text-slate-500 text-sm font-medium">Configuración maestra de la Entrada Universitaria y personalización visual.</p>
    </div>

    <!-- Tabs -->
    <div class="flex gap-4 mb-8 border-b border-slate-200">
      <button 
        v-for="tab in tabs" :key="tab.id"
        @click="activeTab = tab.id"
        class="pb-4 px-2 text-sm font-black uppercase tracking-widest transition-all relative"
        :class="activeTab === tab.id ? 'text-primary' : 'text-slate-400 hover:text-slate-600'"
      >
        {{ tab.label }}
        <div v-if="activeTab === tab.id" class="absolute bottom-0 left-0 w-full h-1 bg-primary rounded-t-full"></div>
      </button>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="py-20 text-center">
       <span class="material-symbols-outlined animate-spin text-4xl text-primary">sync</span>
       <p class="text-xs font-bold uppercase text-slate-400 mt-4">Obteniendo configuración...</p>
    </div>

    <form v-else @submit.prevent="saveSettings" class="space-y-8 animate-in fade-in duration-500">
      
      <!-- TAB: GENERAL -->
      <div v-if="activeTab === 'general'" class="space-y-6">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <!-- Site Name -->
          <div class="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
             <label class="block text-[10px] font-black uppercase text-slate-400 tracking-widest mb-3">Nombre del Sitio / Entidad</label>
             <p class="text-[10px] text-slate-400 font-medium mb-2">Solo cambia el título de la pestaña del navegador.</p>
             <input 
              v-model="gestion.nombreSitio" 
              type="text" 
              placeholder="Ej. EFU UMSA 2026"
              class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none font-bold text-slate-700 transition-all"
             />
          </div>

          <!-- Gestion/Anio -->
          <div class="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
             <label class="block text-[10px] font-black uppercase text-slate-400 tracking-widest mb-3">Año / Gestión Activa</label>
             <input 
              v-model="gestion.anio" 
              type="number" 
              readonly
              class="w-full px-4 py-3 bg-slate-100 border border-slate-200 rounded-xl outline-none font-bold text-slate-500 cursor-not-allowed transition-all"
             />
          </div>
        </div>

        <!-- Tagline / Moto -->
        <div class="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
           <label class="block text-[10px] font-black uppercase text-slate-400 tracking-widest mb-3">Lema o Tenor oficial</label>
           <p class="text-[10px] text-slate-400 font-medium mb-2">Solo visible en la página de inicio (landing).</p>
           <textarea 
            v-model="gestion.lema" 
            rows="3"
            class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none font-medium text-slate-700 transition-all resize-none"
            placeholder="Ej. Tradición, Cultura y Orgullo Universitario..."
           ></textarea>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <!-- Title Principal -->
          <div class="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
             <label class="block text-[10px] font-black uppercase text-slate-400 tracking-widest mb-3">Título Banner Principal</label>
             <p class="text-[10px] text-slate-400 font-medium mb-2">Solo visible en el banner de la página de inicio.</p>
             <input 
              v-model="gestion.tituloPrincipal" 
              type="text" 
              placeholder="Ej. Entrada Folklórica Universitaria 2026"
              class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none font-bold text-slate-700 transition-all"
             />
          </div>

          <!-- Subtitle -->
          <div class="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
             <label class="block text-[10px] font-black uppercase text-slate-400 tracking-widest mb-3">Subtítulo Descriptivo</label>
             <p class="text-[10px] text-slate-400 font-medium mb-2">Solo visible en la página de inicio, debajo del banner.</p>
             <input 
              v-model="gestion.subtituloPrincipal" 
              type="text" 
              class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none font-bold text-slate-700 transition-all"
             />
          </div>
        </div>

        <!-- Toggles -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
             <div class="bg-slate-50 p-6 rounded-2xl border border-slate-200 flex items-center justify-between group">
                <div>
                   <p class="text-xs font-black text-slate-700 uppercase leading-none mb-1">Modo Mantenimiento</p>
                   <p class="text-[10px] text-slate-400 font-bold">Bloquea acceso público</p>
                </div>
                <input type="checkbox" v-model="gestion.modoMantenimiento" class="toggle-checkbox" />
             </div>
             
             <div class="bg-slate-50 p-6 rounded-2xl border border-slate-200 flex items-center justify-between">
                <div>
                   <p class="text-xs font-black text-slate-700 uppercase leading-none mb-1">Mostrar Ranking</p>
                   <p class="text-[10px] text-slate-400 font-bold">Público en dashboard public</p>
                </div>
                <input type="checkbox" v-model="gestion.mostrarRanking" class="toggle-checkbox" />
             </div>

             <div class="bg-blue-50 p-6 rounded-2xl border border-blue-100 flex items-center justify-between">
                <div>
                   <p class="text-xs font-black text-blue-800 uppercase leading-none mb-1">Gestión Activa</p>
                   <p class="text-[10px] text-blue-600 font-bold">Es la gestión vigente en el sistema</p>
                </div>
                <input type="checkbox" v-model="gestion.activa" class="toggle-checkbox primary" />
             </div>
        </div>
      </div>

      <!-- TAB: MULTIMEDIA -->
      <div v-if="activeTab === 'multimedia'" class="space-y-6">
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <!-- Logo Upload -->
          <div class="bg-white p-8 rounded-3xl border border-slate-200 flex flex-col items-center">
             <h4 class="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-6 w-full text-center">Logotipo Institucional</h4>
             <div class="size-32 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 flex items-center justify-center relative overflow-hidden group mb-6">
                <img v-if="previews.logo || gestion.urlLogo" :src="previews.logo || gestion.urlLogo" class="size-full object-contain p-2" />
                <span v-else class="material-symbols-outlined text-4xl text-slate-300">image</span>
                <label class="absolute inset-0 bg-primary/80 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white cursor-pointer">
                  <span class="material-symbols-outlined mb-1">upload</span>
                  <span class="text-[10px] font-black uppercase">Cambiar</span>
                  <input type="file" class="hidden" @change="handleFile($event, 'logo')" accept="image/*" />
                </label>
             </div>
             <p class="text-[9px] text-slate-400 font-bold uppercase">Formato recomendado: PNG Transparente</p>
          </div>

          <!-- Login Image Upload -->
          <div class="bg-white p-8 rounded-3xl border border-slate-200 flex flex-col items-center">
             <h4 class="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-6 w-full text-center">Imagen Lateral Login</h4>
             <div class="aspect-video w-full bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 flex items-center justify-center relative overflow-hidden group mb-4">
                <img v-if="previews.loginImg || gestion.urlImagenLogin" :src="previews.loginImg || gestion.urlImagenLogin" class="size-full object-cover" />
                <span v-else class="material-symbols-outlined text-4xl text-slate-300">wallpaper</span>
                <label class="absolute inset-0 bg-primary/80 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white cursor-pointer">
                  <span class="material-symbols-outlined mb-1">add_photo_alternate</span>
                  <span class="text-[10px] font-black uppercase">Subir Imagen</span>
                  <input type="file" class="hidden" @change="handleFile($event, 'loginImg')" accept="image/*" />
                </label>
             </div>
             <p class="text-[9px] text-slate-400 font-bold uppercase">Resolución: 1920x1080 (Cinemática)</p>
          </div>
        </div>

        <!-- Banner Upload -->
        <div class="bg-white p-8 rounded-3xl border border-slate-200">
             <h4 class="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-6">Banner Principal de Inicio (Héroe)</h4>
             <div class="w-full h-48 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 flex items-center justify-center relative overflow-hidden group">
                <img v-if="previews.banner || gestion.urlBanner" :src="previews.banner || gestion.urlBanner" class="size-full object-cover" />
                <div v-else class="text-center">
                    <span class="material-symbols-outlined text-4xl text-slate-200">image_large</span>
                    <p class="text-[10px] font-bold text-slate-300 mt-2 uppercase">No hay imagen cargada</p>
                </div>
                <label class="absolute inset-0 bg-primary/80 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white cursor-pointer">
                  <span class="material-symbols-outlined mb-2">upload_file</span>
                  <span class="text-xs font-black uppercase tracking-widest">Cambiar Banner Horizontal</span>
                  <input type="file" class="hidden" @change="handleFile($event, 'banner')" accept="image/*" />
                </label>
             </div>
        </div>
      </div>

      <!-- Footer Buttons (solo para general/multimedia) -->
      <div v-if="activeTab !== 'documentos'" class="flex justify-end gap-4 pt-6 border-t border-slate-100">
         <button 
          v-if="hasChanges"
          type="button" @click="resetChanges"
          class="px-6 py-3 text-sm font-black uppercase text-slate-400 hover:text-slate-600 transition-colors"
         >
           Descartar
         </button>
         <button 
          type="submit"
          :disabled="saving || !hasChanges"
          class="px-10 py-3 bg-primary text-white rounded-xl text-sm font-black shadow-xl shadow-primary/20 flex items-center gap-3 disabled:opacity-50 disabled:shadow-none hover:scale-102 transition-all active:scale-95"
         >
           <span v-if="saving" class="material-symbols-outlined animate-spin">progress_activity</span>
           <span v-else class="material-symbols-outlined">save</span>
           {{ saving ? 'GUARDANDO...' : 'GUARDAR AJUSTES' }}
         </button>
      </div>

      <!-- TAB: DOCUMENTOS -->
      <div v-if="activeTab === 'documentos'" class="space-y-6">
        <!-- Upload Form -->
        <div class="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div class="bg-primary px-6 py-4 flex items-center gap-3">
            <span class="material-symbols-outlined text-white">upload_file</span>
            <h3 class="text-sm font-black text-white uppercase tracking-widest">Subir Nuevo Documento</h3>
          </div>
          <div class="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Título del Documento *</label>
              <input v-model="docForm.titulo" type="text" placeholder="Ej. Reglamento EFU 2026"
                class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none font-bold text-slate-700 transition-all" />
            </div>
            <div>
              <label class="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Tipo de Documento</label>
              <select v-model="docForm.tipo"
                class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none font-bold text-slate-700 transition-all">
                <option value="reglamento_efu">Reglamento EFU</option>
                <option value="reglamento_afiche">Reglamento Afiche</option>
                <option value="reglamento_chachawarmi">Reglamento Chachawarmi</option>
                <option value="reglamento_fotografia">Reglamento Fotografía</option>
                <option value="circular">Circular Oficial</option>
                <option value="convocatoria">Convocatoria</option>
                <option value="otro">Otro Documento</option>
              </select>
            </div>
            <div class="md:col-span-2">
              <label class="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Descripción (opcional)</label>
              <input v-model="docForm.descripcion" type="text" placeholder="Breve descripción del contenido..."
                class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none font-medium text-slate-700 transition-all" />
            </div>
            <div class="md:col-span-2">
              <label class="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Archivo PDF *</label>
              <div
                class="w-full border-2 border-dashed rounded-2xl transition-all relative overflow-hidden group"
                :class="docForm.archivo ? 'border-primary bg-primary/5' : 'border-slate-300 hover:border-primary bg-slate-50'"
              >
                <input type="file" accept="application/pdf" @change="handleDocFile" class="absolute inset-0 opacity-0 cursor-pointer z-10 w-full h-full" />
                <div class="py-8 px-6 flex flex-col items-center justify-center text-center pointer-events-none">
                  <span class="material-symbols-outlined text-4xl mb-2" :class="docForm.archivo ? 'text-primary' : 'text-slate-300 group-hover:text-primary'">picture_as_pdf</span>
                  <p class="font-black text-sm" :class="docForm.archivo ? 'text-primary' : 'text-slate-400'">{{ docForm.archivo ? docForm.archivo.name : 'Arrastra o haz clic para seleccionar un PDF' }}</p>
                  <p class="text-[10px] text-slate-400 mt-1">Máximo 20MB</p>
                </div>
              </div>
            </div>
            <div class="md:col-span-2 flex justify-end">
              <button type="button" @click="subirDocumento"
                :disabled="uploadingDoc || !docForm.titulo || !docForm.archivo"
                class="px-8 py-3 bg-primary hover:bg-blue-900 text-white rounded-xl font-black text-sm flex items-center gap-2 shadow-lg shadow-primary/20 disabled:opacity-50 transition-all">
                <span v-if="uploadingDoc" class="material-symbols-outlined animate-spin text-sm">progress_activity</span>
                <span v-else class="material-symbols-outlined text-sm">upload</span>
                {{ uploadingDoc ? 'Subiendo...' : 'Publicar Documento' }}
              </button>
            </div>
          </div>
        </div>

        <!-- Lista de documentos existentes -->
        <div class="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div class="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h3 class="text-sm font-black text-slate-700 uppercase tracking-widest">Documentos Publicados</h3>
            <span class="text-[10px] font-black text-slate-400">{{ documentos.length }} documento{{ documentos.length !== 1 ? 's' : '' }}</span>
          </div>

          <div v-if="loadingDocs" class="py-12 text-center text-slate-400">
            <span class="material-symbols-outlined animate-spin text-3xl">progress_activity</span>
          </div>

          <div v-else-if="documentos.length === 0" class="py-12 text-center text-slate-400">
            <span class="material-symbols-outlined text-4xl mb-2 block opacity-30">folder_off</span>
            <p class="text-sm font-bold">No hay documentos publicados aún.</p>
          </div>

          <div v-else class="divide-y divide-slate-100">
            <div v-for="doc in documentos" :key="doc.idDocumento" class="flex items-center gap-4 px-6 py-4 hover:bg-slate-50 transition-colors">
              <div class="size-10 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
                <span class="material-symbols-outlined text-primary text-xl">picture_as_pdf</span>
              </div>
              <div class="flex-1 min-w-0">
                <p class="font-bold text-slate-800 text-sm truncate">{{ doc.titulo }}</p>
                <p class="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{{ etiquetaTipoDoc(doc.tipo) }}</p>
                <p v-if="doc.descripcion" class="text-xs text-slate-500 mt-0.5 truncate">{{ doc.descripcion }}</p>
              </div>
              <div class="flex items-center gap-2 shrink-0">
                <a :href="getImageUrl(doc.urlPdf)" target="_blank"
                  class="size-9 bg-slate-100 hover:bg-primary hover:text-white text-slate-600 rounded-xl flex items-center justify-center transition-all">
                  <span class="material-symbols-outlined text-[18px]">open_in_new</span>
                </a>
                <button type="button" @click="eliminarDocumento(doc)"
                  class="size-9 bg-slate-100 hover:bg-secondary hover:text-white text-slate-500 rounded-xl flex items-center justify-center transition-all">
                  <span class="material-symbols-outlined text-[18px]">delete</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- TAB: CRONOGRAMAS -->
      <div v-if="activeTab === 'cronogramas'" class="space-y-6">
        <div class="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div class="bg-indigo-600 px-6 py-4 flex items-center gap-3">
            <span class="material-symbols-outlined text-white">calendar_month</span>
            <h3 class="text-sm font-black text-white uppercase tracking-widest">Cronograma de Inscripciones por Categoría</h3>
          </div>
          
          <div class="p-6">
            <div class="bg-blue-50 border border-blue-100 p-4 rounded-2xl mb-6 flex items-start gap-3">
              <span class="material-symbols-outlined text-blue-600">info</span>
              <p class="text-xs text-blue-800 font-medium">
                Define los periodos de tiempo en los que los delegados podrán enviar sus solicitudes de inscripción. 
                Los usuarios solo verán el formulario si están dentro del rango de fechas establecido para su categoría.
              </p>
            </div>

            <div v-if="loadingCronos" class="py-12 text-center text-slate-400">
              <span class="material-symbols-outlined animate-spin text-3xl">progress_activity</span>
            </div>

            <div v-else class="space-y-4">
              <div v-for="cat in categorias" :key="cat.idCategoria" class="bg-slate-50 rounded-2xl border border-slate-200 p-6">
                <div class="flex flex-col md:flex-row md:items-center gap-6">
                  <div class="md:w-1/3">
                    <p class="text-sm font-black text-slate-800 uppercase tracking-tighter">{{ cat.nombre }}</p>
                    <p class="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Configurar periodo</p>
                  </div>
                  
                  <div class="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label class="block text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1 px-1">Fecha y Hora de Inicio</label>
                      <input 
                        type="datetime-local" 
                        v-model="cronoForms[cat.idCategoria].fechaInicio"
                        class="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl outline-none focus:border-primary font-bold text-xs"
                      />
                    </div>
                    <div>
                      <label class="block text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1 px-1">Fecha y Hora de Cierre</label>
                      <input 
                        type="datetime-local" 
                        v-model="cronoForms[cat.idCategoria].fechaFin"
                        class="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl outline-none focus:border-primary font-bold text-xs"
                      />
                    </div>
                  </div>

                  <div class="md:w-32 flex justify-end">
                    <button 
                      type="button"
                      @click="guardarCronograma(cat.idCategoria)"
                      :disabled="savingCrono === cat.idCategoria"
                      class="px-4 py-2 bg-slate-800 hover:bg-black text-white rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 transition-all disabled:opacity-50"
                    >
                      <span v-if="savingCrono === cat.idCategoria" class="material-symbols-outlined animate-spin text-xs">sync</span>
                      {{ savingCrono === cat.idCategoria ? '...' : 'Actualizar' }}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

    </form>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import api from '../services/api'
import Swal from 'sweetalert2'

const props = defineProps({
  gestionId: { type: Number, default: null }
})

const tabs = [
  { id: 'general', label: 'Información General' },
  { id: 'multimedia', label: 'Multimedia e Imagen' },
  { id: 'documentos', label: 'Reglamentos y Docs' },
  { id: 'cronogramas', label: 'Cronogramas' }
]
const activeTab = ref('general')
const loading = ref(true)
const saving = ref(false)
const hasChanges = ref(false)

const gestion = ref({
  idGestion: null,
  anio: new Date().getFullYear(),
  lema: '',
  activa: true,
  nombreSitio: '',
  tituloPrincipal: '',
  subtituloPrincipal: '',
  urlLogo: '',
  urlBanner: '',
  urlImagenLogin: '',
  modoMantenimiento: false,
  mostrarRanking: true,
  permiteInscripcionPublica: false
})

const files = ref({
  logo: null,
  banner: null,
  loginImg: null
})

const previews = ref({
  logo: null,
  banner: null,
  loginImg: null
})

import { getImageUrl } from '../utils/url'
import { applySiteTitle } from '../utils/siteTitle'

const loadGestion = async () => {
  loading.value = true
  try {
    const url = props.gestionId ? `/evaluaciones/gestiones/${props.gestionId}` : '/evaluaciones/gestion-activa'
    const { data } = await api.get(url)
    if (data) {
      // Transformamos las URLs relativas a absolutas para la previsualización
      data.urlLogo = getImageUrl(data.urlLogo)
      data.urlBanner = getImageUrl(data.urlBanner)
      data.urlImagenLogin = getImageUrl(data.urlImagenLogin)
      gestion.value = data
      applySiteTitle(data.nombreSitio)
    }
  } catch (err) {
    console.error('Error al cargar gestion:', err)
    Swal.fire('Error', 'No se pudo cargar la configuración.', 'error')
  } finally {
    loading.value = false
    hasChanges.value = false
  }
}

const handleFile = (event, type) => {
  const file = event.target.files[0]
  if (!file) return
  
  files.value[type] = file
  previews.value[type] = URL.createObjectURL(file)
  hasChanges.value = true
}

const resetChanges = () => {
  loadGestion()
  files.value = { logo: null, banner: null, loginImg: null }
  previews.value = { logo: null, banner: null, loginImg: null }
}

const saveSettings = async () => {
  saving.value = true
  try {
    const formData = new FormData()
    // Append JSON data as a string
    formData.append('data', JSON.stringify(gestion.value))
    
    // Append files
    if (files.value.logo) formData.append('logo', files.value.logo)
    if (files.value.banner) formData.append('banner', files.value.banner)
    if (files.value.loginImg) formData.append('loginImg', files.value.loginImg)

    await api.put(`/evaluaciones/gestiones/${gestion.value.idGestion}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })

    const Toast = Swal.mixin({
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      timer: 3000
    })
    Toast.fire({ icon: 'success', title: 'Ajustes guardados correctamente' })
    
    loadGestion() // Reload to get new image URLs
  } catch (err) {
    console.error('Error saving:', err)
    Swal.fire('Error', 'No se pudieron guardar los cambios.', 'error')
  } finally {
    saving.value = false
  }
}

// Watch for changes in text fields
watch(gestion, () => {
  if (!loading.value) hasChanges.value = true
}, { deep: true })

// ── Documentos de Gestión ─────────────────────────────────────────────────
const documentos = ref([])
const loadingDocs = ref(false)
const uploadingDoc = ref(false)
const docForm = ref({ titulo: '', tipo: 'reglamento_efu', descripcion: '', archivo: null })

const handleDocFile = (e) => {
  docForm.value.archivo = e.target.files[0] || null
}

const cargarDocumentos = async () => {
  loadingDocs.value = true
  try {
    const params = props.gestionId ? `?idGestion=${props.gestionId}` : ''
    const { data } = await api.get(`/evaluaciones/documentos-gestion${params}`)
    documentos.value = data || []
  } catch (e) {
    console.error('Error cargando documentos:', e)
  } finally {
    loadingDocs.value = false
  }
}

const subirDocumento = async () => {
  if (!docForm.value.titulo || !docForm.value.archivo) return
  uploadingDoc.value = true
  try {
    const fd = new FormData()
    fd.append('pdf', docForm.value.archivo)
    fd.append('titulo', docForm.value.titulo)
    fd.append('tipo', docForm.value.tipo)
    fd.append('descripcion', docForm.value.descripcion)
    const params = props.gestionId ? `?idGestion=${props.gestionId}` : ''
    await api.post(`/evaluaciones/documentos-gestion${params}`, fd, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    docForm.value = { titulo: '', tipo: 'reglamento_efu', descripcion: '', archivo: null }
    Swal.fire({ icon: 'success', title: 'Documento publicado', toast: true, position: 'top-end', timer: 2500, showConfirmButton: false })
    cargarDocumentos()
  } catch (e) {
    Swal.fire('Error', e.response?.data?.message || 'No se pudo subir el documento.', 'error')
  } finally {
    uploadingDoc.value = false
  }
}

const eliminarDocumento = async (doc) => {
  const result = await Swal.fire({
    title: '¿Eliminar documento?',
    text: `"${doc.titulo}" será eliminado permanentemente.`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#C8102E',
    cancelButtonText: 'Cancelar',
    confirmButtonText: 'Sí, eliminar'
  })
  if (!result.isConfirmed) return
  try {
    await api.delete(`/evaluaciones/documentos-gestion/${doc.idDocumento}`)
    cargarDocumentos()
    Swal.fire({ icon: 'success', title: 'Eliminado', toast: true, position: 'top-end', timer: 2000, showConfirmButton: false })
  } catch (e) {
    Swal.fire('Error', 'No se pudo eliminar el documento.', 'error')
  }
}

const etiquetaTipoDoc = (tipo) => {
  const map = {
    reglamento_efu: 'Reglamento EFU', reglamento_afiche: 'Reglamento Afiche',
    reglamento_chachawarmi: 'Reglamento Chachawarmi', reglamento_fotografia: 'Reglamento Fotografía',
    circular: 'Circular Oficial', convocatoria: 'Convocatoria', otro: 'Otro Documento'
  }
  return map[tipo] || 'Documento'
}

// Cargar documentos cuando se activa esa pestaña
watch(activeTab, (val) => { 
  if (val === 'documentos') cargarDocumentos()
  if (val === 'cronogramas') cargarDatosCronogramas()
})

// ── Cronogramas ───────────────────────────────────────────────────────────
const categorias = ref([])
const cronoForms = ref({})
const loadingCronos = ref(false)
const savingCrono = ref(null)

const cargarDatosCronogramas = async () => {
  loadingCronos.value = true
  try {
    // 1. Cargar Categorías
    const { data: cats } = await api.get('/categorias')
    categorias.value = cats

    // Inicializar formularios
    cats.forEach(c => {
      cronoForms.value[c.idCategoria] = { fechaInicio: '', fechaFin: '' }
    })

    // 2. Cargar Cronogramas existentes para esta gestión
    const { data: cronos } = await api.get(`/inscripciones/cronogramas/${gestion.value.idGestion}`)
    
    cronos.forEach(c => {
      if (cronoForms.value[c.categoria.idCategoria]) {
        // Formatear para datetime-local (YYYY-MM-DDThh:mm)
        const format = (dateStr) => {
          if (!dateStr) return ''
          const d = new Date(dateStr)
          return d.toISOString().slice(0, 16)
        }
        cronoForms.value[c.categoria.idCategoria].fechaInicio = format(c.fechaInicio)
        cronoForms.value[c.categoria.idCategoria].fechaFin = format(c.fechaFin)
      }
    })
  } catch (e) {
    console.error('Error cargando datos cronograma:', e)
  } finally {
    loadingCronos.value = false
  }
}

const guardarCronograma = async (idCategoria) => {
  const form = cronoForms.value[idCategoria]
  if (!form.fechaInicio || !form.fechaFin) {
    Swal.fire({ icon: 'warning', title: 'Campos requeridos', text: 'Debes definir ambas fechas.', toast: true, position: 'top-end', timer: 2000, showConfirmButton: false })
    return
  }

  savingCrono.value = idCategoria
  try {
    await api.post('/inscripciones/cronogramas', {
      idGestion: gestion.value.idGestion,
      idCategoria: idCategoria,
      fechaInicio: form.fechaInicio,
      fechaFin: form.fechaFin
    })
    Swal.fire({ icon: 'success', title: 'Cronograma actualizado', toast: true, position: 'top-end', timer: 2500, showConfirmButton: false })
  } catch (e) {
    console.error('Error al guardar cronograma:', e)
    Swal.fire('Error', 'No se pudo guardar el cronograma.', 'error')
  } finally {
    savingCrono.value = null
  }
}

onMounted(loadGestion)
</script>

<style scoped>
.toggle-checkbox {
  appearance: none;
  width: 44px;
  height: 24px;
  background: #cbd5e1;
  border-radius: 20px;
  position: relative;
  cursor: pointer;
  transition: all 0.3s;
}
.toggle-checkbox:checked {
  background: var(--checked-bg, #ef4444); /* secondary color default */
}
.toggle-checkbox.primary:checked {
  background: #003399;
}
.toggle-checkbox::before {
  content: '';
  position: absolute;
  width: 18px;
  height: 18px;
  background: white;
  border-radius: 50%;
  top: 3px;
  left: 3px;
  transition: all 0.3s;
}
.toggle-checkbox:checked::before {
  left: 23px;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
.animate-in {
  animation: fadeIn 0.4s ease-out forwards;
}

.scale-102:hover {
  transform: scale(1.02);
}
</style>
