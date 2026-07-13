<template>
  <div class="andean-pattern min-h-[100dvh] font-display">
    <div class="flex h-[100dvh] overflow-hidden">

      <!-- ===== SIDEBAR ===== -->
      <aside
        :class="sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'"
        class="fixed lg:relative z-40 w-[min(100vw,18rem)] max-w-[85vw] lg:max-w-none lg:w-72 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700 flex flex-col h-full shrink-0 transition-transform duration-300"
      >
        <div class="p-4 sm:p-6 flex flex-col h-full overflow-y-auto">
          <!-- Logo/Brand -->
          <div class="flex items-center gap-3 mb-6 sm:mb-10">
            <div v-if="siteInfo.urlLogo" class="size-12 overflow-hidden rounded-lg flex items-center justify-center border-2 border-primary shadow-sm bg-white dark:bg-slate-800">
              <img :src="siteInfo.urlLogo" class="size-full object-contain" alt="Logo" />
            </div>
            <div v-else class="size-10 bg-primary rounded-lg flex items-center justify-center text-white font-black text-xl shadow-[2px_2px_0px_0px_rgba(200,16,46,1)] border-2 border-primary">
              <span class="material-symbols-outlined text-xl">account_balance</span>
            </div>
            <div>
              <h1 class="font-black text-lg leading-tight tracking-tight text-primary uppercase">
                UMS<span class="text-secondary">A</span>
              </h1>
              <p class="text-[9px] text-slate-500 uppercase tracking-widest font-black leading-none mt-1">
                Entrada Folklórica Universitaria
              </p>
            </div>
          </div>

          <!-- Navigation Links -->
          <nav class="flex-1 space-y-1">
            <p class="text-[9px] font-black text-slate-400 uppercase tracking-widest px-4 mb-2">Principal</p>

            <button
              v-if="can('estadisticas')"
              @click="setVista('estadisticas')"
              :class="vistaActual === 'estadisticas' ? 'bg-slate-50 text-primary border-l-4 border-l-secondary font-bold' : 'text-slate-600 hover:bg-slate-50 border-l-4 border-l-transparent'"
              class="w-full flex items-center gap-3 px-4 py-3 rounded-r-xl transition-all text-left"
            >
              <span class="material-symbols-outlined text-[20px]" :class="vistaActual === 'estadisticas' ? 'text-secondary' : 'text-slate-400'">analytics</span>
              <span class="text-sm">Estadísticas</span>
            </button>

            <button
              v-if="can('gestion_evento')"
              @click="setVista('gestion_fases')"
              :class="vistaActual.startsWith('gestion_fases') ? 'bg-slate-50 text-primary border-l-4 border-l-secondary font-bold' : 'text-slate-600 hover:bg-slate-50 border-l-4 border-l-transparent'"
              class="w-full flex items-center gap-3 px-4 py-3 rounded-r-xl transition-all text-left"
            >
              <span class="material-symbols-outlined text-[20px]" :class="vistaActual.startsWith('gestion_fases') ? 'text-secondary' : 'text-slate-400'">event_available</span>
              <span class="text-sm font-bold">Gestión Evento</span>
            </button>


            <button
              v-if="can('calificar')"
              @click="setVista('seleccionar_fase')"
              :class="(vistaActual === 'seleccionar_fase' || vistaActual === 'listado_fase' || vistaActual === 'wizard') ? 'bg-slate-50 text-primary border-l-4 border-l-secondary font-bold' : 'text-slate-600 hover:bg-slate-50 border-l-4 border-l-transparent'"
              class="w-full flex items-center gap-3 px-4 py-3 rounded-r-xl transition-all text-left"
            >
              <span class="material-symbols-outlined text-[20px]" :class="(vistaActual === 'seleccionar_fase' || vistaActual === 'listado_fase' || vistaActual === 'wizard') ? 'text-secondary' : 'text-slate-400'">grade</span>
              <span class="text-sm">Calificar Fraternidad</span>
            </button>

            <!-- GESTIÓN: Concursos Externos (Para Jurados) -->
            <button
              v-if="can('evaluar')"
              @click="setVista('seleccionar_concurso')"
              :class="(vistaActual === 'seleccionar_concurso' || vistaActual === 'listado_competidores' || vistaActual === 'wizard_concurso') ? 'bg-slate-50 text-secondary border-l-4 border-l-primary font-bold' : 'text-slate-600 hover:bg-slate-50 border-l-4 border-l-transparent'"
              class="w-full flex items-center gap-3 px-4 py-3 rounded-r-xl transition-all text-left mt-1 overflow-hidden"
            >
              <span class="material-symbols-outlined text-[20px]" :class="(vistaActual === 'seleccionar_concurso' || vistaActual === 'listado_competidores' || vistaActual === 'wizard_concurso') ? 'text-primary' : 'text-slate-400'">emoji_events</span>
              <span class="text-sm whitespace-nowrap overflow-ellipsis">Calificar Concursos</span>
              <span v-if="(vistaActual === 'seleccionar_concurso' || vistaActual === 'listado_competidores' || vistaActual === 'wizard_concurso')" class="size-1.5 rounded-full bg-primary ml-auto animate-pulse"></span>
            </button>

            <!-- ADMINISTRACIÓN -->
            <button
              v-if="can('gestionar_participantes')"
              @click="setVista('participantes_concurso')"
              :class="vistaActual === 'participantes_concurso' ? 'bg-slate-50 text-primary border-l-4 border-l-secondary font-bold' : 'text-slate-600 hover:bg-slate-50 border-l-4 border-l-transparent'"
              class="w-full flex items-center gap-3 px-4 py-3 rounded-r-xl transition-all text-left"
            >
              <span class="material-symbols-outlined text-[20px]" :class="vistaActual === 'participantes_concurso' ? 'text-secondary' : 'text-slate-400'">group_add</span>
              <span class="text-sm">Participantes Concursos</span>
            </button>

            <button
              v-if="can('fraternidades')"
              @click="setVista('solicitudes_inscripcion')"
              :class="vistaActual === 'solicitudes_inscripcion' ? 'bg-slate-50 text-primary border-l-4 border-l-secondary font-bold' : 'text-slate-600 hover:bg-slate-50 border-l-4 border-l-transparent'"
              class="w-full flex items-center gap-3 px-4 py-3 rounded-r-xl transition-all text-left"
            >
              <span class="material-symbols-outlined text-[20px]" :class="vistaActual === 'solicitudes_inscripcion' ? 'text-secondary' : 'text-slate-400'">mark_email_unread</span>
              <span class="text-sm">Solicitudes Inscripción</span>
            </button>

            <button
              v-if="can('fraternidades')"
              @click="setVista('fraternidades_crud')"
              :class="vistaActual === 'fraternidades_crud' ? 'bg-slate-50 text-primary border-l-4 border-l-secondary font-bold' : 'text-slate-600 hover:bg-slate-50 border-l-4 border-l-transparent'"
              class="w-full flex items-center gap-3 px-4 py-3 rounded-r-xl transition-all text-left"
            >
              <span class="material-symbols-outlined text-[20px]" :class="vistaActual === 'fraternidades_crud' ? 'text-secondary' : 'text-slate-400'">groups</span>
              <span class="text-sm">Fraternidades</span>
            </button>

            <button
              v-if="can('fraternidades')"
              @click="setVista('organizacion_crud')"
              :class="vistaActual === 'organizacion_crud' ? 'bg-slate-50 text-primary border-l-4 border-l-secondary font-bold' : 'text-slate-600 hover:bg-slate-50 border-l-4 border-l-transparent'"
              class="w-full flex items-center gap-3 px-4 py-3 rounded-r-xl transition-all text-left"
            >
              <span class="material-symbols-outlined text-[20px]" :class="vistaActual === 'organizacion_crud' ? 'text-secondary' : 'text-slate-400'">account_balance</span>
              <span class="text-sm">Organización</span>
            </button>

            <button
              v-if="can('reglamento')"
              @click="setVista('reglamento')"
              :class="vistaActual === 'reglamento' ? 'bg-slate-50 text-primary border-l-4 border-l-secondary font-bold' : 'text-slate-600 hover:bg-slate-50 border-l-4 border-l-transparent text-left transition-all'"
              class="w-full flex items-center gap-3 px-4 py-3 rounded-r-xl transition-all"
            >
              <span class="material-symbols-outlined text-[20px]" :class="vistaActual === 'reglamento' ? 'text-secondary' : 'text-slate-400'">menu_book</span>
              <span class="text-sm">Reglamento</span>
            </button>

            <!-- DELEGADO: Inscripción -->
            <button
              v-if="can('inscripcion_fraternidad')"
              @click="setVista('inscripcion_fraternidad')"
              :class="vistaActual === 'inscripcion_fraternidad' ? 'bg-slate-50 text-secondary border-l-4 border-l-primary font-bold' : 'text-slate-600 hover:bg-slate-50 border-l-4 border-l-transparent'"
              class="w-full flex items-center gap-3 px-4 py-3 rounded-r-xl transition-all text-left"
            >
              <span class="material-symbols-outlined text-[20px]" :class="vistaActual === 'inscripcion_fraternidad' ? 'text-primary' : 'text-slate-400'">app_registration</span>
              <span class="text-sm font-bold">Inscribir Fraternidad</span>
            </button>

            <button
              v-if="can('auditoria_reportes')"
              @click="setVista('auditoria_reportes')"
              :class="vistaActual === 'auditoria_reportes' ? 'bg-slate-50 text-primary border-l-4 border-l-secondary font-bold' : 'text-slate-600 hover:bg-slate-50 border-l-4 border-l-transparent text-left transition-all'"
              class="w-full flex items-center gap-3 px-4 py-3 rounded-r-xl transition-all text-left mt-1"
            >
              <span class="material-symbols-outlined text-[20px]" :class="vistaActual === 'auditoria_reportes' ? 'text-secondary' : 'text-slate-400'">fact_check</span>
              <span class="text-sm">Auditoría y Reportes</span>
            </button>

            <p v-if="can('ajustes') || can('gestion_sistema')" class="text-[9px] font-black text-slate-400 uppercase tracking-widest px-4 mt-6 mb-2">Configuración</p>
            
            <!-- Menú Acordeón: Gestión Usuarios -->
            <div v-if="can('gestion_usuarios')" class="w-full">
              <button
                @click="gestionUsuariosOpen = !gestionUsuariosOpen"
                :class="vistaActual.startsWith('usuarios_') ? 'bg-slate-50 text-primary border-l-4 border-l-secondary font-bold' : 'text-slate-600 hover:bg-slate-50 border-l-4 border-l-transparent'"
                class="w-full flex items-center justify-between px-4 py-3 rounded-r-xl transition-all text-left"
              >
                <div class="flex items-center gap-3">
                  <span class="material-symbols-outlined text-[20px]" :class="vistaActual.startsWith('usuarios_') ? 'text-secondary' : 'text-slate-400'">manage_accounts</span>
                  <span class="text-sm font-bold">Gestión Usuarios</span>
                </div>
                <span class="material-symbols-outlined text-slate-400 text-lg transition-transform duration-300" :class="gestionUsuariosOpen ? 'rotate-180' : ''">expand_more</span>
              </button>

              <div 
                v-show="gestionUsuariosOpen"
                class="flex flex-col gap-1 mx-4 mt-1 mb-2 pl-6 border-l-2 border-slate-100 overflow-hidden transition-all"
              >
                <button
                  v-if="can('gestion_admin')"
                  @click="setVista('usuarios_admin')"
                  :class="vistaActual === 'usuarios_admin' ? 'text-secondary font-bold' : 'text-slate-500 hover:text-primary'"
                  class="flex items-center gap-2 py-2 text-xs transition-colors text-left w-full"
                >
                  <span class="material-symbols-outlined text-[16px]">shield_person</span>
                  Administradores
                </button>
                <button
                  @click="setVista('usuarios_controladorhcu')"
                  :class="vistaActual === 'usuarios_controladorhcu' ? 'text-secondary font-bold' : 'text-slate-500 hover:text-primary'"
                  class="flex items-center gap-2 py-2 text-xs transition-colors text-left w-full"
                >
                  <span class="material-symbols-outlined text-[16px]">admin_panel_settings</span>
                  Controladores HCU
                </button>
                <button
                  @click="setVista('usuarios_delegado')"
                  :class="vistaActual === 'usuarios_delegado' ? 'text-secondary font-bold' : 'text-slate-500 hover:text-primary'"
                  class="flex items-center gap-2 py-2 text-xs transition-colors text-left w-full"
                >
                  <span class="material-symbols-outlined text-[16px]">assignment_ind</span>
                  Delegados
                </button>
                <button
                  @click="setVista('usuarios_jurado')"
                  :class="vistaActual === 'usuarios_jurado' ? 'text-secondary font-bold' : 'text-slate-500 hover:text-primary'"
                  class="flex items-center gap-2 py-2 text-xs transition-colors text-left w-full"
                >
                  <span class="material-symbols-outlined text-[16px]">gavel</span>
                  Jurados
                </button>
              </div>
            </div>

            <button
              v-if="can('asistencias')"
              @click="setVista('asistencias')"
              :class="vistaActual === 'asistencias' ? 'bg-slate-50 text-primary border-l-4 border-l-secondary font-bold' : 'text-slate-600 hover:bg-slate-50 border-l-4 border-l-transparent text-left transition-all'"
              class="w-full flex items-center gap-3 px-4 py-3 rounded-r-xl transition-all"
            >
              <span class="material-symbols-outlined text-[20px]" :class="vistaActual === 'asistencias' ? 'text-secondary' : 'text-slate-400'">groups</span>
              <span class="text-sm font-bold">Directorio Delegados</span>
            </button>

            <button
              v-if="can('disciplina')"
              @click="setVista('seleccionar_fase_disciplina')"
              :class="vistaActual === 'seleccionar_fase_disciplina' ? 'bg-slate-50 text-primary border-l-4 border-l-secondary font-bold' : 'text-slate-600 hover:bg-slate-50 border-l-4 border-l-transparent text-left transition-all'"
              class="w-full flex items-center gap-3 px-4 py-3 rounded-r-xl transition-all"
            >
              <span class="material-symbols-outlined text-[20px]" :class="vistaActual === 'seleccionar_fase_disciplina' ? 'text-secondary' : 'text-slate-400'">gavel</span>
              <span class="text-sm font-bold">Control Disciplina</span>
            </button>

            <button
              v-if="can('subir_monografia')"
              @click="setVista('subir_monografia')"
              :class="vistaActual === 'subir_monografia' ? 'bg-slate-50 text-secondary border-l-4 border-l-primary font-bold' : 'text-slate-600 hover:bg-slate-50 border-l-4 border-l-transparent'"
              class="w-full flex items-center gap-3 px-4 py-3 rounded-r-xl transition-all text-left"
            >
              <span class="material-symbols-outlined text-[20px]" :class="vistaActual === 'subir_monografia' ? 'text-primary' : 'text-slate-400'">description</span>
              <span class="text-sm font-bold">Subir Monografía</span>
            </button>


            <button
              v-if="can('enviar_mensaje')"
              @click="setVista('enviar_mensaje')"
              :class="vistaActual === 'enviar_mensaje' ? 'bg-slate-50 text-primary border-l-4 border-l-secondary font-bold' : 'text-slate-600 hover:bg-slate-50 border-l-4 border-l-transparent text-left transition-all'"
              class="w-full flex items-center gap-3 px-4 py-3 rounded-r-xl transition-all"
            >
              <span class="material-symbols-outlined text-[20px]" :class="vistaActual === 'enviar_mensaje' ? 'text-secondary' : 'text-slate-400'">mail</span>
              <span class="text-sm font-bold">Enviar un Mensaje</span>
            </button>

            <button
              v-if="can('ajustes')"
              @click="setVista('ajustes')"
              :class="vistaActual === 'ajustes' ? 'bg-slate-50 text-primary border-l-4 border-l-secondary font-bold' : 'text-slate-600 hover:bg-slate-50 border-l-4 border-l-transparent text-left transition-all'"
              class="w-full flex items-center gap-3 px-4 py-3 rounded-r-xl transition-all"
            >
              <span class="material-symbols-outlined text-[20px] text-slate-400">settings</span>
              <span class="text-sm">Ajustes</span>
            </button>

            <button
              @click="handleLogout"
              class="w-full flex items-center gap-3 px-4 py-3 rounded-r-xl text-slate-600 hover:bg-red-50 border-l-4 border-l-transparent hover:text-secondary text-left transition-all"
            >
              <span class="material-symbols-outlined text-[20px] text-slate-400">logout</span>
              <span class="text-sm">Cerrar sesión</span>
            </button>
          </nav>

          <!-- User Profile -->
          <div class="mt-auto pt-6 border-t border-slate-100 dark:border-slate-700">
            <div class="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-600 shadow-[2px_2px_0px_0px_#e2e8f0] dark:shadow-none">
              <div class="flex items-center gap-3 mb-3">
                <div class="size-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 border-2 border-slate-200">
                  <span class="material-symbols-outlined text-2xl">account_circle</span>
                </div>
                <div>
                  <p class="text-sm font-bold text-primary">{{ currentUser ? currentUser.nombres : 'Cargando...' }}</p>
                  <p class="text-[10px] text-slate-500 uppercase font-black tracking-tighter">{{ currentUser ? currentUser.rol : '-' }}</p>
                </div>
              </div>
              <v-progress-linear model-value="65" color="secondary" height="6" rounded class="bg-slate-100 mb-1"></v-progress-linear>
              <p class="text-[10px] text-slate-500 text-right font-bold">65% Completado</p>
            </div>
          </div>
        </div>
      </aside>

      <!-- Overlay for mobile sidebar -->
      <div
        v-if="sidebarOpen"
        @click="sidebarOpen = false"
        class="fixed inset-0 bg-black/30 z-30 lg:hidden"
      ></div>

      <!-- ===== MAIN CONTENT ===== -->
      <div class="flex-1 flex flex-col overflow-hidden min-w-0">

        <!-- Top Bar -->
        <header class="h-14 sm:h-16 flex items-center justify-between px-4 sm:px-6 md:px-8 border-b border-slate-200 dark:border-slate-700 bg-white/95 dark:bg-slate-900/95 shrink-0 z-20 gap-2">
          <div class="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
            <button @click="sidebarOpen = !sidebarOpen" class="lg:hidden shrink-0 text-slate-600 hover:text-primary transition-colors p-1">
              <span class="material-symbols-outlined text-2xl">menu</span>
            </button>

            <div class="flex items-center gap-1.5 sm:gap-2 text-sm min-w-0 overflow-hidden">
              <span class="hidden sm:inline text-secondary font-black uppercase tracking-wider text-[10px] bg-secondary/10 px-2 py-1 rounded shrink-0">Evaluación</span>
              <span class="hidden sm:inline text-slate-300 shrink-0">/</span>
              <span class="font-bold text-primary text-xs sm:text-sm truncate">{{ tituloVista }}</span>
              <template v-if="fraternidadSeleccionada">
                <span class="hidden md:inline text-slate-300 shrink-0">/</span>
                <span class="hidden md:inline font-medium text-slate-500 text-xs truncate">{{ fraternidadSeleccionada.nombre }}</span>
              </template>
            </div>
          </div>

          <div class="flex items-center gap-2 shrink-0">
            <div class="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 bg-white rounded-lg border border-slate-200 shadow-sm">
              <span class="material-symbols-outlined text-secondary text-base sm:text-[18px]">timer</span>
              <span class="text-xs sm:text-sm font-black text-slate-700 tracking-wider tabular-nums">{{ timer }}</span>
            </div>
          </div>
        </header>

        <!-- Scroll Area -->
        <main class="flex-1 overflow-y-auto overflow-x-hidden bg-transparent min-w-0">
          <!-- Citaciones privadas para delegados -->
          <div
            v-if="esDelegado && citasDelegado.length > 0"
            class="mx-4 sm:mx-6 md:mx-8 mt-4 sm:mt-6"
          >
            <div class="bg-amber-50 border border-amber-200 rounded-2xl p-4 sm:p-5">
              <div class="flex items-center gap-2 mb-3">
                <span class="material-symbols-outlined text-amber-700">mail</span>
                <h3 class="text-xs font-black uppercase tracking-widest text-amber-900">Tus citaciones privadas</h3>
              </div>
              <ul class="space-y-2">
                <li
                  v-for="cita in citasDelegado"
                  :key="cita.idEvento"
                  class="bg-white/80 rounded-xl px-3 py-2.5 border border-amber-100"
                >
                  <p class="text-sm font-black text-slate-800 uppercase italic">{{ cita.nombre }}</p>
                  <p class="text-[11px] text-slate-500 font-medium mt-0.5">
                    {{ formatearCitaDelegado(cita.fechaHora) }}
                    <span v-if="cita.ubicacion"> · {{ cita.ubicacion }}</span>
                  </p>
                </li>
              </ul>
            </div>
          </div>

          <transition name="slide-fade" mode="out-in">

            <!-- Vista: Estadísticas -->
            <EstadisticasView
              v-if="vistaActual === 'estadisticas'"
              key="estadisticas"
              @ir-calificar="setVista('seleccionar_fase')"
            />

            <!-- Vista: Nueva Selección Inteligente de Fase -->
            <div v-else-if="vistaActual === 'seleccionar_fase'" key="seleccionar_fase">
              <SeleccionarFaseJuradoView tipoConcurso="EFU" @fase-seleccionada="entrarFase" />
            </div>

            <div v-else-if="vistaActual === 'seleccionar_fase_disciplina'" key="seleccionar_fase_disciplina">
              <SeleccionarFaseJuradoView tipoConcurso="EFU" :solo-disciplina="true" @fase-seleccionada="entrarFase" />
            </div>
            
            <div v-else-if="vistaActual === 'seleccionar_concurso'" key="seleccionar_concurso">
              <SeleccionarFaseJuradoView tipoConcurso="EXTERNO" @fase-seleccionada="entrarFaseConcurso" />
            </div>

            <!-- Vista: Listado de Evaluación por Fase -->
            <ListadoEvaluacionFaseView
              v-else-if="vistaActual === 'listado_fase'"
              key="listado_fase"
              :fase-seleccionada="activeFaseJurado"
              @volver="setVista('seleccionar_fase')"
              @evaluar-fraternidad="iniciarWizard"
            />

            <!-- Vista: Gestiones Anuales (Admin) - Nivel Maestro -->
            <GestionesAnualesView
              v-else-if="vistaActual === 'gestion_fases'"
              key="gestion_fases_maestro"
              @seleccionar-gestion="(g) => { gestionSeleccionada = g; authStore.setGestionContext(g.idGestion); vistaActual = 'gestion_fases_detalle' }"
              @ir-ajustes-gestion="(id) => { gestionParaAjustes = id; ajustesInitialTab = 'cronogramas'; authStore.setGestionContext(id); vistaActual = 'ajustes' }"
            />

            <!-- Vista: Fases de una Gestión (Admin) - Nivel Detalle -->
            <GestionFasesView
              v-else-if="vistaActual === 'gestion_fases_detalle'"
              key="gestion_fases_detalle"
              :gestion-seleccionada="gestionSeleccionada"
              @volver="() => { gestionSeleccionada = null; vistaActual = 'gestion_fases' }"
              @gestionar-criterios="(f) => { faseSeleccionada = f; vistaActual = 'gestion_criterios_detalle' }"
            />

            <!-- Vista: Gestión Criterios (Admin) - Nivel Sub-Detalle -->
            <GestionCriteriosView
              v-else-if="vistaActual === 'gestion_criterios_detalle'"
              key="gestion_criterios_detalle"
              :fase="faseSeleccionada"
              :es-activa="gestionSeleccionada ? gestionSeleccionada.activa !== false : true"
              @volver="() => { faseSeleccionada = null; vistaActual = 'gestion_fases_detalle' }"
            />

            <!-- Vista: Wizard de Evaluación -->
            <div v-else-if="vistaActual === 'wizard' && activeFaseJurado && activeFraternidadJurado" key="wizard">
               <AsistenteContent 
                 :fase-seleccionada="activeFaseJurado" 
                 :fraternidad="activeFraternidadJurado" 
                 @volver="vistaActual = 'listado_fase'"
                 @finalizar="manejarFinalizacion"
               />
            </div>

            <div v-else-if="vistaActual === 'listado_competidores'" key="listado_competidores">
              <ListadoCompetidoresView 
                v-if="activeFaseJurado" 
                :fase="activeFaseJurado" 
                @volver="setVista('seleccionar_concurso')"
                @evaluar-participante="iniciarWizardConcurso"
              />
            </div>

            <div v-else-if="vistaActual === 'wizard_concurso' && activeFaseJurado" key="wizard_concurso">
               <AsistenteContent 
                 :fase-seleccionada="activeFaseJurado" 
                 :fraternidad="activeFraternidadJurado" 
                 :participanteNombre="activeParticipanteNombre"
                 :participanteTipo="activeParticipanteTipo"
                 :participanteId="activeParticipanteId"
                 @volver="vistaActual = 'listado_competidores'"
                 @finalizar="manejarFinalizacion"
               />
            </div>

            <!-- Vista: CRUD Participantes Externos (Delegado/Admin) -->
            <DelegadoParticipantesView
              v-else-if="vistaActual === 'participantes_concurso'"
              key="participantes_concurso"
            />

            <!-- Vista: CRUD Fraternidades (Admin/SuperUser) -->
            <FraternidadesCRUDView
              v-else-if="vistaActual === 'fraternidades_crud'"
              key="fraternidades_crud"
            />

            <DirectivaFraternidadView
              v-else-if="vistaActual === 'directiva_fraternidad' && directivaFraternidadId"
              :key="`directiva-${directivaFraternidadId}`"
              :id-fraternidad="directivaFraternidadId"
            />

            <OrganizacionCRUDView
              v-else-if="vistaActual === 'organizacion_crud'"
              key="organizacion_crud"
            />

            <!-- Vista: Usuarios CRUD Múltiple (Filtrado por rolFiltro) -->
            <UsuariosCRUDView
              v-else-if="vistaActual.startsWith('usuarios_')"
              :key="vistaActual"
              :rol-filtro="vistaActual.replace('usuarios_', '')"
            />

            <!-- Vista: Auditoría y Reportes -->
            <AuditoriaReportesView
              v-else-if="vistaActual === 'auditoria_reportes'"
              key="auditoria_reportes"
            />

            <!-- Vista: Enviar Mensaje (Admin) -->
            <EnviarMensajeView
              v-else-if="vistaActual === 'enviar_mensaje'"
              key="enviar_mensaje"
            />

            <!-- Vista: Ajustes del Sistema -->
            <AjustesView
              v-else-if="vistaActual === 'ajustes'"
              :key="`ajustes-${gestionParaAjustes || 'activa'}-${ajustesInitialTab}`"
              :gestion-id="gestionParaAjustes"
              :initial-tab="ajustesInitialTab"
            />

            <!-- Vista: Inscripción de Fraternidad (Delegado) -->
            <InscribirFraternidadView 
              v-else-if="vistaActual === 'inscripcion_fraternidad'" 
              :key="`inscripcion-${currentUser?.idUsuario}`"
            />

            <!-- Vista: Reglamento (todos los roles) -->
            <ReglamentoView
              v-else-if="vistaActual === 'reglamento'"
              key="reglamento"
            />

            <!-- Vista: Solicitudes de Inscripción (Admin) -->
            <SolicitudesInscripcionView
              v-else-if="vistaActual === 'solicitudes_inscripcion'"
              key="solicitudes_inscripcion"
            />

            <!-- Vista: Subir Monografía (Delegado) -->
            <SubirMonografiaView
              v-else-if="vistaActual === 'subir_monografia'"
              key="subir_monografia"
            />

            <AsistenciaView
              v-else-if="vistaActual === 'asistencias'"
              key="asistencias"
            />

          </transition>
        </main>

        <!-- MODAL: CAMBIO DE CONTRASEÑA OBLIGATORIO (PRIMER LOGIN) -->
        <v-dialog 
          v-model="mostrarModalPass" 
          max-width="520" 
          max-height="90dvh"
          scrollable
          persistent
          no-click-animation
        >
          <v-card class="rounded-2xl overflow-hidden border-4 border-primary shadow-2xl flex flex-col max-h-[90dvh]">
            <div class="bg-primary p-6 text-white text-center shrink-0">
              <div class="size-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-white/50">
                <span class="material-symbols-outlined text-4xl">lock_reset</span>
              </div>
              <h3 class="text-2xl font-black italic uppercase tracking-tighter">Seguridad Requerida</h3>
              <p class="text-white/80 text-sm font-medium mt-1">Este es tu primer inicio de sesión. Crea una contraseña segura para continuar.</p>
            </div>

            <v-card-text class="pa-8 bg-white overflow-y-auto flex-1 min-h-0">
              <div class="mb-6 bg-amber-50 border border-amber-200 p-4 rounded-xl flex items-start gap-3">
                <span class="material-symbols-outlined text-amber-600">info</span>
                <p class="text-xs text-amber-800 font-medium">
                  Tu contraseña actual es tu número de carnet. Cámbiala por una combinación segura que solo tú conozcas.
                </p>
              </div>

              <div class="space-y-5">
                <div>
                  <label class="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">Nueva contraseña</label>
                  <div class="relative">
                    <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">lock</span>
                    <input 
                      v-model="newPassword" 
                      :type="showNewPass ? 'text' : 'password'" 
                      placeholder="Mínimo 8 caracteres"
                      autocomplete="new-password"
                      class="w-full pl-10 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-sm transition-all font-bold"
                    />
                    <button type="button" @click="showNewPass = !showNewPass" class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-primary transition-colors">
                      <span class="material-symbols-outlined text-lg">{{ showNewPass ? 'visibility_off' : 'visibility' }}</span>
                    </button>
                  </div>
                  <div v-if="newPassword" class="mt-3">
                    <div class="flex gap-1 mb-2">
                      <div
                        v-for="i in 4"
                        :key="i"
                        class="h-1.5 flex-1 rounded-full transition-colors duration-300"
                        :class="i <= passStrength.level ? passStrengthBarClass : 'bg-slate-200'"
                      />
                    </div>
                    <p v-if="passStrength.label" class="text-[10px] font-bold uppercase tracking-widest mb-2" :class="passStrengthTextClass">
                      {{ passStrength.label }}
                    </p>
                    <ul class="space-y-1">
                      <li
                        v-for="rule in passPolicyRules"
                        :key="rule.label"
                        class="text-[10px] flex items-center gap-1.5 transition-colors"
                        :class="rule.ok ? 'text-emerald-600' : 'text-slate-400'"
                      >
                        <span class="material-symbols-outlined text-[14px]">{{ rule.ok ? 'check_circle' : 'radio_button_unchecked' }}</span>
                        {{ rule.label }}
                      </li>
                    </ul>
                  </div>
                </div>

                <div>
                  <label class="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">Confirmar contraseña</label>
                  <div class="relative">
                    <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">check_circle</span>
                    <input 
                      v-model="confirmPassword" 
                      :type="showConfirmPass ? 'text' : 'password'" 
                      placeholder="Repite la contraseña"
                      autocomplete="new-password"
                      class="w-full pl-10 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-sm transition-all font-bold"
                      :class="{'border-red-300 bg-red-50': confirmPassword && newPassword !== confirmPassword}"
                    />
                    <button type="button" @click="showConfirmPass = !showConfirmPass" class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-primary transition-colors">
                      <span class="material-symbols-outlined text-lg">{{ showConfirmPass ? 'visibility_off' : 'visibility' }}</span>
                    </button>
                  </div>
                  <p v-if="confirmPassword && newPassword === confirmPassword" class="text-[10px] text-emerald-600 font-bold mt-2 flex items-center gap-1">
                    <span class="material-symbols-outlined text-sm">check_circle</span>
                    Las contraseñas coinciden
                  </p>
                  <p v-else-if="confirmPassword && newPassword !== confirmPassword" class="text-[10px] text-red-500 font-bold mt-2 flex items-center gap-1 uppercase tracking-widest">
                    <span class="material-symbols-outlined text-sm">error</span>
                    Las contraseñas no coinciden
                  </p>
                </div>
              </div>

              <transition name="fade">
                <p v-if="passError" class="text-secondary text-xs font-bold mt-4 flex items-center gap-1">
                  <span class="material-symbols-outlined text-sm">error</span> {{ passError }}
                </p>
              </transition>
            </v-card-text>

            <v-card-actions class="pa-6 bg-slate-50 border-t border-slate-100 shrink-0">
              <button 
                @click="actualizarPassword"
                :disabled="changingPass || !canChangePassword"
                class="w-full bg-primary hover:bg-blue-900 text-white font-black py-4 rounded-xl shadow-lg shadow-primary/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:grayscale uppercase text-[10px] tracking-widest"
              >
                <span v-if="changingPass" class="material-symbols-outlined animate-spin">progress_activity</span>
                <span v-else class="material-symbols-outlined">lock_reset</span>
                {{ changingPass ? 'Procesando...' : 'Cambiar y Empezar' }}
              </button>
            </v-card-actions>
          </v-card>
        </v-dialog>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../store/auth'
