<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { usePermisos } from '../../../shared/composables/usePermisos.js'
import { useVehiculos } from '../composables/useVehiculos.js'
import AppBadge from '../../../shared/components/AppBadge.vue'
import AppSelect from '../../../shared/components/AppSelect.vue'
import { currency, number, date } from '../../../shared/utils/format.js'
import api from '../../../plugins/axios.js'

const route     = useRoute()
const router    = useRouter()
const { canDo } = usePermisos()
const { vehiculo, loading: vLoading, fetchVehiculo, fetchCostoReal } = useVehiculos()

const vehiculoId = computed(() => Number(route.params.id))
const canEdit    = computed(() => canDo('stock', 'editar'))
const canSeeCost = computed(() => canDo('stock', 'editar'))  // solo quienes editan ven costos

// ── Tabs ───────────────────────────────────────────────────────────────────────
const TABS     = ['Info', 'Gastos', 'Preparación']
const activeTab = ref('Info')

// ── Datos de tabs secundarios ──────────────────────────────────────────────────
const gastos        = ref([])
const preparaciones = ref([])
const costoReal     = ref(null)
const tabLoading    = ref(false)

// ── Formulario inline — Gastos ─────────────────────────────────────────────────
const showGastoForm = ref(false)
const gastoForm     = reactive({ concepto: '', monto: '', proveedor: '' })
const gastoError    = ref('')
const gastoSaving   = ref(false)

// ── Formulario inline — Preparación ───────────────────────────────────────────
const showPrepForm = ref(false)
const prepForm     = reactive({ tipo: 'LAVADO', descripcion: '', proveedor: '', costo: '' })
const prepError    = ref('')
const prepSaving   = ref(false)

const TIPOS_PREP = ['LAVADO', 'SERVICE', 'REPARACION', 'DETAILING', 'OTRO']
const LABEL_PREP = { LAVADO: 'Lavado', SERVICE: 'Service', REPARACION: 'Reparación', DETAILING: 'Detailing', OTRO: 'Otro' }

const tipoPrepOptions = computed(() =>
  TIPOS_PREP.map(t => ({ value: t, label: LABEL_PREP[t] }))
)

// ── Carga inicial ──────────────────────────────────────────────────────────────
onMounted(async () => {
  await fetchVehiculo(vehiculoId.value)
  if (canSeeCost.value) {
    costoReal.value = await fetchCostoReal(vehiculoId.value).catch(() => null)
  }
  loadGastos()
  loadPreparaciones()
})

async function loadGastos() {
  tabLoading.value = true
  try {
    const { data } = await api.get(`/vehiculos/${vehiculoId.value}/gastos`)
    gastos.value = data.data
  } finally {
    tabLoading.value = false
  }
}

async function loadPreparaciones() {
  const { data } = await api.get(`/vehiculos/${vehiculoId.value}/preparacion`)
  preparaciones.value = data.data
}

// ── Guardar gasto ──────────────────────────────────────────────────────────────
async function saveGasto() {
  if (!gastoForm.concepto || !gastoForm.monto) {
    gastoError.value = 'Concepto y monto son requeridos'
    return
  }
  gastoError.value = ''
  gastoSaving.value = true
  try {
    await api.post(`/vehiculos/${vehiculoId.value}/gastos`, {
      concepto:  gastoForm.concepto,
      monto:     Number(gastoForm.monto),
      proveedor: gastoForm.proveedor || undefined,
    })
    Object.assign(gastoForm, { concepto: '', monto: '', proveedor: '' })
    showGastoForm.value = false
    // Recargar vehículo para reflejar el nuevo precioCosto y el costo real
    await fetchVehiculo(vehiculoId.value)
    if (canSeeCost.value) costoReal.value = await fetchCostoReal(vehiculoId.value).catch(() => null)
    loadGastos()
  } catch (err) {
    gastoError.value = err.response?.data?.error ?? 'Error al guardar gasto'
  } finally {
    gastoSaving.value = false
  }
}

