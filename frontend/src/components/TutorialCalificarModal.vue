<template>
  <Teleport to="body">
    <div
      v-if="modelValue"
      class="fixed inset-0 z-[100] select-none"
      role="dialog"
      aria-modal="true"
      :aria-label="content.title"
    >
      <div class="absolute inset-0 bg-slate-950/60" @click="cerrar" />

      <!-- Anillos -->
      <div
        v-for="item in positioned"
        :key="`ring-${item.id}`"
        class="absolute pointer-events-none rounded-2xl ring-[3px] ring-white shadow-[0_0_24px_rgba(255,255,255,0.45)]"
        :style="item.ringStyle"
      />

      <svg
        v-if="!isMobile"
        class="absolute inset-0 w-full h-full pointer-events-none overflow-visible"
        aria-hidden="true"
      >
        <line
          v-for="item in positioned"
          :key="`line-${item.id}`"
          :x1="item.line.x1"
          :y1="item.line.y1"
          :x2="item.line.x2"
          :y2="item.line.y2"
          stroke="rgba(255,255,255,0.9)"
          stroke-width="2"
        />
        <circle
          v-for="item in positioned"
          :key="`dot-${item.id}`"
          :cx="item.line.x2"
          :cy="item.line.y2"
          r="4"
          fill="white"
        />
      </svg>

      <!-- Cabecera -->
      <div
        class="absolute left-3 right-3 sm:left-6 sm:right-auto sm:max-w-md z-10 rounded-2xl border-2 border-white/80 bg-slate-900/85 text-white px-4 sm:px-5 py-3.5 sm:py-4 shadow-2xl backdrop-blur-md"
        :style="{ top: 'max(0.75rem, env(safe-area-inset-top))' }"
      >
        <div class="flex items-start gap-3">
          <div class="min-w-0 flex-1">
            <h2 class="text-base sm:text-sm font-black tracking-wide leading-tight">{{ content.title }}</h2>
            <p class="text-sm sm:text-[12px] leading-snug text-white/85 mt-1.5 font-medium">{{ content.tip }}</p>
          </div>
          <button
            type="button"
            class="size-10 sm:size-8 rounded-full border-2 border-white/50 text-white hover:bg-white/10 flex items-center justify-center shrink-0"
            aria-label="Cerrar tutorial"
            @click="cerrar"
          >
            <span class="material-symbols-outlined text-[22px] sm:text-[18px]">close</span>
          </button>
        </div>
      </div>

      <!-- Desktop: callouts flotantes -->
      <template v-if="!isMobile">
        <div
          v-for="item in positioned"
          :key="`bubble-${item.id}`"
          class="absolute z-10 max-w-[13rem] rounded-2xl border-2 border-white/80 bg-slate-900/85 text-white px-3.5 py-2.5 shadow-xl backdrop-blur-sm pointer-events-none"
          :style="item.bubbleStyle"
        >
          <p class="text-sm font-black leading-tight">{{ item.label }}</p>
          <p v-if="item.sub" class="text-xs text-white/80 leading-snug mt-1 font-medium">{{ item.sub }}</p>
        </div>
        <div
          v-for="(f, i) in content.floats || []"
          :key="`float-${i}`"
          class="absolute z-10 max-w-[13rem] rounded-2xl border-2 border-amber-300/90 bg-amber-950/85 text-amber-50 px-3.5 py-2.5 shadow-xl backdrop-blur-sm pointer-events-none"
          :class="floatClass(f.spot)"
        >
          <p class="text-sm font-black leading-tight">{{ f.label }}</p>
          <p v-if="f.sub" class="text-xs text-amber-100/90 leading-snug mt-1 font-medium">{{ f.sub }}</p>
        </div>
      </template>

      <!-- Móvil: panel inferior con tips grandes (sin solaparse) -->
      <div
        v-if="isMobile"
        class="absolute left-0 right-0 bottom-0 z-20 rounded-t-3xl border-t-2 border-white/70 bg-slate-900/92 text-white shadow-2xl backdrop-blur-md px-4 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))] max-h-[48vh] flex flex-col"
      >
        <div class="w-10 h-1 rounded-full bg-white/30 mx-auto mb-3 shrink-0" />
        <p class="text-sm font-black text-amber-300 mb-2 shrink-0">Qué hace cada botón</p>
        <div class="overflow-y-auto space-y-2.5 flex-1 min-h-0 pr-1">
          <div
            v-for="(tip, i) in mobileTips"
            :key="`mtip-${i}`"
            class="rounded-2xl border border-white/25 bg-white/10 px-3.5 py-3"
            :class="tip.highlight ? 'border-amber-300/70 bg-amber-500/15' : ''"
          >
            <p class="text-base font-black leading-snug">{{ tip.label }}</p>
            <p v-if="tip.sub" class="text-sm text-white/80 leading-snug mt-1 font-medium">{{ tip.sub }}</p>
          </div>
        </div>
        <button
          type="button"
          class="mt-3 w-full py-3.5 rounded-2xl bg-white text-slate-900 text-base font-black hover:bg-slate-100 transition-colors shrink-0"
          @click="cerrar"
        >
          Entendido
        </button>
      </div>

      <!-- Desktop: botón entendido -->
      <button
        v-if="!isMobile"
        type="button"
        class="absolute z-20 left-6 bottom-6 px-5 py-2.5 rounded-xl border-2 border-white/70 bg-white text-slate-900 text-sm font-black shadow-lg hover:bg-slate-100 transition-colors"
        @click="cerrar"
      >
        Entendido
      </button>
    </div>
  </Teleport>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { getTutorialContent, markTutorialSeen } from '../utils/tutorialCalificar'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  variant: { type: String, required: true },
})

