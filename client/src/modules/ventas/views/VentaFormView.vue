<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useVentaWizardStore } from '../store/ventaWizardStore.js'
import { useVentas } from '../composables/useVentas.js'
import { useToast } from '../../../shared/composables/useToast.js'
import PasoCliente      from '../components/PasoCliente.vue'
import PasoVehiculo     from '../components/PasoVehiculo.vue'
import PasoPago         from '../components/PasoPago.vue'
import PasoConfirmacion from '../components/PasoConfirmacion.vue'

const router = useRouter()
const wizard = useVentaWizardStore()
const { crearVenta, agregarPermuta, agregarFinanciamiento } = useVentas()
const toast  = useToast()

onMounted(() => wizard.reset())

const STEPS = ['Cliente', 'Vehículo', 'Pago', 'Confirmación']
const step  = ref(1)

const stepError   = ref('')
const submitting  = ref(false)
const submitError = ref('')

function next() {
  stepError.value = ''
  if (step.value === 1 && !wizard.cliente)           { stepError.value = 'Seleccioná un cliente para continuar'; return }
  if (step.value === 2 && !wizard.vehiculo)          { stepError.value = 'Seleccioná un vehículo para continuar'; return }
  if (step.value === 3 && !wizard.pago.precioFinal)  { stepError.value = 'Ingresá el precio final para continuar'; return }
  if (step.value < STEPS.length) step.value++
}

function prev() {
  if (step.value > 1) { step.value--; stepError.value = '' }
}

async function confirmar() {
  submitting.value  = true
  submitError.value = ''
  try {
    const venta = await crearVenta({
      clienteId:           wizard.cliente.id,
      vehiculoId:          wizard.vehiculo.id,
      precioFinal:         Number(wizard.pago.precioFinal),
      formaPago:           wizard.pago.formaPago,
      tienePermuta:        wizard.pago.tienePermuta,
      tieneFinanciamiento: wizard.pago.tieneFinanciamiento,
    })
    if (wizard.pago.tienePermuta) {
      await agregarPermuta(venta.id, {
        marca: wizard.pago.permuta.marca, modelo: wizard.pago.permuta.modelo,
        anio: Number(wizard.pago.permuta.anio), patente: wizard.pago.permuta.patente || undefined,
        km: Number(wizard.pago.permuta.km), valorTasacion: Number(wizard.pago.permuta.valorTasacion),
      })
    }
    if (wizard.pago.tieneFinanciamiento) {
      await agregarFinanciamiento(venta.id, {
        entidad: wizard.pago.financiamiento.entidad,
        montoFinanciado: Number(wizard.pago.financiamiento.montoFinanciado),
        tasaInteres: Number(wizard.pago.financiamiento.tasaInteres),
        cantCuotas: Number(wizard.pago.financiamiento.cantCuotas),
        valorCuota: Number(wizard.pago.financiamiento.valorCuota),
      })
    }
    const clienteNombre  = `${wizard.cliente?.nombre ?? ''} ${wizard.cliente?.apellido ?? ''}`.trim()
    const vehiculoNombre = `${wizard.vehiculo?.marca ?? ''} ${wizard.vehiculo?.modelo ?? ''} ${wizard.vehiculo?.anio ?? ''}`.trim()
    wizard.reset()
    toast.success('Venta registrada', `${clienteNombre} — ${vehiculoNombre}`)
    router.push('/ventas')
  } catch (err) {
    submitError.value = err.response?.data?.error ?? 'Error al procesar la venta'
    toast.error('Error al registrar la venta', submitError.value)
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="p-6 max-w-2xl mx-auto space-y-6 animate-fade-in">

    <!-- Encabezado -->
    <div class="flex items-center gap-3">
      <button
        class="p-2 rounded-xl text-slate-500 dark:text-slate-400
               hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
        @click="router.back()"
      >
        <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18"/>
        </svg>
      </button>
      <div>
        <h1 class="text-2xl font-bold text-slate-900 dark:text-white">Nueva venta</h1>
        <p class="text-sm text-slate-500 dark:text-slate-400">Completá los pasos para registrar la operación</p>
      </div>
    </div>

    <!-- Barra de progreso -->
    <div class="flex items-center">
      <template v-for="(label, i) in STEPS" :key="label">
        <div class="flex flex-col items-center gap-1.5 shrink-0">
          <!-- Círculo -->
          <div
            class="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all"
            :class="step > i + 1
              ? 'bg-emerald-500 text-white shadow-sm'
              : step === i + 1
                ? 'bg-primary-500 text-white ring-4 ring-primary-500/20 shadow-sm shadow-primary-500/30'
                : 'bg-slate-100 dark:bg-white/5 text-slate-400 dark:text-slate-500'"
          >
            <!-- Check si completado -->
            <svg v-if="step > i + 1" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
              <path stroke-linecap="round" stroke-linejoin="round" d="m4.5 12.75 6 6 9-13.5"/>
            </svg>
            <span v-else>{{ i + 1 }}</span>
          </div>
          <!-- Label -->
          <span
            class="text-xs font-medium hidden sm:block transition-colors"
            :class="step === i + 1
              ? 'text-primary-500'
              : step > i + 1
                ? 'text-emerald-500'
                : 'text-slate-400 dark:text-slate-600'"
          >{{ label }}</span>
        </div>

        <!-- Conector -->
        <div
          v-if="i < STEPS.length - 1"
          class="flex-1 h-0.5 mx-2 mb-5 rounded-full transition-colors"
          :class="step > i + 1 ? 'bg-emerald-400' : 'bg-slate-200 dark:bg-white/10'"
        />
      </template>
    </div>

    <!-- Contenido del paso -->
    <div class="bg-white dark:bg-[#1a1a2e] rounded-2xl border border-slate-200 dark:border-white/5 p-6 shadow-card dark:shadow-none">
      <!-- Error de validación del paso -->
      <div
        v-if="stepError"
        class="flex items-center gap-2.5 mb-5 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 px-4 py-3"
      >
        <svg class="w-4 h-4 text-red-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z"/>
        </svg>
        <p class="text-sm text-red-700 dark:text-red-400">{{ stepError }}</p>
      </div>

      <PasoCliente      v-if="step === 1" />
      <PasoVehiculo     v-else-if="step === 2" />
      <PasoPago         v-else-if="step === 3" />
      <PasoConfirmacion v-else-if="step === 4" :loading="submitting" :error="submitError" @confirm="confirmar" />
    </div>

    <!-- Navegación -->
    <div v-if="step < 4" class="flex justify-between">
      <button
        class="inline-flex items-center gap-2 text-sm font-medium px-4 py-2.5 rounded-xl border transition-all disabled:opacity-30 disabled:cursor-not-allowed
               border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400
               hover:bg-slate-50 dark:hover:bg-white/5"
        :disabled="step === 1"
        @click="prev"
      >
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18"/>
        </svg>
        Anterior
      </button>
      <button
        class="inline-flex items-center gap-2 text-sm font-semibold px-5 py-2.5 rounded-xl transition-all
               bg-primary-500 hover:bg-primary-600 text-white shadow-sm hover:shadow-glow active:scale-[0.98]"
        @click="next"
      >
        Siguiente
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3"/>
        </svg>
      </button>
    </div>

  </div>
</template>
