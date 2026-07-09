<template>
  <div class="dashboard-page max-w-7xl">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
      <div>
        <h2 class="dashboard-page-title text-primary capitalize">Gestión de {{ tituloVista }}</h2>
        <p class="text-slate-500 font-medium text-sm mt-1">Administra los accesos de los usuarios con el rol {{ tituloVista }}.</p>
      </div>
      <button 
        @click="abrirModal(false)"
        class="w-full sm:w-auto bg-primary hover:bg-red-800 text-white px-5 py-2.5 rounded-lg font-bold shadow-lg shadow-primary/20 transition-all flex items-center justify-center gap-2"
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
      <div class="p-3 sm:p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 bg-slate-50">
        <h3 class="font-black text-slate-700 uppercase tracking-wider text-xs flex items-center gap-2">
          <span class="material-symbols-outlined text-slate-400">group</span> Listado Actual
        </h3>
        <div class="relative w-full sm:w-64">
          <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">search</span>
          <input 
            v-model="searchQuery"
            type="text" 
            placeholder="Buscar por CI, nombre o correo..." 
            class="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-md text-sm outline-none focus:border-primary transition-colors"
          />
        </div>
      </div>
      
      <!-- Vista Desktop (Tabla) -->
      <div class="hidden md:block overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="bg-slate-50 border-b border-slate-100 text-slate-600">
              <th class="p-4 font-bold text-xs uppercase tracking-wider">CI / Identidad</th>
              <th class="p-4 font-bold text-xs uppercase tracking-wider">Nombres y Apellidos</th>
              <th class="p-4 font-bold text-xs uppercase tracking-wider">Correo</th>
              <th class="p-4 font-bold text-xs uppercase tracking-wider">Rol Asignado</th>
              <th v-if="props.rolFiltro === 'jurado'" class="p-4 font-bold text-xs uppercase tracking-wider">Perfil de Jurado</th>
              <th class="p-4 font-bold text-xs uppercase tracking-wider text-right">Acciones</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr v-if="loading" class="text-center">
              <td colspan="6" class="p-8 text-slate-500 font-medium">Cargando usuarios...</td>
            </tr>
            <tr v-else-if="filteredUsuarios.length === 0" class="text-center">
              <td colspan="6" class="p-8 text-slate-500 font-medium">No se encontraron resultados</td>
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
                <p v-if="user.correo" class="text-sm font-medium text-slate-700">{{ user.correo }}</p>
                <span v-else class="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-amber-50 text-amber-700 border border-amber-200 text-[9px] font-black uppercase tracking-wider">
                  <span class="material-symbols-outlined text-[12px]">warning</span>
                  Sin correo
                </span>
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
                <p v-if="user.rol?.nombre === 'delegado'" class="text-[9px] font-black mt-1 uppercase tracking-tighter"
                  :class="user.fraternidad ? 'text-slate-400' : 'text-amber-500'">
                   {{ user.fraternidad?.nombre || 'Sin fraternidad asignada' }}
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

      <!-- Vista Mobile (Tarjetas) -->
      <div class="md:hidden p-4 space-y-4">
        <div v-if="loading" class="text-center p-8 text-slate-500 font-medium">Cargando usuarios...</div>
        <div v-else-if="filteredUsuarios.length === 0" class="text-center p-8 text-slate-500 font-medium">No se encontraron resultados</div>
        
        <div v-else v-for="user in filteredUsuarios" :key="user.idUsuario + '_mobile'" class="bg-slate-50 border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col gap-3 relative overflow-hidden">
          
          <div class="flex justify-between items-start">
            <div>
              <p class="font-black text-slate-900 text-base leading-tight">{{ user.nombres }} {{ user.primerApellido }} {{ user.segundoApellido || '' }}</p>
              <p class="text-xs text-slate-500 mt-0.5"><span class="font-bold">CI:</span> {{ user.ci }}</p>
              <p v-if="user.correo" class="text-xs text-slate-500 mt-0.5 truncate"><span class="font-bold">Correo:</span> {{ user.correo }}</p>
              <p v-else class="text-[9px] font-black text-amber-600 uppercase tracking-wider mt-1">Sin correo registrado</p>
            </div>
            <!-- Rol badge -->
            <span class="px-2 py-1 text-[9px] font-black uppercase tracking-wider rounded-md border"
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
          </div>

          <div v-if="user.rol?.nombre === 'delegado'" class="text-[10px] font-black bg-white border border-slate-100 p-2 rounded-lg"
            :class="user.fraternidad ? 'text-slate-500' : 'text-amber-600'">
            {{ user.fraternidad?.nombre || 'Sin fraternidad asignada' }}
          </div>

          <!-- Perfil Jurado -->
          <div v-if="props.rolFiltro === 'jurado'" class="bg-white border border-slate-100 p-2.5 rounded-xl">
            <div v-if="user._perfil" class="flex flex-col gap-2">
              <div class="flex flex-wrap gap-1.5">
                <span :class="user._perfil.tipoJurado === 'EFU' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-amber-50 text-amber-700 border-amber-200'" class="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border">
                  {{ user._perfil.tipoJurado }}
                </span>
                <span v-for="f in user._perfil.fasesHabilitadas" :key="f.idFase" class="px-2 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-full text-[9px] font-bold">
                  {{ f.nombre }}
                </span>
              </div>
              <div v-if="user._perfil.fraternidadesHabilitadas?.length > 0" class="flex items-center gap-1 mt-1">
                <span class="material-symbols-outlined text-[14px] text-slate-400">groups</span>
                <p class="text-[9px] font-bold text-slate-500 uppercase tracking-tighter">
                  {{ user._perfil.fraternidadesHabilitadas.length }} Fraternidades Asignadas
                </p>
              </div>
            </div>
            <span v-else class="text-[10px] text-slate-400 italic">Sin perfil asignado</span>
          </div>

          <!-- Acciones -->
          <div class="flex items-center gap-2 pt-2 border-t border-slate-200 mt-1">
            <button @click="abrirModal(true, user)" class="flex-1 py-2 bg-white text-slate-600 hover:bg-slate-100 rounded-xl border border-slate-200 flex justify-center shadow-sm">
              <span class="material-symbols-outlined text-[18px]">edit</span>
            </button>
            <button @click="confirmarEliminacion(user)" class="flex-1 py-2 bg-white text-slate-400 hover:text-secondary hover:bg-red-50 rounded-xl border border-slate-200 flex justify-center shadow-sm">
              <span class="material-symbols-outlined text-[18px]">delete</span>
            </button>
          </div>

        </div>
      </div>

    </div>

    <!-- Modal Save User -->
    <v-dialog v-model="modalOpen" max-width="860" max-height="90dvh" scrollable persistent>
      <v-card class="rounded-xl overflow-hidden border border-slate-200 flex flex-col max-h-[90dvh]">
        <v-card-title class="bg-slate-50 border-b border-slate-100 px-4 sm:px-6 py-4 flex items-center justify-between shrink-0">
          <h3 class="font-black text-slate-900 text-base sm:text-lg pr-2">{{ editando ? (esRolJurado ? 'Editar Jurado' : 'Editar Usuario') : (esRolJurado ? 'Nuevo Jurado' : 'Nuevo Usuario') }}</h3>
          <button type="button" @click="cerrarModal" class="text-slate-400 hover:text-slate-600 shrink-0"><span class="material-symbols-outlined">close</span></button>
        </v-card-title>

        <form @submit.prevent="guardarUsuario" class="flex flex-col flex-1 min-h-0">
          <v-card-text class="px-4 sm:px-6 py-5 sm:py-6 bg-white overflow-y-auto flex-1 min-h-0 custom-scrollbar">
            <div class="space-y-5">
              
              <!-- CI -->
              <div>
                <label class="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Carnet de Identidad</label>
                <input
                  v-model="form.ci"
                  required
                  type="text"
                  inputmode="numeric"
                  minlength="5"
                  maxlength="20"
                  pattern="[0-9]{5,20}"
                  placeholder="Ej. 1234567"
                  class="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white focus:border-primary outline-none transition-all"
                />
                <p class="text-[9px] text-slate-400 mt-1">Mínimo 5 dígitos numéricos.</p>
                <p v-if="!editando" class="text-[9px] text-slate-400 mt-0.5 italic">La contraseña inicial será el CI del usuario.</p>
              </div>

              <!-- Nombres -->
              <div>
                <label class="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Nombres</label>
                <input v-model="form.nombres" required type="text"
                  class="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white focus:border-primary outline-none transition-all" />
              </div>

              <!-- Apellidos -->
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

              <!-- Correo -->
              <div>
                <label class="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Correo electrónico
                  <span v-if="!editando" class="text-secondary">*</span>
                </label>
                <input v-model="form.correo" :required="!editando" type="email" placeholder="usuario@ejemplo.com"
                  class="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white focus:border-primary outline-none transition-all" />
                <p v-if="editando && !form.correo" class="text-[9px] text-amber-600 mt-1 font-bold uppercase tracking-wider">
                  Usuario legacy sin correo — complétalo para habilitar recuperación de contraseña.
                </p>
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
              <div v-if="esRolJurado" class="border-t border-slate-100 pt-5 space-y-5">
                <p class="text-[10px] font-black uppercase tracking-widest text-blue-600 flex items-center gap-2">
                  <span class="material-symbols-outlined text-[16px]">grade</span>
                  Perfil de Especialización (Jurado)
                </p>

                <!-- Resumen de alcance activo -->
                <div class="flex gap-2 flex-wrap">
                  <span v-if="form.fasesEfuIds.length > 0"
                    class="flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-full text-[9px] font-black uppercase tracking-widest">
                    <span class="material-symbols-outlined text-[12px]">school</span>
                    EFU Activo ({{ form.fasesEfuIds.length }} fases)
                  </span>
                  <span v-if="form.fasesExternasIds.length > 0"
                    class="flex items-center gap-1 px-3 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-full text-[9px] font-black uppercase tracking-widest">
                    <span class="material-symbols-outlined text-[12px]">emoji_events</span>
                    Externo Activo ({{ form.fasesExternasIds.length }} concursos)
                  </span>
                  <span v-if="form.fasesEfuIds.length === 0 && form.fasesExternasIds.length === 0"
                    class="text-[9px] text-slate-400 italic">Sin fases asignadas aún</span>
                </div>

                <!-- Panel EFU -->
                <div class="border border-blue-100 rounded-xl overflow-hidden">
                  <div class="bg-blue-50 px-4 py-2.5 flex items-center justify-between border-b border-blue-100">
                    <p class="text-[10px] font-black uppercase tracking-widest text-blue-700 flex items-center gap-1.5">
                      <span class="material-symbols-outlined text-[14px]">school</span>
                      Fases EFU (Entrada Universitaria)
                    </p>
                    <button type="button" @click="form.fasesEfuIds = []"
                      class="text-[9px] text-blue-500 hover:text-blue-700 font-bold transition-colors">Limpiar</button>
                  </div>
                  <div v-if="fasesEfu.length > 0" class="p-3 max-h-36 overflow-y-auto space-y-1 bg-white">
                    <label v-for="fase in fasesEfu" :key="fase.idFase"
                      class="flex items-center gap-3 p-2 rounded-lg cursor-pointer hover:bg-blue-50 transition-all">
                      <input type="checkbox" :value="fase.idFase" v-model="form.fasesEfuIds"
                        class="size-4 accent-blue-600 rounded" />
                      <div>
                        <p class="text-sm font-bold text-slate-700">{{ fase.nombre }}</p>
                        <p class="text-[9px] uppercase font-black text-blue-400 tracking-widest">EFU · {{ fase.pesoPorcentaje }}%</p>
                      </div>
                    </label>
                  </div>
                  <div v-else class="p-4 bg-white text-center text-xs text-slate-400 italic">No hay fases EFU configuradas</div>
                </div>

                <!-- Panel EXTERNO -->
                <div class="border border-amber-100 rounded-xl overflow-hidden">
                  <div class="bg-amber-50 px-4 py-2.5 flex items-center justify-between border-b border-amber-100">
                    <p class="text-[10px] font-black uppercase tracking-widest text-amber-700 flex items-center gap-1.5">
                      <span class="material-symbols-outlined text-[14px]">emoji_events</span>
                      Concursos Externos
                    </p>
                    <button type="button" @click="form.fasesExternasIds = []"
                      class="text-[9px] text-amber-500 hover:text-amber-700 font-bold transition-colors">Limpiar</button>
                  </div>
                  <div v-if="fasesExternas.length > 0" class="p-3 max-h-36 overflow-y-auto space-y-1 bg-white">
                    <label v-for="fase in fasesExternas" :key="fase.idFase"
                      class="flex items-center gap-3 p-2 rounded-lg cursor-pointer hover:bg-amber-50 transition-all">
                      <input type="checkbox" :value="fase.idFase" v-model="form.fasesExternasIds"
                        class="size-4 accent-amber-500 rounded" />
                      <div>
                        <p class="text-sm font-bold text-slate-700">{{ fase.nombre }}</p>
                        <p class="text-[9px] uppercase font-black text-amber-400 tracking-widest">EXTERNO · {{ fase.pesoPorcentaje }}pts</p>
                      </div>
                    </label>
                  </div>
                  <div v-else class="p-4 bg-white text-center text-xs text-slate-400 italic">No hay concursos externos configurados</div>
                </div>

                <!-- Fraternidades habilitadas (SOLO SI tiene fases EFU) -->
                <div v-if="form.fasesEfuIds.length > 0">
                  <label class="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                    Restricción de Fraternidades
                    <span class="text-slate-300 normal-case font-normal">(Vacío = acceso a todas)</span>
                  </label>
                  <div class="bg-slate-50 border-2 border-slate-100 rounded-xl p-3 max-h-40 overflow-y-auto space-y-1">
                    <div class="flex items-center justify-between mb-2 pb-2 border-b border-slate-200">
                      <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Fraternidades</p>
                      <button type="button" @click="form.fraternidadesIds = []"
                        class="text-[9px] text-primary font-bold hover:underline">Limpiar</button>
                    </div>
                    <label v-for="frat in todasFraternidades" :key="frat.idFraternidad"
                      class="flex items-center gap-3 p-2 rounded-lg cursor-pointer hover:bg-white transition-all">
                      <input type="checkbox" :value="frat.idFraternidad" v-model="form.fraternidadesIds"
                        class="size-4 accent-primary rounded" />
                      <p class="text-sm font-bold text-slate-700">{{ frat.nombre }}</p>
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
                  <label class="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                    Fraternidad a la que pertenece
                    <span class="text-secondary font-medium normal-case">(Obligatoria para delegado)</span>
                  </label>
                  <v-combobox
                    v-model="form.idFraternidad"
                    v-model:search="fraternidadBusqueda"
                    :items="fraternidadSugerencias"
                    item-title="label"
                    item-value="idFraternidad"
                    :loading="cargandoFraternidades"
                    :no-filter="true"
                    clearable
                    density="comfortable"
                    variant="outlined"
                    placeholder="Escribe el nombre de la fraternidad o crea una nueva"
                    class="text-sm w-full"
                    menu-icon="mdi-chevron-down"
                    no-data-text="Escribe para buscar o añadir una nueva"
                    :menu-props="{ maxWidth: 760, minWidth: 560, contentClass: 'fraternidad-menu-elevado' }"
                  >
                    <template #item="{ props, item }">
                      <v-list-item
                        v-bind="props"
                        class="py-2"
                      >
                        <v-list-item-title class="font-bold text-slate-800">
                          {{ item.raw?.nombre || item.title }}
                        </v-list-item-title>
                        <v-list-item-subtitle class="text-xs text-slate-500 whitespace-normal">
                          {{ item.raw?.etiqueta || 'Coincidencia histórica' }}<span v-if="item.raw?.gestionAnio"> · Gestión {{ item.raw.gestionAnio }}</span><span v-if="item.raw?.gestionActiva"> · Activa</span>
                        </v-list-item-subtitle>
                      </v-list-item>
                    </template>
                  </v-combobox>
                  <p class="text-[9px] text-slate-400 mt-1 italic">
                    Puedes escribir para buscar coincidencias históricas de otras gestiones. Si no corresponde a ninguna, deja el campo vacío.
                  </p>
                </div>
              </div>

            </div>
            
            <p v-if="errorFormulario" class="text-secondary text-xs font-bold mt-4 flex items-center gap-1 text-center justify-center">
               <span class="material-symbols-outlined text-[16px]">error</span>
               {{ errorFormulario }}
            </p>
          </v-card-text>

          <v-card-actions class="bg-slate-50 border-t border-slate-100 px-4 sm:px-6 py-4 shrink-0">
            <div class="flex flex-col-reverse sm:flex-row gap-3 w-full sm:justify-end">
              <button
                type="button"
                @click="cerrarModal"
                class="w-full sm:w-auto px-5 py-2.5 font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-100 rounded-lg transition-colors text-sm"
              >
                Cancelar
              </button>
              <button
                type="submit"
                :disabled="saving"
                class="w-full sm:w-auto px-5 py-2.5 bg-primary hover:bg-blue-900 text-white font-bold rounded-lg shadow-sm transition-all text-sm flex items-center justify-center gap-2"
                :class="{'opacity-75 cursor-wait': saving}"
              >
                <span v-if="saving" class="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>
                {{ saving ? 'Guardando...' : (editando ? (esRolJurado ? 'Actualizar Jurado' : 'Actualizar Usuario') : (esRolJurado ? 'Crear Jurado' : 'Crear Usuario')) }}
              </button>
            </div>
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
import { validarCiUsuario, normalizarCiUsuario } from '../utils/ciUsuario'

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
const fraternidadBusqueda = ref('')
const fraternidadSugerencias = ref([])
const cargandoFraternidades = ref(false)
let fraternidadBusquedaTimeout = null
const loading = ref(true)
const saving = ref(false)
const ciOriginalAlAbrir = ref('')
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
  correo: '',
  password: '',
  idRol: '',
  fasesEfuIds: [],
  fasesExternasIds: [],
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

