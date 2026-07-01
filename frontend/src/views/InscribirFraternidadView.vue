<template>
  <div class="max-w-5xl mx-auto p-4 md:p-8">
    <!-- Header -->
    <div class="mb-10 text-left">
      <div class="flex items-center gap-3 mb-2">
        <span class="h-8 w-2 bg-secondary rounded-full"></span>
        <h2 class="text-3xl font-black italic uppercase tracking-tighter text-primary">Inscripción Oficial</h2>
      </div>
      <p class="text-slate-500 font-medium">Completa los 33 puntos requeridos para el registro de tu fraternidad en la gestión {{ siteInfo.anio }}.</p>
    </div>

    <!-- Stepper Navigation -->
    <div class="mb-12 flex items-center justify-between relative max-w-3xl mx-auto">
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
        <span class="text-[9px] font-black uppercase tracking-widest" :class="currentStep === i + 1 ? 'text-primary' : 'text-slate-400'">{{ step.label }}</span>
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
        <!-- PENDIENTE / OBSERVADO -->
        <template v-if="solicitudExistente.estado !== 'APROBADO' && solicitudExistente.estado !== 'RECHAZADO'">
          <div class="size-24 bg-indigo-50 text-primary rounded-full flex items-center justify-center mb-6">
            <span class="material-symbols-outlined text-5xl">mark_email_read</span>
          </div>
          <h3 class="text-2xl font-black text-slate-800 uppercase italic mb-2">Solicitud en Revisión</h3>
          <p class="max-w-md text-slate-500 font-medium mb-4">
            Ya has enviado una solicitud de inscripción para la gestión {{ siteInfo.anio }}. 
            Tu registro se encuentra actualmente en estado: 
            <span class="px-3 py-1 bg-primary/10 text-primary rounded-full font-black text-[10px] uppercase ml-2">
              {{ solicitudExistente.estado }}
            </span>
          </p>
          <p class="max-w-sm text-slate-400 text-xs italic mb-8">
            Por favor, espera a que el comité administrativo revise tu documentación. Serás notificado una vez se tome una decisión.
          </p>
          <div v-if="solicitudExistente.observaciones" class="bg-amber-50 border border-amber-100 p-4 rounded-xl mb-8 max-w-md">
             <p class="text-[10px] font-black uppercase text-amber-600 mb-1">Observaciones del Admin:</p>
             <p class="text-xs text-amber-800 font-medium">{{ solicitudExistente.observaciones }}</p>
          </div>
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
            Tu solicitud para la fraternidad <b class="text-primary">{{ solicitudExistente.nombreFraternidad }}</b> ha sido revisada y aceptada por el comité.
          </p>
          <p class="text-slate-400 text-sm italic max-w-md mx-auto mb-8">
            El registro oficial de tu fraternidad está pendiente de completarse en el sistema. Contacta al comité si este estado persiste.
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
              <div><span class="font-bold text-slate-400 block text-[10px] uppercase">Tipo de Danza</span> <span class="font-medium text-slate-800">{{ solicitudExistente.fraternidadCreada.origenFraternidad }}</span></div>
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
          Por favor, consulta el cronograma oficial o contacta con el comité administrativo.
        </p>
        <button @click="$router.push('/')" class="px-8 py-3 bg-slate-800 text-white rounded-xl font-black uppercase text-xs tracking-widest hover:bg-black transition-all">
          Volver al Inicio
        </button>
      </div>

      <form v-else @submit.prevent="handleSubmit" novalidate class="p-8 md:p-12">

        <div v-if="solicitudEditable" class="mb-8 p-5 rounded-3xl border border-amber-200 bg-amber-50/80">
          <p class="text-[10px] font-black uppercase tracking-[0.2em] text-amber-700 mb-1">Solicitud con correcciones</p>
          <p class="text-sm text-slate-600 font-medium">
            Esta solicitud fue observada o rechazada. Los datos guardados permanecen cargados para que corrijas solo lo marcado por el comité.
          </p>
          <div v-if="correccionesSolicitadas.length" class="mt-4 flex flex-wrap gap-2">
            <span v-for="item in correccionesSolicitadas" :key="item.key" class="px-3 py-1 rounded-full bg-white border border-amber-200 text-amber-800 text-[10px] font-black uppercase tracking-widest">
              {{ item.label }}
            </span>
          </div>
        </div>
        
        <!-- STEP 1: FRATERNIDAD -->
        <div v-if="currentStep === 1" class="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div class="mb-8">
            <h3 class="text-xl font-black italic uppercase text-slate-800">Información de la Fraternidad</h3>
            <p class="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Puntos 1 al 3 del reglamento</p>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
            <!-- 1. Nombre -->
            <div class="md:col-span-2">
              <label class="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-3">1. Nombre de la Fraternidad o Taller Cultural</label>
              <input v-model="form.nombreFraternidad" @input="form.nombreFraternidad = form.nombreFraternidad.toUpperCase()" type="text" required class="form-input" placeholder="Ej. Caporales Ingeniería" :disabled="!puedeEditarNombreFraternidad" />
            </div>

            <!-- 2. Origen / Tipo de Danza -->
            <div>
              <label class="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-3">2. Origen / Tipo de Danza</label>
              <select v-model="form.origenFraternidad" required class="form-input" :disabled="!puedeEditarCampo('origenFraternidad')">
                <option value="Danza Pesada">Danza Pesada</option>
                <option value="Danza Liviana">Danza Liviana</option>
                <option value="Danza Autóctona">Danza Autóctona</option>
                <option value="Taller Cultural">Taller Cultural</option>
                <option value="General">General</option>
              </select>
            </div>

            <!-- 3. Instancia -->
            <div>
              <label class="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-3">3. Instancia a la que representa</label>
              <select v-model="form.instanciaRepresentacion" required class="form-input" :disabled="!puedeEditarCampo('instancia')">
                <option value="Facultad">Facultad</option>
                <option value="Carrera">Carrera</option>
                <option value="UMSA">UMSA (Nivel Central)</option>
                <option value="FEDSIDUMSA">FEDSIDUMSA</option>
                <option value="STUMSA">STUMSA</option>
                <option value="Externo">Externo (Institución)</option>
              </select>
            </div>

            <!-- 4. Categoria -->
            <div>
              <label class="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-3">4. Categoría</label>
              <select v-model="form.idCategoria" required class="form-input" :disabled="!puedeEditarCampo('categoria')">
                <option :value="null" disabled>Selecciona una categoría</option>
                <option v-for="cat in activeCategories" :key="cat.idCategoria" :value="cat.idCategoria">
                  {{ cat.nombre }}
                </option>
              </select>
              <p v-if="form.idCategoria" class="text-[9px] text-indigo-500 font-bold uppercase mt-2">
                Inscripción abierta hasta el {{ formatFecha(getCronograma(form.idCategoria)?.fechaFin) }}
              </p>
            </div>

            <!-- Conditional Selects based on Instancia -->
            <div v-if="form.instanciaRepresentacion === 'Facultad' || form.instanciaRepresentacion === 'Carrera'" class="md:col-span-1">
              <label class="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-3">Seleccionar Facultad</label>
              <select v-model="form.idFacultad" required class="form-input" :disabled="!puedeEditarCampo('facultad')">
                <option v-for="fac in facultades" :key="fac.idFacultad" :value="fac.idFacultad">{{ fac.nombre }}</option>
              </select>
            </div>

            <div v-if="form.instanciaRepresentacion === 'Carrera'" class="md:col-span-1">
              <label class="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-3">Seleccionar Carrera</label>
              <select v-model="form.idCarrera" required class="form-input" :disabled="!puedeEditarCampo('carrera')">
                <option v-for="car in filteredCarreras" :key="car.idCarrera" :value="car.idCarrera">{{ car.nombre }}</option>
              </select>
            </div>

            <div v-if="form.instanciaRepresentacion === 'Externo'" class="md:col-span-1">
              <label class="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-3">Nombre de la Institución Externa</label>
              <input v-model="form.nombreInstitucionExterna" type="text" required class="form-input" placeholder="Escriba el nombre de la institución" :disabled="!puedeEditarCampo('institucionExterna')" />
            </div>
          </div>
        </div>

        <!-- STEP 2: DIRECTIVA (PRESIDENTE, VICE, SEC GEN, HACIENDA) -->
        <div v-if="currentStep === 2" class="animate-in fade-in slide-in-from-bottom-4 duration-500">
           <div class="mb-8">
            <h3 class="text-xl font-black italic uppercase text-slate-800">Cargos de la Directiva (I)</h3>
            <p class="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Puntos 4 al 13 del reglamento</p>
          </div>

          <div class="space-y-10">
            <!-- PRESIDENTE -->
            <div class="bg-slate-50 p-6 rounded-3xl border border-slate-100">
               <div class="flex items-center gap-2 mb-6">
                 <span class="material-symbols-outlined text-primary">person</span>
                 <p class="text-xs font-black uppercase tracking-widest">Presidente de la Fraternidad</p>
               </div>
               <div class="grid grid-cols-1 md:grid-cols-12 gap-6">
                 <div class="md:col-span-6">
                    <label class="label-xs">4. Nombre Completo</label>
                    <input v-model="form.presiNombre" @input="form.presiNombre = form.presiNombre.toUpperCase()" type="text" required class="form-input" placeholder="NOMBRES Y APELLIDOS COMPLETOS" :disabled="!puedeEditarCampo('presiNombre')" />
                 </div>
                 <div class="md:col-span-3">
                    <label class="label-xs">5. Carnet CI</label>
                    <input v-model="form.presiCi" @keypress="onlyNumbers" type="text" required class="form-input" placeholder="CI" :disabled="!puedeEditarCampo('presiCi')" />
                 </div>
                 <div class="md:col-span-3">
                    <label class="label-xs">6. Celular</label>
                    <input v-model="form.presiCelular" @keypress="onlyNumbers" type="text" required class="form-input" placeholder="Celular" :disabled="!puedeEditarCampo('presiCelular')" />
                 </div>
               </div>
            </div>

            <!-- VICEPRESIDENTE -->
            <div class="bg-slate-50 p-6 rounded-3xl border border-slate-100">
               <div class="flex items-center gap-2 mb-6">
                 <span class="material-symbols-outlined text-slate-400">group</span>
                 <p class="text-xs font-black uppercase tracking-widest">Vicepresidente</p>
               </div>
               <div class="grid grid-cols-1 md:grid-cols-12 gap-6">
                 <div class="md:col-span-6">
                    <label class="label-xs">7. Nombre Completo</label>
                    <input v-model="form.viceNombre" @input="form.viceNombre = form.viceNombre.toUpperCase()" type="text" required class="form-input" placeholder="NOMBRES Y APELLIDOS COMPLETOS" :disabled="!puedeEditarCampo('viceNombre')" />
                 </div>
                 <div class="md:col-span-3">
                    <label class="label-xs">8. Carnet CI</label>
                    <input v-model="form.viceCi" @keypress="onlyNumbers" type="text" required class="form-input" placeholder="CI" :disabled="!puedeEditarCampo('viceCi')" />
                 </div>
                 <div class="md:col-span-3">
                    <label class="label-xs">9. Celular</label>
                    <input v-model="form.viceCelular" @keypress="onlyNumbers" type="text" required class="form-input" placeholder="Celular" :disabled="!puedeEditarCampo('viceCelular')" />
                 </div>
               </div>
            </div>

            <!-- SECRETARIOS -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
               <div class="p-6 rounded-3xl border border-slate-100">
                  <p class="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">Secretario General</p>
                  <div class="grid grid-cols-1 md:grid-cols-12 gap-4">
                    <div class="md:col-span-8">
                       <input v-model="form.secGenNombre" @input="form.secGenNombre = form.secGenNombre.toUpperCase()" placeholder="10. Nombre Completo" type="text" required class="form-input" :disabled="!puedeEditarCampo('secGenNombre')" />
                    </div>
                    <div class="md:col-span-4">
                       <input v-model="form.secGenCi" @keypress="onlyNumbers" placeholder="11. CI" type="text" required class="form-input" :disabled="!puedeEditarCampo('secGenCi')" />
                    </div>
                  </div>
               </div>
               <div class="p-6 rounded-3xl border border-slate-100">
                  <p class="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">Secretario de Hacienda</p>
                  <div class="grid grid-cols-1 md:grid-cols-12 gap-4">
                    <div class="md:col-span-8">
                       <input v-model="form.secHaciNombre" @input="form.secHaciNombre = form.secHaciNombre.toUpperCase()" placeholder="12. Nombre Completo" type="text" required class="form-input" :disabled="!puedeEditarCampo('secHaciNombre')" />
                    </div>
                    <div class="md:col-span-4">
                       <input v-model="form.secHaciCi" @keypress="onlyNumbers" placeholder="13. CI" type="text" required class="form-input" :disabled="!puedeEditarCampo('secHaciCi')" />
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
            <p class="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Puntos 14 al 28 del reglamento</p>
          </div>

          <div class="space-y-8">
            <div class="space-y-6">
              <!-- Sec Actas -->
               <div class="p-6 rounded-3xl border border-slate-100">
                  <p class="label-xs mb-3">Secretario de Actas (14-15)</p>
                  <div class="grid grid-cols-1 md:grid-cols-12 gap-4">
                    <div class="md:col-span-9">
                      <input v-model="form.secActasNombre" @input="form.secActasNombre = form.secActasNombre.toUpperCase()" placeholder="14. Nombre Completo" type="text" class="form-input" :disabled="!puedeEditarCampo('secActasNombre')" />
                    </div>
                    <div class="md:col-span-3">
                      <input v-model="form.secActasCi" @keypress="onlyNumbers" placeholder="15. CI" type="text" class="form-input" :disabled="!puedeEditarCampo('secActasCi')" />
                    </div>
                  </div>
               </div>
               <!-- Sec Prensa -->
               <div class="p-6 rounded-3xl border border-slate-100">
                  <p class="label-xs mb-3">Secretario de Prensa y Propaganda (16-17)</p>
                  <div class="grid grid-cols-1 md:grid-cols-12 gap-4">
                    <div class="md:col-span-9">
                      <input v-model="form.secPrensaNombre" @input="form.secPrensaNombre = form.secPrensaNombre.toUpperCase()" placeholder="16. Nombre Completo" type="text" class="form-input" :disabled="!puedeEditarCampo('secPrensaNombre')" />
                    </div>
                    <div class="md:col-span-3">
                      <input v-model="form.secPrensaCi" @keypress="onlyNumbers" placeholder="17. CI" type="text" class="form-input" :disabled="!puedeEditarCampo('secPrensaCi')" />
                    </div>
                  </div>
               </div>
               <!-- Vocal -->
               <div class="p-6 rounded-3xl border border-slate-100">
                  <p class="label-xs mb-3">Vocal (18-19)</p>
                  <div class="grid grid-cols-1 md:grid-cols-12 gap-4">
                    <div class="md:col-span-9">
                      <input v-model="form.vocalNombre" @input="form.vocalNombre = form.vocalNombre.toUpperCase()" placeholder="18. Nombre Completo" type="text" class="form-input" :disabled="!puedeEditarCampo('vocalNombre')" />
                    </div>
                    <div class="md:col-span-3">
                      <input v-model="form.vocalCi" @keypress="onlyNumbers" placeholder="19. CI" type="text" class="form-input" :disabled="!puedeEditarCampo('vocalCi')" />
                    </div>
                  </div>
               </div>
            </div>

            <!-- DELEGADOS (CON CELULAR) -->
             <div class="space-y-6">
                <!-- Co-gobierno -->
                <div class="bg-indigo-50/50 p-6 rounded-3xl border border-indigo-100/50">
                  <p class="text-[10px] font-black uppercase text-indigo-800 mb-4">Delegado a Co-Gobierno (20-22)</p>
                  <div class="grid grid-cols-1 md:grid-cols-12 gap-4">
                    <div class="md:col-span-6">
                      <input v-model="form.delCogobNombre" @input="form.delCogobNombre = form.delCogobNombre.toUpperCase()" placeholder="20. Nombre Completo" type="text" class="form-input" :disabled="!puedeEditarCampo('delCogobNombre')" />
                    </div>
                    <div class="md:col-span-3">
                      <input v-model="form.delCogobCi" @keypress="onlyNumbers" placeholder="21. CI" type="text" class="form-input" :disabled="!puedeEditarCampo('delCogobCi')" />
                    </div>
                    <div class="md:col-span-3">
                      <input v-model="form.delCogobCelular" @keypress="onlyNumbers" placeholder="22. Celular" type="text" class="form-input" :disabled="!puedeEditarCampo('delCogobCelular')" />
                    </div>
                  </div>
                </div>
                <!-- Titular -->
                <div class="bg-slate-50 p-6 rounded-3xl border border-slate-100">
                  <p class="text-[10px] font-black uppercase text-slate-800 mb-4">Delegado Titular (23-25)</p>
                  <div class="grid grid-cols-1 md:grid-cols-12 gap-4">
                    <div class="md:col-span-6">
                      <input v-model="form.delTitularNombre" @input="form.delTitularNombre = form.delTitularNombre.toUpperCase()" placeholder="23. Nombre Completo" type="text" class="form-input" :disabled="!puedeEditarCampo('delTitularNombre')" />
                    </div>
                    <div class="md:col-span-3">
                      <input v-model="form.delTitularCi" @keypress="onlyNumbers" placeholder="24. CI" type="text" class="form-input" :disabled="!puedeEditarCampo('delTitularCi')" />
                    </div>
                    <div class="md:col-span-3">
                      <input v-model="form.delTitularCelular" @keypress="onlyNumbers" placeholder="25. Celular" type="text" class="form-input" :disabled="!puedeEditarCampo('delTitularCelular')" />
                    </div>
                  </div>
                </div>
                <!-- Suplente -->
                <div class="bg-slate-50 p-6 rounded-3xl border border-slate-100">
                  <p class="text-[10px] font-black uppercase text-slate-800 mb-4">Delegado Suplente (26-28)</p>
                  <div class="grid grid-cols-1 md:grid-cols-12 gap-4">
                    <div class="md:col-span-6">
                      <input v-model="form.delSuplenteNombre" @input="form.delSuplenteNombre = form.delSuplenteNombre.toUpperCase()" placeholder="26. Nombre Completo" type="text" class="form-input" :disabled="!puedeEditarCampo('delSuplenteNombre')" />
                    </div>
                    <div class="md:col-span-3">
                      <input v-model="form.delSuplenteCi" @keypress="onlyNumbers" placeholder="27. CI" type="text" class="form-input" :disabled="!puedeEditarCampo('delSuplenteCi')" />
                    </div>
                    <div class="md:col-span-3">
                      <input v-model="form.delSuplenteCelular" @keypress="onlyNumbers" placeholder="28. Celular" type="text" class="form-input" :disabled="!puedeEditarCampo('delSuplenteCelular')" />
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
            <p class="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Puntos 29 al 33 del reglamento</p>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
             <div v-for="doc in documentFields" :key="doc.key" class="p-6 rounded-3xl border-2 border-dashed border-slate-100 hover:border-primary/30 transition-colors group">
                <div class="flex items-center justify-between mb-4">
                   <div class="flex items-center gap-2">
                      <span class="material-symbols-outlined text-slate-400 group-hover:text-primary">{{ doc.icon }}</span>
                      <p class="text-[10px] font-black uppercase text-slate-600">{{ doc.point }}. {{ doc.label }}</p>
                   </div>
                   <span v-if="files[doc.key]" class="material-symbols-outlined text-green-500">check_circle</span>
                </div>
                
                <label class="cursor-pointer block">
                  <div class="py-4 bg-slate-50 rounded-xl flex items-center justify-center gap-2 text-xs font-bold text-slate-400 group-hover:text-primary transition-colors">
                     <span class="material-symbols-outlined text-sm">upload_file</span>
                     {{ files[doc.key] ? files[doc.key].name : 'Elegir archivo PDF/Imagen' }}
                  </div>
                  <input type="file" @change="handleFile($event, doc.key)" class="hidden" accept=".pdf,image/*" :disabled="!puedeEditarCampo(doc.key)" />
                </label>
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
            type="button" @click="currentStep--"
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
            class="px-12 py-5 bg-primary text-white rounded-2xl text-sm font-black uppercase tracking-[0.2em] shadow-2xl shadow-primary/30 hover:scale-[1.05] active:scale-[0.95] transition-all flex items-center gap-3 disabled:opacity-50"
           >
             <span v-if="submitting" class="material-symbols-outlined animate-spin">progress_activity</span>
             <span v-else class="material-symbols-outlined">send</span>
             {{ submitting ? 'ENVIANDO...' : 'FINALIZAR INSCRIPCIÓN' }}
           </button>
        </div>

      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch, nextTick } from 'vue'
