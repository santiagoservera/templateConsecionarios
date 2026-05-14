<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '../../auth/store/authStore.js'
import { useComisiones } from '../composables/useComisiones.js'
import { useToast } from '../../../shared/composables/useToast.js'
import AppModal from '../../../shared/components/AppModal.vue'
import AppBadge from '../../../shared/components/AppBadge.vue'
import AppSelect from '../../../shared/components/AppSelect.vue'
import AppPagination from '../../../shared/components/AppPagination.vue'
import { currency, date } from '../../../shared/utils/format.js'
import { useExport } from '../../../shared/composables/useExport.js'

const { exporting, exportToExcel } = useExport()

function exportar() {
  exportToExcel(comisiones.value, [
    { label: 'Vendedor',         value: r => r.vendedor?.nombre ?? '' },
    { label: 'Vehículo',         value: r => `${r.venta?.vehiculo?.marca ?? ''} ${r.venta?.vehiculo?.modelo ?? ''} ${r.venta?.vehiculo?.anio ?? ''}`.trim() },
    { label: 'Cliente',          value: r => `${r.venta?.cliente?.nombre ?? ''} ${r.venta?.cliente?.apellido ?? ''}`.trim() },
    { label: 'Monto base',       value: r => Number(r.montoBase) },
    { label: 'Porcentaje (%)',   value: r => Number(r.porcentaje) },
    { label: 'Comisión',         value: r => Number(r.montoComision) },
    { label: 'Estado',           value: r => r.estado },
    { label: 'Fecha liquidación',value: r => r.fechaLiquidacion ? date(r.fechaLiquidacion) : '' },
  ], 'comisiones')
}

const authStore  = useAuthStore()
const toast      = useToast()
const { comisiones, loading, error, meta, totales, fetchComisiones, updateComision, liquidarLote } = useComisiones()

const isGerente = computed(() => ['ADMIN', 'GERENTE'].includes(authStore.userRole))

const filtroEstado    = ref('')
const filtroVendedor  = ref(authStore.userRole === 'VENDEDOR' ? authStore.user?.sub : '')
const page            = ref(1)
const selected        = ref([]) // ids seleccionados para liquidar en lote

const estadoOptions = [
  { value: '',          label: 'Todos' },
  { value: 'PENDIENTE', label: 'Pendiente' },
  { value: 'LIQUIDADA', label: 'Liquidada' },
]

function load() {
  selected.value = []
  fetchComisiones({
    estado:     filtroEstado.value    || undefined,
    vendedorId: filtroVendedor.value  || undefined,
    page:       page.value,
  })
}
onMounted(load)

function toggleSelect(id) {
  if (selected.value.includes(id)) {
    selected.value = selected.value.filter(i => i !== id)
  } else {
    selected.value = [...selected.value, id]
  }
}

function toggleAll() {
  const pendientes = comisiones.value.filter(c => c.estado === 'PENDIENTE').map(c => c.id)
  if (selected.value.length === pendientes.length) {
    selected.value = []
  } else {
    selected.value = pendientes
  }
}

// ── Liquidar en lote ──────────────────────────────────────────────────────────
const liquidando     = ref(false)
const showConfirm    = ref(false)

async function confirmarLiquidar() {
  liquidando.value = true
  try {
    const result = await liquidarLote({ ids: selected.value })
    toast.success('Comisiones liquidadas', `${result.liquidadas} comisión(es) marcadas como liquidadas`)
    showConfirm.value = false
    load()
  } catch (err) {
    toast.error('Error', err.response?.data?.error ?? 'No se pudo liquidar')
  } finally {
    liquidando.value = false
  }
}

const pendientesCount = computed(() => comisiones.value.filter(c => c.estado === 'PENDIENTE').length)
</script>

