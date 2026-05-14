<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useConsignacion } from '../composables/useConsignacion.js'
import { useClientes } from '../../clientes/composables/useClientes.js'
import { useToast } from '../../../shared/composables/useToast.js'
import AppModal from '../../../shared/components/AppModal.vue'
import AppBadge from '../../../shared/components/AppBadge.vue'
import AppSelect from '../../../shared/components/AppSelect.vue'
import AppPagination from '../../../shared/components/AppPagination.vue'
import { currency, date } from '../../../shared/utils/format.js'

const router = useRouter()
const toast  = useToast()
const { consignaciones, loading, error, meta, fetchConsignaciones, createConsignacion } = useConsignacion()

const filtroEstado = ref('')
const page         = ref(1)

function load() {
  fetchConsignaciones({ estado: filtroEstado.value || undefined, page: page.value })
}
onMounted(load)

const estadoOptions = [
  { value: '',        label: 'Todos los estados' },
  { value: 'ACTIVA',   label: 'Activa' },
  { value: 'VENDIDA',  label: 'Vendida' },
  { value: 'RETIRADA', label: 'Retirada' },
]

const estadoBadge = {
  ACTIVA:   'success',
  VENDIDA:  'info',
  RETIRADA: 'default',
}

// ── Modal nueva consignación ──────────────────────────────────────────────────
const showModal  = ref(false)
const saving     = ref(false)
const modalError = ref('')

const form = ref({ vehiculoId: '', propietarioId: '', precioAcordado: '', comisionPct: 8, fechaVencimiento: '', observaciones: '' })