import { useAuthStore } from '../store/auth'
import api from '../services/api'
import Swal from 'sweetalert2'

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

const solicitudEditable = computed(() => {
  return solicitudExistente.value?.estado === 'RECHAZADO'
})

const steps = [
  { label: 'Fraternidad' },
  { label: 'Directiva I' },
  { label: 'Directiva II' },
  { label: 'Documentos' }
]

const form = ref({
  nombreFraternidad: '',
  origenFraternidad: 'Danza Pesada',
  instanciaRepresentacion: 'Facultad',
  nombreInstitucionExterna: '',
  idCategoria: null,
  idFacultad: null,
  idCarrera: null,
  // Directiva
  presiNombre: '', presiCi: '', presiCelular: '',
  viceNombre: '', viceCi: '', viceCelular: '',
  secGenNombre: '', secGenCi: '',
  secHaciNombre: '', secHaciCi: '',
  secActasNombre: '', secActasCi: '',
  secPrensaNombre: '', secPrensaCi: '',
  vocalNombre: '', vocalCi: '',
  delCogobNombre: '', delCogobCi: '', delCogobCelular: '',
  delTitularNombre: '', delTitularCi: '', delTitularCelular: '',
  delSuplenteNombre: '', delSuplenteCi: '', delSuplenteCelular: ''
})