const emit = defineEmits(['update:modelValue'])

const content = computed(() => getTutorialContent(props.variant))
const positioned = ref([])
const isMobile = ref(false)
let raf = 0

const mobileTips = computed(() => {
  const tips = []
  for (const c of content.value.callouts || []) {
    tips.push({ label: c.label, sub: c.sub, highlight: false })
  }
  for (const f of content.value.floats || []) {
    tips.push({ label: f.label, sub: f.sub, highlight: true })
  }
  // Deduplicar por label
  const seen = new Set()
  return tips.filter((t) => {
    if (seen.has(t.label)) return false
    seen.add(t.label)
    return true
  })
})

function floatClass(spot) {
  if (spot === 'mid-right') return 'right-4 top-1/2 -translate-y-1/2'
  if (spot === 'bottom') return 'left-1/2 -translate-x-1/2 bottom-24'
  return 'left-4 top-[40%]'
}

function updateIsMobile() {
  isMobile.value = window.innerWidth < 640
}

function measure() {
  updateIsMobile()
  const pad = 12
  const vw = window.innerWidth
  const vh = window.innerHeight
  const next = []
  const headerReserve = isMobile.value ? 120 : 88
  const bottomReserve = isMobile.value ? Math.min(vh * 0.48, 360) : 72

  for (const callout of content.value.callouts || []) {
    const nodes = document.querySelectorAll(`[data-tutorial="${callout.id}"]`)
    let r = null
    for (const node of nodes) {
      const rect = node.getBoundingClientRect()
      if (rect.width >= 2 && rect.height >= 2 && rect.bottom > 0 && rect.top < vh && rect.right > 0 && rect.left < vw) {
        r = rect
        break
      }
    }
    if (!r) continue

    const ringPad = isMobile.value ? 5 : 6
    const ring = {
      left: `${Math.max(4, r.left - ringPad)}px`,
      top: `${Math.max(4, r.top - ringPad)}px`,
      width: `${r.width + ringPad * 2}px`,
      height: `${r.height + ringPad * 2}px`,
    }

    if (isMobile.value) {
      // En móvil solo anillos; tips van en el panel inferior
      next.push({
        id: callout.id,
        label: callout.label,
        sub: callout.sub,
        ringStyle: ring,
        bubbleStyle: {},
        line: { x1: 0, y1: 0, x2: 0, y2: 0 },
      })
      continue
    }

    const prefer = callout.prefer || 'top'
    const bubbleW = Math.min(208, vw - 24)
    const bubbleH = callout.sub ? 58 : 40
    let left = r.left + r.width / 2 - bubbleW / 2
    let top = prefer === 'bottom' ? r.bottom + pad : r.top - bubbleH - pad

    if (prefer === 'left') {
      left = r.left - bubbleW - pad
      top = r.top + r.height / 2 - bubbleH / 2
    } else if (prefer === 'right') {
      left = r.right + pad
      top = r.top + r.height / 2 - bubbleH / 2
    }

    left = Math.min(Math.max(8, left), vw - bubbleW - 8)
    top = Math.min(Math.max(headerReserve, top), vh - bubbleH - bottomReserve)

    const anchorX = r.left + r.width / 2
    const anchorY = prefer === 'bottom' ? r.bottom : prefer === 'top' ? r.top : r.top + r.height / 2
    const bubbleCx = left + bubbleW / 2
    const bubbleCy =
      prefer === 'left' || prefer === 'right'
        ? top + bubbleH / 2
        : prefer === 'bottom'
          ? top
          : top + bubbleH

    next.push({
      id: callout.id,
      label: callout.label,
      sub: callout.sub,
      ringStyle: ring,
      bubbleStyle: { left: `${left}px`, top: `${top}px`, width: `${bubbleW}px` },
      line: { x1: bubbleCx, y1: bubbleCy, x2: anchorX, y2: anchorY },
    })
  }

  positioned.value = next
}

function scheduleMeasure() {
  cancelAnimationFrame(raf)
  raf = requestAnimationFrame(() => measure())
}

function onScrollOrResize() {
  scheduleMeasure()
}

function bindListeners(on) {
  const method = on ? 'addEventListener' : 'removeEventListener'
  window[method]('resize', onScrollOrResize)
  window[method]('scroll', onScrollOrResize, true)
}

async function openOverlay() {
  await nextTick()
  updateIsMobile()
  const preferScroll = ['calificar', 'fase-card', 'puntaje', 'fase-enter']
  for (const id of preferScroll) {
    const nodes = document.querySelectorAll(`[data-tutorial="${id}"]`)
    for (const node of nodes) {
      const rect = node.getBoundingClientRect()
      if (rect.height >= 2 && rect.width >= 2) {
        node.scrollIntoView({ block: isMobile.value ? 'start' : 'center', behavior: 'instant' })
        break
      }
    }
  }
  measure()
  setTimeout(measure, 80)
  setTimeout(measure, 220)
  setTimeout(measure, 500)
  bindListeners(true)
}

function closeOverlay() {
  bindListeners(false)
  cancelAnimationFrame(raf)
  positioned.value = []
}

function cerrar() {
  markTutorialSeen(props.variant)
  emit('update:modelValue', false)
}

watch(
  () => props.modelValue,
  (open) => {
    if (open) openOverlay()
    else closeOverlay()
  },
)

watch(
  () => props.variant,
  () => {
    if (props.modelValue) scheduleMeasure()
  },
)

onBeforeUnmount(() => {
  closeOverlay()
})
</script>
