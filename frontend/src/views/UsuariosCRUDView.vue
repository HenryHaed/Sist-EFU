<template>
  <div class="px-6 py-8">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
      <div>
        <h2 class="text-3xl font-black text-primary tracking-tight capitalize">Gestión de {{ tituloVista }}</h2>
        <p class="text-slate-500 font-medium text-sm mt-1">Administra los accesos de los usuarios con el rol {{ tituloVista }}.</p>
      </div>
      <button 
        @click="abrirModal(false)"
        class="bg-primary hover:bg-red-800 text-white px-5 py-2.5 rounded-lg font-bold shadow-lg shadow-primary/20 transition-all flex items-center gap-2"
      >
        <span class="material-symbols-outlined text-xl">person_add</span>
        Nuevo {{ props.rolFiltro === 'jurado' ? 'Jurado' : 'Usuario' }}
      </button>
    </div>

    <!-- Stats summary -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
      <div class="bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-4 hover:shadow-md transition-shadow">
        <div class="size-12 rounded-full flex items-center justify-center shrink-0 bg-primary/10 text-primary">
          <span class="material-symbols-outlined">group</span>
        </div>
        <div>
          <p class="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Total Registrados</p>
          <p class="text-2xl font-black text-slate-900 leading-none">{{ filteredUsuarios.length }}</p>
        </div>
      </div>
    </div>

    <!-- Table content -->
    <div class="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden mt-6">
      <div class="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
        <h3 class="font-black text-slate-700 uppercase tracking-wider text-xs flex items-center gap-2">
          <span class="material-symbols-outlined text-slate-400">group</span> Listado Actual
        </h3>
        <div class="relative w-64">
          <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">search</span>
          <input 
            v-model="searchQuery"
            type="text" 
            placeholder="Buscar por CI o nombre..." 
            class="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-md text-sm outline-none focus:border-primary transition-colors"
          />
        </div>
      </div>
      
      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="bg-slate-50 border-b border-slate-100 text-slate-600">
              <th class="p-4 font-bold text-xs uppercase tracking-wider">CI / Identidad</th>
              <th class="p-4 font-bold text-xs uppercase tracking-wider">Nombres y Apellidos</th>
              <th class="p-4 font-bold text-xs uppercase tracking-wider">Rol Asignado</th>
              <th v-if="props.rolFiltro === 'jurado'" class="p-4 font-bold text-xs uppercase tracking-wider">Perfil de Jurado</th>
              <th class="p-4 font-bold text-xs uppercase tracking-wider text-right">Acciones</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr v-if="loading" class="text-center">
              <td colspan="5" class="p-8 text-slate-500 font-medium">Cargando usuarios...</td>
            </tr>
            <tr v-else-if="filteredUsuarios.length === 0" class="text-center">
              <td colspan="5" class="p-8 text-slate-500 font-medium">No se encontraron resultados</td>
            </tr>
            <tr 
              v-else
              v-for="user in filteredUsuarios" 
              :key="user.idUsuario" 
              class="hover:bg-slate-50/80 transition-colors group"
            >
              <td class="p-4">
                <p class="font-black text-slate-700">{{ user.ci }}</p>
              </td>
              <td class="p-4">
                <p class="font-bold text-slate-900">{{ user.nombres }} {{ user.primerApellido }} {{ user.segundoApellido || '' }}</p>
              </td>
              <td class="p-4">
                <span 
                  class="px-3 py-1 text-[10px] font-black uppercase tracking-wider rounded-md border"
                  :class="{
                    'bg-red-50 text-secondary border-red-100': user.rol?.nombre === 'superusuario',
                    'bg-slate-100 text-slate-600 border-slate-200': user.rol?.nombre === 'admin',
                    'bg-blue-50 text-primary border-blue-100': user.rol?.nombre === 'jurado',
                    'bg-emerald-50 text-emerald-600 border-emerald-100': user.rol?.nombre === 'delegado',
                    'bg-amber-50 text-amber-600 border-amber-100': user.rol?.nombre === 'controladorhcu',
                    'bg-gray-50 text-gray-500 border-gray-200': !user.rol?.nombre
                  }"
                >
                  {{ user.rol?.nombre || 'Sin Rol' }}
                </span>
                <p v-if="user.rol?.nombre === 'delegado' && user.fraternidad" class="text-[9px] font-black text-slate-400 mt-1 uppercase tracking-tighter">
                   {{ user.fraternidad.nombre }}
                </p>
              </td>
              <!-- Columna perfil de jurado -->
              <td v-if="props.rolFiltro === 'jurado'" class="p-4">
                <div v-if="user._perfil" class="flex flex-col gap-2">
                  <div class="flex flex-wrap gap-1.5">
                    <span :class="user._perfil.tipoJurado === 'EFU' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-amber-50 text-amber-700 border-amber-200'"
                      class="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border">
                      {{ user._perfil.tipoJurado }}
                    </span>
                    <span v-for="f in user._perfil.fasesHabilitadas" :key="f.idFase"
                      class="px-2 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-full text-[9px] font-bold">
                      {{ f.nombre }}
                    </span>
                  </div>
                  <div v-if="user._perfil.fraternidadesHabilitadas?.length > 0" class="flex items-center gap-1">
                    <span class="material-symbols-outlined text-[14px] text-slate-400">groups</span>
                    <p class="text-[9px] font-bold text-slate-500 uppercase tracking-tighter">
                      {{ user._perfil.fraternidadesHabilitadas.length }} Fraternidades Asignadas
                    </p>
                  </div>
                </div>
                <span v-else class="text-[10px] text-slate-400 italic">Sin perfil asignado</span>
              </td>
              <td class="p-4 text-right">
                <div class="flex items-center justify-end gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                  <button 
                    @click="abrirModal(true, user)"
                    class="size-8 rounded bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors"
                    title="Editar"
                  >
                    <span class="material-symbols-outlined text-[18px]">edit</span>
                  </button>
                  <button 
                    @click="confirmarEliminacion(user)"
                    class="size-8 rounded bg-red-50 hover:bg-red-100 text-secondary flex items-center justify-center transition-colors"
                    title="Eliminar"
                  >
                    <span class="material-symbols-outlined text-[18px]">delete</span>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modal Save User -->
    <v-dialog v-model="modalOpen" max-width="600" persistent>
      <v-card class="rounded-xl overflow-hidden border border-slate-200">
        <v-card-title class="bg-slate-50 border-b border-slate-100 px-6 py-4 flex items-center justify-between">
          <h3 class="font-black text-slate-900">{{ editando ? (esRolJurado ? 'Editar Jurado' : 'Editar Usuario') : (esRolJurado ? 'Nuevo Jurado' : 'Nuevo Usuario') }}</h3>
          <button @click="cerrarModal" class="text-slate-400 hover:text-slate-600"><span class="material-symbols-outlined">close</span></button>
        </v-card-title>

        <form @submit.prevent="guardarUsuario">
          <v-card-text class="px-6 py-6 border-b border-slate-100 bg-white max-h-[70vh] overflow-y-auto">
            <div class="space-y-5">
              
              <!-- CI -->
              <div>
                <label class="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Carnet de Identidad</label>
                <input v-model="form.ci" required type="text" placeholder="Ej. 1234567"
                  class="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white focus:border-primary outline-none transition-all" />
                <p v-if="!editando" class="text-[9px] text-slate-400 mt-1 italic">La contraseña inicial será el CI del usuario.</p>
              </div>

              <!-- Nombres -->
              <div>
                <label class="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Nombres</label>
                <input v-model="form.nombres" required type="text"
                  class="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white focus:border-primary outline-none transition-all" />
              </div>

              <!-- Apellidos -->
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Primer Apellido</label>
                  <input v-model="form.primerApellido" required type="text"
                    class="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white focus:border-primary outline-none transition-all" />
                </div>
                <div>
                  <label class="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Segundo Apellido</label>
                  <input v-model="form.segundoApellido" type="text"
                    class="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white focus:border-primary outline-none transition-all" />
                </div>
              </div>

              <!-- Password (solo edición) -->
              <div v-if="editando">
                <label class="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Nueva Contraseña <span class="text-slate-400 font-medium normal-case">(Opcional)</span>
                </label>
                <input v-model="form.password" type="password" placeholder="••••••••"
                  class="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white focus:border-primary outline-none transition-all" />
              </div>

              <!-- ════ PANEL JURADO ════ -->
              <div v-if="esRolJurado" class="border-t border-slate-100 pt-5 space-y-6">
                <p class="text-[10px] font-black uppercase tracking-widest text-blue-600 flex items-center gap-2">
                  <span class="material-symbols-outlined text-[16px]">grade</span>
                  Perfil de Especialización (Jurado)
                </p>

                <!-- Tipo de Jurado -->
                <div>
                  <label class="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">Tipo de Jurado</label>
                  <div class="grid grid-cols-2 gap-3">
                    <button type="button" @click="form.tipoJurado = 'EFU'; form.fasesIds = []"
                      :class="form.tipoJurado === 'EFU' ? 'border-primary bg-primary/5 text-primary' : 'border-slate-200 text-slate-400 hover:border-primary/30'"
                      class="flex items-center gap-2 justify-center border-2 rounded-xl py-3 transition-all">
                      <span class="material-symbols-outlined text-xl">school</span>
                      <div class="text-left">
                        <p class="text-[10px] font-black uppercase tracking-widest">EFU</p>
                        <p class="text-[9px] text-slate-400">Folclórica Universitaria</p>
                      </div>
                    </button>
                    <button type="button" @click="form.tipoJurado = 'EXTERNO'; form.fasesIds = []"
                      :class="form.tipoJurado === 'EXTERNO' ? 'border-amber-500 bg-amber-50 text-amber-700' : 'border-slate-200 text-slate-400 hover:border-amber-300'"
                      class="flex items-center gap-2 justify-center border-2 rounded-xl py-3 transition-all">
                      <span class="material-symbols-outlined text-xl">emoji_events</span>
                      <div class="text-left">
                        <p class="text-[10px] font-black uppercase tracking-widest">Externo</p>
                        <p class="text-[9px] text-slate-400">Concurso Independiente</p>
                      </div>
                    </button>
                  </div>
                </div>

                <!-- Fases habilitadas -->
                <div v-if="fasesDisponibles.length > 0">
                  <label class="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                    Fases que puede calificar
                  </label>
                  <div class="bg-slate-50 border-2 border-slate-100 rounded-xl p-3 max-h-36 overflow-y-auto space-y-1">
                    <label v-for="fase in fasesDisponibles" :key="fase.idFase"
                      class="flex items-center gap-3 p-2 rounded-lg cursor-pointer hover:bg-white transition-all">
                      <input type="checkbox" :value="fase.idFase" v-model="form.fasesIds" class="size-4 accent-primary rounded" />
                      <div>
                        <p class="text-sm font-bold text-slate-700">{{ fase.nombre }}</p>
                        <p class="text-[9px] uppercase font-black text-slate-400 tracking-widest">{{ fase.tipoConcurso }} · {{ fase.pesoPorcentaje }}%</p>
                      </div>
                    </label>
                  </div>
                </div>

                <!-- Fraternidades habilitadas (SOLO PARA EFU) -->
                <div v-if="form.tipoJurado === 'EFU'">
                  <label class="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                    Asignación de Fraternidades
                    <span class="text-slate-300 normal-case font-normal">(Si no marcas ninguna, podrá ver todas las habilitadas)</span>
                  </label>
                  <div class="bg-slate-50 border-2 border-slate-100 rounded-xl p-3 max-h-48 overflow-y-auto space-y-1">
                    <div class="flex items-center justify-between mb-2 pb-2 border-b border-slate-200">
                        <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Listado de Fraternidades</p>
                        <button type="button" @click="form.fraternidadesIds = []" class="text-[9px] text-primary font-bold hover:underline">Limpiar Selección</button>
                    </div>
                    <label v-for="frat in todasFraternidades" :key="frat.idFraternidad"
                      class="flex items-center gap-3 p-2 rounded-lg cursor-pointer hover:bg-white transition-all">
                      <input type="checkbox" :value="frat.idFraternidad" v-model="form.fraternidadesIds" class="size-4 accent-primary rounded" />
                      <div>
                        <p class="text-sm font-bold text-slate-700">{{ frat.nombre }}</p>
                        <p class="text-[9px] uppercase font-black text-slate-400 tracking-widest">{{ frat.facultad?.nombre || 'Independiente' }}</p>
                      </div>
                    </label>
                  </div>
                </div>

              </div>

              <!-- ════ PANEL DELEGADO ════ -->
              <div v-if="esRolDelegado" class="border-t border-slate-100 pt-5 space-y-6">
                <p class="text-[10px] font-black uppercase tracking-widest text-emerald-600 flex items-center gap-2">
                  <span class="material-symbols-outlined text-[16px]">how_to_reg</span>
                  Configuración de Delegado
                </p>
                <div>
                  <label class="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Fraternidad a la que pertenece</label>
                  <select v-model="form.idFraternidad" required
                    class="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white focus:border-primary outline-none transition-all">
                    <option value="" disabled>Seleccione una fraternidad</option>
                    <option v-for="frat in todasFraternidades" :key="frat.idFraternidad" :value="frat.idFraternidad">
                      {{ frat.nombre }}
                    </option>
                  </select>
                </div>
              </div>

            </div>
            
            <p v-if="errorFormulario" class="text-secondary text-xs font-bold mt-4 flex items-center gap-1 text-center justify-center">
               <span class="material-symbols-outlined text-[16px]">error</span>
               {{ errorFormulario }}
            </p>
          </v-card-text>

          <v-card-actions class="bg-slate-50 px-6 py-4">
            <v-spacer></v-spacer>
            <button type="button" @click="cerrarModal" class="px-5 py-2 font-bold text-slate-500 hover:text-slate-800 transition-colors text-sm">
              Cancelar
            </button>
            <button type="submit" :disabled="saving"
              class="px-5 py-2 bg-primary hover:bg-blue-900 text-white font-bold rounded-lg shadow-sm transition-all text-sm flex items-center gap-2"
              :class="{'opacity-75 cursor-wait': saving}"
            >
              <span v-if="saving" class="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>
              {{ saving ? 'Guardando...' : (editando ? (esRolJurado ? 'Actualizar Jurado' : 'Actualizar Usuario') : (esRolJurado ? 'Crear Jurado' : 'Crear Usuario')) }}
            </button>
          </v-card-actions>
        </form>
      </v-card>
    </v-dialog>

  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import api from '../services/api'
