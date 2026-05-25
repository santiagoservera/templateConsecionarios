<script setup>
import { ref, watch, computed, onMounted } from 'vue'
import { useVentaWizardStore } from '../store/ventaWizardStore.js'
import { useConvenios } from '../../convenios/composables/useConvenios.js'
import { currency } from '../../../shared/utils/format.js'

const wizard = useVentaWizardStore()
const { convenios, fetchConvenios } = useConvenios()

onMounted(() => fetchConvenios(true))

// Pre-fill precio final desde el vehículo seleccionado
watch(() => wizard.vehiculo, (v) => {
  if (v && !wizard.pago.precioFinal) wizard.pago.precioFinal = v.precioVenta
}, { immediate: true })

// ── Selección de banco / plan ──────────────────────────────────────────────────
const bancoDest = ref(null)  // ConvenioBanco seleccionado
const planSel   = ref(null)  // PlanCuotas seleccionado

const planesDisponibles = computed(() =>
  (bancoDest.value?.planes ?? []).filter(p => p.activo)
)

watch(bancoDest, () => {
  planSel.value = null
  wizard.pago.financiamiento.entidad    = bancoDest.value?.nombre ?? ''
  wizard.pago.financiamiento.tasaInteres = ''
  wizard.pago.financiamiento.cantCuotas  = ''
})

watch(planSel, (plan) => {
  if (!plan) return
  wizard.pago.financiamiento.cantCuotas  = plan.cantCuotas
  wizard.pago.financiamiento.tasaInteres = Number(plan.tasaInteres)
})

// ── Cálculo de cuota ───────────────────────────────────────────────────────────
const valorCuotaCalculado = computed(() => {
  const P    = Number(wizard.pago.financiamiento.montoFinanciado)
  const n    = Number(wizard.pago.financiamiento.cantCuotas)
  const tna  = Number(wizard.pago.financiamiento.tasaInteres)
  if (!P || !n) return 0
  if (!tna)     return P / n
  // Convertir TNA a tasa mensual y aplicar sistema francés
  const r = tna / 100 / 12
  return (P * r) / (1 - Math.pow(1 + r, -n))
})

watch(valorCuotaCalculado, (val) => {
  wizard.pago.financiamiento.valorCuota = Math.round(val)
})

// Clases reutilizables
const inputCls = 'w-full rounded-xl text-sm focus:border-primary-500 focus:ring-primary-500 transition-colors border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f0f17] text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500'
const labelCls = 'block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1'
</script>