const fasesEfu = computed(() => todasFases.value.filter(f => f.tipoConcurso === 'EFU'))
const fasesExternas = computed(() => todasFases.value.filter(f => f.tipoConcurso === 'EXTERNO'))

const filteredUsuarios = computed(() => {
  let list = usuarios.value.filter(u => u.rol?.nombre === props.rolFiltro)
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase()
    list = list.filter(u =>
      u.ci.toLowerCase().includes(q) ||
      u.nombres.toLowerCase().includes(q) ||
      u.primerApellido.toLowerCase().includes(q) ||
      (u.correo || '').toLowerCase().includes(q)
    )
  }
  return list
})

const formatearSugerenciaFraternidad = (frat = {}) => ({
  ...frat,
  label: `${frat.nombre || ''}${frat.etiqueta ? ` (${frat.etiqueta})` : ''}`
})

const asegurarFraternidadSeleccionada = (frat) => {
  if (!frat?.idFraternidad) return
  const sugerencia = formatearSugerenciaFraternidad(frat)
  if (!fraternidadSugerencias.value.some(item => item.idFraternidad === sugerencia.idFraternidad)) {
    fraternidadSugerencias.value = [sugerencia, ...fraternidadSugerencias.value]
  }
}

const buscarFraternidades = async (texto = '') => {
  const consulta = texto.trim()

  if (consulta.length < 2) {
    fraternidadSugerencias.value = []
    const actual = usuarios.value.find(u => u.idUsuario === form.value.idUsuario)?.fraternidad
    if (actual) asegurarFraternidadSeleccionada(actual)
    return
  }

  cargandoFraternidades.value = true
  try {
    const { data } = await api.get('/fraternidades/buscar', { params: { q: consulta } })
    fraternidadSugerencias.value = Array.isArray(data) ? data.filter(Boolean).map(formatearSugerenciaFraternidad) : []
    const actual = usuarios.value.find(u => u.idUsuario === form.value.idUsuario)?.fraternidad
    if (actual) asegurarFraternidadSeleccionada(actual)
  } catch (error) {
    console.error('Error buscando fraternidades', error)
    fraternidadSugerencias.value = []
  } finally {
    cargandoFraternidades.value = false
  }
}