async function guardar() {
  if (!form.value.vehiculoId || !form.value.propietarioId || !form.value.precioAcordado) {
    modalError.value = 'Completá los campos requeridos'
    return
  }
  saving.value     = true
  modalError.value = ''
  try {
    await createConsignacion({
      vehiculoId:       Number(form.value.vehiculoId),
      propietarioId:    Number(form.value.propietarioId),
      precioAcordado:   Number(form.value.precioAcordado),
      comisionPct:      Number(form.value.comisionPct),
      fechaVencimiento: form.value.fechaVencimiento || null,
      observaciones:    form.value.observaciones || undefined,
    })
    toast.success('Consignación creada', 'El vehículo quedó registrado en consignación')
    showModal.value = false
    load()
  } catch (err) {
    modalError.value = err.response?.data?.error ?? 'Error al crear consignación'
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="p-6 space-y-6 animate-fade-in">

    <!-- Encabezado -->
    <div class="flex items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold text-slate-900 dark:text-white">Consignaciones</h1>
        <p class="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Vehículos de terceros a la venta en el concesionario</p>
      </div>
      <button
        class="inline-flex items-center gap-2 bg-primary-500 hover:bg-primary-600 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-all shadow-sm hover:shadow-glow active:scale-[0.98] shrink-0"
        @click="showModal = true"
      >
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
        Nueva consignación
      </button>
    </div>

    <!-- Filtros -->
    <div class="flex gap-3 flex-wrap">
      <div class="w-52">
        <AppSelect v-model="filtroEstado" :options="estadoOptions" @change="() => { page = 1; load() }" />
      </div>
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
    <div v-else class="space-y-3">
      <div
        v-if="!consignaciones.length"
        class="text-center py-16 bg-white dark:bg-[#1a1a2e] rounded-2xl border border-slate-200 dark:border-white/10"
      >
        <p class="text-slate-500 dark:text-slate-400 font-medium">No hay consignaciones registradas.</p>
      </div>

      <div
        v-for="c in consignaciones"
        :key="c.id"
        class="bg-white dark:bg-[#1a1a2e] rounded-2xl border border-slate-200 dark:border-white/10 hover:border-primary-200 dark:hover:border-primary-500/30 hover:shadow-card-md transition-all cursor-pointer p-5"
        @click="router.push(`/consignacion/${c.id}`)"
      >
        <div class="flex items-start justify-between gap-4">
          <div class="min-w-0 flex-1">
            <div class="flex items-center gap-2.5 mb-1.5">
              <h3 class="text-sm font-bold text-slate-900 dark:text-white">
                {{ c.vehiculo?.marca }} {{ c.vehiculo?.modelo }} {{ c.vehiculo?.anio }}
              </h3>
              <AppBadge :variant="estadoBadge[c.estado]">{{ c.estado }}</AppBadge>
              <span v-if="c._vencida" class="text-[10px] font-semibold text-red-500 bg-red-50 dark:bg-red-500/10 px-2 py-0.5 rounded-full">Vencida</span>
            </div>
            <p class="text-xs text-slate-500 dark:text-slate-400">
              Propietario: <span class="font-medium text-slate-700 dark:text-slate-200">{{ c.propietario?.nombre }} {{ c.propietario?.apellido }}</span>
              <span v-if="c.vehiculo?.patente"> · {{ c.vehiculo.patente }}</span>
            </p>
          </div>

          <div class="text-right shrink-0 space-y-1">
            <p class="text-sm font-bold text-slate-900 dark:text-white">{{ currency(c.precioAcordado) }}</p>
            <p class="text-xs text-slate-400 dark:text-slate-500">Comisión {{ c.comisionPct }}%</p>
            <p v-if="c.fechaVencimiento" class="text-xs text-slate-400 dark:text-slate-500">Vence {{ date(c.fechaVencimiento) }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Paginación -->
    <AppPagination v-if="meta" :meta="meta" v-model="page" @update:modelValue="load" />

    <!-- Modal nueva consignación -->
    <AppModal v-model="showModal" title="Nueva consignación" size="md">
      <div class="space-y-4">
        <p v-if="modalError" class="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl px-4 py-3">{{ modalError }}</p>

        <div>
          <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">ID del vehículo *</label>
          <input v-model="form.vehiculoId" type="number" placeholder="Ingresá el ID del vehículo"
            class="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1a1a2e] text-slate-900 dark:text-white text-sm px-3.5 py-2.5 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500" />
        </div>

        <div>
          <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">ID del propietario (cliente) *</label>
          <input v-model="form.propietarioId" type="number" placeholder="Ingresá el ID del cliente propietario"
            class="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1a1a2e] text-slate-900 dark:text-white text-sm px-3.5 py-2.5 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500" />
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Precio acordado *</label>
            <input v-model="form.precioAcordado" type="number" placeholder="0"
              class="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1a1a2e] text-slate-900 dark:text-white text-sm px-3.5 py-2.5 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500" />
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Comisión %</label>
            <input v-model="form.comisionPct" type="number" min="0" max="100" step="0.5"
              class="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1a1a2e] text-slate-900 dark:text-white text-sm px-3.5 py-2.5 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500" />
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Fecha de vencimiento</label>
          <input v-model="form.fechaVencimiento" type="date"
            class="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1a1a2e] text-slate-900 dark:text-white text-sm px-3.5 py-2.5 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500" />
        </div>

        <div>
          <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Observaciones</label>
          <textarea v-model="form.observaciones" rows="2" placeholder="Condiciones, acuerdos, etc."
            class="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1a1a2e] text-slate-900 dark:text-white text-sm px-3.5 py-2.5 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 resize-none" />
        </div>
      </div>

      <template #footer="{ close }">
        <button class="text-sm text-slate-600 dark:text-slate-300 px-4 py-2 rounded-xl border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors" @click="close">Cancelar</button>
        <button class="text-sm bg-primary-500 hover:bg-primary-600 text-white px-5 py-2 rounded-xl font-semibold disabled:opacity-60 transition-all shadow-sm hover:shadow-glow" :disabled="saving" @click="guardar">
          {{ saving ? 'Guardando...' : 'Crear consignación' }}
        </button>
      </template>
    </AppModal>

  </div>
</template>
