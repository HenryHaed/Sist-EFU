<template>
  <div class="dashboard-page max-w-4xl px-3 sm:px-0">
    <div class="mb-6 sm:mb-10 text-left">
      <div class="flex items-start sm:items-center gap-3 mb-2">
        <span class="h-6 sm:h-8 w-2 bg-secondary rounded-full shrink-0 mt-1 sm:mt-0"></span>
        <div class="min-w-0 flex-1">
          <div class="flex flex-wrap items-center gap-2 justify-between">
            <h2 class="dashboard-page-title italic uppercase text-primary text-xl sm:text-2xl leading-tight">
              Nómina Excel
            </h2>
            <button
              type="button"
              @click="abrirModalInstrucciones"
              class="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-[10px] font-black uppercase tracking-widest shrink-0"
            >
              <span class="material-symbols-outlined text-[16px]">menu_book</span>
              Instrucciones
            </button>
          </div>
          <p class="text-slate-500 font-medium text-sm mt-2 leading-relaxed">
            Descarga la planilla oficial, completa los datos y súbela.
            <strong>No se crean usuarios</strong>. Al re-subir solo se agregan CIs nuevos.
          </p>
        </div>
      </div>
    </div>

    <div v-if="loading" class="py-24 flex flex-col items-center text-slate-400">
      <span class="material-symbols-outlined animate-spin text-5xl text-primary mb-4">sync</span>
      <p class="font-bold uppercase tracking-widest text-xs">Cargando...</p>
    </div>

    <div
      v-else-if="!fraternidadInfo && !fraternidadAuth"
      class="bg-amber-50 border border-amber-200 rounded-2xl p-6 sm:p-8 text-center"
    >
      <span class="material-symbols-outlined text-5xl text-amber-500 mb-4">warning</span>
      <h3 class="text-lg font-black text-amber-800 uppercase italic mb-2">Sin fraternidad asignada</h3>
      <p class="text-amber-700 text-sm font-medium">
        Debes tener una fraternidad vinculada antes de gestionar la nómina.
      </p>
    </div>

    <template v-else>
      <div class="bg-white rounded-2xl border border-slate-100 shadow-xl overflow-hidden mb-6">
        <div class="bg-slate-900 px-4 sm:px-6 py-4 flex flex-col gap-3">
          <div class="flex items-start gap-3 min-w-0">
            <span class="material-symbols-outlined text-secondary shrink-0 mt-0.5">table</span>
            <div class="min-w-0 flex-1">
              <p class="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Fraternidad</p>
              <h3 class="text-white font-black italic uppercase text-sm sm:text-base break-words">
                {{ nombreFratMostrar }}
              </h3>
              <p v-if="tipoDanzaMostrar" class="text-slate-400 text-xs font-medium mt-0.5">
                Tipo de danza: {{ tipoDanzaMostrar }}
              </p>
            </div>
          </div>
          <button
            type="button"
            @click="descargarPlantilla"
            :disabled="descargandoPlantilla || (ventanaNomina && !ventanaNomina.abierta)"
            class="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-3 sm:py-2.5 bg-secondary hover:bg-red-800 text-white rounded-xl text-[10px] font-black uppercase tracking-widest disabled:opacity-50"
          >
            <span class="material-symbols-outlined text-[18px]">download</span>
            {{
              descargandoPlantilla
                ? 'Generando…'
                : cantidadMiembros
                  ? 'Descargar planilla (con datos)'
                  : 'Descargar plantilla'
            }}
          </button>
        </div>

        <div class="p-4 sm:p-8">
          <div
            v-if="ventanaNomina"
            class="mb-5 sm:mb-6 p-3.5 sm:p-4 rounded-xl text-sm leading-relaxed border"
            :class="ventanaNomina.abierta
              ? 'bg-emerald-50 border-emerald-100 text-emerald-900'
              : 'bg-amber-50 border-amber-200 text-amber-900'"
          >
            <p class="font-black text-[10px] uppercase tracking-widest mb-1">
              {{ ventanaNomina.abierta ? 'Periodo de carga abierto' : 'Periodo de carga cerrado' }}
            </p>
            <p class="text-xs font-medium">{{ ventanaNomina.mensaje }}</p>
          </div>

          <div v-if="lista" class="mb-6 sm:mb-8 p-4 sm:p-5 bg-emerald-50 border border-emerald-100 rounded-xl">
            <div class="flex flex-col gap-4">
              <div class="flex items-start gap-3">
                <div class="size-11 sm:size-12 bg-emerald-100 rounded-xl flex items-center justify-center shrink-0">
                  <span class="material-symbols-outlined text-emerald-600 text-2xl">grid_on</span>
                </div>
                <div class="min-w-0 flex-1">
                  <p class="text-[10px] font-black uppercase tracking-widest text-emerald-600 mb-1">Nómina actual</p>
                  <p class="font-bold text-slate-800 break-all text-sm" :title="lista.nombreOriginal">
                    {{ lista.nombreOriginal || 'nomina.xlsx' }}
                  </p>
                  <p class="text-xs text-slate-500 mt-1 leading-relaxed">
                    Subida el {{ formatFecha(lista.updatedAt || lista.createdAt) }}
                    <span v-if="lista.tamanoBytes"> · {{ formatBytes(lista.tamanoBytes) }}</span>
                    <span v-if="cantidadMiembros != null">
                      · <strong>{{ cantidadMiembros }}</strong> fraterno(s)
                    </span>
                  </p>
                </div>
              </div>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  type="button"
                  @click="descargar"
                  class="w-full px-4 py-2.5 bg-primary text-white rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-blue-900 transition-colors"
                >
                  Descargar Excel subido
                </button>
                <button
                  type="button"
                  @click="eliminar"
                  class="w-full px-4 py-2.5 bg-white border border-red-200 text-red-700 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-red-50 transition-colors"
                >
                  Eliminar
                </button>
              </div>
            </div>
          </div>

          <div v-else class="mb-6 sm:mb-8 p-4 sm:p-5 bg-slate-50 border border-dashed border-slate-200 rounded-xl text-center">
            <span class="material-symbols-outlined text-4xl text-slate-300 mb-2">upload_file</span>
            <p class="text-slate-500 font-medium text-sm">Aún no has subido la nómina Excel de tu fraternidad.</p>
          </div>

          <div
            class="border-2 border-dashed rounded-2xl p-5 sm:p-8 text-center transition-colors"
            :class="dragOver ? 'border-primary bg-primary/5' : 'border-slate-200 bg-slate-50/50'"
            @dragover.prevent="dragOver = true"
            @dragleave.prevent="dragOver = false"
            @drop.prevent="onDrop"
          >
            <span class="material-symbols-outlined text-4xl sm:text-5xl text-primary/40 mb-3 sm:mb-4">cloud_upload</span>
            <p class="font-black text-slate-700 uppercase text-xs sm:text-sm mb-1">
              {{ lista ? 'Agregar fraternos nuevos' : 'Subir nómina' }}
            </p>
            <p class="text-slate-400 text-xs mb-4 px-1 leading-relaxed">
              Solo .xlsx (plantilla oficial), máx. 15 MB. Solo se agregan CIs nuevos.
            </p>

            <label
              class="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-3.5 sm:py-3 bg-primary text-white rounded-xl font-black uppercase text-[10px] tracking-widest cursor-pointer hover:bg-blue-900 transition-colors shadow-lg shadow-primary/20"
              :class="{ 'opacity-40 pointer-events-none': ventanaNomina && !ventanaNomina.abierta }"
            >
              <span class="material-symbols-outlined text-lg">folder_open</span>
              Seleccionar archivo
              <input
                type="file"
                accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                class="hidden"
                @change="onFileSelect"
              />
            </label>

            <p v-if="archivoSeleccionado" class="mt-4 text-sm font-bold text-slate-600 break-all px-2">
              {{ archivoSeleccionado.name }}
            </p>
          </div>

          <div class="mt-5 sm:mt-6">
            <button
              type="button"
              @click="subir"
              :disabled="!archivoSeleccionado || uploading || (ventanaNomina && !ventanaNomina.abierta)"
              class="w-full sm:w-auto sm:ml-auto sm:flex px-6 sm:px-8 py-3.5 sm:py-4 bg-secondary text-white rounded-xl font-black uppercase text-[10px] tracking-widest shadow-lg shadow-secondary/20 hover:bg-red-800 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <span class="material-symbols-outlined text-lg" :class="{ 'animate-spin': uploading }">
                {{ uploading ? 'sync' : 'save' }}
              </span>
              {{ uploading ? 'Importando…' : (lista ? 'Agregar nuevos' : 'Guardar nómina') }}
            </button>
          </div>
        </div>
      </div>

      <div v-if="miembros.length" class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div class="px-4 sm:px-5 py-4 border-b border-slate-100">
          <p class="text-[10px] font-black uppercase tracking-widest text-slate-400">Registro importado</p>
          <h3 class="font-black text-slate-800 uppercase text-sm">{{ miembros.length }} fraterno(s)</h3>
        </div>
        <div class="overflow-x-auto -mx-0">
          <table class="w-full text-left text-sm min-w-[820px]">
            <thead class="bg-slate-50 border-b border-slate-200">
              <tr>
                <th class="px-3 py-2.5 text-[10px] font-black uppercase tracking-widest text-slate-500">#</th>
                <th class="px-3 py-2.5 text-[10px] font-black uppercase tracking-widest text-slate-500">Nombre</th>
                <th class="px-3 py-2.5 text-[10px] font-black uppercase tracking-widest text-slate-500">Primer ap.</th>
                <th class="px-3 py-2.5 text-[10px] font-black uppercase tracking-widest text-slate-500">Segundo ap.</th>
                <th class="px-3 py-2.5 text-[10px] font-black uppercase tracking-widest text-slate-500">CI</th>
                <th class="px-3 py-2.5 text-[10px] font-black uppercase tracking-widest text-slate-500">Tipo</th>
                <th class="px-3 py-2.5 text-[10px] font-black uppercase tracking-widest text-slate-500">Celular</th>
                <th class="px-3 py-2.5 text-[10px] font-black uppercase tracking-widest text-slate-500">RU</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr v-for="(m, i) in miembros" :key="m.idMiembro" class="hover:bg-slate-50/80">
                <td class="px-3 py-2 text-xs text-slate-400 font-bold">{{ i + 1 }}</td>
                <td class="px-3 py-2 font-bold text-slate-800 whitespace-nowrap">{{ m.nombres }}</td>
                <td class="px-3 py-2 text-slate-700 whitespace-nowrap">{{ m.primerApellido || m.apellidoPaterno }}</td>
                <td class="px-3 py-2 text-slate-600 whitespace-nowrap">{{ m.segundoApellido || m.apellidoMaterno || '—' }}</td>
                <td class="px-3 py-2 font-mono text-xs text-slate-700">{{ m.ci }}</td>
                <td class="px-3 py-2 text-xs text-slate-700 whitespace-nowrap">{{ m.tipoPersonaLabel || m.tipoPersona || '—' }}</td>
                <td class="px-3 py-2 font-mono text-xs text-slate-700">{{ m.celular || '—' }}</td>
                <td class="px-3 py-2 font-mono text-xs text-slate-700">{{ m.registroUniversitario || '—' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </template>

    <!-- Modal instrucciones (obligatorio 5s) -->
    <Teleport to="body">
      <div
        v-if="modalInstrucciones"
        class="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="nomina-instrucciones-title"
      >
        <div class="absolute inset-0 bg-slate-900/60 backdrop-blur-[2px]" />

        <div
          class="relative w-full sm:max-w-2xl max-h-[94vh] sm:max-h-[90vh] bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden"
        >
          <div class="bg-slate-900 text-white px-5 sm:px-7 py-5 sm:py-6 shrink-0">
            <div class="flex items-start gap-3">
              <span class="material-symbols-outlined text-secondary text-3xl shrink-0">menu_book</span>
              <div class="min-w-0">
                <p class="text-xs font-black uppercase tracking-widest text-slate-400">Nómina Excel</p>
                <h3 id="nomina-instrucciones-title" class="text-xl sm:text-2xl font-black italic uppercase leading-tight mt-0.5">
                  Guía de uso de la planilla
                </h3>
                <p class="text-slate-400 text-sm mt-1.5">Lea con atención antes de continuar</p>
              </div>
            </div>
          </div>

          <div class="flex-1 overflow-y-auto overscroll-contain px-5 sm:px-7 py-5 sm:py-6 space-y-5 text-base">
            <section class="rounded-xl border border-slate-100 bg-slate-50 p-4 sm:p-5">
              <p class="text-xs font-black uppercase tracking-widest text-slate-500 mb-2.5">¿Qué es esta planilla?</p>
              <p class="text-[15px] sm:text-base text-slate-700 font-medium leading-relaxed">
                Es el documento oficial para registrar a las personas de su fraternidad
                (estudiantes, docentes, administrativos o externos).
                Los datos se cargan al sistema <strong>sin crear usuarios</strong>: solo sirven como control de quiénes participan.
                La fraternidad y el tipo de danza aparecen en la cabecera del Excel; no deben escribirse en cada fila.
              </p>
            </section>

            <section>
              <p class="text-xs font-black uppercase tracking-widest text-primary mb-3">Procedimiento paso a paso</p>
              <ol class="space-y-3 text-[15px] sm:text-base text-slate-700 font-medium leading-relaxed list-decimal list-outside pl-5">
                <li>
                  <strong>Descargue la plantilla oficial</strong> desde este módulo.
                  Si extravía el archivo, descargue uno nuevo (también es válido).
                </li>
                <li>
                  Abra el archivo en Excel y complete <strong>una fila por persona</strong>,
                  de arriba hacia abajo, <strong>sin dejar filas en blanco entre registros</strong>.
                </li>
                <li>
                  En cada fila complete obligatoriamente:
                  <strong>Nombre</strong>, <strong>Primer Apellido</strong>,
                  <strong>CI</strong> (únicamente números),
                  <strong>Tipo de Persona</strong> (lista desplegable) y
                  <strong>Número de celular</strong>.
                </li>
                <li>
                  En la columna <strong>Tipo de Persona</strong> use la lista desplegable y elija solo uno de estos valores:
                  <strong>Estudiante</strong>, <strong>Docente</strong>, <strong>Administrativo</strong> o <strong>Externo</strong>.
                </li>
                <li>
                  El <strong>Registro Universitario (RU)</strong> es <strong>obligatorio únicamente si el tipo es Estudiante</strong>.
                  Si el tipo es Docente, Administrativo o Externo, puede dejar el RU vacío.
                </li>
                <li>
                  El <strong>Segundo Apellido</strong> es opcional.
                </li>
                <li>
                  Guarde el archivo y cárguelo aquí dentro del <strong>periodo habilitado</strong> por la administración.
                </li>
                <li>
                  Si ya cargó datos antes, la nueva descarga vendrá <strong>prellenada</strong>.
                  Agregue solo personas nuevas en las filas siguientes, también de forma continua.
                </li>
              </ol>
            </section>

            <section class="rounded-xl border border-amber-100 bg-amber-50/90 p-4 sm:p-5">
              <p class="text-xs font-black uppercase tracking-widest text-amber-800 mb-2.5">Regla de filas continuas</p>
              <p class="text-[15px] sm:text-base text-amber-950/90 font-medium leading-relaxed">
                Debe llenar las filas en secuencia (1, 2, 3, 4…).
                <strong>No está permitido</strong> completar, por ejemplo, las primeras 25 filas,
                dejar 3 vacías y continuar después: el sistema rechazará la planilla.
                Las filas vacías solo pueden quedar al final, después del último registro.
              </p>
            </section>

            <section class="rounded-xl border border-red-100 bg-red-50/80 p-4 sm:p-5">
              <p class="text-xs font-black uppercase tracking-widest text-red-700 mb-2.5">Restricciones (la carga será rechazada si…)</p>
              <ul class="space-y-2.5 text-[15px] sm:text-base text-red-900/90 font-medium leading-relaxed list-disc list-outside pl-5">
                <li>El <strong>CI</strong> contiene letras o símbolos (debe ser solo números).</li>
                <li>Falta el <strong>Tipo de Persona</strong> o no coincide con la lista desplegable.</li>
                <li>El tipo es <strong>Estudiante</strong> y falta el Registro Universitario.</li>
                <li>Falta algún otro campo obligatorio o hay filas vacías intercaladas.</li>
                <li>Se utiliza otro Excel o se altera el identificador de la planilla.</li>
                <li>Se insertan columnas o filas fuera de las preparadas.</li>
                <li>Se vuelve a subir el mismo contenido sin ningún CI nuevo.</li>
                <li>Se intenta cargar fuera del periodo definido en el cronograma.</li>
              </ul>
            </section>

            <section class="rounded-xl border border-emerald-100 bg-emerald-50/80 p-4 sm:p-5">
              <p class="text-xs font-black uppercase tracking-widest text-emerald-800 mb-2.5">Protección de la información</p>
              <p class="text-[15px] sm:text-base text-emerald-950/90 font-medium leading-relaxed">
                Una planilla vacía o con menos datos <strong>no elimina</strong> lo ya registrado.
                Al reenviar, el sistema únicamente <strong>agrega</strong> personas con CI que aún no existan en la base de datos.
              </p>
            </section>
          </div>

          <div class="shrink-0 border-t border-slate-100 p-5 sm:p-6 bg-white safe-bottom">
            <div v-if="segundosRestantes > 0" class="mb-3">
              <div class="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  class="h-full bg-secondary transition-all duration-1000 ease-linear"
                  :style="{ width: `${((5 - segundosRestantes) / 5) * 100}%` }"
                />
              </div>
              <p class="text-center text-xs font-bold uppercase tracking-widest text-slate-400 mt-2.5">
                Espera {{ segundosRestantes }}s para continuar
              </p>
            </div>
            <button
              type="button"
              @click="cerrarModalInstrucciones"
              :disabled="segundosRestantes > 0"
              class="w-full px-4 py-4 rounded-xl font-black uppercase text-sm tracking-widest transition-all flex items-center justify-center gap-2"
              :class="segundosRestantes > 0
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                : 'bg-primary text-white hover:bg-blue-900 shadow-lg shadow-primary/20'"
            >
              <span class="material-symbols-outlined text-[22px]">
                {{ segundosRestantes > 0 ? 'timer' : 'check_circle' }}
              </span>
              {{ segundosRestantes > 0 ? `Entendido (${segundosRestantes})` : 'Entendido' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useAuthStore } from '../store/auth'
import api from '../services/api'
import { notify } from '../utils/notify'

const SESSION_KEY = 'efu_nomina_instrucciones_ok'

const authStore = useAuthStore()
const loading = ref(true)
const uploading = ref(false)
const descargandoPlantilla = ref(false)
const lista = ref(null)
const miembros = ref([])
const fraternidadInfo = ref(null)
const cantidadMiembros = ref(0)
const ventanaNomina = ref(null)
const archivoSeleccionado = ref(null)
const dragOver = ref(false)

const modalInstrucciones = ref(false)
const segundosRestantes = ref(5)
let timerInstrucciones = null

const fraternidadAuth = computed(() => authStore.user?.fraternidad || null)
const nombreFratMostrar = computed(
  () => fraternidadInfo.value?.nombre || fraternidadAuth.value?.nombre || '—',
)
const tipoDanzaMostrar = computed(
  () =>
    fraternidadInfo.value?.tipoDanza ||
    fraternidadAuth.value?.tipoDanza?.nombre ||
    null,
)

const formatFecha = (fecha) => {
  if (!fecha) return ''
  return new Date(fecha).toLocaleDateString('es-BO', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const formatBytes = (n) => {
  const b = Number(n) || 0
  if (b < 1024) return `${b} B`
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`
  return `${(b / (1024 * 1024)).toFixed(1)} MB`
}

const limpiarTimer = () => {
  if (timerInstrucciones) {
    clearInterval(timerInstrucciones)
    timerInstrucciones = null
  }
}

const abrirModalInstrucciones = () => {
  limpiarTimer()
  modalInstrucciones.value = true
  segundosRestantes.value = 5
  timerInstrucciones = setInterval(() => {
    if (segundosRestantes.value <= 1) {
      segundosRestantes.value = 0
      limpiarTimer()
    } else {
      segundosRestantes.value -= 1
    }
  }, 1000)
}

const cerrarModalInstrucciones = () => {
  if (segundosRestantes.value > 0) return
  limpiarTimer()
  modalInstrucciones.value = false
  try {
    sessionStorage.setItem(SESSION_KEY, '1')
  } catch {
    /* ignore */
  }
}

const parseBlobError = async (error) => {
  const data = error.response?.data
  if (data instanceof Blob) {
    try {
      const text = await data.text()
      const json = JSON.parse(text)
      return json.message || 'Error al procesar la solicitud.'
    } catch {
      return 'Error al procesar la solicitud.'
    }
  }
  const msg = error.response?.data?.message
  return Array.isArray(msg) ? msg.join('\n') : (msg || null)
}

const cargar = async () => {
  loading.value = true
  try {
    await authStore.refreshProfile()
    const { data } = await api.get('/listas-nomina/mi/miembros')
    fraternidadInfo.value = data?.fraternidad || null
    lista.value = data?.lista || null
    miembros.value = data?.miembros || []
    cantidadMiembros.value = data?.cantidadMiembros ?? miembros.value.length
    ventanaNomina.value = data?.ventanaNomina || null
  } catch (error) {
    if (error.response?.status !== 400) {
      notify.error('Error', error.response?.data?.message || 'No se pudo cargar la nómina.')
    }
    lista.value = null
    miembros.value = []
    ventanaNomina.value = null
  } finally {
    loading.value = false
  }
}

const descargarPlantilla = async () => {
  descargandoPlantilla.value = true
  try {
    const { data } = await api.get('/listas-nomina/mi/plantilla', { responseType: 'blob' })
    const url = URL.createObjectURL(data)
    const a = document.createElement('a')
    a.href = url
    const sufijo = cantidadMiembros.value ? '_con_datos' : ''
    a.download = `Plantilla_Nomina_${(nombreFratMostrar.value || 'Fraternidad').replace(/\s+/g, '_')}${sufijo}.xlsx`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
    if (cantidadMiembros.value) {
      notify.success(
        'Plantilla lista',
        `Incluye los ${cantidadMiembros.value} fraterno(s) ya registrados. Agrega solo filas nuevas.`,
      )
    }
  } catch (e) {
    const msg = await parseBlobError(e)
    notify.error('Error', msg || 'No se pudo descargar la plantilla.')
  } finally {
    descargandoPlantilla.value = false
  }
}

const setArchivo = (file) => {
  if (!file) return
  const name = file.name.toLowerCase()
  if (!name.endsWith('.xlsx')) {
    notify.warning('Formato inválido', 'Usa la plantilla .xlsx del sistema.')
    return
  }
  if (file.size > 15 * 1024 * 1024) {
    notify.warning('Archivo muy grande', 'El Excel no puede superar 15 MB.')
    return
  }
  archivoSeleccionado.value = file
}

const onFileSelect = (e) => {
  setArchivo(e.target.files?.[0])
  e.target.value = ''
}

const onDrop = (e) => {
  dragOver.value = false
  setArchivo(e.dataTransfer.files?.[0])
}

const subir = async () => {
  if (!archivoSeleccionado.value) return
  uploading.value = true
  try {
    const formData = new FormData()
    formData.append('file', archivoSeleccionado.value)
    const { data } = await api.post('/listas-nomina/mi', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    lista.value = data
    cantidadMiembros.value = data?.cantidadMiembros ?? 0
    archivoSeleccionado.value = null
    const agregados = data?.agregados ?? data?.cantidadMiembros ?? 0
    const ya = data?.yaRegistrados ?? 0
    notify.success(
      'Importado',
      ya > 0
        ? `Se agregaron ${agregados} fraterno(s) nuevo(s). ${ya} ya estaban registrados (no se modificaron).`
        : `Se registraron ${agregados} fraterno(s).`,
    )
    await cargar()
  } catch (error) {
    const msg = error.response?.data?.message
    notify.error('Error', Array.isArray(msg) ? msg.join('\n') : (msg || 'No se pudo subir el archivo.'))
  } finally {
    uploading.value = false
  }
}

const descargar = async () => {
  try {
    const { data } = await api.get('/listas-nomina/mi/archivo', { responseType: 'blob' })
    const url = URL.createObjectURL(data)
    const a = document.createElement('a')
    a.href = url
    a.download = lista.value?.nombreOriginal || 'nomina.xlsx'
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  } catch (e) {
    notify.error('Error', 'No se pudo descargar el archivo.')
  }
}

const eliminar = async () => {
  const conf = await notify.confirm(
    '¿Eliminar nómina?',
    'Se quitará el Excel y el registro de fraternos de tu fraternidad.',
    'Sí, eliminar',
  )
  if (!conf.isConfirmed) return
  try {
    await api.delete('/listas-nomina/mi')
    lista.value = null
    miembros.value = []
    cantidadMiembros.value = 0
    notify.success('Eliminado', 'La nómina fue removida.')
  } catch (e) {
    notify.error('Error', e.response?.data?.message || 'No se pudo eliminar.')
  }
}

onMounted(async () => {
  await cargar()
  let yaLeido = false
  try {
    yaLeido = sessionStorage.getItem(SESSION_KEY) === '1'
  } catch {
    yaLeido = false
  }
  if (!yaLeido && (fraternidadInfo.value || fraternidadAuth.value)) {
    abrirModalInstrucciones()
  }
})

onUnmounted(limpiarTimer)
</script>

<style scoped>
.safe-bottom {
  padding-bottom: max(1rem, env(safe-area-inset-bottom));
}
</style>
