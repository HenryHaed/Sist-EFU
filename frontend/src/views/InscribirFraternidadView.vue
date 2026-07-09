<template>
  <div class="dashboard-page max-w-5xl">
    <!-- Header -->
    <div class="mb-8 sm:mb-10 text-left">
      <div class="flex items-center gap-3 mb-2">
        <span class="h-6 sm:h-8 w-2 bg-secondary rounded-full shrink-0"></span>
        <h2 class="dashboard-page-title italic uppercase text-primary">Inscripción Oficial</h2>
      </div>
      <p class="text-slate-500 font-medium">Completa los 33 puntos requeridos para el registro de tu fraternidad en la gestión {{ siteInfo.anio }}.</p>
    </div>

    <!-- Stepper Navigation -->
    <div class="mb-8 sm:mb-12 overflow-x-auto pb-2 -mx-1 px-1">
      <div class="flex items-center justify-between relative min-w-[520px] sm:min-w-0 max-w-3xl mx-auto">
      <div class="absolute top-1/2 left-0 w-full h-[2px] bg-slate-100 -translate-y-1/2 z-0"></div>
      <div 
        v-for="(step, i) in steps" :key="i"
        class="relative z-10 flex flex-col items-center gap-3"
      >
        <div 
          class="size-12 rounded-full flex items-center justify-center font-black transition-all duration-500 border-4"
          :class="[
            currentStep > i + 1 ? 'bg-green-500 border-green-100 text-white' : 
            currentStep === i + 1 ? 'bg-primary border-blue-100 text-white shadow-lg shadow-primary/30 scale-110' : 
            'bg-white border-slate-50 text-slate-300'
          ]"
        >
          <span v-if="currentStep > i + 1" class="material-symbols-outlined">check</span>
          <span v-else>{{ i + 1 }}</span>
        </div>
        <span class="text-[9px] font-black uppercase tracking-widest text-center max-w-[4.5rem] leading-tight" :class="currentStep === i + 1 ? 'text-primary' : 'text-slate-400'">{{ step.label }}</span>
      </div>
      </div>
    </div>

    <!-- FORM CONTAINER -->
    <div class="bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200/50 border border-slate-100 overflow-hidden min-h-[500px]">
      
      <!-- LOADING STATE -->
      <div v-if="loadingForm" class="py-32 flex flex-col items-center justify-center">
        <span class="material-symbols-outlined animate-spin text-5xl text-primary mb-4">progress_activity</span>
        <p class="text-slate-400 font-bold uppercase tracking-widest text-xs">Verificando estado de inscripción...</p>
      </div>

      <!-- SOLICITUD YA ENVIADA O APROBADA -->
      <div v-else-if="solicitudExistente && !solicitudEditable" class="py-24 px-8 text-center flex flex-col items-center">
        <!-- RECHAZADO: anulada, sin derecho a corregir -->
        <template v-if="solicitudExistente.estado === 'RECHAZADO'">
          <div class="size-24 bg-red-50 text-secondary rounded-full flex items-center justify-center mb-6">
            <span class="material-symbols-outlined text-5xl">block</span>
          </div>
          <h3 class="text-2xl font-black text-slate-800 uppercase italic mb-2">Inscripción anulada</h3>
          <p class="max-w-md text-slate-500 font-medium mb-4">
            La Comisión ha rechazado y anulado tu solicitud de inscripción para la gestión {{ siteInfo.anio }}.
            <strong class="text-secondary">No tienes derecho a corregir ni reenviar</strong> esta inscripción.
          </p>
          <div v-if="solicitudExistente.observaciones" class="bg-red-50 border border-red-100 p-4 rounded-xl mb-8 max-w-md text-left">
            <p class="text-[10px] font-black uppercase text-red-600 mb-1">Motivo del rechazo (La Comisión):</p>
            <p class="text-xs text-red-800 font-medium">{{ solicitudExistente.observaciones }}</p>
          </div>
          <button @click="$router.push('/dashboard')" class="px-8 py-3 bg-slate-800 text-white rounded-xl font-black uppercase text-xs tracking-widest">
            Ir a Mi Panel
          </button>
        </template>

        <!-- PENDIENTE: en revisión -->
        <template v-else-if="solicitudExistente.estado === 'PENDIENTE'">
          <div class="size-24 bg-indigo-50 text-primary rounded-full flex items-center justify-center mb-6">
            <span class="material-symbols-outlined text-5xl">mark_email_read</span>
          </div>
          <h3 class="text-2xl font-black text-slate-800 uppercase italic mb-2">Solicitud en Revisión</h3>
          <p class="max-w-md text-slate-500 font-medium mb-4">
            Ya has enviado una solicitud de inscripción para la gestión {{ siteInfo.anio }}.
            Tu registro se encuentra actualmente en estado:
            <span class="px-3 py-1 bg-primary/10 text-primary rounded-full font-black text-[10px] uppercase ml-2">
              PENDIENTE
            </span>
          </p>
          <p class="max-w-sm text-slate-400 text-xs italic mb-8">
            Por favor, espera a que <strong>La Comisión</strong> revise tu documentación. Serás notificado una vez se tome una decisión.
          </p>
          <button @click="$router.push('/dashboard')" class="px-8 py-3 bg-primary text-white rounded-xl font-black uppercase text-xs tracking-widest shadow-xl shadow-primary/20 hover:scale-105 transition-all">
            Ir a Mi Panel
          </button>
        </template>

        <!-- APROBADO PERO AUN SIN FRATERNIDAD CREADA (fallback manual) -->
        <template v-else-if="solicitudExistente.estado === 'APROBADO' && !solicitudExistente.fraternidadCreada">
          <div class="size-24 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mb-6 mx-auto">
            <span class="material-symbols-outlined text-5xl">task_alt</span>
          </div>
          <h3 class="text-2xl font-black text-slate-800 uppercase italic mb-2">¡Preinscripción Aprobada!</h3>
          <p class="text-slate-500 font-medium mb-6">
            Tu solicitud para la fraternidad <b class="text-primary">{{ solicitudExistente.nombreFraternidad }}</b> ha sido revisada y aceptada por <strong>La Comisión</strong>.
          </p>
          <p class="text-slate-400 text-sm italic max-w-md mx-auto mb-8">
            El registro oficial de tu fraternidad está pendiente de completarse en el sistema. Contacta a La Comisión si este estado persiste.
          </p>
          <button @click="$router.push('/dashboard')" class="px-8 py-3 bg-slate-800 text-white rounded-xl font-black uppercase text-xs tracking-widest">
            Ir a mi Panel
          </button>
        </template>

        <!-- APROBADO Y YA INSCRITO OFICIALMENTE -->
        <template v-else-if="solicitudExistente.estado === 'APROBADO' && solicitudExistente.fraternidadCreada">
          <div class="size-24 bg-blue-50 text-primary rounded-full flex items-center justify-center mb-6 mx-auto">
            <span class="material-symbols-outlined text-5xl">verified_user</span>
          </div>
          <h3 class="text-2xl font-black text-slate-800 uppercase italic mb-2">¡Inscripción Oficial Exitosa!</h3>
          <p class="text-slate-500 font-medium mb-6">
            Tu preinscripción fue aceptada e inscrita con éxito. Tus datos registrados son los siguientes:
          </p>
          
          <div class="bg-slate-50 rounded-2xl p-6 border border-slate-200 text-left mb-8 space-y-4 max-w-xl mx-auto w-full shadow-inner">
            <p class="text-[10px] font-black uppercase text-slate-400 tracking-wider border-b border-slate-200 pb-2">Identificación Oficial de la Fraternidad:</p>
            <div class="grid grid-cols-2 gap-4 text-sm">
              <div><span class="font-bold text-slate-400 block text-[10px] uppercase">Nombre</span> <span class="font-medium text-slate-800">{{ solicitudExistente.fraternidadCreada.nombre }}</span></div>
              <div><span class="font-bold text-slate-400 block text-[10px] uppercase">Categoría</span> <span class="font-medium text-slate-800">{{ solicitudExistente.fraternidadCreada.categoria?.nombre || 'General' }}</span></div>
              <div><span class="font-bold text-slate-400 block text-[10px] uppercase">Instancia</span> <span class="font-medium text-slate-800">{{ solicitudExistente.fraternidadCreada.nivelRepresentacion }}</span></div>
              <div v-if="solicitudExistente.fraternidadCreada.facultad"><span class="font-bold text-slate-400 block text-[10px] uppercase">Facultad</span> <span class="font-medium text-slate-800">{{ solicitudExistente.fraternidadCreada.facultad.nombre }}</span></div>
              <div v-if="solicitudExistente.fraternidadCreada.carrera"><span class="font-bold text-slate-400 block text-[10px] uppercase">Carrera</span> <span class="font-medium text-slate-800">{{ solicitudExistente.fraternidadCreada.carrera.nombre }}</span></div>
            </div>
          </div>

          <button @click="$router.push('/dashboard')" class="px-8 py-3 bg-slate-800 text-white rounded-xl font-black uppercase text-xs tracking-widest">
            Ir a mi Panel
          </button>
        </template>
      </div>

      <!-- NO ACTIVE CATEGORIES / EXPIRED STATE -->
      <div v-else-if="activeCategories.length === 0 && !solicitudEditable" class="py-24 px-8 text-center flex flex-col items-center">
        <div class="size-24 bg-red-50 text-secondary rounded-full flex items-center justify-center mb-6">
          <span class="material-symbols-outlined text-5xl">event_busy</span>
        </div>
        <h3 class="text-2xl font-black text-slate-800 uppercase italic mb-2">Periodo de Inscripción Cerrado</h3>
        <p class="max-w-md text-slate-500 font-medium mb-8">
          Actualmente no existen categorías con periodos de inscripción habilitados. 
          Por favor, consulta el cronograma oficial o contacta con <strong>La Comisión</strong>.
        </p>
        <button @click="$router.push('/')" class="px-8 py-3 bg-slate-800 text-white rounded-xl font-black uppercase text-xs tracking-widest hover:bg-black transition-all">
          Volver al Inicio
        </button>
      </div>

      <form v-else @submit.prevent="handleSubmit" novalidate class="form-inscripcion p-8 md:p-12">
        <div ref="wizardAnchor" class="scroll-mt-4" aria-hidden="true"></div>

        <div v-if="solicitudEditable" class="mb-8 p-6 rounded-3xl border border-amber-300 bg-amber-50">
          <p class="text-[10px] font-black uppercase tracking-[0.2em] text-amber-800 mb-2">Solicitud observada por La Comisión</p>
          <p class="text-sm text-slate-800 font-semibold leading-relaxed">
            La Comisión observó tu solicitud. Corrige únicamente los datos señalados a continuación.
            Los datos ya aprobados por La Comisión quedarán guardados y no se pueden modificar.
          </p>
          <div v-if="correccionesSolicitadas.length" class="mt-4 space-y-2 text-left">
            <p class="text-[10px] font-black uppercase text-amber-700">Corregir lo siguiente:</p>
            <div
              v-for="item in correccionesSolicitadas"
              :key="item.key"
              class="p-3 rounded-xl bg-white border border-red-200"
            >
              <p class="text-[10px] font-black uppercase text-red-800 tracking-widest">{{ item.label }}</p>
              <p v-if="item.comentario" class="text-xs text-red-700 font-medium mt-1">{{ item.comentario }}</p>
            </div>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-3 mt-5 text-[11px] font-semibold">
            <div class="flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-100/80 border border-emerald-300 text-emerald-900">
              <span class="size-3 rounded bg-emerald-400 shrink-0"></span>
              Datos aprobados por La Comisión (bloqueados)
            </div>
            <div class="flex items-center gap-2 px-3 py-2 rounded-xl bg-red-100/80 border border-red-300 text-red-900">
              <span class="size-3 rounded bg-red-400 shrink-0"></span>
              Datos marcados para corregir
            </div>
          </div>
        </div>
        
        <!-- STEP 1: FRATERNIDAD -->
        <div v-if="currentStep === 1" class="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div class="mb-8">
            <h3 class="text-xl font-black italic uppercase text-slate-800">Información de la Fraternidad</h3>
            <p class="text-step-subtitle text-xs font-bold uppercase tracking-widest mt-1">Puntos 1 al 3 del reglamento</p>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
            <!-- 1. Nombre -->
            <div class="md:col-span-2">
              <label class="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-3">1. Nombre de la Fraternidad o Taller Cultural</label>
              <input v-model="form.nombreFraternidad" @input="form.nombreFraternidad = form.nombreFraternidad.toUpperCase()" type="text" required placeholder="Ej. Caporales Ingeniería" :disabled="!puedeEditarNombreFraternidad" :class="claseInputCampo('nombreFraternidad')" />
            </div>

            <!-- 2. Instancia -->
            <div>
              <label class="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-3">2. Instancia a la que representa</label>
              <select v-model="form.instanciaRepresentacion" required :disabled="!puedeEditarCampo('instancia')" :class="claseInputCampo('instanciaRepresentacion')" @change="marcarCampoEditado('instanciaRepresentacion')">
                <option value="Facultad">Facultad</option>
                <option value="Carrera">Carrera</option>
                <option value="UMSA">UMSA (Nivel Central)</option>
                <option value="FEDSIDUMSA">FEDSIDUMSA</option>
                <option value="STUMSA">STUMSA</option>
                <option value="Externo">Externo (Institución)</option>
              </select>
            </div>

            <!-- 3. Categoria -->
            <div>
              <label class="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-3">3. Categoría</label>
              <select v-model="form.idCategoria" required :disabled="!puedeEditarCampo('categoria')" :class="claseInputCampo('idCategoria')" @change="marcarCampoEditado('idCategoria')">
                <option :value="null" disabled>Selecciona una categoría</option>
                <option v-for="cat in activeCategories" :key="cat.idCategoria" :value="cat.idCategoria">
                  {{ cat.nombre }}
                </option>
              </select>
              <p v-if="form.idCategoria" class="text-[9px] text-indigo-500 font-bold uppercase mt-2">
                Inscripción abierta hasta el {{ formatFecha(getCronograma(form.idCategoria)?.fechaFin) }}
              </p>
            </div>

            <!-- Tipo de danza -->
            <div class="md:col-span-2">
              <label class="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-3">Tipo de danza de la fraternidad</label>
              <select v-model="form.idTipoDanza" required :disabled="!puedeEditarCampo('tipoDanza')" :class="claseInputCampo('idTipoDanza')" @change="marcarCampoEditado('idTipoDanza')">
                <option :value="null" disabled>Selecciona el tipo de danza</option>
                <option v-for="td in tiposDanza" :key="td.idTipoDanza" :value="td.idTipoDanza">
                  {{ td.nombre }}
                </option>
              </select>
            </div>

            <!-- Conditional Selects based on Instancia -->
            <div v-if="form.instanciaRepresentacion === 'Facultad' || form.instanciaRepresentacion === 'Carrera'" class="md:col-span-1">
              <label class="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-3">Seleccionar Facultad</label>
              <select v-model="form.idFacultad" required :disabled="!puedeEditarCampo('facultad')" :class="claseInputCampo('idFacultad')" @change="marcarCampoEditado('idFacultad')">
                <option v-for="fac in facultades" :key="fac.idFacultad" :value="fac.idFacultad">{{ fac.nombre }}</option>
              </select>
            </div>

            <div v-if="form.instanciaRepresentacion === 'Carrera'" class="md:col-span-1">
              <label class="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-3">Seleccionar Carrera</label>
              <select v-model="form.idCarrera" required :disabled="!puedeEditarCampo('carrera')" :class="claseInputCampo('idCarrera')" @change="marcarCampoEditado('idCarrera')">
                <option v-for="car in filteredCarreras" :key="car.idCarrera" :value="car.idCarrera">{{ car.nombre }}</option>
              </select>
            </div>

            <div v-if="form.instanciaRepresentacion === 'Externo'" class="md:col-span-1">
              <label class="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-3">Nombre de la Institución Externa</label>
              <input v-model="form.nombreInstitucionExterna" @input="form.nombreInstitucionExterna = form.nombreInstitucionExterna.toUpperCase()" type="text" required placeholder="Escriba el nombre de la institución" :disabled="!puedeEditarCampo('institucionExterna')" :class="claseInputCampo('nombreInstitucionExterna')" />
            </div>
          </div>
        </div>

        <!-- STEP 2: DIRECTIVA (PRESIDENTE, VICE, SEC GEN, HACIENDA) -->
        <div v-if="currentStep === 2" class="animate-in fade-in slide-in-from-bottom-4 duration-500">
           <div class="mb-8">
            <h3 class="text-xl font-black italic uppercase text-slate-800">Cargos de la Directiva (I)</h3>
            <p class="text-step-subtitle text-xs font-bold uppercase tracking-widest mt-1">Puntos 4 al 13 del reglamento</p>
          </div>

          <div class="space-y-10">
            <!-- PRESIDENTE -->
            <div class="bg-slate-50 p-6 rounded-3xl border border-slate-100">
               <div class="flex items-center gap-2 mb-6">
                 <span class="material-symbols-outlined text-primary">person</span>
                 <p class="text-xs font-black uppercase tracking-widest">Presidente de la Fraternidad</p>
                 <span class="ml-auto text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded bg-secondary/10 text-secondary">Obligatorio</span>
               </div>
               <div class="grid grid-cols-1 md:grid-cols-12 gap-6">
                 <div class="md:col-span-4">
                    <label class="label-xs">4. Nombres</label>
                    <input v-model="form.presiNombres" @input="upperCase('presiNombres')" type="text" required placeholder="NOMBRES" :disabled="!puedeEditarCampo('presiNombres')" :class="claseInputCampo('presiNombres')" />
                 </div>
                 <div class="md:col-span-4">
                    <label class="label-xs">Apellido Paterno</label>
                    <input v-model="form.presiPrimerApellido" @input="upperCase('presiPrimerApellido')" type="text" required placeholder="PATERNO" :disabled="!puedeEditarCampo('presiPrimerApellido')" :class="claseInputCampo('presiPrimerApellido')" />
                 </div>
                 <div class="md:col-span-4">
                    <label class="label-xs">Apellido Materno</label>
                    <input v-model="form.presiSegundoApellido" @input="upperCase('presiSegundoApellido')" type="text" placeholder="MATERNO" :disabled="!puedeEditarCampo('presiSegundoApellido')" :class="claseInputCampo('presiSegundoApellido')" />
                 </div>
                 <div class="md:col-span-6">
                    <CiConComplemento
                      v-model:ci="form.presiCi"
                      v-model:complemento="form.presiCiComplemento"
                      v-model:activo="ciComplementoActivo.presi"
                      label="5. Carnet CI"
                      required
                      :disabled="!puedeEditarCampo('presiCi')"
                      :clase-input="claseInputCampo('presiCi')"
                      :mensaje-error="mensajeCi('presiCi')"
                      :estado-validacion="ciValidacion.presiCi"
                      @ci-change="onCiChange('presiCi', 'Presidente')"
                    />
                 </div>
                 <div class="md:col-span-6">
                    <label class="label-xs">6. Celular</label>
                    <input v-model="form.presiCelular" @keypress="onlyNumbers" type="text" required placeholder="Celular" :disabled="!puedeEditarCampo('presiCelular')" :class="claseInputCampo('presiCelular')" />
                 </div>
               </div>
            </div>

            <!-- VICEPRESIDENTE -->
            <div class="bg-slate-50 p-6 rounded-3xl border border-slate-100">
               <div class="flex items-center gap-2 mb-6">
                 <span class="material-symbols-outlined text-slate-400">group</span>
                 <p class="text-xs font-black uppercase tracking-widest">Vicepresidente</p>
                 <span class="ml-auto text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded bg-secondary/10 text-secondary">Obligatorio</span>
               </div>
               <div class="grid grid-cols-1 md:grid-cols-12 gap-6">
                 <div class="md:col-span-4">
                    <label class="label-xs">7. Nombres</label>
                    <input v-model="form.viceNombres" @input="upperCase('viceNombres')" type="text" required placeholder="NOMBRES" :disabled="!puedeEditarCampo('viceNombres')" :class="claseInputCampo('viceNombres')" />
                 </div>
                 <div class="md:col-span-4">
                    <label class="label-xs">Apellido Paterno</label>
                    <input v-model="form.vicePrimerApellido" @input="upperCase('vicePrimerApellido')" type="text" required placeholder="PATERNO" :disabled="!puedeEditarCampo('vicePrimerApellido')" :class="claseInputCampo('vicePrimerApellido')" />
                 </div>
                 <div class="md:col-span-4">
                    <label class="label-xs">Apellido Materno</label>
                    <input v-model="form.viceSegundoApellido" @input="upperCase('viceSegundoApellido')" type="text" placeholder="MATERNO" :disabled="!puedeEditarCampo('viceSegundoApellido')" :class="claseInputCampo('viceSegundoApellido')" />
                 </div>
                 <div class="md:col-span-6">
                    <CiConComplemento
                      v-model:ci="form.viceCi"
                      v-model:complemento="form.viceCiComplemento"
                      v-model:activo="ciComplementoActivo.vice"
                      label="8. Carnet CI"
                      required
                      :disabled="!puedeEditarCampo('viceCi')"
                      :clase-input="claseInputCampo('viceCi')"
                      :mensaje-error="mensajeCi('viceCi')"
                      :estado-validacion="ciValidacion.viceCi"
                      @ci-change="onCiChange('viceCi', 'Vicepresidente')"
                    />
                 </div>
                 <div class="md:col-span-6">
                    <label class="label-xs">9. Celular</label>
                    <input v-model="form.viceCelular" @keypress="onlyNumbers" type="text" required placeholder="Celular" :disabled="!puedeEditarCampo('viceCelular')" :class="claseInputCampo('viceCelular')" />
                 </div>
               </div>
            </div>

            <!-- SECRETARIOS -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
               <div class="p-6 rounded-3xl border border-slate-100">
                  <div class="flex items-center justify-between mb-4">
                    <p class="text-[10px] font-black uppercase tracking-widest text-slate-400">Secretario General</p>
                    <span class="text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded bg-slate-100 text-slate-400">Opcional</span>
                  </div>
                  <div class="grid grid-cols-1 md:grid-cols-12 gap-4">
                    <div class="md:col-span-4">
                       <input v-model="form.secGenNombres" @input="upperCase('secGenNombres')" placeholder="10. Nombres" type="text" :disabled="!puedeEditarCampo('secGenNombres')" :class="claseInputCampo('secGenNombres')" />
                    </div>
                    <div class="md:col-span-4">
                       <input v-model="form.secGenPrimerApellido" @input="upperCase('secGenPrimerApellido')" placeholder="Paterno" type="text" :disabled="!puedeEditarCampo('secGenPrimerApellido')" :class="claseInputCampo('secGenPrimerApellido')" />
                    </div>
                    <div class="md:col-span-4">
                       <input v-model="form.secGenSegundoApellido" @input="upperCase('secGenSegundoApellido')" placeholder="Materno" type="text" :disabled="!puedeEditarCampo('secGenSegundoApellido')" :class="claseInputCampo('secGenSegundoApellido')" />
                    </div>
                    <div class="md:col-span-12">
                       <CiConComplemento
                         v-model:ci="form.secGenCi"
                         v-model:complemento="form.secGenCiComplemento"
                         v-model:activo="ciComplementoActivo.secGen"
                         label="11. Carnet CI"
                         :disabled="!puedeEditarCampo('secGenCi')"
                         :clase-input="claseInputCampo('secGenCi')"
                         :mensaje-error="mensajeCi('secGenCi')"
                         :estado-validacion="ciValidacion.secGenCi"
                         @ci-change="onCiChange('secGenCi', 'Secretario General')"
                       />
                    </div>
                  </div>
               </div>
               <div class="p-6 rounded-3xl border border-primary/20 bg-primary/[0.02]">
                  <div class="flex items-center justify-between mb-4">
                    <p class="text-[10px] font-black uppercase tracking-widest text-slate-700">Secretario de Hacienda</p>
                    <span class="text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded bg-secondary/10 text-secondary">Obligatorio</span>
                  </div>
                  <div class="grid grid-cols-1 md:grid-cols-12 gap-4">
                    <div class="md:col-span-4">
                       <input v-model="form.secHaciNombres" @input="upperCase('secHaciNombres')" placeholder="12. Nombres *" type="text" required :disabled="!puedeEditarCampo('secHaciNombres')" :class="claseInputCampo('secHaciNombres')" />
                    </div>
                    <div class="md:col-span-4">
                       <input v-model="form.secHaciPrimerApellido" @input="upperCase('secHaciPrimerApellido')" placeholder="Paterno *" type="text" required :disabled="!puedeEditarCampo('secHaciPrimerApellido')" :class="claseInputCampo('secHaciPrimerApellido')" />
                    </div>
                    <div class="md:col-span-4">
                       <input v-model="form.secHaciSegundoApellido" @input="upperCase('secHaciSegundoApellido')" placeholder="Materno" type="text" :disabled="!puedeEditarCampo('secHaciSegundoApellido')" :class="claseInputCampo('secHaciSegundoApellido')" />
                    </div>
                    <div class="md:col-span-12">
                       <CiConComplemento
                         v-model:ci="form.secHaciCi"
                         v-model:complemento="form.secHaciCiComplemento"
                         v-model:activo="ciComplementoActivo.secHaci"
                         label="13. Carnet CI *"
                         required
                         :disabled="!puedeEditarCampo('secHaciCi')"
                         :clase-input="claseInputCampo('secHaciCi')"
                         :mensaje-error="mensajeCi('secHaciCi')"
                         :estado-validacion="ciValidacion.secHaciCi"
                         @ci-change="onCiChange('secHaciCi', 'Secretario de Hacienda')"
                       />
                    </div>
                  </div>
               </div>
            </div>
          </div>
        </div>

        <!-- STEP 3: DIRECTIVA (ACTAS, PRENSA, VOCAL, DELEGADOS) -->
        <div v-if="currentStep === 3" class="animate-in fade-in slide-in-from-bottom-4 duration-500">
           <div class="mb-8">
            <h3 class="text-xl font-black italic uppercase text-slate-800">Cargos de la Directiva (II)</h3>
            <p class="text-step-subtitle text-xs font-bold uppercase tracking-widest mt-1">Puntos 14 al 28 del reglamento</p>
          </div>

          <div class="space-y-8">
            <div class="space-y-6">
              <!-- Sec Actas -->
               <div class="p-6 rounded-3xl border border-slate-100">
                  <div class="flex items-center justify-between mb-3">
                    <p class="label-xs mb-0">Secretario de Actas (14-15)</p>
                    <span class="text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded bg-slate-100 text-slate-400">Opcional</span>
                  </div>
                  <div class="grid grid-cols-1 md:grid-cols-12 gap-4">
                    <div class="md:col-span-4">
                      <input v-model="form.secActasNombres" @input="upperCase('secActasNombres')" placeholder="14. Nombres" type="text" :disabled="!puedeEditarCampo('secActasNombres')" :class="claseInputCampo('secActasNombres')" />
                    </div>
                    <div class="md:col-span-4">
                      <input v-model="form.secActasPrimerApellido" @input="upperCase('secActasPrimerApellido')" placeholder="Paterno" type="text" :disabled="!puedeEditarCampo('secActasPrimerApellido')" :class="claseInputCampo('secActasPrimerApellido')" />
                    </div>
                    <div class="md:col-span-4">
                      <input v-model="form.secActasSegundoApellido" @input="upperCase('secActasSegundoApellido')" placeholder="Materno" type="text" :disabled="!puedeEditarCampo('secActasSegundoApellido')" :class="claseInputCampo('secActasSegundoApellido')" />
                    </div>
                    <div class="md:col-span-12">
                      <CiConComplemento
                        v-model:ci="form.secActasCi"
                        v-model:complemento="form.secActasCiComplemento"
                        v-model:activo="ciComplementoActivo.secActas"
                        label="15. Carnet CI"
                        :disabled="!puedeEditarCampo('secActasCi')"
                        :clase-input="claseInputCampo('secActasCi')"
                        :mensaje-error="mensajeCi('secActasCi')"
                        :estado-validacion="ciValidacion.secActasCi"
                        @ci-change="onCiChange('secActasCi', 'Secretario de Actas')"
                      />
                    </div>
                  </div>
               </div>
               <!-- Sec Prensa -->
               <div class="p-6 rounded-3xl border border-slate-100">
                  <div class="flex items-center justify-between mb-3">
                    <p class="label-xs mb-0">Secretario de Prensa y Propaganda (16-17)</p>
                    <span class="text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded bg-slate-100 text-slate-400">Opcional</span>
                  </div>
                  <div class="grid grid-cols-1 md:grid-cols-12 gap-4">
                    <div class="md:col-span-4">
                      <input v-model="form.secPrensaNombres" @input="upperCase('secPrensaNombres')" placeholder="16. Nombres" type="text" :disabled="!puedeEditarCampo('secPrensaNombres')" :class="claseInputCampo('secPrensaNombres')" />
                    </div>
                    <div class="md:col-span-4">
                      <input v-model="form.secPrensaPrimerApellido" @input="upperCase('secPrensaPrimerApellido')" placeholder="Paterno" type="text" :disabled="!puedeEditarCampo('secPrensaPrimerApellido')" :class="claseInputCampo('secPrensaPrimerApellido')" />
                    </div>
                    <div class="md:col-span-4">
                      <input v-model="form.secPrensaSegundoApellido" @input="upperCase('secPrensaSegundoApellido')" placeholder="Materno" type="text" :disabled="!puedeEditarCampo('secPrensaSegundoApellido')" :class="claseInputCampo('secPrensaSegundoApellido')" />
                    </div>
                    <div class="md:col-span-12">
                      <CiConComplemento
                        v-model:ci="form.secPrensaCi"
                        v-model:complemento="form.secPrensaCiComplemento"
                        v-model:activo="ciComplementoActivo.secPrensa"
                        label="17. Carnet CI"
                        :disabled="!puedeEditarCampo('secPrensaCi')"
                        :clase-input="claseInputCampo('secPrensaCi')"
                        :mensaje-error="mensajeCi('secPrensaCi')"
                        :estado-validacion="ciValidacion.secPrensaCi"
                        @ci-change="onCiChange('secPrensaCi', 'Secretario de Prensa')"
                      />
                    </div>
                  </div>
               </div>
               <!-- Vocal -->
               <div class="p-6 rounded-3xl border border-slate-100">
                  <div class="flex items-center justify-between mb-3">
                    <p class="label-xs mb-0">Vocal (18-19)</p>
                    <span class="text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded bg-slate-100 text-slate-400">Opcional</span>
                  </div>
                  <div class="grid grid-cols-1 md:grid-cols-12 gap-4">
                    <div class="md:col-span-4">
                      <input v-model="form.vocalNombres" @input="upperCase('vocalNombres')" placeholder="18. Nombres" type="text" :disabled="!puedeEditarCampo('vocalNombres')" :class="claseInputCampo('vocalNombres')" />
                    </div>
                    <div class="md:col-span-4">
                      <input v-model="form.vocalPrimerApellido" @input="upperCase('vocalPrimerApellido')" placeholder="Paterno" type="text" :disabled="!puedeEditarCampo('vocalPrimerApellido')" :class="claseInputCampo('vocalPrimerApellido')" />
                    </div>
                    <div class="md:col-span-4">
                      <input v-model="form.vocalSegundoApellido" @input="upperCase('vocalSegundoApellido')" placeholder="Materno" type="text" :disabled="!puedeEditarCampo('vocalSegundoApellido')" :class="claseInputCampo('vocalSegundoApellido')" />
                    </div>
                    <div class="md:col-span-12">
                      <CiConComplemento
                        v-model:ci="form.vocalCi"
                        v-model:complemento="form.vocalCiComplemento"
                        v-model:activo="ciComplementoActivo.vocal"
                        label="19. Carnet CI"
                        :disabled="!puedeEditarCampo('vocalCi')"
                        :clase-input="claseInputCampo('vocalCi')"
                        :mensaje-error="mensajeCi('vocalCi')"
                        :estado-validacion="ciValidacion.vocalCi"
                        @ci-change="onCiChange('vocalCi', 'Vocal')"
                      />
                    </div>
                  </div>
               </div>
            </div>

            <!-- DELEGADOS (CON CELULAR) -->
             <div class="space-y-6">
                <!-- Co-gobierno -->
                <div class="bg-indigo-50/50 p-6 rounded-3xl border border-indigo-100/50">
                  <div class="flex items-center justify-between mb-4">
                    <p class="text-[10px] font-black uppercase text-indigo-800">Delegado a Co-Gobierno HCF o HCC (20-22)</p>
                    <span class="text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded bg-secondary/10 text-secondary">Obligatorio</span>
                  </div>
                  <div class="grid grid-cols-1 md:grid-cols-12 gap-4">
                    <div class="md:col-span-4">
                      <input v-model="form.delCogobNombres" @input="upperCase('delCogobNombres')" placeholder="20. Nombres *" type="text" required :disabled="!puedeEditarCampo('delCogobNombres')" :class="claseInputCampo('delCogobNombres')" />
                    </div>
                    <div class="md:col-span-4">
                      <input v-model="form.delCogobPrimerApellido" @input="upperCase('delCogobPrimerApellido')" placeholder="Paterno *" type="text" required :disabled="!puedeEditarCampo('delCogobPrimerApellido')" :class="claseInputCampo('delCogobPrimerApellido')" />
                    </div>
                    <div class="md:col-span-4">
                      <input v-model="form.delCogobSegundoApellido" @input="upperCase('delCogobSegundoApellido')" placeholder="Materno" type="text" :disabled="!puedeEditarCampo('delCogobSegundoApellido')" :class="claseInputCampo('delCogobSegundoApellido')" />
                    </div>
                    <div class="md:col-span-6">
                      <CiConComplemento
                        v-model:ci="form.delCogobCi"
                        v-model:complemento="form.delCogobCiComplemento"
                        v-model:activo="ciComplementoActivo.delCogob"
                        label="21. Carnet CI *"
                        required
                        :disabled="!puedeEditarCampo('delCogobCi')"
                        :clase-input="claseInputCampo('delCogobCi')"
                        :mensaje-error="mensajeCi('delCogobCi')"
                        :estado-validacion="ciValidacion.delCogobCi"
                        @ci-change="onCiChange('delCogobCi', 'Delegado a Co-Gobierno')"
                      />
                    </div>
                    <div class="md:col-span-6">
                      <input v-model="form.delCogobCelular" @keypress="onlyNumbers" placeholder="22. Celular *" type="text" required :disabled="!puedeEditarCampo('delCogobCelular')" :class="claseInputCampo('delCogobCelular')" />
                    </div>
                  </div>
                </div>
                <!-- Titular -->
                <div class="bg-slate-50 p-6 rounded-3xl border border-slate-100">
                  <div class="flex items-center justify-between mb-4">
                    <p class="text-[10px] font-black uppercase text-slate-800">Delegado Titular (23-25)</p>
                    <span class="text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded bg-secondary/10 text-secondary">Obligatorio</span>
                  </div>
                  <div class="grid grid-cols-1 md:grid-cols-12 gap-4">
                    <div class="md:col-span-4">
                      <input v-model="form.delTitularNombres" @input="upperCase('delTitularNombres')" placeholder="23. Nombres *" type="text" required :disabled="!puedeEditarCampo('delTitularNombres')" :class="claseInputCampo('delTitularNombres')" />
                    </div>
                    <div class="md:col-span-4">
                      <input v-model="form.delTitularPrimerApellido" @input="upperCase('delTitularPrimerApellido')" placeholder="Paterno *" type="text" required :disabled="!puedeEditarCampo('delTitularPrimerApellido')" :class="claseInputCampo('delTitularPrimerApellido')" />
                    </div>
                    <div class="md:col-span-4">
                      <input v-model="form.delTitularSegundoApellido" @input="upperCase('delTitularSegundoApellido')" placeholder="Materno" type="text" :disabled="!puedeEditarCampo('delTitularSegundoApellido')" :class="claseInputCampo('delTitularSegundoApellido')" />
                    </div>
                    <div class="md:col-span-6">
                      <CiConComplemento
                        v-model:ci="form.delTitularCi"
                        v-model:complemento="form.delTitularCiComplemento"
                        v-model:activo="ciComplementoActivo.delTitular"
                        label="24. Carnet CI *"
                        required
                        :disabled="!puedeEditarCampo('delTitularCi')"
                        :clase-input="claseInputCampo('delTitularCi')"
                        :mensaje-error="mensajeCi('delTitularCi')"
                        :estado-validacion="ciValidacion.delTitularCi"
                        @ci-change="onCiChange('delTitularCi', 'Delegado Titular')"
                      />
                    </div>
                    <div class="md:col-span-6">
                      <input v-model="form.delTitularCelular" @keypress="onlyNumbers" placeholder="25. Celular *" type="text" required :disabled="!puedeEditarCampo('delTitularCelular')" :class="claseInputCampo('delTitularCelular')" />
                    </div>
                  </div>
                </div>
                <!-- Suplente -->
                <div class="bg-slate-50 p-6 rounded-3xl border border-slate-100">
                  <div class="flex items-center justify-between mb-4">
                    <p class="text-[10px] font-black uppercase text-slate-800">Delegado Suplente (26-28)</p>
                    <span class="text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded bg-secondary/10 text-secondary">Obligatorio</span>
                  </div>
                  <div class="grid grid-cols-1 md:grid-cols-12 gap-4">
                    <div class="md:col-span-4">
                      <input v-model="form.delSuplenteNombres" @input="upperCase('delSuplenteNombres')" placeholder="26. Nombres *" type="text" required :disabled="!puedeEditarCampo('delSuplenteNombres')" :class="claseInputCampo('delSuplenteNombres')" />
                    </div>
                    <div class="md:col-span-4">
                      <input v-model="form.delSuplentePrimerApellido" @input="upperCase('delSuplentePrimerApellido')" placeholder="Paterno *" type="text" required :disabled="!puedeEditarCampo('delSuplentePrimerApellido')" :class="claseInputCampo('delSuplentePrimerApellido')" />
                    </div>
                    <div class="md:col-span-4">
                      <input v-model="form.delSuplenteSegundoApellido" @input="upperCase('delSuplenteSegundoApellido')" placeholder="Materno" type="text" :disabled="!puedeEditarCampo('delSuplenteSegundoApellido')" :class="claseInputCampo('delSuplenteSegundoApellido')" />
                    </div>
                    <div class="md:col-span-6">
                      <CiConComplemento
                        v-model:ci="form.delSuplenteCi"
                        v-model:complemento="form.delSuplenteCiComplemento"
                        v-model:activo="ciComplementoActivo.delSuplente"
                        label="27. Carnet CI *"
                        required
                        :disabled="!puedeEditarCampo('delSuplenteCi')"
                        :clase-input="claseInputCampo('delSuplenteCi')"
                        :mensaje-error="mensajeCi('delSuplenteCi')"
                        :estado-validacion="ciValidacion.delSuplenteCi"
                        @ci-change="onCiChange('delSuplenteCi', 'Delegado Suplente')"
                      />
                    </div>
                    <div class="md:col-span-6">
                      <input v-model="form.delSuplenteCelular" @keypress="onlyNumbers" placeholder="28. Celular *" type="text" required :disabled="!puedeEditarCampo('delSuplenteCelular')" :class="claseInputCampo('delSuplenteCelular')" />
                    </div>
                  </div>
                </div>
             </div>
          </div>
        </div>

        <!-- STEP 4: DOCUMENTOS -->
        <div v-if="currentStep === 4" class="animate-in fade-in slide-in-from-bottom-4 duration-500">
           <div class="mb-8">
            <h3 class="text-xl font-black italic uppercase text-slate-800">Documentación de Respaldo</h3>
            <p class="text-step-subtitle text-xs font-bold uppercase tracking-widest mt-1">4 PDFs por cargo · Solo archivos PDF</p>
          </div>

          <div class="mb-10 space-y-6">
            <p class="text-[11px] text-slate-400 font-medium">
              Por cada integrante: CI, Matrícula, No deudas fraternidad y No deudas áreas.
              Obligatorios solo en cargos obligatorios; en opcionales los PDFs siguen opcionales.
            </p>

            <div
              v-for="seccion in seccionesDocsPorCargo"
              :key="seccion.prefix"
              class="rounded-3xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm"
            >
              <div class="flex flex-wrap items-start justify-between gap-3 mb-4">
                <div class="min-w-0">
                  <div class="flex items-center gap-2 flex-wrap">
                    <h4 class="text-sm font-black uppercase tracking-widest text-slate-800">{{ seccion.label }}</h4>
                    <span
                      class="text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded"
                      :class="seccion.required ? 'bg-secondary/10 text-secondary' : 'bg-slate-100 text-slate-400'"
                    >
                      {{ seccion.required ? 'Obligatorio' : 'Opcional' }}
                    </span>
                  </div>
                  <p class="text-sm font-medium text-slate-700 mt-2">{{ seccion.nombreCompleto || '—' }}</p>
                  <p class="text-xs text-slate-500 font-bold mt-0.5">CI: {{ seccion.ciDisplay }}</p>
                  <p v-if="seccion.faltanDatos" class="text-[10px] font-bold text-amber-600 mt-2">
                    Faltan datos de este cargo — vuelve a los pasos anteriores.
                  </p>
                </div>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div
                  v-for="doc in seccion.docs"
                  :key="doc.fileKey"
                  class="p-4 rounded-2xl border-2 border-dashed transition-colors group"
                  :class="[claseDocumentoRevision(doc.fileKey) || (seccion.required ? 'border-slate-300 hover:border-primary/30' : 'border-slate-200 hover:border-slate-300')]"
                >
                  <div class="flex items-center justify-between mb-3 gap-2">
                    <div class="flex items-center gap-2 min-w-0">
                      <span class="material-symbols-outlined text-slate-400 group-hover:text-primary shrink-0 text-lg">{{ doc.icon }}</span>
                      <p class="text-[10px] font-black uppercase text-slate-600 truncate">{{ doc.shortLabel }}</p>
                    </div>
                    <span v-if="tieneArchivo(doc.fileKey)" class="material-symbols-outlined text-green-500 shrink-0 text-lg">check_circle</span>
                  </div>
                  <label class="cursor-pointer block">
                    <div class="py-2.5 bg-slate-50 rounded-xl flex items-center justify-center gap-2 text-[11px] font-bold text-slate-400 group-hover:text-primary transition-colors">
                      <span class="material-symbols-outlined text-sm">upload_file</span>
                      {{ etiquetaArchivo(doc.fileKey) }}
                    </div>
                    <input type="file" @change="handleFile($event, doc.fileKey)" class="hidden" accept=".pdf,application/pdf" :disabled="!puedeEditarCampo(doc.fileKey)" />
                  </label>
                </div>
              </div>
            </div>
          </div>

          <div>
            <h4 class="text-sm font-black uppercase tracking-widest text-slate-700 mb-6">Documentos institucionales</h4>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div v-for="doc in otrosDocumentFields" :key="doc.key" class="p-6 rounded-3xl border-2 border-dashed transition-colors group" :class="[claseDocumentoRevision(doc.key) || 'border-slate-200 hover:border-primary/30']">
                <div class="flex items-center justify-between mb-4">
                  <div class="flex items-center gap-2">
                    <span class="material-symbols-outlined text-slate-400 group-hover:text-primary">{{ doc.icon }}</span>
                    <p class="text-[10px] font-black uppercase text-slate-600">{{ doc.point }}. {{ doc.label }}</p>
                  </div>
                  <span v-if="tieneArchivo(doc.key)" class="material-symbols-outlined text-green-500">check_circle</span>
                </div>
                <label class="cursor-pointer block">
                  <div class="py-4 bg-slate-50 rounded-xl flex items-center justify-center gap-2 text-xs font-bold text-slate-400 group-hover:text-primary transition-colors">
                    <span class="material-symbols-outlined text-sm">upload_file</span>
                    {{ etiquetaArchivo(doc.key) }}
                  </div>
                  <input type="file" @change="handleFile($event, doc.key)" class="hidden" accept=".pdf,application/pdf" :disabled="!puedeEditarCampo(doc.key)" />
                </label>
              </div>
            </div>
          </div>

          <!-- REGLAMENTO WARNING -->
          <div class="mt-12 p-6 bg-red-50 border border-red-100 rounded-3xl flex items-start gap-4">
            <span class="material-symbols-outlined text-secondary">warning</span>
            <div>
              <p class="text-xs font-black uppercase text-secondary mb-1">Declaración Jurada</p>
              <p class="text-[11px] text-red-800 font-medium leading-relaxed">
                Al enviar este formulario, declaro bajo juramento que toda la información y documentos proporcionados son fidedignos y corresponden a la directiva legalmente constituida. Cualquier falsedad anulará la inscripción.
              </p>
            </div>
          </div>
        </div>

        <!-- NAVIGATION BUTTONS -->
        <div class="mt-16 flex items-center justify-between pt-8 border-t border-slate-100">
           <button 
            v-if="currentStep > 1"
            type="button" @click="prevStep"
            class="px-8 py-4 text-xs font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-all flex items-center gap-2"
           >
             <span class="material-symbols-outlined text-base">arrow_back_ios</span>
             Anterior
           </button>
           <div v-else></div>

           <button 
            v-if="currentStep < 4"
            type="button" @click="nextStep"
            class="px-10 py-4 bg-slate-900 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-slate-200 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2"
           >
             Siguiente
             <span class="material-symbols-outlined text-base">arrow_forward_ios</span>
           </button>

           <button 
            v-else
            type="submit" :disabled="submitting"
            class="w-full sm:w-auto px-8 sm:px-12 py-4 sm:py-5 bg-primary text-white rounded-2xl text-sm font-black uppercase tracking-[0.15em] sm:tracking-[0.2em] shadow-2xl shadow-primary/30 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-50"
           >
             <span v-if="submitting" class="material-symbols-outlined animate-spin">progress_activity</span>
             <span v-else class="material-symbols-outlined">send</span>
             {{ submitting ? 'ENVIANDO...' : 'FINALIZAR INSCRIPCIÓN' }}
           </button>
        </div>

      </form>
    </div>

    <!-- Modal: solicitud observada -->
    <teleport to="body">
      <div
        v-if="modalObservacionesVisible"
        class="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm"
      >
        <div class="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-6 sm:p-8 max-h-[90vh] overflow-y-auto">
          <div class="flex items-center gap-3 mb-4">
            <span class="material-symbols-outlined text-4xl text-orange-500">warning</span>
            <h3 class="text-xl font-black text-slate-900 uppercase leading-tight">Solicitud observada</h3>
          </div>
          <p class="text-sm text-slate-600 mb-4 font-medium">
            La Comisión señaló los siguientes datos que debes corregir antes de reenviar tu solicitud:
          </p>
          <ul class="space-y-3 mb-6">
            <li
              v-for="(item, idx) in itemsObservadosDetalle"
              :key="idx"
              class="p-3 rounded-xl bg-red-50 border border-red-200"
            >
              <p class="text-[10px] font-black uppercase text-red-800 tracking-widest">{{ item.label }}</p>
              <p v-if="item.comentario" class="text-xs text-red-700 font-medium mt-1.5">{{ item.comentario }}</p>
            </li>
          </ul>
          <p v-if="!modalObservacionesHabilitado" class="text-center text-xs text-slate-500 font-bold mb-4 uppercase tracking-widest">
            Lee el mensaje — continúa en {{ segundosRestantesModal }} s
          </p>
          <button
            type="button"
            :disabled="!modalObservacionesHabilitado"
            @click="cerrarModalObservaciones"
            class="w-full py-4 bg-primary text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-primary/20 disabled:opacity-40 disabled:cursor-not-allowed hover:brightness-110 transition-all"
          >
            OK, corregir observaciones
          </button>
        </div>
      </div>
    </teleport>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed, watch, nextTick } from 'vue'
