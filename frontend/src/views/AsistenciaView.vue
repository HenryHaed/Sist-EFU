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

    <!-- Modal crear evento -->
    <div
      v-if="modalEvento"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
      @click.self="cerrarModalEvento"
    >
      <div class="bg-white w-full max-w-md rounded-3xl overflow-hidden shadow-2xl p-8">
        <div class="flex items-start justify-between gap-4 mb-6">
          <div>
            <h3 class="font-black uppercase tracking-tight text-xl text-primary italic underline decoration-secondary decoration-4 underline-offset-4">
              Crear evento
            </h3>
            <p class="text-[10px] font-medium text-slate-500 mt-2">
              Se citará por correo a todos los delegados del sistema. Debe asistir al menos uno por fraternidad.
            </p>
          </div>
          <button type="button" @click="cerrarModalEvento" class="text-slate-400 hover:text-slate-600">
            <span class="material-symbols-outlined">close</span>
          </button>
        </div>

        <div class="space-y-4">
          <div>
            <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 px-1">Evento</label>
            <input
              v-model="formEvento.nombre"
              type="text"
              placeholder="Ej: Reunión de delegados"
              class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none focus:border-primary transition-all"
            />
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 px-1">Fecha</label>
              <input
                v-model="formEvento.fecha"
                type="date"
                class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none focus:border-primary transition-all"
              />
            </div>
            <div>
              <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 px-1">Hora</label>
              <input
                v-model="formEvento.hora"
                type="time"
                class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none focus:border-primary transition-all"
              />
            </div>
          </div>
          <div>
            <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 px-1">Ubicación</label>
            <input
              v-model="formEvento.ubicacion"
              type="text"
              placeholder="Ej: Auditorio HCU, UMSA"
              class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none focus:border-primary transition-all"
            />
          </div>
        </div>

        <div class="mt-6 p-4 rounded-2xl bg-amber-50 border border-amber-100">
          <p class="text-[10px] text-amber-800 font-medium leading-relaxed">
            Al confirmar, el sistema enviará un correo automático solo a los usuarios con rol <strong>delegado</strong>.
            La inasistencia de titular y suplente puede sancionarse con <strong>−3 pts</strong> en disciplina.
          </p>
        </div>

        <div class="mt-8 flex gap-3">
          <button
            type="button"
            @click="cerrarModalEvento"
            class="flex-1 py-3 text-slate-400 font-bold uppercase text-[10px] tracking-widest hover:bg-slate-50 rounded-2xl transition-colors"
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
            {{ creandoEvento ? 'Enviando citaciones...' : 'Crear y citar delegados' }}
          </button>
        </div>
      </div>
    </div>
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
  return fecha ? `${ev.nombre} — ${fecha}${lugar}` : ev.nombre
}

const abrirModalEvento = () => {
  formEvento.nombre = ''
  formEvento.fecha = ''
  formEvento.hora = ''
  formEvento.ubicacion = ''
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
    })

    await fetchEventos()
    if (data.evento?.idEvento) {
      eventoSeleccionado.value = data.evento.idEvento
    }

    const avisoFallos = data.fallidos > 0
      ? ` (${data.fallidos} correo(s) fallaron)`
      : ''
    mostrarMensaje(
      `Evento creado. Citación enviada a ${data.enviados} delegado(s)${avisoFallos}`,
      data.fallidos > 0 ? 'error' : 'success',
    )
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
