<template>
  <div class="bg-white font-display text-slate-900 h-screen flex flex-col overflow-hidden">
    <main class="flex-grow flex flex-col md:flex-row min-h-0 overflow-hidden">

      <!-- Left Side: Cinematic Image -->
      <div class="hidden md:flex md:w-1/2 lg:w-3/5 hero-image relative items-end p-12">
        <div class="relative z-10">
          <h2 class="text-white text-4xl lg:text-5xl font-black italic uppercase tracking-tighter leading-none mb-4">
            Tradición y <br />Excelencia
          </h2>
          <div class="w-16 h-1 bg-secondary mb-4"></div>
          <p class="text-white/80 max-w-sm font-medium text-base">
            La Entrada Folclórica Universitaria de la UMSA es patrimonio cultural vivo que celebra nuestra identidad nacional.
          </p>
        </div>
      </div>

      <!-- Right Side: Login Form -->
      <div class="w-full md:w-1/2 lg:w-2/5 relative flex items-center justify-center p-6 md:p-8 lg:p-10 overflow-y-auto custom-scrollbar">
        <!-- Aguayo Pattern overlay -->
        <div class="absolute inset-0 aguayo-pattern pointer-events-none"></div>

        <div class="relative z-10 w-full max-w-sm py-2">

          <!-- Brand Header -->
          <div class="text-center mb-8 mt-6">
            <h1 class="font-black italic tracking-tighter uppercase text-5xl text-primary mb-1">
              {{ siteInfo.nombreSitio || 'UMS' }}<span v-if="!siteInfo.nombreSitio" class="text-secondary">A</span>
            </h1>
            <p class="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-500">
              {{ siteInfo.lema || 'Entrada Folclórica Universitaria' }}
            </p>
          </div>

          <!-- Welcome -->
          <div class="mb-6">
            <h2 class="text-2xl font-black italic tracking-tight text-slate-900">{{ siteInfo.tituloPrincipal || 'Bienvenido' }}</h2>
            <p class="text-slate-500 text-sm mt-1">{{ siteInfo.subtituloPrincipal || 'Ingresa tus credenciales para acceder al portal.' }}</p>
          </div>

          <!-- Form -->
          <form @submit.prevent="handleLogin" class="space-y-4">

            <!-- CI -->
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

            <!-- Password -->
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

            <!-- Helper actions -->
            <div class="flex items-center justify-between py-1">
              <label class="flex items-center cursor-pointer group">
                <input v-model="form.remember" type="checkbox"
                  class="rounded border-slate-300 text-primary focus:ring-primary/20 w-3.5 h-3.5 transition-all" />
                <span class="ml-2 text-[11px] font-medium text-slate-500 group-hover:text-primary transition-colors">Recordarme</span>
              </label>
              <a href="#" class="text-[11px] font-bold text-primary hover:text-secondary transition-colors">¿Olvidaste tu contraseña?</a>
            </div>

            <!-- Error message -->
            <transition name="fade">
              <div v-if="errorMsg" class="flex items-center gap-2 p-2.5 bg-red-50 border border-red-200 rounded-xl text-xs text-secondary font-medium">
                <span class="material-symbols-outlined text-secondary text-base">error</span>
                {{ errorMsg }}
              </div>
            </transition>

            <!-- Submit -->
            <button
              type="submit"
              :disabled="loading"
              :class="loading ? 'opacity-80 cursor-wait' : 'hover:brightness-110 active:scale-[0.98]'"
              class="w-full bg-primary text-white font-bold py-4 rounded-xl shadow-lg shadow-primary/20 transition-all duration-300 flex items-center justify-center gap-2 text-sm"
            >
              <span v-if="loading" class="material-symbols-outlined animate-spin text-lg">progress_activity</span>
              <span v-else>Ingresar al Sistema</span>
              <span v-if="!loading" class="material-symbols-outlined text-lg">login</span>
            </button>
          </form>

          <!-- Support -->
          <div class="mt-6 text-center border-t border-slate-100 pt-6">
            <p class="text-slate-500 text-[13px]">
              ¿Problemas de acceso?
              <a class="text-primary font-bold hover:underline" href="#">Soporte Técnico</a>
            </p>
            <div class="mt-3 flex items-center justify-center gap-2 text-slate-300">
              <span class="material-symbols-outlined text-xs">verified_user</span>
              <span class="text-[8px] font-bold uppercase tracking-widest">Conexión Segura SSL</span>
            </div>

            <!-- Volver al inicio -->
            <router-link to="/"
              class="mt-3 flex items-center justify-center gap-1 text-[15px] font-bold text-slate-400 hover:text-primary transition-colors mx-auto">
              <span class="material-symbols-outlined text-sm">arrow_back</span>
              Volver al Inicio
            </router-link>
          </div>
        </div>
      </div>
    </main>

    <!-- Footer -->
    <footer class="w-full py-3 px-8 flex flex-col md:flex-row justify-between items-center gap-2 bg-white border-t border-slate-100 relative z-20">
      <p class="text-[9px] font-bold uppercase tracking-[0.2em] text-slate-400 text-center md:text-left">
        © 2026 UMSA — Entrada Folklórica Universitaria. La Paz, Bolivia.
      </p>
      <nav class="flex gap-4">
        <a class="text-[9px] font-bold uppercase tracking-[0.2em] text-slate-400 hover:text-secondary transition-colors" href="#">Privacidad</a>
        <a class="text-[9px] font-bold uppercase tracking-[0.2em] text-slate-400 hover:text-secondary transition-colors" href="#">Términos</a>
        <a class="text-[9px] font-bold uppercase tracking-[0.2em] text-slate-400 hover:text-secondary transition-colors" href="#">Contacto</a>
      </nav>
    </footer>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../store/auth'
