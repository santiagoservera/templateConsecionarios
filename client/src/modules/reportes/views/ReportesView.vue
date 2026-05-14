<script setup>
import { ref, computed, onMounted } from 'vue'
import { useExport } from '../../../shared/composables/useExport.js'
import { currency } from '../../../shared/utils/format.js'
import api from '../../../plugins/axios.js'

const { exporting, exportToExcel } = useExport()

const year    = ref(new Date().getFullYear())
const data    = ref(null)
const loading = ref(false)
const error   = ref(null)

const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

async function cargar() {
  loading.value = true
  error.value   = null
  try {
    const { data: res } = await api.get('/reportes/mensual', { params: { year: year.value } })
    data.value = res.data
  } catch (err) {
    error.value = err.response?.data?.error ?? 'Error al cargar reportes'
  } finally {
    loading.value = false
  }
}

onMounted(cargar)

function prevYear() { year.value--; cargar() }
function nextYear() { year.value++; cargar() }

// Máximos para escalar las barras
const maxVentasMonto     = computed(() => Math.max(...(data.value?.meses.map(m => m.ventasMonto)     ?? [1]), 1))
const maxClientesNuevos  = computed(() => Math.max(...(data.value?.meses.map(m => m.clientesNuevos)  ?? [1]), 1))
const maxLeadsNuevos     = computed(() => Math.max(...(data.value?.meses.map(m => m.leadsNuevos)     ?? [1]), 1))

// Mes actual para resaltar
const mesActual = new Date().getMonth() // 0-based

function barWidth(val, max) {
  if (!max || !val) return '0%'
  return `${Math.max((val / max) * 100, 2)}%`
}

function exportar() {
  if (!data.value) return
  exportToExcel(data.value.meses, [
    { label: 'Mes',                value: r => MESES[r.mes - 1] },
    { label: 'Ventas (cant.)',     value: r => r.ventasCantidad },
    { label: 'Ventas (monto)',     value: r => r.ventasMonto },
    { label: 'Entregados',         value: r => r.ventasEntregadas },
    { label: 'Comisiones ($)',     value: r => r.comisionesMonto },
    { label: 'Clientes nuevos',   value: r => r.clientesNuevos },
    { label: 'Leads nuevos',       value: r => r.leadsNuevos },
    { label: 'Leads ganados',      value: r => r.leadsGanados },
  ], `reporte_${year.value}`)
}
</script>