<template>
  <div class="space-y-5">
    <h2 class="text-lg font-semibold text-slate-900 dark:text-white">Forma de pago</h2>

    <!-- Selector forma de pago -->
    <div>
      <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Forma de pago</label>
      <div class="flex gap-2">
        <button
          v-for="fp in ['CONTADO', 'FINANCIADO', 'MIXTO']"
          :key="fp"
          type="button"
          class="flex-1 py-3 rounded-xl text-sm font-semibold border-2 transition-all"
          :class="wizard.pago.formaPago === fp
            ? 'border-primary-500 bg-orange-50 dark:bg-[#1f1208] text-primary-700 dark:text-primary-400'
            : 'border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 bg-white dark:bg-[#13131f] hover:border-slate-300 dark:hover:border-white/20'"
          @click="wizard.pago.formaPago = fp"
        >
          {{ { CONTADO: 'Contado', FINANCIADO: 'Financiado', MIXTO: 'Mixto' }[fp] }}
        </button>
      </div>
    </div>

    <!-- Precio final -->
    <div>
      <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
        Precio final acordado
        <span v-if="wizard.vehiculo" class="text-slate-400 dark:text-slate-500 font-normal text-xs ml-1">
          (precio lista: {{ currency(wizard.vehiculo.precioVenta) }})
        </span>
      </label>
      <input v-model="wizard.pago.precioFinal" type="number" min="0" step="any" placeholder="0" :class="inputCls"/>
    </div>

    <!-- ── Toggle Permuta ──────────────────────────────────────────────────── -->
    <div class="rounded-2xl border overflow-hidden border-slate-200 dark:border-white/10">
      <button
        type="button"
        class="w-full flex items-center justify-between px-4 py-3.5 transition-colors bg-white dark:bg-[#13131f] hover:bg-slate-50 dark:hover:bg-[#1a1a2e]"
        @click="wizard.pago.tienePermuta = !wizard.pago.tienePermuta"
      >
        <div class="flex items-center gap-2.5">
          <div class="w-7 h-7 rounded-lg flex items-center justify-center"
               :class="wizard.pago.tienePermuta ? 'bg-primary-100 dark:bg-primary-500/20' : 'bg-slate-100 dark:bg-white/10'">
            <svg class="w-3.5 h-3.5" :class="wizard.pago.tienePermuta ? 'text-primary-600 dark:text-primary-400' : 'text-slate-400 dark:text-slate-500'"
                 fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M7.5 21 3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5"/>
            </svg>
          </div>
          <span class="text-sm font-medium text-slate-700 dark:text-slate-200">Incluir permuta</span>
        </div>
        <div class="w-11 h-6 rounded-full transition-colors relative flex-shrink-0"
             :class="wizard.pago.tienePermuta ? 'bg-primary-500' : 'bg-slate-200 dark:bg-white/20'">
          <div class="absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform"
               :class="wizard.pago.tienePermuta ? 'translate-x-5' : 'translate-x-1'"/>
        </div>
      </button>

      <div v-if="wizard.pago.tienePermuta" class="border-t border-slate-200 dark:border-white/10 p-4 bg-slate-50 dark:bg-[#0f0f17]">
        <div class="grid grid-cols-2 gap-3">
          <div><label :class="labelCls">Marca *</label><input v-model="wizard.pago.permuta.marca" type="text" placeholder="Ford" :class="inputCls"/></div>
          <div><label :class="labelCls">Modelo *</label><input v-model="wizard.pago.permuta.modelo" type="text" placeholder="Focus" :class="inputCls"/></div>
          <div><label :class="labelCls">Año *</label><input v-model="wizard.pago.permuta.anio" type="number" min="1900" :class="inputCls"/></div>
          <div><label :class="labelCls">Patente</label><input v-model="wizard.pago.permuta.patente" type="text" placeholder="AB123CD" :class="inputCls"/></div>
          <div><label :class="labelCls">Kilómetros *</label><input v-model="wizard.pago.permuta.km" type="number" min="0" :class="inputCls"/></div>
          <div><label :class="labelCls">Valor tasación *</label><input v-model="wizard.pago.permuta.valorTasacion" type="number" min="0" step="any" :class="inputCls"/></div>
        </div>
      </div>
    </div>

    <!-- ── Toggle Financiamiento ───────────────────────────────────────────── -->
    <div class="rounded-2xl border overflow-hidden border-slate-200 dark:border-white/10">
      <button
        type="button"
        class="w-full flex items-center justify-between px-4 py-3.5 transition-colors bg-white dark:bg-[#13131f] hover:bg-slate-50 dark:hover:bg-[#1a1a2e]"
        @click="wizard.pago.tieneFinanciamiento = !wizard.pago.tieneFinanciamiento"
      >
        <div class="flex items-center gap-2.5">
          <div class="w-7 h-7 rounded-lg flex items-center justify-center"
               :class="wizard.pago.tieneFinanciamiento ? 'bg-primary-100 dark:bg-primary-500/20' : 'bg-slate-100 dark:bg-white/10'">
            <svg class="w-3.5 h-3.5" :class="wizard.pago.tieneFinanciamiento ? 'text-primary-600 dark:text-primary-400' : 'text-slate-400 dark:text-slate-500'"
                 fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 0 1 3 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 0 0-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 0 1-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 0 0 3 15h-.75"/>
            </svg>
          </div>
          <span class="text-sm font-medium text-slate-700 dark:text-slate-200">Incluir financiamiento</span>
        </div>
        <div class="w-11 h-6 rounded-full transition-colors relative flex-shrink-0"
             :class="wizard.pago.tieneFinanciamiento ? 'bg-primary-500' : 'bg-slate-200 dark:bg-white/20'">
          <div class="absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform"
               :class="wizard.pago.tieneFinanciamiento ? 'translate-x-5' : 'translate-x-1'"/>
        </div>
      </button>

      <div v-if="wizard.pago.tieneFinanciamiento" class="border-t border-slate-200 dark:border-white/10 p-4 bg-slate-50 dark:bg-[#0f0f17] space-y-4">

        <!-- Selector de banco (convenios) -->
        <div v-if="convenios.length">
          <label :class="labelCls">Banco / Entidad financiera</label>
          <div class="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-3">
            <button
              v-for="banco in convenios"
              :key="banco.id"
              type="button"
              class="py-2 px-3 rounded-xl text-xs font-semibold border-2 transition-all text-left"
              :class="bancoDest?.id === banco.id
                ? 'border-primary-500 bg-orange-50 dark:bg-[#1f1208] text-primary-700 dark:text-primary-400'
                : 'border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 bg-white dark:bg-[#13131f] hover:border-slate-300'"
              @click="bancoDest = bancoDest?.id === banco.id ? null : banco"
            >
              {{ banco.nombre }}
            </button>
            <!-- Opción "otro banco" manual -->
            <button
              type="button"
              class="py-2 px-3 rounded-xl text-xs font-semibold border-2 transition-all text-left"
              :class="!bancoDest && wizard.pago.financiamiento.entidad
                ? 'border-primary-500 bg-orange-50 dark:bg-[#1f1208] text-primary-700 dark:text-primary-400'
                : 'border-dashed border-slate-200 dark:border-white/10 text-slate-400 dark:text-slate-500 bg-white dark:bg-[#13131f] hover:border-slate-300'"
              @click="bancoDest = null; wizard.pago.financiamiento.entidad = ''"
            >
              Otro banco...
            </button>
          </div>

          <!-- Selector de plan de cuotas del banco seleccionado -->
          <div v-if="bancoDest && planesDisponibles.length" class="mt-2">
            <label :class="labelCls">Plan de cuotas — {{ bancoDest.nombre }}</label>
            <div class="grid grid-cols-3 sm:grid-cols-4 gap-2">
              <button
                v-for="plan in planesDisponibles"
                :key="plan.id"
                type="button"
                class="py-2.5 px-2 rounded-xl border-2 transition-all text-center"
                :class="planSel?.id === plan.id
                  ? 'border-primary-500 bg-orange-50 dark:bg-[#1f1208]'
                  : 'border-slate-200 dark:border-white/10 bg-white dark:bg-[#13131f] hover:border-slate-300'"
                @click="planSel = planSel?.id === plan.id ? null : plan"
              >
                <p class="text-base font-bold font-mono" :class="planSel?.id === plan.id ? 'text-primary-600 dark:text-primary-400' : 'text-slate-800 dark:text-slate-200'">
                  {{ plan.cantCuotas }}
                </p>
                <p class="text-[10px] text-slate-400">cuotas</p>
                <p class="text-[11px] font-semibold mt-0.5" :class="planSel?.id === plan.id ? 'text-primary-500' : 'text-slate-500 dark:text-slate-400'">
                  {{ Number(plan.tasaInteres).toFixed(1) }}% TNA
                </p>
              </button>
            </div>
          </div>
        </div>

        <!-- Campos de financiamiento -->
        <div class="grid grid-cols-2 gap-3">
          <!-- Entidad (auto-filled si hay banco, editable si no) -->
          <div class="col-span-2">
            <label :class="labelCls">Entidad financiera *</label>
            <input
              v-model="wizard.pago.financiamiento.entidad"
              type="text"
              placeholder="Banco Nación / Entidad..."
              :class="inputCls"
              :readonly="!!bancoDest"
            />
          </div>

          <div>
            <label :class="labelCls">Monto financiado *</label>
            <input v-model="wizard.pago.financiamiento.montoFinanciado" type="number" min="0" step="any" :class="inputCls"/>
          </div>

          <div>
            <label :class="labelCls">Cantidad de cuotas *</label>
            <input
              v-model="wizard.pago.financiamiento.cantCuotas"
              type="number" min="1"
              :class="inputCls"
              :readonly="!!planSel"
            />
          </div>

          <div>
            <label :class="labelCls">Tasa anual (% TNA)</label>
            <input
              v-model="wizard.pago.financiamiento.tasaInteres"
              type="number" min="0" step="0.01"
              :class="inputCls"
              :readonly="!!planSel"
            />
          </div>

          <!-- Cuota calculada -->
          <div class="flex flex-col justify-end">
            <div class="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1a1a2e] p-3">
              <p class="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide">Cuota estimada</p>
              <p class="text-xl font-bold font-mono text-slate-900 dark:text-white mt-0.5">{{ currency(valorCuotaCalculado) }}</p>
              <p v-if="planSel" class="text-[10px] text-primary-500 mt-0.5">{{ bancoDest?.nombre }} · {{ planSel.cantCuotas }} cuotas</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
