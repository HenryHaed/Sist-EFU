import { ref } from 'vue'

const isDarkMode = ref(
  typeof document !== 'undefined' && document.documentElement.classList.contains('dark'),
)

type VuetifyThemeLike = {
  change?: (name: string) => void
  global?: { name: { value: string } }
}

const applyVuetifyTheme = (vuetifyTheme: VuetifyThemeLike | undefined, name: string) => {
  if (!vuetifyTheme) return
  if (typeof vuetifyTheme.change === 'function') {
    vuetifyTheme.change(name)
  } else if (vuetifyTheme.global?.name) {
    vuetifyTheme.global.name.value = name
  }
}

export function useDarkMode() {
  const setDarkMode = (dark: boolean, vuetifyTheme?: VuetifyThemeLike) => {
    isDarkMode.value = dark
    document.documentElement.classList.toggle('dark', dark)
    localStorage.theme = dark ? 'dark' : 'light'
    applyVuetifyTheme(vuetifyTheme, dark ? 'umsaDark' : 'umsa')
  }

  const initDarkMode = (vuetifyTheme?: VuetifyThemeLike) => {
    const prefersDark =
      localStorage.theme === 'dark' ||
      (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)
    setDarkMode(prefersDark, vuetifyTheme)
  }

  const toggleDarkMode = (vuetifyTheme?: VuetifyThemeLike) => {
    setDarkMode(!isDarkMode.value, vuetifyTheme)
  }

  return { isDarkMode, setDarkMode, initDarkMode, toggleDarkMode }
}