// ── Guardar preparación ────────────────────────────────────────────────────────
async function savePreparacion() {
  if (!prepForm.tipo) {
    prepError.value = 'El tipo es requerido'
    return
  }
  prepError.value = ''
  prepSaving.value = true
  try {
    await api.post(`/vehiculos/${vehiculoId.value}/preparacion`, {
      tipo:        prepForm.tipo,
      descripcion: prepForm.descripcion || undefined,
      proveedor:   prepForm.proveedor   || undefined,
      costo:       prepForm.costo ? Number(prepForm.costo) : 0,
    })
    Object.assign(prepForm, { tipo: 'LAVADO', descripcion: '', proveedor: '', costo: '' })
    showPrepForm.value = false
    // El estado del vehículo puede haber cambiado a EN_PREPARACION
    await fetchVehiculo(vehiculoId.value)
    loadPreparaciones()
  } catch (err) {
    prepError.value = err.response?.data?.error ?? 'Error al guardar preparación'
  } finally {
    prepSaving.value = false
  }
}

// ── Cambiar estado de preparación ─────────────────────────────────────────────
async function cambiarEstadoPrep(prep, nuevoEstado) {
  try {
    await api.patch(`/vehiculos/${vehiculoId.value}/preparacion/${prep.id}`, { estado: nuevoEstado })
    // El vehículo puede haber vuelto a DISPONIBLE
    await fetchVehiculo(vehiculoId.value)
    loadPreparaciones()
  } catch (err) {
    console.error('Error al cambiar estado:', err)
  }
}

const NEXT_ESTADO_PREP = { PENDIENTE: 'EN_CURSO', EN_CURSO: 'COMPLETADO' }
const LABEL_ACCION_PREP = { PENDIENTE: 'Iniciar', EN_CURSO: 'Completar' }

// ── Lightbox ───────────────────────────────────────────────────────────────────
const fotoAmpliada = ref(null)
</script>

