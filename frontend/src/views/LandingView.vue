<template>
  <div class="flex h-[100dvh] w-full relative bg-white md:bg-[#fdfdfd] font-display overflow-hidden">

    <!-- Sidebar (Desktop) -->
    <aside class="hidden md:flex w-72 flex-shrink-0 bg-white border-r border-slate-200 flex-col justify-between py-8 px-6 sticky top-0 h-screen z-50 shadow-sm">
      <div class="flex flex-col gap-10">
        <!-- Logo -->
        <div class="sidebar-brand flex flex-col gap-4">
          <img 
            :src="siteInfo.urlLogo || defaultLogo" 
            alt="Logo Institucional" 
            class="h-16 w-auto object-contain sidebar-brand-logo"
          />
          <div>
            <h1 class="text-3xl font-black leading-none italic tracking-tight text-primary sidebar-brand-umsa">
              UMS<span class="text-secondary">A</span>
            </h1>
            <p class="mt-3 text-base font-black uppercase tracking-[0.14em] text-slate-900 leading-snug sidebar-brand-subtitle">
              Entrada Folklórica Universitaria
            </p>
          </div>
        </div>

        <!-- Nav Desktop -->
        <nav class="flex flex-col gap-2">
          <a @click.prevent="scrollTo('inicio')" href="#inicio"
            class="flex items-center gap-4 px-4 py-3 rounded-lg bg-primary text-white transition-all shadow-md shadow-primary/20 cursor-pointer">
            <span class="material-symbols-outlined">home</span>
            <p class="text-sm font-bold tracking-wide uppercase">Inicio</p>
          </a>
          <a @click.prevent="scrollTo('fraternidades')" href="#fraternidades"
            class="flex items-center gap-4 px-4 py-3 rounded-lg hover:bg-slate-50 transition-colors group cursor-pointer">
            <span class="material-symbols-outlined text-slate-400 group-hover:text-primary transition-colors">groups</span>
            <p class="text-sm font-medium tracking-wide uppercase text-slate-600 group-hover:text-primary transition-colors">Fraternidades</p>
          </a>
          <a @click.prevent="scrollTo('ruta')" href="#ruta"
            class="flex items-center gap-4 px-4 py-3 rounded-lg hover:bg-slate-50 transition-colors group cursor-pointer">
            <span class="material-symbols-outlined text-slate-400 group-hover:text-primary transition-colors">map</span>
            <p class="text-sm font-medium tracking-wide uppercase text-slate-600 group-hover:text-primary transition-colors">Recorrido</p>
          </a>
          <a @click.prevent="scrollTo('eventos')" href="#eventos"
            class="flex items-center gap-4 px-4 py-3 rounded-lg hover:bg-slate-50 transition-colors group cursor-pointer">
            <span class="material-symbols-outlined text-slate-400 group-hover:text-primary transition-colors">event</span>
            <p class="text-sm font-medium tracking-wide uppercase text-slate-600 group-hover:text-primary transition-colors">Eventos</p>
          </a>
          <a @click.prevent="scrollTo('estadisticas')" href="#estadisticas"
            class="flex items-center gap-4 px-4 py-3 rounded-lg hover:bg-slate-50 transition-colors group cursor-pointer">
            <span class="material-symbols-outlined text-slate-400 group-hover:text-primary transition-colors">leaderboard</span>
            <p class="text-sm font-medium tracking-wide uppercase text-slate-600 group-hover:text-primary transition-colors">Estadísticas</p>
          </a>
          <a
            v-if="mostrarHistoricoLanding"
            @click.prevent="scrollTo('historicos')"
            href="#historicos"
            class="flex items-center gap-4 px-4 py-3 rounded-lg hover:bg-slate-50 transition-colors group cursor-pointer"
          >
            <span class="material-symbols-outlined text-slate-400 group-hover:text-primary transition-colors">history</span>
            <p class="text-sm font-medium tracking-wide uppercase text-slate-600 group-hover:text-primary transition-colors">Histórico</p>
          </a>
        </nav>
      </div>

      <div class="mt-auto pt-8 border-t border-slate-100">
        <div class="flex items-center gap-3">
          <span class="material-symbols-outlined text-slate-400">info</span>
          <p class="text-xs text-slate-500 font-medium">2026</p>
        </div>
      </div>
    </aside>

    <!-- Bottom Nav (Mobile) -->
    <div class="md:hidden fixed inset-x-0 bottom-0 z-[100] bg-white border-t border-slate-100 pt-2 pb-[max(0.75rem,env(safe-area-inset-bottom))] px-4 shadow-[0_-8px_24px_rgba(15,23,42,0.06)]">
      <nav class="w-full max-w-md mx-auto bg-white border border-slate-200 h-[4.25rem] rounded-2xl shadow-lg flex items-center justify-around px-1">
      <button @click="scrollTo('inicio')" class="flex flex-col items-center justify-center gap-0.5 min-w-0 flex-1 py-1 text-slate-400 hover:text-primary transition-colors">
        <span class="material-symbols-outlined text-[22px]">home</span>
        <span class="text-[7px] font-black uppercase tracking-wide truncate w-full text-center">Inicio</span>
      </button>
      <button @click="scrollTo('fraternidades')" class="flex flex-col items-center justify-center gap-0.5 min-w-0 flex-1 py-1 text-slate-400 hover:text-primary transition-colors">
        <span class="material-symbols-outlined text-[22px]">groups</span>
        <span class="text-[7px] font-black uppercase tracking-wide truncate w-full text-center">Danzas</span>
      </button>
      <button @click="scrollTo('ruta')" class="flex flex-col items-center justify-center gap-0.5 min-w-0 flex-1 py-1 text-slate-400 hover:text-primary transition-colors">
        <span class="material-symbols-outlined text-[22px]">map</span>
        <span class="text-[7px] font-black uppercase tracking-wide truncate w-full text-center">Ruta</span>
      </button>
      <button @click="scrollTo('eventos')" class="flex flex-col items-center justify-center gap-0.5 min-w-0 flex-1 py-1 text-slate-400 hover:text-primary transition-colors">
        <span class="material-symbols-outlined text-[22px]">event</span>
        <span class="text-[7px] font-black uppercase tracking-wide truncate w-full text-center">Eventos</span>
      </button>
      <button @click="scrollTo('estadisticas')" class="flex flex-col items-center justify-center gap-0.5 min-w-0 flex-1 py-1 text-slate-400 hover:text-primary transition-colors">
        <span class="material-symbols-outlined text-[22px]">leaderboard</span>
        <span class="text-[7px] font-black uppercase tracking-wide truncate w-full text-center">Ranking</span>
      </button>
      <button
        v-if="mostrarHistoricoLanding"
        @click="scrollTo('historicos')"
        class="flex flex-col items-center justify-center gap-0.5 min-w-0 flex-1 py-1 text-slate-400 hover:text-primary transition-colors"
      >
        <span class="material-symbols-outlined text-[22px]">history</span>
        <span class="text-[7px] font-black uppercase tracking-wide truncate w-full text-center">Histórico</span>
      </button>
      </nav>
    </div>

    <!-- Main Content -->
    <main ref="mainRef" class="flex-1 relative h-full overflow-y-auto overflow-x-hidden bg-white md:bg-[#fdfdfd] scroll-smooth paper-texture pb-[calc(5.5rem+env(safe-area-inset-bottom))] md:pb-0">

      <!-- ===== HERO SECTION ===== -->
      <section class="relative flex flex-col md:min-h-screen" id="inicio">
        <!-- Background -->
        <div class="absolute inset-0 z-0 overflow-hidden">
          <div class="andean-dots absolute inset-0"></div>
          <!-- Hero Image: solo desktop -->
          <div
            class="hidden md:block absolute top-0 right-0 w-2/3 h-full bg-cover bg-center opacity-90 transition-all duration-1000 scale-105"
            :style="{ backgroundImage: `url('${heroBannerUrl}')`, clipPath: 'polygon(25% 0%, 100% 0%, 100% 100%, 0% 100%)' }"
          ></div>
          <!-- Móvil: acento decorativo sin imagen recortada -->
          <div class="md:hidden absolute top-0 right-0 w-full h-56 bg-gradient-to-bl from-primary/8 via-secondary/5 to-transparent pointer-events-none"></div>
          <div class="absolute inset-0 bg-gradient-to-b from-[#fdfdfd] via-[#fdfdfd]/95 to-[#fdfdfd]/80 md:bg-gradient-to-r md:from-[#fdfdfd] md:via-[#fdfdfd]/80 md:to-transparent"></div>
        </div>

        <!-- Content -->
        <div class="relative z-10 flex flex-col">
          <!-- Botón iniciar sesión (desktop, esquina superior derecha) -->
          <header class="hidden md:flex justify-end px-8 lg:px-12 pt-6 lg:pt-8 w-full shrink-0">
            <router-link
              to="/login"
              class="flex items-center gap-2 bg-secondary hover:bg-red-700 text-white px-7 py-3 rounded-full font-black tracking-widest uppercase text-sm transition-all shadow-lg shadow-red-200"
            >
              <span class="material-symbols-outlined text-base">login</span>
              Iniciar sesión
            </router-link>
          </header>

          <!-- Header móvil -->
          <header class="md:hidden flex items-center justify-between px-4 pt-4 pb-2">
            <div class="flex items-center gap-2.5 min-w-0">
              <img
                :src="siteInfo.urlLogo || defaultLogo"
                alt="Logo UMSA"
                class="h-10 w-auto object-contain shrink-0"
              />
              <p class="font-black italic text-primary text-sm leading-tight truncate">
                UMS<span class="text-secondary">A</span>
              </p>
            </div>
            <router-link
              to="/login"
              class="shrink-0 flex items-center gap-1.5 bg-primary text-white px-4 py-2 rounded-full font-black tracking-wider uppercase text-[10px] shadow-lg shadow-primary/20"
            >
              <span class="material-symbols-outlined text-base">login</span>
              Ingresar
            </router-link>
          </header>

          <!-- Hero Text -->
          <div class="flex items-start px-5 sm:px-6 md:px-12 lg:px-24 pt-6 pb-6 md:pt-12 md:pb-8 lg:pt-16">
            <div class="max-w-4xl relative w-full">
              <div class="flex flex-col gap-3 sm:gap-5 relative z-10">
                <span class="text-primary font-black tracking-[0.2em] sm:tracking-[0.25em] uppercase text-[10px] sm:text-xs md:text-base flex items-center gap-3 sm:gap-4">
                  <span class="w-8 sm:w-12 md:w-16 h-[2px] sm:h-[3px] bg-secondary shadow-sm"></span>
                  {{ siteInfo.lema || 'Patrimonio Cultural de Bolivia' }}
                </span>
                <h1
                  v-if="siteInfo.tituloPrincipal"
                  class="text-[2.1rem] leading-[0.95] sm:text-5xl md:text-7xl lg:text-8xl font-black italic tracking-tighter text-primary reveal reveal-left"
                >
                  {{ siteInfo.tituloPrincipal }}
                </h1>
                <h1
                  v-else
                  class="text-[2.1rem] leading-[0.9] sm:text-5xl md:text-8xl lg:text-9xl font-black italic tracking-tighter reveal reveal-left"
                >
                  <span class="text-slate-900">ENTRADA FOLKLÓRICA</span><br />
                  <span class="text-primary">UNIVERSITARIA</span><br />
                  <span class="text-primary">UMS</span><span class="text-secondary">A</span>
                </h1>
                <p class="text-sm sm:text-lg md:text-2xl text-slate-600 max-w-xl font-medium leading-relaxed mt-1 sm:mt-3 border-l-4 border-secondary pl-3 sm:pl-4 md:pl-6 reveal reveal-left">
                  {{ siteInfo.subtituloPrincipal || 'Vive la majestuosidad de nuestras danzas tradicionales en la mayor expresión folklórica universitaria.' }}
                </p>
                <div class="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3 sm:gap-4 md:gap-6 mt-3 sm:mt-5 md:mt-6 md:hidden">
                  <router-link
                    to="/login"
                    class="w-full sm:w-auto bg-primary text-white hover:bg-blue-900 px-8 py-3.5 sm:py-4 rounded-full font-black tracking-wider uppercase text-xs sm:text-sm transition-all shadow-xl shadow-primary/20 flex items-center justify-center gap-3 reveal reveal-right"
                  >
                    <span class="material-symbols-outlined text-base">login</span>
                    Iniciar sesión
                  </router-link>
                </div>
              </div>
            </div>
          </div>

          <!-- Stats Bar -->
          <div class="relative w-full border-t border-slate-100 bg-white/90 md:bg-white/80 backdrop-blur-md z-20 overflow-hidden mt-4 md:mt-6 shrink-0">
            <div class="marquee-container py-4 sm:py-6 md:py-8">
              <div class="marquee-content flex items-center gap-10 md:gap-16">
                <!-- Group 1 -->
                <div class="flex items-center gap-10 md:gap-16 shrink-0">
                  <div class="flex flex-col gap-1 shrink-0">
                    <span class="text-3xl md:text-4xl font-black italic text-primary">80+</span>
                    <span class="text-[10px] text-slate-500 font-bold uppercase tracking-widest text-[9px] md:text-[10px]">Fraternidades</span>
                  </div>
                  <div class="w-px h-10 bg-slate-200 self-center shrink-0"></div>
                  <div class="flex flex-col gap-1 shrink-0">
                    <span class="text-3xl md:text-4xl font-black italic text-primary">+10k</span>
                    <span class="text-xs text-slate-500 font-bold uppercase tracking-widest text-[9px] md:text-[10px]">Bailarines</span>
                  </div>
                  <div class="w-px h-10 bg-slate-200 self-center shrink-0"></div>
                  <div class="flex flex-col gap-1 shrink-0">
                    <span class="text-3xl md:text-4xl font-black italic text-secondary">{{ aniosTradicion }}</span>
                    <span class="text-xs text-slate-500 font-bold uppercase tracking-widest text-[9px] md:text-[10px]">Años Tradición</span>
                  </div>
                  <div class="w-px h-10 bg-slate-200 self-center shrink-0"></div>
                </div>
                <!-- Duplicate for Seamless Loop -->
                <div class="flex items-center gap-10 md:gap-16 shrink-0">
                  <div class="flex flex-col gap-1 shrink-0">
                    <span class="text-3xl md:text-4xl font-black italic text-primary">80+</span>
                    <span class="text-[10px] text-slate-500 font-bold uppercase tracking-widest text-[9px] md:text-[10px]">Fraternidades</span>
                  </div>
                  <div class="w-px h-10 bg-slate-200 self-center shrink-0"></div>
                  <div class="flex flex-col gap-1 shrink-0">
                    <span class="text-3xl md:text-4xl font-black italic text-primary">+10k</span>
                    <span class="text-xs text-slate-500 font-bold uppercase tracking-widest text-[9px] md:text-[10px]">Bailarines</span>
                  </div>
                  <div class="w-px h-10 bg-slate-200 self-center shrink-0"></div>
                  <div class="flex flex-col gap-1 shrink-0">
                    <span class="text-3xl md:text-4xl font-black italic text-secondary">{{ aniosTradicion }}</span>
                    <span class="text-xs text-slate-500 font-bold uppercase tracking-widest text-[9px] md:text-[10px]">Años Tradición</span>
                  </div>
                  <div class="w-px h-10 bg-slate-200 self-center shrink-0"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- ===== FRATERNIDADES ===== -->
      <section class="py-12 sm:py-16 md:py-24 px-5 sm:px-6 md:px-12 lg:px-24 bg-white" id="fraternidades">
        <div class="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 md:mb-16 gap-6 reveal reveal-left">
          <div>
            <h2 class="text-3xl md:text-5xl font-black text-slate-900 italic uppercase tracking-tighter">FRATERNIDADES</h2>
            <div class="h-1.5 w-24 md:w-32 bg-primary mt-4"></div>
          </div>
          <button 
            @click="mostrarRanking = true"
            class="text-primary font-black flex items-center gap-2 hover:text-secondary transition-all tracking-[0.2em] uppercase text-[10px] md:text-xs"
          >
            Ver todas <span class="material-symbols-outlined text-sm">arrow_forward</span>
          </button>
        </div>
        <div class="grid grid-cols-12 gap-6 md:gap-8">
          <!-- Featured card -->
          <div class="col-span-12 md:col-span-7 relative h-[280px] sm:h-[340px] md:h-auto min-h-[280px] group overflow-hidden rounded-2xl sm:rounded-3xl bg-slate-100 shadow-xl shadow-slate-200/50">
            <img
              v-if="landingFraternidades[0]?.urlImagen"
              :alt="landingFraternidades[0].titulo || 'Fraternidad destacada'"
              class="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
              :src="landingFraternidades[0].urlImagen"
            />
            <div v-else class="w-full h-full bg-gradient-to-br from-slate-200 via-slate-100 to-slate-300"></div>
            <div class="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent p-6 md:p-10 flex flex-col justify-end text-left">
              <h3 class="text-2xl md:text-4xl font-black text-white italic uppercase leading-tight">
                {{ landingFraternidades[0]?.titulo || 'FRATERNIDAD' }}
                <template v-if="landingFraternidades[0]?.subtitulo">
                  <br class="md:hidden"/>
                  <span class="text-secondary text-xl md:text-2xl"> {{ landingFraternidades[0].subtitulo }}</span>
                </template>
              </h3>
              <p
                v-if="landingFraternidades[0]?.descripcion"
                class="text-white/90 mt-4 max-w-md font-medium leading-relaxed text-sm md:text-base"
              >
                {{ landingFraternidades[0].descripcion }}
              </p>
            </div>
          </div>
          <!-- Side cards -->
          <div class="col-span-12 md:col-span-5 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-1 gap-6 md:gap-8">
            <div
              v-for="(card, index) in landingFraternidades.slice(1, 3)"
              :key="`landing-frat-${index + 1}`"
              class="relative h-[220px] sm:h-[250px] md:h-auto min-h-[220px] group overflow-hidden rounded-2xl sm:rounded-3xl bg-slate-100 shadow-lg shadow-slate-200/50"
            >
              <img
                v-if="card.urlImagen"
                :alt="card.titulo || `Fraternidad ${index + 2}`"
                class="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                :src="card.urlImagen"
              />
              <div v-else class="w-full h-full bg-gradient-to-br from-slate-200 via-slate-100 to-slate-300"></div>
              <div class="absolute inset-0 bg-gradient-to-t from-slate-900/70 via-transparent p-6 md:p-8 flex flex-col justify-end text-left">
                <h3 class="text-xl md:text-2xl font-black text-white italic uppercase leading-tight">
                  {{ card.titulo || 'FRATERNIDAD' }}
                  <template v-if="card.subtitulo">
                    <br class="sm:hidden lg:inline"/>
                    <span class="text-secondary inline md:block lg:inline"> {{ card.subtitulo }}</span>
                  </template>
                </h3>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- ===== RUTA / RECORRIDO ===== -->
      <section class="py-14 sm:py-20 md:py-32 px-5 sm:px-6 md:px-12 lg:px-24 bg-slate-50 relative overflow-hidden" id="ruta">
        <div class="absolute top-0 right-0 w-1/2 h-full opacity-5 pointer-events-none">
          <span class="material-symbols-outlined text-[400px] -mr-32 -mt-20">map</span>
        </div>
        
        <div class="max-w-7xl mx-auto relative z-10">
          <div class="text-center mb-16 md:mb-24 reveal reveal-left">
            <h2 class="text-4xl md:text-6xl font-black text-slate-900 italic tracking-tighter uppercase mb-4">RECORRIDO <span class="text-primary">OFICIAL</span></h2>
            <p class="text-slate-500 font-bold uppercase tracking-widest text-xs">Sigue la ruta de la entrada universitaria</p>
          </div>

          <div class="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <!-- Timeline -->
            <div class="space-y-12 relative">
              <div class="absolute left-6 top-0 w-1 h-full bg-slate-200 rounded-full"></div>
              
              <div v-for="(item, idx) in ruta" :key="idx" class="relative pl-16 reveal reveal-left">
                <div class="absolute left-0 top-0 size-12 bg-white rounded-2xl shadow-lg border border-slate-100 flex items-center justify-center z-10">
                  <span class="text-primary font-black italic text-lg">{{ idx + 1 }}</span>
                </div>
                <h3 class="text-xl md:text-2xl font-black text-slate-800 italic uppercase mb-2">{{ item.titulo }}</h3>
                <p class="text-slate-500 font-medium leading-relaxed max-w-md">{{ item.desc }}</p>
              </div>
            </div>

            <!-- Map Placeholder / Interactive Area -->
            <div class="relative group reveal reveal-right" @click="mostrarMapa = true">
              <div class="relative h-[260px] sm:h-[350px] md:h-[600px] rounded-2xl sm:rounded-[2rem] md:rounded-[3rem] overflow-hidden border border-slate-200 shadow-2xl group cursor-pointer transition-all duration-500">
                <img alt="Mapa Ruta" class="w-full h-full object-cover grayscale opacity-60 group-hover:grayscale-0 group-hover:scale-110 transition-all duration-1000"
                  src="/src/assets/img/Maps.png" />
                <div class="absolute inset-0 bg-gradient-to-t from-slate-900/40 via-transparent"></div>
                <div class="absolute bottom-6 md:bottom-10 left-6 md:left-10 right-6 md:right-10 p-5 md:p-8 bg-white/95 backdrop-blur-xl rounded-2xl md:rounded-3xl border border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4 shadow-xl translate-y-2 group-hover:translate-y-0 transition-transform">
                  <div class="text-center md:text-left">
                    <p class="text-[8px] md:text-[10px] text-secondary font-black uppercase tracking-widest mb-1">GPS Activo</p>
                    <span class="text-slate-900 font-black italic text-lg md:text-2xl uppercase">Ruta del Folklore</span>
                  </div>
                  <button 
                    class="w-full md:w-auto bg-primary text-white px-6 py-3 rounded-full text-[10px] md:text-xs font-black uppercase shadow-lg shadow-primary/20 group-hover:bg-secondary transition-colors"
                  >
                    Ver el mapa aquí
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Modal del Mapa -->
        <v-dialog v-model="mostrarMapa" max-width="900" transition="dialog-bottom-transition">
          <v-card class="rounded-3xl overflow-hidden border-4 border-primary">
            <v-card-title class="bg-primary text-white d-flex align-center justify-space-between pa-4">
              <div class="d-flex align-center gap-2 font-black italic uppercase tracking-tighter">
                <span class="material-symbols-outlined">map</span>
                Recorrido Oficial My Maps
              </div>
              <v-btn icon="close" variant="text" color="white" @click="mostrarMapa = false"></v-btn>
            </v-card-title>
            <v-card-text class="pa-0 bg-slate-900" style="height: 600px;">
              <iframe 
                src="https://www.google.com/maps/d/embed?mid=1-YtosxPGnmPvgFZ2NelW2cREgouvfb4&ehbc=2E312F&noprof=1" 
                width="100%" 
                height="100%" 
                style="border:0;" 
                allowfullscreen="" 
                loading="lazy"
              ></iframe>
            </v-card-text>
            <v-card-actions class="bg-white pa-4">
              <p class="text-[10px] text-slate-500 font-bold uppercase tracking-widest">© 2026 UMSA - Entrada Universitaria</p>
              <v-spacer></v-spacer>
              <v-btn color="secondary" variant="flat" rounded="pill" class="font-black px-6" @click="mostrarMapa = false">Cerrar</v-btn>
            </v-card-actions>
          </v-card>
        </v-dialog>
      </section>

      <!-- ===== EVENTOS PÚBLICOS ===== -->
      <section class="py-12 sm:py-16 md:py-24 px-5 sm:px-6 md:px-12 lg:px-24 bg-slate-50" id="eventos">
        <div class="text-center mb-12 md:mb-16 reveal">
          <h2 class="text-3xl md:text-5xl font-black text-slate-900 italic mb-4 uppercase tracking-tighter">
            PANEL DE <span class="text-primary">EVENTOS</span>
          </h2>
          <p class="text-slate-400 font-bold tracking-widest uppercase text-[10px] md:text-xs">
            Actividades y convocatorias oficiales
          </p>
        </div>

        <div v-if="loadingEventos" class="flex justify-center py-16">
          <span class="material-symbols-outlined text-4xl text-primary animate-spin">progress_activity</span>
        </div>

        <div v-else-if="eventosPublicos.length === 0" class="max-w-xl mx-auto text-center py-12 reveal">
          <span class="material-symbols-outlined text-5xl text-slate-300 mb-4">event_busy</span>
          <p class="text-slate-500 font-medium">No hay eventos públicos programados por ahora.</p>
        </div>

        <div v-else class="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
          <article
            v-for="ev in eventosPublicos"
            :key="ev.idEvento"
            class="bg-white rounded-2xl sm:rounded-3xl border border-slate-200 shadow-lg shadow-slate-100/60 p-6 sm:p-8 reveal reveal-left text-left"
          >
            <div class="flex items-start justify-between gap-4 mb-4">
              <span class="inline-flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full bg-primary/10 text-primary">
                <span class="material-symbols-outlined text-sm">public</span>
                Público
              </span>
              <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">
                {{ formatearFechaEvento(ev.fechaHora) }}
              </p>
            </div>
            <h3 class="text-xl md:text-2xl font-black text-slate-900 italic uppercase tracking-tight mb-3">
              {{ ev.nombre }}
            </h3>
            <p v-if="ev.descripcion" class="text-slate-500 font-medium text-sm leading-relaxed mb-4">
              {{ ev.descripcion }}
            </p>
            <div class="flex items-center gap-2 text-slate-600 font-bold text-sm">
              <span class="material-symbols-outlined text-secondary text-lg">location_on</span>
              {{ ev.ubicacion || 'Ubicación por confirmar' }}
            </div>
          </article>
        </div>
      </section>

      <!-- ===== ESTADÍSTICAS ===== -->
      <section class="py-12 sm:py-16 md:py-24 px-5 sm:px-6 md:px-12 lg:px-24 bg-white" id="estadisticas">
        <div class="text-center mb-12 md:mb-16 reveal">
          <h2 class="text-3xl md:text-5xl font-black text-slate-900 italic mb-4 uppercase tracking-tighter">RANKING <span class="text-secondary">FRATERNIDADES</span></h2>
          <p class="text-slate-400 font-bold tracking-widest uppercase text-[10px] md:text-xs">Puntuación en tiempo real</p>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10">
          <div v-for="(item, i) in rankingPublico.slice(0, 3)" :key="item.nombre"
            class="p-8 md:p-10 rounded-3xl bg-white border border-slate-100 shadow-lg shadow-slate-100/50 hover:shadow-xl hover:border-slate-200 transition-all relative text-left reveal"
            :class="i % 2 === 0 ? 'reveal-left' : 'reveal-right'"
          >
            <div class="flex justify-between items-start mb-6 md:mb-8 text-left">
              <div class="text-[9px] md:text-[10px] font-black px-3 py-1 rounded-full uppercase" :class="i === 0 ? 'bg-secondary/10 text-secondary' : 'bg-slate-100 text-slate-500'">
                Top 0{{ i + 1 }}</div>
              <span class="text-4xl md:text-5xl font-black text-slate-900 italic">{{ Math.round(item.puntaje) }}</span>
            </div>
            <h4 class="text-xl md:text-2xl font-bold text-slate-900 mb-6 uppercase italic">{{ item.nombre }}</h4>
            <div class="w-full h-2.5 md:h-3 bg-slate-100 rounded-full overflow-hidden">
              <div class="h-full rounded-full" :class="i === 0 ? 'bg-secondary' : 'bg-primary'" :style="{ width: Math.max(item.puntaje, 5) + '%' }"></div>
            </div>
            <div class="mt-8 flex justify-between text-[9px] md:text-[10px] font-bold text-slate-400 tracking-widest">
              <span>CATEGORÍA: {{ item.tipo }}</span>
              <span>OFICIAL</span>
            </div>
          </div>
        </div>
        <div class="mt-12 md:mt-20 text-center">
          <button 
            @click="mostrarRanking = true"
            class="w-full md:w-auto px-10 md:px-12 py-5 bg-slate-900 hover:bg-black text-white rounded-full transition-all text-[10px] md:text-xs font-black uppercase tracking-[0.2em] shadow-xl hover:scale-105 active:scale-95"
          >
            Ver Tabla Completa
          </button>
        </div>

        <!-- Modal Ranking Completo (Top 10) -->
        <v-dialog v-model="mostrarRanking" max-width="700" transition="dialog-bottom-transition">
          <v-card class="rounded-3xl overflow-hidden border-4 border-slate-900">
            <v-card-title class="bg-slate-900 text-white d-flex align-center justify-space-between pa-6">
              <div class="d-flex align-center gap-3 font-black italic uppercase tracking-tighter text-xl">
                <span class="material-symbols-outlined text-secondary text-3xl">leaderboard</span>
                RANKING GENERAL DE FRATERNIDADES
              </div>
              <v-btn icon="close" variant="text" color="white" @click="mostrarRanking = false"></v-btn>
            </v-card-title>
            
            <v-card-text class="pa-0 bg-white">
              <div class="divide-y divide-slate-100 overflow-y-auto" style="max-height: 500px;">
                <div 
                  v-for="(f, i) in rankingPublico" 
                  :key="i"
                  class="flex items-center justify-between p-5 hover:bg-slate-50 transition-colors"
                >
                  <div class="flex items-center gap-4">
                    <span 
                      class="size-8 rounded-lg flex items-center justify-center font-black text-xs"
                      :class="i < 3 ? 'bg-secondary text-white shadow-md' : 'bg-slate-100 text-slate-400'"
                    >
                      {{ i + 1 }}
                    </span>
                    <div>
                      <p class="font-black text-slate-900 uppercase tracking-tight leading-none mb-1 text-sm">{{ f.nombre }}</p>
                      <p class="text-[9px] text-slate-400 font-bold uppercase tracking-widest">{{ f.tipo }}</p>
                    </div>
                  </div>
                  <div class="text-right">
                    <span class="text-xl font-black text-primary italic">{{ Math.round(f.puntaje) }}</span>
                    <span class="text-[10px] text-slate-300 font-bold ml-1">PTS</span>
                  </div>
                </div>
              </div>
            </v-card-text>

            <v-card-actions class="bg-slate-50 pa-6">
              <p class="text-[9px] text-slate-400 font-bold uppercase tracking-[0.3em]">Cómputo Oficial 2026</p>
              <v-spacer></v-spacer>
              <v-btn color="slate-900" variant="flat" rounded="pill" class="font-black px-8" @click="mostrarRanking = false">Cerrar</v-btn>
            </v-card-actions>
          </v-card>
        </v-dialog>
      </section>

      <!-- ===== REPORTES HISTÓRICOS ===== -->
      <section
        v-if="mostrarHistoricoLanding"
        class="py-12 sm:py-16 md:py-24 px-5 sm:px-6 md:px-12 lg:px-24 bg-white border-t border-slate-100"
        id="historicos"
      >
        <div class="text-center mb-12 md:mb-16 reveal">
          <h2 class="text-3xl md:text-5xl font-black text-slate-900 italic mb-4 uppercase tracking-tighter">ARCHIVO <span class="text-primary">HISTÓRICO</span></h2>
          <p class="text-slate-400 font-bold tracking-widest uppercase text-[10px] md:text-xs">Resultados oficiales por gestión</p>
        </div>

        <div class="max-w-6xl mx-auto flex flex-col md:flex-row gap-6 sm:gap-8 reveal">
          <!-- Sidebar: Selector de Gestión -->
          <div class="w-full md:w-1/4 flex flex-col gap-3">
            <h3 class="font-black text-slate-900 uppercase tracking-widest text-xs">Selecciona un año</h3>
            <div class="flex flex-col border border-slate-200 rounded-2xl overflow-hidden bg-white divide-y divide-slate-100 max-h-[420px] overflow-y-auto">
              <button 
                v-for="g in gestionesPublicas" :key="g.idGestion"
                @click="cargarReporte(g.idGestion)"
                class="w-full text-left px-5 py-4 font-bold transition-all flex items-center justify-between gap-3"
                :class="gestionSeleccionada === g.idGestion
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'"
              >
                <span class="text-sm uppercase tracking-wide">Gestión {{ g.anio }}</span>
                <span
                  v-if="g.activa"
                  class="text-[8px] px-2 py-1 rounded-full uppercase tracking-wider shrink-0"
                  :class="gestionSeleccionada === g.idGestion ? 'bg-white/15 text-white' : 'bg-red-50 text-secondary'"
                >
                  Activa
                </span>
              </button>
            </div>
          </div>

          <!-- Contenido: Resultados -->
          <div class="w-full md:w-3/4 bg-white rounded-2xl sm:rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/50 p-5 sm:p-6 md:p-10 relative min-h-[320px] sm:min-h-[400px]">
            <div v-if="loadingReporte" class="absolute inset-0 flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm z-10 rounded-3xl">
              <span class="material-symbols-outlined text-4xl text-primary animate-spin mb-4">progress_activity</span>
              <p class="text-sm font-bold text-slate-500 animate-pulse">Cargando resultados...</p>
            </div>

            <div v-else-if="reporteActual" class="flex flex-col gap-10">
              <!-- Header Resultados -->
              <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 pb-8 border-b border-slate-100">
                <div>
                  <h3 class="text-2xl md:text-3xl font-black text-slate-900 italic uppercase">Gestión {{ reporteActual.gestion.anio }}</h3>
                  <p v-if="reporteActual.gestion.lema" class="text-slate-500 font-medium italic mt-1">"{{ reporteActual.gestion.lema }}"</p>
                </div>
                <button 
                  @click="descargarPdfReporte(reporteActual.gestion.idGestion, reporteActual.gestion.anio)"
                  class="flex items-center gap-2 bg-secondary text-white hover:bg-red-700 px-6 py-3 rounded-xl font-black tracking-wider uppercase text-xs transition-all shadow-lg shadow-red-200"
                >
                  <span class="material-symbols-outlined text-base">picture_as_pdf</span>
                  Descargar PDF Oficial
                </button>
              </div>

              <!-- Ranking EFU -->
              <div>
                <h4 class="text-lg font-black text-slate-800 uppercase mb-4 flex items-center gap-2">
                  <span class="material-symbols-outlined text-primary">emoji_events</span>
                  Ranking Entrada Folklórica
                </h4>
                <div class="overflow-x-auto rounded-2xl border border-slate-100 shadow-sm">
                  <table class="w-full text-left border-collapse min-w-[600px]">
                    <thead>
                      <tr class="bg-slate-50 text-[10px] text-slate-400 font-black uppercase tracking-widest border-b border-slate-100">
                        <th class="px-4 py-3 text-center">Puesto</th>
                        <th class="px-4 py-3">Fraternidad</th>
                        <th class="px-4 py-3">Categoría</th>
                        <th class="px-4 py-3 text-center">Jurado</th>
                        <th class="px-4 py-3 text-center text-red-500">Sanción</th>
                        <th class="px-4 py-3 text-center text-primary">Final</th>
                      </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-50 text-sm">
                      <tr v-for="r in reporteActual.rankingEfu" :key="r.idFraternidad" class="hover:bg-slate-50/50 transition-colors">
                        <td class="px-4 py-3 text-center font-black" :class="r.puesto <= 3 ? 'text-secondary' : 'text-slate-400'">{{ r.puesto }}</td>
                        <td class="px-4 py-3 font-bold text-slate-800 uppercase text-xs">{{ r.nombre }}<br><span class="text-[9px] text-slate-400 font-medium normal-case">{{ r.representacion }}</span></td>
                        <td class="px-4 py-3 text-xs text-slate-600 font-medium">{{ r.categoria }}</td>
                        <td class="px-4 py-3 text-center text-slate-500 font-bold">{{ r.promedioJurado }}</td>
                        <td class="px-4 py-3 text-center text-red-500 font-bold">{{ r.impactoSanciones }}</td>
                        <td class="px-4 py-3 text-center text-primary font-black text-base">{{ r.puntajeFinal }}</td>
                      </tr>
                      <tr v-if="!reporteActual.rankingEfu.length">
                        <td colspan="6" class="px-4 py-8 text-center text-slate-400 font-medium">No hay resultados oficiales registrados aún.</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

            </div>

            <div v-else class="flex flex-col items-center justify-center h-full opacity-50 py-20">
              <span class="material-symbols-outlined text-6xl text-slate-300 mb-4">history</span>
              <p class="text-slate-500 font-medium">Selecciona un año para ver los resultados históricos</p>
            </div>
          </div>
        </div>
      </section>

      <!-- ===== FOOTER ===== -->
      <footer class="bg-white border-t border-slate-200 py-12 sm:py-16 md:py-24 px-5 sm:px-6 md:px-12 lg:px-24">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-12 md:gap-20 mb-12 md:mb-16">
          <div class="col-span-1 md:col-span-2 text-left">
            <div class="flex items-center gap-4 mb-6 md:mb-8 justify-start">
              <img 
                src="/src/assets/img/Logo_Umsa.png" 
                alt="Logo UMSA" 
                class="h-16 w-auto object-contain"
              />
              <h3 class="text-xl md:text-3xl font-black italic tracking-tighter uppercase">
                <span class="text-slate-900">ENTRADA FOLKLÓRICA</span>
                <span class="text-primary"> UNIVERSITARIA </span>
                <span class="text-primary">UMS</span><span class="text-secondary">A</span>
              </h3>
            </div>
            <p class="text-slate-500 max-w-sm mb-6 md:mb-8 leading-relaxed font-medium text-xs md:text-base">Organizado por la Comisión de Cultura de la Universidad Mayor de San Andrés.</p>
            <div class="flex gap-3 justify-start">
              <!-- Facebook relleno -->
              <a href="https://www.facebook.com/share/1EVU9hh1jj/" target="_blank" rel="noopener noreferrer" title="Facebook UMSA"
                class="social-icon social-icon--filled group">
                <svg viewBox="0 0 24 24" class="w-4 h-4" aria-hidden="true">
                  <path fill="currentColor" d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073c0 6.02 4.388 11.013 10.125 11.91v-8.385H7.078v-3.525h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.525h-2.796v8.385C19.612 23.086 24 18.093 24 12.073z"/>
                </svg>
              </a>
              <!-- Facebook fondo blanco -->
              <a href="https://www.facebook.com/share/1D2BCRgsCN/" target="_blank" rel="noopener noreferrer" title="Facebook FCPN"
                class="social-icon social-icon--outline group">
                <svg viewBox="0 0 24 24" class="w-4 h-4" aria-hidden="true">
                  <path fill="currentColor" d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073c0 6.02 4.388 11.013 10.125 11.91v-8.385H7.078v-3.525h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.525h-2.796v8.385C19.612 23.086 24 18.093 24 12.073z"/>
                </svg>
              </a>
              <!-- YouTube -->
              <a href="https://www.youtube.com/@UMSAinformacion" target="_blank" rel="noopener noreferrer" title="YouTube UMSA"
                class="social-icon social-icon--youtube group">
                <svg viewBox="0 0 24 24" class="w-4 h-4" aria-hidden="true">
                  <path fill="currentColor" d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                </svg>
              </a>
            </div>
          </div>
          <div class="text-left">
            <h4 class="font-black text-slate-900 mb-6 md:mb-8 uppercase tracking-widest text-[9px] md:text-[10px]">Información</h4>
            <ul class="space-y-4 text-slate-500 text-[10px] md:text-xs font-bold uppercase">
              <li><a @click.prevent="scrollTo('fraternidades')" href="#fraternidades" class="hover:text-primary transition-colors cursor-pointer">Fraternidades</a></li>
              <li><a @click.prevent="scrollTo('ruta')" href="#ruta" class="hover:text-primary transition-colors cursor-pointer">Ruta Oficial</a></li>
              <li><a @click.prevent="scrollTo('eventos')" href="#eventos" class="hover:text-primary transition-colors cursor-pointer">Eventos</a></li>
              <li><a @click.prevent="scrollTo('estadisticas')" href="#estadisticas" class="hover:text-primary transition-colors cursor-pointer">Estadísticas</a></li>
              <li v-if="mostrarHistoricoLanding">
                <a @click.prevent="scrollTo('historicos')" href="#historicos" class="hover:text-primary transition-colors cursor-pointer">Archivo Histórico</a>
              </li>
            </ul>
          </div>
          <div class="text-left">
            <h4 class="font-black text-slate-900 mb-6 md:mb-8 uppercase tracking-widest text-[9px] md:text-[10px]">Contacto</h4>
            <ul class="space-y-4 md:space-y-5 text-slate-500 text-[10px] md:text-xs font-medium">
              <li class="flex items-center gap-3"><span class="material-symbols-outlined text-primary text-base md:text-lg">mail</span> culturas@fcpn.edu.bo</li>
              <li class="flex items-center gap-3"><span class="material-symbols-outlined text-primary text-base md:text-lg">call</span> (591 - 2) 2612256</li>
              <li class="flex items-center gap-3"><span class="material-symbols-outlined text-primary text-base md:text-lg">location_on</span> Av. Villazón N° 1995, Plaza del Bicentenario - Zona Central.
              <br>Ciudad de La Paz. Bolivia</li>
            </ul>
          </div>
        </div>
        <div class="pt-10 border-t border-slate-200 flex flex-col md:flex-row justify-between items-center gap-6 text-[8px] md:text-[10px] text-slate-400 font-bold uppercase tracking-widest text-center md:text-left group cursor-help overflow-visible">
          <p class="relative">© 2026 UMSA. Patrimonio Cultural de Bolivia. 
            <span class="developer-credit md:absolute md:left-full md:ml-4 text-primary opacity-0 select-none whitespace-nowrap transition-opacity duration-1000">
              Desarrollado por Dai Henry Aguilar Estrada
            </span>
          </p>
          <div class="flex gap-6 md:gap-8">
            <a class="hover:text-primary transition-colors" href="#">Privacidad</a>
            <a class="hover:text-primary transition-colors" href="#">Términos</a>
          </div>
        </div>
      </footer>

    </main>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed, watch } from 'vue'