import { useAuthStore } from '../store/auth'
import api from '../services/api'
import Swal from 'sweetalert2'
import CiConComplemento from '../components/inscripcion/CiConComplemento.vue'
import {
  CAMPOS_NOMBRE_PERSONA,
  MAP_ADMIN_KEY_TO_DELEGADO,
  crearEstadoVacioPersonas,
  hidratarPersonasDesdeSolicitud,
  crearEstadoVacioComplementoActivo,
  hidratarComplementoActivoDesdeSolicitud,
  ciIdentificador,
  limpiarComplementosInactivos,
  DOCUMENTOS_POR_PERSONA,
  DOCUMENTOS_INSTITUCIONALES,
  TIPOS_DOCUMENTO_PERSONA,
  PERSONAS_DIRECTIVA,
  PERSONAS_OBLIGATORIAS,
  crearEstadoVacioArchivosPersona,
  hidratarArchivosPersonaDesdeSolicitud,
  nombreCompletoPersona,
  formatCiDisplay,
} from '../utils/personaDirectiva'

const authStore = useAuthStore()
const currentStep = ref(1)
const submitting = ref(false)
const loadingForm = ref(true)
const siteInfo = ref({})
const cronogramas = ref([])
const solicitudExistente = ref(null)
const solicitudEditandoId = ref(null)
const documentosExistentes = ref({})
const hidratandoFormulario = ref(false)
const modalObservacionesVisible = ref(false)
const modalObservacionesHabilitado = ref(false)
const segundosRestantesModal = ref(5)
const camposEditados = ref(new Set())
let modalObservacionesTimer = null
let modalObservacionesInterval = null