<template>
  <div class="p-6 max-w-4xl mx-auto space-y-5">

    <!-- Botón volver -->
    <button
      class="flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
      @click="router.push('/stock')"
    >
      <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
      </svg>
      Volver al stock
    </button>

    <!-- Estado de carga inicial -->
    <div v-if="vLoading" class="flex justify-center py-16">
      <svg class="w-8 h-8 animate-spin text-primary-600" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
      </svg>
    </div>

    <template v-else-if="vehiculo">

      <!-- Header del vehículo -->
      <div class="bg-white dark:bg-[#1a1a2e] rounded-xl border border-slate-200 dark:border-white/5 p-6">
        <div class="flex items-start justify-between gap-4">
          <div>
            <div class="flex items-center gap-2 mb-1">
              <AppBadge :value="vehiculo.tipo" size="xs" />
              <AppBadge :value="vehiculo.tipoStock" size="xs" />
            </div>
            <h1 class="text-2xl font-bold text-slate-800 dark:text-white">
              {{ vehiculo.marca }} {{ vehiculo.modelo }}
              <span class="text-slate-500 dark:text-slate-400 font-normal">{{ vehiculo.anio }}</span>
            </h1>
            <p class="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
              <span v-if="vehiculo.version">{{ vehiculo.version }}</span>
              <span v-if="vehiculo.patente" class="ml-2 font-mono bg-slate-100 dark:bg-white/10 px-2 py-0.5 rounded text-xs">
                {{ vehiculo.patente }}
              </span>
            </p>
          </div>
          <div class="flex items-center gap-2 flex-shrink-0">
            <AppBadge :value="vehiculo.estado" />
            <router-link
              v-if="canEdit"
              :to="`/stock/${vehiculo.id}/editar`"
              class="text-sm bg-white dark:bg-white/5 border border-slate-300 dark:border-white/10 hover:border-primary-400 text-slate-700 dark:text-slate-300 hover:text-primary-700 dark:hover:text-primary-400 px-3 py-1.5 rounded-lg transition-colors"
            >
              Editar
            </router-link>
          </div>
        </div>
      </div>

      <!-- Tabs -->
      <div>
        <div class="flex gap-0.5 border-b border-slate-200 dark:border-white/5 mb-5">
          <button
            v-for="tab in TABS"
            :key="tab"
            class="px-5 py-2.5 text-sm font-medium transition-colors relative"
            :class="activeTab === tab
              ? 'text-primary-600 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-primary-600 after:rounded-t'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'"
            @click="activeTab = tab"
          >
            {{ tab }}
          </button>
        </div>

        <!-- Tab: Info ────────────────────────────────────────────────────── -->
        <div v-if="activeTab === 'Info'" class="space-y-4">

          <!-- Galería de imágenes -->
          <template v-if="vehiculo.fotosJson">
            <div
              v-if="JSON.parse(vehiculo.fotosJson || '[]').length"
              class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3"
            >
              <img
                v-for="(url, i) in JSON.parse(vehiculo.fotosJson)"
                :key="i"
                :src="url"
                :alt="`Foto ${i + 1}`"
                class="w-full aspect-square object-cover rounded-xl border border-slate-200 cursor-pointer hover:opacity-90 transition-opacity"
                @click="fotoAmpliada = url"
              />
            </div>
          </template>

          <div class="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div v-for="(label, key) in {
              color: 'Color', combustible: 'Combustible', transmision: 'Transmisión',
              km: 'Kilómetros', vinChasis: 'VIN / Chasis'
            }" :key="key" class="bg-white dark:bg-[#1a1a2e] rounded-xl border border-slate-200 dark:border-white/5 p-4">
              <p class="text-xs text-slate-400 dark:text-slate-500 mb-1">{{ label }}</p>
              <p class="text-sm font-medium text-slate-800 dark:text-white">
                {{ key === 'km' ? number(vehiculo[key]) + ' km' : (vehiculo[key] || '—') }}
              </p>
            </div>
          </div>

          <!-- Precios -->
          <div class="bg-white dark:bg-[#1a1a2e] rounded-xl border border-slate-200 dark:border-white/5 p-5">
            <h3 class="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">Precios</h3>
            <div class="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div>
                <p class="text-xs text-slate-400 dark:text-slate-500 mb-1">Precio de venta</p>
                <p class="text-lg font-bold text-slate-800 dark:text-white">{{ currency(vehiculo.precioVenta) }}</p>
              </div>
              <div v-if="canSeeCost">
                <p class="text-xs text-slate-400 dark:text-slate-500 mb-1">Precio mínimo</p>
                <p class="text-base font-semibold text-slate-700 dark:text-slate-100">{{ currency(vehiculo.precioMinimo) }}</p>
              </div>
            </div>
          </div>

          <!-- Costo real (solo ADMIN/GERENTE) -->
          <div v-if="canSeeCost && costoReal" class="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-xl p-5">
            <h3 class="text-sm font-semibold text-amber-800 dark:text-amber-300 mb-3">Costo real (interno)</h3>
            <div class="flex gap-6 text-sm">
              <div>
                <p class="text-amber-600 text-xs">Precio de costo</p>
                <p class="font-semibold text-amber-900">{{ currency(costoReal.precioCosto) }}</p>
              </div>
              <div>
                <p class="text-amber-600 text-xs">+ Gastos</p>
                <p class="font-semibold text-amber-900">{{ currency(costoReal.totalGastos) }}</p>
              </div>
              <div>
                <p class="text-amber-600 text-xs font-semibold">= Costo real</p>
                <p class="text-base font-bold text-amber-900">{{ currency(costoReal.costoReal) }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Tab: Gastos ──────────────────────────────────────────────────── -->
        <div v-else-if="activeTab === 'Gastos'" class="space-y-4">

          <!-- Lista de gastos -->
          <div class="bg-white dark:bg-[#1a1a2e] rounded-xl border border-slate-200 dark:border-white/5 divide-y divide-slate-200 dark:divide-white/5">
            <div v-if="!gastos.length" class="px-5 py-8 text-center text-sm text-slate-400 dark:text-slate-500">
              Sin gastos registrados.
            </div>
            <div
              v-for="g in gastos"
              :key="g.id"
              class="px-5 py-3 flex items-center justify-between"
            >
              <div>
                <p class="text-sm font-medium text-slate-800 dark:text-white">{{ g.concepto }}</p>
                <p class="text-xs text-slate-400 dark:text-slate-500">
                  {{ date(g.fecha) }}
                  <span v-if="g.proveedor"> · {{ g.proveedor }}</span>
                  <span> · {{ g.usuario?.nombre }}</span>
                </p>
              </div>
              <p class="text-sm font-semibold text-slate-700 dark:text-slate-100">{{ currency(g.monto) }}</p>
            </div>
          </div>

          <!-- Formulario agregar gasto -->
          <div v-if="canEdit">
            <button
              v-if="!showGastoForm"
              class="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 font-medium flex items-center gap-1"
              @click="showGastoForm = true"
            >
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Agregar gasto
            </button>

            <div v-else class="bg-white dark:bg-[#1a1a2e] rounded-xl border border-slate-200 dark:border-white/5 p-5 space-y-3">
              <h4 class="text-sm font-semibold text-slate-700 dark:text-slate-200">Nuevo gasto</h4>
              <p v-if="gastoError" class="text-xs text-red-600 dark:text-red-400">{{ gastoError }}</p>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label class="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Concepto *</label>
                  <input v-model="gastoForm.concepto" type="text" placeholder="Ej: Pintura"
                    class="w-full rounded-lg border-slate-300 dark:border-white/10 bg-white dark:bg-white/5 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 text-sm focus:border-primary-500 focus:ring-primary-500" />
                </div>
                <div>
                  <label class="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Monto *</label>
                  <input v-model="gastoForm.monto" type="number" min="0" placeholder="0"
                    class="w-full rounded-lg border-slate-300 dark:border-white/10 bg-white dark:bg-white/5 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 text-sm focus:border-primary-500 focus:ring-primary-500" />
                </div>
                <div class="sm:col-span-2">
                  <label class="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Proveedor</label>
                  <input v-model="gastoForm.proveedor" type="text" placeholder="Opcional"
                    class="w-full rounded-lg border-slate-300 dark:border-white/10 bg-white dark:bg-white/5 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 text-sm focus:border-primary-500 focus:ring-primary-500" />
                </div>
              </div>
              <div class="flex justify-end gap-2 pt-1">
                <button class="text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 px-3 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
                  @click="showGastoForm = false">Cancelar</button>
                <button
                  class="text-sm bg-primary-600 hover:bg-primary-700 text-white px-4 py-1.5 rounded-lg disabled:opacity-60 transition-colors"
                  :disabled="gastoSaving"
                  @click="saveGasto"
                >
                  {{ gastoSaving ? 'Guardando...' : 'Guardar gasto' }}
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Tab: Preparación ─────────────────────────────────────────────── -->
        <div v-else-if="activeTab === 'Preparación'" class="space-y-4">

          <!-- Lista de preparaciones -->
          <div class="bg-white dark:bg-[#1a1a2e] rounded-xl border border-slate-200 dark:border-white/5 divide-y divide-slate-200 dark:divide-white/5">
            <div v-if="!preparaciones.length" class="px-5 py-8 text-center text-sm text-slate-400 dark:text-slate-500">
              Sin tareas de preparación.
            </div>
            <div
              v-for="p in preparaciones"
              :key="p.id"
              class="px-5 py-3 flex items-center justify-between gap-4"
            >
              <div class="min-w-0">
                <div class="flex items-center gap-2 mb-0.5">
                  <AppBadge :value="p.estado" size="xs" />
                  <p class="text-sm font-medium text-slate-800 dark:text-white">{{ LABEL_PREP[p.tipo] ?? p.tipo }}</p>
                </div>
                <p class="text-xs text-slate-400 dark:text-slate-500 truncate">
                  {{ p.descripcion || 'Sin descripción' }}
                  <span v-if="p.proveedor"> · {{ p.proveedor }}</span>
                </p>
              </div>
              <div class="flex items-center gap-3 flex-shrink-0">
                <p v-if="p.costo > 0" class="text-sm font-semibold text-slate-700 dark:text-slate-100">{{ currency(p.costo) }}</p>
                <button
                  v-if="canEdit && NEXT_ESTADO_PREP[p.estado]"
                  class="text-xs font-medium text-primary-600 hover:text-primary-700 border border-primary-200 hover:border-primary-400 px-2.5 py-1 rounded-lg transition-colors"
                  @click="cambiarEstadoPrep(p, NEXT_ESTADO_PREP[p.estado])"
                >
                  {{ LABEL_ACCION_PREP[p.estado] }}
                </button>
              </div>
            </div>
          </div>

          <!-- Formulario agregar preparación -->
          <div v-if="canEdit">
            <button
              v-if="!showPrepForm"
              class="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1"
              @click="showPrepForm = true"
            >
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Agregar tarea
            </button>

            <div v-else class="bg-white dark:bg-[#1a1a2e] rounded-xl border border-slate-200 dark:border-white/5 p-5 space-y-3">
              <h4 class="text-sm font-semibold text-slate-700 dark:text-slate-200">Nueva tarea de preparación</h4>
              <p v-if="prepError" class="text-xs text-red-600 dark:text-red-400">{{ prepError }}</p>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label class="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Tipo *</label>
                  <AppSelect v-model="prepForm.tipo" :options="tipoPrepOptions" />
                </div>
                <div>
                  <label class="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Costo estimado</label>
                  <input v-model="prepForm.costo" type="number" min="0" placeholder="0"
                    class="w-full rounded-lg border-slate-300 dark:border-white/10 bg-white dark:bg-white/5 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 text-sm focus:border-primary-500 focus:ring-primary-500" />
                </div>
                <div>
                  <label class="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Proveedor</label>
                  <input v-model="prepForm.proveedor" type="text" placeholder="Opcional"
                    class="w-full rounded-lg border-slate-300 dark:border-white/10 bg-white dark:bg-white/5 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 text-sm focus:border-primary-500 focus:ring-primary-500" />
                </div>
                <div>
                  <label class="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Descripción</label>
                  <input v-model="prepForm.descripcion" type="text" placeholder="Opcional"
                    class="w-full rounded-lg border-slate-300 dark:border-white/10 bg-white dark:bg-white/5 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 text-sm focus:border-primary-500 focus:ring-primary-500" />
                </div>
              </div>
              <div class="flex justify-end gap-2 pt-1">
                <button class="text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 px-3 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
                  @click="showPrepForm = false">Cancelar</button>
                <button
                  class="text-sm bg-primary-600 hover:bg-primary-700 text-white px-4 py-1.5 rounded-lg disabled:opacity-60 transition-colors"
                  :disabled="prepSaving"
                  @click="savePreparacion"
                >
                  {{ prepSaving ? 'Guardando...' : 'Guardar tarea' }}
                </button>
              </div>
            </div>
          </div>
        </div>

      </div>
    </template>

    <!-- Lightbox -->
    <Teleport to="body">
      <div
        v-if="fotoAmpliada"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
        @click.self="fotoAmpliada = null"
      >
        <div class="relative max-w-4xl w-full">
          <img :src="fotoAmpliada" alt="Foto ampliada" class="w-full rounded-xl shadow-2xl object-contain max-h-[80vh]" />
          <button
            class="absolute top-3 right-3 w-9 h-9 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center transition-colors"
            @click="fotoAmpliada = null"
          >
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </Teleport>
  </div>
</template>
