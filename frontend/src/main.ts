import { createApp } from 'vue';
import './style.css';
import { createPinia } from 'pinia';
import App from './App.vue';
import router from './router';

// Vuetify
import 'vuetify/styles'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'

const vuetify = createVuetify({
  components,
  directives,
  theme: {
    defaultTheme: 'umsa',
    themes: {
      umsa: {
        dark: false,
        colors: {
          primary: '#004a99',    // Azul UMSA
          secondary: '#c8102e',  // Rojo UMSA
          background: '#ffffff', // Fondo blanco puro
          surface: '#ffffff',
          'on-background': '#0f172a',
          'on-surface': '#0f172a',
          'on-primary': '#ffffff',
          'on-secondary': '#ffffff',
          error: '#c8102e',
          info: '#004a99',
          success: '#16a34a',
          warning: '#d97706',
        }
      }
    }
  }
})

const app = createApp(App);
app.use(createPinia());
app.use(router);
app.use(vuetify);
app.mount('#app');

