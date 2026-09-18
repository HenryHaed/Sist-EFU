<template>
  <div class="min-h-[100dvh] andean-pattern flex items-center justify-center p-4 sm:p-8">
    <div class="w-full max-w-md bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
      <div class="bg-primary px-6 py-5 text-white">
        <p class="text-[10px] font-black uppercase tracking-widest text-white/70">UMSA · EFU</p>
        <h1 class="text-lg font-black mt-1">Validación de credencial</h1>
      </div>

      <div class="p-6">
        <div v-if="loading" class="text-center py-10 text-slate-400">
          <span class="material-symbols-outlined text-4xl animate-pulse">qr_code_2</span>
          <p class="text-sm font-bold mt-2">Verificando…</p>
        </div>

        <div v-else-if="error" class="text-center py-8">
          <span class="material-symbols-outlined text-5xl text-secondary">cancel</span>
          <p class="text-base font-black text-slate-800 mt-3">Credencial no válida</p>
          <p class="text-sm text-slate-500 mt-1">{{ error }}</p>
        </div>

        <div v-else-if="data" class="space-y-4">
          <div class="flex items-center gap-2 text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-xl px-3 py-2">
            <span class="material-symbols-outlined">verified</span>
            <span class="text-sm font-black uppercase tracking-widest">Credencial válida</span>
          </div>

          <dl class="space-y-3">
            <div>
              <dt class="text-[9px] font-black uppercase tracking-widest text-slate-400">Titular</dt>
              <dd class="text-base font-black text-slate-900">{{ data.nombreCompleto }}</dd>
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <dt class="text-[9px] font-black uppercase tracking-widest text-slate-400">CI</dt>
                <dd class="text-sm font-bold text-slate-800">{{ data.ci }}</dd>
              </div>
              <div>
                <dt class="text-[9px] font-black uppercase tracking-widest text-slate-400">Código</dt>
                <dd class="text-sm font-bold text-slate-800">{{ data.codigo }}</dd>
              </div>
            </div>
            <div>
              <dt class="text-[9px] font-black uppercase tracking-widest text-slate-400">Rol</dt>
              <dd class="text-sm font-black text-primary">{{ data.rolTitulo }}</dd>
              <dd class="text-xs text-secondary font-medium">{{ data.rolSubtitulo }}</dd>
            </div>
          </dl>
        </div>

        <router-link
          to="/"
          class="mt-8 block text-center text-xs font-black uppercase tracking-widest text-slate-400 hover:text-primary"
        >
          Ir al inicio
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import api from '../services/api'

const route = useRoute()
const loading = ref(true)
const error = ref('')
const data = ref(null)

onMounted(async () => {
  const t = String(route.query.t || route.query.token || '')
  if (!t) {
    loading.value = false
    error.value = 'No se encontró el código de la credencial.'
    return
  }
  try {
    const { data: res } = await api.get('/auth/credencial/validar', { params: { t } })
    data.value = res
  } catch (e) {
    error.value = e.response?.data?.message || 'No se pudo validar la credencial.'
  } finally {
    loading.value = false
  }
})
</script>
