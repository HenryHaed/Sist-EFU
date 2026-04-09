<template>
  <div class="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
    <div class="bg-white rounded-2xl shadow-2xl w-full max-w-5xl h-[90vh] flex flex-col overflow-hidden">
      <!-- Header -->
      <div class="bg-slate-900 border-b border-slate-700 px-4 py-3 flex items-center justify-between shrink-0">
        <div class="flex items-center gap-3">
          <div class="size-8 bg-primary/20 rounded flex items-center justify-center">
            <span class="material-symbols-outlined text-primary text-xl">picture_as_pdf</span>
          </div>
          <div>
            <h3 class="text-white font-bold text-sm leading-tight transition-all max-w-[300px] sm:max-w-md truncate" :title="titulo">{{ titulo }}</h3>
            <p class="text-slate-400 text-[10px] uppercase tracking-widest font-bold">Visor de Documento</p>
          </div>
        </div>
        
        <div class="flex items-center gap-2">
          <button @click="descargar" class="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition-colors" title="Descargar">
            <span class="material-symbols-outlined">download</span>
          </button>
          <div class="w-px h-6 bg-slate-700 mx-1"></div>
          <button @click="$emit('cerrar')" class="text-slate-400 hover:text-secondary p-2 rounded-lg hover:bg-slate-800 transition-colors" title="Cerrar">
            <span class="material-symbols-outlined">close</span>
          </button>
        </div>
      </div>
      
      <!-- Visor -->
      <div class="flex-1 bg-slate-100 relative h-full w-full">
        <iframe 
          v-if="url"
          :src="url + '#toolbar=0&navpanes=0&scrollbar=1'" 
          class="w-full h-full border-0 absolute inset-0" 
          title="Visor PDF"
        ></iframe>
        
        <div v-else class="h-full flex flex-col items-center justify-center text-slate-400">
          <span class="material-symbols-outlined text-6xl mb-4 opacity-50">broken_image</span>
          <p class="font-bold">El archivo no está disponible</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  url: {
    type: String,
    required: true
  },
  titulo: {
    type: String,
    default: 'Documento PDF'
  }
})

const emit = defineEmits(['cerrar'])

const descargar = () => {
  const link = document.createElement('a')
  link.href = props.url
  link.target = '_blank'
  link.download = props.titulo + '.pdf'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}
</script>
