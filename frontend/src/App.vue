<template>
  <v-app style="background: transparent;">
    <router-view v-slot="{ Component }">
      <transition name="page-fade" mode="out-in">
        <component :is="Component" />
      </transition>
    </router-view>
  </v-app>
</template>

<script setup lang="ts">
// No logic needed here for now
</script>


<style>
/* ============================================
   RESET GLOBAL - Paleta UMSA (Azul, Rojo, Blanco)
   ============================================ */

html, body {
  background-color: #ffffff !important;
  font-family: 'Inter', sans-serif;
  color: #0f172a;
  margin: 0;
  padding: 0;
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
