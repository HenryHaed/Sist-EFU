<template>
  <div class="bg-white font-display text-slate-900 h-screen flex flex-col overflow-hidden">
    <main class="flex-grow flex flex-col md:flex-row min-h-0 overflow-hidden">
      
      <!-- Left Side: Registration Form -->
      <div class="w-full md:w-1/2 lg:w-2/3 relative flex items-center justify-center p-6 md:p-12 overflow-y-auto custom-scrollbar">
        <!-- Aguayo Pattern overlay -->
        <div class="absolute inset-0 aguayo-pattern pointer-events-none"></div>

        <div class="relative z-10 w-full max-w-2xl py-6">
          <!-- Brand Header -->
          <div class="flex items-center gap-4 mb-10">
            <h1 class="font-black italic tracking-tighter uppercase text-4xl text-primary">
              UMS<span class="text-secondary">A</span>
            </h1>
            <div class="h-8 w-[1px] bg-slate-200"></div>
            <p class="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">Registro de Representantes</p>
          </div>

          <!-- Header -->
          <div class="mb-10">
            <h2 class="text-4xl font-black italic tracking-tight text-slate-900 uppercase">Comienza el registro</h2>
            <p class="text-slate-500 text-base mt-2 font-medium">Crea tu cuenta para inscribir a tu fraternidad en la gestión {{ siteInfo.anio || 2026 }}.</p>
          </div>

          <!-- Form -->
          <form @submit.prevent="handleRegister" class="space-y-8">
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
              <!-- CI -->
              <div class="md:col-span-2">
                <label class="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-3" for="ci">
                  Carnet de Identidad (CI)
                </label>
                <div class="relative">
                  <span class="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xl">id_card</span>
                  <input
                    id="ci"
                    v-model="form.ci"
                    type="text" required
                    placeholder="Ej. 1234567 LP"
                    class="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-primary/10 focus:bg-white text-slate-900 placeholder:text-slate-400 transition-all duration-200 outline-none text-base font-bold"
                  />
                </div>
              </div>

              <!-- Nombres -->
              <div>
                <label class="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-3">Nombres</label>
                <input
                  v-model="form.nombres"
                  type="text" required
                  placeholder="Tu(s) nombre(s)"
                  class="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-primary/10 focus:bg-white text-slate-900 transition-all outline-none text-base font-bold"
                />
              </div>

              <!-- Apellido Paterno -->
              <div>
                <label class="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-3">Primer Apellido</label>
                <input
                  v-model="form.primerApellido"
                  type="text" required
                  placeholder="Paterno"
                  class="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-primary/10 focus:bg-white text-slate-900 transition-all outline-none text-base font-bold"
                />
              </div>

              <!-- Apellido Materno -->
              <div>
                <label class="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-3">Segundo Apellido</label>
                <input
                  v-model="form.segundoApellido"
                  type="text"
                  placeholder="Materno (Opcional)"
                  class="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-primary/10 focus:bg-white text-slate-900 transition-all outline-none text-base font-bold"
                />
              </div>
            </div>

            <!-- Terms -->
            <div class="flex items-start gap-4 p-5 bg-slate-50 border border-slate-100 rounded-2xl">
              <input type="checkbox" required class="mt-1.5 accent-primary h-4 w-4" />
              <p class="text-[11px] text-slate-500 font-medium leading-relaxed">
                Confirmo que soy el representante legal o delegado designado por mi fraternidad para realizar el proceso de inscripción y acepto los <a href="#" class="text-primary font-bold hover:underline">términos y condiciones</a> de la Entrada Universitaria {{ siteInfo.anio || 2026 }}.
              </p>
            </div>

            <!-- Submit -->
            <div class="flex flex-col sm:flex-row gap-4 pt-4">
              <button
                type="submit"
                :disabled="loading"
                class="flex-1 bg-primary text-white font-black py-5 rounded-2xl shadow-xl shadow-primary/20 hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-3 text-sm uppercase tracking-widest disabled:opacity-50"
              >
                <span v-if="loading" class="material-symbols-outlined animate-spin text-xl">progress_activity</span>
                <span v-else class="material-symbols-outlined text-xl">person_add</span>
                {{ loading ? 'Procesando...' : 'Crear mi cuenta' }}
              </button>
              
              <router-link
                to="/login"
                class="px-8 py-5 border-2 border-slate-200 text-slate-400 hover:text-primary hover:border-primary font-black rounded-2xl transition-all text-[11px] uppercase tracking-widest text-center"
              >
                Ya tengo cuenta
              </router-link>
            </div>
          </form>

          <!-- Support -->
          <div class="mt-12 text-center text-[10px] font-black uppercase tracking-[0.3em] text-slate-300">
            Universidad Mayor de San Andrés — La Paz, Bolivia
          </div>
        </div>
      </div>

      <!-- Success Modal -->
      <v-dialog v-model="showSuccessModal" max-width="500" persistent>
        <v-card class="rounded-3xl border-4 border-emerald-500 overflow-hidden">
          <div class="bg-emerald-500 p-8 text-white text-center">
             <div class="size-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-6 border-2 border-white/40">
                <span class="material-symbols-outlined text-5xl">check_circle</span>
             </div>
             <h3 class="text-3xl font-black italic uppercase tracking-tighter">¡Registro Exitoso!</h3>
          </div>
          
          <v-card-text class="pa-10 text-center bg-white">
            <p class="text-slate-800 text-lg font-bold mb-4">¡Bienvenido al Sistema EFU!</p>
            <p class="text-slate-600 mb-6 leading-relaxed">
              Tu cuenta ha sido creada correctamente. Tu **Carnet de Identidad (CI)** es tu contraseña inicial.
            </p>
            
            <div class="bg-amber-50 border border-amber-100 p-4 rounded-2xl flex items-start gap-3 text-left mb-8">
              <span class="material-symbols-outlined text-amber-600 mt-0.5">info</span>
              <div>
                <p class="text-[10px] font-black uppercase text-amber-600 tracking-widest mb-1">Nota importante</p>
                <p class="text-[11px] text-amber-800 font-bold leading-relaxed">
                  Por seguridad, el sistema te pedirá cambiar tu contraseña al ingresar por primera vez.
                </p>
              </div>
            </div>

            <div v-if="countdown > 0" class="flex flex-col items-center gap-2">
              <div class="size-12 rounded-full border-4 border-slate-100 flex items-center justify-center">
                <span class="text-xl font-black text-primary">{{ countdown }}</span>
              </div>
              <p class="text-[9px] font-black text-slate-400 uppercase tracking-widest">Espera un momento...</p>
            </div>
          </v-card-text>

          <v-card-actions class="pa-8 pt-0 bg-white">
            <button 
              @click="goToLogin"
              :disabled="countdown > 0"
              class="w-full py-5 rounded-2xl font-black text-sm uppercase tracking-widest transition-all shadow-xl"
              :class="countdown > 0 ? 'bg-slate-100 text-slate-300 cursor-not-allowed' : 'bg-primary text-white hover:brightness-110 shadow-primary/20'"
            >
              Entendido, ir al Login
            </button>
          </v-card-actions>
        </v-card>
      </v-dialog>

      <!-- Right Side: Cinematic Image -->
      <div class="hidden md:flex md:w-1/2 lg:w-1/3 hero-image relative items-end p-12 order-first md:order-last">
        <div class="relative z-10">
          <h2 class="text-white text-4xl lg:text-5xl font-black italic uppercase tracking-tighter leading-none mb-4">
            Tradición y <br />Excelencia
          </h2>
          <div class="w-16 h-1 bg-secondary mb-4"></div>
          <p class="text-white/80 max-w-sm font-medium text-base">
            Únete a la historia. El portal de inscripción permite gestionar los requisitos de tu fraternidad de forma segura.
          </p>
        </div>
      </div>

    </main>

    <!-- Footer -->
    <footer class="w-full py-4 px-8 flex flex-col md:flex-row justify-between items-center gap-2 bg-white border-t border-slate-100 relative z-20">
      <p class="text-[9px] font-bold uppercase tracking-[0.2em] text-slate-400">
        © 2026 UMSA — Entrada Folklórica Universitaria.
      </p>
      <nav class="flex gap-4">
        <a class="text-[9px] font-bold uppercase tracking-[0.2em] text-slate-400 hover:text-secondary transition-colors" href="#">Privacidad</a>
        <a class="text-[9px] font-bold uppercase tracking-[0.2em] text-slate-400 hover:text-secondary transition-colors" href="#">Términos</a>
      </nav>
    </footer>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import api from '../services/api'
