import { ref } from 'vue'

const isDarkMode = ref(
  typeof document !== 'undefined' && document.documentElement.classList.contains('dark'),
)

export function useDarkMode() {
  const setDarkMode = (dark: boolean, vuetifyTheme?: { global: { name: { value: string } } }) => {
    isDarkMode.value = dark
    document.documentElement.classList.toggle('dark', dark)
    localStorage.theme = dark ? 'dark' : 'light'
    if (vuetifyTheme) {
      vuetifyTheme.global.name.value = dark ? 'umsaDark' : 'umsa'
    }
  }

  const initDarkMode = (vuetifyTheme?: { global: { name: { value: string } } }) => {
    const prefersDark =
      localStorage.theme === 'dark' ||
      (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)
    setDarkMode(prefersDark, vuetifyTheme)
  }

  const toggleDarkMode = (vuetifyTheme?: { global: { name: { value: string } } }) => {
    setDarkMode(!isDarkMode.value, vuetifyTheme)
  }

  return { isDarkMode, setDarkMode, initDarkMode, toggleDarkMode }
}
