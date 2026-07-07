<template>
  <AuthSplitLayout
    :site-info="siteInfo"
    :title="stepMeta.title"
    :subtitle="stepMeta.subtitle"
  >
    <!-- Indicador de pasos -->
    <div class="flex items-center gap-2 mb-5">
      <div
        v-for="n in 3"
        :key="n"
        class="h-1.5 flex-1 rounded-full transition-all duration-500"
        :class="n <= paso ? 'bg-primary' : 'bg-slate-200'"
      />
    </div>

    <div class="overflow-hidden">
      <transition :name="transitionName" mode="out-in">
        <!-- Paso 1: CI -->
        <form v-if="paso === 1" key="step-1" @submit.prevent="solicitarCodigo" class="space-y-4">
          <div>
            <label class="block text-[9px] font-bold uppercase tracking-[0.2em] text-slate-500 mb-2">Carnet de Identidad (CI)</label>
            <div class="relative">
              <span class="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-lg">id_card</span>
              <input
                v-model="ci"
                type="text"
                required
                autocomplete="username"
                placeholder="Ej. 1234567"
                class="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:bg-white text-slate-900 outline-none text-sm font-bold"
              />
            </div>
          </div>
          <p class="text-xs text-slate-500 leading-relaxed">
            Te enviaremos un código de verificación al correo registrado en tu cuenta.
          </p>
          <transition name="fade">
            <p v-if="errorMsg" class="text-xs text-secondary font-bold flex items-center gap-1">
              <span class="material-symbols-outlined text-sm">error</span>{{ errorMsg }}
            </p>
          </transition>
          <button
            type="submit"
            :disabled="loading"
            class="w-full bg-primary text-white font-bold py-3.5 sm:py-4 rounded-xl shadow-lg shadow-primary/20 hover:brightness-110 transition-all disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
          >
            <span v-if="loading" class="material-symbols-outlined animate-spin">progress_activity</span>
            <span v-else>Enviar código</span>
            <span v-if="!loading" class="material-symbols-outlined text-lg">send</span>
          </button>
        </form>

        <!-- Paso 2: Código OTP -->
        <form v-else-if="paso === 2" key="step-2" @submit.prevent="verificarCodigo" class="space-y-4">
          <div class="bg-blue-50 border border-blue-100 rounded-xl p-3.5 text-xs text-blue-900 leading-relaxed">
            Si tu cuenta tiene correo registrado, recibirás un código de 6 dígitos en los próximos minutos.
          </div>
          <div>
            <label class="block text-[9px] font-bold uppercase tracking-[0.2em] text-slate-500 mb-2">Código de verificación</label>
            <input
              v-model="code"
              type="text"
              inputmode="numeric"
              maxlength="6"
              required
              autocomplete="one-time-code"
              placeholder="000000"
              class="w-full px-4 py-3.5 border border-slate-200 rounded-xl bg-slate-50 focus:ring-2 focus:ring-primary/20 focus:bg-white outline-none text-center text-2xl font-black tracking-[0.35em]"
            />
          </div>
          <button
            type="button"
            @click="reenviarCodigo"
            :disabled="loading || cooldown > 0"
            class="text-xs font-bold text-primary hover:text-secondary disabled:text-slate-300 transition-colors"
          >
            {{ cooldown > 0 ? `Reenviar código en ${cooldown}s` : 'Reenviar código' }}
          </button>
          <transition name="fade">
            <p v-if="errorMsg" class="text-xs text-secondary font-bold flex items-center gap-1">
              <span class="material-symbols-outlined text-sm">error</span>{{ errorMsg }}
            </p>
          </transition>
          <button
            type="submit"
            :disabled="loading"
            class="w-full bg-primary text-white font-bold py-3.5 sm:py-4 rounded-xl shadow-lg shadow-primary/20 hover:brightness-110 transition-all disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
          >
            <span v-if="loading" class="material-symbols-outlined animate-spin">progress_activity</span>
            <span v-else>Verificar código</span>
            <span v-if="!loading" class="material-symbols-outlined text-lg">verified</span>
          </button>
        </form>

        <!-- Paso 3: Nueva contraseña -->
        <form v-else key="step-3" @submit.prevent="restablecer" class="space-y-4">
          <div>
            <label class="block text-[9px] font-bold uppercase tracking-[0.2em] text-slate-500 mb-2">Nueva contraseña</label>
            <div class="relative">
              <span class="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-lg">lock</span>
              <input
                v-model="newPassword"
                :type="showNewPass ? 'text' : 'password'"
                required
                autocomplete="new-password"
                placeholder="Mínimo 8 caracteres"
                class="w-full pl-11 pr-11 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:bg-white outline-none text-sm font-bold"
              />
              <button type="button" @click="showNewPass = !showNewPass" class="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-primary">
                <span class="material-symbols-outlined text-lg">{{ showNewPass ? 'visibility_off' : 'visibility' }}</span>
              </button>
            </div>
            <div v-if="newPassword" class="mt-3">
              <div class="flex gap-1 mb-1.5">
                <div v-for="i in 4" :key="i" class="h-1 flex-1 rounded-full transition-colors" :class="i <= strength.level ? strengthBarClass : 'bg-slate-200'" />
              </div>
              <ul class="space-y-1">
                <li v-for="rule in policyRules" :key="rule.label" class="text-[10px] flex items-center gap-1" :class="rule.ok ? 'text-emerald-600' : 'text-slate-400'">
                  <span class="material-symbols-outlined text-[14px]">{{ rule.ok ? 'check_circle' : 'radio_button_unchecked' }}</span>
                  {{ rule.label }}
                </li>
              </ul>
            </div>
          </div>

          <div>
            <label class="block text-[9px] font-bold uppercase tracking-[0.2em] text-slate-500 mb-2">Confirmar contraseña</label>
            <div class="relative">
              <span class="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-lg">check_circle</span>
              <input
                v-model="confirmPassword"
                :type="showConfirmPass ? 'text' : 'password'"
                required
                autocomplete="new-password"
                placeholder="Repite la contraseña"
                class="w-full pl-11 pr-11 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:bg-white outline-none text-sm font-bold"
                :class="{ 'border-red-300 bg-red-50': confirmPassword && newPassword !== confirmPassword }"
              />
              <button type="button" @click="showConfirmPass = !showConfirmPass" class="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-primary">
                <span class="material-symbols-outlined text-lg">{{ showConfirmPass ? 'visibility_off' : 'visibility' }}</span>
              </button>
            </div>
          </div>

          <transition name="fade">
            <p v-if="errorMsg" class="text-xs text-secondary font-bold flex items-center gap-1">
              <span class="material-symbols-outlined text-sm">error</span>{{ errorMsg }}
            </p>
          </transition>

          <button
            type="submit"
            :disabled="loading || !canSubmit"
            class="w-full bg-primary text-white font-bold py-3.5 sm:py-4 rounded-xl shadow-lg shadow-primary/20 hover:brightness-110 transition-all disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
          >
            <span v-if="loading" class="material-symbols-outlined animate-spin">progress_activity</span>
            <span v-else>Restablecer contraseña</span>
            <span v-if="!loading" class="material-symbols-outlined text-lg">lock_reset</span>
          </button>
        </form>
      </transition>
    </div>

    <template #footer>
      <button
        v-if="paso > 1"
        type="button"
        @click="irAtras"
        class="w-full flex items-center justify-center gap-2 text-sm font-bold text-slate-500 hover:text-primary transition-colors py-2"
      >
        <span class="material-symbols-outlined text-lg">arrow_back</span>
        {{ paso === 2 ? 'Cambiar CI' : 'Volver al código' }}
      </button>
      <router-link
        v-else
        to="/login"
        class="w-full flex items-center justify-center gap-2 text-sm font-bold text-slate-500 hover:text-primary transition-colors py-2"
      >
        <span class="material-symbols-outlined text-lg">arrow_back</span>
        Volver al login
      </router-link>
    </template>
  </AuthSplitLayout>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '../services/api'
