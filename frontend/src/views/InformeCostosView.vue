<template>
  <div class="w-full">
    <div class="mb-6 rounded-2xl border border-slate-200 bg-white p-4 sm:p-6">
      <div class="flex items-start gap-3">
        <span class="material-symbols-outlined text-primary text-3xl">payments</span>
        <div>
          <h3 class="text-sm font-black uppercase tracking-widest text-slate-800">Informe de Costos</h3>
          <p class="text-xs text-slate-500 mt-1 leading-relaxed">
            Listado de costos de participación declarados en la preinscripción (costo único o variable por bailarín).
            Cada fila muestra un monto numérico en bolivianos.
          </p>
        </div>
      </div>
    </div>

    <div class="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 mb-6">
      <p class="text-[10px] font-black uppercase tracking-widest text-primary mb-4">Filtros</p>
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div>
          <label class="label-xs">Gestión</label>
          <select v-model="filtros.idGestion" class="form-input !py-2 !text-sm" @change="onGestionChange">
            <option :value="null">Todas</option>
            <option v-for="g in opciones.gestiones" :key="g.idGestion" :value="g.idGestion">
              {{ g.anio }}{{ g.activa ? ' (activa)' : '' }}
            </option>
          </select>
        </div>
        <div>
          <label class="label-xs">Tipo de danza</label>
          <select v-model="filtros.idTipoDanza" class="form-input !py-2 !text-sm">
            <option :value="null">Todos</option>
            <option v-for="td in opciones.tiposDanza" :key="td.idTipoDanza" :value="td.idTipoDanza">
              {{ td.nombre }}
            </option>
          </select>
        </div>
        <div>
          <label class="label-xs">Categoría</label>
          <select v-model="filtros.idCategoria" class="form-input !py-2 !text-sm">
            <option :value="null">Todas</option>
            <option v-for="c in opciones.categorias" :key="c.idCategoria" :value="c.idCategoria">
              {{ c.nombre }}
            </option>
          </select>
        </div>
        <div class="sm:col-span-2">
          <label class="label-xs">Búsqueda</label>
          <input
            v-model="filtros.busqueda"
            type="text"
            class="form-input !py-2 !text-sm"
            placeholder="Nombre de fraternidad o danza..."
          />
        </div>
        <div>
          <label class="label-xs">Ordenar por</label>
          <select v-model="filtros.ordenarPor" class="form-input !py-2 !text-sm">
            <option value="nombreFraternidad">Fraternidad</option>
            <option value="tipoDanza">Tipo de danza</option>
            <option value="concepto">Concepto</option>
            <option value="monto">Monto</option>
            <option value="estructura">Estructura</option>
          </select>
        </div>
        <div>
          <label class="label-xs">Orden</label>
          <select v-model="filtros.orden" class="form-input !py-2 !text-sm">
            <option value="ASC">Ascendente</option>
            <option value="DESC">Descendente</option>
          </select>
        </div>
      </div>

      <div class="flex flex-wrap gap-3 mt-5">
        <button
          type="button"
          @click="buscar(1)"
          :disabled="loading"
          class="px-5 py-2.5 rounded-xl bg-primary text-white text-xs font-black uppercase tracking-widest disabled:opacity-50"
        >
          {{ loading ? 'Consultando…' : 'Consultar' }}
        </button>
        <button
          type="button"
          @click="descargarPdf"
          :disabled="loading || !resultado?.data?.length"
          class="px-5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 text-xs font-black uppercase tracking-widest disabled:opacity-50"
        >
          Descargar PDF
        </button>
      </div>
    </div>

    <div v-if="resultado?.resumen" class="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
      <div class="bg-white rounded-2xl border border-slate-200 p-4">
        <p class="text-[10px] font-black uppercase tracking-widest text-slate-400">Fraternidades</p>
        <p class="text-2xl font-black text-primary mt-1">{{ resultado.resumen.fraternidadesUnicas }}</p>
      </div>
      <div class="bg-white rounded-2xl border border-slate-200 p-4">
        <p class="text-[10px] font-black uppercase tracking-widest text-slate-400">Ítems de costo</p>
        <p class="text-2xl font-black text-slate-800 mt-1">{{ resultado.resumen.totalItems }}</p>
      </div>
      <div class="bg-white rounded-2xl border border-slate-200 p-4">
        <p class="text-[10px] font-black uppercase tracking-widest text-slate-400">Suma de montos</p>
        <p class="text-2xl font-black text-amber-700 mt-1">{{ formatMonto(resultado.resumen.totalMonto) }} <span class="text-sm">Bs</span></p>
      </div>
    </div>

    <div class="bg-white rounded-2xl border border-slate-200 overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-left min-w-[720px]">
          <thead class="bg-slate-50 border-b border-slate-100">
            <tr>
              <th class="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400">Fraternidad</th>
              <th class="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400">Tipo danza</th>
              <th class="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400">Estructura</th>
              <th class="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400">Concepto</th>
              <th class="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Monto (Bs)</th>
              <th class="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400">Estado</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading">
              <td colspan="6" class="px-6 py-12 text-center text-slate-400 text-sm">Cargando…</td>
            </tr>
            <tr v-else-if="!resultado?.data?.length">
              <td colspan="6" class="px-6 py-12 text-center text-slate-400 text-sm">
                No hay costos registrados con los filtros aplicados.
              </td>
            </tr>
            <tr
              v-for="(row, idx) in resultado?.data || []"
              :key="idx"
              class="border-b border-slate-50 hover:bg-slate-50/50"
            >
              <td class="px-4 py-3 text-sm font-bold text-slate-800">
                {{ row.nombreFraternidad }}
                <span
                  v-if="row.esExcedente"
                  class="ml-1 inline-flex px-1.5 py-0.5 rounded-full text-[8px] font-black uppercase bg-amber-50 text-amber-800 border border-amber-200"
                >Excedente</span>
              </td>
              <td class="px-4 py-3 text-sm text-slate-600">{{ row.tipoDanza }}</td>
              <td class="px-4 py-3">
                <span
                  class="inline-flex px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border"
                  :class="row.estructura === 'Variable'
                    ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                    : 'bg-slate-100 text-slate-600 border-slate-200'"
                >
                  {{ row.estructura }}
                </span>
              </td>
              <td class="px-4 py-3 text-sm text-slate-700">{{ row.concepto }}</td>
              <td class="px-4 py-3 text-sm font-black text-right text-slate-900 tabular-nums">
                {{ formatMonto(row.monto) }}
              </td>
              <td class="px-4 py-3 text-[10px] font-black uppercase tracking-wider text-slate-500">
                {{ row.estadoSolicitud }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="totalPaginas > 1" class="px-6 py-4 border-t border-slate-100 flex items-center justify-center gap-2">
        <button
          type="button"
          :disabled="resultado.page <= 1 || loading"
          @click="buscar(resultado.page - 1)"
          class="px-3 py-2 rounded-lg border border-slate-200 text-xs font-bold disabled:opacity-40"
        >
          Anterior
        </button>
        <span class="text-xs text-slate-500 font-medium">{{ resultado.page }} / {{ totalPaginas }}</span>
        <button
          type="button"
          :disabled="resultado.page >= totalPaginas || loading"
          @click="buscar(resultado.page + 1)"
          class="px-3 py-2 rounded-lg border border-slate-200 text-xs font-bold disabled:opacity-40"
        >
          Siguiente
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import api from '../services/api'
import Swal from 'sweetalert2'

const loading = ref(false)
const opciones = ref({
  gestiones: [],
  tiposDanza: [],
  categorias: [],
})
const filtros = ref({
  tipoReporte: 'costos',
  idGestion: null,
  idTipoDanza: null,
  idCategoria: null,
  busqueda: '',
  ordenarPor: 'nombreFraternidad',
  orden: 'ASC',
  page: 1,
  limit: 50,
})
const resultado = ref(null)

const totalPaginas = computed(() => {
  if (!resultado.value?.total) return 1
  return Math.max(1, Math.ceil(resultado.value.total / (resultado.value.limit || 50)))
})

const formatMonto = (val) => {
  const n = Number(val)
  if (Number.isNaN(n)) return '—'
  return n.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

const cargarOpciones = async (idGestion) => {
  try {
    const { data } = await api.get('/reportes/opciones-filtro', {
      params: idGestion ? { idGestion } : {},
    })
    opciones.value = {
      gestiones: data.gestiones || [],
      tiposDanza: data.tiposDanza || [],
      categorias: data.categorias || [],
    }
    if (!filtros.value.idGestion) {
      const activa = (data.gestiones || []).find((g) => g.activa)
      if (activa) filtros.value.idGestion = activa.idGestion
    }
  } catch (e) {
    console.error(e)
  }
}

const onGestionChange = async () => {
  await cargarOpciones(filtros.value.idGestion || undefined)
  filtros.value.idCategoria = null
}

const buildPayload = (page) => {
  const p = {
    tipoReporte: 'costos',
    page: page || 1,
    limit: filtros.value.limit,
    ordenarPor: filtros.value.ordenarPor,
    orden: filtros.value.orden,
  }
  if (filtros.value.idGestion) p.idGestion = filtros.value.idGestion
  if (filtros.value.idTipoDanza) p.idTipoDanza = filtros.value.idTipoDanza
  if (filtros.value.idCategoria) p.idCategoria = filtros.value.idCategoria
  if (filtros.value.busqueda?.trim()) p.busqueda = filtros.value.busqueda.trim()
  return p
}

const buscar = async (page = 1) => {
  loading.value = true
  try {
    const { data } = await api.post('/reportes/consultar', buildPayload(page))
    resultado.value = data
  } catch (e) {
    Swal.fire('Error', e.response?.data?.message || 'No se pudo consultar el informe.', 'error')
  } finally {
    loading.value = false
  }
}

const descargarPdf = async () => {
  loading.value = true
  try {
    const { data } = await api.post('/reportes/consultar/pdf', buildPayload(1), {
      responseType: 'blob',
    })
    const url = URL.createObjectURL(new Blob([data], { type: 'application/pdf' }))
    const a = document.createElement('a')
    a.href = url
    a.download = `Informe_Costos_${Date.now()}.pdf`
    a.click()
    URL.revokeObjectURL(url)
  } catch (e) {
    Swal.fire('Error', e.response?.data?.message || 'No se pudo generar el PDF.', 'error')
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  await cargarOpciones()
  await buscar(1)
})
</script>