const solicitudEditable = computed(() => {
  return solicitudExistente.value?.estado === 'OBSERVADO'
})

const steps = [
  { label: 'Fraternidad' },
  { label: 'Directiva I' },
  { label: 'Directiva II' },
  { label: 'Documentos' }
]

const form = ref({
  nombreFraternidad: '',
  instanciaRepresentacion: 'Facultad',
  nombreInstitucionExterna: '',
  idCategoria: null,
  idTipoDanza: null,
  idFacultad: null,
  idCarrera: null,
  ...crearEstadoVacioPersonas(),
})

const files = ref({
  ...crearEstadoVacioArchivosPersona(),
})

const otrosDocumentFields = DOCUMENTOS_INSTITUCIONALES.map((doc) => ({
  key: doc.fileKey,
  label: doc.label,
  point: doc.point,
  icon: doc.icon,
  required: !!doc.required,
}))

const seccionesDocsPorCargo = computed(() => {
  const f = form.value
  return PERSONAS_DIRECTIVA.map(({ prefix, label, required }) => {
    const nombreCompleto = nombreCompletoPersona(f, prefix)
    const ci = String(f[`${prefix}Ci`] || '').trim()
    const complemento = f[`${prefix}CiComplemento`]
    return {
      prefix,
      label,
      required: !!required,
      nombreCompleto,
      ciDisplay: formatCiDisplay(ci, complemento),
      faltanDatos: required && (!nombreCompleto || !ci),
      docs: TIPOS_DOCUMENTO_PERSONA.map((tipo) => {
        const meta = DOCUMENTOS_POR_PERSONA.find((d) => d.prefix === prefix && d.type === tipo.type)
        return {
          ...tipo,
          fileKey: meta?.fileKey,
          required: !!required,
        }
      }),
    }
  })
})