import Swal from 'sweetalert2'

const props = defineProps({
  rolFiltro: { type: String, required: true }
})

const tituloVista = computed(() => {
  if (props.rolFiltro === 'admin') return 'Administradores'
  if (props.rolFiltro === 'controladorhcu') return 'Controladores HCU'
  return props.rolFiltro + 's'
})

const usuarios = ref([])
const roles = ref([])
const todasFases = ref([])
const todasFraternidades = ref([])
const loading = ref(true)
const saving = ref(false)
const searchQuery = ref('')
const modalOpen = ref(false)
const editando = ref(false)
const errorFormulario = ref('')

const form = ref({
  idUsuario: null,
  ci: '',
  nombres: '',
  primerApellido: '',
  segundoApellido: '',
  password: '',
  idRol: '',
  tipoJurado: 'EFU',
  fasesIds: [],
  fraternidadesIds: [],
  idFraternidad: null
})

// ── Computed ──────────────────────────────────────────────────────────────
const esRolJurado = computed(() => {
  const rolSeleccionado = roles.value.find(r => r.idRol == form.value.idRol)
  return rolSeleccionado?.nombre === 'jurado' || props.rolFiltro === 'jurado'
})

const esRolDelegado = computed(() => {
  const rolSeleccionado = roles.value.find(r => r.idRol == form.value.idRol)
  return rolSeleccionado?.nombre === 'delegado' || props.rolFiltro === 'delegado'
})

