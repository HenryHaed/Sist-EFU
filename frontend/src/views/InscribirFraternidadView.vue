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
      
      <form @submit.prevent="handleSubmit" class="p-8 md:p-12">
        
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
              <input v-model="form.nombreFraternidad" type="text" required class="form-input" placeholder="Ej. Caporales Ingeniería" />
            </div>

            <!-- 2. Instancia -->
            <div>
              <label class="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-3">2. Instancia a la que representa</label>
              <select v-model="form.instanciaRepresentacion" required class="form-input">
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
              <select v-model="form.idCategoria" required class="form-input">
                <option v-for="cat in categorias" :key="cat.idCategoria" :value="cat.idCategoria">{{ cat.nombre }}</option>
              </select>
            </div>

            <!-- Conditional Selects based on Instancia -->
            <div v-if="form.instanciaRepresentacion === 'Facultad' || form.instanciaRepresentacion === 'Carrera'" class="md:col-span-1">
              <label class="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-3">Seleccionar Facultad</label>
              <select v-model="form.idFacultad" required class="form-input">
                <option v-for="fac in facultades" :key="fac.idFacultad" :value="fac.idFacultad">{{ fac.nombre }}</option>
              </select>
            </div>

            <div v-if="form.instanciaRepresentacion === 'Carrera'" class="md:col-span-1">
              <label class="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-3">Seleccionar Carrera</label>
              <select v-model="form.idCarrera" required class="form-input">
                <option v-for="car in filteredCarreras" :key="car.idCarrera" :value="car.idCarrera">{{ car.nombre }}</option>
              </select>
            </div>

            <div v-if="form.instanciaRepresentacion === 'Externo'" class="md:col-span-1">
              <label class="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-3">Nombre de la Institución Externa</label>
              <input v-model="form.nombreInstitucionExterna" type="text" required class="form-input" placeholder="Escriba el nombre de la institución" />
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
                    <input v-model="form.presiNombre" type="text" required class="form-input" placeholder="Nombres y Apellidos Completos" />
                 </div>
                 <div class="md:col-span-3">
                    <label class="label-xs">5. Carnet CI</label>
                    <input v-model="form.presiCi" type="text" required class="form-input" placeholder="CI" />
                 </div>
                 <div class="md:col-span-3">
                    <label class="label-xs">6. Celular</label>
                    <input v-model="form.presiCelular" type="text" required class="form-input" placeholder="Celular" />
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
                    <input v-model="form.viceNombre" type="text" required class="form-input" placeholder="Nombres y Apellidos Completos" />
                 </div>
                 <div class="md:col-span-3">
                    <label class="label-xs">8. Carnet CI</label>
                    <input v-model="form.viceCi" type="text" required class="form-input" placeholder="CI" />
                 </div>
                 <div class="md:col-span-3">
                    <label class="label-xs">9. Celular</label>
                    <input v-model="form.viceCelular" type="text" required class="form-input" placeholder="Celular" />
                 </div>
               </div>
            </div>

            <!-- SECRETARIOS -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
               <div class="p-6 rounded-3xl border border-slate-100">
                  <p class="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">Secretario General</p>
                  <div class="grid grid-cols-1 md:grid-cols-12 gap-4">
                    <div class="md:col-span-8">
                       <input v-model="form.secGenNombre" placeholder="10. Nombre Completo" type="text" required class="form-input" />
                    </div>
                    <div class="md:col-span-4">
                       <input v-model="form.secGenCi" placeholder="11. CI" type="text" required class="form-input" />
                    </div>
                  </div>
               </div>
               <div class="p-6 rounded-3xl border border-slate-100">
                  <p class="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">Secretario de Hacienda</p>
                  <div class="grid grid-cols-1 md:grid-cols-12 gap-4">
                    <div class="md:col-span-8">
                       <input v-model="form.secHaciNombre" placeholder="12. Nombre Completo" type="text" required class="form-input" />
                    </div>
                    <div class="md:col-span-4">
                       <input v-model="form.secHaciCi" placeholder="13. CI" type="text" required class="form-input" />
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
                      <input v-model="form.secActasNombre" placeholder="14. Nombre Completo" type="text" class="form-input" />
                    </div>
                    <div class="md:col-span-3">
                      <input v-model="form.secActasCi" placeholder="15. CI" type="text" class="form-input" />
                    </div>
                  </div>
               </div>
               <!-- Sec Prensa -->
               <div class="p-6 rounded-3xl border border-slate-100">
                  <p class="label-xs mb-3">Secretario de Prensa y Propaganda (16-17)</p>
                  <div class="grid grid-cols-1 md:grid-cols-12 gap-4">
                    <div class="md:col-span-9">
                      <input v-model="form.secPrensaNombre" placeholder="16. Nombre Completo" type="text" class="form-input" />
                    </div>
                    <div class="md:col-span-3">
                      <input v-model="form.secPrensaCi" placeholder="17. CI" type="text" class="form-input" />
                    </div>
                  </div>
               </div>
               <!-- Vocal -->
               <div class="p-6 rounded-3xl border border-slate-100">
                  <p class="label-xs mb-3">Vocal (18-19)</p>
                  <div class="grid grid-cols-1 md:grid-cols-12 gap-4">
                    <div class="md:col-span-9">
                      <input v-model="form.vocalNombre" placeholder="18. Nombre Completo" type="text" class="form-input" />
                    </div>
                    <div class="md:col-span-3">
                      <input v-model="form.vocalCi" placeholder="19. CI" type="text" class="form-input" />
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
                      <input v-model="form.delCogobNombre" placeholder="20. Nombre Completo" type="text" class="form-input" />
                    </div>
                    <div class="md:col-span-3">
                      <input v-model="form.delCogobCi" placeholder="21. CI" type="text" class="form-input" />
                    </div>
                    <div class="md:col-span-3">
                      <input v-model="form.delCogobCelular" placeholder="22. Celular" type="text" class="form-input" />
                    </div>
                  </div>
                </div>
                <!-- Titular -->
                <div class="bg-slate-50 p-6 rounded-3xl border border-slate-100">
                  <p class="text-[10px] font-black uppercase text-slate-800 mb-4">Delegado Titular (23-25)</p>
                  <div class="grid grid-cols-1 md:grid-cols-12 gap-4">
                    <div class="md:col-span-6">
                      <input v-model="form.delTitularNombre" placeholder="23. Nombre Completo" type="text" class="form-input" />
                    </div>
                    <div class="md:col-span-3">
                      <input v-model="form.delTitularCi" placeholder="24. CI" type="text" class="form-input" />
                    </div>
                    <div class="md:col-span-3">
                      <input v-model="form.delTitularCelular" placeholder="25. Celular" type="text" class="form-input" />
                    </div>
                  </div>
                </div>
                <!-- Suplente -->
                <div class="bg-slate-50 p-6 rounded-3xl border border-slate-100">
                  <p class="text-[10px] font-black uppercase text-slate-800 mb-4">Delegado Suplente (26-28)</p>
                  <div class="grid grid-cols-1 md:grid-cols-12 gap-4">
                    <div class="md:col-span-6">
                      <input v-model="form.delSuplenteNombre" placeholder="26. Nombre Completo" type="text" class="form-input" />
                    </div>
                    <div class="md:col-span-3">
                      <input v-model="form.delSuplenteCi" placeholder="27. CI" type="text" class="form-input" />
                    </div>
                    <div class="md:col-span-3">
                      <input v-model="form.delSuplenteCelular" placeholder="28. Celular" type="text" class="form-input" />
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
                  <input type="file" @change="handleFile($event, doc.key)" class="hidden" accept=".pdf,image/*" />
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
            type="button" @click="currentStep++"
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
import { ref, onMounted, computed, watch } from 'vue'
import api from '../services/api'
import Swal from 'sweetalert2'

