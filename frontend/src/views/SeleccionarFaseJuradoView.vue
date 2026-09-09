<template>
  <div class="dashboard-page max-w-7xl min-h-full">
    <div class="mb-8">
      <h2 class="text-3xl font-black text-primary tracking-tighter uppercase italic">
        {{ tipoConcurso === 'EFU' ? 'Calificar Fases EFU' : 'Concursos Externos' }}
      </h2>
      <p class="text-slate-500 font-medium text-sm mt-1">
        {{ tipoConcurso === 'EFU' ? 'Selecciona el módulo de evaluación de la Entrada Universitaria.' : 'Califica a los participantes de los concursos y actividades externas.' }}
      </p>
    </div>

    <div v-if="loading" class="flex justify-center py-20">
      <span class="material-symbols-outlined animate-spin text-4xl text-primary">progress_activity</span>
    </div>
    
    <div v-else-if="error" class="bg-red-50 p-6 rounded-2xl border border-red-200 text-center">
      <span class="material-symbols-outlined text-4xl text-red-500 mb-2">error</span>
      <h3 class="text-red-800 font-bold">Error al cargar las fases</h3>
      <p class="text-red-600 text-sm mt-1">{{ error }}</p>
      <button @click="cargarFases" class="mt-4 px-4 py-2 bg-red-100 hover:bg-red-200 text-red-800 rounded-lg text-sm font-bold transition-colors">Reintentar</button>
    </div>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div 
        v-for="fase in fases" 
        :key="fase.idFase"
        class="relative bg-white rounded-3xl overflow-hidden border border-slate-200 shadow-sm transition-all group"
        :class="fase.accesible ? 'hover:shadow-xl hover:shadow-primary/10 hover:border-primary/30 cursor-pointer' : 'opacity-80 grayscale-[30%] cursor-not-allowed'"
        @click="fase.accesible ? seleccionarFase(fase) : null"
      >
        <div v-if="!fase.accesible" class="absolute inset-0 bg-slate-900/40 z-10 flex flex-col items-center justify-center backdrop-blur-[2px]">
          <div class="bg-white/90 p-4 rounded-full mb-3 shadow-lg">
            <span class="material-symbols-outlined text-4xl text-secondary">lock</span>
          </div>
          <p class="text-white font-bold px-6 text-center text-sm shadow-black drop-shadow-md">
            {{ fase.mensajeBloqueo || 'No tienes permiso para calificar esta FASE' }}
          </p>
        </div>

        <div class="h-40 bg-slate-100 relative overflow-hidden">
          <img v-if="fase.urlImagen" :src="getImageUrl(fase.urlImagen)" class="w-full h-full object-cover" />
          <div v-else class="absolute inset-0 bg-gradient-to-br from-primary to-blue-900 opacity-90"></div>
          
          <div class="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent flex flex-col justify-end p-5">
            <span class="text-white/60 text-xs font-black tracking-widest uppercase mb-1">Evaluación {{ fase.pesoPorcentaje }}%</span>
            <h3 class="text-2xl font-black text-white leading-tight drop-shadow-sm">{{ fase.nombre }}</h3>
          </div>
        </div>

        <div class="p-5 space-y-3">
          <div class="flex items-center gap-2 text-xs text-slate-500 font-medium">
            <span class="material-symbols-outlined text-sm">calendar_month</span>
            <span>Inicio: {{ formatearFecha(fase.fechaInicio) }}</span>
          </div>
          <p v-if="esChacha(fase) && fase.cupoFinalistas" class="text-[10px] font-black uppercase tracking-widest text-amber-700">
            Cupo finalistas: {{ fase.cupoFinalistas }}
          </p>
          <p v-if="fase.idFasePadre" class="text-[10px] font-black uppercase tracking-widest text-slate-400">
            Fase hija (finalistas)
          </p>

          <button 
            class="w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all active:scale-95"
            :class="fase.accesible ? (tipoConcurso === 'EFU' ? 'bg-primary/5 text-primary hover:bg-primary hover:!text-white shadow-sm hover:shadow-primary/20' : 'bg-secondary/5 text-secondary hover:bg-secondary hover:!text-white shadow-sm hover:shadow-secondary/20') : 'bg-slate-100 text-slate-400'"
          >
            {{ fase.accesible
              ? (tipoConcurso === 'EFU'
                ? 'Ingresar a Calificar'
                : (esChacha(fase) ? 'Ver fraternidades' : 'Ver Participantes'))
              : 'Acceso Restringido' }}
            <span class="material-symbols-outlined text-[20px]">{{ fase.accesible ? 'arrow_forward' : 'block' }}</span>
          </button>

          <template v-if="esAdmin && tipoConcurso === 'EXTERNO' && esChacha(fase) && !fase.idFasePadre">
            <p
              v-if="estadoPorFase[fase.idFase]?.cortePendiente || estadoPorFase[fase.idFase]?.podioPendiente"
              class="text-[10px] text-amber-700 font-bold"
            >
              Empate pendiente
              <span v-if="estadoPorFase[fase.idFase]?.decisorActual">
                · Decisor: {{ estadoPorFase[fase.idFase].decisorActual.nombres }}
              </span>
              <span v-else>· Sin Decisor asignado</span>
            </p>

            <button
              v-if="estadoPorFase[fase.idFase]?.cortePendiente || estadoPorFase[fase.idFase]?.podioPendiente"
              type="button"
              class="w-full py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 border border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100 transition-colors disabled:opacity-50"
              :disabled="!puedeResolverEmpate"
              @click.stop="abrirModalDesempate(fase)"
            >
              <span class="material-symbols-outlined text-[18px]">balance</span>
              {{ puedeResolverEmpate ? 'Resolver desempate' : 'Pendiente de Decisor' }}
            </button>

            <button
              type="button"
              class="w-full py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 border border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              :disabled="promoviendoId === fase.idFase || !estadoPorFase[fase.idFase]?.puedePromover"
              @click.stop="promoverFinalistas(fase)"
            >
              <span class="material-symbols-outlined text-[18px]">upgrade</span>
              {{ promoviendoId === fase.idFase
                ? 'Promoviendo…'
                : (nombreFaseHija(fase) ? `Promover a ${nombreFaseHija(fase)}` : 'Promover finalistas') }}
            </button>
          </template>
        </div>
      </div>
    </div>

    <!-- Modal desempate -->
    <v-dialog v-model="modalDesempate" max-width="640" persistent scrollable>
      <v-card class="rounded-2xl overflow-hidden">
        <v-card-title class="bg-amber-50 border-b border-amber-100 px-5 py-4 flex items-center justify-between">
          <div>
            <p class="text-[10px] font-black uppercase tracking-widest text-amber-700">Desempate</p>
            <h3 class="font-black text-slate-900 text-lg">{{ faseDesempate?.nombre }}</h3>
          </div>
          <button type="button" class="text-slate-400" @click="cerrarModalDesempate">
            <span class="material-symbols-outlined">close</span>
          </button>
        </v-card-title>
        <v-card-text class="px-5 py-4 space-y-5">
          <div v-if="desempateActivo?.tipo === 'CORTE_FINALISTAS'" class="space-y-3">
            <p class="text-sm text-slate-600">
              Marca exactamente <strong>{{ desempateActivo.plazasLibres }}</strong> fraternidad(es) empatada(s) que pasan
              (plazas libres del cupo). No puedes superar el cupo.
            </p>
            <p class="text-xs font-black uppercase tracking-widest"
              :class="pasaCount === desempateActivo.plazasLibres ? 'text-emerald-700' : 'text-amber-700'">
              Plazas: {{ pasaCount }} / {{ desempateActivo.plazasLibres }}
            </p>
            <div
              v-for="c in desempateActivo.candidatos"
              :key="c.idFraternidad"
              class="flex items-center justify-between gap-3 p-3 rounded-xl border border-slate-200"
            >
              <div>
                <p class="font-bold text-slate-800 text-sm">{{ c.nombre }}</p>
                <p class="text-[11px] text-slate-500">Nota: {{ c.nota }}</p>
              </div>
              <label class="flex items-center gap-2 text-xs font-black uppercase tracking-widest cursor-pointer">
                <input
                  type="checkbox"
                  class="size-5 accent-amber-600"
                  :checked="decisionesCorte[c.idFraternidad] === 'PASA'"
                  @change="togglePasa(c.idFraternidad, $event.target.checked)"
                />
                Pasa
              </label>
            </div>
          </div>

          <div v-else-if="desempateActivo?.tipo === 'PODIO'" class="space-y-3">
            <p class="text-sm text-slate-600">
              Asigna puestos 1–{{ desempateActivo.plazasLibres }} entre las empatadas (exactamente {{ desempateActivo.plazasLibres }}).
            </p>
            <div
              v-for="c in desempateActivo.candidatos"
              :key="c.idFraternidad"
              class="flex items-center justify-between gap-3 p-3 rounded-xl border border-slate-200"
            >
              <div>
                <p class="font-bold text-slate-800 text-sm">{{ c.nombre }}</p>
                <p class="text-[11px] text-slate-500">Nota: {{ c.nota }}</p>
              </div>
              <select
                v-model.number="ordenesPodio[c.idFraternidad]"
                class="px-3 py-2 border border-slate-200 rounded-lg text-sm font-bold bg-slate-50"
              >
                <option :value="0">—</option>
                <option
                  v-for="n in desempateActivo.plazasLibres"
                  :key="n"
                  :value="n"
                >
                  {{ n }}°
                </option>
              </select>
            </div>
          </div>
        </v-card-text>
        <v-card-actions class="px-5 py-4 border-t border-slate-100 justify-end gap-2">
          <button type="button" class="px-4 py-2 text-sm font-bold text-slate-600" @click="cerrarModalDesempate">Cancelar</button>
          <button
            type="button"
            class="px-5 py-2.5 rounded-xl bg-amber-600 text-white text-sm font-black disabled:opacity-50"
            :disabled="guardandoDesempate || !desempateValido"
            @click="guardarDesempate"
          >
            {{ guardandoDesempate ? 'Guardando…' : 'Guardar decisión' }}
          </button>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import Swal from 'sweetalert2'
