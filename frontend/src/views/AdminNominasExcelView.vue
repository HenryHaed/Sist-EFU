<template>
  <div class="dashboard-page max-w-7xl">
    <!-- LISTADO FRATERNIDADES -->
    <template v-if="!detalleAbierto">
      <div class="mb-6 flex flex-col gap-4">
        <div class="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h2 class="dashboard-page-title text-primary">Nóminas Excel</h2>
            <p class="text-slate-500 text-sm font-medium mt-1">
              Listado de fraternidades y fraternos cargados por Excel.
              <span v-if="gestionAnio" class="text-slate-400"> · Gestión {{ gestionAnio }}</span>
            </p>
          </div>
          <div class="flex flex-wrap gap-2">
            <v-btn
              color="success"
              variant="flat"
              :loading="descargandoZip"
              :disabled="!conArchivo"
              prepend-icon="mdi-folder-zip"
              @click="descargarZip"
            >
              Descargar todo
            </v-btn>
            <v-btn
              variant="tonal"
              color="primary"
              :loading="loading"
              @click="cargar"
            >
              Actualizar
            </v-btn>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-12 gap-3">
          <div class="md:col-span-6">
            <v-text-field
              v-model="busqueda"
              label="Buscar fraternidad, danza o archivo"
              density="comfortable"
              variant="outlined"
              hide-details
              clearable
              bg-color="white"
            />
          </div>
          <div class="md:col-span-6">
            <v-select
              v-model="filtroEstado"
              :items="opcionesEstado"
              item-title="title"
              item-value="value"
              label="Estado de nómina"
              density="comfortable"
              variant="outlined"
              hide-details
              bg-color="white"
            />
          </div>
        </div>
      </div>

      <div class="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3 mb-6">
        <v-card variant="outlined" rounded="xl" class="pa-3 sm:pa-4 text-center">
          <p class="text-[9px] font-black uppercase tracking-widest text-slate-400 leading-tight">Fraternidades</p>
          <p class="text-lg sm:text-xl font-black text-primary mt-1">{{ items.length }}</p>
        </v-card>
        <v-card variant="outlined" rounded="xl" class="pa-3 sm:pa-4 text-center bg-emerald-50/40">
          <p class="text-[9px] font-black uppercase tracking-widest text-emerald-700 leading-tight">Con nómina</p>
          <p class="text-lg sm:text-xl font-black text-emerald-800 mt-1">{{ conArchivo }}</p>
        </v-card>
        <v-card variant="outlined" rounded="xl" class="pa-3 sm:pa-4 text-center">
          <p class="text-[9px] font-black uppercase tracking-widest text-primary leading-tight">Fraternos</p>
          <p class="text-lg sm:text-xl font-black text-primary mt-1">{{ totalMiembros }}</p>
        </v-card>
        <v-card variant="outlined" rounded="xl" class="pa-3 sm:pa-4 text-center bg-sky-50/50">
          <p class="text-[9px] font-black uppercase tracking-widest text-sky-700 leading-tight">Asegurados</p>
          <p class="text-lg sm:text-xl font-black text-sky-800 mt-1">{{ totalAsegurados }}</p>
        </v-card>
      </div>

      <v-card v-if="loading" variant="outlined" rounded="xl" class="py-16 text-center">
        <v-progress-circular indeterminate color="primary" />
      </v-card>

      <v-card v-else variant="outlined" rounded="xl" class="overflow-hidden">
        <div v-if="filtradas.length" class="divide-y divide-slate-100">
          <div
            v-for="row in filtradas"
            :key="row.idFraternidad"
            class="p-4 sm:p-5"
            :class="row.lista ? 'hover:bg-slate-50/80 cursor-pointer' : 'opacity-80'"
            @click="row.lista && abrirDetalle(row)"
          >
            <div class="min-w-0">
              <p class="font-black text-slate-900 text-sm sm:text-base leading-snug break-words">
                {{ row.nombreFraternidad }}
              </p>
              <p class="text-xs text-slate-500 font-medium mt-1 leading-relaxed break-words">
                {{ row.tipoDanza || '—' }}
                <span v-if="row.categoria"> · {{ row.categoria }}</span>
                <template v-if="row.lista">
                  · {{ row.lista.nombreOriginal }}
                  · {{ formatFecha(row.lista.updatedAt || row.lista.createdAt) }}
                </template>
              </p>
            </div>

            <div class="mt-3 flex flex-wrap gap-2">
              <v-chip
                v-if="row.tieneArchivo"
                size="small"
                color="primary"
                variant="tonal"
                label
              >
                {{ row.cantidadMiembros || 0 }} fraterno(s)
              </v-chip>
              <v-chip
                v-if="row.tieneArchivo"
                size="small"
                color="info"
                variant="tonal"
                label
              >
                {{ row.cantidadAsegurados || 0 }} asegurado(s)
              </v-chip>
              <v-chip
                size="small"
                :color="row.tieneArchivo ? 'success' : 'default'"
                :variant="row.tieneArchivo ? 'tonal' : 'outlined'"
                label
              >
                {{ row.tieneArchivo ? 'Cargada' : 'Sin archivo' }}
              </v-chip>
            </div>

            <div v-if="row.lista" class="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2" @click.stop>
              <v-btn
                size="small"
                color="primary"
                variant="flat"
                block
                @click="abrirDetalle(row)"
              >
                Ver fraternos
              </v-btn>
              <v-btn
                size="small"
                variant="tonal"
                block
                @click="descargar(row.lista)"
              >
                Descargar
              </v-btn>
              <v-btn
                size="small"
                color="error"
                variant="tonal"
                block
                @click="eliminar(row.lista)"
              >
                Eliminar
              </v-btn>
            </div>
          </div>
        </div>
        <div v-else class="py-16 text-center text-slate-400">
          <p class="font-bold text-sm">No hay fraternidades con ese filtro.</p>
        </div>
      </v-card>
    </template>

    <!-- DETALLE FRATERNOS -->
    <template v-else>
      <div class="mb-4">
        <v-btn
          variant="text"
          color="primary"
          class="mb-3"
          @click="cerrarDetalle"
        >
          ← Volver al listado
        </v-btn>

        <v-card variant="outlined" rounded="xl" class="pa-4 sm:pa-5 mb-4">
          <div class="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
            <div class="min-w-0">
              <p class="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
                Fraternidad
              </p>
              <h2 class="text-xl sm:text-2xl font-black text-primary italic uppercase leading-tight">
                {{ listaActiva?.nombreFraternidad || detalleRow?.nombreFraternidad || '—' }}
              </h2>
              <div class="mt-3 flex flex-wrap gap-2">
                <v-chip size="small" variant="tonal" color="primary" label>
                  Danza: {{ listaActiva?.tipoDanza || detalleRow?.tipoDanza || '—' }}
                </v-chip>
                <v-chip size="small" variant="tonal" color="secondary" label>
                  Gestión {{ gestionAnio || '—' }}
                </v-chip>
                <v-chip
                  v-if="listaActiva?.categoria || detalleRow?.categoria"
                  size="small"
                  variant="outlined"
                  label
                >
                  {{ listaActiva?.categoria || detalleRow?.categoria }}
                </v-chip>
              </div>
            </div>
            <div class="flex flex-col gap-2 shrink-0 w-full lg:w-auto lg:items-end">
              <v-chip color="info" size="large" variant="flat" label class="font-black w-fit">
                Asegurados: {{ cantidadAsegurados }}
              </v-chip>
              <p class="text-xs text-slate-500 font-medium">
                {{ miembros.length }} fraterno(s) en nómina
              </p>
              <div class="grid grid-cols-2 gap-2 w-full sm:w-auto sm:flex sm:flex-wrap">
                <v-btn
                  size="small"
                  variant="tonal"
                  block
                  class="sm:!w-auto"
                  :loading="cargandoDetalle"
                  @click="recargarMiembros"
                >
                  Actualizar
                </v-btn>
                <v-btn
                  size="small"
                  variant="tonal"
                  block
                  class="sm:!w-auto"
                  @click="descargar(listaActiva)"
                >
                  Descargar Excel
                </v-btn>
              </div>
            </div>
          </div>
        </v-card>

        <div class="grid grid-cols-1 md:grid-cols-12 gap-3 mb-4">
          <div class="md:col-span-7">
            <v-text-field
              v-model="busquedaMiembros"
              label="Buscar por nombre, CI, celular o RU"
              density="comfortable"
              variant="outlined"
              hide-details
              clearable
              bg-color="white"
            />
          </div>
          <div class="md:col-span-5">
            <v-select
              v-model="filtroTipoPersona"
              :items="opcionesTipoPersona"
              item-title="title"
              item-value="value"
              label="Tipo de persona"
              density="comfortable"
              variant="outlined"
              hide-details
              bg-color="white"
            />
          </div>
        </div>
      </div>

      <v-card v-if="cargandoDetalle" variant="outlined" rounded="xl" class="py-16 text-center">
        <v-progress-circular indeterminate color="primary" />
      </v-card>

      <v-card v-else variant="outlined" rounded="xl" class="overflow-hidden">
        <!-- Mobile cards -->
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

        <!-- Desktop table -->
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
      </v-card>
    </template>

    <v-snackbar
      v-model="snackbar.show"
      :color="snackbar.color"
      location="top end"
      :timeout="3500"
      multi-line
    >
      {{ snackbar.text }}
      <template #actions>
        <v-btn variant="text" @click="snackbar.show = false">Cerrar</v-btn>
      </template>
    </v-snackbar>
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

const snackbar = ref({
  show: false,
  text: '',
  color: 'success',
})

const opcionesEstado = [
  { title: 'Todos los estados', value: 'todos' },
  { title: 'Nómina cargada', value: 'cargada' },
  { title: 'Sin archivo', value: 'pendiente' },
]

const opcionesTipoPersona = [
  { title: 'Todos los tipos', value: 'TODOS' },
  { title: 'Estudiante', value: 'ESTUDIANTE' },
  { title: 'Docente', value: 'DOCENTE' },
  { title: 'Administrativo', value: 'ADMINISTRATIVO' },
  { title: 'Externo', value: 'EXTERNO' },
]

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

const mostrarSnack = (text, color = 'success') => {
  snackbar.value = { show: true, text, color }
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
    // Actualizar conteo en el listado en memoria
    const idLista = listaActiva.value?.idLista
    if (idLista) {
      const row = items.value.find((i) => i.lista?.idLista === idLista)
      if (row) row.cantidadAsegurados = cantidadAsegurados.value
    }
    mostrarSnack(
      data?.mensaje ||
        (asegurado ? 'Seguro otorgado exitosamente' : 'Seguro retirado exitosamente'),
      asegurado ? 'success' : 'info',
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
  } catch (e) {
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
