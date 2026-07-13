<template>
  <div class="dashboard-page max-w-7xl animate-in fade-in duration-500">
    <div class="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <h2 class="text-2xl font-black italic uppercase tracking-tighter text-primary flex items-center gap-2">
          <span class="material-symbols-outlined text-3xl">groups</span>
          Directorio de Delegados
        </h2>
        <p class="text-slate-500 text-sm font-medium">
          Delegados titular y suplente por fraternidad. Si asiste al menos uno, la fraternidad queda presente.
        </p>
      </div>

      <div class="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
        <button
          type="button"
          @click="abrirModalEvento"
          class="w-full sm:w-auto px-5 py-3 bg-secondary hover:bg-amber-700 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-secondary/20 transition-all flex items-center justify-center gap-2"
        >
          <span class="material-symbols-outlined text-lg">event</span>
          Crear evento
        </button>
        <select
          v-model="eventoSeleccionado"
          class="w-full sm:min-w-[260px] px-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 outline-none focus:border-primary shadow-sm"
        >
          <option :value="null" disabled>Seleccionar evento</option>
          <option v-for="ev in eventos" :key="ev.idEvento" :value="ev.idEvento">
            {{ etiquetaEvento(ev) }}
          </option>
        </select>
        <div class="relative w-full md:w-72">
          <span class="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">search</span>
          <input
            v-model="search"
            type="text"
            placeholder="Buscar fraternidad o delegado..."
            class="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all shadow-sm font-medium text-sm"
          />
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <div class="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-4">
        <div class="size-12 bg-indigo-50 text-primary rounded-2xl flex items-center justify-center">
          <span class="material-symbols-outlined">domain</span>
        </div>
        <div>
          <p class="text-[10px] font-black uppercase text-slate-400 tracking-widest">Fraternidades</p>
          <p class="text-2xl font-black text-slate-800">{{ fraternidades.length }}</p>
        </div>
      </div>
      <div class="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-4">
        <div class="size-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center">
          <span class="material-symbols-outlined">person_check</span>
        </div>
        <div>
          <p class="text-[10px] font-black uppercase text-slate-400 tracking-widest">Delegados Registrados</p>
          <p class="text-2xl font-black text-slate-800">{{ totalDelegados }}</p>
        </div>
      </div>
      <div class="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-4">
        <div class="size-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center">
          <span class="material-symbols-outlined">filter_list</span>
        </div>
        <div>
          <p class="text-[10px] font-black uppercase text-slate-400 tracking-widest">Resultados</p>
          <p class="text-2xl font-black text-slate-800">{{ filteredFraternidades.length }}</p>
        </div>
      </div>
    </div>

    <div v-if="loading" class="py-20 flex flex-col items-center justify-center">
      <span class="material-symbols-outlined animate-spin text-4xl text-primary mb-4">progress_activity</span>
      <p class="text-slate-400 font-bold uppercase tracking-widest text-xs">Cargando delegados...</p>
    </div>

    <div v-else-if="filteredFraternidades.length === 0" class="py-20 text-center">
      <div class="size-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300 border-2 border-dashed border-slate-200">
        <span class="material-symbols-outlined text-4xl">person_search</span>
      </div>
      <h3 class="text-lg font-bold text-slate-400 uppercase tracking-widest">No se encontraron fraternidades</h3>
    </div>

    <div v-else class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div
        v-for="frat in filteredFraternidades"
        :key="frat.idFraternidad"
        class="group bg-white rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-500 overflow-hidden"
      >
        <div class="bg-gradient-to-r from-primary/5 to-indigo-50 px-6 py-5 border-b border-slate-100 flex items-center justify-between">
          <div class="flex flex-col">
            <span class="text-[9px] font-black uppercase text-secondary tracking-widest mb-1">{{ frat.categoria }}</span>
            <h3 class="font-black text-slate-800 uppercase italic tracking-tight leading-none group-hover:text-primary transition-colors text-sm">
              {{ frat.nombreFraternidad }}
            </h3>
          </div>
          <div class="size-10 bg-white rounded-xl shadow-sm border border-slate-100 flex items-center justify-center text-primary">
            <span class="material-symbols-outlined text-xl">account_balance</span>
          </div>
        </div>

        <div class="p-6 space-y-4">
          <div
            v-for="rol in ['titular', 'suplente']"
            :key="rol"
            v-show="frat[rol]"
            class="flex items-start gap-4 p-4 rounded-2xl border border-slate-100 bg-slate-50/70"
          >
            <div class="size-11 rounded-xl bg-indigo-50 flex items-center justify-center text-primary border border-indigo-100 shrink-0">
              <span class="material-symbols-outlined text-xl">person</span>
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-0.5">
                Delegado {{ rol === 'titular' ? 'Titular' : 'Suplente' }}
              </p>
              <p class="text-sm font-black text-slate-800 uppercase tracking-tight leading-tight truncate">
                {{ frat[rol].nombre }}
              </p>
              <p class="text-[10px] font-medium text-slate-500">CI: {{ frat[rol].ci }}</p>
              <p class="text-[10px] font-medium text-slate-500">Cel: {{ frat[rol].celular || 'Sin número' }}</p>
            </div>
            <label v-if="eventoSeleccionado" class="flex flex-col items-center gap-1 shrink-0 cursor-pointer">
              <input
                type="checkbox"
                v-model="asistenciaForm[frat.idFraternidad][rol]"
                class="size-5 accent-emerald-600 rounded"
              />
              <span class="text-[8px] font-black uppercase text-emerald-700 tracking-widest">Presente</span>
            </label>
          </div>

          <div v-if="eventoSeleccionado" class="pt-2 border-t border-slate-100 flex flex-col gap-3">
            <p class="text-[10px] text-slate-400 font-medium italic">
              Basta con que asista el titular o el suplente para marcar presente a la fraternidad.
              Si ninguno asiste, se aplican −3 pts en disciplina (10% de 30).
            </p>
            <button
              @click="guardarAsistencia(frat)"
              :disabled="guardando[frat.idFraternidad]"
              class="w-full py-3 bg-primary hover:bg-red-800 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <span v-if="guardando[frat.idFraternidad]" class="material-symbols-outlined animate-spin text-sm">progress_activity</span>
              Registrar Asistencia
            </button>
          </div>

          <div v-else class="py-2 text-center">
            <p class="text-[10px] font-bold uppercase text-amber-600 tracking-widest">Selecciona un evento para registrar asistencia</p>
          </div>
        </div>
      </div>
    </div>

    <transition name="toast">
      <div
        v-if="mensaje"
        class="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-2xl shadow-2xl font-black text-sm flex items-center gap-2"
        :class="mensaje.tipo === 'error' ? 'bg-secondary text-white' : 'bg-emerald-600 text-white'"
      >
        <span class="material-symbols-outlined text-lg">{{ mensaje.tipo === 'error' ? 'error' : 'check_circle' }}</span>
        {{ mensaje.texto }}
      </div>
    </transition>

    <!-- Modal crear evento (Teleport: evita offset por transform del dashboard) -->
    <Teleport to="body">
      <div
        v-if="modalEvento"
        class="fixed inset-0 z-[200] flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto overscroll-contain"
        @click.self="cerrarModalEvento"
      >
        <div
          class="bg-white w-full max-w-[calc(100vw-1.5rem)] sm:max-w-md rounded-2xl sm:rounded-3xl shadow-2xl my-auto max-h-[min(92dvh,900px)] flex flex-col overflow-hidden"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-crear-evento-titulo"
        >
          <div class="shrink-0 flex items-start justify-between gap-3 px-4 pt-5 pb-3 sm:px-6 sm:pt-6 sm:pb-4 border-b border-slate-100">
            <div class="min-w-0">
              <h3
                id="modal-crear-evento-titulo"
                class="font-black uppercase tracking-tight text-lg sm:text-xl text-primary italic underline decoration-secondary decoration-4 underline-offset-4"
              >
                Crear evento
              </h3>
              <p class="text-[10px] font-medium text-slate-500 mt-2 leading-relaxed">
                Elige si el evento será público en el landing o privado solo para delegados.
              </p>
            </div>
            <button
              type="button"
              @click="cerrarModalEvento"
              class="shrink-0 size-9 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <span class="material-symbols-outlined">close</span>
            </button>
          </div>

          <div class="flex-1 overflow-y-auto overscroll-contain px-4 py-4 sm:px-6 sm:py-5 space-y-4">
            <div>
              <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Visibilidad</label>
              <div class="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 gap-2">
                <button
                  type="button"
                  @click="formEvento.esPublico = false"
                  class="px-3 py-3 rounded-2xl border-2 text-left transition-all"
                  :class="!formEvento.esPublico
                    ? 'border-primary bg-primary/5 shadow-sm'
                    : 'border-slate-200 bg-slate-50 hover:border-slate-300'"
                >
                  <p class="text-[10px] font-black uppercase tracking-widest" :class="!formEvento.esPublico ? 'text-primary' : 'text-slate-500'">Privado</p>
                  <p class="text-[9px] text-slate-500 font-medium mt-1 leading-snug">Solo delegados · correo + cuenta</p>
                </button>
                <button
                  type="button"
                  @click="formEvento.esPublico = true"
                  class="px-3 py-3 rounded-2xl border-2 text-left transition-all"
                  :class="formEvento.esPublico
                    ? 'border-primary bg-primary/5 shadow-sm'
                    : 'border-slate-200 bg-slate-50 hover:border-slate-300'"
                >
                  <p class="text-[10px] font-black uppercase tracking-widest" :class="formEvento.esPublico ? 'text-primary' : 'text-slate-500'">Público</p>
                  <p class="text-[9px] text-slate-500 font-medium mt-1 leading-snug">Visible en el landing</p>
                </button>
              </div>
            </div>

            <div>
              <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 px-1">Evento</label>
              <input
                v-model="formEvento.nombre"
                type="text"
                placeholder="Ej: Reunión de delegados"
                class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none focus:border-primary transition-all text-sm"
              />
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 px-1">Fecha</label>
                <input
                  v-model="formEvento.fecha"
                  type="date"
                  class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none focus:border-primary transition-all text-sm"
                />
              </div>
              <div>
                <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 px-1">Hora</label>
                <input
                  v-model="formEvento.hora"
                  type="time"
                  class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none focus:border-primary transition-all text-sm"
                />
              </div>
            </div>
            <div>
              <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 px-1">Ubicación</label>
              <input
                v-model="formEvento.ubicacion"
                type="text"
                placeholder="Ej: Auditorio HCU, UMSA"
                class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none focus:border-primary transition-all text-sm"
              />
            </div>
            <div v-if="formEvento.esPublico">
              <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 px-1">Descripción (opcional)</label>
              <textarea
                v-model="formEvento.descripcion"
                rows="2"
                maxlength="1000"
                placeholder="Texto breve para el panel de eventos del landing..."
                class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl font-medium outline-none focus:border-primary transition-all resize-none text-sm"
              ></textarea>
            </div>

            <div
              class="p-3 sm:p-4 rounded-2xl border"
              :class="formEvento.esPublico ? 'bg-sky-50 border-sky-100' : 'bg-amber-50 border-amber-100'"
            >
              <p
                class="text-[10px] font-medium leading-relaxed"
                :class="formEvento.esPublico ? 'text-sky-800' : 'text-amber-800'"
              >
                <template v-if="formEvento.esPublico">
                  El evento aparecerá en el <strong>panel Eventos</strong> del landing para el público.
                  No se enviará citación por correo a delegados.
                </template>
                <template v-else>
                  Se enviará un correo automático a usuarios con rol <strong>delegado</strong>
                  y quedará disponible en sus cuentas al ingresar.
                  La inasistencia de titular y suplente puede sancionarse con <strong>−3 pts</strong> en disciplina.
                </template>
              </p>
            </div>
          </div>

          <div class="shrink-0 flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 px-4 py-4 sm:px-6 border-t border-slate-100 bg-white pb-[max(1rem,env(safe-area-inset-bottom))]">
            <button
              type="button"
              @click="cerrarModalEvento"
              class="flex-1 py-3 text-slate-500 font-bold uppercase text-[10px] tracking-widest hover:bg-slate-50 rounded-2xl transition-colors"
            >
              Cancelar
            </button>
            <button
              type="button"
              @click="crearEvento"
              :disabled="!formEventoValido || creandoEvento"
              class="flex-[2] py-3 bg-primary text-white font-black uppercase text-[10px] tracking-widest rounded-2xl shadow-lg shadow-primary/20 hover:brightness-110 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <span v-if="creandoEvento" class="material-symbols-outlined animate-spin text-sm">progress_activity</span>
              <template v-if="creandoEvento">
                {{ formEvento.esPublico ? 'Publicando...' : 'Enviando citaciones...' }}
              </template>
              <template v-else>
                {{ formEvento.esPublico ? 'Publicar en landing' : 'Crear y citar delegados' }}
              </template>
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, reactive, watch } from 'vue'
import api from '../services/api'