import api from '../services/api'

import { getImageUrl, getApiUrl } from '../utils/url'
import { applySiteTitle } from '../utils/siteTitle'
import { defaultLogo, defaultHeroBanner } from '../assets/defaultImages'

const siteInfo = ref({})
const mostrarMapa = ref(false)
const mainRef = ref(null)

const DEFAULT_LANDING_FRATERNIDADES = [
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
]

const landingFraternidades = computed(() => {
  const raw = siteInfo.value?.landingFraternidades
  const list = Array.isArray(raw) && raw.length ? raw : DEFAULT_LANDING_FRATERNIDADES
  return DEFAULT_LANDING_FRATERNIDADES.map((fallback, index) => {
    const item = list[index] || {}
    return {
      titulo: item.titulo || fallback.titulo,
      subtitulo: item.subtitulo || fallback.subtitulo,
      descripcion: item.descripcion ?? fallback.descripcion,
      urlImagen: item.urlImagen ? getImageUrl(item.urlImagen) : '',
    }
  })
})

const aniosTradicion = computed(() => {
  const currentYear = new Date().getFullYear()
  return currentYear - 1988
})

const heroBannerUrl = computed(() => siteInfo.value.urlBanner || defaultHeroBanner)
const mostrarHistoricoLanding = computed(() => siteInfo.value?.mostrarHistorico === true)

