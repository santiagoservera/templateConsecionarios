<script setup>
import { computed } from 'vue'
import { currency } from '../../../shared/utils/format.js'

const ACTIVIDAD_CONFIG = {
  venta:     { color: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400', dot: 'bg-emerald-500', label: 'Venta' },
  lead:      { color: 'bg-blue-500/15 text-blue-600 dark:text-blue-400',          dot: 'bg-blue-500',    label: 'Lead' },
  postventa: { color: 'bg-amber-500/15 text-amber-600 dark:text-amber-400',       dot: 'bg-amber-500',   label: 'Postventa' },
}

function tiempoRelativo(fecha) {
  const diff = Date.now() - new Date(fecha).getTime()
  const min = Math.floor(diff / 60000)
  if (min < 1)  return 'ahora'
  if (min < 60) return `hace ${min} min`
  const h = Math.floor(min / 60)
  if (h < 24)   return `hace ${h} h`
  const d = Math.floor(h / 24)
  if (d === 1)  return 'ayer'
  if (d < 7)    return `hace ${d} días`
  return new Date(fecha).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })
}

const props = defineProps({
  data:   { type: Object, required: true },
  nombre: { type: String, default: '' },
})

const saludo = computed(() => {
  const h = new Date().getHours()
  if (h < 12) return 'Buenos días'
  if (h < 19) return 'Buenas tardes'
  return 'Buenas noches'
})

const fechaHoy = computed(() =>
  new Date().toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })
)

const primerNombre = computed(() => props.nombre.split(' ')[0])

const ETAPAS_ACTIVAS = ['NUEVO','CONTACTADO','INTERESADO','NEGOCIACION']
const LABEL_ETAPA    = { NUEVO:'Nuevo', CONTACTADO:'Contactado', INTERESADO:'Interesado', NEGOCIACION:'Negociación', GANADO:'Ganado', PERDIDO:'Perdido' }
const ETAPA_STYLE    = {
  NUEVO:      { bg:'bg-blue-500/10 dark:bg-blue-500/20',   num:'text-blue-600 dark:text-blue-400',   border:'border-blue-200 dark:border-blue-500/30' },
  CONTACTADO: { bg:'bg-cyan-500/10 dark:bg-cyan-500/20',   num:'text-cyan-600 dark:text-cyan-400',   border:'border-cyan-200 dark:border-cyan-500/30' },
  INTERESADO: { bg:'bg-indigo-500/10 dark:bg-indigo-500/20',num:'text-indigo-600 dark:text-indigo-400',border:'border-indigo-200 dark:border-indigo-500/30' },
  NEGOCIACION:{ bg:'bg-orange-500/10 dark:bg-orange-500/20',num:'text-orange-600 dark:text-orange-400',border:'border-orange-200 dark:border-orange-500/30' },
}

const etapaMap = computed(() => {
  const m = {}
  props.data.leadsPorEtapa?.forEach(l => { m[l.etapa] = l.count })
  return m
})

const totalActivos = computed(() => ETAPAS_ACTIVAS.reduce((s,e) => s + (etapaMap.value[e]??0), 0))
const metaMensual  = 20
const progMeta     = computed(() => Math.min(100, ((props.data.ventasMes?.cantidad ?? 0) / metaMensual) * 100))
</script>