const documentFieldsObligatorios = computed(() => [
  ...DOCUMENTOS_POR_PERSONA.filter((d) => d.required).map((d) => ({
    key: d.fileKey,
    label: `${d.shortLabel} — ${d.cargoLabel}`,
  })),
  ...otrosDocumentFields,
])

const tieneArchivo = (key) => Boolean(files.value[key] || documentosExistentes.value[key])

const etiquetaArchivo = (key) => {
  if (files.value[key]?.name) return files.value[key].name
  if (documentosExistentes.value[key]) return 'PDF ya cargado (puedes reemplazarlo)'
  return 'Elegir archivo PDF'
}

const upperCase = (field) => {
  marcarCampoEditado(field)
  form.value[field] = form.value[field].toUpperCase()
}

const marcarCampoEditado = (key) => {
  if (!key || !solicitudEditable.value || hidratandoFormulario.value) return
  if (!camposEditados.value.has(key)) {
    camposEditados.value = new Set([...camposEditados.value, key])
  }
}

const ciValidacion = ref({})
const ciTimers = {}
const wizardAnchor = ref(null)
const ciComplementoActivo = ref(crearEstadoVacioComplementoActivo())

const scrollToWizardTop = () => {
  nextTick(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
    wizardAnchor.value?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  })
}

