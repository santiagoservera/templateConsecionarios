<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../../auth/store/authStore.js'
import { usePermisos }  from '../../../shared/composables/usePermisos.js'
import { useVentas } from '../composables/useVentas.js'
import AppTable from '../../../shared/components/AppTable.vue'
import AppBadge from '../../../shared/components/AppBadge.vue'
import AppPagination from '../../../shared/components/AppPagination.vue'
import AppSelect from '../../../shared/components/AppSelect.vue'
import { currency, date } from '../../../shared/utils/format.js'
import { useExport } from '../../../shared/composables/useExport.js'
import api from '../../../plugins/axios.js'

const { exporting, exportToExcel } = useExport()

function exportar() {
  exportToExcel(ventas.value, [
    { label: 'Cliente',      value: r => `${r.cliente?.nombre ?? ''} ${r.cliente?.apellido ?? ''}`.trim() },
    { label: 'Vehículo',     value: r => `${r.vehiculo?.marca ?? ''} ${r.vehiculo?.modelo ?? ''} ${r.vehiculo?.anio ?? ''}`.trim() },
    { label: 'Vendedor',     value: r => r.vendedor?.nombre ?? '' },
    { label: 'Precio final', value: r => Number(r.precioFinal) },
    { label: 'Forma de pago',value: r => r.formaPago },
    { label: 'Estado',       value: r => r.estado },
    { label: 'Fecha',        value: r => date(r.fechaReserva) },
  ], 'ventas')
}

const router    = useRouter()
const authStore = useAuthStore()
const { ventas, loading, error, meta, fetchVentas } = useVentas()

// ── Vendedores para el select (solo ADMIN / GERENTE los ven) ───────────────────
const vendedores   = ref([])
const { canDo } = usePermisos()
const canFilterVendedor = computed(() => ['ADMIN', 'GERENTE'].includes(authStore.userRole))

onMounted(async () => {
  if (canFilterVendedor.value) {
    try {
      const { data } = await api.get('/usuarios/vendedores')
      vendedores.value = data.data
    } catch { /* silencioso si no tiene permiso */ }
  }
  load()
})

// ── Filtros ────────────────────────────────────────────────────────────────────
const ESTADOS     = ['RESERVA', 'EN_TRAMITE', 'ENTREGADO', 'CANCELADO']
const FORMAS_PAGO = ['CONTADO', 'FINANCIADO', 'MIXTO']
const LABEL_ESTADO     = { RESERVA: 'Reserva', EN_TRAMITE: 'En trámite', ENTREGADO: 'Entregado', CANCELADO: 'Cancelado' }
const LABEL_FORMA_PAGO = { CONTADO: 'Contado', FINANCIADO: 'Financiado', MIXTO: 'Mixto' }

const filters = ref({
  estado:        '',
  formaPago:     '',
  vendedorId:    '',
  clienteNombre: '',
  fechaDesde:    '',
  fechaHasta:    '',
  page:          1,
  pageSize:      20,
})

// Búsqueda de cliente con debounce
let clienteTimer = null
function onClienteInput() {
  clearTimeout(clienteTimer)
  clienteTimer = setTimeout(applyFilters, 300)
}

function load() {
  fetchVentas({ ...filters.value })
}

function applyFilters() {
  filters.value.page = 1
  load()
}

function clearFilters() {
  filters.value = { estado: '', formaPago: '', vendedorId: '', clienteNombre: '', fechaDesde: '', fechaHasta: '', page: 1, pageSize: 20 }
  load()
}

function changePage(p) {
  filters.value.page = p
  load()
}

const hasActiveFilters = computed(() =>
  filters.value.estado || filters.value.formaPago || filters.value.vendedorId ||
  filters.value.clienteNombre || filters.value.fechaDesde || filters.value.fechaHasta
)

// ── Tabla ──────────────────────────────────────────────────────────────────────
const estadoOptions = computed(() => [
  { value: '', label: 'Estado (todos)' },
  ...ESTADOS.map(e => ({ value: e, label: LABEL_ESTADO[e] })),
])

const formaPagoOptions = computed(() => [
  { value: '', label: 'Forma de pago (todas)' },
  ...FORMAS_PAGO.map(f => ({ value: f, label: LABEL_FORMA_PAGO[f] })),
])

const vendedorOptions = computed(() => [
  { value: '', label: 'Vendedor (todos)' },
  ...vendedores.value.map(v => ({ value: v.id, label: v.nombre })),
])

const COLUMNS = [
  { key: 'cliente',      label: 'Cliente' },
  { key: 'vehiculo',     label: 'Vehículo' },
  { key: 'vendedor',     label: 'Vendedor' },
  { key: 'precioFinal',  label: 'Precio final', headerClass: 'text-right' },
  { key: 'formaPago',    label: 'Forma de pago' },
  { key: 'estado',       label: 'Estado' },
  { key: 'fechaReserva', label: 'Fecha' },
]
</script>