watch(fraternidadBusqueda, (valor) => {
  clearTimeout(fraternidadBusquedaTimeout)
  fraternidadBusquedaTimeout = setTimeout(() => {
    buscarFraternidades(valor)
  }, 250)
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
    ciOriginalAlAbrir.value = usuario.ci || ''
    form.value = {
      idUsuario: usuario.idUsuario,
      ci: usuario.ci,
      nombres: usuario.nombres,
      primerApellido: usuario.primerApellido,
      segundoApellido: usuario.segundoApellido || '',
      correo: usuario.correo || '',
      password: '',
      idRol: usuario.rol?.idRol || '',
      fasesEfuIds: usuario._perfil?.fasesEfu?.map(f => f.idFase) || [],
      fasesExternasIds: usuario._perfil?.fasesExternas?.map(f => f.idFase) || [],
      fraternidadesIds: usuario._perfil?.fraternidadesHabilitadas?.map(f => f.idFraternidad) || [],
      idFraternidad: usuario.fraternidad?.idFraternidad || null
    }
    fraternidadBusqueda.value = usuario.fraternidad?.nombre || ''
    fraternidadSugerencias.value = []
    asegurarFraternidadSeleccionada(usuario.fraternidad)
  } else {
    ciOriginalAlAbrir.value = ''
    const rolDefault = roles.value.find(r => r.nombre === props.rolFiltro)
    form.value = {
      idUsuario: null,
      ci: '', nombres: '', primerApellido: '', segundoApellido: '', correo: '',
      password: '', idRol: rolDefault?.idRol || '',
      fasesEfuIds: [], fasesExternasIds: [], fraternidadesIds: [],
      idFraternidad: null
    }
    fraternidadBusqueda.value = ''
    fraternidadSugerencias.value = []
  }
  modalOpen.value = true
}

