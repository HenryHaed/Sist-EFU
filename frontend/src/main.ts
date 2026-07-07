import { createApp } from 'vue';
import './style.css';
import { createPinia } from 'pinia';
import App from './App.vue';
import router from './router';
import { applySiteFavicon } from './utils/siteTitle';

applySiteFavicon();

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
          primary: '#004a99',
          secondary: '#c8102e',
          background: '#ffffff',
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
      },
      umsaDark: {
        dark: true,
        colors: {
          primary: '#6eb3e8',
          secondary: '#f07885',
          background: '#0f172a',
          surface: '#1e293b',
          'on-background': '#f1f5f9',
          'on-surface': '#f1f5f9',
          'on-primary': '#ffffff',
          'on-secondary': '#ffffff',
          error: '#f07885',
          info: '#6eb3e8',
          success: '#4ade80',
          warning: '#fbbf24',
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