const rankingPublico = ref([])
const loadingRanking = ref(true)
const eventosPublicos = ref([])
const loadingEventos = ref(true)
let refreshInterval = null

const formatearFechaEvento = (fechaHora) => {
  if (!fechaHora) return ''
  return new Date(fechaHora).toLocaleString('es-BO', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const cargarEventosPublicos = async () => {
  loadingEventos.value = true
  try {
    const { data } = await api.get('/asistencias/eventos-publicos')
    eventosPublicos.value = Array.isArray(data) ? data : []
  } catch (err) {
    console.error('Error al cargar eventos públicos:', err)
    eventosPublicos.value = []
  } finally {
    loadingEventos.value = false
  }
}

const cargarDatos = async () => {
  try {
    const { data } = await api.get('/evaluaciones/gestion-activa')
    if (data) {
       data.urlLogo = getImageUrl(data.urlLogo)
       data.urlBanner = getImageUrl(data.urlBanner)
       siteInfo.value = data
       applySiteTitle(data.nombreSitio)
    }
  } catch (err) {}

  try {
    const { data } = await api.get('/evaluaciones/estadisticas')
    rankingPublico.value = data.rankingEfu || []
  } catch (err) {
    console.error('Error al cargar ranking:', err)
  } finally {
    loadingRanking.value = false
  }

  await cargarEventosPublicos()
  await cargarGestionesPublicas()
}

const gestionesPublicas = ref([])
const gestionSeleccionada = ref(null)
const reporteActual = ref(null)
const loadingReporte = ref(false)

const cargarGestionesPublicas = async () => {
  if (!mostrarHistoricoLanding.value) {
    gestionesPublicas.value = []
    reporteActual.value = null
    gestionSeleccionada.value = null
    return
  }
  try {
    const { data } = await api.get('/evaluaciones/gestiones-publicas')
    gestionesPublicas.value = data
    if (data.length > 0 && !gestionSeleccionada.value) {
      cargarReporte(data[0].idGestion)
    }
  } catch (err) {
    console.error('Error al cargar gestiones:', err)
  }
}

const cargarReporte = async (idGestion) => {
  if (gestionSeleccionada.value === idGestion && reporteActual.value) return
  gestionSeleccionada.value = idGestion
  loadingReporte.value = true
  try {
    const { data } = await api.get(`/evaluaciones/reporte/${idGestion}`)
    reporteActual.value = data
  } catch (err) {
    console.error('Error al cargar reporte:', err)
  } finally {
    loadingReporte.value = false
  }
}

const descargarPdfReporte = (idGestion, anio) => {
  window.open(getApiUrl(`/api/v1/evaluaciones/reporte/${idGestion}/pdf`), '_blank')
}

onMounted(() => {
  cargarDatos()
  // Actualizar cada 15 segundos para "tiempo real"
  refreshInterval = setInterval(cargarDatos, 15000)

  // Reveal Animations
  const observerOptions = { threshold: 0.1 };
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('reveal-active');
      }
    });
  }, observerOptions);

  document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

  // Watch for dynamic elements (ranking)
  watch(rankingPublico, () => {
    setTimeout(() => {
      document.querySelectorAll('.reveal:not(.reveal-active)').forEach(el => observer.observe(el));
    }, 500);
  });

  // Escuchar flechas del navegador para navegación por hash
  window.addEventListener('popstate', () => {
    const hash = window.location.hash.replace('#', '')
    if (hash) {
      document.getElementById(hash)?.scrollIntoView({ behavior: 'smooth' })
    }
  })
})