import api from '../services/api'
import { getImageUrl } from '../utils/url'

const router = useRouter()
const authStore = useAuthStore()

const form = ref({ ci: '', password: '', remember: false })
const loading = ref(false)
const showPass = ref(false)
const errorMsg = ref('')
const siteInfo = ref({})

// Al montar el componente, revisar si hay un CI guardado
onMounted(async () => {
  const savedCi = localStorage.getItem('remembered_ci')
  if (savedCi) {
    form.value.ci = savedCi
    form.value.remember = true
  }

  try {
    const { data } = await api.get('/evaluaciones/gestion-activa')
    if (data) siteInfo.value = data
  } catch (err) {
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
      password: form.value.password
    })
    
    // Lógica de "Recuérdame"
    if (form.value.remember) {
      localStorage.setItem('remembered_ci', form.value.ci)
    } else {
      localStorage.removeItem('remembered_ci')
    }

    // Guardar en el store
    authStore.setAuth(response.data.access_token, response.data.usuario)
    
    // Navegar al dashboard
    router.push('/dashboard')
  } catch (error) {
    console.error('Error login:', error)
    errorMsg.value = error.response?.data?.message || 'Error al conectar con el servidor. Verifica tus credenciales.'
  } finally {
    loading.value = false
  }
}

const backgroundImg = computed(() => {
  const url = siteInfo.value.urlImagenLogin
  const fullUrl = getImageUrl(url) || '/src/assets/img/login.png'
  return `url('${fullUrl}')`
})
</script>


<style scoped>
.font-display { font-family: 'Inter', 'Be Vietnam Pro', sans-serif; }

.hero-image {
  background-image:
    linear-gradient(rgba(0,0,0,0.1), rgba(0,0,0,0.8)),
    v-bind('backgroundImg');
  background-size: contain;
  background-position: bottom;
  background-repeat: no-repeat;
  background-color: #000;
}

.aguayo-pattern {
  background-image: url('https://lh3.googleusercontent.com/aida/ADBb0ugTBfTZK7Ym1Cw92mVBwjbOEfHhi-w52DUNFT0g86pem7fJjAwUtC4Vus9t2im8owYdyQ3KRC4S0Xz_suUcrEQBzF7r9J858AUDbBQv8DVIo_6lme4yLEEfdudjUaZHOTuj6iOH6Y10bLIUXfiED52A3S1eqH_qqnaO2G2DLw4SF_F73lcMRnTMoYCv7Y6sTeQ1H7eBkDl03zZbKx4f9sIlfl5uiALXTy07WKwQshKgXauMxPwpOPVHoOQUHm8bwzFbtXGHjw_luA');
  background-repeat: repeat;
  background-size: 200px;
  opacity: 0.04;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
.animate-spin { animation: spin 1s linear infinite; }

.fade-enter-active, .fade-leave-active { transition: opacity 0.3s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