import api from '../services/api'
import { notify } from '../utils/notify'
import Swal from 'sweetalert2'
import EstadisticasView from './EstadisticasView.vue'
import SeleccionarFaseJuradoView from './SeleccionarFaseJuradoView.vue'
import ListadoEvaluacionFaseView from './ListadoEvaluacionFaseView.vue'
import GestionesAnualesView from './GestionesAnualesView.vue'
import GestionFasesView from './GestionFasesView.vue'
import GestionCriteriosView from './GestionCriteriosView.vue'
import AsistenteContent from './AsistenteContent.vue'
import FraternidadesCRUDView from './FraternidadesCRUDView.vue'
import UsuariosCRUDView from './UsuariosCRUDView.vue'
import ListadoCompetidoresView from './ListadoCompetidoresView.vue'
import DelegadoParticipantesView from './DelegadoParticipantesView.vue'
import OrganizacionCRUDView from './OrganizacionCRUDView.vue'
import EnviarMensajeView from './EnviarMensajeView.vue'
import AuditoriaReportesView from './AuditoriaReportesView.vue'
import AjustesView from './AjustesView.vue'
import InscribirFraternidadView from './InscribirFraternidadView.vue'
import ReglamentoView from './ReglamentoView.vue'
import SolicitudesInscripcionView from './SolicitudesInscripcionView.vue'
import AsistenciaView from './AsistenciaView.vue'
import DirectivaFraternidadView from './DirectivaFraternidadView.vue'
import SubirMonografiaView from './SubirMonografiaView.vue'

