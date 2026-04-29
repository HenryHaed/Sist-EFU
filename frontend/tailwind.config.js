/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        "primary": "#004a99",
        "secondary": "#c8102e",
        "primary-umsa": "#004a99",
        "secondary-umsa": "#c8102e",
        "accent": "#ffffff",
        "deep-blue": "#002d5a",
        "text-main": "#0f172a",
        "text-muted": "#64748b",
        "background-light": "#ffffff",
      },
      fontFamily: {
        "display": ["Inter", "sans-serif"]
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@container-queries/tailwindcss'),
  ],
}
