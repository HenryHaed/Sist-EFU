<template>
  <AuthSplitLayout
    :site-info="siteInfo"
    title="Bienvenido"
    subtitle="Ingresa tus credenciales para acceder al portal."
  >
    <form @submit.prevent="handleLogin" class="space-y-4">
      <div>
        <label class="block text-[9px] font-bold uppercase tracking-[0.2em] text-slate-500 mb-2" for="ci">
          Carnet de Identidad (CI)
        </label>
        <div class="relative">
          <span class="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-lg">person</span>
          <input
            id="ci"
            v-model="form.ci"
            type="text"
            placeholder="Ej. 1000000"
            class="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:bg-white text-slate-900 placeholder:text-slate-400 transition-all duration-200 outline-none text-sm"
          />
        </div>
      </div>

      <div>
        <label class="block text-[9px] font-bold uppercase tracking-[0.2em] text-slate-500 mb-2" for="password">
          Contraseña
        </label>
        <div class="relative">
          <span class="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-lg">lock</span>
          <input
            id="password"
            v-model="form.password"
            :type="showPass ? 'text' : 'password'"
            placeholder="••••••••"
            class="w-full pl-11 pr-11 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:bg-white text-slate-900 placeholder:text-slate-400 transition-all duration-200 outline-none text-sm"
          />
          <button type="button" @click="showPass = !showPass"
            class="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-primary transition-colors">
            <span class="material-symbols-outlined text-lg">{{ showPass ? 'visibility_off' : 'visibility' }}</span>
          </button>
        </div>
      </div>

      <div class="flex flex-col xs:flex-row xs:items-center xs:justify-between gap-2 py-1">
        <label class="flex items-center cursor-pointer group">
          <input v-model="form.remember" type="checkbox"
            class="rounded border-slate-300 text-primary focus:ring-primary/20 w-3.5 h-3.5 transition-all" />
          <span class="ml-2 text-[11px] font-medium text-slate-500 group-hover:text-primary transition-colors">Recordarme</span>
        </label>
        <router-link to="/olvide-contrasena" class="text-[11px] font-bold text-primary hover:text-secondary transition-colors">
          ¿Olvidaste tu contraseña?
        </router-link>
      </div>

      <transition name="fade">
        <div v-if="errorMsg" class="flex items-center gap-2 p-2.5 bg-red-50 border border-red-200 rounded-xl text-xs text-secondary font-medium">
          <span class="material-symbols-outlined text-secondary text-base">error</span>
          {{ errorMsg }}
        </div>
      </transition>

      <button
        type="submit"
        :disabled="loading"
        :class="loading ? 'opacity-80 cursor-wait' : 'hover:brightness-110 active:scale-[0.98]'"
        class="w-full bg-primary text-white font-bold py-3.5 sm:py-4 rounded-xl shadow-lg shadow-primary/20 transition-all duration-300 flex items-center justify-center gap-2 text-sm"
      >
        <span v-if="loading" class="material-symbols-outlined animate-spin text-lg">progress_activity</span>
        <span v-else>Ingresar al Sistema</span>
        <span v-if="!loading" class="material-symbols-outlined text-lg">login</span>
      </button>
    </form>
  </AuthSplitLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../store/auth'
import api from '../services/api'
import { applySiteTitle } from '../utils/siteTitle'
import AuthSplitLayout from '../components/auth/AuthSplitLayout.vue'

const router = useRouter()
const authStore = useAuthStore()

const form = ref({ ci: '', password: '', remember: false })
const loading = ref(false)
const showPass = ref(false)
const errorMsg = ref('')
const siteInfo = ref({})

onMounted(async () => {
  const savedCi = localStorage.getItem('remembered_ci')
  if (savedCi) {
    form.value.ci = savedCi
    form.value.remember = true
  }

  try {
    const { data } = await api.get('/evaluaciones/gestion-activa')
    if (data) {
      siteInfo.value = data
      applySiteTitle(data.nombreSitio)
    }
  } catch {
    console.warn('Usando valores por defecto')
  }
})

const handleLogin = async () => {
  errorMsg.value = ''

  if (!form.value.ci || !form.value.password) {
    errorMsg.value = 'Por favor completa todos los campos.'
    return
  }

  loading.value = true
  try {
    const response = await api.post('/auth/login', {
      ci: form.value.ci,
      password: form.value.password,
    })

    if (form.value.remember) {
      localStorage.setItem('remembered_ci', form.value.ci)
    } else {
      localStorage.removeItem('remembered_ci')
    }

    authStore.setAuth(response.data.access_token, response.data.usuario, response.data.session_id)
    router.push('/dashboard')
  } catch (error) {
    errorMsg.value = error.response?.data?.message || 'Error al conectar con el servidor. Verifica tus credenciales.'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
.animate-spin { animation: spin 1s linear infinite; }

.fade-enter-active, .fade-leave-active { transition: opacity 0.3s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
