<template>
  <div class="dashboard-page max-w-5xl w-full">
    <!-- Header -->
    <div class="mb-10">
      <div class="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
        <div>
          <div class="flex items-center gap-2 mb-2">
            <span class="h-1 w-10 bg-secondary inline-block"></span>
            <h2 class="text-3xl font-black tracking-tight text-primary uppercase italic">Ajustes del Sistema</h2>
          </div>
          <p class="text-slate-500 text-sm font-medium">Configuración maestra de la Entrada Universitaria y personalización visual.</p>
        </div>

        <div v-if="gestionesDisponibles.length > 0" class="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm min-w-[240px]">
          <label class="block text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2">Gestión a configurar</label>
          <select
            v-model="selectedGestionId"
            @change="cambiarGestion"
            class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none font-bold text-slate-700 transition-all"
          >
            <option v-for="g in gestionesDisponibles" :key="g.idGestion" :value="g.idGestion">
              Gestión {{ g.anio }}{{ g.activa ? ' (Activa)' : '' }}
            </option>
          </select>
        </div>
      </div>
    </div>

    <!-- Tabs: scroll horizontal en móvil (Información → Cronogramas) -->
    <div class="-mx-1 mb-8">
      <div
        ref="tabsScrollEl"
        class="flex gap-1 sm:gap-2 overflow-x-auto overscroll-x-contain scroll-smooth snap-x snap-mandatory border-b border-slate-200 px-1 touch-pan-x
               [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
        role="tablist"
        aria-label="Secciones de ajustes"
      >
        <button
          v-for="tab in tabs"
          :key="tab.id"
          type="button"
          role="tab"
          :data-tab-id="tab.id"
          :aria-selected="activeTab === tab.id"
          @click="activeTab = tab.id"
          class="shrink-0 snap-start pb-3 sm:pb-4 px-3 sm:px-4 text-[10px] sm:text-xs font-black uppercase tracking-widest transition-all relative whitespace-nowrap"
          :class="activeTab === tab.id ? 'text-primary' : 'text-slate-400 hover:text-slate-600'"
        >
          {{ tab.label }}
          <div
            v-if="activeTab === tab.id"
            class="absolute bottom-0 left-0 w-full h-1 bg-primary rounded-t-full"
          ></div>
        </button>
      </div>
      <p class="mt-2 text-[9px] font-bold uppercase tracking-widest text-slate-300 sm:hidden px-1">
        Desliza horizontalmente →
      </p>
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
             <div class="bg-slate-50 p-6 rounded-2xl border border-slate-200 flex items-center justify-between">
                <div>
                   <p class="text-xs font-black text-slate-700 uppercase leading-none mb-1">Mostrar Ranking</p>
                   <p class="text-[10px] text-slate-400 font-bold">Público en el landing</p>
                </div>
                <input type="checkbox" v-model="gestion.mostrarRanking" class="toggle-checkbox" />
             </div>

             <div class="bg-slate-50 p-6 rounded-2xl border border-slate-200 flex items-center justify-between">
                <div>
                   <p class="text-xs font-black text-slate-700 uppercase leading-none mb-1">Mostrar Histórico</p>
                   <p class="text-[10px] text-slate-400 font-bold">Archivo histórico en el landing</p>
                </div>
                <input type="checkbox" v-model="gestion.mostrarHistorico" class="toggle-checkbox" />
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

        <!-- Fraternidades del landing -->
        <div class="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 space-y-6">
          <div>
            <h4 class="text-[10px] font-black uppercase tracking-widest text-slate-400">Fraternidades en el landing</h4>
            <p class="text-[10px] text-slate-400 font-medium mt-2">
              Edita el nombre, subtítulo, descripción e imagen de las 3 tarjetas de la sección Fraternidades en la página de inicio.
              La primera es la tarjeta grande destacada.
            </p>
          </div>

          <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div
              v-for="(card, index) in gestion.landingFraternidades"
              :key="index"
              class="border border-slate-200 rounded-2xl overflow-hidden bg-slate-50/50"
            >
              <div class="px-4 py-3 bg-slate-900 text-white flex items-center justify-between gap-2">
                <p class="text-[10px] font-black uppercase tracking-widest">
                  {{ index === 0 ? 'Tarjeta destacada' : `Tarjeta lateral ${index}` }}
                </p>
                <span class="text-[9px] font-bold text-white/60">#{{ index + 1 }}</span>
              </div>

              <div class="p-4 space-y-4">
                <div class="aspect-[4/3] bg-slate-100 rounded-xl border-2 border-dashed border-slate-200 relative overflow-hidden group">
                  <img
                    v-if="previews[`landingFrat${index}`] || card.urlImagen"
                    :src="previews[`landingFrat${index}`] || card.urlImagen"
                    class="size-full object-cover"
                    :alt="card.titulo || `Fraternidad ${index + 1}`"
                  />
                  <div v-else class="size-full flex flex-col items-center justify-center text-slate-300">
                    <span class="material-symbols-outlined text-3xl">groups</span>
                    <p class="text-[9px] font-bold uppercase mt-1">Sin imagen</p>
                  </div>
                  <label class="absolute inset-0 bg-primary/80 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white cursor-pointer">
                    <span class="material-symbols-outlined mb-1">upload</span>
                    <span class="text-[10px] font-black uppercase">Cambiar imagen</span>
                    <input type="file" class="hidden" @change="handleLandingFratFile($event, index)" accept="image/*" />
                  </label>
                </div>

                <div>
                  <label class="block text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Nombre / danza</label>
                  <input
                    v-model="card.titulo"
                    type="text"
                    maxlength="120"
                    placeholder="Ej. CAPORALES"
                    class="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none font-bold text-slate-700 text-sm"
                  />
                </div>

                <div>
                  <label class="block text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Subtítulo / facultad</label>
                  <input
                    v-model="card.subtitulo"
                    type="text"
                    maxlength="120"
                    placeholder="Ej. INGENIERÍA"
                    class="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none font-bold text-slate-700 text-sm"
                  />
                </div>

                <div v-if="index === 0">
                  <label class="block text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Descripción</label>
                  <textarea
                    v-model="card.descripcion"
                    rows="3"
                    maxlength="500"
                    placeholder="Texto breve bajo el nombre en la tarjeta grande..."
                    class="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none font-medium text-slate-700 text-sm resize-none"
                  ></textarea>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Footer Buttons (solo para general/multimedia) -->
      <div
        v-if="activeTab === 'general' || activeTab === 'multimedia'"
        class="sticky bottom-0 z-20 -mx-2 sm:mx-0 mt-6 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))] px-2 sm:px-0
               border-t border-slate-100 bg-gradient-to-t from-slate-50 via-slate-50/95 to-slate-50/80 backdrop-blur-sm
               sm:static sm:bg-transparent sm:backdrop-blur-none sm:from-transparent sm:via-transparent sm:to-transparent sm:pb-0"
      >
        <div class="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 sm:gap-4">
          <button
            v-if="hasChanges"
            type="button"
            @click="resetChanges"
            class="w-full sm:w-auto px-6 py-3.5 sm:py-3 text-xs sm:text-sm font-black uppercase tracking-widest
                   text-slate-500 hover:text-slate-700 bg-white sm:bg-transparent border border-slate-200 sm:border-0
                   rounded-xl transition-colors active:scale-[0.98]"
          >
            Descartar
          </button>
          <button
            type="submit"
            :disabled="saving || !hasChanges"
            class="w-full sm:w-auto px-6 sm:px-10 py-3.5 sm:py-3 bg-primary text-white rounded-xl text-xs sm:text-sm font-black
                   shadow-xl shadow-primary/20 flex items-center justify-center gap-2 sm:gap-3
                   disabled:opacity-50 disabled:shadow-none hover:scale-[1.02] transition-all active:scale-95"
          >
            <span v-if="saving" class="material-symbols-outlined animate-spin text-lg">progress_activity</span>
            <span v-else class="material-symbols-outlined text-lg">save</span>
            <span class="sm:hidden">{{ saving ? 'Guardando…' : 'Guardar' }}</span>
            <span class="hidden sm:inline">{{ saving ? 'GUARDANDO...' : 'GUARDAR AJUSTES' }}</span>
          </button>
        </div>
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
      
      <!-- TAB: DEFINIR CRONOGRAMA -->
      <div v-if="activeTab === 'cronogramas'" class="space-y-6 animate-in fade-in duration-500">
        <div class="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div class="bg-primary px-6 py-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div class="flex items-center gap-3">
              <span class="material-symbols-outlined text-white text-2xl">calendar_month</span>
              <div>
                <h3 class="text-sm font-black text-white uppercase tracking-widest">Definir Cronograma</h3>
                <p class="text-[10px] text-white/80 font-bold uppercase tracking-wider mt-0.5">
                  Gestión {{ gestion.anio }} — Inscripciones por categoría
                </p>
              </div>
            </div>
            <button
              type="button"
              @click="guardarTodosCronogramas"
              :disabled="savingAllCronos || categorias.length === 0 || loadingCronos"
              class="px-5 py-2.5 bg-secondary hover:bg-red-700 text-white rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              <span v-if="savingAllCronos" class="material-symbols-outlined animate-spin text-sm">sync</span>
              <span v-else class="material-symbols-outlined text-sm">save</span>
              {{ savingAllCronos ? 'Guardando...' : 'Guardar todo' }}
            </button>
          </div>
          
          <div class="p-6">
            <div class="bg-blue-50 border border-blue-100 p-4 rounded-2xl mb-6 flex items-start gap-3">
              <span class="material-symbols-outlined text-primary shrink-0">info</span>
              <p class="text-xs text-blue-900 font-medium leading-relaxed">
                Establece las fechas de apertura y cierre de inscripciones para cada categoría.
                Los delegados solo podrán enviar solicitudes dentro del periodo definido para su categoría.
              </p>
            </div>

            <div v-if="loadingCronos" class="py-12 text-center text-slate-400">
              <span class="material-symbols-outlined animate-spin text-3xl">progress_activity</span>
              <p class="text-xs font-bold uppercase tracking-widest mt-3">Cargando cronograma...</p>
            </div>

            <div v-else-if="categorias.length === 0" class="py-14 text-center">
              <span class="material-symbols-outlined text-5xl text-slate-200 mb-3">event_busy</span>
              <p class="text-sm font-black text-slate-600 uppercase tracking-tight">No se pudieron cargar las categorías</p>
              <p class="text-xs text-slate-400 font-medium mt-2 max-w-md mx-auto">
                Intenta recargar la pestaña o verifica que la gestión {{ gestion.anio }} esté correctamente configurada.
              </p>
            </div>

            <div v-else class="space-y-4">
              <div
                v-for="cat in categorias"
                :key="cat.idCategoria"
                class="bg-slate-50 rounded-2xl border border-slate-200 p-6 hover:border-primary/30 transition-colors"
              >
                <div class="flex flex-col lg:flex-row lg:items-end gap-6">
                  <div class="lg:w-1/4">
                    <div class="flex items-center gap-3 mb-2">
                      <span
                        class="size-10 rounded-xl flex items-center justify-center text-lg font-black text-white shadow-lg"
                        :class="badgeCategoria(cat.nombre).color"
                      >
                        {{ badgeCategoria(cat.nombre).letra }}
                      </span>
                      <div>
                        <p class="text-[10px] font-black text-secondary uppercase tracking-widest">Categoría</p>
                        <p class="text-base font-black text-slate-800 uppercase tracking-tight">{{ cat.nombre }}</p>
                      </div>
                    </div>
                    <p v-if="cat.descripcion" class="text-xs text-slate-500 mt-1 leading-relaxed">{{ cat.descripcion }}</p>
                  </div>
                  
                  <div class="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label class="block text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1.5 px-1">Apertura de inscripciones</label>
                      <input 
                        type="datetime-local" 
                        v-model="cronoForms[cat.idCategoria].fechaInicio"
                        class="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 font-bold text-sm text-slate-700"
                      />
                    </div>
                    <div>
                      <label class="block text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1.5 px-1">Cierre de inscripciones</label>
                      <input 
                        type="datetime-local" 
                        v-model="cronoForms[cat.idCategoria].fechaFin"
                        class="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 font-bold text-sm text-slate-700"
                      />
                    </div>
                  </div>

                  <div class="lg:w-36 flex justify-end">
                    <button 
                      type="button"
                      @click="guardarCronograma(cat.idCategoria)"
                      :disabled="savingCrono === cat.idCategoria"
                      class="w-full px-4 py-2.5 bg-primary hover:bg-blue-900 text-white rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                    >
                      <span v-if="savingCrono === cat.idCategoria" class="material-symbols-outlined animate-spin text-xs">sync</span>
                      <span v-else class="material-symbols-outlined text-xs">save</span>
                      {{ savingCrono === cat.idCategoria ? 'Guardando' : 'Guardar' }}
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
import { ref, onMounted, watch, nextTick } from 'vue'
import api from '../services/api'
import Swal from 'sweetalert2'
import { getImageUrl } from '../utils/url'
import { applySiteTitle } from '../utils/siteTitle'

const props = defineProps({
  gestionId: { type: Number, default: null },
  initialTab: { type: String, default: 'general' },
})

const tabs = [
  { id: 'general', label: 'Información General' },
  { id: 'multimedia', label: 'Multimedia e Imagen' },
  { id: 'documentos', label: 'Reglamentos y Docs' },
  { id: 'cronogramas', label: 'Definir Cronograma' }
]
const activeTab = ref(props.initialTab || 'general')
const tabsScrollEl = ref(null)

const scrollActiveTabIntoView = () => {
  const root = tabsScrollEl.value
  if (!root) return
  const btn = root.querySelector(`[data-tab-id="${activeTab.value}"]`)
  btn?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
}

const loading = ref(true)
const saving = ref(false)
const hasChanges = ref(false)
const gestionesDisponibles = ref([])
const selectedGestionId = ref(null)

const DEFAULT_LANDING_FRATERNIDADES = () => ([
  {
    titulo: 'CAPORALES',
    subtitulo: 'INGENIERÍA',
    descripcion: 'Energía, fuerza y saltos acrobáticos. Potencia pura en el recorrido.',
    urlImagen: '',
  },
  {
    titulo: 'MORENADA',
    subtitulo: 'DERECHO',
    descripcion: '',
    urlImagen: '',
  },
  {
    titulo: 'TINKUS',
    subtitulo: 'WISTUS',
    descripcion: '',
    urlImagen: '',
  },
])

const normalizeLandingFraternidades = (raw) => {
  const defaults = DEFAULT_LANDING_FRATERNIDADES()
  const list = Array.isArray(raw) ? raw : []
  return defaults.map((fallback, index) => {
    const item = list[index] || {}
    return {
      titulo: item.titulo || fallback.titulo,
      subtitulo: item.subtitulo || fallback.subtitulo,
      descripcion: item.descripcion ?? fallback.descripcion,
      urlImagen: item.urlImagen ? getImageUrl(item.urlImagen) : '',
    }
  })
}

const emptyLandingFiles = () => ({ landingFrat0: null, landingFrat1: null, landingFrat2: null })
const emptyLandingPreviews = () => ({ landingFrat0: null, landingFrat1: null, landingFrat2: null })

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
  mostrarHistorico: false,
  permiteInscripcionPublica: false,
  landingFraternidades: DEFAULT_LANDING_FRATERNIDADES(),
})

