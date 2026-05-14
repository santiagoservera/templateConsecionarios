<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { usePermisos } from '../../../shared/composables/usePermisos.js'
import { usePlanesPago } from '../composables/usePlanesPago.js'
import { useToast } from '../../../shared/composables/useToast.js'
import AppModal from '../../../shared/components/AppModal.vue'
import AppSelect from '../../../shared/components/AppSelect.vue'
import AppPagination from '../../../shared/components/AppPagination.vue'
import { currency, date } from '../../../shared/utils/format.js'
import { useExport } from '../../../shared/composables/useExport.js'
import api from '../../../plugins/axios.js'

const { exporting, exportToExcel } = useExport()

function exportar() {
  exportToExcel(planes.value, [
    { label: 'Cliente',         value: r => `${r.cliente?.nombre ?? ''} ${r.cliente?.apellido ?? ''}`.trim() },
    { label: 'Vehículo',        value: r => `${r.vehiculo?.marca ?? ''} ${r.vehiculo?.modelo ?? ''} ${r.vehiculo?.anio ?? ''}`.trim() },
    { label: 'Precio total',    value: r => Number(r.precioTotal) },
    { label: 'Cuotas',          value: r => r.cantCuotas },
    { label: 'Valor cuota',     value: r => Number(r.valorCuota) },
    { label: 'Monto pagado',    value: r => Number(r.montoPagado) },
    { label: 'Cuotas pagas',    value: r => r._stats?.pagadas ?? 0 },
    { label: 'Cuotas vencidas', value: r => r._stats?.vencidas ?? 0 },
    { label: 'Estado',          value: r => r.estado },
    { label: 'Entregado',       value: r => r.vehiculoEntregado ? 'Sí' : 'No' },
  ], 'planes_pago')
}

const router    = useRouter()
const toast     = useToast()
const { canDo } = usePermisos()
const { planes, loading, error, meta, fetchPlanes, createPlan } = usePlanesPago()

const canCreate = computed(() => canDo('planesDNI', 'crear'))

const filters = ref({ estado: '', page: 1, pageSize: 20 })

const ESTADOS = ['ACTIVO','SUSPENDIDO','COMPLETADO','CANCELADO']
const LABEL_ESTADO = { ACTIVO:'Activo', SUSPENDIDO:'Suspendido', COMPLETADO:'Completado', CANCELADO:'Cancelado' }
const ESTADO_STYLE = {
  ACTIVO:     'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400',
  SUSPENDIDO: 'bg-amber-500/15 text-amber-700 dark:text-amber-400',
  COMPLETADO: 'bg-blue-500/15 text-blue-700 dark:text-blue-400',
  CANCELADO:  'bg-red-500/15 text-red-700 dark:text-red-400',
}

const estadoOptions = computed(() => [
  { value: '', label: 'Estado (todos)' },
  ...ESTADOS.map(e => ({ value: e, label: LABEL_ESTADO[e] })),
])

function load() { fetchPlanes({ ...filters.value }) }
function changePage(p) { filters.value.page = p; load() }
onMounted(load)

// ── Modal nuevo plan ───────────────────────────────────────────────────────────
const showModal  = ref(false)
const savingPlan = ref(false)
const planError  = ref('')

// Búsqueda de cliente
const clienteQuery    = ref('')
const clientesFound   = ref([])
const clienteSel      = ref(null)
let cliTimeout = null

async function buscarClientes() {
  clearTimeout(cliTimeout)
  if (!clienteQuery.value.trim()) { clientesFound.value = []; return }
  cliTimeout = setTimeout(async () => {
    try { const { data } = await api.get('/clientes', { params: { nombre: clienteQuery.value, pageSize: 8 } }); clientesFound.value = data.data ?? [] }
    catch { clientesFound.value = [] }
  }, 300)
}
function selCliente(c) { clienteSel.value = c; clienteQuery.value = `${c.apellido}, ${c.nombre}`; clientesFound.value = [] }

// Búsqueda de vehículo
const vehiculoQuery   = ref('')
const vehiculosFound  = ref([])
const vehiculoSel     = ref(null)
let vehTimeout = null