<template>
  <div class="p-5 sm:p-6 space-y-5 animate-fade-in">

    <!-- Saludo -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <div>
        <h1 class="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
          {{ saludo }}, <span class="text-primary-500">{{ primerNombre }}</span>
        </h1>
        <p class="text-sm text-slate-500 dark:text-slate-400 mt-0.5 capitalize">{{ fechaHoy }}</p>
      </div>
    </div>

    <!-- Banner comisión -->
    <div class="relative overflow-hidden rounded-2xl bg-[#0F172A] dark:bg-[#13131f] border border-white/5 p-5 sm:p-6">
      <div class="absolute -right-6 -top-6 w-32 h-32 bg-primary-500 rounded-full opacity-10 blur-2xl" />
      <div class="absolute right-10 bottom-0 w-20 h-20 bg-orange-400 rounded-full opacity-10 blur-xl" />
      <div class="relative z-10">
        <div class="flex items-center gap-2 mb-2">
          <svg class="w-4 h-4 text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33"/>
          </svg>
          <p class="text-sm text-slate-400 font-medium">Comisión pendiente estimada</p>
        </div>
        <p class="text-3xl sm:text-4xl font-bold font-mono text-white">{{ currency(data.comisionPendiente?.montoEstimado ?? 0) }}</p>
        <p class="text-slate-400 text-sm mt-2">
          {{ data.comisionPendiente?.cantidad ?? 0 }} venta{{ (data.comisionPendiente?.cantidad ?? 0)!==1?'s':'' }} por liquidar
        </p>
      </div>
    </div>

    <!-- Mis ventas -->
    <div class="bg-white dark:bg-[#1a1a2e] border border-slate-200 dark:border-white/10 rounded-2xl shadow-card dark:shadow-none p-5">
      <h3 class="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4">Mis ventas este mes</h3>
      <div class="flex flex-col sm:flex-row sm:items-end gap-4 sm:gap-8">
        <div>
          <p class="text-5xl font-bold font-mono text-slate-900 dark:text-white">{{ data.ventasMes?.cantidad ?? 0 }}</p>
          <p class="text-sm text-slate-400 mt-1">operaciones</p>
        </div>
        <div class="sm:pb-1 sm:border-l sm:border-slate-200 sm:dark:border-white/10 sm:pl-8">
          <p class="text-2xl font-bold font-mono text-slate-700 dark:text-slate-200">{{ currency(data.ventasMes?.montoTotal ?? 0) }}</p>
          <p class="text-sm text-slate-400 mt-1">facturado</p>
        </div>
      </div>

      <!-- Meta progress -->
      <div class="mt-5 space-y-1.5">
        <div class="flex items-center justify-between">
          <span class="text-xs text-slate-400">Meta mensual</span>
          <span class="text-xs font-mono font-bold text-slate-600 dark:text-slate-300">{{ Math.round(progMeta) }}%</span>
        </div>
        <div class="h-2 bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
          <div
            class="h-full rounded-full bg-gradient-to-r from-primary-500 to-orange-400 transition-all duration-700"
            :style="{ width: `${progMeta}%` }"
          />
        </div>
      </div>
    </div>

    <!-- Pipeline -->
    <div class="bg-white dark:bg-[#1a1a2e] border border-slate-200 dark:border-white/10 rounded-2xl shadow-card dark:shadow-none p-5">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Mi pipeline</h3>
        <span class="inline-flex items-center gap-1.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-500/20">
          <span class="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          {{ totalActivos }} activos
        </span>
      </div>

      <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div
          v-for="etapa in ETAPAS_ACTIVAS"
          :key="etapa"
          class="rounded-xl p-4 border text-center"
          :class="[ETAPA_STYLE[etapa].bg, ETAPA_STYLE[etapa].border]"
        >
          <p class="text-3xl font-bold font-mono" :class="ETAPA_STYLE[etapa].num">{{ etapaMap[etapa]??0 }}</p>
          <p class="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1">{{ LABEL_ETAPA[etapa] }}</p>
        </div>
      </div>

      <div class="flex gap-6 mt-4 pt-4 border-t border-slate-200 dark:border-white/10">
        <div class="flex items-center gap-2">
          <div class="w-2.5 h-2.5 rounded-full bg-emerald-500" />
          <span class="text-xs text-slate-500 dark:text-slate-400">
            Ganados: <strong class="text-slate-700 dark:text-slate-200 font-mono">{{ etapaMap['GANADO']??0 }}</strong>
          </span>
        </div>
        <div class="flex items-center gap-2">
          <div class="w-2.5 h-2.5 rounded-full bg-red-400" />
          <span class="text-xs text-slate-500 dark:text-slate-400">
            Perdidos: <strong class="text-slate-700 dark:text-slate-200 font-mono">{{ etapaMap['PERDIDO']??0 }}</strong>
          </span>
        </div>
      </div>
    </div>

    <!-- Mi actividad reciente -->
    <div class="bg-white dark:bg-[#1a1a2e] border border-slate-200 dark:border-white/10 rounded-2xl shadow-card dark:shadow-none overflow-hidden">
      <div class="px-5 py-4 border-b border-slate-200 dark:border-white/10 flex items-center gap-2">
        <svg class="w-4 h-4 text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"/>
        </svg>
        <h3 class="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wide">Mi actividad reciente</h3>
      </div>

      <div v-if="!data.actividadReciente?.length" class="flex items-center justify-center py-10">
        <p class="text-sm text-slate-400">Sin actividad registrada.</p>
      </div>

      <ul v-else class="divide-y divide-slate-200 dark:divide-white/5">
        <li
          v-for="evento in data.actividadReciente"
          :key="evento.id"
          class="flex items-start gap-3 px-5 py-3 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
        >
          <span
            class="mt-1.5 w-2 h-2 rounded-full shrink-0"
            :class="ACTIVIDAD_CONFIG[evento.tipo]?.dot ?? 'bg-slate-400'"
          />
          <div class="flex-1 min-w-0">
            <span
              class="inline-block text-[10px] font-semibold px-1.5 py-0.5 rounded-md mb-0.5"
              :class="ACTIVIDAD_CONFIG[evento.tipo]?.color ?? 'bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-slate-400'"
            >
              {{ ACTIVIDAD_CONFIG[evento.tipo]?.label ?? evento.tipo }}
            </span>
            <p class="text-sm text-slate-700 dark:text-slate-200 leading-snug">{{ evento.descripcion }}</p>
            <p v-if="evento.monto" class="text-xs font-mono font-semibold text-emerald-600 dark:text-emerald-400 mt-0.5">
              {{ currency(evento.monto) }}
            </p>
          </div>
          <span class="text-[11px] text-slate-400 shrink-0 mt-0.5 whitespace-nowrap">
            {{ tiempoRelativo(evento.fecha) }}
          </span>
        </li>
      </ul>
    </div>

  </div>
</template>