onUnmounted(() => {
  if (refreshInterval) clearInterval(refreshInterval)
})

const scrollTo = (id) => {
  const el = document.getElementById(id)
  if (el) {
    el.scrollIntoView({ behavior: 'smooth' })
    // Actualizar hash en URL para habilitar flechas del navegador
    history.pushState(null, null, `#${id}`)
  }
}

const ruta = [
  { titulo: 'Partida: Plaza Bolivia', desc: 'Capitán Ravelo — Punto de inicio y concentración.' },
  { titulo: 'Palco: Av. Camacho', desc: 'Centro del recorrido y punto de mayor concurrencia.' },
  { titulo: 'Final: Simón Bolívar', desc: 'Desconcentración frente al Estadio.' },
]

const mostrarRanking = ref(false)
</script>

<style scoped>
.font-display { font-family: 'Inter', 'Be Vietnam Pro', sans-serif; }

/* Sidebar brand */
.sidebar-brand-logo {
  animation: brandFadeIn 0.8s cubic-bezier(0.2, 0.8, 0.2, 1) both;
}

.sidebar-brand-umsa {
  animation: brandSlideIn 0.9s cubic-bezier(0.2, 0.8, 0.2, 1) 0.15s both;
}

.sidebar-brand-subtitle {
  animation: brandSlideIn 0.9s cubic-bezier(0.2, 0.8, 0.2, 1) 0.35s both;
  position: relative;
}