const prefixFromCiField = (ciField) => PERSONAS_DIRECTIVA.find((p) => `${p.prefix}Ci` === ciField)?.prefix

const getComplementoForField = (ciField) => {
  const prefix = prefixFromCiField(ciField)
  if (!prefix || !ciComplementoActivo.value[prefix]) return ''
  return form.value[`${prefix}CiComplemento`] || ''
}

const encontrarDuplicadoEnFormulario = () => null

const onCiChange = (ciField, cargoLabel) => {
  marcarCampoEditado(ciField)
  clearTimeout(ciTimers[ciField])
  const ci = String(form.value[ciField] || '').trim()

  if (!ci || ci.length < 4) {
    ciValidacion.value = { ...ciValidacion.value, [ciField]: { estado: 'idle', mensaje: '' } }
    return
  }

  // Se permite el mismo CI en varios cargos de ESTA fraternidad.
  // Solo se valida que no figure en OTRA fraternidad.
  ciValidacion.value = { ...ciValidacion.value, [ciField]: { estado: 'checking', mensaje: 'Verificando...' } }
  ciTimers[ciField] = setTimeout(async () => {
    try {
      const complemento = getComplementoForField(ciField)
      const params = { ci }
      if (complemento) params.complemento = complemento
      if (solicitudEditandoId.value) params.excludeSolicitudId = solicitudEditandoId.value
      const { data } = await api.get('/inscripciones/verificar-ci-directiva', { params })
      if (!data.disponible) {
        ciValidacion.value = {
          ...ciValidacion.value,
          [ciField]: {
            estado: 'error',
            mensaje: `Ya figura como ${data.cargo} en "${data.nombreFraternidad}".`,
          },
        }
      } else {
        ciValidacion.value = {
          ...ciValidacion.value,
          [ciField]: { estado: 'ok', mensaje: 'CI disponible (puede repetirse en otro cargo de esta fraternidad).' },
        }
      }
    } catch {
      ciValidacion.value = { ...ciValidacion.value, [ciField]: { estado: 'idle', mensaje: '' } }
    }
  }, 450)
}

