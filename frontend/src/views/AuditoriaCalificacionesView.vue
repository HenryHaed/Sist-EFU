<template>
  <div class="w-full space-y-6">
    <div class="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
      <div>
        <p class="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Desglose de notas</p>
        <p class="text-sm text-slate-600 font-medium max-w-2xl">
          Quién calificó, con qué nota y el total oficial (promedio de jurados), igual que en el panel de estadísticas.
        </p>
      </div>
      <div class="flex flex-col sm:flex-row gap-3">
        <select v-model="idGestion" class="form-input !py-2.5 !text-sm min-w-[160px]" @change="cargar">
          <option v-for="g in gestiones" :key="g.idGestion" :value="g.idGestion">
            Gestión {{ g.anio }}{{ g.activa ? ' (activa)' : '' }}
          </option>
        </select>
        <div class="inline-flex rounded-xl border border-slate-200 overflow-hidden bg-white">
          <button
            type="button"
            @click="ambito = 'EFU'; cargar()"
            class="px-4 py-2.5 text-[10px] font-black uppercase tracking-widest transition-colors"
            :class="ambito === 'EFU' ? 'bg-primary text-white' : 'text-slate-500 hover:bg-slate-50'"
          >
            Fraternidades
          </button>
          <button
            type="button"
            @click="ambito = 'EXTERNO'; cargar()"
            class="px-4 py-2.5 text-[10px] font-black uppercase tracking-widest transition-colors border-l border-slate-200"
            :class="ambito === 'EXTERNO' ? 'bg-primary text-white' : 'text-slate-500 hover:bg-slate-50'"
          >
            Concursos
          </button>
        </div>
        <button
          type="button"
          @click="cargar"
          class="px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-[10px] font-black uppercase tracking-widest text-slate-600 hover:border-primary hover:text-primary flex items-center gap-2"
        >
          <span class="material-symbols-outlined text-base" :class="{ 'animate-spin': loading }">sync</span>
          Actualizar
        </button>
      </div>
    </div>

    <div v-if="data?.formula" class="bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-[11px] text-slate-500 font-medium">
      <span class="font-black uppercase tracking-widest text-slate-400 mr-2">Fórmula</span>
      {{ data.formula }}
      <span v-if="data.gestion" class="ml-2 text-primary font-bold">· Gestión {{ data.gestion.anio }}</span>
    </div>

    <div v-if="loading" class="py-20 flex flex-col items-center text-slate-400">
      <span class="material-symbols-outlined text-4xl animate-spin mb-3">progress_activity</span>
      <p class="text-[10px] font-black uppercase tracking-widest">Cargando calificaciones...</p>
    </div>

    <div v-else-if="error" class="py-12 text-center text-red-600 font-medium text-sm">{{ error }}</div>

    <!-- EFU: Fraternidades -->
    <div v-else-if="ambito === 'EFU'" class="space-y-3">
      <div v-if="!itemsEfu.length" class="py-16 text-center text-slate-400">
        <span class="material-symbols-outlined text-5xl mb-3">inbox</span>
        <p class="text-sm font-medium">No hay calificaciones EFU registradas en esta gestión.</p>
      </div>

      <article
        v-for="item in itemsEfu"
        :key="item.idFraternidad"
        class="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm"
      >
        <button
          type="button"
          class="w-full flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 px-4 sm:px-5 py-4 text-left hover:bg-slate-50/80 transition-colors"
          @click="toggleExpand(`f-${item.idFraternidad}`)"
        >
          <div class="flex-1 min-w-0">
            <p class="text-sm font-black uppercase italic text-slate-800 truncate">{{ item.nombre }}</p>
            <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
              {{ item.categoria }} · {{ item.cantidadJurados }} nota(s) de jurado(s)
            </p>
          </div>
          <div class="flex items-center gap-4 sm:gap-6 shrink-0">
            <div class="text-right">
              <p class="text-[9px] font-black uppercase text-slate-400 tracking-widest">Promedio</p>
              <p class="text-sm font-black text-slate-700">{{ fmt(item.promedioJurado) }}</p>
            </div>
            <div class="text-right">
              <p class="text-[9px] font-black uppercase text-red-400 tracking-widest">Sanción</p>
              <p class="text-sm font-black" :class="item.impactoSanciones < 0 ? 'text-red-600' : 'text-slate-500'">
                {{ fmt(item.impactoSanciones) }}
              </p>
            </div>
            <div class="text-right min-w-[4rem]">
              <p class="text-[9px] font-black uppercase text-primary tracking-widest">Total</p>
              <p class="text-lg font-black text-primary italic">{{ fmt(item.puntajeFinal) }}</p>
            </div>
            <span class="material-symbols-outlined text-slate-400">
              {{ expandido[`f-${item.idFraternidad}`] ? 'expand_less' : 'expand_more' }}
            </span>
          </div>
        </button>

        <div v-if="expandido[`f-${item.idFraternidad}`]" class="border-t border-slate-100 bg-slate-50/50 px-4 sm:px-5 py-4">
          <p class="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">Calificaciones por jurado</p>
          <div v-if="!item.calificaciones?.length" class="text-xs text-slate-400 font-medium py-2">Sin evaluaciones aún.</div>
          <div v-else class="overflow-x-auto rounded-xl border border-slate-200 bg-white">
            <table class="w-full text-left text-sm min-w-[560px]">
              <thead>
                <tr class="bg-slate-50 text-[9px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100">
                  <th class="px-3 py-2.5">Jurado</th>
                  <th class="px-3 py-2.5">Fase</th>
                  <th class="px-3 py-2.5 text-center">Estado</th>
                  <th class="px-3 py-2.5 text-center">Nota</th>
                  <th class="px-3 py-2.5">Fecha</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-50">
                <tr v-for="c in item.calificaciones" :key="c.idEvaluacion" class="hover:bg-slate-50/80">
                  <td class="px-3 py-2.5 font-bold text-slate-800 text-xs">{{ c.juradoNombre }}</td>
                  <td class="px-3 py-2.5 text-xs text-slate-600 font-medium">{{ c.faseNombre }}</td>
                  <td class="px-3 py-2.5 text-center">
                    <span
                      class="text-[9px] font-black uppercase px-2 py-0.5 rounded-full"
                      :class="c.estado === 'COMPLETADO' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'"
                    >
                      {{ c.estado }}
                    </span>
                  </td>
                  <td class="px-3 py-2.5 text-center font-black text-primary">{{ fmt(c.puntajeTotal) }}</td>
                  <td class="px-3 py-2.5 text-[11px] text-slate-500">{{ fmtFecha(c.fechaCierre) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </article>
    </div>

    <!-- EXTERNO: Concursos -->
    <div v-else class="space-y-6">
      <div v-if="!concursos.length" class="py-16 text-center text-slate-400">
        <span class="material-symbols-outlined text-5xl mb-3">emoji_events</span>
        <p class="text-sm font-medium">No hay calificaciones de concursos en esta gestión.</p>
      </div>

      <section v-for="concurso in concursos" :key="concurso.idFase" class="space-y-3">
        <h3 class="text-sm font-black uppercase italic tracking-tight text-slate-800 flex items-center gap-2">
          <span class="material-symbols-outlined text-secondary">emoji_events</span>
          {{ concurso.nombreConcurso }}
        </h3>

        <article
          v-for="p in concurso.participantes"
          :key="p.idParticipante"
          class="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm"
        >
          <button
            type="button"
            class="w-full flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 px-4 sm:px-5 py-4 text-left hover:bg-slate-50/80 transition-colors"
            @click="toggleExpand(`p-${p.idParticipante}`)"
          >
            <div class="flex-1 min-w-0">
              <p class="text-sm font-black uppercase italic text-slate-800 truncate">{{ p.nombre }}</p>
              <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                {{ p.tipo }} · {{ p.fraternidad }} · {{ p.cantidadJurados }} nota(s)
              </p>
            </div>
            <div class="flex items-center gap-4 shrink-0">
              <div class="text-right min-w-[4rem]">
                <p class="text-[9px] font-black uppercase text-primary tracking-widest">Total</p>
                <p class="text-lg font-black text-primary italic">{{ fmt(p.puntajeFinal) }}</p>
              </div>
              <span class="material-symbols-outlined text-slate-400">
                {{ expandido[`p-${p.idParticipante}`] ? 'expand_less' : 'expand_more' }}
              </span>
            </div>
          </button>

          <div v-if="expandido[`p-${p.idParticipante}`]" class="border-t border-slate-100 bg-slate-50/50 px-4 sm:px-5 py-4">
            <div class="overflow-x-auto rounded-xl border border-slate-200 bg-white">
              <table class="w-full text-left text-sm min-w-[480px]">
                <thead>
                  <tr class="bg-slate-50 text-[9px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100">
                    <th class="px-3 py-2.5">Jurado</th>
                    <th class="px-3 py-2.5 text-center">Estado</th>
                    <th class="px-3 py-2.5 text-center">Nota</th>
                    <th class="px-3 py-2.5">Fecha</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-50">
                  <tr v-for="c in p.calificaciones" :key="c.idEvaluacion">
                    <td class="px-3 py-2.5 font-bold text-slate-800 text-xs">{{ c.juradoNombre }}</td>
                    <td class="px-3 py-2.5 text-center">
                      <span
                        class="text-[9px] font-black uppercase px-2 py-0.5 rounded-full"
                        :class="c.estado === 'COMPLETADO' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'"
                      >
                        {{ c.estado }}
                      </span>
                    </td>
                    <td class="px-3 py-2.5 text-center font-black text-primary">{{ fmt(c.puntajeTotal) }}</td>
                    <td class="px-3 py-2.5 text-[11px] text-slate-500">{{ fmtFecha(c.fechaCierre) }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </article>
      </section>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, reactive } from 'vue'
import api from '../services/api'

const loading = ref(true)
const error = ref('')
const gestiones = ref([])
const idGestion = ref(null)
const ambito = ref('EFU')
const data = ref(null)
const expandido = reactive({})

const itemsEfu = computed(() => data.value?.items || [])
const concursos = computed(() => data.value?.concursos || [])

const fmt = (n) => Number(n || 0).toFixed(2)

const fmtFecha = (d) => {
  if (!d) return '—'
  return new Date(d).toLocaleString('es-BO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const toggleExpand = (key) => {
  expandido[key] = !expandido[key]
}

const cargarGestiones = async () => {
  const { data: list } = await api.get('/evaluaciones/gestiones')
  gestiones.value = list || []
  const activa = gestiones.value.find((g) => g.activa)
  idGestion.value = activa?.idGestion || gestiones.value[0]?.idGestion || null
}

const cargar = async () => {
  if (!idGestion.value) return
  loading.value = true
  error.value = ''
  Object.keys(expandido).forEach((k) => delete expandido[k])
  try {
    const { data: res } = await api.get('/evaluaciones/auditoria-calificaciones', {
      params: { ambito: ambito.value, idGestion: idGestion.value },
    })
    data.value = res
  } catch (e) {
    error.value = e.response?.data?.message || 'No se pudo cargar la auditoría de calificaciones.'
    data.value = null
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  try {
    await cargarGestiones()
    await cargar()
  } catch (e) {
    error.value = 'No se pudieron cargar las gestiones.'
    loading.value = false
  }
})
</script>