const loading = ref(true)
const search = ref('')
const fraternidades = ref([])
const eventos = ref([])
const eventoSeleccionado = ref(null)
const guardando = reactive({})
const asistenciaForm = reactive({})
const mensaje = ref(null)
const modalEvento = ref(false)
const creandoEvento = ref(false)
const formEvento = reactive({
  nombre: '',
  fecha: '',
  hora: '',
  ubicacion: '',
  descripcion: '',
  esPublico: false,
})

const PENALIZACION_DISCIPLINA = 3

const formEventoValido = computed(() =>
  formEvento.nombre.trim() && formEvento.fecha && formEvento.hora && formEvento.ubicacion.trim()
)

const etiquetaEvento = (ev) => {
  if (!ev) return ''
  const fecha = ev.fechaHora
    ? new Date(ev.fechaHora).toLocaleString('es-BO', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : ''
  const lugar = ev.ubicacion ? ` · ${ev.ubicacion}` : ''
  const modo = ev.esPublico ? ' · Público' : ' · Privado'
  return fecha ? `${ev.nombre} — ${fecha}${lugar}${modo}` : `${ev.nombre}${modo}`
}

const abrirModalEvento = () => {
  formEvento.nombre = ''
  formEvento.fecha = ''
  formEvento.hora = ''
  formEvento.ubicacion = ''
  formEvento.descripcion = ''
  formEvento.esPublico = false
  modalEvento.value = true
}

const cerrarModalEvento = () => {
  if (creandoEvento.value) return
  modalEvento.value = false
}

const totalDelegados = computed(() =>
  fraternidades.value.reduce((acc, f) => acc + (f.titular ? 1 : 0) + (f.suplente ? 1 : 0), 0)
)

const filteredFraternidades = computed(() => {
  if (!search.value) return fraternidades.value
  const q = search.value.toLowerCase()
  return fraternidades.value.filter(f =>
    f.nombreFraternidad?.toLowerCase().includes(q) ||
    f.titular?.nombre?.toLowerCase().includes(q) ||
    f.suplente?.nombre?.toLowerCase().includes(q) ||
    f.titular?.ci?.toLowerCase().includes(q) ||
    f.suplente?.ci?.toLowerCase().includes(q)
  )
})

const initForm = () => {
  fraternidades.value.forEach(f => {
    if (!asistenciaForm[f.idFraternidad]) {
      asistenciaForm[f.idFraternidad] = { titular: false, suplente: false }
    }
  })
}

const fetchEventos = async () => {
  const res = await api.get('/asistencias/eventos')
  eventos.value = res.data
}

const fetchData = async () => {
  loading.value = true
  try {
    const [resDelegados] = await Promise.all([
      api.get('/asistencias/delegados'),
      fetchEventos(),
    ])
    fraternidades.value = resDelegados.data
    if (eventos.value.length > 0 && !eventoSeleccionado.value) {
      eventoSeleccionado.value = eventos.value[0].idEvento
    }
    initForm()
  } catch (err) {
    console.error('Error fetching delegados:', err)
  } finally {
    loading.value = false
  }
}

const crearEvento = async () => {
  if (!formEventoValido.value || creandoEvento.value) return

  creandoEvento.value = true
  try {
    const fechaHora = new Date(`${formEvento.fecha}T${formEvento.hora}:00`)
    const { data } = await api.post('/asistencias/eventos', {
      nombre: formEvento.nombre.trim(),
      fechaHora: fechaHora.toISOString(),
      ubicacion: formEvento.ubicacion.trim(),
      descripcion: formEvento.descripcion.trim() || undefined,
      esPublico: !!formEvento.esPublico,
    })

    await fetchEventos()
    if (data.evento?.idEvento) {
      eventoSeleccionado.value = data.evento.idEvento
    }

    if (data.modo === 'publico' || formEvento.esPublico) {
      mostrarMensaje('Evento público creado. Ya aparece en el panel Eventos del landing.', 'success')
    } else {
      const avisoFallos = data.fallidos > 0
        ? ` (${data.fallidos} correo(s) fallaron)`
        : ''
      mostrarMensaje(
        `Evento privado creado. Citación enviada a ${data.enviados} delegado(s)${avisoFallos}`,
        data.fallidos > 0 ? 'error' : 'success',
      )
    }
    modalEvento.value = false
  } catch (err) {
    const msg = Array.isArray(err.response?.data?.message)
      ? err.response.data.message.join(', ')
      : err.response?.data?.message || 'No se pudo crear el evento'
    mostrarMensaje(msg, 'error')
  } finally {
    creandoEvento.value = false
  }
}

const mostrarMensaje = (texto, tipo = 'success') => {
  mensaje.value = { texto, tipo }
  setTimeout(() => { mensaje.value = null }, 3000)
}

const guardarAsistencia = async (frat) => {
  if (!eventoSeleccionado.value) return

  const form = asistenciaForm[frat.idFraternidad]
  guardando[frat.idFraternidad] = true

  try {
    const { data } = await api.post('/asistencias/registrar', {
      idFraternidad: frat.idFraternidad,
      idEvento: eventoSeleccionado.value,
      titularAsistio: !!form.titular,
      suplenteAsistio: !!form.suplente,
    })

    if (data.sancion) {
      mostrarMensaje(
        `${frat.nombreFraternidad}: inasistencia registrada (−${PENALIZACION_DISCIPLINA} pts disciplina)`,
        'error',
      )
    } else {
      mostrarMensaje(`${frat.nombreFraternidad}: asistencia registrada correctamente`)
    }
  } catch (err) {
    mostrarMensaje(err.response?.data?.message || 'No se pudo registrar la asistencia', 'error')
  } finally {
    guardando[frat.idFraternidad] = false
  }
}

watch(fraternidades, initForm)

onMounted(fetchData)
</script>

<style scoped>
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
.animate-in { animation: fadeIn 0.5s ease-out forwards; }

.toast-enter-active, .toast-leave-active { transition: all 0.3s ease; }
.toast-enter-from, .toast-leave-to { opacity: 0; transform: translate(-50%, 20px); }
</style>
