import { defaultLogo } from '../assets/defaultImages'

const DEFAULT_SITE_TITLE = 'Evaluación Entrada Universitaria UMSA'
const DEFAULT_SITE_DESCRIPTION =
  'Sitio oficial de la Entrada Folklórica Universitaria de la UMSA: fraternidades, recorrido, eventos, comunicados y resultados de la evaluación folklórica.'

function setMeta(attr: 'name' | 'property', key: string, content: string) {
  const selector = `meta[${attr}="${key}"]`
  let tag = document.querySelector<HTMLMetaElement>(selector)
  if (!tag) {
    tag = document.createElement('meta')
    tag.setAttribute(attr, key)
    document.head.appendChild(tag)
  }
  tag.setAttribute('content', content)
}

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
  const titulo = nombreSitio?.trim() || DEFAULT_SITE_TITLE
  document.title = titulo
  setMeta('property', 'og:title', titulo)
  setMeta('name', 'twitter:title', titulo)
  applySiteDescription()
}

/** Mantiene la descripción que Google y redes usan en el snippet. */
export function applySiteDescription(descripcion?: string | null) {
  const texto = descripcion?.trim() || DEFAULT_SITE_DESCRIPTION
  setMeta('name', 'description', texto)
  setMeta('property', 'og:description', texto)
  setMeta('name', 'twitter:description', texto)
}

export { DEFAULT_SITE_TITLE, DEFAULT_SITE_DESCRIPTION }