const mensajeCi = (field) => {
  const estado = ciValidacion.value[field]
  return estado?.estado === 'error' ? estado.mensaje : ''
}

const itemsObservadosDetalle = computed(() => {
  const checklist = revisionChecklistParsed.value
  return Object.entries(checklist)
    .filter(([, item]) => item?.estado === 'X')
    .map(([, item]) => ({
      label: item?.label || 'Dato observado',
      comentario: item?.comentario?.trim() || '',
    }))
})

const abrirModalObservaciones = () => {
  if (!itemsObservadosDetalle.value.length) return
  modalObservacionesVisible.value = true
  modalObservacionesHabilitado.value = false
  segundosRestantesModal.value = 5
  clearTimeout(modalObservacionesTimer)
  clearInterval(modalObservacionesInterval)
  modalObservacionesTimer = setTimeout(() => {
    modalObservacionesHabilitado.value = true
  }, 5000)
  modalObservacionesInterval = setInterval(() => {
    if (segundosRestantesModal.value > 0) segundosRestantesModal.value -= 1
  }, 1000)
}

const cerrarModalObservaciones = () => {
  modalObservacionesVisible.value = false
  clearTimeout(modalObservacionesTimer)
  clearInterval(modalObservacionesInterval)
  scrollToWizardTop()
}