import Swal from 'sweetalert2'

const router = useRouter()
const loading = ref(false)
const siteInfo = ref({})

const showSuccessModal = ref(false)
const countdown = ref(5)

const form = ref({
  ci: '',
  nombres: '',
  primerApellido: '',
  segundoApellido: '',
})

onMounted(async () => {
  try {
    const { data } = await api.get('/evaluaciones/gestion-activa')
    if (data) siteInfo.value = data
  } catch (err) {
    console.warn('Usando valores por defecto')
  }
})

const startCountdown = () => {
  countdown.value = 5
  const timer = setInterval(() => {
    countdown.value--
    if (countdown.value <= 0) clearInterval(timer)
  }, 1000)
}

const handleRegister = async () => {
  loading.value = true
  try {
    await api.post('/usuarios/registrar-representante', form.value)
    showSuccessModal.value = true
    startCountdown()
  } catch (err) {
    console.error('Error en registro:', err)
    Swal.fire({
      title: 'Error',
      text: err.response?.data?.message || 'No se pudo completar el registro.',
      icon: 'error',
      confirmButtonColor: '#c8102e'
    })
  } finally {
    loading.value = false
  }
}

const goToLogin = () => {
  showSuccessModal.value = false
  router.push('/login')
}

const backgroundImg = computed(() => {
  const url = siteInfo.value.urlImagenLogin || '/src/assets/img/login.png'
  return `url('${url}')`
})
</script>

<style scoped>
.hero-image {
  background-image:
    linear-gradient(rgba(0,0,0,0.1), rgba(0,0,0,0.8)),
    v-bind('backgroundImg');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  background-color: #000;
}

.aguayo-pattern {
  background-image: url('https://lh3.googleusercontent.com/aida/ADBb0ugTBfTZK7Ym1Cw92mVBwjbOEfHhi-w52DUNFT0g86pem7fJjAwUtC4Vus9t2im8owYdyQ3KRC4S0Xz_suUcrEQBzF7r9J858AUDbBQv8DVIo_6lme4yLEEfdudjUaZHOTuj6iOH6Y10bLIUXfiED52A3S1eqH_qqnaO2G2DLw4SF_F73lcMRnTMoYCv7Y6sTeQ1H7eBkDl03zZbKx4f9sIlfl5uiALXTy07WKwQshKgXauMxPwpOPVHoOQUHm8bwzFbtXGHjw_luA');
  background-repeat: repeat;
  background-size: 200px;
  opacity: 0.04;
}

.custom-scrollbar::-webkit-scrollbar { width: 6px; }
.custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
.custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #cbd5e1; }
</style>
