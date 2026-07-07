<template>
  <div class="bg-white font-display text-slate-900 h-[100dvh] flex flex-col overflow-hidden">
    <main class="flex-grow flex flex-col md:flex-row min-h-0 overflow-hidden">

      <!-- Hero: solo visible en desktop -->
      <div class="hidden md:flex md:w-1/2 lg:w-3/5 hero-image relative items-end p-8 lg:p-12 min-h-0">
        <div class="relative z-10 w-full">
          <h2 class="text-white text-4xl lg:text-5xl font-black italic uppercase tracking-tighter leading-none mb-4">
            Tradición y <br />Excelencia
          </h2>
          <div class="w-16 h-1 bg-secondary mb-4"></div>
          <p class="text-white/80 max-w-sm font-medium text-base">
            La Entrada Folclórica Universitaria de la UMSA es patrimonio cultural vivo que celebra nuestra identidad nacional.
          </p>
        </div>
      </div>

      <!-- Panel de formulario (único contenido en móvil) -->
      <div class="w-full md:w-1/2 lg:w-2/5 relative flex flex-col min-h-0 flex-1 overflow-hidden">
        <div class="absolute inset-0 aguayo-pattern pointer-events-none"></div>

        <div class="relative z-10 flex flex-col flex-1 min-h-0 overflow-y-auto custom-scrollbar">
          <div class="flex flex-col flex-1 justify-center w-full max-w-sm mx-auto px-5 sm:px-6 md:px-8 lg:px-10 py-6 sm:py-8 md:py-10">

            <!-- Brand -->
            <div class="text-center mb-4 sm:mb-5 md:mb-8">
              <h1 class="font-black italic tracking-tighter uppercase text-[2.75rem] sm:text-5xl text-primary mb-1 leading-none">
                {{ siteInfo.nombreSitio || 'UMS' }}<span v-if="!siteInfo.nombreSitio" class="text-secondary">A</span>
              </h1>
              <p class="text-[10px] font-bold uppercase tracking-[0.25em] sm:tracking-[0.3em] text-slate-500 mt-1">
                {{ siteInfo.lema || 'Entrada Folclórica Universitaria' }}
              </p>
            </div>

            <!-- Título del paso -->
            <div class="mb-5 sm:mb-6">
              <h2 class="text-xl sm:text-2xl font-black italic tracking-tight text-slate-900">{{ title }}</h2>
              <p v-if="subtitle" class="text-slate-500 text-sm mt-1 leading-relaxed">{{ subtitle }}</p>
            </div>

            <!-- Contenido (formularios con transición) -->
            <slot />

            <!-- Pie del panel -->
            <div v-if="$slots.footer" class="mt-6 sm:mt-8">
              <slot name="footer" />
            </div>

            <div class="mt-6 sm:mt-8 pt-5 border-t border-slate-100 text-center space-y-4">
              <div class="flex items-center justify-center gap-2 text-slate-300">
                <span class="material-symbols-outlined text-sm">verified_user</span>
                <span class="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest">Conexión Segura SSL</span>
              </div>
              <router-link
                to="/"
                class="inline-flex items-center justify-center gap-2 text-base sm:text-lg font-black text-slate-500 hover:text-primary transition-colors py-2"
              >
                <span class="material-symbols-outlined text-xl sm:text-2xl">arrow_back</span>
                Volver al Inicio
              </router-link>
            </div>
          </div>
        </div>
      </div>
    </main>

    <footer class="shrink-0 w-full py-2.5 sm:py-3 px-4 sm:px-8 flex flex-col sm:flex-row justify-between items-center gap-2 bg-white border-t border-slate-100 relative z-20">
      <p class="text-[8px] sm:text-[9px] font-bold uppercase tracking-[0.15em] sm:tracking-[0.2em] text-slate-400 text-center sm:text-left">
        © 2026 UMSA — Entrada Folklórica Universitaria. La Paz, Bolivia.
      </p>
      <nav class="flex gap-3 sm:gap-4">
        <a class="text-[8px] sm:text-[9px] font-bold uppercase tracking-[0.15em] text-slate-400 hover:text-secondary transition-colors" href="#">Privacidad</a>
        <a class="text-[8px] sm:text-[9px] font-bold uppercase tracking-[0.15em] text-slate-400 hover:text-secondary transition-colors" href="#">Términos</a>
        <a class="text-[8px] sm:text-[9px] font-bold uppercase tracking-[0.15em] text-slate-400 hover:text-secondary transition-colors" href="#">Contacto</a>
      </nav>
    </footer>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { getImageUrl } from '../../utils/url'

const props = defineProps({
  siteInfo: { type: Object, default: () => ({}) },
  title: { type: String, required: true },
  subtitle: { type: String, default: '' },
  backgroundUrl: { type: String, default: '' },
})

const backgroundImg = computed(() => {
  const url = props.backgroundUrl || props.siteInfo?.urlImagenLogin
  const fullUrl = getImageUrl(url) || '/src/assets/img/login.png'
  return `url('${fullUrl}')`
})
</script>

<style scoped>
.font-display { font-family: 'Inter', 'Be Vietnam Pro', sans-serif; }

.hero-image {
  background-image:
    linear-gradient(rgba(0,0,0,0.1), rgba(0,0,0,0.8)),
    v-bind('backgroundImg');
  background-size: contain;
  background-position: bottom;
  background-repeat: no-repeat;
  background-color: #000;
}

.aguayo-pattern {
  background-image: url('https://lh3.googleusercontent.com/aida/ADBb0ugTBfTZK7Ym1Cw92mVBwjbOEfHhi-w52DUNFT0g86pem7fJjAwUtC4Vus9t2im8owYdyQ3KRC4S0Xz_suUcrEQBzF7r9J858AUDbBQv8DVIo_6lme4yLEEfdudjUaZHOTuj6iOH6Y10bLIUXfiED52A3S1eqH_qqnaO2G2DLw4SF_F73lcMRnTMoYCv7Y6sTeQ1H7eBkDl03zZbKx4f9sIlfl5uiALXTy07WKwQshKgXauMxPwpOPVHoOQUHm8bwzFbtXGHjw_luA');
  background-repeat: repeat;
  background-size: 200px;
  opacity: 0.04;
}
</style>