<template>
  <div class="p-6 space-y-6 animate-fade-in">

    <!-- Header -->
    <div class="flex items-center justify-between gap-4 flex-wrap">
      <div>
        <h1 class="text-2xl font-bold text-slate-900 dark:text-white">Reportes</h1>
        <p class="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Análisis mensual del negocio</p>
      </div>
      <div class="flex items-center gap-3">
        <!-- Selector de año -->
        <div class="flex items-center gap-1 bg-white dark:bg-[#1a1a2e] border border-slate-200 dark:border-white/10 rounded-xl px-1 py-1">
          <button class="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 text-slate-500 dark:text-slate-400 transition-colors" @click="prevYear">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5"/></svg>
          </button>
          <span class="text-sm font-bold text-slate-900 dark:text-white w-12 text-center">{{ year }}</span>
          <button class="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 text-slate-500 dark:text-slate-400 transition-colors" :disabled="year >= new Date().getFullYear()" @click="nextYear">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5"/></svg>
          </button>
        </div>
        <!-- Exportar -->
        <button
          class="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 border border-emerald-200 dark:border-emerald-500/20 px-3 py-2 rounded-xl transition-colors disabled:opacity-50"
          :disabled="exporting || !data"
          @click="exportar">
          <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3"/></svg>
          Exportar Excel
        </button>
      </div>
    </div>

    <div v-if="loading" class="flex justify-center py-20">
      <svg class="w-8 h-8 animate-spin text-primary-500" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
      </svg>
    </div>

    <template v-else-if="data">

      <!-- KPIs anuales -->
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div class="bg-white dark:bg-[#1a1a2e] rounded-2xl border border-slate-200 dark:border-white/10 p-5">
          <p class="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Ventas año</p>
          <p class="text-2xl font-bold text-slate-900 dark:text-white">{{ data.totales.ventasCantidad }}</p>
          <p class="text-xs text-slate-400 dark:text-slate-500 mt-1 font-mono">{{ currency(data.totales.ventasMonto) }}</p>
        </div>
        <div class="bg-white dark:bg-[#1a1a2e] rounded-2xl border border-slate-200 dark:border-white/10 p-5">
          <p class="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Entregados</p>
          <p class="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{{ data.totales.ventasEntregadas }}</p>
          <p class="text-xs text-slate-400 dark:text-slate-500 mt-1">de {{ data.totales.ventasCantidad }} ventas</p>
        </div>
        <div class="bg-white dark:bg-[#1a1a2e] rounded-2xl border border-slate-200 dark:border-white/10 p-5">
          <p class="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Clientes nuevos</p>
          <p class="text-2xl font-bold text-violet-600 dark:text-violet-400">{{ data.totales.clientesNuevos }}</p>
          <p class="text-xs text-slate-400 dark:text-slate-500 mt-1">en el año</p>
        </div>
        <div class="bg-white dark:bg-[#1a1a2e] rounded-2xl border border-slate-200 dark:border-white/10 p-5">
          <p class="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Comisiones</p>
          <p class="text-2xl font-bold text-primary-600 dark:text-primary-400 font-mono text-xl">{{ currency(data.totales.comisionesMonto) }}</p>
          <p class="text-xs text-slate-400 dark:text-slate-500 mt-1">generadas en el año</p>
        </div>
      </div>

      <!-- Tabla mensual -->
      <div class="bg-white dark:bg-[#1a1a2e] rounded-2xl border border-slate-200 dark:border-white/10 overflow-hidden">
        <div class="px-5 py-4 border-b border-slate-200 dark:border-white/10">
          <h2 class="text-sm font-bold text-slate-900 dark:text-white">Desglose por mes — {{ year }}</h2>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full">
            <thead>
              <tr class="bg-slate-50 dark:bg-white/[0.02]">
                <th class="text-left text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-5 py-3 w-28">Mes</th>
                <th class="text-right text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-4 py-3">Ventas</th>
                <th class="text-left text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-4 py-3 w-52">Monto ventas</th>
                <th class="text-right text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-4 py-3">Entregados</th>
                <th class="text-left text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-4 py-3 w-40">Comisiones</th>
                <th class="text-right text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-4 py-3">Clientes</th>
                <th class="text-left text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-4 py-3 w-36">Leads</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-50 dark:divide-white/[0.03]">
              <tr v-for="m in data.meses" :key="m.mes"
                class="transition-colors"
                :class="m.mes - 1 === mesActual && year === new Date().getFullYear()
                  ? 'bg-primary-50/40 dark:bg-primary-500/5'
                  : 'hover:bg-slate-50/50 dark:hover:bg-white/[0.02]'">

                <!-- Mes -->
                <td class="px-5 py-3.5">
                  <div class="flex items-center gap-2">
                    <span class="text-sm font-semibold text-slate-800 dark:text-white">{{ MESES[m.mes - 1] }}</span>
                    <span v-if="m.mes - 1 === mesActual && year === new Date().getFullYear()"
                      class="text-[9px] font-bold bg-primary-500 text-white px-1.5 py-px rounded-full">HOY</span>
                  </div>
                </td>

                <!-- Ventas cantidad -->
                <td class="px-4 py-3.5 text-right">
                  <span class="text-sm font-bold text-slate-900 dark:text-white">{{ m.ventasCantidad }}</span>
                </td>

                <!-- Ventas barra + monto -->
                <td class="px-4 py-3.5">
                  <div class="flex items-center gap-2">
                    <div class="flex-1 h-1.5 bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
                      <div class="h-full bg-primary-500 rounded-full transition-all" :style="{ width: barWidth(m.ventasMonto, maxVentasMonto) }"/>
                    </div>
                    <span class="text-xs font-mono text-slate-600 dark:text-slate-300 w-24 text-right shrink-0">{{ currency(m.ventasMonto) }}</span>
                  </div>
                </td>

                <!-- Entregados -->
                <td class="px-4 py-3.5 text-right">
                  <span class="text-sm font-semibold" :class="m.ventasEntregadas ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-300 dark:text-slate-600'">
                    {{ m.ventasEntregadas || '—' }}
                  </span>
                </td>

                <!-- Comisiones -->
                <td class="px-4 py-3.5">
                  <span class="text-xs font-mono font-semibold" :class="m.comisionesMonto ? 'text-slate-700 dark:text-slate-200' : 'text-slate-300 dark:text-slate-600'">
                    {{ m.comisionesMonto ? currency(m.comisionesMonto) : '—' }}
                  </span>
                </td>

                <!-- Clientes nuevos + barra -->
                <td class="px-4 py-3.5 text-right">
                  <span class="text-sm font-semibold" :class="m.clientesNuevos ? 'text-violet-600 dark:text-violet-400' : 'text-slate-300 dark:text-slate-600'">
                    {{ m.clientesNuevos || '—' }}
                  </span>
                </td>

                <!-- Leads -->
                <td class="px-4 py-3.5">
                  <div class="flex items-center gap-1.5">
                    <div class="flex-1 h-1.5 bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
                      <div class="h-full bg-cyan-400 rounded-full transition-all" :style="{ width: barWidth(m.leadsNuevos, maxLeadsNuevos) }"/>
                    </div>
                    <span class="text-xs text-slate-500 dark:text-slate-400 shrink-0">
                      {{ m.leadsNuevos }}
                      <span v-if="m.leadsGanados" class="text-emerald-500 ml-1">({{ m.leadsGanados }}✓)</span>
                    </span>
                  </div>
                </td>
              </tr>
            </tbody>

            <!-- Totales -->
            <tfoot>
              <tr class="bg-slate-100/60 dark:bg-white/[0.04] border-t-2 border-slate-200 dark:border-white/10">
                <td class="px-5 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total año</td>
                <td class="px-4 py-3 text-right text-sm font-bold text-slate-900 dark:text-white">{{ data.totales.ventasCantidad }}</td>
                <td class="px-4 py-3 text-right text-xs font-mono font-bold text-slate-900 dark:text-white pr-8">{{ currency(data.totales.ventasMonto) }}</td>
                <td class="px-4 py-3 text-right text-sm font-bold text-emerald-600 dark:text-emerald-400">{{ data.totales.ventasEntregadas }}</td>
                <td class="px-4 py-3 text-xs font-mono font-bold text-slate-900 dark:text-white">{{ currency(data.totales.comisionesMonto) }}</td>
                <td class="px-4 py-3 text-right text-sm font-bold text-violet-600 dark:text-violet-400">{{ data.totales.clientesNuevos }}</td>
                <td class="px-4 py-3 text-xs text-slate-500 dark:text-slate-400">
                  {{ data.totales.leadsNuevos }} <span class="text-emerald-500">({{ data.totales.leadsGanados }}✓)</span>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

    </template>

    <div v-else-if="error" class="rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 px-4 py-3 text-sm text-red-700 dark:text-red-400">{{ error }}</div>

  </div>
</template>
