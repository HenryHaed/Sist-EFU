<template>
  <div class="dashboard-page max-w-4xl">
    <div class="mb-8 sm:mb-10">
      <div class="flex items-center gap-3 mb-2">
        <span class="h-6 sm:h-8 w-2 bg-secondary rounded-full shrink-0"></span>
        <h2 class="dashboard-page-title italic uppercase text-primary">Enviar un Mensaje</h2>
      </div>
      <p class="text-slate-500 font-medium text-sm">
        Comunicados oficiales por correo electrónico a usuarios del sistema o destinatarios externos.
      </p>
    </div>

    <div class="flex gap-2 mb-6 border-b border-slate-200">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        @click="activeTab = tab.id"
        class="pb-3 px-3 text-[10px] sm:text-xs font-black uppercase tracking-widest transition-all relative"
        :class="activeTab === tab.id ? 'text-primary' : 'text-slate-400 hover:text-slate-600'"
      >
        {{ tab.label }}
        <div v-if="activeTab === tab.id" class="absolute bottom-0 left-0 w-full h-0.5 bg-secondary rounded-t-full"></div>
      </button>
    </div>

    <!-- Comunicado por rol -->
    <div v-if="activeTab === 'general'" class="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
      <div class="flex items-start gap-4 p-4 bg-blue-50 border border-blue-100 rounded-xl">
        <span class="material-symbols-outlined text-primary text-2xl shrink-0">campaign</span>
        <div>
          <p class="font-black text-primary text-sm uppercase tracking-wide">Comunicado por grupo</p>
          <p class="text-slate-600 text-sm mt-1">
            Selecciona a qué grupo enviar el mensaje. Solo usuarios con correo registrado recibirán el comunicado.
          </p>
        </div>
      </div>

      <div>
        <label class="label-xs mb-3 block">Destinatarios</label>
        <div class="flex flex-wrap gap-2">
          <button
            v-for="opcion in opcionesRol"
            :key="opcion.id"
            type="button"
            @click="rolSeleccionado = opcion.id"
            class="px-4 py-2.5 rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-wide border-2 transition-all"
            :class="rolSeleccionado === opcion.id
              ? 'bg-primary text-white border-primary shadow-md shadow-primary/20'
              : 'bg-white text-slate-600 border-slate-200 hover:border-primary/40 hover:text-primary'"
          >
            {{ opcion.label }}
            <span
              class="ml-1.5 inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1 rounded-full text-[9px]"
              :class="rolSeleccionado === opcion.id ? 'bg-white/20' : 'bg-slate-100 text-slate-500'"
            >
              {{ conteoPorRol[opcion.id] ?? 0 }}
            </span>
          </button>
        </div>
        <p class="text-xs text-slate-500 mt-3 font-medium">
          Se enviará a <strong class="text-primary">{{ totalSeleccionado }}</strong> correo(s) de
          <strong>{{ etiquetaRolSeleccionado }}</strong>.
        </p>
      </div>

      <div>
        <label class="label-xs">Asunto del correo</label>
        <input
          v-model="formGeneral.asunto"
          type="text"
          maxlength="200"
          placeholder="Ej. Convocatoria oficial — Entrada Universitaria 2026"
          class="form-input"
        />
      </div>

      <div>
        <label class="label-xs">Mensaje</label>
        <textarea
          v-model="formGeneral.mensaje"
          rows="8"
          maxlength="10000"
          placeholder="Escribe el contenido del comunicado..."
          class="form-input resize-y min-h-[160px]"
        ></textarea>
        <p class="text-[10px] text-slate-400 mt-2 text-right font-bold">{{ formGeneral.mensaje.length }} / 10000</p>
      </div>

      <button
        @click="enviarGeneral"
        :disabled="enviandoGeneral || !rolSeleccionado || totalSeleccionado === 0 || !formGeneral.asunto.trim() || formGeneral.mensaje.trim().length < 10"
        class="w-full sm:w-auto px-8 py-4 bg-primary text-white rounded-xl font-black uppercase text-[10px] tracking-widest shadow-lg shadow-primary/20 hover:bg-blue-900 transition-all disabled:opacity-40 flex items-center justify-center gap-2"
      >
        <span class="material-symbols-outlined text-lg" :class="{ 'animate-spin': enviandoGeneral }">
          {{ enviandoGeneral ? 'sync' : 'send' }}
        </span>
        {{ enviandoGeneral ? 'Enviando...' : `Enviar a ${etiquetaRolSeleccionado}` }}
      </button>
    </div>

    <!-- Mensaje individual -->
    <div v-else class="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
      <div class="flex items-start gap-4 p-4 bg-amber-50 border border-amber-100 rounded-xl">
        <span class="material-symbols-outlined text-amber-600 text-2xl shrink-0">person_mail</span>
        <div>
          <p class="font-black text-amber-800 text-sm uppercase tracking-wide">Mensaje individual</p>
          <p class="text-slate-600 text-sm mt-1">
            Envía a cualquier correo válido. Si el destinatario está registrado, verás sugerencias al escribir.
          </p>
        </div>
      </div>

      <div class="relative">
        <label class="label-xs">Destinatario (correo)</label>
        <input
          v-model="busquedaCorreo"
          type="email"
          autocomplete="off"
          placeholder="Ej. theexample@gmail.com"
          class="form-input"
          @input="onBuscarCorreo"
          @focus="mostrarSugerencias = sugerencias.length > 0"
          @blur="ocultarSugerencias"
        />
        <div
          v-if="mostrarSugerencias && sugerencias.length"
          class="absolute z-20 left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden max-h-56 overflow-y-auto"
        >
          <button
            v-for="item in sugerencias"
            :key="item.idUsuario"
            type="button"
            class="w-full text-left px-4 py-3 hover:bg-slate-50 border-b border-slate-100 last:border-0 transition-colors"
            @mousedown.prevent="seleccionarCorreo(item)"
          >
            <p class="font-bold text-primary text-sm">{{ item.correo }}</p>
            <p class="text-[10px] text-slate-500 uppercase tracking-wide font-bold">
              {{ item.nombreCompleto }} · {{ item.rol }}
            </p>
          </button>
        </div>
        <p v-if="destinatarioSeleccionado" class="text-xs text-emerald-700 font-bold mt-2 flex items-center gap-1">
          <span class="material-symbols-outlined text-sm">check_circle</span>
          {{ destinatarioSeleccionado.nombreCompleto }} ({{ destinatarioSeleccionado.rol }})
        </p>
        <p v-else-if="correoValido && busquedaCorreo.trim()" class="text-xs text-slate-500 font-medium mt-2 flex items-center gap-1">
          <span class="material-symbols-outlined text-sm">mail</span>
          Correo externo o no registrado — se enviará igualmente si es válido.
        </p>
      </div>

      <div>
        <label class="label-xs">Asunto del correo</label>
        <input
          v-model="formIndividual.asunto"
          type="text"
          maxlength="200"
          placeholder="Asunto del mensaje"
          class="form-input"
        />
      </div>

      <div>
        <label class="label-xs">Mensaje</label>
        <textarea
          v-model="formIndividual.mensaje"
          rows="8"
          maxlength="10000"
          placeholder="Escribe el mensaje para el destinatario..."
          class="form-input resize-y min-h-[160px]"
        ></textarea>
      </div>

      <button
        @click="enviarIndividual"
        :disabled="enviandoIndividual || !correoValido || !formIndividual.asunto.trim() || formIndividual.mensaje.trim().length < 10"
        class="w-full sm:w-auto px-8 py-4 bg-secondary text-white rounded-xl font-black uppercase text-[10px] tracking-widest shadow-lg shadow-secondary/20 hover:bg-red-800 transition-all disabled:opacity-40 flex items-center justify-center gap-2"
      >
        <span class="material-symbols-outlined text-lg" :class="{ 'animate-spin': enviandoIndividual }">
          {{ enviandoIndividual ? 'sync' : 'mail' }}
        </span>
        {{ enviandoIndividual ? 'Enviando...' : 'Enviar mensaje' }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '../store/auth'
import api from '../services/api'
import { notify } from '../utils/notify'
import Swal from 'sweetalert2'

const authStore = useAuthStore()

const tabs = [
  { id: 'general', label: 'Comunicado por grupo' },
  { id: 'individual', label: 'Mensaje individual' },
]

const OPCIONES_ROL = {
  controladorhcu: { id: 'controladorhcu', label: 'Controladores HCU' },
  delegado: { id: 'delegado', label: 'Delegados' },
  jurado: { id: 'jurado', label: 'Jurados' },
  admin: { id: 'admin', label: 'Administradores' },
}

const activeTab = ref('general')
const conteoPorRol = ref({})
const rolSeleccionado = ref('delegado')
const enviandoGeneral = ref(false)
const enviandoIndividual = ref(false)

const formGeneral = ref({ asunto: '', mensaje: '' })
const formIndividual = ref({ asunto: '', mensaje: '' })

const busquedaCorreo = ref('')
const sugerencias = ref([])
const mostrarSugerencias = ref(false)
const destinatarioSeleccionado = ref(null)
let debounceTimer = null

const esSuperusuario = computed(() => authStore.userRole?.toLowerCase() === 'superusuario')

const opcionesRol = computed(() => {
  const ids = esSuperusuario.value
    ? ['controladorhcu', 'delegado', 'jurado', 'admin']
    : ['controladorhcu', 'delegado', 'jurado']
  return ids.map((id) => OPCIONES_ROL[id])
})

const totalSeleccionado = computed(() => conteoPorRol.value[rolSeleccionado.value] ?? 0)

const etiquetaRolSeleccionado = computed(() => {
  return OPCIONES_ROL[rolSeleccionado.value]?.label || 'el grupo seleccionado'
})

const correoValido = computed(() => {
  const c = busquedaCorreo.value.trim()
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c)
})

