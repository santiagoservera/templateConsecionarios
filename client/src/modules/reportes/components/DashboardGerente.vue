<script setup>
import { computed } from 'vue'
import { currency } from '../../../shared/utils/format.js'

import { useRouter } from 'vue-router'
import { date } from '../../../shared/utils/format.js'

const router = useRouter()

const props = defineProps({
  data:    { type: Object, required: true },
  alertas: { type: Object, default: null },
})

const alertasFlat = computed(() => {
  if (!props.alertas) return []
  const TIPO_CONFIG = {
    cuota:   { icon: 'M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 0 1 3 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 0 0-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 0 1-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 0 0 3 15h-.75', color: 'text-red-500', bg: 'bg-red-100 dark:bg-red-500/15' },
    seguro:  { icon: 'M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z', color: 'text-amber-500', bg: 'bg-amber-100 dark:bg-amber-500/15' },
    service: { icon: 'M11.42 15.17 17.25 21A2.652 2.652 0 0 0 21 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 1 1-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 0 0 4.486-6.336l-3.276 3.277a3.004 3.004 0 0 1-2.25-2.25l3.276-3.276a4.5 4.5 0 0 0-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437 1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008Z', color: 'text-blue-500', bg: 'bg-blue-100 dark:bg-blue-500/15' },
    lead:    { icon: 'M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z', color: 'text-slate-500', bg: 'bg-slate-100 dark:bg-white/10' },
  }
  return [
    ...props.alertas.cuotasVencidas,
    ...props.alertas.segurosVenciendo,
    ...props.alertas.servicesVencidos,
    ...props.alertas.leadsInactivos,
  ].map(a => ({ ...a, cfg: TIPO_CONFIG[a.tipo] }))
    .sort((a, b) => new Date(a.fecha) - new Date(b.fecha))
    .slice(0, 8)
})

const saludo = computed(() => {
  const h = new Date().getHours()
  if (h < 12) return 'Buenos días'
  if (h < 19) return 'Buenas tardes'
  return 'Buenas noches'
})

const fechaHoy = computed(() =>
  new Date().toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
)

const disponibles = computed(() => props.data.stockPorEstado?.find(s => s.estado === 'DISPONIBLE')?.count ?? 0)
const autos = computed(() => props.data.stockPorEstado?.find(s => s.estado === 'DISPONIBLE' && s.tipo === 'AUTO')?.count ?? Math.ceil(disponibles.value * 0.7))
const motos = computed(() => disponibles.value - autos.value)

const metricas = computed(() => [
  {
    label:    'Ventas del mes',
    valor:    props.data.ventasMes?.cantidad ?? 0,
    moneda:   false,
    trend:    '+4',
    trendPos: true,
    sub:      'vs mes anterior',
    color:    'text-primary-400',
    bar:      'from-primary-500 to-orange-400',
    prog:     Math.min(100, ((props.data.ventasMes?.cantidad ?? 0) / 20) * 100),
  },
  {
    label:    'Facturado',
    valor:    props.data.ventasMes?.montoTotal ?? 0,
    moneda:   true,
    trend:    '+18%',
    trendPos: true,
    sub:      'vs mes anterior',
    color:    'text-emerald-400',
    bar:      'from-emerald-500 to-teal-400',
    prog:     65,
  },
  {
    label:    'Stock disponible',
    valor:    disponibles.value,
    moneda:   false,
    trend:    null,
    sub:      `${autos.value} autos  ${motos.value} motos`,
    color:    'text-blue-400',
    bar:      'from-blue-500 to-cyan-400',
    prog:     Math.min(100, (disponibles.value / 30) * 100),
  },
  {
    label:    'Comisiones pend.',
    valor:    props.data.comisionesPendientes?.montoTotal ?? 0,
    moneda:   true,
    trend:    null,
    sub:      `${props.data.comisionesPendientes?.cantidad ?? 0} por liquidar`,
    color:    'text-violet-400',
    bar:      'from-violet-500 to-purple-400',
    prog:     40,
  },
])