import { getImageUrl } from '../utils/url'
import { applySiteTitle } from '../utils/siteTitle'
import { isPasswordPolicyValid, getPasswordPolicyErrors, getPasswordStrength } from '../utils/passwordPolicy'
import { useTheme } from 'vuetify'

const router = useRouter()
const authStore = useAuthStore()
const vuetifyTheme = useTheme()

// State
const siteInfo = ref({})
const vistaActual = ref('estadisticas')
const directivaFraternidadId = computed(() => {
  const raw = router.currentRoute.value.query.idFraternidad
  const id = Number(raw)
  return Number.isFinite(id) && id > 0 ? id : null
})
const sidebarOpen = ref(false)
const gestionUsuariosOpen = ref(false)
const gestionEventoOpen = ref(false)
const fraternidadSeleccionada = ref(null)
const faseSeleccionada = ref(null)
const gestionSeleccionada = ref(null)  // Maestro → Detalle de Gestión
const gestionParaAjustes = ref(null)
const ajustesInitialTab = ref('general')

const activeFaseJurado = ref(null)
const activeFraternidadJurado = ref(null)
const activeParticipanteNombre = ref(null)
const activeParticipanteTipo = ref(null)
const activeParticipanteId = ref(null)

// Control Cambio Password Primer Login
const mostrarModalPass = ref(false)
const newPassword = ref('')
const confirmPassword = ref('')
const showNewPass = ref(false)
const showConfirmPass = ref(false)
const passError = ref('')
const changingPass = ref(false)