import { applySiteTitle } from '../utils/siteTitle'
import Swal from 'sweetalert2'
import AuthSplitLayout from '../components/auth/AuthSplitLayout.vue'
import { getPasswordStrength, isPasswordPolicyValid } from '../utils/passwordPolicy'

const route = useRoute()
const router = useRouter()

const paso = ref(1)
const transitionName = ref('slide-forward')
const ci = ref('')
const code = ref('')
const resetToken = ref('')
const newPassword = ref('')
const confirmPassword = ref('')
const showNewPass = ref(false)
const showConfirmPass = ref(false)
const loading = ref(false)
const errorMsg = ref('')
const cooldown = ref(0)
const siteInfo = ref({})
let cooldownTimer = null

const stepMeta = computed(() => {
  if (paso.value === 1) {
    return {
      title: 'Recuperar acceso',
      subtitle: 'Ingresa tu CI para recibir un código en tu correo registrado.',
    }
  }
  if (paso.value === 2) {
    return {
      title: 'Verificación',
      subtitle: 'Ingresa el código de 6 dígitos que enviamos a tu correo.',
    }
  }
  return {
    title: 'Nueva contraseña',
    subtitle: 'Crea una contraseña segura para tu cuenta.',
  }
})

const strength = computed(() => getPasswordStrength(newPassword.value, ci.value))