const cerrarModal = () => {
  modalOpen.value = false
  fraternidadBusqueda.value = ''
  fraternidadSugerencias.value = []
}

// ── Guardar ───────────────────────────────────────────────────────────────
const guardarUsuario = async () => {
  saving.value = true
  errorFormulario.value = ''
  try {
    const payload = {
      ...form.value,
      fasesEfuIds: form.value.fasesEfuIds,
      fasesExternasIds: form.value.fasesExternasIds,
      fraternidadesIds: form.value.fraternidadesIds
    }
    delete payload.idUsuario

    if (!editando.value && !form.value.correo?.trim()) {
      errorFormulario.value = 'El correo es obligatorio al crear un usuario.'
      saving.value = false
      return
    }

    const ciCambio = !editando.value || form.value.ci !== ciOriginalAlAbrir.value
    if (ciCambio) {
      const errorCi = validarCiUsuario(form.value.ci)
      if (errorCi) {
        errorFormulario.value = errorCi
        saving.value = false
        return
      }
      form.value.ci = normalizarCiUsuario(form.value.ci)
      payload.ci = form.value.ci
    } else if (editando.value) {
      delete payload.ci
    }

    if (!editando.value) {
      payload.password = payload.ci
    } else if (!payload.password) {
      delete payload.password
    }

    if (esRolDelegado.value) {
      if (typeof form.value.idFraternidad === 'string') {
        payload.nuevaFraternidad = form.value.idFraternidad
        payload.idFraternidad = null
      } else if (typeof form.value.idFraternidad === 'object' && form.value.idFraternidad !== null) {
        payload.idFraternidad = form.value.idFraternidad.idFraternidad
      } else {
        payload.idFraternidad = form.value.idFraternidad || null
      }
    }

    if (editando.value) {
      await api.put(`/usuarios/${form.value.idUsuario}`, payload)
      Swal.fire({ title: 'Actualizado', text: 'Usuario actualizado exitosamente', icon: 'success', confirmButtonColor: '#003399' })
    } else {
      await api.post('/usuarios', payload)
      Swal.fire({
        title: 'Creado',
        text: 'Usuario creado exitosamente. Se enviará un correo al usuario con sus datos de acceso al sistema.',
        icon: 'success',
        confirmButtonColor: '#003399',
      })
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
  let timerInterval
  const result = await Swal.fire({
    title: '¿Estás absolutamente seguro?',
    html: `Se eliminará permanentemente a <strong>${usuario.nombres} ${usuario.primerApellido}</strong> (${usuario.ci}).<br/><br/>También se eliminarán sus solicitudes de inscripción, perfiles de jurado y registros ligados. Esta acción <strong>NO</strong> se puede deshacer.`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#d33',
    cancelButtonColor: '#64748b',
    confirmButtonText: 'Eliminar (5s)',
    cancelButtonText: 'Cancelar',
    reverseButtons: true,
    focusCancel: true,
    didOpen: () => {
      const confirmBtn = Swal.getConfirmButton()
      if (!confirmBtn) return
      confirmBtn.disabled = true
      let seconds = 5
      timerInterval = setInterval(() => {
        seconds--
        confirmBtn.innerText = `Eliminar (${seconds}s)`
        if (seconds <= 0) {
          confirmBtn.disabled = false
          confirmBtn.innerText = 'Sí, eliminar permanentemente'
          clearInterval(timerInterval)
        }
      }, 1000)
    },
    willClose: () => {
      clearInterval(timerInterval)
    },
  })

  if (result.isConfirmed) {
    try {
      await api.delete(`/usuarios/${usuario.idUsuario}`)
      await cargarDatos()
      Swal.fire({
        title: 'Eliminado',
        text: 'El usuario ha sido eliminado.',
        icon: 'success',
        confirmButtonColor: '#003399',
      })
    } catch (e) {
      Swal.fire({
        title: 'Error',
        text: e.response?.data?.message || 'No se pudo eliminar al usuario.',
        icon: 'error',
        confirmButtonColor: '#003399',
      })
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
.custom-scrollbar {
  scrollbar-width: thin;
  scrollbar-color: #cbd5e1 transparent;
}

.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 10px;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}
</style>