async function buscarVehiculos() {
  clearTimeout(vehTimeout)
  if (!vehiculoQuery.value.trim()) { vehiculosFound.value = []; return }
  vehTimeout = setTimeout(async () => {
    try { const { data } = await api.get('/vehiculos', { params: { marca: vehiculoQuery.value, estado: 'DISPONIBLE', pageSize: 8 } }); vehiculosFound.value = data.data ?? [] }
    catch { vehiculosFound.value = [] }
  }, 300)
}
function selVehiculo(v) { vehiculoSel.value = v; vehiculoQuery.value = `${v.marca} ${v.modelo} ${v.anio}`; vehiculosFound.value = [] }

const formPlan = ref({ precioTotal: '', cantCuotas: 12, valorCuota: '', montoEntrega: '', observaciones: '' })

// Auto-calcular valor cuota
function calcCuota() {
  if (formPlan.value.precioTotal && formPlan.value.cantCuotas)
    formPlan.value.valorCuota = Math.ceil(Number(formPlan.value.precioTotal) / Number(formPlan.value.cantCuotas))
}

function abrirModal() {
  clienteSel.value = null; clienteQuery.value = ''; clientesFound.value = []
  vehiculoSel.value = null; vehiculoQuery.value = ''; vehiculosFound.value = []
  formPlan.value = { precioTotal: '', cantCuotas: 12, valorCuota: '', montoEntrega: '', observaciones: '' }
  planError.value = ''
  showModal.value = true
}

async function guardarPlan() {
  if (!clienteSel.value)  { planError.value = 'Seleccioná un cliente'; return }
  if (!vehiculoSel.value) { planError.value = 'Seleccioná un vehículo'; return }
  if (!formPlan.value.precioTotal || !formPlan.value.cantCuotas || !formPlan.value.valorCuota) { planError.value = 'Completá precio, cuotas y valor de cuota'; return }
  savingPlan.value = true; planError.value = ''
  try {
    await createPlan({
      clienteId:    clienteSel.value.id,
      vehiculoId:   vehiculoSel.value.id,
      precioTotal:  Number(formPlan.value.precioTotal),
      cantCuotas:   Number(formPlan.value.cantCuotas),
      valorCuota:   Number(formPlan.value.valorCuota),
      montoEntrega: formPlan.value.montoEntrega ? Number(formPlan.value.montoEntrega) : undefined,
      observaciones:formPlan.value.observaciones || undefined,
    })
    toast.success('Plan creado', `${clienteSel.value.nombre} — ${vehiculoSel.value.marca} ${vehiculoSel.value.modelo}`)
    showModal.value = false
    load()
  } catch (err) { planError.value = err.response?.data?.error ?? 'Error al crear' }
  finally { savingPlan.value = false }
}

const inputCls = 'w-full rounded-xl border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 text-sm focus:border-primary-500 focus:ring-primary-500'
</script>