const cargarEstadisticas = async () => {
  try {
    const { data } = await api.get('/mail/correos/estadisticas')
    conteoPorRol.value = data.porRol || {}
    if (!conteoPorRol.value[rolSeleccionado.value]) {
      const primeraConDatos = opcionesRol.value.find((o) => (conteoPorRol.value[o.id] ?? 0) > 0)
      rolSeleccionado.value = primeraConDatos?.id || opcionesRol.value[0]?.id || 'delegado'
    }
  } catch {
    conteoPorRol.value = {}
  }
}

const onBuscarCorreo = () => {
  destinatarioSeleccionado.value = null
  clearTimeout(debounceTimer)
  const q = busquedaCorreo.value.trim()
  if (q.length < 2) {
    sugerencias.value = []
    mostrarSugerencias.value = false
    return
  }
  debounceTimer = setTimeout(async () => {
    try {
      const { data } = await api.get('/mail/correos/buscar', { params: { q } })
      sugerencias.value = data || []
      mostrarSugerencias.value = sugerencias.value.length > 0
    } catch {
      sugerencias.value = []
    }
  }, 300)
}

const seleccionarCorreo = (item) => {
  busquedaCorreo.value = item.correo
  destinatarioSeleccionado.value = item
  sugerencias.value = []
  mostrarSugerencias.value = false
}