const strengthBarClass = computed(() => {
  if (strength.value.level >= 4) return 'bg-emerald-500'
  if (strength.value.level >= 2) return 'bg-amber-500'
  return 'bg-red-500'
})

const policyRules = computed(() => {
  const pwd = newPassword.value
  return [
    { label: 'Mínimo 8 caracteres', ok: pwd.length >= 8 },
    { label: 'Al menos una mayúscula', ok: /[A-Z]/.test(pwd) },
    { label: 'Al menos una minúscula', ok: /[a-z]/.test(pwd) },
    { label: 'Al menos un número', ok: /[0-9]/.test(pwd) },
    { label: 'No igual al CI', ok: !ci.value || pwd.trim() !== ci.value.trim() },
  ]
})

const canSubmit = computed(() =>
  isPasswordPolicyValid(newPassword.value, ci.value) &&
  newPassword.value === confirmPassword.value
)

onMounted(async () => {
  if (route.query.ci) ci.value = String(route.query.ci)

  const token = sessionStorage.getItem('efu_reset_token')
  if (token || route.path === '/restablecer-contrasena') {
    resetToken.value = token || ''
    ci.value = route.query.ci ? String(route.query.ci) : sessionStorage.getItem('efu_reset_ci') || ci.value
    if (resetToken.value) {
      paso.value = 3
    }
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

onUnmounted(() => {
  if (cooldownTimer) clearInterval(cooldownTimer)
})

const avanzarPaso = (nuevoPaso) => {
  transitionName.value = 'slide-forward'
  errorMsg.value = ''
  paso.value = nuevoPaso
}

const irAtras = () => {
  transitionName.value = 'slide-back'
  errorMsg.value = ''
  if (paso.value === 3) {
    paso.value = 2
    return
  }
  paso.value = 1
}

const iniciarCooldown = () => {
  cooldown.value = 60
  cooldownTimer = setInterval(() => {
    cooldown.value--
    if (cooldown.value <= 0) clearInterval(cooldownTimer)
  }, 1000)
}

const solicitarCodigo = async () => {
  loading.value = true
  errorMsg.value = ''
  try {
    await api.post('/auth/forgot-password', { ci: ci.value.trim() })
    avanzarPaso(2)
    iniciarCooldown()
  } catch (err) {
    errorMsg.value = err.response?.data?.message || 'No se pudo procesar la solicitud.'
  } finally {
    loading.value = false
  }
}

const reenviarCodigo = async () => {
  if (cooldown.value > 0) return
  loading.value = true
  errorMsg.value = ''
  try {
    await api.post('/auth/forgot-password', { ci: ci.value.trim() })
    iniciarCooldown()
  } catch (err) {
    errorMsg.value = err.response?.data?.message || 'No se pudo reenviar el código.'
  } finally {
    loading.value = false
  }
}

const verificarCodigo = async () => {
  loading.value = true
  errorMsg.value = ''
  try {
    const { data } = await api.post('/auth/verify-reset-code', {
      ci: ci.value.trim(),
      code: code.value.trim(),
    })
    resetToken.value = data.resetToken
    sessionStorage.setItem('efu_reset_token', data.resetToken)
    sessionStorage.setItem('efu_reset_ci', ci.value.trim())
    avanzarPaso(3)
    router.replace({ path: '/olvide-contrasena', query: { ci: ci.value.trim() } })
  } catch (err) {
    errorMsg.value = err.response?.data?.message || 'Código inválido o expirado.'
  } finally {
    loading.value = false
  }
}

const restablecer = async () => {
  if (!canSubmit.value) return
  loading.value = true
  errorMsg.value = ''
  try {
    await api.post('/auth/reset-password', {
      resetToken: resetToken.value,
      newPassword: newPassword.value,
    })
    sessionStorage.removeItem('efu_reset_token')
    sessionStorage.removeItem('efu_reset_ci')
    await Swal.fire({
      title: 'Contraseña actualizada',
      text: 'Ya puedes iniciar sesión con tu nueva contraseña.',
      icon: 'success',
      confirmButtonColor: '#003399',
    })
    router.push('/login')
  } catch (err) {
    errorMsg.value = err.response?.data?.message || 'No se pudo restablecer la contraseña.'
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

.fade-enter-active, .fade-leave-active { transition: opacity 0.25s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

.slide-forward-enter-active,
.slide-forward-leave-active,
.slide-back-enter-active,
.slide-back-leave-active {
  transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.35s ease;
}

.slide-forward-enter-from {
  opacity: 0;
  transform: translateX(40px);
}
.slide-forward-leave-to {
  opacity: 0;
  transform: translateX(-40px);
}

.slide-back-enter-from {
  opacity: 0;
  transform: translateX(-40px);
}
.slide-back-leave-to {
  opacity: 0;
  transform: translateX(40px);
}
</style>
