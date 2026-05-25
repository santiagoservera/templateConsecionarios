<script setup>
import { useVentaWizardStore } from '../store/ventaWizardStore.js'
import { currency } from '../../../shared/utils/format.js'

defineProps({
  loading: { type: Boolean, default: false },
  error:   { type: String,  default: '' },
})
defineEmits(['confirm'])

const wizard = useVentaWizardStore()
</script>

<template>
  <div class="space-y-5">
    <h2 class="text-lg font-semibold text-slate-900 dark:text-white">Resumen y confirmación</h2>

    <p v-if="error" class="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl px-4 py-3">{{ error }}</p>

    <!-- Cliente -->
    <div class="rounded-xl border border-slate-200 dark:border-white/10 overflow-hidden bg-white dark:bg-[#13131f]">
      <div class="bg-slate-50 dark:bg-[#0f0f17] px-4 py-2 border-b border-slate-200 dark:border-white/10">
        <p class="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Cliente</p>
      </div>
      <div class="p-4">
        <p class="font-semibold text-slate-800 dark:text-slate-100">{{ wizard.cliente?.apellido }}, {{ wizard.cliente?.nombre }}</p>
        <p class="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
          <span v-if="wizard.cliente?.dniCuit">DNI: {{ wizard.cliente.dniCuit }}</span>
          <span v-if="wizard.cliente?.telefono" class="ml-3">{{ wizard.cliente.telefono }}</span>
        </p>
      </div>
    </div>

    <!-- Vehículo -->
    <div class="rounded-xl border border-slate-200 dark:border-white/10 overflow-hidden bg-white dark:bg-[#13131f]">
      <div class="bg-slate-50 dark:bg-[#0f0f17] px-4 py-2 border-b border-slate-200 dark:border-white/10">
        <p class="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Vehículo</p>
      </div>
      <div class="p-4">
        <p class="font-semibold text-slate-800 dark:text-slate-100">
          {{ wizard.vehiculo?.marca }} {{ wizard.vehiculo?.modelo }} {{ wizard.vehiculo?.anio }}
          <span v-if="wizard.vehiculo?.version" class="text-slate-400 dark:text-slate-500 font-normal text-sm">
            · {{ wizard.vehiculo.version }}
          </span>
        </p>
        <p class="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
          Precio de venta: {{ currency(wizard.vehiculo?.precioVenta) }}
        </p>
      </div>
    </div>

    <!-- Pago -->
    <div class="rounded-xl border border-slate-200 dark:border-white/10 overflow-hidden bg-white dark:bg-[#13131f]">
      <div class="bg-slate-50 dark:bg-[#0f0f17] px-4 py-2 border-b border-slate-200 dark:border-white/10">
        <p class="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Condiciones de pago</p>
      </div>
      <div class="p-4 space-y-2">
        <div class="flex justify-between text-sm">
          <span class="text-slate-500 dark:text-slate-400">Forma de pago</span>
          <span class="font-medium dark:text-slate-200">
            {{ { CONTADO: 'Contado', FINANCIADO: 'Financiado', MIXTO: 'Mixto' }[wizard.pago.formaPago] }}
          </span>
        </div>
        <div class="flex justify-between text-sm">
          <span class="text-slate-500 dark:text-slate-400">Precio final</span>
          <span class="font-bold text-slate-800 dark:text-white">{{ currency(wizard.pago.precioFinal) }}</span>
        </div>

        <template v-if="wizard.pago.tienePermuta">
          <div class="border-t border-slate-200 dark:border-white/10 pt-2 mt-2">
            <p class="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Permuta</p>
            <p class="text-sm">
              {{ wizard.pago.permuta.marca }} {{ wizard.pago.permuta.modelo }} {{ wizard.pago.permuta.anio }}
            </p>
            <p class="text-sm text-slate-500 dark:text-slate-400">Tasación: {{ currency(wizard.pago.permuta.valorTasacion) }}</p>
          </div>
        </template>

        <template v-if="wizard.pago.tieneFinanciamiento">
          <div class="border-t border-slate-200 dark:border-white/10 pt-2 mt-2">
            <p class="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Financiamiento</p>
            <p class="text-sm">
              {{ wizard.pago.financiamiento.entidad }} —
              {{ wizard.pago.financiamiento.cantCuotas }} cuotas de
              {{ currency(wizard.pago.financiamiento.valorCuota) }}
            </p>
          </div>
        </template>
      </div>
    </div>

    <!-- Botón confirmar -->
    <button
      class="w-full bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 disabled:opacity-60 text-white font-semibold py-3.5 px-6 rounded-xl transition-all text-sm shadow-sm active:scale-[0.98]"
      :disabled="loading"
      @click="$emit('confirm')"
    >
      {{ loading ? 'Procesando...' : '✓ Confirmar venta' }}
    </button>
  </div>
</template>