import api from '../services/api'
import { getImageUrl } from '../utils/url'
import { esFaseChachaWarmi } from '../utils/chachaWarmi'
import { useAuthStore } from '../store/auth'
import { notify } from '../utils/notify'

const authStore = useAuthStore()
const esAdmin = computed(() => ['admin', 'superusuario'].includes(authStore.userRole))
const puedeResolverEmpate = computed(
  () => !!authStore.esDecisor || authStore.userRole?.toLowerCase() === 'superusuario',
)

const props = defineProps({
  tipoConcurso: {
    type: String,
    default: 'EFU'
  },
  soloDisciplina: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['fase-seleccionada'])

const fases = ref([])
const loading = ref(true)
const error = ref('')
const promoviendoId = ref(null)
const estadoPorFase = ref({})

const modalDesempate = ref(false)
const faseDesempate = ref(null)
const desempateActivo = ref(null)
const decisionesCorte = ref({})
const ordenesPodio = ref({})
const guardandoDesempate = ref(false)

const esChacha = (fase) => esFaseChachaWarmi(fase)

const pasaCount = computed(() =>
  Object.values(decisionesCorte.value).filter((d) => d === 'PASA').length,
)

const desempateValido = computed(() => {
  const d = desempateActivo.value
  if (!d) return false
  if (d.tipo === 'CORTE_FINALISTAS') {
    const total = (d.candidatos || []).length
    if (Object.keys(decisionesCorte.value).length < total) return false
    return pasaCount.value === d.plazasLibres
  }
  if (d.tipo === 'PODIO') {
    const needed = d.plazasLibres
    const vals = Object.values(ordenesPodio.value).filter((v) => Number(v) >= 1)
    if (vals.length !== needed) return false
    return new Set(vals.map(Number)).size === needed
  }
  return false
})

const nombreFaseHija = (fase) => {
  const est = estadoPorFase.value[fase.idFase]
  return est?.fasesHijas?.[0]?.nombre || null
}

const cargarEstadoFase = async (fase) => {
  if (!esAdmin.value || !esChacha(fase) || fase.idFasePadre) return
  try {
    const { data } = await api.get(`/evaluaciones/fases/${fase.idFase}/estado-promocion`)
    estadoPorFase.value = { ...estadoPorFase.value, [fase.idFase]: data }
  } catch {
    /* ignore */
  }
}

const cargarFases = async () => {
  loading.value = true
  error.value = ''
  try {
    const { data } = await api.get('/evaluaciones/fases-auth')
    fases.value = data.filter(f => {
      const matchType = f.tipoConcurso === props.tipoConcurso
      if (!matchType) return false
      
      if (props.soloDisciplina) {
        return f.nombre.toLowerCase().includes('disciplina')
      }
      return true
    })
    if (esAdmin.value && props.tipoConcurso === 'EXTERNO') {
      await Promise.all(
        fases.value
          .filter((f) => esChacha(f) && !f.idFasePadre)
          .map((f) => cargarEstadoFase(f)),
      )
    }
  } catch (err) {
    error.value = err.response?.data?.message || 'Error de conexión con el servidor.'
  } finally {
    loading.value = false
  }
}

const seleccionarFase = (fase) => {
  emit('fase-seleccionada', fase)
}

const abrirModalDesempate = async (fase) => {
  if (!puedeResolverEmpate.value) {
    notify.error('Sin permiso', 'Solo el Decisor puede resolver empates.')
    return
  }
  await cargarEstadoFase(fase)
  const est = estadoPorFase.value[fase.idFase]
  const des =
    est?.cortePendiente ? est.desempateCorte
      : est?.podioPendiente ? est.desempatePodio
        : null
  if (!des || des.estado !== 'PENDIENTE') {
    notify.error('Sin empate', 'No hay desempate pendiente en esta fase.')
    return
  }
  faseDesempate.value = fase
  desempateActivo.value = des
  decisionesCorte.value = {}
  ordenesPodio.value = {}
  for (const c of des.candidatos || []) {
    if (des.tipo === 'CORTE_FINALISTAS') {
      decisionesCorte.value[c.idFraternidad] =
        c.decision === 'PASA' || c.decision === 'NO_PASA' ? c.decision : 'NO_PASA'
    } else {
      ordenesPodio.value[c.idFraternidad] = c.ordenPodio || 0
    }
  }
  // Prefer corte first if both pending
  if (est.cortePendiente && est.desempateCorte) {
    desempateActivo.value = est.desempateCorte
  }
  modalDesempate.value = true
}

const togglePasa = (idFraternidad, checked) => {
  const plazas = desempateActivo.value?.plazasLibres || 0
  if (checked && pasaCount.value >= plazas && decisionesCorte.value[idFraternidad] !== 'PASA') {
    notify.error('Cupo', `Solo puedes marcar ${plazas} como PASA.`)
    return
  }
  decisionesCorte.value = {
    ...decisionesCorte.value,
    [idFraternidad]: checked ? 'PASA' : 'NO_PASA',
  }
}

const cerrarModalDesempate = () => {
  modalDesempate.value = false
  faseDesempate.value = null
  desempateActivo.value = null
}

const guardarDesempate = async () => {
  if (!desempateValido.value || !desempateActivo.value) return
  guardandoDesempate.value = true
  try {
    const id = desempateActivo.value.idDesempate
    let body = {}
    if (desempateActivo.value.tipo === 'CORTE_FINALISTAS') {
      body = {
        decisiones: Object.entries(decisionesCorte.value).map(([idFraternidad, decision]) => ({
          idFraternidad: Number(idFraternidad),
          decision,
        })),
      }
    } else {
      body = {
        ordenesPodio: Object.entries(ordenesPodio.value)
          .filter(([, ord]) => Number(ord) >= 1)
          .map(([idFraternidad, ordenPodio]) => ({
            idFraternidad: Number(idFraternidad),
            ordenPodio: Number(ordenPodio),
          })),
      }
    }
    const { data } = await api.put(`/evaluaciones/desempates/${id}/resolver`, body)
    const idFase = faseDesempate.value?.idFase
    notify.success('Desempate resuelto', data?.mensaje || 'Decisiones guardadas.')
    cerrarModalDesempate()
    if (idFase) {
      const fase = fases.value.find((f) => f.idFase === idFase)
      if (fase) await cargarEstadoFase(fase)
    } else {
      await cargarFases()
    }
  } catch (e) {
    notify.error('Error', e?.response?.data?.message || 'No se pudo guardar el desempate.')
  } finally {
    guardandoDesempate.value = false
  }
}

const promoverFinalistas = async (fase) => {
  const est = estadoPorFase.value[fase.idFase]
  if (!est?.puedePromover) {
    notify.error(
      'No disponible',
      est?.cortePendiente
        ? 'Hay empate pendiente de Decisor.'
        : 'No se puede promover aún (cupo, fase hija o calificaciones).',
    )
    return
  }
  const lista = (est.finalistasConfirmados || [])
    .map((f, i) => `${i + 1}. ${f.nombre} (${f.nota ?? '—'})`)
    .join('<br/>')
  const hija = nombreFaseHija(fase) || 'fase hija'
  const conf = await Swal.fire({
    title: '¿Promover finalistas?',
    html: `Se copiarán <strong>${est.finalistasConfirmados?.length || 0}</strong> fraternidad(es) (cupo ${fase.cupoFinalistas}) a <em>${hija}</em>.<br/><br/>${lista}`,
    icon: 'question',
    showCancelButton: true,
    confirmButtonText: 'Sí, promover',
    cancelButtonText: 'Cancelar',
    confirmButtonColor: '#004a99',
  })
  if (!conf.isConfirmed) return

  promoviendoId.value = fase.idFase
  try {
    const { data } = await api.post(`/evaluaciones/fases/${fase.idFase}/promover-finalistas`)
    notify.success(
      'Finalistas promovidos',
      data?.mensaje || `Se promovieron ${data?.promovidos || 0} fraternidad(es).`,
    )
    await cargarEstadoFase(fase)
  } catch (e) {
    notify.error('Error', e?.response?.data?.message || 'No se pudieron promover los finalistas.')
  } finally {
    promoviendoId.value = null
  }
}

const formatearFecha = (fechaString) => {
  if (!fechaString) return 'Sin fecha'
  const fecha = new Date(fechaString)
  return fecha.toLocaleDateString('es-BO', { day: '2-digit', month: 'short', year: 'numeric' })
}

onMounted(() => {
  cargarFases()
})
</script>
