<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../../auth/store/authStore.js'
import { usePermisos }  from '../../../shared/composables/usePermisos.js'
import { useClientes } from '../composables/useClientes.js'
import { useToast } from '../../../shared/composables/useToast.js'
import AppTable from '../../../shared/components/AppTable.vue'
import AppBadge from '../../../shared/components/AppBadge.vue'
import AppPagination from '../../../shared/components/AppPagination.vue'
import AppModal from '../../../shared/components/AppModal.vue'
import AppSelect from '../../../shared/components/AppSelect.vue'
import { useExport } from '../../../shared/composables/useExport.js'
import api from '../../../plugins/axios.js'

const { exporting, exportToExcel } = useExport()

function exportar() {
  exportToExcel(clientes.value, [
    { label: 'Nombre',   value: r => r.nombre },
    { label: 'Apellido', value: r => r.apellido },
    { label: 'DNI/CUIT', value: r => r.dniCuit ?? '' },
    { label: 'Teléfono', value: r => r.telefono ?? '' },
    { label: 'Email',    value: r => r.email ?? '' },
    { label: 'Origen',   value: r => r.origen },
    { label: 'Vendedor', value: r => r.vendedor?.nombre ?? '' },
  ], 'clientes')
}

const router    = useRouter()
const authStore = useAuthStore()
const { clientes, loading, error, meta, fetchClientes, createCliente, updateCliente } = useClientes()
const toast     = useToast()

// ── Permisos ───────────────────────────────────────────────────────────────────
const { canDo } = usePermisos()
// esGestor controla visibilidad de datos de otros vendedores (rol jerárquico)
const esGestor = computed(() => ['ADMIN', 'GERENTE'].includes(authStore.userRole))

// ── Vendedores (para filtro y asignación) ─────────────────────────────────────
const vendedores = ref([])

onMounted(async () => {
  if (esGestor.value) {
    try {
      const { data } = await api.get('/usuarios/vendedores')
      vendedores.value = data.data
    } catch { /* silencioso */ }
  }
  load()
})

// ── Búsqueda y filtros ────────────────────────────────────────────────────────
const search         = ref('')
const filtroVendedor = ref('')
const filtroVenta    = ref('')

const ESTADOS_VENTA = [
  { value: '',          label: 'Cualquier estado' },
  { value: 'RESERVA',   label: 'En reserva' },
  { value: 'EN_TRAMITE',label: 'En trámite' },
  { value: 'ENTREGADO', label: 'Entregado' },
  { value: 'SIN_VENTA', label: 'Sin venta activa' },
]

const LABEL_VENTA = {
  RESERVA:    { label: 'Reserva',    color: 'bg-amber-100 dark:bg-amber-500/15 text-amber-700 dark:text-amber-400' },
  EN_TRAMITE: { label: 'En trámite', color: 'bg-blue-100 dark:bg-blue-500/15 text-blue-700 dark:text-blue-400' },
  ENTREGADO:  { label: 'Entregado',  color: 'bg-emerald-100 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400' },
}

function buildParams() {
  const params = { page: page.value, pageSize: 20 }
  if (search.value) params.nombre = search.value
  if (filtroVendedor.value === 'SIN') params.sinVendedor = true
  else if (filtroVendedor.value)      params.vendedorId  = filtroVendedor.value
  if (filtroVenta.value)              params.estadoVenta  = filtroVenta.value
  return params
}

const page = ref(1)

function load() { fetchClientes(buildParams()) }
function onSearch() { page.value = 1; load() }
function onFiltroVendedor() { page.value = 1; load() }
function onFiltroVenta() { page.value = 1; load() }
function changePage(p) { page.value = p; load() }

// ── Modal: asignar vendedor ────────────────────────────────────────────────────
const asignandoCliente  = ref(null)
const vendedorAsignado  = ref('')
const asignandoSaving   = ref(false)
const asignandoError    = ref('')

function abrirAsignar(cliente) {
  asignandoCliente.value = cliente
  vendedorAsignado.value = cliente.vendedorId ?? ''
  asignandoError.value   = ''
}

function cerrarAsignar() { asignandoCliente.value = null }

const showAsignar = computed({
  get: () => !!asignandoCliente.value,
  set: (val) => { if (!val) cerrarAsignar() },
})

