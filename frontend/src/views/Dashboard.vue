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
              v-if="can('calificar')"
              @click="setVista('fraternidades')"
              :class="(vistaActual === 'fraternidades' || vistaActual === 'fases' || vistaActual === 'wizard') ? 'bg-slate-50 text-primary border-l-4 border-l-secondary font-bold' : 'text-slate-600 hover:bg-slate-50 border-l-4 border-l-transparent'"
              class="w-full flex items-center gap-3 px-4 py-3 rounded-r-xl transition-all text-left"
            >
              <span class="material-symbols-outlined text-[20px]" :class="(vistaActual === 'fraternidades' || vistaActual === 'fases' || vistaActual === 'wizard') ? 'text-secondary' : 'text-slate-400'">grade</span>
              <span class="text-sm">Calificar Fraternidad</span>
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
            
            <button
              v-if="can('gestion_sistema')"
              class="w-full flex items-center gap-3 px-4 py-3 rounded-r-xl text-slate-600 hover:bg-slate-50 border-l-4 border-l-transparent text-left transition-all"
            >
              <span class="material-symbols-outlined text-[20px] text-slate-400">admin_panel_settings</span>
              <span class="text-sm font-bold">Gestión Sistema</span>
            </button>

            <button
              v-if="can('gestion_evento')"
              class="w-full flex items-center gap-3 px-4 py-3 rounded-r-xl text-slate-600 hover:bg-slate-50 border-l-4 border-l-transparent text-left transition-all"
            >
              <span class="material-symbols-outlined text-[20px] text-slate-400">event_available</span>
              <span class="text-sm font-bold">Gestión Evento</span>
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

            <!-- Vista: Seleccionar Fraternidad -->
            <SeleccionarFraternidadView
              v-else-if="vistaActual === 'fraternidades'"
              key="fraternidades"
              @seleccionar-fraternidad="seleccionarFraternidad"
            />

            <!-- Vista: Seleccionar Fase -->
            <EvaluacionFasesContent
              v-else-if="vistaActual === 'fases'"
              key="fases"
              :fraternidad="fraternidadSeleccionada"
              @seleccionar-fase="seleccionarFase"
              @volver="setVista('fraternidades')"
            />

            <!-- Vista: Wizard de Evaluación -->
            <AsistenteContent
              v-else-if="vistaActual === 'wizard'"
              key="wizard"
              :fase-seleccionada="faseSeleccionada"
              :fraternidad="fraternidadSeleccionada"
              @volver="setVista('fases')"
              @finalizar="manejarFinalizacion"
            />

            <!-- Vista: CRUD Fraternidades (Admin/SuperUser) -->
            <FraternidadesCRUDView
              v-else-if="vistaActual === 'fraternidades_crud'"
              key="fraternidades_crud"
            />

          </transition>
        </main>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../store/auth'
import EstadisticasView from './EstadisticasView.vue'
import SeleccionarFraternidadView from './SeleccionarFraternidadView.vue'
import EvaluacionFasesContent from './EvaluacionFasesContent.vue'
import AsistenteContent from './AsistenteContent.vue'
import FraternidadesCRUDView from './FraternidadesCRUDView.vue'

const router = useRouter()
const authStore = useAuthStore()

// State
const vistaActual = ref('estadisticas')
const sidebarOpen = ref(false)
const fraternidadSeleccionada = ref(null)
const faseSeleccionada = ref('')

// User data from store
const currentUser = computed(() => authStore.user)

// Role-based permissions logic
const can = (permission) => {
  const role = authStore.userRole?.toLowerCase()
  const permissions = {
    superusuario: ['estadisticas', 'calificar', 'fraternidades', 'reglamento', 'ajustes', 'gestion_sistema', 'gestion_evento', 'asistencias', 'disciplina'],
    admin: ['estadisticas', 'calificar', 'fraternidades', 'reglamento', 'ajustes', 'gestion_evento', 'asistencias', 'disciplina'],
    jurado: ['estadisticas', 'calificar', 'reglamento'],
    controladorhcu: ['estadisticas', 'reglamento', 'asistencias', 'disciplina'],
    delegado: ['estadisticas', 'reglamento', 'informes']
  }
  return permissions[role]?.includes(permission) || false
}

// Timer logic
const timerSegundos = ref(87 * 60 + 23)
let timerInterval = null
const timer = computed(() => {
  const h = Math.floor(timerSegundos.value / 3600)
  const m = Math.floor((timerSegundos.value % 3600) / 60)
  const s = timerSegundos.value % 60
  return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`
})

onMounted(() => {
  timerInterval = setInterval(() => { timerSegundos.value-- }, 1000)
})
onUnmounted(() => {
  clearInterval(timerInterval)
})

const tituloVista = computed(() => {
  const titulos = {
    estadisticas: 'Panel de Estadísticas',
    fraternidades: 'Calificar Fraternidad',
    fraternidades_crud: 'Listado de Fraternidades',
    fases: 'Selección de Fase',
    wizard: 'Evaluación Wizard',
  }
  return titulos[vistaActual.value] || ''
})

const setVista = (vista) => {
  if (vista !== 'fases' && vista !== 'wizard') {
    fraternidadSeleccionada.value = null
    faseSeleccionada.value = ''
  }
  vistaActual.value = vista
  sidebarOpen.value = false
}

const seleccionarFraternidad = (fraternidad) => {
  fraternidadSeleccionada.value = fraternidad
  vistaActual.value = 'fases'
}

const seleccionarFase = (faseId) => {
  faseSeleccionada.value = faseId
  vistaActual.value = 'wizard'
}

const manejarFinalizacion = (resultados) => {
  console.log('Resultados finales:', resultados)
  alert(`¡Calificaciones de ${fraternidadSeleccionada.value?.nombre} - ${faseSeleccionada.value.toUpperCase()} guardadas!\nPromedio: ${resultados.promedio.toFixed(1)}/100`)
  setVista('fraternidades')
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
