<template>
  <div class="andean-pattern min-h-screen font-display">
    <div class="flex h-screen overflow-hidden">

      <!-- ===== SIDEBAR ===== -->
      <aside
        :class="sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'"
        class="fixed lg:relative z-40 w-72 bg-white border-r border-slate-200 flex flex-col h-full shrink-0 transition-transform duration-300"
      >
        <div class="p-6 flex flex-col h-full overflow-y-auto">
          <!-- Logo/Brand -->
          <div class="flex items-center gap-3 mb-10">
            <div class="size-10 bg-primary rounded-lg flex items-center justify-center text-white font-black text-xl shadow-[2px_2px_0px_0px_rgba(200,16,46,1)] border-2 border-primary">
              <span class="material-symbols-outlined text-xl">account_balance</span>
            </div>
            <div>
              <h1 class="font-black text-lg leading-tight tracking-tight text-primary uppercase">UMS<span class="text-secondary">A</span></h1>
              <p class="text-[9px] text-slate-500 uppercase tracking-widest font-black leading-none mt-1">Entrada Folklórica Universitaria</p>
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
              @click="setVista('fraternidades_crud')"
              :class="vistaActual === 'fraternidades_crud' ? 'bg-slate-50 text-primary border-l-4 border-l-secondary font-bold' : 'text-slate-600 hover:bg-slate-50 border-l-4 border-l-transparent'"
              class="w-full flex items-center gap-3 px-4 py-3 rounded-r-xl transition-all text-left"
            >
              <span class="material-symbols-outlined text-[20px]" :class="vistaActual === 'fraternidades_crud' ? 'text-secondary' : 'text-slate-400'">groups</span>
              <span class="text-sm">Fraternidades</span>
            </button>

            <button
              v-if="can('reglamento')"
              class="w-full flex items-center gap-3 px-4 py-3 rounded-r-xl text-slate-600 hover:bg-slate-50 border-l-4 border-l-transparent text-left transition-all"
            >
              <span class="material-symbols-outlined text-[20px] text-slate-400">menu_book</span>
              <span class="text-sm">Reglamento</span>
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
              v-if="can('gestion_sistema')"
              class="w-full flex items-center gap-3 px-4 py-3 rounded-r-xl text-slate-600 hover:bg-slate-50 border-l-4 border-l-transparent text-left transition-all"
            >
              <span class="material-symbols-outlined text-[20px] text-slate-400">admin_panel_settings</span>
              <span class="text-sm font-bold">Gestión Sistema</span>
            </button>

            <button
              v-if="can('asistencias')"
              class="w-full flex items-center gap-3 px-4 py-3 rounded-r-xl text-slate-600 hover:bg-slate-50 border-l-4 border-l-transparent text-left transition-all"
            >
              <span class="material-symbols-outlined text-[20px] text-slate-400">how_to_reg</span>
              <span class="text-sm font-bold">Control Asistencia</span>
            </button>

            <button
              v-if="can('disciplina')"
              class="w-full flex items-center gap-3 px-4 py-3 rounded-r-xl text-slate-600 hover:bg-slate-50 border-l-4 border-l-transparent text-left transition-all"
            >
              <span class="material-symbols-outlined text-[20px] text-slate-400">gavel</span>
              <span class="text-sm font-bold">Control Disciplina</span>
            </button>

            <button
              v-if="can('informes')"
              class="w-full flex items-center gap-3 px-4 py-3 rounded-r-xl text-slate-600 hover:bg-slate-50 border-l-4 border-l-transparent text-left transition-all"
            >
              <span class="material-symbols-outlined text-[20px] text-slate-400">description</span>
              <span class="text-sm font-bold">Enviar Informes</span>
            </button>

            <button
              v-if="can('ajustes')"
              class="w-full flex items-center gap-3 px-4 py-3 rounded-r-xl text-slate-600 hover:bg-slate-50 border-l-4 border-l-transparent text-left transition-all"
            >
              <span class="material-symbols-outlined text-[20px] text-slate-400">settings</span>
              <span class="text-sm">Ajustes</span>
            </button>

            <button
              @click="handleLogout"
              class="w-full flex items-center gap-3 px-4 py-3 rounded-r-xl text-slate-600 hover:bg-red-50 border-l-4 border-l-transparent hover:text-secondary text-left transition-all"
            >
              <span class="material-symbols-outlined text-[20px] text-slate-400">logout</span>
              <span class="text-sm">Cerrar Sesión</span>
            </button>
          </nav>

          <!-- User Profile -->
          <div class="mt-auto pt-6 border-t border-slate-100">
            <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-[2px_2px_0px_0px_#e2e8f0]">
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
        <header class="h-16 flex items-center justify-between px-6 md:px-8 border-b border-slate-200 bg-white/95 shrink-0 z-20">
          <div class="flex items-center gap-4">
            <button @click="sidebarOpen = !sidebarOpen" class="lg:hidden text-slate-600 hover:text-primary transition-colors">
              <span class="material-symbols-outlined">menu</span>
            </button>

            <!-- Breadcrumb / vista actual -->
            <div class="flex items-center gap-2 text-sm">
              <span class="text-secondary font-black uppercase tracking-wider text-xs bg-secondary/10 px-2 py-1 rounded">Evaluación</span>
              <span class="text-slate-300">/</span>
              <span class="font-bold text-primary text-sm">{{ tituloVista }}</span>
              <template v-if="fraternidadSeleccionada">
                <span class="text-slate-300">/</span>
                <span class="font-medium text-slate-500 text-xs">{{ fraternidadSeleccionada.nombre }}</span>
              </template>
            </div>
          </div>

          <div class="flex items-center gap-3">
            <!-- Search -->
            <button class="size-9 rounded-lg flex items-center justify-center text-slate-500 hover:text-primary hover:bg-slate-100 transition-colors">
              <span class="material-symbols-outlined text-[20px]">search</span>
            </button>
            <!-- Notifications -->
            <button class="size-9 rounded-lg flex items-center justify-center text-slate-500 bg-white hover:text-secondary transition-colors border border-slate-200 relative">
              <span class="material-symbols-outlined text-[20px]">notifications</span>
              <span class="absolute top-1.5 right-1.5 size-2 bg-secondary rounded-full border-2 border-white"></span>
            </button>
            <!-- Timer -->
            <div class="hidden sm:flex items-center gap-2 px-3 py-2 bg-white rounded-lg border border-slate-200 shadow-sm">
              <span class="material-symbols-outlined text-secondary text-[18px]">timer</span>
              <span class="text-sm font-black text-slate-700 tracking-wider">{{ timer }}</span>
            </div>
          </div>
        </header>

        <!-- Scroll Area -->
        <main class="flex-1 overflow-y-auto bg-transparent">
          <transition name="slide-fade" mode="out-in">

            <!-- Vista: Estadísticas -->
            <EstadisticasView
              v-if="vistaActual === 'estadisticas'"
              key="estadisticas"
              @ir-calificar="setVista('fraternidades')"
            />

            <!-- Vista: Nueva Selección Inteligente de Fase -->
            <div v-else-if="vistaActual === 'seleccionar_fase'" key="seleccionar_fase">
              <SeleccionarFaseJuradoView tipoConcurso="EFU" @fase-seleccionada="entrarFase" />
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
              @seleccionar-gestion="(g) => { gestionSeleccionada = g; vistaActual = 'gestion_fases_detalle' }"
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

            <div v-else-if="vistaActual === 'wizard_concurso' && activeFaseJurado && activeFraternidadJurado" key="wizard_concurso">
               <AsistenteContent 
                 :fase-seleccionada="activeFaseJurado" 
                 :fraternidad="activeFraternidadJurado" 
                 :participanteNombre="activeParticipanteNombre"
                 :participanteTipo="activeParticipanteTipo"
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

            <!-- Vista: Usuarios CRUD Múltiple (Filtrado por rolFiltro) -->
            <UsuariosCRUDView
              v-else-if="vistaActual.startsWith('usuarios_')"
              :key="vistaActual"
              :rol-filtro="vistaActual.replace('usuarios_', '')"
            />

          </transition>
        </main>

        <!-- MODAL: CAMBIO DE CONTRASEÑA OBLIGATORIO (PRIMER LOGIN) -->
        <v-dialog 
          v-model="mostrarModalPass" 
          max-width="450" 
          persistent
          no-click-animation
        >
          <v-card class="rounded-2xl overflow-hidden border-4 border-primary shadow-2xl">
            <div class="bg-primary p-6 text-white text-center">
              <div class="size-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-white/50">
                <span class="material-symbols-outlined text-4xl">lock_reset</span>
              </div>
              <h3 class="text-2xl font-black italic uppercase tracking-tighter">Seguridad Requerida</h3>
              <p class="text-white/80 text-sm font-medium mt-1">Este es tu primer inicio de sesión. Por favor, personaliza tu contraseña.</p>
            </div>

            <v-card-text class="pa-8 bg-white">
              <div class="mb-6 bg-amber-50 border border-amber-200 p-4 rounded-xl flex items-start gap-3">
                <span class="material-symbols-outlined text-amber-600">info</span>
                <p class="text-xs text-amber-800 font-medium">
                  Tu contraseña actual es tu número de carnet. Cámbiala por una combinación segura que solo tú conozcas.
                </p>
              </div>

              <div class="space-y-4">
                <div>
                  <label class="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">Nueva Contraseña</label>
                  <div class="relative">
                    <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">lock</span>
                    <input 
                      v-model="newPassword" 
                      type="password" 
                      placeholder="Mínimo 6 caracteres"
                      class="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-primary focus:ring-1 focus:ring-primary outline-none text-sm transition-all"
                    />
                  </div>
                </div>
                <div>
                  <label class="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">Confirmar Contraseña</label>
                  <div class="relative">
                    <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">check_circle</span>
                    <input 
                      v-model="confirmPassword" 
                      type="password" 
                      placeholder="Repite la contraseña"
                      class="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-primary focus:ring-1 focus:ring-primary outline-none text-sm transition-all"
                    />
                  </div>
                </div>
              </div>

              <p v-if="passError" class="text-secondary text-xs font-bold mt-4 flex items-center gap-1">
                <span class="material-symbols-outlined text-sm">error</span> {{ passError }}
              </p>
            </v-card-text>

            <v-card-actions class="pa-6 bg-slate-50 border-t border-slate-100">
              <button 
                @click="actualizarPassword"
                :disabled="changingPass"
                class="w-full bg-primary hover:bg-blue-900 text-white font-black py-4 rounded-xl shadow-lg shadow-primary/20 transition-all flex items-center justify-center gap-2"
                :class="{'opacity-75 cursor-wait': changingPass}"
              >
                <span v-if="changingPass" class="material-symbols-outlined animate-spin">progress_activity</span>
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
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../store/auth'
import api from '../services/api'
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

const router = useRouter()
const authStore = useAuthStore()

// State
const vistaActual = ref('estadisticas')
const sidebarOpen = ref(false)
const gestionUsuariosOpen = ref(false)
const gestionEventoOpen = ref(false)
const fraternidadSeleccionada = ref(null)
const faseSeleccionada = ref(null)
const gestionSeleccionada = ref(null)  // Maestro → Detalle de Gestión

const activeFaseJurado = ref(null)
const activeFraternidadJurado = ref(null)
const activeParticipanteNombre = ref(null)
const activeParticipanteTipo = ref(null)

// Control Cambio Password Primer Login
const mostrarModalPass = ref(false)
const newPassword = ref('')
const confirmPassword = ref('')
const passError = ref('')
const changingPass = ref(false)

// User data from store
const currentUser = computed(() => authStore.user)

// Role-based permissions logic
const can = (permission) => {
  const role = authStore.userRole?.toLowerCase()
  const permissions = {
    superusuario: ['estadisticas', 'calificar', 'evaluar', 'fraternidades', 'gestionar_participantes', 'reglamento', 'ajustes', 'gestion_sistema', 'gestion_evento', 'asistencias', 'disciplina', 'gestion_usuarios', 'gestion_admin'],
    admin: ['estadisticas', 'calificar', 'evaluar', 'fraternidades', 'gestionar_participantes', 'reglamento', 'ajustes', 'gestion_evento', 'asistencias', 'disciplina', 'gestion_usuarios'],
    jurado: ['estadisticas', 'calificar', 'evaluar', 'reglamento'],
    controladorhcu: ['estadisticas', 'reglamento', 'asistencias', 'disciplina'],
    delegado: ['estadisticas', 'reglamento', 'informes', 'gestionar_participantes']
  }
  return permissions[role]?.includes(permission) || false
}

// Timer logic
const timerSegundos = ref(authStore.remainingSessionSeconds)
let timerInterval = null
const timer = computed(() => {
  const h = Math.floor(timerSegundos.value / 3600)
  const m = Math.floor((timerSegundos.value % 3600) / 60)
  const s = timerSegundos.value % 60
  return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`
})

onMounted(() => {
  timerInterval = setInterval(() => { timerSegundos.value-- }, 1000)

  // Chequear si es primer login
  if (currentUser.value?.primerLogin) {
    mostrarModalPass.value = true
  }
})

const actualizarPassword = async () => {
  passError.value = ''
  if (!newPassword.value || newPassword.value.length < 6) {
    passError.value = 'La contraseña debe tener al menos 6 caracteres.'
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
    Swal.fire({
      icon: 'success',
      title: '¡Contraseña Actualizada!',
      text: 'Tu acceso ahora es seguro y privado.',
      confirmButtonColor: '#003399'
    })
  } catch (error) {
    passError.value = 'Error al cambiar la contraseña. Inténtalo de nuevo.'
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
    listado_fase: 'Listado de Fraternidades por Fase',
    listado_competidores: 'Listado de Competidores',
    wizard: 'Evaluación de Fraternidad',
    wizard_concurso: 'Evaluación de Concurso',
    gestion_fases: 'Gestiones Anuales',
    gestion_fases_detalle: gestionSeleccionada.value ? `Gestión ${gestionSeleccionada.value.anio} — Fases` : 'Fases de Evaluación',
    gestion_criterios_detalle: faseSeleccionada.value ? `Fase: ${faseSeleccionada.value.nombre} — Criterios` : 'Criterios de Evaluación',
  }

  return titulos[vistaActual.value] || ''
})

const setVista = (vista) => {
  if (vista !== 'listado_fase' && vista !== 'wizard') {
    fraternidadSeleccionada.value = null
    faseSeleccionada.value = null
  }
  // Resetear gestión al salir del módulo
  if (!vista.startsWith('gestion_fases')) {
    gestionSeleccionada.value = null
  }
  vistaActual.value = vista
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

const iniciarWizard = (fraternidad) => {
  activeFraternidadJurado.value = fraternidad
  activeParticipanteNombre.value = null
  activeParticipanteTipo.value = null
  vistaActual.value = 'wizard'
}

const iniciarWizardConcurso = ({ fraternidad, participanteNombre, participanteTipo }) => {
  activeFraternidadJurado.value = fraternidad
  activeParticipanteNombre.value = participanteNombre
  activeParticipanteTipo.value = participanteTipo
  vistaActual.value = 'wizard_concurso'
}

const manejarFinalizacion = (resultados) => {
  console.log('Resultados finales:', resultados)
  alert(`¡Calificaciones guardadas!\nPromedio: ${resultados.promedio.toFixed(1)}/100`)
  setVista('estadisticas')
}

const handleLogout = () => {
  authStore.logout()
  router.push('/login')
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
</style>
