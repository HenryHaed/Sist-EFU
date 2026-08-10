<template>
  <div class="dashboard-page max-w-4xl">
    <div class="mb-6 sm:mb-8">
      <div class="flex items-center gap-3 mb-2">
        <span class="h-6 sm:h-8 w-2 bg-secondary rounded-full shrink-0"></span>
        <h2 class="dashboard-page-title italic uppercase text-primary">Ficha Técnica Monografía</h2>
      </div>
      <p class="text-slate-500 font-medium text-sm">
        Completa los datos oficiales. Luego genera el PDF en formato carta. Si hay un error, usa
        <b>Corregir mi ficha técnica</b> para borrar el PDF anterior y volver a editar.
      </p>
    </div>

    <div v-if="loading" class="py-20 text-center text-slate-400">
      <span class="material-symbols-outlined animate-spin text-4xl">progress_activity</span>
    </div>

    <template v-else-if="form">
      <div class="mb-5 flex flex-wrap items-center gap-3">
        <span
          class="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border"
          :class="form.estado === 'GENERADA'
            ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
            : 'bg-amber-50 text-amber-700 border-amber-100'"
        >{{ form.estado === 'GENERADA' ? 'Ficha generada' : 'Borrador' }}</span>
        <span v-if="form.fechaGeneracion" class="text-xs text-slate-500 font-medium">
          Generada: {{ formatFecha(form.fechaGeneracion) }}
        </span>
      </div>

      <div v-if="form.estado === 'GENERADA'" class="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <p class="text-sm text-emerald-900 font-medium">
          Tu ficha ya está generada. Puedes descargarla o corregirla (se eliminará el PDF actual).
        </p>
        <div class="flex flex-wrap gap-2">
          <button type="button" @click="descargar" class="px-4 py-2 bg-primary text-white rounded-xl text-xs font-black uppercase tracking-widest">
            Descargar PDF
          </button>
          <button type="button" @click="corregir" :disabled="working" class="px-4 py-2 bg-secondary text-white rounded-xl text-xs font-black uppercase tracking-widest disabled:opacity-50">
            Corregir mi ficha técnica
          </button>
        </div>
      </div>

      <fieldset :disabled="!editable" class="space-y-6 disabled:opacity-90">
        <section class="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 sm:p-6 space-y-4">
          <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <h3 class="text-[10px] font-black uppercase tracking-widest text-slate-400">Datos heredados de la inscripción</h3>
            <p class="text-[10px] text-amber-700 font-bold uppercase tracking-wide">
              No editables · vienen de la solicitud aprobada
            </p>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="md:col-span-2">
              <label class="lbl">1. Nombre de la fraternidad o taller cultural</label>
              <input :value="form.nombreFraternidad" class="inp inp-locked" readonly tabindex="-1" />
            </div>
            <div>
              <label class="lbl">2. Categoría</label>
              <input :value="form.categoria" class="inp inp-locked" readonly tabindex="-1" />
            </div>
            <div>
              <label class="lbl">Danza (tipo de danza)</label>
              <input :value="form.danza" class="inp inp-locked" readonly tabindex="-1" />
            </div>
            <div class="md:col-span-2">
              <label class="lbl">3. Instancia a la que pertenece</label>
              <select :value="form.instanciaRepresentacion" class="inp inp-locked" disabled>
                <option value="">—</option>
                <option value="Facultad">Facultad</option>
                <option value="Carrera">Carrera</option>
                <option value="UMSA">UMSA</option>
                <option value="FEDSIDUMSA">FEDSIDUMSA</option>
                <option value="STUMSA">STUMSA</option>
                <option value="Externo">Externo</option>
              </select>
            </div>
            <div v-if="form.instanciaRepresentacion === 'Facultad' || form.instanciaRepresentacion === 'Carrera'">
              <label class="lbl">Facultad</label>
              <input :value="form.facultadNombre || form.facultadCarrera" class="inp inp-locked" readonly tabindex="-1" />
            </div>
            <div v-if="form.instanciaRepresentacion === 'Carrera'">
              <label class="lbl">Carrera</label>
              <input :value="form.carreraNombre" class="inp inp-locked" readonly tabindex="-1" />
            </div>
            <div v-if="form.instanciaRepresentacion === 'Externo'" class="md:col-span-2">
              <label class="lbl">Institución externa</label>
              <input :value="form.institucionNombre || form.facultadCarrera" class="inp inp-locked" readonly tabindex="-1" />
            </div>
            <div
              v-if="['UMSA', 'FEDSIDUMSA', 'STUMSA'].includes(form.instanciaRepresentacion)"
              class="md:col-span-2"
            >
              <label class="lbl">Nivel / instancia</label>
              <input :value="form.facultadCarrera || form.instanciaRepresentacion" class="inp inp-locked" readonly tabindex="-1" />
            </div>
          </div>
        </section>

        <section class="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 sm:p-6 space-y-4">
          <h3 class="text-[10px] font-black uppercase tracking-widest text-slate-400">Datos de la ficha técnica</h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="md:col-span-2">
              <label class="lbl">Lugar de origen de la danza *</label>
              <input v-model="form.lugarOrigenDanza" class="inp" />
            </div>
            <div class="md:col-span-2">
              <label class="lbl">Breve sinopsis de la danza *</label>
              <textarea v-model="form.sinopsisDanza" rows="3" class="inp" />
            </div>
            <div class="md:col-span-2">
              <label class="lbl">Breve reseña histórica de la fraternidad *</label>
              <textarea v-model="form.resenaHistorica" rows="3" class="inp" />
            </div>
            <div>
              <label class="lbl">Fecha de fundación *</label>
              <input v-model="form.fechaFundacion" type="date" class="inp" />
            </div>
            <div class="md:col-span-2">
              <label class="lbl">Fundadores de la fraternidad *</label>
              <textarea v-model="form.fundadores" rows="2" class="inp" />
            </div>
            <div class="md:col-span-2">
              <label class="lbl">Premios logrados desde la fundación *</label>
              <textarea v-model="form.premios" rows="2" class="inp" />
            </div>
            <div class="md:col-span-2">
              <label class="lbl">Nombre de quien firma (Presidente o Delegado Titular) *</label>
              <input
                v-model="form.nombreFirmante"
                class="inp"
                placeholder="NOMBRE COMPLETO DEL FIRMANTE"
                @input="form.nombreFirmante = String(form.nombreFirmante || '').toUpperCase()"
              />
              <p class="text-[10px] text-slate-400 mt-1 font-medium">
                En el PDF: debajo de la línea de firma y antes de «Firma de Presidente o Delegado Titular».
              </p>
            </div>
          </div>
        </section>

        <section class="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 sm:p-6 space-y-4">
          <h3 class="text-[10px] font-black uppercase tracking-widest text-secondary">Expositores para la defensa de monografía</h3>
          <div v-for="(p, i) in form.expositores" :key="'ex-'+i" class="grid grid-cols-1 md:grid-cols-12 gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-100">
            <p class="md:col-span-12 text-[10px] font-black text-slate-400 uppercase">Persona {{ i + 1 }}</p>
            <div class="md:col-span-5">
              <label class="lbl">Nombre(s) y Apellidos *</label>
              <input v-model="p.nombresApellidos" class="inp" @input="p.nombresApellidos = String(p.nombresApellidos||'').toUpperCase()" />
            </div>
            <div class="md:col-span-2">
              <label class="lbl">C.I. *</label>
              <input v-model="p.ci" class="inp" />
            </div>
            <div class="md:col-span-3">
              <label class="lbl">Matrícula *</label>
              <input v-model="p.matricula" class="inp" />
            </div>
            <div class="md:col-span-2">
              <label class="lbl">Celular *</label>
              <input v-model="p.celular" class="inp" />
            </div>
          </div>
        </section>

        <section class="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 sm:p-6 space-y-4">
          <h3 class="text-[10px] font-black uppercase tracking-widest text-secondary">Representantes para la exposición de traje típico</h3>
          <div v-for="(p, i) in form.representantesTraje" :key="'tr-'+i" class="grid grid-cols-1 md:grid-cols-12 gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-100">
            <p class="md:col-span-12 text-[10px] font-black text-slate-400 uppercase">Persona {{ i + 1 }}</p>
            <div class="md:col-span-5">
              <label class="lbl">Nombre(s) y Apellidos *</label>
              <input v-model="p.nombresApellidos" class="inp" @input="p.nombresApellidos = String(p.nombresApellidos||'').toUpperCase()" />
            </div>
            <div class="md:col-span-2">
              <label class="lbl">C.I. *</label>
              <input v-model="p.ci" class="inp" />
            </div>
            <div class="md:col-span-3">
              <label class="lbl">Matrícula *</label>
              <input v-model="p.matricula" class="inp" />
            </div>
            <div class="md:col-span-2">
              <label class="lbl">Celular *</label>
              <input v-model="p.celular" class="inp" />
            </div>
          </div>
        </section>
      </fieldset>

      <div v-if="editable" class="mt-6 flex flex-col sm:flex-row justify-end gap-3">
        <button type="button" @click="guardar" :disabled="working" class="px-6 py-3 bg-slate-800 text-white rounded-xl text-xs font-black uppercase tracking-widest disabled:opacity-50">
          {{ working ? 'Guardando…' : 'Guardar borrador' }}
        </button>
        <button type="button" @click="generar" :disabled="working" class="px-6 py-3 bg-primary text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-primary/20 disabled:opacity-50">
          {{ working ? 'Generando…' : 'Generar ficha técnica (PDF)' }}
        </button>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import Swal from 'sweetalert2'
