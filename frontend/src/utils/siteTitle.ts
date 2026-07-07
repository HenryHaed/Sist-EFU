import { defaultLogo } from '../assets/defaultImages'

const DEFAULT_SITE_TITLE = 'Evaluación Entrada Universitaria UMSA'

function setFavicon(href: string) {
  let link = document.querySelector<HTMLLinkElement>("link[rel='icon']")
  if (!link) {
    link = document.createElement('link')
    link.rel = 'icon'
    document.head.appendChild(link)
  }
  link.type = 'image/png'
  link.href = href

  let apple = document.querySelector<HTMLLinkElement>("link[rel='apple-touch-icon']")
  if (!apple) {
    apple = document.createElement('link')
    apple.rel = 'apple-touch-icon'
    document.head.appendChild(apple)
  }
  apple.href = href
}

/** Logo UMSA en la pestaña del navegador. */
export function applySiteFavicon(url?: string | null) {
  setFavicon(url?.trim() || defaultLogo)
}

/** Actualiza el título de la pestaña del navegador (nombreSitio desde Ajustes). */
export function applySiteTitle(nombreSitio?: string | null) {
  const titulo = nombreSitio?.trim()
  document.title = titulo || DEFAULT_SITE_TITLE
}

export { DEFAULT_SITE_TITLE }