onUnmounted(() => {
  clearTimeout(modalObservacionesTimer)
  clearInterval(modalObservacionesInterval)
})

const revisionChecklistParsed = computed(() => {
  let checklist = solicitudExistente.value?.revisionChecklist || {}
  if (typeof checklist === 'string') {
    try { checklist = JSON.parse(checklist) } catch { checklist = {} }
  }
  return checklist
})

const normalizarKeyRevision = (key) => {
  if (key === 'idFacultad') return 'facultad'
  if (key === 'idCarrera') return 'carrera'
  if (key === 'idCategoria') return 'categoria'
  if (key === 'idTipoDanza') return 'tipoDanza'
  if (key === 'instanciaRepresentacion') return 'instancia'
  if (key === 'nombreInstitucionExterna') return 'institucionExterna'
  return key
}

const checklistKeysForCampo = (key) => {
  const norm = normalizarKeyRevision(key)
  const keys = Object.entries(MAP_ADMIN_KEY_TO_DELEGADO)
    .filter(([, delegadoKey]) => delegadoKey === key || delegadoKey === norm)
    .map(([adminKey]) => adminKey)
  keys.push(norm)
  if (norm !== key) keys.push(key)
  return [...new Set(keys)]
}

const estadoRevisionCampo = (key) => {
  if (!solicitudEditable.value) return 'neutral'
  if (camposEditados.value.has(key)) return 'neutral'
  if (correccionesSolicitadas.value.some((item) => item.key === key)) return 'corregir'

  const checklist = revisionChecklistParsed.value
  const keys = checklistKeysForCampo(key)

  if (keys.some((k) => checklist[k]?.estado === 'X')) return 'corregir'
  if (keys.some((k) => checklist[k]?.estado === 'OK')) return 'aprobado'
  if (!puedeEditarCampo(key) && !isOriginalValueEmpty(key)) return 'aprobado'
  return 'neutral'
}

const claseInputCampo = (key) => {
  const clases = ['form-input']
  const revision = estadoRevisionCampo(key)
  if (revision === 'aprobado') clases.push('campo-aprobado')
  if (revision === 'corregir') clases.push('campo-corregir')

  const ci = ciValidacion.value[key]
  if (ci?.estado === 'error') clases.push('campo-ci-error')
  else if (ci?.estado === 'ok') clases.push('campo-ci-ok')

  return clases.join(' ')
}

const claseDocumentoRevision = (key) => {
  const revision = estadoRevisionCampo(key)
  if (revision === 'aprobado') return 'doc-revision-aprobado'
  if (revision === 'corregir') return 'doc-revision-corregir'
  return ''
}

const tieneConflictosCi = computed(() =>
  Object.values(ciValidacion.value).some((v) => v?.estado === 'error'),
)

const correccionesSolicitadas = computed(() => {
  let checklist = solicitudExistente.value?.revisionChecklist || {}
  if (typeof checklist === 'string') {
    try { checklist = JSON.parse(checklist) } catch { checklist = {} }
  }
  return Object.entries(checklist)
    .filter(([, item]) => item?.estado === 'X')
    .flatMap(([key, item]) => {
      if (key.endsWith('-nombre')) {
        const baseKey = MAP_ADMIN_KEY_TO_DELEGADO[key]
        if (baseKey?.endsWith('Nombres')) {
          const prefix = baseKey.replace('Nombres', '')
          const cargoLabel = key.replace('-nombre', '')
          return [
            { key: `${prefix}Nombres`, label: `${cargoLabel} - Nombres` },
            { key: `${prefix}PrimerApellido`, label: `${cargoLabel} - Paterno` },
            { key: `${prefix}SegundoApellido`, label: `${cargoLabel} - Materno` },
          ]
        }
      }
      const normalizedKey = MAP_ADMIN_KEY_TO_DELEGADO[key] || key
      return [{
        key: normalizedKey,
        label: item?.label || key,
        comentario: item?.comentario?.trim() || '',
      }]
    })
})

const isOriginalValueEmpty = (key) => {
  if (!solicitudExistente.value) return true
  
  let realKey = key
  if (key === 'idFacultad') realKey = 'facultad'
  if (key === 'idCarrera') realKey = 'carrera'
  if (key === 'idCategoria') realKey = 'categoria'
  if (key === 'idTipoDanza') realKey = 'tipoDanza'
  if (key === 'instancia') realKey = 'instanciaRepresentacion'
  
  if (realKey === 'institucionExterna') {
    const relVal = solicitudExistente.value['institucionExterna']
    const textVal = solicitudExistente.value['nombreInstitucionExterna']
    return (!relVal || (typeof relVal === 'object' && Object.keys(relVal).length === 0)) && !textVal
  }

  const val = solicitudExistente.value[realKey]
  if (val === null || val === undefined || val === '') return true
  if (typeof val === 'object') {
    if (Object.keys(val).length === 0) return true
  }
  return false
}

const fraternidadHeredada = computed(() => authStore.user?.fraternidad || null)
const puedeEditarCampo = (key) => {
  // Si la solicitud NO está en modo edición (OBSERVADO), el formulario está libre
  if (!solicitudEditable.value) return true

  // Si el campo estaba vacío originalmente, permitimos llenarlo por primera vez
  if (isOriginalValueEmpty(key)) return true

  // Si está en modo corrección, solo se pueden editar los campos marcados con X
  return correccionesSolicitadas.value.some(item => item.key === key)
}

const puedeEditarNombreFraternidad = computed(() => {
  if (solicitudEditable.value) {
    if (isOriginalValueEmpty('nombreFraternidad')) return true
    return correccionesSolicitadas.value.some(item => item.key === 'nombreFraternidad')
  }
  return !fraternidadHeredada.value
})

// Data for selects
const categorias = ref([])
const tiposDanza = ref([])
const facultades = ref([])
const carreras = ref([])

onMounted(async () => {
  loadingForm.value = true
  try {
    const [cfg, cats, facs, cars, tipos] = await Promise.all([
      api.get('/evaluaciones/gestion-activa'),
      api.get('/categorias'),
      api.get('/organizacion/facultades'),
      api.get('/organizacion/carreras'),
      api.get('/reportes/tipos-danza'),
    ])
    siteInfo.value = cfg.data
    categorias.value = cats.data
    facultades.value = facs.data
    carreras.value = cars.data
    tiposDanza.value = tipos.data

    // Cargar cronogramas
    if (siteInfo.value.idGestion) {
      const { data: cronos } = await api.get(`/inscripciones/cronogramas/${siteInfo.value.idGestion}`)
      cronogramas.value = cronos
    }

    // Verificar si el usuario ya tiene una solicitud
    const { data: misSols } = await api.get('/inscripciones/mis-solicitudes')
    if (misSols && misSols.length > 0) {
      // Buscamos si hay alguna activa para esta gestión
      const actual = misSols.find(s => s.gestion?.idGestion === siteInfo.value.idGestion)
      if (actual) {
        // Cargar el detalle completo para asegurar que revisionChecklist y todos los campos estén disponibles
        const { data: detalleSol } = await api.get(`/inscripciones/${actual.idSolicitud}`)
        solicitudExistente.value = detalleSol
        if (detalleSol.estado === 'OBSERVADO') {
          hidratarFormularioDesdeSolicitud(detalleSol)
          await nextTick()
          abrirModalObservaciones()
        }
      }
    }

    if (!solicitudExistente.value && fraternidadHeredada.value) {
      hidratarFormularioDesdeFraternidad(fraternidadHeredada.value)
    }
  } catch (err) {
    console.error('Error loading form data:', err)
  } finally {
    loadingForm.value = false
  }
})

const getCronograma = (idCat) => {
  return cronogramas.value.find(c => c.categoria.idCategoria === idCat)
}

const activeCategories = computed(() => {
  const ahora = new Date()
  return categorias.value.filter(cat => {
    const crono = getCronograma(cat.idCategoria)
    if (!crono) return false
    return ahora >= new Date(crono.fechaInicio) && ahora <= new Date(crono.fechaFin)
  })
})

const formatFecha = (dateStr) => {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleString('es-BO', { 
    day: '2-digit', month: 'long', hour: '2-digit', minute: '2-digit' 
  })
}

const onlyNumbers = (e) => {
  const char = String.fromCharCode(e.keyCode)
  if (!/[0-9]/.test(char)) e.preventDefault()
}

const nextStep = () => {
  if (validateStep(currentStep.value)) {
    currentStep.value++
    scrollToWizardTop()
  } else {
    Swal.fire({
      icon: 'warning',
      title: 'Campos Incompletos',
      text: 'Por favor, llena todos los campos obligatorios para continuar.',
      toast: true,
      position: 'top-end',
      timer: 3000,
      showConfirmButton: false
    })
  }
}

const prevStep = () => {
  if (currentStep.value > 1) {
    currentStep.value--
    scrollToWizardTop()
  }
}