<template>
  <div class="p-6 space-y-5">

    <!-- Encabezado -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-slate-900 dark:text-white">Ventas</h1>
        <p class="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{{ meta.total }} venta{{ meta.total !== 1 ? 's' : '' }} en total</p>
      </div>
      <router-link v-if="canDo('ventas','crear')"
        to="/ventas/nueva"
        class="inline-flex items-center gap-2 bg-primary-500 hover:bg-primary-600 text-white text-sm font-semibold px-4 py-2.5 rounded-xl shadow-sm hover:shadow-glow active:scale-[0.98]"
      >
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
        Nueva venta
      </router-link>
    </div>

    <!-- Panel de filtros -->
    <div class="bg-white dark:bg-[#1a1a2e] rounded-2xl border border-slate-200 dark:border-white/5 p-4 space-y-3">
      <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">

        <!-- Estado -->
        <AppSelect v-model="filters.estado" :options="estadoOptions" @change="applyFilters" />

        <!-- Forma de pago -->
        <AppSelect v-model="filters.formaPago" :options="formaPagoOptions" @change="applyFilters" />

        <!-- Vendedor (ADMIN / GERENTE) -->
        <AppSelect v-if="canFilterVendedor" v-model="filters.vendedorId" :options="vendedorOptions" @change="applyFilters" />

        <!-- Cliente (buscador con debounce) -->
        <input
          v-model="filters.clienteNombre"
          type="text"
          placeholder="Buscar cliente..."
          class="rounded-xl border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 text-sm focus:border-primary-500 focus:ring-primary-500"
          @input="onClienteInput"
        />

        <!-- Fecha desde -->
        <div>
          <label class="block text-xs text-slate-500 dark:text-slate-400 mb-1">Desde</label>
          <input
            v-model="filters.fechaDesde"
            type="date"
            class="w-full rounded-xl border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 text-sm focus:border-primary-500 focus:ring-primary-500"
            @change="applyFilters"
          />
        </div>

        <!-- Fecha hasta -->
        <div>
          <label class="block text-xs text-slate-500 dark:text-slate-400 mb-1">Hasta</label>
          <input
            v-model="filters.fechaHasta"
            type="date"
            class="w-full rounded-xl border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 text-sm focus:border-primary-500 focus:ring-primary-500"
            @change="applyFilters"
          />
        </div>

      </div>

      <!-- Limpiar + Exportar -->
      <div class="flex items-center justify-between">
        <button
          v-if="hasActiveFilters"
          class="text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 px-3 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
          @click="clearFilters"
        >
          Limpiar filtros
        </button>
        <div v-else />
        <button
          class="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 border border-emerald-200 dark:border-emerald-500/20 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
          :disabled="exporting || !ventas.length"
          @click="exportar"
        >
          <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3"/>
          </svg>
          {{ exporting ? 'Exportando...' : 'Exportar Excel' }}
        </button>
      </div>
    </div>

    <!-- Error -->
    <div v-if="error" class="rounded-lg bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 px-4 py-3 text-sm text-red-700 dark:text-red-400">{{ error }}</div>

    <!-- Tabla -->
    <AppTable
      :columns="COLUMNS"
      :rows="ventas"
      :loading="loading"
      clickable
      @row-click="(row) => router.push(`/ventas/${row.id}`)"
    >
      <template #cell-cliente="{ row }">
        {{ row.cliente?.apellido }}, {{ row.cliente?.nombre }}
      </template>
      <template #cell-vehiculo="{ row }">
        <span class="text-xs">{{ row.vehiculo?.marca }} {{ row.vehiculo?.modelo }} {{ row.vehiculo?.anio }}</span>
      </template>
      <template #cell-vendedor="{ row }">
        {{ row.vendedor?.nombre }}
      </template>
      <template #cell-precioFinal="{ value }">
        <span class="font-semibold text-slate-800 dark:text-white block text-right">{{ currency(value) }}</span>
      </template>
      <template #cell-formaPago="{ value }">
        <AppBadge :value="value" size="xs" />
      </template>
      <template #cell-estado="{ value }">
        <AppBadge :value="value" />
      </template>
      <template #cell-fechaReserva="{ value }">
        <span class="text-xs text-slate-400">{{ date(value) }}</span>
      </template>
      <template #empty>
        No hay ventas que coincidan con los filtros.
      </template>
    </AppTable>

    <!-- Paginación -->
    <AppPagination
      v-if="!loading"
      :page="meta.page"
      :total="meta.total"
      :page-size="meta.pageSize"
      @update:page="changePage"
    />

  </div>
</template>