<template>
  <div class="p-6 space-y-5 animate-fade-in">

    <!-- Header -->
    <div class="flex items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold text-slate-900 dark:text-white">Planes de pago DNI</h1>
        <p class="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Financiamiento propio de la concesionaria en cuotas.</p>
      </div>
      <button v-if="canCreate"
        class="inline-flex items-center gap-2 bg-primary-500 hover:bg-primary-600 text-white text-sm font-semibold px-4 py-2.5 rounded-xl shadow-sm hover:shadow-glow active:scale-[0.98]"
        @click="abrirModal">
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15"/></svg>
        Nuevo plan
      </button>
    </div>

    <!-- Filtros -->
    <div class="flex gap-3 items-center flex-wrap">
      <AppSelect v-model="filters.estado" :options="estadoOptions" class="w-48" @change="load" />
      <button
        class="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 border border-emerald-200 dark:border-emerald-500/20 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50 ml-auto"
        :disabled="exporting || !planes.length"
        @click="exportar"
      >
        <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3"/>
        </svg>
        {{ exporting ? 'Exportando...' : 'Exportar Excel' }}
      </button>
    </div>

    <!-- Error / Loading -->
    <div v-if="error" class="rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 px-4 py-3 text-sm text-red-700 dark:text-red-400">{{ error }}</div>
    <div v-if="loading" class="flex justify-center py-16">
      <svg class="w-8 h-8 animate-spin text-primary-500" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg>
    </div>

    <!-- Empty -->
    <div v-else-if="!planes.length" class="text-center py-20 bg-white dark:bg-[#1a1a2e] rounded-2xl border border-slate-200 dark:border-white/10 shadow-card dark:shadow-none">
      <svg class="w-12 h-12 mx-auto mb-3 text-slate-200 dark:text-white/10" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1">
        <path stroke-linecap="round" stroke-linejoin="round" d="M15 9h3.75M15 12h3.75M15 15h3.75M4.5 19.5h15a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25v10.5A2.25 2.25 0 0 0 4.5 19.5Zm6-10.125a1.875 1.875 0 1 1-3.75 0 1.875 1.875 0 0 1 3.75 0Zm1.294 6.336a6.721 6.721 0 0 1-3.17.789 6.721 6.721 0 0 1-3.168-.789 3.376 3.376 0 0 1 6.338 0Z"/>
      </svg>
      <p class="font-medium text-slate-500 dark:text-slate-400">Sin planes de pago</p>
      <p class="text-sm mt-1 text-slate-400">Creá el primer plan para un cliente.</p>
    </div>

    <!-- Lista -->
    <div v-else class="space-y-3">
      <div
        v-for="p in planes" :key="p.id"
        class="bg-white dark:bg-[#1a1a2e] rounded-2xl border shadow-card dark:shadow-none overflow-hidden cursor-pointer transition-all hover:shadow-card-lg dark:hover:bg-[#1e1e35] hover:-translate-y-0.5 group"
        :class="p._stats?.vencidas > 0 ? 'border-red-200 dark:border-red-500/30' : 'border-slate-200 dark:border-white/10'"
        @click="router.push(`/planes-pago/${p.id}`)"
      >
        <div class="px-5 py-4 flex items-start gap-4">
          <!-- Info -->
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 flex-wrap mb-1">
              <span class="text-sm font-bold text-slate-900 dark:text-white">
                {{ p.cliente?.apellido }}, {{ p.cliente?.nombre }}
              </span>
              <span class="text-[10px] font-semibold px-2 py-0.5 rounded-full" :class="ESTADO_STYLE[p.estado]">
                {{ LABEL_ESTADO[p.estado] }}
              </span>
              <span v-if="p._stats?.vencidas > 0" class="text-[10px] font-semibold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 px-2 py-0.5 rounded-full border border-red-200 dark:border-red-500/20">
                {{ p._stats.vencidas }} vencida{{ p._stats.vencidas !== 1 ? 's' : '' }}
              </span>
              <span v-if="p.vehiculoEntregado" class="text-[10px] font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 px-2 py-0.5 rounded-full">
                Auto entregado
              </span>
            </div>
            <p class="text-xs text-slate-500 dark:text-slate-400">
              {{ p.vehiculo?.marca }} {{ p.vehiculo?.modelo }} {{ p.vehiculo?.anio }}
              <span v-if="p.vehiculo?.patente" class="font-mono bg-slate-100 dark:bg-white/10 px-1.5 rounded ml-1">{{ p.vehiculo.patente }}</span>
            </p>

            <!-- Barra progreso -->
            <div v-if="p._stats" class="mt-3">
              <div class="flex items-center justify-between mb-1">
                <span class="text-[10px] text-slate-400 dark:text-slate-500">
                  <strong class="text-slate-700 dark:text-slate-200 font-mono">{{ p._stats.pagadas }}</strong>
                  / {{ p._stats.totalCuotas }} cuotas · {{ currency(p._stats.montoPagado) }}
                </span>
                <span class="text-[10px] font-mono text-slate-400 dark:text-slate-500">{{ p._stats.porcentaje }}%</span>
              </div>
              <div class="h-1.5 bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
                <div class="h-full rounded-full transition-all duration-700"
                  :class="p._stats.vencidas > 0 ? 'bg-red-400' : 'bg-emerald-500'"
                  :style="{ width: `${p._stats.porcentaje}%` }"/>
              </div>
            </div>
          </div>

          <!-- Derecha -->
          <div class="shrink-0 text-right">
            <p class="text-base font-bold font-mono text-slate-900 dark:text-white">{{ currency(p.precioTotal) }}</p>
            <p class="text-[10px] text-slate-400 dark:text-slate-500">{{ p.cantCuotas }} cuotas de {{ currency(p.valorCuota) }}</p>
            <p v-if="p._stats?.proximaCuota" class="text-[10px] mt-1 text-slate-400 dark:text-slate-500">
              Prox. {{ date(p._stats.proximaCuota) }}
            </p>
          </div>

          <svg class="w-4 h-4 text-slate-300 dark:text-white/20 group-hover:text-primary-500 transition-colors shrink-0 mt-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5"/>
          </svg>
        </div>
      </div>
    </div>

    <AppPagination v-if="!loading" :page="meta.page" :total="meta.total" :page-size="meta.pageSize" @update:page="changePage"/>

    <!-- Modal nuevo plan -->
    <AppModal v-model="showModal" title="Nuevo plan de pago DNI" size="md">
      <div class="space-y-4">
        <p v-if="planError" class="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl px-3 py-2">{{ planError }}</p>

        <!-- Cliente -->
        <div>
          <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Cliente *</label>
          <div class="relative">
            <input v-model="clienteQuery" type="text" placeholder="Buscar por apellido..." :class="inputCls" @input="buscarClientes"/>
            <div v-if="clientesFound.length" class="absolute z-10 w-full mt-1 bg-white dark:bg-[#1a1a2e] border border-slate-200 dark:border-white/10 rounded-xl shadow-lg max-h-40 overflow-y-auto">
              <button v-for="c in clientesFound" :key="c.id" type="button"
                class="w-full text-left px-4 py-2.5 text-sm hover:bg-slate-50 dark:hover:bg-white/5 border-b border-slate-200 dark:border-white/10 last:border-0"
                @click="selCliente(c)">
                <span class="font-medium text-slate-800 dark:text-white">{{ c.apellido }}, {{ c.nombre }}</span>
                <span class="text-slate-400 dark:text-slate-500 text-xs ml-2">{{ c.dniCuit }}</span>
              </button>
            </div>
          </div>
          <p v-if="clienteSel" class="text-xs text-emerald-600 dark:text-emerald-400 mt-1">✓ {{ clienteSel.apellido }}, {{ clienteSel.nombre }}</p>
        </div>

        <!-- Vehículo -->
        <div>
          <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Vehículo disponible *</label>
          <div class="relative">
            <input v-model="vehiculoQuery" type="text" placeholder="Buscar por marca..." :class="inputCls" @input="buscarVehiculos"/>
            <div v-if="vehiculosFound.length" class="absolute z-10 w-full mt-1 bg-white dark:bg-[#1a1a2e] border border-slate-200 dark:border-white/10 rounded-xl shadow-lg max-h-40 overflow-y-auto">
              <button v-for="v in vehiculosFound" :key="v.id" type="button"
                class="w-full text-left px-4 py-2.5 text-sm text-slate-800 dark:text-white hover:bg-slate-50 dark:hover:bg-white/5 border-b border-slate-200 dark:border-white/10 last:border-0"
                @click="selVehiculo(v)">
                {{ v.marca }} {{ v.modelo }} {{ v.anio }}
                <span class="text-slate-400 dark:text-slate-500 ml-2 font-mono">{{ currency(v.precioVenta) }}</span>
              </button>
            </div>
          </div>
          <p v-if="vehiculoSel" class="text-xs text-emerald-600 dark:text-emerald-400 mt-1">✓ {{ vehiculoSel.marca }} {{ vehiculoSel.modelo }} {{ vehiculoSel.anio }}</p>
        </div>

        <!-- Precios -->
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Precio total *</label>
            <input v-model.number="formPlan.precioTotal" type="number" min="0" :class="inputCls" @blur="calcCuota"/>
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Cantidad cuotas *</label>
            <input v-model.number="formPlan.cantCuotas" type="number" min="1" :class="inputCls" @blur="calcCuota"/>
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Valor cuota *</label>
            <input v-model.number="formPlan.valorCuota" type="number" min="0" :class="inputCls"/>
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Mínimo para retirar
              <span class="text-xs font-normal text-slate-400">(opcional)</span>
            </label>
            <input v-model.number="formPlan.montoEntrega" type="number" min="0" placeholder="Sin mínimo" :class="inputCls"/>
          </div>
          <div class="col-span-2">
            <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Observaciones</label>
            <textarea v-model="formPlan.observaciones" rows="2" :class="inputCls + ' resize-none'"/>
          </div>
        </div>
      </div>

      <template #footer="{ close }">
        <button class="text-sm text-slate-600 dark:text-slate-300 px-4 py-2 rounded-xl border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors" @click="close">Cancelar</button>
        <button class="text-sm bg-primary-500 hover:bg-primary-600 text-white px-5 py-2 rounded-xl font-semibold disabled:opacity-60 transition-all shadow-sm" :disabled="savingPlan" @click="guardarPlan">
          {{ savingPlan ? 'Creando...' : 'Crear plan' }}
        </button>
      </template>
    </AppModal>

  </div>
</template>
