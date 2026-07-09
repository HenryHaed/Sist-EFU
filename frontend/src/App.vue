<script setup lang="ts">
import { onMounted, onUnmounted, watch } from 'vue'
import SessionExpiryModal from './components/SessionExpiryModal.vue'
import { useAuthStore } from './store/auth'
import { ACTIVITY_EVENTS } from './utils/session'

const authStore = useAuthStore()

const onUserActivity = () => {
  authStore.touchActivity()
}

const bindActivityListeners = () => {
  ACTIVITY_EVENTS.forEach((evt) => {
    window.addEventListener(evt, onUserActivity, { passive: true, capture: true })
  })
  document.addEventListener('visibilitychange', onVisibility)
}

const unbindActivityListeners = () => {
  ACTIVITY_EVENTS.forEach((evt) => {
    window.removeEventListener(evt, onUserActivity, { capture: true } as EventListenerOptions)
  })
  document.removeEventListener('visibilitychange', onVisibility)
}

const onVisibility = () => {
  if (document.visibilityState === 'visible') {
    authStore.checkSessionExpiry()
    authStore.touchActivity(true)
  }
}

/** Si otra pestaña actualiza lastActivityAt, recalcular el timer. */
const onStorage = (e: StorageEvent) => {
  if (e.key === 'lastActivityAt' && authStore.isAuthenticated) {
    authStore.scheduleIdleCheck()
  }
  if (e.key === 'token' && !e.newValue) {
    // Logout en otra pestaña
    if (authStore.token) authStore.logout()
  }
}

onMounted(() => {
  if (authStore.isAuthenticated) {
    authStore.startSessionTimer()
    authStore.touchActivity(true)
  }
  bindActivityListeners()
  window.addEventListener('storage', onStorage)
})

onUnmounted(() => {
  unbindActivityListeners()
  window.removeEventListener('storage', onStorage)
})

watch(
  () => authStore.isAuthenticated,
  (ok) => {
    if (ok) {
      authStore.startSessionTimer()
      authStore.touchActivity(true)
    }
  },
)
</script>

<template>
  <v-app style="background: transparent;">
    <router-view v-slot="{ Component }">
      <transition name="page-fade" mode="out-in">
        <component :is="Component" />
      </transition>
    </router-view>
    <SessionExpiryModal />
  </v-app>
</template>


<style>
/* ============================================
   RESET GLOBAL - Paleta UMSA (Azul, Rojo, Blanco)
   ============================================ */

html, body {
  background-color: #ffffff;
  font-family: 'Inter', sans-serif;
  color: #0f172a;
  margin: 0;
  padding: 0;
  transition: background-color 0.25s ease, color 0.25s ease;
}

html.dark,
html.dark body {
  background-color: #0f172a !important;
  color: #f1f5f9;
}

.v-application {
  background-color: transparent !important;
  background: transparent !important;
  font-family: 'Inter', sans-serif !important;
}

:root {
  --v-theme-primary: 0, 74, 153 !important;
  --v-theme-secondary: 200, 16, 46 !important;
  --v-theme-background: 255, 255, 255 !important;
  --v-theme-surface: 255, 255, 255 !important;
  --v-theme-on-background: 15, 23, 42 !important;
  --v-theme-on-surface: 15, 23, 42 !important;
}

.andean-pattern {
  background-color: #ffffff;
  background-image: linear-gradient(rgba(255,255,255,0.75), rgba(255,255,255,0.75)), url('/src/assets/img/Textura-Andina.png');
  background-repeat: repeat;
  background-size: 500px;
  background-attachment: fixed;
}

/* Transición de página */
.page-fade-enter-active,
.page-fade-leave-active {
  transition: opacity 0.35s ease, transform 0.35s ease;
}
.page-fade-enter-from {
  opacity: 0;
  transform: translateY(12px);
}
.page-fade-leave-to {
  opacity: 0;
  transform: translateY(-12px);
}
</style>