.sidebar-brand-subtitle::after {
  content: '';
  position: absolute;
  left: 0;
  bottom: -0.35rem;
  height: 3px;
  width: 0;
  background: linear-gradient(90deg, #003399, #c8102e);
  border-radius: 999px;
  animation: brandUnderline 1.1s cubic-bezier(0.2, 0.8, 0.2, 1) 0.9s forwards;
}

@keyframes brandFadeIn {
  from { opacity: 0; transform: scale(0.88) translateY(8px); }
  to { opacity: 1; transform: scale(1) translateY(0); }
}

@keyframes brandSlideIn {
  from { opacity: 0; transform: translateX(-20px); }
  to { opacity: 1; transform: translateX(0); }
}

@keyframes brandUnderline {
  to { width: 4.5rem; }
}

.andean-dots {
  background-color: transparent;
  background-image: radial-gradient(#003399 0.5px, transparent 0.5px), radial-gradient(#003399 0.5px, #fdfdfd 0.5px);
  background-size: 20px 20px;
  background-position: 0 0, 10px 10px;
  opacity: 0.03;
}

.paper-texture {
  background-image: none;
}

@media (min-width: 768px) {
  .paper-texture {
    background-image: url('https://lh3.googleusercontent.com/aida-public/AB6AXuCVoBK5Il_QGy-7Iy1Dq1wMTFeDcvRCKMMdPn_gGNcIVvrshsRu92LQo5SErct1KZ_e0rs9ENqLTeuDHbIQOLwvxsCx8cSz26YagoeKhKxaOR_YnGDs2l2Yvyo3fIIwScWj4biWfa4aLdg5OKodYaRcUhzXMnmU19N2JN1mUg5IPNc9iwQCshwKQHaxDALkB1ggXUF-GdVuTCeufIy47kd4bMpy7J5kV9zcXJR12QyqyASYLgtbt12gFTPk_DJSqK3jmkUSIGe-rqU');
  }
}

/* Marquee Animation */
.marquee-container {
  width: 100%;
  white-space: nowrap;
}

.marquee-content {
  display: inline-flex;
  animation: marquee 25s linear infinite;
  padding-left: 24px;
}

@keyframes marquee {
  0% { transform: translateX(0); }
  100% { transform: translateX(-50%); }
}

/* Pause on hover for better UX */
.marquee-container:hover .marquee-content {
  animation-play-state: paused;
}

/* Scroll Reveal Animations */
.reveal {
  opacity: 0;
  transition: all 1.2s cubic-bezier(0.2, 0.8, 0.2, 1);
  will-change: transform, opacity;
}

.reveal-left {
  transform: translateX(-60px);
}

.reveal-right {
  transform: translateX(60px);
}

.reveal-active {
  opacity: 1 !important;
  transform: translateX(0) !important;
}

/* Easter Egg Delay */
.developer-credit {
  transition-delay: 0s;
}
.group:hover .developer-credit {
  opacity: 1 !important;
  transition-delay: 2s;
}
/* For mobile tap */
.group:active .developer-credit {
  opacity: 1 !important;
  transition-delay: 1s;
}

/* Redes sociales — minimalista B/N */
.social-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 9999px;
  transition: transform 0.2s ease, opacity 0.2s ease;
}
@media (min-width: 768px) {
  .social-icon {
    width: 2.75rem;
    height: 2.75rem;
  }
}
.social-icon:hover {
  transform: scale(1.06);
  opacity: 0.88;
}
.social-icon--filled {
  background: #0f172a;
  color: #ffffff;
}
.social-icon--outline {
  background: #ffffff;
  color: #0f172a;
  border: 1.5px solid #0f172a;
}
.social-icon--youtube {
  background: #0f172a;
  color: #ffffff;
}
</style>
