<template>
  <div class="max-w-2xl mx-auto space-y-6">
    <div class="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
      <div class="bg-gradient-to-br from-primary to-[#002266] px-6 py-8 text-white">
        <div class="flex items-start gap-4">
          <div class="size-16 rounded-2xl bg-white/15 border border-white/30 flex items-center justify-center shrink-0">
            <span class="material-symbols-outlined text-4xl">badge</span>
          </div>
          <div class="min-w-0">
            <p class="text-[10px] font-black uppercase tracking-widest text-white/70">Mi perfil</p>
            <h2 class="text-xl sm:text-2xl font-black leading-tight mt-1 truncate">{{ nombre }}</h2>
            <p class="text-sm font-bold text-secondary mt-1">{{ rolInfo.titulo }}</p>
            <p class="text-xs text-white/80 font-medium">{{ rolInfo.subtitulo }}</p>
          </div>
        </div>
      </div>

      <div class="p-6 space-y-5">
        <section>
          <h3 class="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">Datos generales</h3>
          <dl class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div class="rounded-2xl border border-slate-100 bg-slate-50/80 px-4 py-3">
              <dt class="text-[9px] font-black uppercase tracking-widest text-slate-400">Cédula de identidad</dt>
              <dd class="text-sm font-bold text-slate-800 mt-0.5">{{ perfil?.ci || '—' }}</dd>
            </div>
            <div class="rounded-2xl border border-slate-100 bg-slate-50/80 px-4 py-3">
              <dt class="text-[9px] font-black uppercase tracking-widest text-slate-400">Correo</dt>
              <dd class="text-sm font-bold text-slate-800 mt-0.5 break-all">{{ perfil?.correo || 'Sin correo' }}</dd>
            </div>
            <div class="rounded-2xl border border-slate-100 bg-slate-50/80 px-4 py-3 sm:col-span-2">
              <dt class="text-[9px] font-black uppercase tracking-widest text-slate-400">Rol en el sistema</dt>
              <dd class="text-sm font-bold text-primary mt-0.5">{{ rolInfo.titulo }}</dd>
              <dd class="text-xs text-slate-500 font-medium">{{ rolInfo.subtitulo }}</dd>
            </div>
          </dl>
        </section>

        <section v-if="infoRolExtra.length" class="border-t border-slate-100 pt-5">
          <h3 class="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">Según tu rol</h3>
          <ul class="space-y-2">
            <li
              v-for="(item, i) in infoRolExtra"
              :key="i"
              class="flex items-start gap-2.5 text-sm text-slate-700"
            >
              <span class="material-symbols-outlined text-primary text-[18px] mt-0.5 shrink-0">{{ item.icon }}</span>
              <span>
                <span class="font-bold block text-slate-800">{{ item.label }}</span>
                <span class="text-xs text-slate-500 font-medium">{{ item.value }}</span>
              </span>
            </li>
          </ul>
        </section>

        <section v-if="puedeCredencial" class="border-t border-slate-100 pt-5">
          <h3 class="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Credencial del sistema</h3>
          <p class="text-xs text-slate-500 font-medium mb-4 leading-relaxed">
            Genera tu carnet digital (anverso y reverso, 10 × 6 cm) con código QR para validación oficial.
          </p>
          <button
            type="button"
            :disabled="generando"
            @click="generarCredencial"
            class="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-primary text-white text-xs font-black uppercase tracking-widest hover:brightness-110 disabled:opacity-50 shadow-sm"
          >
            <span class="material-symbols-outlined text-[18px]">{{ generando ? 'hourglass_top' : 'id_card' }}</span>
            {{ generando ? 'Generando…' : 'Generar credencial' }}
          </button>
        </section>
      </div>
    </div>

    <p v-if="errorMsg" class="text-sm text-secondary font-bold text-center">{{ errorMsg }}</p>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import api from '../services/api'
import { notify } from '../utils/notify'
import {
  etiquetaRol,
  puedeGenerarCredencial,
  nombreCompletoUsuario,
} from '../utils/roles'

const authStore = useAuthStore()

const perfil = ref(null)
const generando = ref(false)
const errorMsg = ref('')

const rol = computed(() => perfil.value?.rol || authStore.userRole || '')
const rolInfo = computed(() => etiquetaRol(rol.value))
const nombre = computed(() => nombreCompletoUsuario(perfil.value || authStore.user) || 'Usuario')
const puedeCredencial = computed(() => puedeGenerarCredencial(rol.value))

const infoRolExtra = computed(() => {
  const r = String(rol.value).toLowerCase()
  const items = []
  const f = perfil.value?.fraternidad
  if (r === 'delegado' && f) {
    items.push({ icon: 'groups', label: 'Fraternidad', value: f.nombre || '—' })
    if (f.categoria?.nombre) items.push({ icon: 'category', label: 'Categoría', value: f.categoria.nombre })
    if (f.facultad?.nombre) items.push({ icon: 'account_balance', label: 'Facultad', value: f.facultad.nombre })
    if (f.carrera?.nombre) items.push({ icon: 'school', label: 'Carrera', value: f.carrera.nombre })
  }
  if (r === 'admin' && perfil.value?.esDecisor) {
    items.push({ icon: 'gavel', label: 'Permiso especial', value: 'Decisor (desempates)' })
  }
  if (r === 'jurado') {
    items.push({ icon: 'grade', label: 'Función', value: 'Calificación de fases y concursos asignados' })
  }
  if (r === 'controladorhcu') {
    items.push({ icon: 'flag', label: 'Función', value: 'Control de asistencia y disciplina' })
  }
  if (r === 'superusuario') {
    items.push({ icon: 'developer_mode', label: 'Alcance', value: 'Acceso total al sistema' })
  }
  if (r === 'veedor') {
    items.push({ icon: 'visibility', label: 'Función', value: 'Consulta de estadísticas, reglamento y monografías' })
  }
  if (r === 'concursante') {
    items.push({ icon: 'emoji_events', label: 'Función', value: 'Inscripción y documentos de concurso externo' })
  }
  return items
})

onMounted(async () => {
  try {
    const data = await authStore.refreshProfile()
    perfil.value = data || authStore.user
  } catch {
    perfil.value = authStore.user
  }
})

const generarCredencial = async () => {
  if (generando.value) return
  generando.value = true
  errorMsg.value = ''
  try {
    const { data } = await api.get('/auth/credencial', { responseType: 'blob' })
    const ci = perfil.value?.ci || 'usuario'
    const url = URL.createObjectURL(new Blob([data], { type: 'application/pdf' }))
    const link = document.createElement('a')
    link.href = url
    link.download = `credencial-efu-${ci}.pdf`
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
    notify.success('Credencial lista', 'Se descargó el PDF (anverso y reverso 10×6 cm).')
  } catch (e) {
    let msg = e.response?.data?.message || 'No se pudo generar la credencial.'
    if (e.response?.data instanceof Blob) {
      try {
        const text = await e.response.data.text()
        const parsed = JSON.parse(text)
        msg = parsed.message || msg
      } catch {
        /* keep msg */
      }
    }
    errorMsg.value = Array.isArray(msg) ? msg.join(' ') : msg
    notify.error('Error', errorMsg.value)
  } finally {
    generando.value = false
  }
}
</script>