async function guardarAsignacion() {
  if (!vendedorAsignado.value) { asignandoError.value = 'Seleccioná un vendedor'; return }
  asignandoSaving.value = true
  asignandoError.value  = ''
  try {
    await updateCliente(asignandoCliente.value.id, { vendedorId: Number(vendedorAsignado.value) })
    cerrarAsignar()
    toast.success('Vendedor asignado', 'El cliente fue actualizado.')
    load()
  } catch (err) {
    asignandoError.value = err.response?.data?.error ?? 'Error al asignar'
    toast.error('Error', err.response?.data?.error ?? 'Ocurrió un error')
  } finally {
    asignandoSaving.value = false
  }
}

// ── Modal: nuevo cliente ───────────────────────────────────────────────────────
const showModal   = ref(false)
const newForm     = ref({ nombre: '', apellido: '', dniCuit: '', telefono: '', email: '', origen: 'VISITA', vendedorId: '' })
const modalError  = ref('')
const modalSaving = ref(false)

const ORIGENES     = ['VISITA', 'WHATSAPP', 'INSTAGRAM', 'REFERIDO', 'WEB', 'OTRO']
const LABEL_ORIGEN = { VISITA: 'Visita', WHATSAPP: 'WhatsApp', INSTAGRAM: 'Instagram', REFERIDO: 'Referido', WEB: 'Web', OTRO: 'Otro' }

const filtroVendedorOptions = computed(() => [
  { value: '', label: 'Todos los clientes' },
  { value: 'SIN', label: 'Sin vendedor asignado' },
  ...vendedores.value.map(v => ({ value: v.id, label: v.nombre })),
])

const asignarVendedorOptions = computed(() => [
  { value: '', label: 'Seleccioná un vendedor...' },
  ...vendedores.value.map(v => ({ value: v.id, label: v.nombre })),
])

const origenOptions = computed(() =>
  ORIGENES.map(o => ({ value: o, label: LABEL_ORIGEN[o] }))
)

const vendedorIdOptions = computed(() => [
  { value: '', label: 'Sin asignar' },
  ...vendedores.value.map(v => ({ value: v.id, label: v.nombre })),
])

function abrirNuevo() {
  newForm.value  = { nombre: '', apellido: '', dniCuit: '', telefono: '', email: '', origen: 'VISITA', vendedorId: '' }
  modalError.value = ''
  showModal.value  = true
}

async function saveCliente() {
  if (!newForm.value.nombre || !newForm.value.apellido) {
    modalError.value = 'Nombre y apellido son requeridos'
    return
  }
  modalError.value  = ''
  modalSaving.value = true
  try {
    const payload = { ...newForm.value }
    if (!payload.email)      delete payload.email
    if (!payload.vendedorId) delete payload.vendedorId
    else payload.vendedorId = Number(payload.vendedorId)
    await createCliente(payload)
    toast.success('Cliente creado', 'El cliente fue registrado correctamente.')
    showModal.value = false
    load()
  } catch (err) {
    modalError.value = err.response?.data?.error ?? 'Error al guardar'
    toast.error('Error', err.response?.data?.error ?? 'Ocurrió un error')
  } finally {
    modalSaving.value = false
  }
}

// ── Columnas ───────────────────────────────────────────────────────────────────
const COLUMNS = computed(() => {
  const cols = [
    { key: 'nombre',   label: 'Nombre' },
    { key: 'dniCuit',  label: 'DNI / CUIT' },
    { key: 'telefono', label: 'Teléfono' },
    { key: 'origen',   label: 'Origen' },
    { key: 'vendedor', label: 'Vendedor' },
    { key: 'venta',    label: 'Estado de venta' },
  ]
  if (esGestor.value) cols.push({ key: 'acciones', label: '' })
  return cols
})
</script>