const files = ref({
  logo: null,
  banner: null,
  loginImg: null,
  ...emptyLandingFiles(),
})

const previews = ref({
  logo: null,
  banner: null,
  loginImg: null,
  ...emptyLandingPreviews(),
})

const loadGestion = async (idGestion = null) => {
  loading.value = true
  try {
    const url = idGestion ? `/evaluaciones/gestiones/${idGestion}` : '/evaluaciones/gestion-activa'
    const { data } = await api.get(url)
    if (data) {
      data.urlLogo = getImageUrl(data.urlLogo)
      data.urlBanner = getImageUrl(data.urlBanner)
      data.urlImagenLogin = getImageUrl(data.urlImagenLogin)
      data.landingFraternidades = normalizeLandingFraternidades(data.landingFraternidades)
      gestion.value = data
      selectedGestionId.value = data.idGestion
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

const cargarGestionesDisponibles = async () => {
  try {
    const { data } = await api.get('/evaluaciones/gestiones')
    gestionesDisponibles.value = data || []
  } catch (e) {
    console.error('Error cargando gestiones:', e)
  }
}

const cambiarGestion = async () => {
  if (!selectedGestionId.value) return
  files.value = { logo: null, banner: null, loginImg: null, ...emptyLandingFiles() }
  previews.value = { logo: null, banner: null, loginImg: null, ...emptyLandingPreviews() }
  await loadGestion(selectedGestionId.value)
  if (activeTab.value === 'documentos') cargarDocumentos()
  if (activeTab.value === 'cronogramas') cargarDatosCronogramas()
}

const handleFile = (event, type) => {
  const file = event.target.files[0]
  if (!file) return
  
  files.value[type] = file
  previews.value[type] = URL.createObjectURL(file)
  hasChanges.value = true
}

const handleLandingFratFile = (event, index) => {
  handleFile(event, `landingFrat${index}`)
}

const resetChanges = () => {
  loadGestion(selectedGestionId.value || props.gestionId || null)
  files.value = { logo: null, banner: null, loginImg: null, ...emptyLandingFiles() }
  previews.value = { logo: null, banner: null, loginImg: null, ...emptyLandingPreviews() }
}

const saveSettings = async () => {
  saving.value = true
  try {
    const toStoredAssetPath = (url) => {
      if (!url) return ''
      if (url.startsWith('/api') || url.startsWith('/uploads')) return url
      try {
        return new URL(url).pathname
      } catch {
        return url
      }
    }

    const formData = new FormData()
    const payload = {
      ...gestion.value,
      urlLogo: toStoredAssetPath(gestion.value.urlLogo),
      urlBanner: toStoredAssetPath(gestion.value.urlBanner),
      urlImagenLogin: toStoredAssetPath(gestion.value.urlImagenLogin),
      landingFraternidades: (gestion.value.landingFraternidades || []).map((card) => ({
        titulo: card.titulo || '',
        subtitulo: card.subtitulo || '',
        descripcion: card.descripcion || '',
        urlImagen: toStoredAssetPath(card.urlImagen),
      })),
    }
    formData.append('data', JSON.stringify(payload))
    
    if (files.value.logo) formData.append('logo', files.value.logo)
    if (files.value.banner) formData.append('banner', files.value.banner)
    if (files.value.loginImg) formData.append('loginImg', files.value.loginImg)
    if (files.value.landingFrat0) formData.append('landingFrat0', files.value.landingFrat0)
    if (files.value.landingFrat1) formData.append('landingFrat1', files.value.landingFrat1)
    if (files.value.landingFrat2) formData.append('landingFrat2', files.value.landingFrat2)

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
    
    files.value = { logo: null, banner: null, loginImg: null, ...emptyLandingFiles() }
    previews.value = { logo: null, banner: null, loginImg: null, ...emptyLandingPreviews() }
    await loadGestion(gestion.value.idGestion)
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

// Cargar documentos cuando se activa esa pestaña + centrar tab en scroll
watch(activeTab, (val) => {
  scrollActiveTabIntoView()
  if (val === 'documentos') cargarDocumentos()
  if (val === 'cronogramas') cargarDatosCronogramas()
})

// ── Cronogramas ───────────────────────────────────────────────────────────
const categorias = ref([])
const cronoForms = ref({})
const loadingCronos = ref(false)
const savingCrono = ref(null)
const savingAllCronos = ref(false)

const formatDatetimeLocal = (dateStr) => {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

const badgeCategoria = (nombre) => {
  const letra = (nombre || '').replace(/categor[ií]a\s*/i, '').trim().charAt(0).toUpperCase() || '?'
  const colores = {
    A: 'bg-primary shadow-primary/30',
    B: 'bg-amber-500 shadow-amber-500/30',
    C: 'bg-emerald-600 shadow-emerald-600/30',
  }
  return { letra, color: colores[letra] || 'bg-slate-500 shadow-slate-500/30' }
}

const cargarDatosCronogramas = async () => {
  if (!gestion.value.idGestion) return
  loadingCronos.value = true
  try {
    await api.post(`/categorias/asegurar/${gestion.value.idGestion}`)

    const { data: cats } = await api.get('/categorias', {
      params: { idGestion: gestion.value.idGestion },
    })
    categorias.value = cats

    const forms = {}
    cats.forEach((c) => {
      forms[c.idCategoria] = { fechaInicio: '', fechaFin: '' }
    })
    cronoForms.value = forms

    const { data: cronos } = await api.get(`/inscripciones/cronogramas/${gestion.value.idGestion}`)
    
    cronos.forEach((c) => {
      const idCat = c.categoria?.idCategoria
      if (idCat && cronoForms.value[idCat]) {
        cronoForms.value[idCat].fechaInicio = formatDatetimeLocal(c.fechaInicio)
        cronoForms.value[idCat].fechaFin = formatDatetimeLocal(c.fechaFin)
      }
    })
  } catch (e) {
    console.error('Error cargando datos cronograma:', e)
    Swal.fire('Error', 'No se pudo cargar el cronograma de inscripciones.', 'error')
  } finally {
    loadingCronos.value = false
  }
}

const validarFechasCronograma = (form) => {
  if (!form.fechaInicio || !form.fechaFin) {
    Swal.fire({ icon: 'warning', title: 'Campos requeridos', text: 'Debes definir apertura y cierre.', toast: true, position: 'top-end', timer: 2500, showConfirmButton: false })
    return false
  }
  if (new Date(form.fechaFin) <= new Date(form.fechaInicio)) {
    Swal.fire({ icon: 'warning', title: 'Fechas inválidas', text: 'El cierre debe ser posterior a la apertura.', toast: true, position: 'top-end', timer: 3000, showConfirmButton: false })
    return false
  }
  return true
}

const guardarCronograma = async (idCategoria) => {
  const form = cronoForms.value[idCategoria]
  if (!validarFechasCronograma(form)) return

  savingCrono.value = idCategoria
  try {
    await api.post('/inscripciones/cronogramas', {
      idGestion: gestion.value.idGestion,
      idCategoria,
      fechaInicio: form.fechaInicio,
      fechaFin: form.fechaFin,
    })
    Swal.fire({ icon: 'success', title: 'Cronograma guardado', toast: true, position: 'top-end', timer: 2500, showConfirmButton: false })
  } catch (e) {
    console.error('Error al guardar cronograma:', e)
    Swal.fire('Error', 'No se pudo guardar el cronograma.', 'error')
  } finally {
    savingCrono.value = null
  }
}

const guardarTodosCronogramas = async () => {
  const pendientes = categorias.value.filter((cat) => {
    const form = cronoForms.value[cat.idCategoria]
    return form?.fechaInicio && form?.fechaFin
  })

  if (pendientes.length === 0) {
    Swal.fire({ icon: 'info', title: 'Sin fechas', text: 'Completa al menos una categoría antes de guardar.', toast: true, position: 'top-end', timer: 2500, showConfirmButton: false })
    return
  }

  for (const cat of pendientes) {
    if (!validarFechasCronograma(cronoForms.value[cat.idCategoria])) return
  }

  savingAllCronos.value = true
  try {
    for (const cat of pendientes) {
      const form = cronoForms.value[cat.idCategoria]
      await api.post('/inscripciones/cronogramas', {
        idGestion: gestion.value.idGestion,
        idCategoria: cat.idCategoria,
        fechaInicio: form.fechaInicio,
        fechaFin: form.fechaFin,
      })
    }
    Swal.fire({ icon: 'success', title: 'Cronograma completo guardado', toast: true, position: 'top-end', timer: 2800, showConfirmButton: false })
  } catch (e) {
    console.error('Error al guardar cronogramas:', e)
    Swal.fire('Error', 'No se pudieron guardar todos los cronogramas.', 'error')
  } finally {
    savingAllCronos.value = false
  }
}

onMounted(async () => {
  await cargarGestionesDisponibles()
  await loadGestion(props.gestionId || null)
  if (props.initialTab === 'cronogramas') cargarDatosCronogramas()
  await nextTick()
  scrollActiveTabIntoView()
})

watch(() => props.gestionId, async (id) => {
  if (id) {
    selectedGestionId.value = id
    await loadGestion(id)
    if (activeTab.value === 'cronogramas') cargarDatosCronogramas()
  }
})
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