const validateStep = (step) => {
  const f = form.value
  if (step === 1) {
    if (!f.nombreFraternidad || !f.instanciaRepresentacion || !f.idCategoria || !f.idTipoDanza) return false
    if (f.instanciaRepresentacion === 'Facultad' && !f.idFacultad) return false
    if (f.instanciaRepresentacion === 'Carrera' && (!f.idFacultad || !f.idCarrera)) return false
    if (f.instanciaRepresentacion === 'Externo' && !f.nombreInstitucionExterna) return false
    return true
  }

  const cargosPaso2 = PERSONAS_OBLIGATORIAS.filter((p) =>
    ['presi', 'vice', 'secHaci'].includes(p.prefix),
  )
  const cargosPaso3 = PERSONAS_OBLIGATORIAS.filter((p) =>
    ['delCogob', 'delTitular', 'delSuplente'].includes(p.prefix),
  )
  const cargosAValidar = step === 2 ? cargosPaso2 : step === 3 ? cargosPaso3 : []

  for (const { prefix, label, hasCelular } of cargosAValidar) {
    const nombres = String(f[`${prefix}Nombres`] || '').trim()
    const paterno = String(f[`${prefix}PrimerApellido`] || '').trim()
    const ci = String(f[`${prefix}Ci`] || '').trim()
    if (!nombres || !paterno || !ci) {
      Swal.fire({
        icon: 'warning',
        title: 'Campos obligatorios',
        text: `Completa nombres, apellido paterno y CI de ${label}.`,
        toast: true,
        position: 'top-end',
        timer: 3500,
        showConfirmButton: false,
      })
      return false
    }
    if (hasCelular && !String(f[`${prefix}Celular`] || '').trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'Celular requerido',
        text: `Indica el celular de ${label}.`,
        toast: true,
        position: 'top-end',
        timer: 3000,
        showConfirmButton: false,
      })
      return false
    }
  }

  // Complemento SEGIP: si el switch está activo y hay CI, el complemento es obligatorio
  const prefixesPaso =
    step === 2
      ? ['presi', 'vice', 'secGen', 'secHaci']
      : step === 3
        ? ['secActas', 'secPrensa', 'vocal', 'delCogob', 'delTitular', 'delSuplente']
        : []
  for (const prefix of prefixesPaso) {
    if (!ciComplementoActivo.value[prefix]) continue
    const persona = PERSONAS_DIRECTIVA.find((p) => p.prefix === prefix)
    const ci = String(f[`${prefix}Ci`] || '').trim()
    const comp = String(f[`${prefix}CiComplemento`] || '').trim()
    if (ci && !comp) {
      Swal.fire({
        icon: 'warning',
        title: 'Complemento requerido',
        text: `Indica el complemento SEGIP para ${persona?.label || prefix} o desactiva el switch si no aplica.`,
        toast: true,
        position: 'top-end',
        timer: 3500,
        showConfirmButton: false,
      })
      return false
    }
  }

  return true
}

// Reset conditional fields on change
watch(() => form.value.instanciaRepresentacion, () => {
  if (hidratandoFormulario.value) return
  form.value.idFacultad = null
  form.value.idCarrera = null
  form.value.nombreInstitucionExterna = ''
})

const filteredCarreras = computed(() => {
  if (!form.value.idFacultad) return []
  return carreras.value.filter(c => c.facultad?.idFacultad === form.value.idFacultad)
})

const handleFile = (e, key) => {
  const file = e.target.files[0]
  if (!file) return
  const esPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')
  if (!esPdf) {
    Swal.fire('Formato no válido', 'Solo se permiten archivos PDF.', 'warning')
    e.target.value = ''
    return
  }
  files.value[key] = file
  marcarCampoEditado(key)
}

const hidratarFormularioDesdeFraternidad = async (fraternidad) => {
  if (!fraternidad) return
  hidratandoFormulario.value = true
  form.value.nombreFraternidad = fraternidad.nombre || form.value.nombreFraternidad
  form.value.instanciaRepresentacion = fraternidad.nivelRepresentacion || form.value.instanciaRepresentacion || 'Facultad'
  form.value.idCategoria = fraternidad.categoria?.idCategoria || form.value.idCategoria
  form.value.idFacultad = fraternidad.facultad?.idFacultad || form.value.idFacultad
  form.value.idCarrera = fraternidad.carrera?.idCarrera || form.value.idCarrera
  form.value.nombreInstitucionExterna = fraternidad.institucionExterna?.nombre || form.value.nombreInstitucionExterna
  await nextTick()
  hidratandoFormulario.value = false
}

const hidratarFormularioDesdeSolicitud = async (solicitud) => {
  hidratandoFormulario.value = true
  solicitudEditandoId.value = solicitud.idSolicitud
  form.value = {
    nombreFraternidad: solicitud.nombreFraternidad || fraternidadHeredada.value?.nombre || '',
    instanciaRepresentacion: solicitud.instanciaRepresentacion || fraternidadHeredada.value?.nivelRepresentacion || 'Facultad',
    nombreInstitucionExterna: solicitud.nombreInstitucionExterna || fraternidadHeredada.value?.institucionExterna?.nombre || '',
    idCategoria: solicitud.categoria?.idCategoria || fraternidadHeredada.value?.categoria?.idCategoria || null,
    idTipoDanza: solicitud.tipoDanza?.idTipoDanza || null,
    idFacultad: solicitud.facultad?.idFacultad || fraternidadHeredada.value?.facultad?.idFacultad || null,
    idCarrera: solicitud.carrera?.idCarrera || fraternidadHeredada.value?.carrera?.idCarrera || null,
    ...hidratarPersonasDesdeSolicitud(solicitud),
  }
  ciComplementoActivo.value = hidratarComplementoActivoDesdeSolicitud(solicitud)
  documentosExistentes.value = {
    ...hidratarArchivosPersonaDesdeSolicitud(solicitud),
  }
  camposEditados.value = new Set()
  PERSONAS_DIRECTIVA.forEach(({ prefix, label }) => onCiChange(`${prefix}Ci`, label))
  await nextTick()
  hidratandoFormulario.value = false
}

const handleSubmit = async () => {
  if (tieneConflictosCi.value) {
    Swal.fire('CI no válido', 'Hay carnets de identidad que ya pertenecen a la directiva de otra fraternidad o están repetidos en el formulario.', 'warning')
    return
  }

  const cisPendientes = Object.values(ciValidacion.value).some((v) => v?.estado === 'checking')
  if (cisPendientes) {
    Swal.fire('Espere un momento', 'Aún se están verificando algunos carnets de identidad.', 'info')
    return
  }

  // Validate step 4 documents — solo los obligatorios
  const missingDocs = documentFieldsObligatorios.value.filter((d) => !tieneArchivo(d.key))
  if (missingDocs.length > 0) {
    Swal.fire(
      'Atención',
      `Debes subir los documentos obligatorios: ${missingDocs.map((d) => d.label).join(', ')}.`,
      'warning',
    )
    return
  }

  const camposMayusculas = [
    'nombreFraternidad', 'nombreInstitucionExterna',
    ...CAMPOS_NOMBRE_PERSONA,
  ]
  const payload = limpiarComplementosInactivos({ ...form.value }, ciComplementoActivo.value)
  camposMayusculas.forEach((campo) => {
    if (typeof payload[campo] === 'string') {
      payload[campo] = payload[campo].trim().toUpperCase()
    }
  })

  submitting.value = true
  try {
    const formData = new FormData()
    formData.append('data', JSON.stringify(payload))
    if (solicitudEditandoId.value) formData.append('idSolicitud', String(solicitudEditandoId.value))
    
    // Append files
    Object.keys(files.value).forEach(key => {
      if (files.value[key]) formData.append(key, files.value[key])
    })

    await api.post('/inscripciones', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })

    await Swal.fire({
      title: '¡Solicitud Enviada!',
      text: 'Tu inscripción ha sido recibida y está en proceso de revisión por La Comisión.',
      icon: 'success',
      confirmButtonColor: '#003399'
    })

    window.location.reload() // Or redirect to a status page
  } catch (err) {
    console.error('Error enviando inscripcion:', err)
    Swal.fire('Error', err.response?.data?.message || 'No se pudo enviar la solicitud.', 'error')
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
.animate-in {
  animation: fadeIn 0.5s ease-out forwards;
}

.form-inscripcion {
  color: #1e293b;
}

.form-inscripcion :deep(.label-xs),
.form-inscripcion :deep(label) {
  color: #475569;
}

.form-inscripcion :deep(h3),
.form-inscripcion :deep(h4) {
  color: #0f172a;
}

.form-inscripcion :deep(.text-step-subtitle) {
  color: #64748b;
}

.form-inscripcion :deep(.form-input) {
  color: #0f172a;
  font-weight: 600;
}

.form-inscripcion :deep(.form-input:disabled) {
  color: #334155;
  opacity: 1;
}

.form-inscripcion :deep(.campo-aprobado) {
  background-color: rgb(236 253 245 / 0.95);
  border-color: rgb(110 231 183);
}

.form-inscripcion :deep(.campo-corregir) {
  background-color: rgb(254 242 242 / 0.95);
  border-color: rgb(252 165 165);
}

.form-inscripcion :deep(.campo-ci-error) {
  border-color: rgb(248 113 113);
  box-shadow: 0 0 0 1px rgb(254 202 202);
}

.form-inscripcion :deep(.campo-ci-ok) {
  border-color: rgb(52 211 153);
}

.doc-revision-aprobado {
  border-color: rgb(110 231 183) !important;
  background-color: rgb(236 253 245 / 0.75);
}

.doc-revision-corregir {
  border-color: rgb(252 165 165) !important;
  background-color: rgb(254 242 242 / 0.75);
}
</style>