<template>
  <div class="p-6 space-y-6 animate-fade-in">

    <!-- Encabezado -->
    <div class="flex items-center justify-between gap-4 flex-wrap">
      <div>
        <h1 class="text-2xl font-bold text-slate-900 dark:text-white">Comisiones</h1>
        <p class="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Gestión y liquidación de comisiones por ventas</p>
      </div>
      <button
        v-if="isGerente && selected.length > 0"
        class="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-all shadow-sm shrink-0"
        @click="showConfirm = true"
      >
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"/>
        </svg>
        Liquidar {{ selected.length }} seleccionada(s)
      </button>
    </div>

    <!-- Totales -->
    <div v-if="totales" class="grid grid-cols-2 gap-4">
      <div class="bg-white dark:bg-[#1a1a2e] rounded-2xl border border-slate-200 dark:border-white/10 p-4">
        <p class="text-xs text-slate-500 dark:text-slate-400">Pendiente de cobro</p>
        <p class="text-xl font-bold text-amber-500">{{ currency(totales.totalPendiente) }}</p>
      </div>
      <div class="bg-white dark:bg-[#1a1a2e] rounded-2xl border border-slate-200 dark:border-white/10 p-4">
        <p class="text-xs text-slate-500 dark:text-slate-400">Liquidado (filtro actual)</p>
        <p class="text-xl font-bold text-emerald-500">{{ currency(totales.totalLiquidado) }}</p>
      </div>
    </div>

    <!-- Filtros -->
    <div class="flex gap-3 flex-wrap items-center">
      <div class="w-44">
        <AppSelect v-model="filtroEstado" :options="estadoOptions" @change="() => { page = 1; load() }" />
      </div>
      <div v-if="isGerente && pendientesCount > 0" class="flex items-center gap-2">
        <button class="text-xs text-slate-500 dark:text-slate-400 hover:text-primary-500 transition-colors" @click="toggleAll">
          {{ selected.length === pendientesCount ? 'Deseleccionar todo' : 'Seleccionar pendientes' }}
        </button>
      </div>
      <button
        class="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 border border-emerald-200 dark:border-emerald-500/20 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50 ml-auto"
        :disabled="exporting || !comisiones.length"
        @click="exportar"
      >
        <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3"/>
        </svg>
        {{ exporting ? 'Exportando...' : 'Exportar Excel' }}
      </button>
    </div>

    <!-- Error -->
    <div v-if="error" class="rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 px-4 py-3 text-sm text-red-700 dark:text-red-400">{{ error }}</div>

    <!-- Loading -->
    <div v-if="loading" class="flex justify-center py-16">
      <svg class="w-8 h-8 animate-spin text-primary-500" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
      </svg>
    </div>

    <!-- Lista -->
    <div v-else class="space-y-2">
      <div
        v-if="!comisiones.length"
        class="text-center py-16 bg-white dark:bg-[#1a1a2e] rounded-2xl border border-slate-200 dark:border-white/10"
      >
        <p class="text-slate-500 dark:text-slate-400 font-medium">No hay comisiones para mostrar.</p>
      </div>

      <div
        v-for="c in comisiones"
        :key="c.id"
        class="rounded-2xl border p-4 transition-all"
        :class="[
          c.estado === 'LIQUIDADA'
            ? 'bg-slate-50 dark:bg-white/[0.03] border-slate-200 dark:border-white/10 opacity-70'
            : 'bg-white dark:bg-[#1a1a2e] border-slate-200 dark:border-white/10',
          selected.includes(c.id) ? '!opacity-100 !border-primary-300 dark:!border-primary-500/40 !bg-primary-50/30 dark:!bg-primary-500/5' : '',
        ]"
      >
        <div class="flex items-center gap-4">
          <!-- Checkbox custom -->
          <button
            v-if="isGerente && c.estado === 'PENDIENTE'"
            type="button"
            class="w-5 h-5 rounded flex items-center justify-center shrink-0 border-2 transition-all"
            :class="selected.includes(c.id)
              ? 'bg-primary-500 border-primary-500'
              : 'bg-white dark:bg-white/5 border-slate-300 dark:border-white/20 hover:border-primary-400 dark:hover:border-primary-500/60'"
            @click="toggleSelect(c.id)"
          >
            <svg v-if="selected.includes(c.id)" class="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="m4.5 12.75 6 6 9-13.5"/>
            </svg>
          </button>
          <!-- Ícono de check para liquidadas -->
          <div v-else-if="c.estado === 'LIQUIDADA'"
            class="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-500/15 flex items-center justify-center shrink-0"
          >
            <svg class="w-3 h-3 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
              <path stroke-linecap="round" stroke-linejoin="round" d="m4.5 12.75 6 6 9-13.5"/>
            </svg>
          </div>
          <div v-else class="w-5 shrink-0" />

          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 mb-0.5">
              <span class="text-sm font-semibold text-slate-900 dark:text-white">{{ c.vendedor?.nombre }}</span>
              <AppBadge :variant="c.estado === 'PENDIENTE' ? 'warning' : 'success'" size="sm">{{ c.estado }}</AppBadge>
            </div>
            <p class="text-xs text-slate-500 dark:text-slate-400 truncate">
              {{ c.venta?.vehiculo?.marca }} {{ c.venta?.vehiculo?.modelo }} {{ c.venta?.vehiculo?.anio }}
              · {{ c.venta?.cliente?.nombre }} {{ c.venta?.cliente?.apellido }}
            </p>
            <!-- Fecha de liquidación inline, más visible -->
            <p v-if="c.fechaLiquidacion" class="text-xs text-emerald-600 dark:text-emerald-400 mt-0.5 font-medium">
              Liquidada el {{ date(c.fechaLiquidacion) }}
            </p>
          </div>

          <div class="text-right shrink-0">
            <p class="text-sm font-bold" :class="c.estado === 'LIQUIDADA' ? 'text-slate-400 dark:text-slate-500' : 'text-slate-900 dark:text-white'">
              {{ currency(c.montoComision) }}
            </p>
            <p class="text-xs text-slate-400 dark:text-slate-500">{{ c.porcentaje }}% de {{ currency(c.montoBase) }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Paginación -->
    <AppPagination v-if="meta" :meta="meta" v-model="page" @update:modelValue="load" />

    <!-- Modal confirmar liquidación -->
    <AppModal v-model="showConfirm" title="Confirmar liquidación" size="sm">
      <div class="space-y-3">
        <p class="text-sm text-slate-700 dark:text-slate-300">
          Vas a marcar <strong class="text-slate-900 dark:text-white">{{ selected.length }} comisión(es)</strong> como liquidadas.
          Esta acción no se puede deshacer.
        </p>
      </div>
      <template #footer="{ close }">
        <button class="text-sm text-slate-600 dark:text-slate-300 px-4 py-2 rounded-xl border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors" @click="close">Cancelar</button>
        <button class="text-sm bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-2 rounded-xl font-semibold disabled:opacity-60 transition-all" :disabled="liquidando" @click="confirmarLiquidar">
          {{ liquidando ? 'Procesando...' : 'Liquidar' }}
        </button>
      </template>
    </AppModal>

  </div>
</template>