const fasesDisponibles = computed(() =>
  todasFases.value.filter(f => f.tipoConcurso === form.value.tipoJurado)
)

const filteredUsuarios = computed(() => {
  let list = usuarios.value.filter(u => u.rol?.nombre === props.rolFiltro)
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase()
    list = list.filter(u =>
      u.ci.toLowerCase().includes(q) ||
      u.nombres.toLowerCase().includes(q) ||
      u.primerApellido.toLowerCase().includes(q)
    )
  }
  return list
})

// ── Carga de datos ────────────────────────────────────────────────────────
const cargarDatos = async () => {
  loading.value = true
  try {
    const [resUsuarios, resRoles, resFases, resFraternidades] = await Promise.all([
      api.get('/usuarios'),
      api.get('/usuarios/roles'),
      api.get('/evaluaciones/fases-auth').catch(() => ({ data: [] })),
      api.get('/fraternidades').catch(() => ({ data: [] }))
    ])
    usuarios.value = resUsuarios.data
    roles.value = resRoles.data
    todasFases.value = resFases.data
    todasFraternidades.value = resFraternidades.data

    // Enriquecer usuarios jurado con su perfil
    if (props.rolFiltro === 'jurado') {
      for (const u of usuarios.value.filter(u => u.rol?.nombre === 'jurado')) {
        try {
          const { data } = await api.get(`/usuarios/${u.idUsuario}/perfil-jurado`)
          u._perfil = data
        } catch { u._perfil = null }
      }
    }
  } catch (error) {
    console.error('Error cargando datos de usuarios', error)
  } finally {
    loading.value = false
  }
}

