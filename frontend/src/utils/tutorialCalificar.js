/** Tutoriales de calificación: overlay coach-mark (primera visita + reapertura). */

export const TUTORIAL_VARIANT = {
  FASE_EFU: 'fase-efu',
  FASE_EXTERNO: 'fase-externo',
  LISTADO_EFU: 'listado-efu',
  LISTADO_EXTERNO: 'listado-externo',
  WIZARD_EFU: 'wizard-efu',
  WIZARD_EXTERNO: 'wizard-externo',
}

const STORAGE_PREFIX = 'efu_tutorial_calificar_v2_'

export function tutorialStorageKey(variant) {
  return `${STORAGE_PREFIX}${variant}`
}

export function hasSeenTutorial(variant) {
  try {
    return localStorage.getItem(tutorialStorageKey(variant)) === '1'
  } catch {
    return false
  }
}

export function markTutorialSeen(variant) {
  try {
    localStorage.setItem(tutorialStorageKey(variant), '1')
  } catch {
    /* ignore */
  }
}

/**
 * @typedef {{
 *   id: string,
 *   label: string,
 *   sub?: string,
 *   prefer?: 'top' | 'bottom' | 'left' | 'right',
 * }} TutorialCallout
 *
 * @typedef {{
 *   title: string,
 *   tip: string,
 *   callouts: TutorialCallout[],
 *   floats?: { label: string, sub?: string, spot: 'mid-left' | 'mid-right' | 'bottom' }[],
 * }} TutorialContent
 */

/** @type {Record<string, TutorialContent>} */
export const TUTORIAL_CONTENT = {
  [TUTORIAL_VARIANT.FASE_EFU]: {
    title: 'Calificar fases EFU',
    tip: 'Elige una fase habilitada. Dentro deberás calificar TODOS los criterios de cada fraternidad.',
    callouts: [
      { id: 'fase-card', label: 'Fase', sub: 'Toca para entrar', prefer: 'bottom' },
      { id: 'fase-enter', label: 'Entrar a calificar', prefer: 'top' },
    ],
    floats: [
      {
        spot: 'mid-right',
        label: 'Cada criterio',
        sub: 'Debes puntuar todos los criterios por fraternidad',
      },
    ],
  },
  [TUTORIAL_VARIANT.FASE_EXTERNO]: {
    title: 'Concursos externos',
    tip: 'Elige un concurso habilitado. Dentro califica TODOS los criterios de cada participante.',
    callouts: [
      { id: 'fase-card', label: 'Concurso', sub: 'Toca para entrar', prefer: 'bottom' },
      { id: 'fase-enter', label: 'Entrar a calificar', prefer: 'top' },
    ],
    floats: [
      {
        spot: 'mid-right',
        label: 'Cada criterio',
        sub: 'Obligatorio puntuar todos los criterios',
      },
    ],
  },
  [TUTORIAL_VARIANT.LISTADO_EFU]: {
    title: 'Fraternidades',
    tip: 'Busca la fraternidad e inicia la evaluación. Debes calificar cada criterio.',
    callouts: [
      { id: 'volver', label: 'Volver', prefer: 'bottom' },
      { id: 'buscar', label: 'Buscar', prefer: 'bottom' },
      { id: 'calificar', label: 'Calificar', sub: 'Abre el asistente', prefer: 'left' },
      { id: 'tiempo', label: 'Tiempo de fase', prefer: 'bottom' },
    ],
    floats: [
      {
        spot: 'bottom',
        label: 'Importante',
        sub: 'Califica TODOS los criterios de la fraternidad',
      },
    ],
  },
  [TUTORIAL_VARIANT.LISTADO_EXTERNO]: {
    title: 'Competidores',
    tip: 'Elige al participante e inicia la evaluación. Debes calificar cada criterio.',
    callouts: [
      { id: 'volver', label: 'Volver', prefer: 'bottom' },
      { id: 'buscar', label: 'Buscar', prefer: 'bottom' },
      { id: 'calificar', label: 'Calificar', sub: 'Abre el asistente', prefer: 'left' },
      { id: 'tiempo', label: 'Tiempo', prefer: 'bottom' },
    ],
    floats: [
      {
        spot: 'bottom',
        label: 'Importante',
        sub: 'Califica TODOS los criterios del concursante',
      },
    ],
  },
  [TUTORIAL_VARIANT.WIZARD_EFU]: {
    title: 'Calificar fraternidad',
    tip: 'Completa cada criterio (puntaje o SI/NO en disciplina). Sin todos no puedes finalizar.',
    callouts: [
      { id: 'volver', label: 'Volver', prefer: 'bottom' },
      { id: 'puntaje', label: 'Criterio', sub: 'Puntaje o decisión SI/NO', prefer: 'top' },
      { id: 'anterior', label: 'Anterior', prefer: 'right' },
      { id: 'guardar', label: 'Guardar', prefer: 'top' },
      { id: 'siguiente', label: 'Siguiente', sub: 'Siguiente criterio', prefer: 'left' },
      { id: 'finalizar', label: 'Finalizar', sub: 'Con todos los criterios', prefer: 'left' },
    ],
    floats: [
      {
        spot: 'mid-left',
        label: 'Obligatorio',
        sub: 'Califica CADA criterio de la fraternidad',
      },
    ],
  },
  [TUTORIAL_VARIANT.WIZARD_EXTERNO]: {
    title: 'Calificar concurso',
    tip: 'Ingresa el puntaje de cada criterio. Sin todos los criterios no puedes finalizar.',
    callouts: [
      { id: 'volver', label: 'Volver', prefer: 'bottom' },
      { id: 'puntaje', label: 'Puntaje', sub: 'Nota de este criterio', prefer: 'top' },
      { id: 'anterior', label: 'Anterior', prefer: 'right' },
      { id: 'guardar', label: 'Guardar', prefer: 'top' },
      { id: 'siguiente', label: 'Siguiente', sub: 'Siguiente criterio', prefer: 'left' },
      { id: 'finalizar', label: 'Finalizar', sub: 'Con todos los criterios', prefer: 'left' },
    ],
    floats: [
      {
        spot: 'mid-left',
        label: 'Obligatorio',
        sub: 'Califica CADA criterio del concursante',
      },
    ],
  },
}

export function getTutorialContent(variant) {
  return TUTORIAL_CONTENT[variant] || TUTORIAL_CONTENT[TUTORIAL_VARIANT.FASE_EFU]
}
