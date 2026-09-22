<template>
  <div class="dashboard-page max-w-7xl">
    <!-- LISTADO -->
    <template v-if="!detalleAbierto">
      <div class="mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h2 class="dashboard-page-title text-primary">Nóminas Excel</h2>
          <p class="text-slate-500 text-sm font-medium mt-1">
            Listado de fraternidades y fraternos cargados por Excel.
            <span v-if="gestionAnio" class="text-slate-400"> · Gestión {{ gestionAnio }}</span>
          </p>
        </div>
        <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
          <div class="relative flex-1 sm:w-72">
            <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[20px]">search</span>
            <input
              v-model="busqueda"
              type="search"
              placeholder="Buscar fraternidad, danza o archivo…"
              class="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium outline-none focus:border-primary"
            />
          </div>
          <select
            v-model="filtroEstado"
            class="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none focus:border-primary"
          >
            <option value="todos">Todas</option>
            <option value="cargada">Nómina cargada</option>
            <option value="pendiente">Sin archivo</option>
          </select>
          <button
            type="button"
            @click="descargarZip"
            :disabled="descargandoZip || !conArchivo"
            class="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white rounded-xl text-xs font-black uppercase tracking-widest shrink-0"
          >
            <span class="material-symbols-outlined text-[18px]" :class="{ 'animate-spin': descargandoZip }">
              {{ descargandoZip ? 'progress_activity' : 'folder_zip' }}
            </span>
            {{ descargandoZip ? 'ZIP…' : 'Descargar todo' }}
          </button>
          <button
            type="button"
            @click="cargar"
            class="size-10 bg-slate-100 hover:bg-slate-200 rounded-xl flex items-center justify-center shrink-0"
            title="Actualizar"
          >
            <span class="material-symbols-outlined text-slate-600" :class="{ 'animate-spin': loading }">refresh</span>
          </button>
        </div>
      </div>

      <div class="flex flex-wrap gap-2 sm:gap-3 mb-6 text-xs font-bold">
        <span class="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-600">
          {{ items.length }} fraternidad(es)
        </span>
        <span class="px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700">
          {{ conArchivo }} con nómina
        </span>
        <span class="px-3 py-1.5 rounded-lg bg-primary/10 text-primary">
          {{ totalMiembros }} fraterno(s)
        </span>
        <span class="px-3 py-1.5 rounded-lg bg-sky-50 text-sky-700">
          {{ totalAsegurados }} asegurado(s)
        </span>
      </div>

      <div v-if="loading" class="py-20 text-center text-slate-400">
        <span class="material-symbols-outlined animate-spin text-4xl">progress_activity</span>
      </div>

      <div v-else class="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div v-if="filtradas.length === 0" class="py-16 text-center text-slate-400">
          <span class="material-symbols-outlined text-5xl mb-2 opacity-30">table_view</span>
          <p class="font-bold text-sm">No hay fraternidades con ese filtro.</p>
        </div>
        <div v-else class="divide-y divide-slate-100">
          <div
            v-for="row in filtradas"
            :key="row.idFraternidad"
            class="p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center gap-4 hover:bg-slate-50/80"
            :class="row.lista ? '' : 'opacity-80'"
          >
            <div class="flex-1 min-w-0">
              <p class="font-black text-slate-900 truncate">{{ row.nombreFraternidad }}</p>
              <p class="text-xs text-slate-500 font-medium mt-0.5">
                {{ row.tipoDanza || '—' }}
                <span v-if="row.categoria"> · {{ row.categoria }}</span>
                <template v-if="row.lista">
                  · {{ row.lista.nombreOriginal }}
                  · {{ formatFecha(row.lista.updatedAt || row.lista.createdAt) }}
                </template>
              </p>
              <div v-if="row.tieneArchivo" class="mt-2 flex flex-wrap gap-1.5">
                <span class="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-primary/10 text-primary border border-primary/20">
                  {{ row.cantidadMiembros || 0 }} fraterno(s)
                </span>
                <span class="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-sky-50 text-sky-700 border border-sky-100">
                  {{ row.cantidadAsegurados || 0 }} asegurado(s)
                </span>
              </div>
            </div>
            <span
              class="self-start px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border"
              :class="row.tieneArchivo
                ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                : 'bg-amber-50 text-amber-700 border-amber-100'"
            >
              {{ row.tieneArchivo ? 'Cargada' : 'Sin archivo' }}
            </span>
            <div v-if="row.lista" class="flex flex-wrap gap-2">
              <button
                type="button"
                @click="abrirDetalle(row)"
                class="px-3 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-bold text-slate-700"
              >
                Ver fraternos
              </button>
              <button
                type="button"
                @click="descargar(row.lista)"
                class="px-3 py-2 bg-primary hover:bg-blue-900 text-white rounded-xl text-xs font-bold"
              >
                Descargar
              </button>
              <button
                type="button"
                @click="eliminar(row.lista)"
                class="px-3 py-2 bg-red-50 hover:bg-red-100 text-red-700 rounded-xl text-xs font-bold"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- DETALLE FRATERNOS -->
    <template v-else>
      <div class="mb-6">
        <button
          type="button"
          @click="cerrarDetalle"
          class="inline-flex items-center gap-1.5 mb-4 text-sm font-bold text-primary hover:underline"
        >
          <span class="material-symbols-outlined text-[18px]">arrow_back</span>
          Volver al listado
        </button>

        <div class="bg-white rounded-3xl border border-slate-200 shadow-sm p-4 sm:p-5 mb-4">
          <div class="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
            <div class="min-w-0">
              <p class="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Fraternidad</p>
              <h2 class="text-xl sm:text-2xl font-black text-primary italic uppercase leading-tight">
                {{ listaActiva?.nombreFraternidad || detalleRow?.nombreFraternidad || '—' }}
              </h2>
              <div class="mt-3 flex flex-wrap gap-2">
                <span class="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-primary/10 text-primary border border-primary/20">
                  Danza: {{ listaActiva?.tipoDanza || detalleRow?.tipoDanza || '—' }}
                </span>
                <span class="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-secondary/10 text-secondary border border-secondary/20">
                  Gestión {{ gestionAnio || '—' }}
                </span>
                <span
                  v-if="listaActiva?.categoria || detalleRow?.categoria"
                  class="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-slate-50 text-slate-600 border border-slate-200"
                >
                  {{ listaActiva?.categoria || detalleRow?.categoria }}
                </span>
              </div>
            </div>
            <div class="flex flex-col gap-2 shrink-0 w-full lg:w-auto lg:items-end">
              <span class="inline-flex w-fit px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-widest bg-sky-600 text-white">
                Asegurados: {{ cantidadAsegurados }}
              </span>
              <p class="text-xs text-slate-500 font-medium">
                {{ miembros.length }} fraterno(s) en nómina
              </p>
              <div class="flex flex-wrap gap-2">
                <button
                  type="button"
                  @click="recargarMiembros"
                  :disabled="cargandoDetalle"
                  class="px-3 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-bold text-slate-700 disabled:opacity-50"
                >
                  Actualizar
                </button>
                <button
                  type="button"
                  @click="descargar(listaActiva)"
                  class="px-3 py-2 bg-primary hover:bg-blue-900 text-white rounded-xl text-xs font-bold"
                >
                  Descargar Excel
                </button>
              </div>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-2xl border border-slate-200 p-4 mb-4 flex flex-wrap gap-3 items-end">
          <div class="flex-1 min-w-[200px]">
            <label class="label-xs">Buscar</label>
            <div class="relative">
              <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">search</span>
              <input
                v-model="busquedaMiembros"
                type="search"
                placeholder="Nombre, CI, celular o RU…"
                class="form-input !py-2.5 !text-sm !pl-10 w-full"
              />
            </div>
          </div>
          <div class="sm:w-52">
            <label class="label-xs">Tipo de persona</label>
            <select v-model="filtroTipoPersona" class="form-input !py-2.5 !text-sm w-full">
              <option value="TODOS">Todos los tipos</option>
              <option value="ESTUDIANTE">Estudiante</option>
              <option value="DOCENTE">Docente</option>
              <option value="ADMINISTRATIVO">Administrativo</option>
              <option value="EXTERNO">Externo</option>
            </select>
          </div>
        </div>
      </div>

      <div v-if="cargandoDetalle" class="py-20 text-center text-slate-400">
        <span class="material-symbols-outlined animate-spin text-4xl">progress_activity</span>
      </div>

      <div v-else class="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <!-- Mobile -->
        <div class="md:hidden divide-y divide-slate-100">
          <div
            v-if="!miembrosFiltrados.length"
            class="py-12 px-4 text-center text-slate-400 font-bold text-sm"
          >
            No hay fraternos registrados o no coinciden con los filtros.
          </div>
          <div
            v-for="(m, i) in miembrosFiltrados"
            :key="'m-' + m.idMiembro"
            class="p-4 space-y-3"
          >
            <div class="flex items-start justify-between gap-3">
              <div class="min-w-0">
                <p class="text-[10px] font-black uppercase tracking-widest text-slate-400">#{{ i + 1 }}</p>
                <p class="font-black text-slate-900 leading-snug break-words">
                  {{ m.nombres }} {{ m.primerApellido || m.apellidoPaterno }}
                  {{ m.segundoApellido || m.apellidoMaterno || '' }}
                </p>
                <p class="text-xs text-slate-500 font-medium mt-1">
                  CI {{ m.ci }} · {{ m.tipoPersonaLabel || m.tipoPersona || '—' }}
                </p>
                <p class="text-xs text-slate-500 font-mono mt-0.5">
                  {{ m.celular || '—' }} · RU {{ m.registroUniversitario || '—' }}
                </p>
              </div>
              <label
                class="shrink-0 inline-flex flex-col items-center gap-1 px-2 py-1.5 rounded-xl border-2 cursor-pointer select-none"
                :class="m.asegurado
                  ? 'border-sky-500 bg-sky-50 text-sky-800'
                  : 'border-slate-200 bg-white text-slate-500'"
              >
                <input
                  type="checkbox"
                  class="size-5 accent-sky-600 cursor-pointer"
                  :checked="!!m.asegurado"
                  :disabled="guardandoAseguradoId === m.idMiembro"
                  @change="toggleAsegurado(m, $event.target.checked)"
                />
                <span class="text-[9px] font-black uppercase tracking-wider">Asegurado</span>
              </label>
            </div>
          </div>
        </div>

        <!-- Desktop -->
        <div class="hidden md:block overflow-x-auto">
          <table class="w-full text-left text-sm min-w-[820px]">
            <thead>
              <tr class="bg-slate-800 text-white">
                <th class="px-3 py-2.5 text-[10px] font-black uppercase tracking-wider">#</th>
                <th class="px-3 py-2.5 text-[10px] font-black uppercase tracking-wider whitespace-nowrap">Asegurado</th>
                <th class="px-3 py-2.5 text-[10px] font-black uppercase tracking-wider">Nombre</th>
                <th class="px-3 py-2.5 text-[10px] font-black uppercase tracking-wider">Primer ap.</th>
                <th class="px-3 py-2.5 text-[10px] font-black uppercase tracking-wider">Segundo ap.</th>
                <th class="px-3 py-2.5 text-[10px] font-black uppercase tracking-wider">CI</th>
                <th class="px-3 py-2.5 text-[10px] font-black uppercase tracking-wider">Tipo</th>
                <th class="px-3 py-2.5 text-[10px] font-black uppercase tracking-wider">Celular</th>
                <th class="px-3 py-2.5 text-[10px] font-black uppercase tracking-wider">RU</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="!miembrosFiltrados.length">
                <td colspan="9" class="text-center py-12 text-slate-400 font-bold text-sm">
                  No hay fraternos registrados o no coinciden con los filtros.
                </td>
              </tr>
              <tr
                v-for="(m, i) in miembrosFiltrados"
                :key="m.idMiembro"
                class="border-b border-slate-100"
                :class="i % 2 === 0 ? 'bg-white' : 'bg-slate-50'"
              >
                <td class="px-3 py-2.5 text-xs text-slate-400 font-bold">{{ i + 1 }}</td>
                <td class="px-3 py-2.5">
                  <label class="inline-flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      class="size-5 accent-sky-600 cursor-pointer"
                      :checked="!!m.asegurado"
                      :disabled="guardandoAseguradoId === m.idMiembro"
                      @change="toggleAsegurado(m, $event.target.checked)"
                    />
                    <span
                      class="text-[10px] font-black uppercase tracking-wider"
                      :class="m.asegurado ? 'text-sky-700' : 'text-slate-400'"
                    >
                      {{ m.asegurado ? 'Sí' : 'No' }}
                    </span>
                  </label>
                </td>
                <td class="px-3 py-2.5 font-bold text-slate-800 whitespace-nowrap">{{ m.nombres }}</td>
                <td class="px-3 py-2.5 whitespace-nowrap">{{ m.primerApellido || m.apellidoPaterno }}</td>
                <td class="px-3 py-2.5 whitespace-nowrap">{{ m.segundoApellido || m.apellidoMaterno || '—' }}</td>
                <td class="px-3 py-2.5 font-mono text-xs">{{ m.ci }}</td>
                <td class="px-3 py-2.5 text-xs whitespace-nowrap">{{ m.tipoPersonaLabel || m.tipoPersona || '—' }}</td>
                <td class="px-3 py-2.5 font-mono text-xs">{{ m.celular || '—' }}</td>
                <td class="px-3 py-2.5 font-mono text-xs">{{ m.registroUniversitario || '—' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import api from '../services/api'
import { notify } from '../utils/notify'

const loading = ref(true)
const items = ref([])
const gestionAnio = ref(null)
const busqueda = ref('')
const filtroEstado = ref('todos')
const descargandoZip = ref(false)

const detalleAbierto = ref(false)
const detalleRow = ref(null)
const cargandoDetalle = ref(false)
const listaActiva = ref(null)
const miembros = ref([])
const busquedaMiembros = ref('')
const filtroTipoPersona = ref('TODOS')
const cantidadAsegurados = ref(0)
const guardandoAseguradoId = ref(null)

const conArchivo = computed(() => items.value.filter((i) => i.tieneArchivo).length)
const totalMiembros = computed(() =>
  items.value.reduce((s, i) => s + (Number(i.cantidadMiembros) || 0), 0),
)
const totalAsegurados = computed(() =>
  items.value.reduce((s, i) => s + (Number(i.cantidadAsegurados) || 0), 0),
)

const filtradas = computed(() => {
  const q = busqueda.value.trim().toLowerCase()
  return items.value.filter((i) => {
    if (filtroEstado.value === 'cargada' && !i.tieneArchivo) return false
    if (filtroEstado.value === 'pendiente' && i.tieneArchivo) return false
    if (!q) return true
    const hay = [
      i.nombreFraternidad,
      i.categoria,
      i.tipoDanza,
      i.lista?.nombreOriginal,
      i.tieneArchivo ? 'cargada' : 'pendiente',
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()
    return hay.includes(q)
  })
})

const miembrosFiltrados = computed(() => {
  const q = busquedaMiembros.value.trim().toLowerCase()
  const tipo = filtroTipoPersona.value
  return miembros.value.filter((m) => {
    if (tipo !== 'TODOS' && String(m.tipoPersona || '').toUpperCase() !== tipo) return false
    if (!q) return true
    const hay = [
      m.nombres,
      m.primerApellido || m.apellidoPaterno,
      m.segundoApellido || m.apellidoMaterno,
      m.ci,
      m.tipoPersona,
      m.tipoPersonaLabel,
      m.celular,
      m.registroUniversitario,
      m.asegurado ? 'asegurado' : '',
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()
    return hay.includes(q)
  })
})

const formatFecha = (fecha) => {
  if (!fecha) return ''
  return new Date(fecha).toLocaleDateString('es-BO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const cargar = async () => {
  loading.value = true
  try {
    const { data } = await api.get('/listas-nomina')
    items.value = data.items || []
    gestionAnio.value = data.gestion?.anio || null
  } catch (e) {
    notify.error('Error', e.response?.data?.message || 'No se pudo cargar el listado.')
    items.value = []
  } finally {
    loading.value = false
  }
}

const abrirDetalle = async (row) => {
  if (!row?.lista?.idLista) return
  detalleRow.value = row
  detalleAbierto.value = true
  listaActiva.value = {
    ...row.lista,
    nombreFraternidad: row.nombreFraternidad || row.lista.nombreFraternidad,
    tipoDanza: row.tipoDanza || row.lista.tipoDanza,
    categoria: row.categoria || row.lista.categoria,
  }
  miembros.value = []
  busquedaMiembros.value = ''
  filtroTipoPersona.value = 'TODOS'
  cantidadAsegurados.value = Number(row.cantidadAsegurados) || 0
  await recargarMiembros()
}

const cerrarDetalle = async () => {
  detalleAbierto.value = false
  detalleRow.value = null
  listaActiva.value = null
  miembros.value = []
  await cargar()
}

const recargarMiembros = async () => {
  if (!listaActiva.value?.idLista) return
  cargandoDetalle.value = true
  try {
    const { data } = await api.get(`/listas-nomina/${listaActiva.value.idLista}/miembros`)
    miembros.value = data.miembros || []
    cantidadAsegurados.value =
      data.cantidadAsegurados ??
      miembros.value.filter((m) => m.asegurado).length
    if (data.lista) {
      listaActiva.value = {
        ...listaActiva.value,
        ...data.lista,
      }
    }
  } catch (e) {
    notify.error('Error', e.response?.data?.message || 'No se pudo cargar el registro.')
  } finally {
    cargandoDetalle.value = false
  }
}

const toggleAsegurado = async (miembro, asegurado) => {
  if (!miembro?.idMiembro) return
  const prev = !!miembro.asegurado
  miembro.asegurado = asegurado
  cantidadAsegurados.value = miembros.value.filter((m) => m.asegurado).length
  guardandoAseguradoId.value = miembro.idMiembro
  try {
    const { data } = await api.patch(`/listas-nomina/miembros/${miembro.idMiembro}/asegurado`, {
      asegurado,
    })
    if (data?.miembro) {
      Object.assign(miembro, data.miembro)
    }
    if (typeof data?.cantidadAsegurados === 'number') {
      cantidadAsegurados.value = data.cantidadAsegurados
    }
    const idLista = listaActiva.value?.idLista
    if (idLista) {
      const row = items.value.find((i) => i.lista?.idLista === idLista)
      if (row) row.cantidadAsegurados = cantidadAsegurados.value
    }
    notify.success(
      asegurado ? 'Seguro otorgado' : 'Seguro retirado',
      data?.mensaje || (asegurado ? 'Seguro otorgado exitosamente' : 'Seguro retirado exitosamente'),
    )
  } catch (e) {
    miembro.asegurado = prev
    cantidadAsegurados.value = miembros.value.filter((m) => m.asegurado).length
    notify.error('Error', e.response?.data?.message || 'No se pudo actualizar el seguro.')
  } finally {
    guardandoAseguradoId.value = null
  }
}

const descargar = async (lista) => {
  if (!lista?.idLista) return
  try {
    const { data } = await api.get(`/listas-nomina/${lista.idLista}/archivo`, { responseType: 'blob' })
    const url = URL.createObjectURL(data)
    const a = document.createElement('a')
    a.href = url
    a.download = lista.nombreOriginal || `nomina_${lista.idLista}.xlsx`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  } catch {
    notify.error('Error', 'No se pudo descargar el archivo.')
  }
}

const descargarZip = async () => {
  descargandoZip.value = true
  try {
    const { data } = await api.get('/listas-nomina/download-zip', { responseType: 'blob' })
    const url = URL.createObjectURL(data)
    const a = document.createElement('a')
    a.href = url
    a.download = `Nominas_Excel_${Date.now()}.zip`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  } catch (e) {
    let msg = 'No se pudo descargar el ZIP de planillas.'
    if (e.response?.data instanceof Blob) {
      try {
        const text = await e.response.data.text()
        msg = JSON.parse(text).message || msg
      } catch { /* ignore */ }
    } else if (e.response?.data?.message) {
      msg = e.response.data.message
    }
    notify.error('Error', msg)
  } finally {
    descargandoZip.value = false
  }
}

const eliminar = async (lista) => {
  const conf = await notify.confirm(
    '¿Eliminar nómina?',
    `Se eliminará el Excel y el registro de fraternos de «${lista.nombreFraternidad || 'esta fraternidad'}».`,
    'Sí, eliminar',
  )
  if (!conf.isConfirmed) return
  try {
    await api.delete(`/listas-nomina/${lista.idLista}`)
    notify.success('Eliminado', 'La nómina fue removida.')
    if (detalleAbierto.value && listaActiva.value?.idLista === lista.idLista) {
      await cerrarDetalle()
    } else {
      await cargar()
    }
  } catch (e) {
    notify.error('Error', e.response?.data?.message || 'No se pudo eliminar.')
  }
}

onMounted(cargar)
</script>