onMounted(cargarDatos)

// ── Modal ─────────────────────────────────────────────────────────────────
const abrirModal = async (modoEdicion, usuario = null) => {
  editando.value = modoEdicion
  errorFormulario.value = ''
  
  if (modoEdicion && usuario) {
    form.value = {
      idUsuario: usuario.idUsuario,
      ci: usuario.ci,
      nombres: usuario.nombres,
      primerApellido: usuario.primerApellido,
      segundoApellido: usuario.segundoApellido || '',
      password: '',
      idRol: usuario.rol?.idRol || '',
      tipoJurado: usuario._perfil?.tipoJurado || 'EFU',
      fasesIds: usuario._perfil?.fasesHabilitadas?.map(f => f.idFase) || [],
      fraternidadesIds: usuario._perfil?.fraternidadesHabilitadas?.map(f => f.idFraternidad) || [],
      idFraternidad: usuario.fraternidad?.idFraternidad || null
    }
  } else {
    const rolDefault = roles.value.find(r => r.nombre === props.rolFiltro)
    form.value = {
      idUsuario: null,
      ci: '', nombres: '', primerApellido: '', segundoApellido: '',
      password: '', idRol: rolDefault?.idRol || '',
      tipoJurado: 'EFU', fasesIds: [], fraternidadesIds: [],
      idFraternidad: null
    }
  }
  modalOpen.value = true
}