const currentStep = ref(1)
const submitting = ref(false)
const siteInfo = ref({})

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
  ciRepresentante: null,
  matriculaBoleta: null,
  cartaCompromiso: null,
  resolucion: null,
  actaDirectiva: null
})

const documentFields = [
  { key: 'ciRepresentante', label: 'CI Representante (Anverso/Reverso)', point: 29, icon: 'badge' },
  { key: 'matriculaBoleta', label: 'Matrícula o Boleta de Pago', point: 30, icon: 'receipt_long' },
  { key: 'cartaCompromiso', label: 'Carta de Compromiso Firmada', point: 31, icon: 'contract' },
  { key: 'resolucion', label: 'Resolución HCU/HCF/HCC', point: 32, icon: 'gavel' },
  { key: 'actaDirectiva', label: 'Acta Conformación Directiva', point: 33, icon: 'assignment' }
]

// Data for selects
const categorias = ref([])
const facultades = ref([])
const carreras = ref([])

onMounted(async () => {
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
  } catch (err) {
    console.error('Error loading form data:', err)
  }
})

// Reset conditional fields on change
watch(() => form.value.instanciaRepresentacion, () => {
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

const handleSubmit = async () => {
  // Validate step 4 documents
  const missingDocs = documentFields.filter(d => !files.value[d.key])
  if (missingDocs.length > 0) {
    Swal.fire('Atención', 'Debes subir todos los documentos requeridos.', 'warning')
    return
  }

  submitting.value = true
  try {
    const formData = new FormData()
    formData.append('data', JSON.stringify(form.value))
    
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
