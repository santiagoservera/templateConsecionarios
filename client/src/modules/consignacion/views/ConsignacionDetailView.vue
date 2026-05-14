<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useConsignacion } from '../composables/useConsignacion.js'
import { useToast } from '../../../shared/composables/useToast.js'
import AppModal from '../../../shared/components/AppModal.vue'
import AppBadge from '../../../shared/components/AppBadge.vue'
import AppSelect from '../../../shared/components/AppSelect.vue'
import { currency, date } from '../../../shared/utils/format.js'

const route  = useRoute()
const router = useRouter()
const toast  = useToast()
const { consignacion, loading, error, fetchById, updateConsignacion } = useConsignacion()

onMounted(() => fetchById(route.params.id))

const estadoBadge = { ACTIVA: 'success', VENDIDA: 'info', RETIRADA: 'default' }

// ── Modal cambiar estado ───────────────────────────────────────────────────────
const showEstadoModal = ref(false)
const nuevoEstado     = ref('')
const saving          = ref(false)
const modalError      = ref('')

const estadoOptions = [
  { value: 'ACTIVA',   label: 'Activa' },
  { value: 'VENDIDA',  label: 'Vendida' },
  { value: 'RETIRADA', label: 'Retirada' },
]

async function cambiarEstado() {
  if (!nuevoEstado.value) { modalError.value = 'Seleccioná un estado'; return }
  saving.value     = true
  modalError.value = ''
  try {
    await updateConsignacion(route.params.id, { estado: nuevoEstado.value })
    toast.success('Estado actualizado')
    showEstadoModal.value = false
    fetchById(route.params.id)
  } catch (err) {
    modalError.value = err.response?.data?.error ?? 'Error al actualizar'
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="p-6 space-y-6 animate-fade-in">

    <!-- Back -->
    <button class="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors" @click="router.back()">
      <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18"/>
      </svg>
      Volver
    </button>

    <div v-if="loading" class="flex justify-center py-16">
      <svg class="w-8 h-8 animate-spin text-primary-500" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
      </svg>
    </div>

    <template v-if="consignacion && !loading">
      <!-- Header -->
      <div class="flex items-start justify-between gap-4">
        <div>
          <div class="flex items-center gap-2.5 mb-1">
            <h1 class="text-2xl font-bold text-slate-900 dark:text-white">
              {{ consignacion.vehiculo?.marca }} {{ consignacion.vehiculo?.modelo }} {{ consignacion.vehiculo?.anio }}
            </h1>
            <AppBadge :variant="estadoBadge[consignacion.estado]">{{ consignacion.estado }}</AppBadge>
          </div>
          <p class="text-sm text-slate-500 dark:text-slate-400">
            <span v-if="consignacion.vehiculo?.patente">{{ consignacion.vehiculo.patente }} · </span>
            {{ consignacion.vehiculo?.km?.toLocaleString() }} km
          </p>
        </div>
        <button
          v-if="consignacion.estado === 'ACTIVA'"
          class="inline-flex items-center gap-2 bg-primary-500 hover:bg-primary-600 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-all shadow-sm shrink-0"
          @click="() => { nuevoEstado = ''; showEstadoModal = true }"
        >
          Cambiar estado
        </button>
      </div>

      <!-- Cards de info -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <!-- Precio -->
        <div class="bg-white dark:bg-[#1a1a2e] rounded-2xl border border-slate-200 dark:border-white/10 p-5">
          <p class="text-xs text-slate-500 dark:text-slate-400 mb-1">Precio acordado</p>
          <p class="text-xl font-bold text-slate-900 dark:text-white">{{ currency(consignacion.precioAcordado) }}</p>
          <p class="text-xs text-slate-400 dark:text-slate-500 mt-1">
            Comisión {{ consignacion.comisionPct }}% =
            <span class="font-semibold text-primary-500">{{ currency(Number(consignacion.precioAcordado) * Number(consignacion.comisionPct) / 100) }}</span>
          </p>
        </div>

        <!-- Propietario -->
        <div class="bg-white dark:bg-[#1a1a2e] rounded-2xl border border-slate-200 dark:border-white/10 p-5">
          <p class="text-xs text-slate-500 dark:text-slate-400 mb-1">Propietario</p>
          <p class="text-sm font-bold text-slate-900 dark:text-white">{{ consignacion.propietario.nombre }} {{ consignacion.propietario.apellido }}</p>
          <p v-if="consignacion.propietario.telefono" class="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{{ consignacion.propietario.telefono }}</p>
          <p v-if="consignacion.propietario.dniCuit" class="text-xs text-slate-400 dark:text-slate-500">DNI/CUIT: {{ consignacion.propietario.dniCuit }}</p>
        </div>

        <!-- Fechas -->
        <div class="bg-white dark:bg-[#1a1a2e] rounded-2xl border border-slate-200 dark:border-white/10 p-5">
          <p class="text-xs text-slate-500 dark:text-slate-400 mb-1">Fechas</p>
          <p class="text-xs text-slate-600 dark:text-slate-300">Ingreso: <span class="font-medium">{{ date(consignacion.fechaIngreso) }}</span></p>
          <p v-if="consignacion.fechaVencimiento" class="text-xs mt-0.5" :class="consignacion._vencida ? 'text-red-500 font-semibold' : 'text-slate-600 dark:text-slate-300'">
            Vencimiento: {{ date(consignacion.fechaVencimiento) }}
            <span v-if="consignacion._vencida"> ⚠</span>
          </p>
        </div>
      </div>

      <!-- Observaciones -->
      <div v-if="consignacion.observaciones" class="bg-white dark:bg-[#1a1a2e] rounded-2xl border border-slate-200 dark:border-white/10 p-5">
        <p class="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Observaciones</p>
        <p class="text-sm text-slate-700 dark:text-slate-200">{{ consignacion.observaciones }}</p>
      </div>
    </template>

    <!-- Modal cambio de estado -->
    <AppModal v-model="showEstadoModal" title="Cambiar estado" size="sm">
      <div class="space-y-4">
        <p v-if="modalError" class="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl px-4 py-3">{{ modalError }}</p>
        <div>
          <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Nuevo estado</label>
          <AppSelect v-model="nuevoEstado" :options="estadoOptions.filter(o => o.value !== consignacion?.estado)" placeholder="Seleccioná estado..." />
        </div>
        <div v-if="nuevoEstado === 'RETIRADA'" class="flex items-start gap-2 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-xl px-4 py-3">
          <svg class="w-4 h-4 text-amber-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"/>
          </svg>
          <p class="text-xs text-amber-700 dark:text-amber-400">El vehículo volverá al stock como <strong>DISPONIBLE</strong>.</p>
        </div>
      </div>
      <template #footer="{ close }">
        <button class="text-sm text-slate-600 dark:text-slate-300 px-4 py-2 rounded-xl border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors" @click="close">Cancelar</button>
        <button class="text-sm bg-primary-500 hover:bg-primary-600 text-white px-5 py-2 rounded-xl font-semibold disabled:opacity-60 transition-all" :disabled="saving" @click="cambiarEstado">
          {{ saving ? 'Guardando...' : 'Confirmar' }}
        </button>
      </template>
    </AppModal>

  </div>
</template>