const files = ref({
  ciMatriculaPreViceDel: null,
  ciMatriculaSecVocDel: null,
  cartaCompromiso: null,
  resolucion: null,
  actaDirectiva: null
})

const documentFields = [
  { key: 'ciMatriculaPreViceDel', label: 'CI y Matrícula: Presidente, Vicepresidente, Delegados (Titular y Suplente)', point: 29, icon: 'badge' },
  { key: 'ciMatriculaSecVocDel', label: 'CI y Matrícula: Secretarios, Vocal y Del. Cogobierno', point: 30, icon: 'receipt_long' },
  { key: 'cartaCompromiso', label: 'Carta de Compromiso Firmada', point: 31, icon: 'contract' },
  { key: 'resolucion', label: 'Resolución HCU/HCF/HCC', point: 32, icon: 'gavel' },
  { key: 'actaDirectiva', label: 'Acta Conformación Directiva', point: 33, icon: 'assignment' }
]

const MAP_ADMIN_KEY_TO_DELEGADO = {
  'Presidente-nombre': 'presiNombre',
  'Presidente-ci': 'presiCi',
  'Presidente-celular': 'presiCelular',
  
  'Vicepresidente-nombre': 'viceNombre',
  'Vicepresidente-ci': 'viceCi',
  'Vicepresidente-celular': 'viceCelular',
  
  'Secretario General-nombre': 'secGenNombre',
  'Secretario General-ci': 'secGenCi',
  
  'Secretario de Hacienda-nombre': 'secHaciNombre',
  'Secretario de Hacienda-ci': 'secHaciCi',
  
  'Secretario de Actas-nombre': 'secActasNombre',
  'Secretario de Actas-ci': 'secActasCi',
  
  'Secretario de Prensa-nombre': 'secPrensaNombre',
  'Secretario de Prensa-ci': 'secPrensaCi',
  
  'Vocal-nombre': 'vocalNombre',
  'Vocal-ci': 'vocalCi',
  
  'Delegado a Co-Gobierno-nombre': 'delCogobNombre',
  'Delegado a Co-Gobierno-ci': 'delCogobCi',
  'Delegado a Co-Gobierno-celular': 'delCogobCelular',
  
  'Delegado Titular-nombre': 'delTitularNombre',
  'Delegado Titular-ci': 'delTitularCi',
  'Delegado Titular-celular': 'delTitularCelular',
  
  'Delegado Suplente-nombre': 'delSuplenteNombre',
  'Delegado Suplente-ci': 'delSuplenteCi',
  'Delegado Suplente-celular': 'delSuplenteCelular',
}