const cerrarModal = () => { modalOpen.value = false }

// ── Guardar ───────────────────────────────────────────────────────────────
const guardarUsuario = async () => {
  saving.value = true
  errorFormulario.value = ''
  try {
    const payload = { ...form.value }
    delete payload.idUsuario

    if (!editando.value) {
      payload.password = payload.ci
    } else if (!payload.password) {
      delete payload.password
    }

    if (editando.value) {
      await api.put(`/usuarios/${form.value.idUsuario}`, payload)
      Swal.fire({ title: 'Actualizado', text: 'Usuario actualizado exitosamente', icon: 'success', confirmButtonColor: '#003399' })
    } else {
      await api.post('/usuarios', payload)
      Swal.fire({ title: 'Creado', text: 'Usuario creado exitosamente', icon: 'success', confirmButtonColor: '#003399' })
    }

    cerrarModal()
    await cargarDatos()
  } catch (error) {
    errorFormulario.value = error.response?.data?.message || 'Error al guardar el usuario.'
  } finally {
    saving.value = false
  }
}

const confirmarEliminacion = async (usuario) => {
  const result = await Swal.fire({
    title: '¿Eliminar Usuario?',
    text: `Se eliminará a ${usuario.nombres} ${usuario.primerApellido} (${usuario.ci}). Esta acción no se puede deshacer.`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#d33',
    cancelButtonColor: '#64748b',
    confirmButtonText: 'Sí, eliminar',
    cancelButtonText: 'Cancelar'
  })

  if (result.isConfirmed) {
    try {
      await api.delete(`/usuarios/${usuario.idUsuario}`)
      await cargarDatos()
      Swal.fire('Eliminado', 'El usuario ha sido eliminado.', 'success')
    } catch {
      Swal.fire('Error', 'No se pudo eliminar al usuario. Es posible que tenga dependencias.', 'error')
    }
  }
}
</script>

<style scoped>
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
.animate-spin { animation: spin 1s linear infinite; }

/* Custom Scrollbar for the modal content */
::-webkit-scrollbar {
  width: 6px;
}
::-webkit-scrollbar-track {
  background: #f1f1f1;
}
::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 10px;
}
::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}
</style>