const ACTIVIDAD_CONFIG = {
  venta:     { color: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400', dot: 'bg-emerald-500', label: 'Venta' },
  lead:      { color: 'bg-blue-500/15 text-blue-600 dark:text-blue-400',          dot: 'bg-blue-500',    label: 'Lead' },
  cliente:   { color: 'bg-cyan-500/15 text-cyan-600 dark:text-cyan-400',          dot: 'bg-cyan-500',    label: 'Cliente' },
  postventa: { color: 'bg-amber-500/15 text-amber-600 dark:text-amber-400',       dot: 'bg-amber-500',   label: 'Postventa' },
  vehiculo:  { color: 'bg-violet-500/15 text-violet-600 dark:text-violet-400',    dot: 'bg-violet-500',  label: 'Stock' },
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

const podio = computed(() => props.data.topVendedores?.slice(0, 3) ?? [])
const PODIO_GRAD  = ['from-primary-400 to-orange-500','from-slate-400 to-slate-500','from-amber-600 to-amber-700']
const PODIO_POS   = [1, 0, 2]
const PODIO_H     = ['h-8','h-16','h-5']
const PODIO_SIZE  = ['w-14 h-14','w-18 h-18','w-12 h-12']
const PODIO_LABEL = ['2°','1°','3°']

const LABEL_ESTADO = { DISPONIBLE:'Disponible', RESERVADO:'Reservado', VENDIDO:'Vendido', EN_PREPARACION:'Preparación', EN_CONSIGNACION:'Consignación' }
const LABEL_ETAPA  = { NUEVO:'Nuevo', CONTACTADO:'Contactado', INTERESADO:'Interesado', NEGOCIACION:'Negociación', GANADO:'Ganado', PERDIDO:'Perdido' }
const ETAPA_BAR    = { NUEVO:'bg-blue-500', CONTACTADO:'bg-cyan-500', INTERESADO:'bg-indigo-500', NEGOCIACION:'bg-orange-500', GANADO:'bg-emerald-500', PERDIDO:'bg-red-500' }

const maxStock = computed(() => Math.max(1, ...(props.data.stockPorEstado?.map(s => s.count) ?? [1])))
const maxLeads = computed(() => Math.max(1, ...(props.data.leadsPorEtapa?.map(l => l.count) ?? [1])))
</script>

<template>
  <div class="p-5 sm:p-6 space-y-5 animate-fade-in">

    <!-- Saludo -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <div>
        <h1 class="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
          {{ saludo }},
          <span class="text-primary-500">{{ $parent?.data?.vendedor ?? 'Administrador' }}</span>
        </h1>
        <p class="text-sm text-slate-500 dark:text-slate-400 mt-0.5 capitalize">{{ fechaHoy }}</p>
      </div>
      <div class="inline-flex items-center gap-2 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 self-start sm:self-auto">
        <div class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        <span class="text-xs font-medium text-slate-600 dark:text-slate-300">Sistema activo</span>
      </div>
    </div>

    <!-- KPI cards -->
    <div class="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
      <div
        v-for="m in metricas"
        :key="m.label"
        class="bg-white dark:bg-[#1a1a2e] border border-slate-200 dark:border-white/10 rounded-2xl p-4 sm:p-5
               shadow-card dark:shadow-none hover:shadow-card-md dark:hover:bg-[#1e1e35]
               transition-all hover:-translate-y-0.5"
      >
        <!-- Label -->
        <p class="text-[10px] sm:text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
          {{ m.label }}
        </p>

        <!-- Número grande -->
        <p class="text-2xl sm:text-3xl font-bold font-mono leading-none mb-1"
           :class="m.moneda ? 'text-slate-900 dark:text-white' : 'text-slate-900 dark:text-white'">
          <template v-if="m.moneda">
            <span class="text-sm font-semibold text-slate-400 dark:text-slate-500 mr-0.5">$</span>{{ Number(m.valor).toLocaleString('es-AR') }}
          </template>
          <template v-else>{{ m.valor }}</template>
        </p>

        <!-- Trend o sub -->
        <div class="flex items-center gap-1.5 mb-4">
          <template v-if="m.trend">
            <svg
              class="w-3 h-3 shrink-0"
              :class="m.trendPos ? 'text-emerald-400' : 'text-red-400'"
              fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3"
            >
              <path v-if="m.trendPos" stroke-linecap="round" stroke-linejoin="round" d="M4.5 10.5 12 3m0 0 7.5 7.5M12 3v18"/>
              <path v-else stroke-linecap="round" stroke-linejoin="round" d="M19.5 13.5 12 21m0 0-7.5-7.5M12 21V3"/>
            </svg>
            <span class="text-xs font-semibold" :class="m.trendPos ? 'text-emerald-400' : 'text-red-400'">
              {{ m.trend }}
            </span>
            <span class="text-xs text-slate-400 dark:text-slate-500">{{ m.sub }}</span>
          </template>
          <span v-else class="text-xs text-slate-400 dark:text-slate-500">{{ m.sub }}</span>
        </div>

        <!-- Progress bar gradiente -->
        <div class="h-1 bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
          <div
            class="h-full rounded-full bg-gradient-to-r transition-all duration-700"
            :class="m.bar"
            :style="{ width: `${m.prog}%` }"
          />
        </div>
      </div>
    </div>

    <!-- Podio + Heatmap -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">

      <!-- Top vendedores -->
      <div class="bg-white dark:bg-[#1a1a2e] border border-slate-200 dark:border-white/10 rounded-2xl shadow-card dark:shadow-none overflow-hidden">
        <div class="px-5 py-4 border-b border-slate-200 dark:border-white/10 flex items-center gap-2">
          <svg class="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 24 24">
            <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 0 0 .95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 0 0-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 0 0-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 0 0-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 0 0 .951-.69l1.519-4.674Z"/>
          </svg>
          <h3 class="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wide">Top vendedores del mes</h3>
        </div>

        <div v-if="!podio.length" class="px-5 py-10 text-center text-sm text-slate-400">Sin ventas registradas este mes.</div>
        <div v-else class="px-5 py-5">
          <!-- Podio visual -->
          <div class="flex items-end justify-center gap-6 mb-5" style="min-height: 120px;">
            <template v-for="(vi, i) in PODIO_POS" :key="i">
              <div v-if="podio[vi]" class="flex flex-col items-center gap-2">
                <div
                  :class="['rounded-full bg-gradient-to-br flex items-center justify-center text-white font-bold shadow-md', PODIO_GRAD[vi], i===1?'w-16 h-16':'w-12 h-12']"
                >
                  <span :class="i===1?'text-lg':'text-base'">{{ podio[vi].nombre?.charAt(0) }}</span>
                </div>
                <div class="text-center">
                  <p class="text-[10px] font-bold" :class="vi===0?'text-primary-500':'text-slate-400'">{{ PODIO_LABEL[i] }}</p>
                  <p class="text-xs font-semibold text-slate-700 dark:text-slate-200">{{ podio[vi].nombre?.split(' ')[0] }}</p>
                  <p class="text-[10px] font-mono" :class="vi===0?'text-primary-500 font-bold':'text-slate-400'">{{ currency(podio[vi].totalVentas) }}</p>
                </div>
                <div :class="['w-12 rounded-t-lg bg-gradient-to-t opacity-40', PODIO_GRAD[vi], PODIO_H[i]]" />
              </div>
            </template>
          </div>

          <!-- Lista -->
          <div class="space-y-1 border-t border-slate-200 dark:border-white/10 pt-3">
            <div v-for="(v,i) in podio" :key="v.vendedorId"
              class="flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
              <span class="text-xs font-bold text-slate-400 w-4">{{ i+1 }}.</span>
              <div :class="['w-6 h-6 rounded-full bg-gradient-to-br flex items-center justify-center text-white text-[10px] font-bold shrink-0', PODIO_GRAD[i]??'from-slate-400 to-slate-500']">{{ v.nombre?.charAt(0) }}</div>
              <span class="text-sm font-medium text-slate-700 dark:text-slate-200 flex-1 truncate">{{ v.nombre }}</span>
              <span class="text-xs text-slate-400">{{ v.cantVentas }} vta{{ v.cantVentas!==1?'s':'' }}</span>
              <span class="text-sm font-bold font-mono" :class="i===0?'text-primary-500':'text-slate-600 dark:text-slate-300'">{{ currency(v.totalVentas) }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Actividad reciente -->
      <div class="bg-white dark:bg-[#1a1a2e] border border-slate-200 dark:border-white/10 rounded-2xl shadow-card dark:shadow-none overflow-hidden flex flex-col">
        <div class="px-5 py-4 border-b border-slate-200 dark:border-white/10 flex items-center gap-2">
          <svg class="w-4 h-4 text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"/>
          </svg>
          <h3 class="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wide">Actividad reciente</h3>
        </div>

        <div v-if="!data.actividadReciente?.length" class="flex-1 flex items-center justify-center py-10">
          <p class="text-sm text-slate-400">Sin actividad registrada.</p>
        </div>

        <ul v-else class="divide-y divide-slate-200 dark:divide-white/5 overflow-y-auto max-h-[340px]">
          <li
            v-for="evento in data.actividadReciente"
            :key="evento.id"
            class="flex items-start gap-3 px-5 py-3 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
          >
            <!-- Dot tipo -->
            <span
              class="mt-1.5 w-2 h-2 rounded-full shrink-0"
              :class="ACTIVIDAD_CONFIG[evento.tipo]?.dot ?? 'bg-slate-400'"
            />

            <div class="flex-1 min-w-0">
              <!-- Badge tipo -->
              <span
                class="inline-block text-[10px] font-semibold px-1.5 py-0.5 rounded-md mb-0.5"
                :class="ACTIVIDAD_CONFIG[evento.tipo]?.color ?? 'bg-slate-100 text-slate-500'"
              >
                {{ ACTIVIDAD_CONFIG[evento.tipo]?.label ?? evento.tipo }}
              </span>
              <p class="text-sm text-slate-700 dark:text-slate-200 leading-snug">
                {{ evento.descripcion }}
              </p>
              <p v-if="evento.monto" class="text-xs font-mono font-semibold text-emerald-600 dark:text-emerald-400 mt-0.5">
                {{ currency(evento.monto) }}
              </p>
            </div>

            <!-- Tiempo relativo -->
            <span class="text-[11px] text-slate-400 shrink-0 mt-0.5 whitespace-nowrap">
              {{ tiempoRelativo(evento.fecha) }}
            </span>
          </li>
        </ul>
      </div>
    </div>

    <!-- Stock + Pipeline -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">

      <!-- Stock por estado -->
      <div class="bg-white dark:bg-[#1a1a2e] border border-slate-200 dark:border-white/10 rounded-2xl shadow-card dark:shadow-none p-5">
        <h3 class="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4">Stock por estado</h3>
        <div class="space-y-3">
          <div v-for="s in data.stockPorEstado" :key="s.estado" class="flex items-center gap-3">
            <span class="text-xs text-slate-500 dark:text-slate-400 w-24 shrink-0">{{ LABEL_ESTADO[s.estado]??s.estado }}</span>
            <div class="flex-1 h-2 bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
              <div class="h-full rounded-full bg-gradient-to-r from-primary-500 to-orange-400 transition-all duration-700"
                :style="{ width: `${(s.count/maxStock)*100}%` }" />
            </div>
            <span class="text-xs font-bold font-mono text-slate-700 dark:text-slate-200 w-5 text-right">{{ s.count }}</span>
          </div>
          <p v-if="!data.stockPorEstado?.length" class="text-sm text-slate-400 text-center py-4">Sin datos.</p>
        </div>
      </div>

      <!-- Pipeline de leads -->
      <div class="bg-white dark:bg-[#1a1a2e] border border-slate-200 dark:border-white/10 rounded-2xl shadow-card dark:shadow-none p-5">
        <h3 class="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4">Pipeline de leads</h3>
        <div class="space-y-3">
          <div v-for="l in data.leadsPorEtapa" :key="l.etapa" class="flex items-center gap-3">
            <span class="text-xs text-slate-500 dark:text-slate-400 w-24 shrink-0">{{ LABEL_ETAPA[l.etapa]??l.etapa }}</span>
            <div class="flex-1 h-2 bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
              <div class="h-full rounded-full transition-all duration-700"
                :class="ETAPA_BAR[l.etapa]??'bg-slate-400'"
                :style="{ width: `${(l.count/maxLeads)*100}%` }" />
            </div>
            <span class="text-xs font-bold font-mono text-slate-700 dark:text-slate-200 w-5 text-right">{{ l.count }}</span>
          </div>
          <p v-if="!data.leadsPorEtapa?.length" class="text-sm text-slate-400 text-center py-4">Sin leads.</p>
        </div>
      </div>
    </div>

    <!-- ── Alertas operativas ──────────────────────────────────────────────── -->
    <div v-if="alertasFlat.length" class="bg-white dark:bg-[#1a1a2e] rounded-2xl border border-slate-200 dark:border-white/10 shadow-card dark:shadow-none overflow-hidden">
      <div class="px-5 py-4 border-b border-slate-200 dark:border-white/10 flex items-center justify-between">
        <div class="flex items-center gap-2.5">
          <div class="w-2 h-2 rounded-full bg-red-500 animate-pulse"/>
          <h3 class="text-sm font-bold text-slate-900 dark:text-white">Alertas operativas</h3>
          <span class="text-xs font-mono bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400 px-2 py-0.5 rounded-full">{{ alertasFlat.length }}</span>
        </div>
      </div>
      <div class="divide-y divide-slate-50 dark:divide-white/[0.03]">
        <button
          v-for="a in alertasFlat" :key="`${a.tipo}-${a.id}`"
          class="w-full flex items-center gap-4 px-5 py-3.5 hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors text-left group"
          @click="router.push(a.linkTo)">
          <!-- Ícono -->
          <div class="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" :class="a.cfg.bg">
            <svg class="w-4 h-4" :class="a.cfg.color" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
              <path stroke-linecap="round" stroke-linejoin="round" :d="a.cfg.icon"/>
            </svg>
          </div>
          <!-- Info -->
          <div class="flex-1 min-w-0">
            <p class="text-sm font-semibold text-slate-800 dark:text-white truncate">{{ a.titulo }}</p>
            <p class="text-xs text-slate-500 dark:text-slate-400 truncate">{{ a.subtitulo }}</p>
          </div>
          <!-- Fecha -->
          <div class="text-right shrink-0">
            <p class="text-xs font-medium text-slate-500 dark:text-slate-400">{{ date(a.fecha) }}</p>
          </div>
          <!-- Flecha -->
          <svg class="w-4 h-4 text-slate-300 dark:text-white/20 group-hover:text-primary-500 transition-colors shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5"/>
          </svg>
        </button>
      </div>
    </div>

  </div>
</template>
