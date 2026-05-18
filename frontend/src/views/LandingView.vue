<template>
  <div class="flex h-screen w-full relative bg-[#fdfdfd] font-display overflow-hidden">

    <!-- Sidebar (Desktop) -->
    <aside class="hidden md:flex w-64 flex-shrink-0 bg-white border-r border-slate-200 flex-col justify-between py-8 px-6 sticky top-0 h-screen z-50 shadow-sm">
      <div class="flex flex-col gap-10">
        <!-- Logo -->
        <div class="flex items-center gap-3">
          <img 
            :src="siteInfo.urlLogo || '/src/assets/img/Logo_Umsa.png'" 
            alt="Logo Institucional" 
            class="h-14 w-auto object-contain"
          />
          <h1 class="text-xl font-bold leading-tight italic tracking-tight text-primary">
            {{ siteInfo.nombreSitio?.split(' ')[0] || 'UMS' }}<span class="text-secondary">{{ siteInfo.nombreSitio?.split(' ')[1] || 'A' }}</span><br />
            <span class="text-slate-900 leading-none">Entrada</span>
          </h1>
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
          <a @click.prevent="scrollTo('estadisticas')" href="#estadisticas"
            class="flex items-center gap-4 px-4 py-3 rounded-lg hover:bg-slate-50 transition-colors group cursor-pointer">
            <span class="material-symbols-outlined text-slate-400 group-hover:text-primary transition-colors">leaderboard</span>
            <p class="text-sm font-medium tracking-wide uppercase text-slate-600 group-hover:text-primary transition-colors">Estadísticas</p>
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
    <nav class="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] bg-white/90 backdrop-blur-lg border border-slate-200 h-16 rounded-2xl z-[100] shadow-2xl flex items-center justify-around px-2">
      <button @click="scrollTo('inicio')" class="flex flex-col items-center gap-1 text-slate-400 hover:text-primary transition-colors">
        <span class="material-symbols-outlined text-xl">home</span>
        <span class="text-[8px] font-black uppercase">Inicio</span>
      </button>
      <button @click="scrollTo('fraternidades')" class="flex flex-col items-center gap-1 text-slate-400 hover:text-primary transition-colors">
        <span class="material-symbols-outlined text-xl">groups</span>
        <span class="text-[8px] font-black uppercase">Danzas</span>
      </button>
      
      <!-- Central Login Circle -->
      <router-link to="/login" class="bg-secondary size-14 rounded-full flex items-center justify-center text-white -mt-10 border-4 border-[#fdfdfd] shadow-lg shadow-red-200 active:scale-90 transition-transform">
        <span class="material-symbols-outlined text-2xl">login</span>
      </router-link>

      <button @click="scrollTo('ruta')" class="flex flex-col items-center gap-1 text-slate-400 hover:text-primary transition-colors">
        <span class="material-symbols-outlined text-xl">map</span>
        <span class="text-[8px] font-black uppercase">Ruta</span>
      </button>
      <button @click="scrollTo('estadisticas')" class="flex flex-col items-center gap-1 text-slate-400 hover:text-primary transition-colors">
        <span class="material-symbols-outlined text-xl">leaderboard</span>
        <span class="text-[8px] font-black uppercase">Ranking</span>
      </button>
    </nav>

    <!-- Main Content -->
    <main ref="mainRef" class="flex-1 relative h-screen overflow-y-auto overflow-x-hidden bg-[#fdfdfd] scroll-smooth paper-texture pb-24 md:pb-0">

      <!-- ===== HERO SECTION ===== -->
      <section class="relative min-h-screen flex flex-col" id="inicio">
        <!-- Background -->
        <div class="absolute inset-0 z-0 overflow-hidden">
          <div class="andean-dots absolute inset-0"></div>
          <!-- Hero Image -->
          <div
            class="absolute top-0 right-0 w-full md:w-2/3 h-full bg-cover bg-center opacity-90 transition-all duration-1000 scale-105"
            :style="{ backgroundImage: `url('${siteInfo.urlBanner || '/src/assets/img/img_backgroud.png'}')`, clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)' }"
            :class="{'md:[clip-path:polygon(25%_0%,_100%_0%,_100%_100%,_0%_100%)]': true}"
          ></div>
          <div class="absolute inset-0 bg-gradient-to-b md:bg-gradient-to-r from-[#fdfdfd] via-[#fdfdfd]/80 to-transparent"></div>
        </div>

        <!-- Content -->
        <div class="relative z-10 flex flex-col h-full min-h-screen">
          <!-- Top header with login button (Hidden on mobile as it's in bottom bar) -->
          <header class="hidden md:flex justify-end p-8 w-full gap-4">
            <!-- Registration Button (Floating style) -->
            <router-link
              v-if="siteInfo.permiteInscripcionPublica"
              to="/registro-representante"
              class="flex items-center gap-2 bg-white border-2 border-primary text-primary hover:bg-primary hover:text-white px-7 py-3 rounded-full font-black tracking-widest uppercase text-sm transition-all shadow-xl shadow-primary/10"
            >
              <span class="material-symbols-outlined text-base">app_registration</span>
              <span>Registra tu Fraternidad</span>
            </router-link>

            <router-link
              to="/login"
              class="flex items-center gap-2 bg-secondary hover:bg-red-700 text-white px-7 py-3 rounded-full font-black tracking-widest uppercase text-sm transition-all shadow-lg shadow-red-200"
            >
              <span class="material-symbols-outlined text-base">login</span>
              <span>Iniciar Sesión</span>
            </router-link>
          </header>

          <!-- Hero Text -->
          <div class="flex-1 flex items-center px-6 md:px-12 lg:px-24 pb-32">
            <div class="max-w-4xl relative">
              <div class="flex flex-col gap-6 relative z-10">
                <span class="text-primary font-black tracking-[0.25em] uppercase text-xs md:text-base flex items-center gap-4">
                  <span class="w-12 md:w-16 h-[3px] bg-secondary shadow-sm"></span>
                  Patrimonio Cultural de Bolivia
                </span>
                <h1 class="text-4xl md:text-8xl lg:text-9xl font-black italic leading-[0.85] tracking-tighter text-slate-900 reveal reveal-left">
                  {{ siteInfo.tituloPrincipal?.split(' ')[0] || 'ENTRADA' }}<br />
                  <span class="text-primary">{{ siteInfo.tituloPrincipal?.split(' ').slice(1).join(' ') || 'UNIVERSITARIA' }}</span><br />
                  <span>{{ siteInfo.nombreSitio || 'UMSA' }}</span>
                </h1>
                <p class="text-lg md:text-2xl text-slate-600 max-w-xl font-medium leading-relaxed mt-6 border-l-4 border-secondary pl-4 md:pl-6 reveal reveal-left">
                  {{ siteInfo.subtituloPrincipal || 'Vive la majestuosidad de nuestras danzas tradicionales en la mayor expresión folklórica universitaria.' }}
                </p>
                <div class="flex flex-wrap items-center gap-4 md:gap-6 mt-8 md:mt-10">
                  <!-- Registration Primary Button -->
                  <router-link 
                    v-if="siteInfo.permiteInscripcionPublica"
                    to="/registro-representante"
                    class="w-full md:w-auto bg-secondary text-white hover:bg-red-700 px-8 py-4 rounded-full font-black tracking-wider uppercase text-sm transition-all shadow-xl shadow-red-200 flex items-center justify-center gap-3"
                  >
                    <span class="material-symbols-outlined text-xl">app_registration</span>
                    Inscribir Fraternidad
                  </router-link>

                  <router-link
                    to="/login"
                    class="w-full md:w-auto bg-primary text-white hover:bg-blue-900 px-8 py-4 rounded-full font-black tracking-wider uppercase text-sm transition-all shadow-xl shadow-primary/20 flex items-center justify-center gap-3 reveal reveal-right"
                  >
                    <span class="material-symbols-outlined text-base">login</span>
                    Iniciar Sesión
                  </router-link>
                </div>
              </div>
            </div>
          </div>

          <!-- Stats Bar -->
          <div class="absolute bottom-0 left-0 w-full border-t border-slate-100 bg-white/80 backdrop-blur-md z-20 overflow-hidden">
            <div class="marquee-container py-6 md:py-8">
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
      <section class="py-16 md:py-24 px-6 md:px-12 lg:px-24 bg-white" id="fraternidades">
        <div class="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 md:mb-16 gap-6 reveal reveal-left">
          <div>
            <h2 class="text-3xl md:text-5xl font-black text-slate-900 italic uppercase tracking-tighter">FRATERNIDADES <span class="text-secondary">ESTRELLA</span></h2>
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
          <div class="col-span-12 md:col-span-7 relative h-[400px] md:h-auto group overflow-hidden rounded-3xl bg-slate-100 shadow-xl shadow-slate-200/50">
            <img alt="Caporales" class="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
              src="/src/assets/img/caporal.jpg" />
            <div class="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent p-6 md:p-10 flex flex-col justify-end text-left">
              <h3 class="text-2xl md:text-4xl font-black text-white italic uppercase leading-tight">CAPORALES <br class="md:hidden"/> <span class="text-secondary text-xl md:text-2xl">INGENIERÍA</span></h3>
              <p class="text-white/90 mt-4 max-w-md font-medium leading-relaxed text-sm md:text-base">Energía, fuerza y saltos acrobáticos. Potencia pura en el recorrido.</p>
            </div>
          </div>
          <!-- Side cards -->
          <div class="col-span-12 md:col-span-5 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-1 gap-6 md:gap-8">
            <div class="relative h-[250px] md:h-auto group overflow-hidden rounded-3xl bg-slate-100 shadow-lg shadow-slate-200/50">
              <img alt="Morenada" class="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                src="/src/assets/img/morenada.jpg" />
              <div class="absolute inset-0 bg-gradient-to-t from-slate-900/70 via-transparent p-6 md:p-8 flex flex-col justify-end text-left">
                <h3 class="text-xl md:text-2xl font-black text-white italic uppercase leading-tight">MORENADA <br class="sm:hidden lg:inline"/> <span class="text-secondary inline md:block lg:inline">DERECHO</span></h3>
              </div>
            </div>
            <div class="relative h-[250px] md:h-auto group overflow-hidden rounded-3xl bg-slate-100 shadow-lg shadow-slate-200/50">
              <img alt="Tinkus" class="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                src="/src/assets/img/tinkus.jpg" />
              <div class="absolute inset-0 bg-gradient-to-t from-slate-900/70 via-transparent p-6 md:p-8 flex flex-col justify-end text-left">
                <h3 class="text-xl md:text-2xl font-black text-white italic uppercase leading-tight">TINKUS <br class="sm:hidden lg:inline" /> <span class="text-secondary inline md:block lg:inline">WISTUS</span></h3>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- ===== RUTA / RECORRIDO ===== -->
      <section class="py-20 md:py-32 px-6 md:px-12 lg:px-24 bg-slate-50 relative overflow-hidden" id="ruta">
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
              <div class="relative h-[350px] md:h-[600px] rounded-[2rem] md:rounded-[3rem] overflow-hidden border border-slate-200 shadow-2xl group cursor-pointer transition-all duration-500">
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

      <!-- ===== ESTADÍSTICAS ===== -->
      <section class="py-16 md:py-24 px-6 md:px-12 lg:px-24 bg-white" id="estadisticas">
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

      <!-- ===== FOOTER ===== -->
      <footer class="bg-slate-50 border-t border-slate-200 py-16 md:py-24 px-6 md:px-12 lg:px-24">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-12 md:gap-20 mb-12 md:mb-16">
          <div class="col-span-1 md:col-span-2 text-left">
            <div class="flex items-center gap-4 mb-6 md:mb-8 justify-start">
              <img 
                src="/src/assets/img/Logo_Umsa.png" 
                alt="Logo UMSA" 
                class="h-16 w-auto object-contain"
              />
              <h3 class="text-xl md:text-3xl font-black italic text-slate-900 tracking-tighter uppercase">ENTRADA <span class="text-primary">UMS<span class="text-secondary">A</span></span></h3>
            </div>
            <p class="text-slate-500 max-w-sm mb-6 md:mb-8 leading-relaxed font-medium text-xs md:text-base">Organizado por la Comisión de Cultura de la Universidad Mayor de San Andrés.</p>
            <div class="flex gap-4 justify-start">
              <a href="https://www.facebook.com/umsafp" target="_blank" title="Facebook UMSA"
                class="size-10 md:size-11 rounded-full bg-white flex items-center justify-center text-slate-400 hover:text-primary transition-all border border-slate-200 shadow-sm">
                <span class="material-symbols-outlined text-lg">facebook</span>
              </a>
              <a href="https://www.facebook.com/FCPN.UMSA" target="_blank" title="Facebook FCPN"
                class="size-10 md:size-11 rounded-full bg-white flex items-center justify-center text-slate-400 hover:text-primary transition-all border border-slate-200 shadow-sm">
                <span class="material-symbols-outlined text-lg">groups</span>
              </a>
              <a href="https://www.youtube.com/@UMSA_Oficial" target="_blank" title="YouTube UMSA"
                class="size-10 md:size-11 rounded-full bg-white flex items-center justify-center text-slate-400 hover:text-primary transition-all border border-slate-200 shadow-sm">
                <span class="material-symbols-outlined text-lg">play_circle</span>
              </a>
            </div>
          </div>
          <div class="text-left">
            <h4 class="font-black text-slate-900 mb-6 md:mb-8 uppercase tracking-widest text-[9px] md:text-[10px]">Información</h4>
            <ul class="space-y-4 text-slate-500 text-[10px] md:text-xs font-bold uppercase">
              <li><a @click.prevent="scrollTo('fraternidades')" href="#fraternidades" class="hover:text-primary transition-colors cursor-pointer">Fraternidades</a></li>
              <li><a @click.prevent="scrollTo('ruta')" href="#ruta" class="hover:text-primary transition-colors cursor-pointer">Ruta Oficial</a></li>
              <li><a @click.prevent="scrollTo('estadisticas')" href="#estadisticas" class="hover:text-primary transition-colors cursor-pointer">Estadísticas</a></li>
            </ul>
          </div>
          <div class="text-left">
            <h4 class="font-black text-slate-900 mb-6 md:mb-8 uppercase tracking-widest text-[9px] md:text-[10px]">Contacto</h4>
            <ul class="space-y-4 md:space-y-5 text-slate-500 text-[10px] md:text-xs font-medium">
              <li class="flex items-center gap-3"><span class="material-symbols-outlined text-primary text-base md:text-lg">mail</span> divisionculturayartesumsa@gmail.com</li>
              <li class="flex items-center gap-3"><span class="material-symbols-outlined text-primary text-base md:text-lg">call</span> (591 - 2) 2445499</li>
              <li class="flex items-center gap-3"><span class="material-symbols-outlined text-primary text-base md:text-lg">location_on</span> Av. Villazón N° 1995, Plaza del Bicentenario - Zona Central.
              <br>Ciudad de La Paz. Bolivia</li>
            </ul>
          </div>
        </div>
        <div class="pt-10 border-t border-slate-200 flex flex-col md:flex-row justify-between items-center gap-6 text-[8px] md:text-[10px] text-slate-400 font-bold uppercase tracking-widest text-center md:text-left group cursor-help overflow-visible">
          <p class="relative">© 2026 UMSA. Patrimonio Cultural de Bolivia. 
            <span class="developer-credit md:absolute md:left-full md:ml-4 text-primary opacity-0 select-none whitespace-nowrap transition-opacity duration-1000">
              Desarrollado por D. Henry Aguilar Estrada
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

import { getImageUrl } from '../utils/url'

const siteInfo = ref({})
const mostrarMapa = ref(false)
const mainRef = ref(null)

const aniosTradicion = computed(() => {
  const currentYear = new Date().getFullYear()
  return currentYear - 1988
})

const rankingPublico = ref([])
const loadingRanking = ref(true)
let refreshInterval = null

const cargarDatos = async () => {
  try {
    const { data } = await api.get('/evaluaciones/gestion-activa')
    if (data) {
       data.urlLogo = getImageUrl(data.urlLogo)
       data.urlBanner = getImageUrl(data.urlBanner)
       siteInfo.value = data
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
  { titulo: 'Partida: Plaza Bolivia', desc: 'Capitan Ravelo - Punto de inicio y concentración.' },
  { titulo: 'Palco: Av. Camacho', desc: 'Centro del recorrido y punto de mayor concurrencia.' },
  { titulo: 'Final: Simón Bolívar', desc: 'Desconcentración frente al Estadio.' },
]

const mostrarRanking = ref(false)
</script>

<style scoped>
.font-display { font-family: 'Inter', 'Be Vietnam Pro', sans-serif; }

.andean-dots {
  background-color: transparent;
  background-image: radial-gradient(#003399 0.5px, transparent 0.5px), radial-gradient(#003399 0.5px, #fdfdfd 0.5px);
  background-size: 20px 20px;
  background-position: 0 0, 10px 10px;
  opacity: 0.03;
}

.paper-texture {
  background-image: url('https://lh3.googleusercontent.com/aida-public/AB6AXuCVoBK5Il_QGy-7Iy1Dq1wMTFeDcvRCKMMdPn_gGNcIVvrshsRu92LQo5SErct1KZ_e0rs9ENqLTeuDHbIQOLwvxsCx8cSz26YagoeKhKxaOR_YnGDs2l2Yvyo3fIIwScWj4biWfa4aLdg5OKodYaRcUhzXMnmU19N2JN1mUg5IPNc9iwQCshwKQHaxDALkB1ggXUF-GdVuTCeufIy47kd4bMpy7J5kV9zcXJR12QyqyASYLgtbt12gFTPk_DJSqK3jmkUSIGe-rqU');
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
</style>