<template>
  <div class="p-6 space-y-5">

    <!-- Encabezado -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-slate-900 dark:text-white">Clientes</h1>
        <p class="text-sm text-slate-500 mt-0.5">{{ meta.total }} cliente{{ meta.total !== 1 ? 's' : '' }} en total</p>
      </div>
      <button v-if="canDo('clientes','crear')"
        class="inline-flex items-center gap-2 bg-primary-500 hover:bg-primary-600 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-all shadow-sm hover:shadow-glow active:scale-[0.98]"
        @click="abrirNuevo"
      >
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
        Nuevo cliente
      </button>
    </div>

    <!-- Filtros -->
    <div class="bg-white dark:bg-[#1a1a2e] rounded-2xl border border-slate-200 dark:border-white/10 p-3 flex flex-wrap gap-2 items-center">
      <!-- Buscador -->
      <div class="relative flex-1 min-w-52">
        <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 dark:text-slate-500 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"/>
        </svg>
        <input v-model="search" type="text" placeholder="Nombre, DNI o teléfono..."
          class="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 text-sm focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-colors"
          @input="onSearch"/>
      </div>

      <!-- Divider -->
      <div class="w-px h-6 bg-slate-200 dark:bg-white/10 shrink-0"/>

      <!-- Vendedor -->
      <div v-if="esGestor" class="w-44 shrink-0">
        <AppSelect v-model="filtroVendedor" :options="filtroVendedorOptions" @change="onFiltroVendedor"/>
      </div>

      <!-- Estado de venta — chips horizontales -->
      <div class="flex items-center gap-1.5 flex-wrap">
        <button v-for="opt in ESTADOS_VENTA" :key="opt.value"
          class="text-xs px-3 py-1.5 rounded-full border font-medium transition-all whitespace-nowrap"
          :class="filtroVenta === opt.value
            ? 'bg-primary-500 border-primary-500 text-white'
            : 'border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-400 hover:border-primary-300 dark:hover:border-primary-500/40 hover:text-primary-600 dark:hover:text-primary-400'"
          @click="filtroVenta = opt.value; onFiltroVenta()">
          {{ opt.label }}
        </button>
      </div>

      <!-- Exportar (separado a la derecha) -->
      <button
        class="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 border border-emerald-200 dark:border-emerald-500/20 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50 ml-auto shrink-0"
        :disabled="exporting || !clientes.length"
        @click="exportar">
        <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3"/>
        </svg>
        {{ exporting ? 'Exportando...' : 'Excel' }}
      </button>
    </div>

    <!-- Error -->
    <div v-if="error" class="rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 px-4 py-3 text-sm text-red-700 dark:text-red-400">{{ error }}</div>

    <!-- Tabla -->
    <AppTable
      :columns="COLUMNS"
      :rows="clientes"
      :loading="loading"
      clickable
      @row-click="(row) => router.push(`/clientes/${row.id}`)"
    >
      <template #cell-nombre="{ row }">
        <span class="font-medium text-slate-800 dark:text-slate-100">{{ row.apellido }}, {{ row.nombre }}</span>
      </template>

      <template #cell-dniCuit="{ value }">
        {{ value || '—' }}
      </template>

      <template #cell-origen="{ value }">
        <AppBadge :value="value" :label="LABEL_ORIGEN[value]" size="xs" />
      </template>

      <template #cell-vendedor="{ value }">
        {{ value?.nombre ?? '—' }}
      </template>

      <template #cell-venta="{ row }">
        <div v-if="row.ventas?.length">
          <div class="flex items-center gap-1.5">
            <span class="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full"
              :class="LABEL_VENTA[row.ventas[0].estado]?.color ?? 'bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-slate-400'">
              <span class="w-1.5 h-1.5 rounded-full inline-block"
                :class="{
                  'bg-amber-500':   row.ventas[0].estado === 'RESERVA',
                  'bg-blue-500':    row.ventas[0].estado === 'EN_TRAMITE',
                  'bg-emerald-500': row.ventas[0].estado === 'ENTREGADO',
                }"/>
              {{ LABEL_VENTA[row.ventas[0].estado]?.label ?? row.ventas[0].estado }}
            </span>
          </div>
          <p v-if="row.ventas[0].vehiculo" class="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 truncate max-w-[140px]">
            {{ row.ventas[0].vehiculo.marca }} {{ row.ventas[0].vehiculo.modelo }} {{ row.ventas[0].vehiculo.anio }}
          </p>
        </div>
        <span v-else class="text-xs text-slate-300 dark:text-slate-600">—</span>
      </template>

      <!-- Columna acciones (ADMIN / GERENTE) -->
      <template #cell-acciones="{ row }">
        <div class="flex justify-end">
          <button
            class="text-xs font-medium px-2.5 py-1.5 rounded-lg border transition-colors"
            :class="row.vendedor
              ? 'text-slate-500 dark:text-slate-400 border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20 hover:bg-slate-50 dark:hover:bg-white/5'
              : 'text-primary-500 border-primary-200 dark:border-primary-500/30 hover:border-primary-400 hover:bg-primary-50 dark:hover:bg-primary-500/10'"
            @click.stop="abrirAsignar(row)"
          >
            {{ row.vendedor ? 'Reasignar' : 'Asignar vendedor' }}
          </button>
        </div>
      </template>

      <template #empty>
        No se encontraron clientes con los filtros aplicados.
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

    <!-- Modal: asignar vendedor -->
    <AppModal v-model="showAsignar" title="Asignar vendedor" size="sm">
      <div class="space-y-4">
        <p class="text-sm text-slate-600">
          Cliente: <strong>{{ asignandoCliente?.apellido }}, {{ asignandoCliente?.nombre }}</strong>
        </p>
        <p v-if="asignandoError" class="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {{ asignandoError }}
        </p>
        <div>
          <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Vendedor *</label>
          <AppSelect v-model="vendedorAsignado" :options="asignarVendedorOptions" />
        </div>
      </div>
      <template #footer>
        <button
          class="text-sm text-slate-600 dark:text-slate-400 px-4 py-2 rounded-xl border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
          @click="cerrarAsignar"
        >
          Cancelar
        </button>
        <button
          class="text-sm bg-primary-500 hover:bg-primary-600 text-white px-5 py-2 rounded-xl font-semibold disabled:opacity-60 transition-all shadow-sm hover:shadow-glow"
          :disabled="asignandoSaving"
          @click="guardarAsignacion"
        >
          {{ asignandoSaving ? 'Guardando...' : 'Asignar' }}
        </button>
      </template>
    </AppModal>

    <!-- Modal: nuevo cliente -->
    <AppModal v-model="showModal" title="Nuevo cliente" size="md">
      <form class="space-y-4" @submit.prevent="saveCliente">
        <p v-if="modalError" class="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{{ modalError }}</p>

        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Nombre *</label>
            <input v-model="newForm.nombre" type="text" required placeholder="Juan"
              class="w-full rounded-xl border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 text-sm focus:border-primary-500 focus:ring-primary-500" />
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Apellido *</label>
            <input v-model="newForm.apellido" type="text" required placeholder="García"
              class="w-full rounded-xl border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 text-sm focus:border-primary-500 focus:ring-primary-500" />
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">DNI / CUIT</label>
            <input v-model="newForm.dniCuit" type="text" placeholder="30123456"
              class="w-full rounded-xl border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 text-sm focus:border-primary-500 focus:ring-primary-500" />
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Teléfono</label>
            <input v-model="newForm.telefono" type="text" placeholder="1145678901"
              class="w-full rounded-xl border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 text-sm focus:border-primary-500 focus:ring-primary-500" />
          </div>
          <div class="col-span-2">
            <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Email</label>
            <input v-model="newForm.email" type="email" placeholder="juan@example.com"
              class="w-full rounded-xl border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 text-sm focus:border-primary-500 focus:ring-primary-500" />
          </div>
          <div :class="esGestor ? '' : 'col-span-2'">
            <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Origen</label>
            <AppSelect v-model="newForm.origen" :options="origenOptions" />
          </div>

          <!-- Asignar vendedor al crear (solo ADMIN / GERENTE) -->
          <div v-if="esGestor">
            <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Vendedor
              <span class="text-slate-400 font-normal">(opcional)</span>
            </label>
            <AppSelect v-model="newForm.vendedorId" :options="vendedorIdOptions" />
          </div>
        </div>
      </form>

      <template #footer="{ close }">
        <button class="text-sm text-slate-600 dark:text-slate-400 px-4 py-2 rounded-xl border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors" @click="close">
          Cancelar
        </button>
        <button
          class="text-sm bg-primary-600 hover:bg-primary-700 text-white px-5 py-2 rounded-lg disabled:opacity-60 font-medium transition-colors"
          :disabled="modalSaving"
          @click="saveCliente"
        >
          {{ modalSaving ? 'Guardando...' : 'Crear cliente' }}
        </button>
      </template>
    </AppModal>

  </div>
</template>