const correccionesSolicitadas = computed(() => {
  let checklist = solicitudExistente.value?.revisionChecklist || {}
  // Algunos backends devuelven jsonb como string; parsear si es necesario
  if (typeof checklist === 'string') {
    try { checklist = JSON.parse(checklist) } catch { checklist = {} }
  }
  return Object.entries(checklist)
    .filter(([, item]) => item?.estado === 'X')
    .map(([key, item]) => {
      const normalizedKey = MAP_ADMIN_KEY_TO_DELEGADO[key] || key
      return { key: normalizedKey, label: item?.label || key }
    })
})

const isOriginalValueEmpty = (key) => {
  if (!solicitudExistente.value) return true
  
  let realKey = key
  if (key === 'idFacultad') realKey = 'facultad'
  if (key === 'idCarrera') realKey = 'carrera'
  if (key === 'idCategoria') realKey = 'categoria'
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
  // Si la solicitud NO está en modo edición (RECHAZADO), el formulario está libre
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
const facultades = ref([])
const carreras = ref([])

onMounted(async () => {
  loadingForm.value = true
  try {
    const [cfg, cats, facs, cars] = await Promise.all([
      api.get('/evaluaciones/gestion-activa'),
      api.get('/categorias'),
      api.get('/organizacion/facultades'),
      api.get('/organizacion/carreras')
    ])
    siteInfo.value = cfg.data
    categorias.value = cats.data
    facultades.value = facs.data
    carreras.value = cars.data

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
        if (detalleSol.estado === 'RECHAZADO') {
          hidratarFormularioDesdeSolicitud(detalleSol)
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

const validateStep = (step) => {
  const f = form.value
  if (step === 1) {
    if (!f.nombreFraternidad || !f.instanciaRepresentacion || !f.idCategoria || !f.origenFraternidad) return false
    if (f.instanciaRepresentacion === 'Facultad' && !f.idFacultad) return false
    if (f.instanciaRepresentacion === 'Carrera' && (!f.idFacultad || !f.idCarrera)) return false
    if (f.instanciaRepresentacion === 'Externo' && !f.nombreInstitucionExterna) return false
    return true
  }
  // Se quitó la obligatoriedad de los campos en los pasos 2 y 3 según lo solicitado
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
  if (file) files.value[key] = file
}

const hidratarFormularioDesdeFraternidad = async (fraternidad) => {
  if (!fraternidad) return
  hidratandoFormulario.value = true
  form.value.nombreFraternidad = fraternidad.nombre || form.value.nombreFraternidad
  form.value.origenFraternidad = fraternidad.origenFraternidad || form.value.origenFraternidad || 'Danza Pesada'
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
    origenFraternidad: solicitud.origenFraternidad || fraternidadHeredada.value?.origenFraternidad || 'Danza Pesada',
    instanciaRepresentacion: solicitud.instanciaRepresentacion || fraternidadHeredada.value?.nivelRepresentacion || 'Facultad',
    nombreInstitucionExterna: solicitud.nombreInstitucionExterna || fraternidadHeredada.value?.institucionExterna?.nombre || '',
    idCategoria: solicitud.categoria?.idCategoria || fraternidadHeredada.value?.categoria?.idCategoria || null,
    idFacultad: solicitud.facultad?.idFacultad || fraternidadHeredada.value?.facultad?.idFacultad || null,
    idCarrera: solicitud.carrera?.idCarrera || fraternidadHeredada.value?.carrera?.idCarrera || null,
    presiNombre: solicitud.presiNombre || '', presiCi: solicitud.presiCi || '', presiCelular: solicitud.presiCelular || '',
    viceNombre: solicitud.viceNombre || '', viceCi: solicitud.viceCi || '', viceCelular: solicitud.viceCelular || '',
    secGenNombre: solicitud.secGenNombre || '', secGenCi: solicitud.secGenCi || '',
    secHaciNombre: solicitud.secHaciNombre || '', secHaciCi: solicitud.secHaciCi || '',
    secActasNombre: solicitud.secActasNombre || '', secActasCi: solicitud.secActasCi || '',
    secPrensaNombre: solicitud.secPrensaNombre || '', secPrensaCi: solicitud.secPrensaCi || '',
    vocalNombre: solicitud.vocalNombre || '', vocalCi: solicitud.vocalCi || '',
    delCogobNombre: solicitud.delCogobNombre || '', delCogobCi: solicitud.delCogobCi || '', delCogobCelular: solicitud.delCogobCelular || '',
    delTitularNombre: solicitud.delTitularNombre || '', delTitularCi: solicitud.delTitularCi || '', delTitularCelular: solicitud.delTitularCelular || '',
    delSuplenteNombre: solicitud.delSuplenteNombre || '', delSuplenteCi: solicitud.delSuplenteCi || '', delSuplenteCelular: solicitud.delSuplenteCelular || ''
  }
  documentosExistentes.value = {
    ciMatriculaPreViceDel: solicitud.urlCiMatriculaPreViceDel || '',
    ciMatriculaSecVocDel: solicitud.urlCiMatriculaSecVocDel || '',
    cartaCompromiso: solicitud.urlCartaCompromiso || '',
    resolucion: solicitud.urlResolucion || '',
    actaDirectiva: solicitud.urlActaDirectiva || ''
  }
  await nextTick()
  hidratandoFormulario.value = false
}

const handleSubmit = async () => {
  // Validate step 4 documents
  const missingDocs = documentFields.filter(d => !files.value[d.key] && !documentosExistentes.value[d.key])
  if (missingDocs.length > 0) {
    Swal.fire('Atención', 'Debes subir todos los documentos requeridos.', 'warning')
    return
  }

  submitting.value = true
  try {
    const formData = new FormData()
    formData.append('data', JSON.stringify(form.value))
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
      text: 'Tu inscripción ha sido recibida y está en proceso de revisión por el comité administrativo.',
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
</style>