// User data from store
const currentUser = computed(() => authStore.user)
const esDelegado = computed(() => authStore.userRole?.toLowerCase() === 'delegado')
const citasDelegado = ref([])

const formatearCitaDelegado = (fechaHora) => {
  if (!fechaHora) return ''
  return new Date(fechaHora).toLocaleString('es-BO', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const cargarCitasDelegado = async () => {
  if (!esDelegado.value) return
  try {
    const { data } = await api.get('/asistencias/mis-citas')
    citasDelegado.value = Array.isArray(data) ? data : []
  } catch {
    citasDelegado.value = []
  }
}

const canChangePassword = computed(() =>
  isPasswordPolicyValid(newPassword.value, currentUser.value?.ci || '') &&
  newPassword.value === confirmPassword.value
)

const passStrength = computed(() => getPasswordStrength(newPassword.value, currentUser.value?.ci || ''))

const passStrengthBarClass = computed(() => {
  if (passStrength.value.level >= 4) return 'bg-emerald-500'
  if (passStrength.value.level >= 2) return 'bg-amber-500'
  return 'bg-red-500'
})

const passStrengthTextClass = computed(() => {
  if (passStrength.value.level >= 4) return 'text-emerald-600'
  if (passStrength.value.level >= 2) return 'text-amber-600'
  return 'text-red-500'
})

const passPolicyRules = computed(() => {
  const pwd = newPassword.value
  const ci = currentUser.value?.ci || ''
  return [
    { label: 'Mínimo 8 caracteres', ok: pwd.length >= 8 },
    { label: 'Al menos una mayúscula', ok: /[A-Z]/.test(pwd) },
    { label: 'Al menos una minúscula', ok: /[a-z]/.test(pwd) },
    { label: 'Al menos un número', ok: /[0-9]/.test(pwd) },
    { label: 'No igual al CI', ok: !ci || pwd.trim() !== ci.trim() },
  ]
})

// Role-based permissions logic
const can = (permission) => {
  const role = authStore.userRole?.toLowerCase()
  const permissions = {
    superusuario: ['estadisticas', 'calificar', 'evaluar', 'fraternidades', 'gestionar_participantes', 'reglamento', 'ajustes', 'enviar_mensaje', 'auditoria', 'auditoria_reportes', 'gestion_sistema', 'gestion_evento', 'asistencias', 'disciplina', 'gestion_usuarios', 'gestion_admin'],
    admin: ['estadisticas', 'calificar', 'evaluar', 'fraternidades', 'gestionar_participantes', 'reglamento', 'ajustes', 'enviar_mensaje', 'auditoria_reportes', 'gestion_evento', 'asistencias', 'disciplina', 'gestion_usuarios'],
    jurado: ['estadisticas', 'calificar', 'evaluar', 'reglamento'],
    controladorhcu: ['estadisticas', 'reglamento', 'asistencias', 'disciplina'],
    delegado: ['estadisticas', 'reglamento', 'subir_monografia', 'gestionar_participantes', 'inscripcion_fraternidad']
  }
  return permissions[role]?.includes(permission) || false
}

// Timer logic — cuenta regresiva de inactividad (se reinicia con actividad)
const timerSegundos = ref(authStore.remainingIdleSeconds)
let timerInterval = null
const timer = computed(() => {
  const total = Math.max(0, timerSegundos.value)
  const m = Math.floor(total / 60)
  const s = total % 60
  return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`
})

onMounted(async () => {
  document.documentElement.classList.remove('dark')
  localStorage.theme = 'light'
  vuetifyTheme.global.name.value = 'umsa'

  timerInterval = setInterval(() => {
    timerSegundos.value = authStore.remainingIdleSeconds
  }, 1000)

  // Cargar info del sitio
  try {
    const { data } = await api.get('/evaluaciones/gestion-activa')
    if (data) {
      data.urlLogo = getImageUrl(data.urlLogo)
      siteInfo.value = data
      if (data.idGestion) {
        authStore.setGestionContext(data.idGestion)
      }
      applySiteTitle(data.nombreSitio)
    }
  } catch (err) {
    console.warn('Error al cargar info del sitio')
  }

  // Chequear si es primer login
  if (currentUser.value?.primerLogin) {
    mostrarModalPass.value = true
  }

  // Cargar vista desde URL si existe
  const queryVista = router.currentRoute.value.query.v
  if (queryVista) {
    vistaActual.value = queryVista
  }

  // Vista inicial según rol (si no hay query)
  if (!queryVista && authStore.userRole?.toLowerCase() === 'delegado') {
    vistaActual.value = 'inscripcion_fraternidad'
  }

  await cargarCitasDelegado()
})

// Sincronizar vista con URL para habilitar flechas de navegación
watch(() => router.currentRoute.value.query.v, (newV) => {
  if (newV && newV !== vistaActual.value) {
    vistaActual.value = newV
  }
})

const actualizarPassword = async () => {
  passError.value = ''
  const ci = currentUser.value?.ci || ''
  if (!isPasswordPolicyValid(newPassword.value, ci)) {
    passError.value = getPasswordPolicyErrors(newPassword.value, ci).join('. ') + '.'
    return
  }
  if (newPassword.value !== confirmPassword.value) {
    passError.value = 'Las contraseñas no coinciden.'
    return
  }

  changingPass.value = true
  try {
    await api.post('/auth/change-password', { newPassword: newPassword.value })
    authStore.updatePrimerLogin(false)
    mostrarModalPass.value = false
    notify.success('¡Contraseña Actualizada!', 'Tu acceso ahora es seguro y privado.')
  } catch (error) {
    passError.value = error.response?.data?.message || 'Error al cambiar la contraseña. Inténtalo de nuevo.'
  } finally {
    changingPass.value = false
  }
}
onUnmounted(() => {
  clearInterval(timerInterval)
})

const tituloVista = computed(() => {
  if (vistaActual.value.startsWith('usuarios_')) {
    const rol = vistaActual.value.replace('usuarios_', '')
    if (rol === 'admin') return 'Gestión de Administradores'
    if (rol === 'controladorhcu') return 'Gestión de Controladores HCU'
    return `Gestión de ${rol.charAt(0).toUpperCase() + rol.slice(1)}s`
  }

  const titulos = {
    estadisticas: 'Panel de Estadísticas',
    seleccionar_fase: 'Calificación de Fraternidades',
    seleccionar_concurso: 'Calificación de Concursos',
    fraternidades_crud: 'Listado de Fraternidades',
    directiva_fraternidad: 'Directiva de Fraternidad',
    listado_fase: 'Listado de Fraternidades por Fase',
    listado_competidores: 'Listado de Competidores',
    wizard: 'Evaluación de Fraternidad',
    wizard_concurso: 'Evaluación de Concurso',
    gestion_fases: 'Gestiones Anuales',
    organizacion_crud: 'Gestión de Facultades y Carreras',
    gestion_fases_detalle: gestionSeleccionada.value ? `Gestión ${gestionSeleccionada.value.anio} — Fases` : 'Fases de Evaluación',
    gestion_criterios_detalle: faseSeleccionada.value ? `Fase: ${faseSeleccionada.value.nombre} — Criterios` : 'Criterios de Evaluación',
    ajustes: 'Ajustes del Sistema',
    enviar_mensaje: 'Enviar un Mensaje',
    auditoria_reportes: 'Auditoría y Reportes',
    inscripcion_fraternidad: 'Formulario de Inscripción de Fraternidad',
    reglamento: 'Reglamentos y Documentos Oficiales',
    solicitudes_inscripcion: 'Solicitudes de Preinscripción',
    asistencias: 'Directorio de Delegados',
    subir_monografia: 'Subir Monografía',
    seleccionar_fase_disciplina: 'Control de Disciplina HCU'
  }

  return titulos[vistaActual.value] || ''
})

const setVista = (vista) => {
  vistaActual.value = vista
  // Actualizar URL para habilitar navegación del navegador
  router.push({ query: { ...router.currentRoute.value.query, v: vista } })
  
  fraternidadSeleccionada.value = null
  activeFraternidadJurado.value = null
  activeParticipanteNombre.value = null
  activeParticipanteTipo.value = null
  activeParticipanteId.value = null
  gestionSeleccionada.value = null
  faseSeleccionada.value = null
  if (vista === 'ajustes') {
    gestionParaAjustes.value = null
    ajustesInitialTab.value = 'general'
  }
  sidebarOpen.value = false
}

const entrarFase = (fase) => {
  activeFaseJurado.value = fase
  activeParticipanteNombre.value = null
  activeParticipanteTipo.value = null
  vistaActual.value = 'listado_fase'
}

const entrarFaseConcurso = (fase) => {
  activeFaseJurado.value = fase
  activeParticipanteNombre.value = null
  activeParticipanteTipo.value = null
  vistaActual.value = 'listado_competidores'
}

const iniciarWizard = (data) => {
  if (data.fase) {
    activeFaseJurado.value = { ...activeFaseJurado.value, ...data.fase }
  }
  activeFraternidadJurado.value = data.fraternidad
  activeParticipanteNombre.value = null
  activeParticipanteTipo.value = null
  activeParticipanteId.value = null
  vistaActual.value = 'wizard'
}

const iniciarWizardConcurso = ({ idParticipante, participanteNombre, participanteTipo, idFraternidad, fraternidadNombre }) => {
  activeParticipanteId.value = idParticipante
  activeParticipanteNombre.value = participanteNombre
  activeParticipanteTipo.value = participanteTipo
  // Opcional: cargar fraternidad si existe
  activeFraternidadJurado.value = idFraternidad ? { idFraternidad, nombre: fraternidadNombre } : null
  vistaActual.value = 'wizard_concurso'
}

const manejarFinalizacion = (resultados) => {
  console.log('Resultados finales:', resultados)
  notify.success('Acta Sellada con Éxito', `Calificaciones guardadas. Promedio: ${resultados.promedio.toFixed(1)}/100`)
  setVista('estadisticas')
}

const handleLogout = () => {
  authStore.logout()
  router.replace('/login')
}
</script>


<style scoped>
.andean-pattern {
  background-color: #ffffff;
  background-image: linear-gradient(rgba(255,255,255,0.75), rgba(255,255,255,0.75)), url('@/assets/img/Textura-Andina.png');
  background-repeat: repeat;
  background-size: 500px;
  background-attachment: fixed;
}

:global(html.dark) .andean-pattern {
  background-color: #0f172a;
  background-image: linear-gradient(rgba(15, 23, 42, 0.92), rgba(15, 23, 42, 0.92)), url('@/assets/img/Textura-Andina.png');
}

.slide-fade-enter-active,
.slide-fade-leave-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}
.slide-fade-enter-from {
  opacity: 0;
  transform: translateX(16px);
}
.slide-fade-leave-to {
  opacity: 0;
  transform: translateX(-16px);
}

.fade-enter-active, .fade-leave-active { transition: opacity 0.25s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
