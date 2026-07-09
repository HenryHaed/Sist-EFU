<template>
  <div :class="wrapperClass">
    <label v-if="label" class="label-xs">{{ label }}</label>

    <div class="space-y-3">
      <input
        :value="ci"
        type="text"
        inputmode="numeric"
        :required="required"
        :placeholder="placeholderCi"
        :disabled="disabled"
        :class="claseInput"
        @input="onCiInput"
        @keypress="onlyNumbers"
      />

      <div
        class="flex items-center justify-between gap-4 p-3.5 rounded-2xl border transition-colors"
        :class="activo ? 'bg-primary/5 border-primary/20' : 'bg-white border-slate-200'"
      >
        <div class="min-w-0 flex-1">
          <p class="text-[10px] font-black uppercase tracking-wider text-slate-700">¿CI con complemento SEGIP?</p>
          <p class="text-[9px] text-slate-400 font-medium mt-0.5 leading-relaxed">
            Actívalo solo si el carnet incluye código alfanumérico (ej. <span class="font-bold text-slate-500">-1A</span>, <span class="font-bold text-slate-500">-1B</span>).
          </p>
        </div>
        <button
          type="button"
          role="switch"
          :aria-checked="activo"
          :disabled="disabled"
          class="ci-toggle shrink-0"
          :class="{ 'ci-toggle--on': activo, 'opacity-50 cursor-not-allowed': disabled }"
          @click="toggleActivo"
        >
          <span class="ci-toggle__thumb"></span>
        </button>
      </div>

      <div v-if="activo" class="animate-in fade-in slide-in-from-top-1 duration-300">
        <label class="block text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1.5 px-0.5">Complemento de CI</label>
        <input
          :value="complemento"
          type="text"
          maxlength="6"
          placeholder="Ej. -1A"
          :disabled="disabled"
          :class="[claseInput, 'uppercase tracking-widest font-black']"
          @input="onComplementoInput"
        />
        <p class="text-[9px] text-slate-400 font-medium mt-1.5 px-0.5">Código asignado por SEGIP para distinguir homónimos.</p>
      </div>
    </div>

    <p v-if="mensajeError" class="text-[10px] text-red-600 font-bold mt-1.5">{{ mensajeError }}</p>
    <p v-else-if="estadoValidacion?.estado === 'checking'" class="text-[10px] text-slate-400 font-bold mt-1.5">Verificando CI...</p>
    <p v-else-if="estadoValidacion?.estado === 'ok'" class="text-[10px] text-emerald-600 font-bold mt-1.5">{{ estadoValidacion.mensaje }}</p>
  </div>
</template>

<script setup>
const props = defineProps({
  ci: { type: String, default: '' },
  complemento: { type: String, default: '' },
  activo: { type: Boolean, default: false },
  label: { type: String, default: '' },
  placeholderCi: { type: String, default: 'Número de CI' },
  required: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
  claseInput: { type: [String, Array, Object], default: 'form-input' },
  estadoValidacion: { type: Object, default: null },
  mensajeError: { type: String, default: '' },
  wrapperClass: { type: String, default: '' },
})

const emit = defineEmits(['update:ci', 'update:complemento', 'update:activo', 'ci-change'])

const onlyNumbers = (e) => {
  const char = String.fromCharCode(e.keyCode)
  if (!/[0-9]/.test(char)) e.preventDefault()
}

const onCiInput = (e) => {
  emit('update:ci', e.target.value)
  emit('ci-change')
}

const normalizarComplemento = (val) => {
  let v = String(val || '').trim().toUpperCase().replace(/\s/g, '')
  if (!v) return ''
  if (!v.startsWith('-')) v = `-${v.replace(/^-*/, '')}`
  return v
}

const onComplementoInput = (e) => {
  emit('update:complemento', normalizarComplemento(e.target.value))
  emit('ci-change')
}

const toggleActivo = () => {
  if (props.disabled) return
  const next = !props.activo
  emit('update:activo', next)
  if (!next) emit('update:complemento', '')
  emit('ci-change')
}
</script>

<style scoped>
.ci-toggle {
  width: 44px;
  height: 24px;
  border-radius: 999px;
  background: #cbd5e1;
  position: relative;
  transition: background 0.25s ease;
}
.ci-toggle--on {
  background: #003399;
}
.ci-toggle__thumb {
  position: absolute;
  top: 3px;
  left: 3px;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: white;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);
  transition: transform 0.25s ease;
}
.ci-toggle--on .ci-toggle__thumb {
  transform: translateX(20px);
}
</style>