const ocultarSugerencias = () => {
  setTimeout(() => { mostrarSugerencias.value = false }, 150)
}

const enviarGeneral = async () => {
  const result = await Swal.fire({
    title: '¿Enviar comunicado?',
    html: `Se enviará a <strong>${totalSeleccionado.value}</strong> correo(s) de <strong>${etiquetaRolSeleccionado.value}</strong>.<br/>Esta acción no se puede deshacer.`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#004a99',
    cancelButtonText: 'Cancelar',
    confirmButtonText: 'Sí, enviar',
  })
  if (!result.isConfirmed) return

  enviandoGeneral.value = true
  try {
    const { data } = await api.post('/mail/comunicado-general', {
      rolDestinatario: rolSeleccionado.value,
      asunto: formGeneral.value.asunto,
      mensaje: formGeneral.value.mensaje,
    })
    notify.success(
      'Comunicado enviado',
      `${data.enviados} de ${data.totalDestinatarios} correos enviados a ${etiquetaRolSeleccionado.value}.`,
    )
    formGeneral.value = { asunto: '', mensaje: '' }
  } catch (error) {
    notify.error('Error', error.response?.data?.message || 'No se pudo enviar el comunicado.')
  } finally {
    enviandoGeneral.value = false
  }
}

const enviarIndividual = async () => {
  enviandoIndividual.value = true
  try {
    const { data } = await api.post('/mail/mensaje-individual', {
      correo: busquedaCorreo.value.trim(),
      asunto: formIndividual.value.asunto,
      mensaje: formIndividual.value.mensaje,
    })
    const destino = data.nombre
      ? `${data.nombre} (${data.correo})`
      : data.correo
    notify.success('Mensaje enviado', `Correo enviado a ${destino}.`)
    formIndividual.value = { asunto: '', mensaje: '' }
    busquedaCorreo.value = ''
    destinatarioSeleccionado.value = null
  } catch (error) {
    notify.error('Error', error.response?.data?.message || 'No se pudo enviar el mensaje.')
  } finally {
    enviandoIndividual.value = false
  }
}

onMounted(cargarEstadisticas)
</script>