import api from '../services/api'

const loading = ref(true)
const working = ref(false)
const form = ref(null)

const editable = computed(() => form.value?.estado === 'BORRADOR')

const formatFecha = (d) => {
  if (!d) return ''
  return new Date(d).toLocaleString('es-BO', {
    day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

const ensurePersonas = (data) => {
  const fill = (arr) => {
    const list = Array.isArray(arr) ? [...arr] : []
    while (list.length < 2) list.push({ nombresApellidos: '', ci: '', matricula: '', celular: '' })
    return list.slice(0, 2)
  }
  return {
    ...data,
    expositores: fill(data.expositores),
    representantesTraje: fill(data.representantesTraje),
    fechaFundacion: data.fechaFundacion ? String(data.fechaFundacion).slice(0, 10) : '',
  }
}

const cargar = async () => {
  loading.value = true
  try {
    const { data } = await api.get('/ficha-tecnica/mi')
    form.value = ensurePersonas(data)
  } catch (e) {
    Swal.fire('Error', e.response?.data?.message || 'No se pudo cargar la ficha', 'error')
  } finally {
    loading.value = false
  }
}

const payload = () => ({
  lugarOrigenDanza: form.value.lugarOrigenDanza,
  sinopsisDanza: form.value.sinopsisDanza,
  resenaHistorica: form.value.resenaHistorica,
  fechaFundacion: form.value.fechaFundacion || null,
  fundadores: form.value.fundadores,
  premios: form.value.premios,
  nombreFirmante: form.value.nombreFirmante,
  expositores: form.value.expositores,
  representantesTraje: form.value.representantesTraje,
})

const guardar = async () => {
  working.value = true
  try {
    const { data } = await api.put('/ficha-tecnica/mi', payload())
    form.value = ensurePersonas(data)
    Swal.fire({ icon: 'success', title: 'Borrador guardado', toast: true, position: 'top-end', timer: 2000, showConfirmButton: false })
  } catch (e) {
    Swal.fire('Error', e.response?.data?.message || 'No se pudo guardar', 'error')
  } finally {
    working.value = false
  }
}

const downloadBlob = (blob, filename) => {
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  window.URL.revokeObjectURL(url)
}

const generar = async () => {
  working.value = true
  try {
    await api.put('/ficha-tecnica/mi', payload())
    const { data } = await api.post('/ficha-tecnica/mi/generar', null, { responseType: 'blob' })
    downloadBlob(data, `Ficha_Tecnica_${(form.value.nombreFraternidad || 'fraternidad').replace(/\s+/g, '_')}.pdf`)
    await cargar()
    Swal.fire('Generada', 'La ficha técnica PDF se descargó correctamente.', 'success')
  } catch (e) {
    let msg = 'No se pudo generar el PDF'
    if (e.response?.data instanceof Blob) {
      try {
        const text = await e.response.data.text()
        const json = JSON.parse(text)
        msg = json.message || msg
      } catch { /* ignore */ }
    } else {
      msg = e.response?.data?.message || msg
    }
    Swal.fire('Error', msg, 'error')
  } finally {
    working.value = false
  }
}

const descargar = async () => {
  try {
    const { data } = await api.get('/ficha-tecnica/mi/pdf', { responseType: 'blob' })
    downloadBlob(data, `Ficha_Tecnica_${(form.value.nombreFraternidad || 'fraternidad').replace(/\s+/g, '_')}.pdf`)
  } catch (e) {
    Swal.fire('Error', e.response?.data?.message || 'No se pudo descargar', 'error')
  }
}

const corregir = async () => {
  const conf = await Swal.fire({
    title: '¿Corregir ficha técnica?',
    text: 'Se eliminará el PDF generado. Podrás editar los datos y generar uno nuevo.',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Sí, corregir',
    cancelButtonText: 'Cancelar',
    confirmButtonColor: '#C8102E',
  })
  if (!conf.isConfirmed) return
  working.value = true
  try {
    const { data } = await api.post('/ficha-tecnica/mi/corregir')
    form.value = ensurePersonas(data)
    Swal.fire({ icon: 'success', title: 'Listo para editar', toast: true, position: 'top-end', timer: 2200, showConfirmButton: false })
  } catch (e) {
    Swal.fire('Error', e.response?.data?.message || 'No se pudo habilitar la corrección', 'error')
  } finally {
    working.value = false
  }
}

onMounted(cargar)
</script>

<style scoped>
.lbl {
  display: block;
  font-size: 10px;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: #94a3b8;
  margin-bottom: 0.25rem;
}
.inp {
  width: 100%;
  padding: 0.625rem 1rem;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 0.75rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: #1e293b;
  outline: none;
}
.inp:focus { border-color: #003399; }
fieldset:disabled .inp { background: #f1f5f9; }
.inp-locked {
  background: #f1f5f9 !important;
  color: #475569;
  cursor: not-allowed;
  opacity: 1;
}
select.inp-locked {
  appearance: none;
  pointer-events: none;
}
</style>
