<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../../auth/store/authStore.js'
import { useVentas } from '../composables/useVentas.js'
import { useFacturacion } from '../../facturacion/composables/useFacturacion.js'
import AppBadge from '../../../shared/components/AppBadge.vue'
import AppModal from '../../../shared/components/AppModal.vue'
import AppSelect from '../../../shared/components/AppSelect.vue'
import { currency, date } from '../../../shared/utils/format.js'
import api from '../../../plugins/axios.js'

const route     = useRoute()
const router    = useRouter()
const authStore = useAuthStore()
const { venta, loading, fetchVenta, actualizarEstado } = useVentas()
const { factura, fetchFactura, emitirFactura }         = useFacturacion()

const descargandoPDF = ref(false)

async function descargarPDF() {
  descargandoPDF.value = true
  try {
    const response = await api.get(`/facturacion/venta/${route.params.id}/pdf`, {
      responseType: 'blob',
    })
    const blob   = new Blob([response.data], { type: 'application/pdf' })
    const url    = URL.createObjectURL(blob)
    const a      = document.createElement('a')
    const numero = factura.value
      ? `${String(factura.value.puntoVenta).padStart(4,'0')}-${String(factura.value.numero).padStart(8,'0')}`
      : route.params.id
    a.href     = url
    a.download = `factura_${numero}.pdf`
    a.click()
    URL.revokeObjectURL(url)
  } catch {
    facturaError.value = 'No se pudo descargar el PDF'
  } finally {
    descargandoPDF.value = false
  }
}

const isGerente    = computed(() => ['ADMIN', 'GERENTE'].includes(authStore.userRole))
const emitiendo    = ref(false)
const facturaError = ref('')

onMounted(async () => {
  await fetchVenta(route.params.id)
  fetchFactura(route.params.id) // carga silenciosa, 404 es normal si aún no hay factura
})

// ── Transiciones de estado ────────────────────────────────────────────────────
const NEXT_ESTADO = { RESERVA: 'EN_TRAMITE', EN_TRAMITE: 'ENTREGADO' }
const LABEL_NEXT  = { RESERVA: 'Iniciar trámite', EN_TRAMITE: 'Marcar como entregado' }
const CAN_CANCEL  = ['RESERVA', 'EN_TRAMITE']

const estadoLoading  = ref(false)
const estadoError    = ref('')
const showCancelConf = ref(false)

async function cambiarEstado(nuevoEstado) {
  estadoLoading.value = true
  estadoError.value   = ''
  try {
    await actualizarEstado(route.params.id, nuevoEstado)
  } catch (err) {
    estadoError.value = err.response?.data?.error ?? 'Error al cambiar estado'
  } finally {
    estadoLoading.value  = false
    showCancelConf.value = false
  }
}

// ── Documentos ────────────────────────────────────────────────────────────────
const showDocModal  = ref(false)
const docForm       = ref({ tipo: 'BOLETO', urlArchivo: '' })
const docSaving     = ref(false)
const TIPOS_DOC     = ['BOLETO', 'CONTRATO', 'CESION', 'OTRO']
const LABEL_DOC     = { BOLETO: 'Boleto', CONTRATO: 'Contrato', CESION: 'Cesión', OTRO: 'Otro' }

const tipoDocOptions = computed(() =>
  TIPOS_DOC.map(t => ({ value: t, label: LABEL_DOC[t] }))
)

async function guardarDoc() {
  docSaving.value = true
  try {
    await api.post(`/ventas/${route.params.id}/documentos`, docForm.value)
    showDocModal.value = false
    docForm.value      = { tipo: 'BOLETO', urlArchivo: '' }
    fetchVenta(route.params.id)
  } finally {
    docSaving.value = false
  }
}

const documentos = computed(() => venta.value?.documentos ?? [])
const postventas  = computed(() => venta.value?.postventas ?? [])

async function emitir() {
  emitiendo.value    = true
  facturaError.value = ''
  try {
    await emitirFactura(route.params.id)
  } catch (err) {
    facturaError.value = err.response?.data?.error ?? 'Error al emitir factura'
  } finally {
    emitiendo.value = false
  }
}
</script>

<template>
  <div class="p-6 max-w-3xl mx-auto space-y-5">

    <button
      class="flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
      @click="router.back()"
    >
      <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
      </svg>
      Volver a ventas
    </button>

    <div v-if="loading" class="flex justify-center py-16">
      <svg class="w-8 h-8 animate-spin text-primary-600" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
      </svg>
    </div>

    <template v-else-if="venta">

      <!-- Header -->
      <div class="bg-white dark:bg-[#1a1a2e] rounded-xl border border-slate-200 dark:border-white/5 p-6">
        <div class="flex items-start justify-between gap-4">
          <div>
            <AppBadge :value="venta.estado" />
            <h1 class="text-xl font-bold text-slate-800 dark:text-white mt-2">
              {{ venta.cliente?.apellido }}, {{ venta.cliente?.nombre }}
            </h1>
            <p class="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
              {{ venta.vehiculo?.marca }} {{ venta.vehiculo?.modelo }} {{ venta.vehiculo?.anio }}
              <span v-if="venta.vehiculo?.patente" class="ml-2 font-mono bg-slate-100 dark:bg-white/10 px-1.5 py-0.5 rounded text-xs">{{ venta.vehiculo.patente }}</span>
            </p>
            <div class="flex gap-4 mt-3 text-sm">
              <div>
                <span class="text-slate-400 dark:text-slate-500 text-xs">Precio final</span>
                <p class="font-bold text-slate-800 dark:text-white">{{ currency(venta.precioFinal) }}</p>
              </div>
              <div>
                <span class="text-slate-400 dark:text-slate-500 text-xs">Forma de pago</span>
                <p><AppBadge :value="venta.formaPago" size="xs" /></p>
              </div>
              <div>
                <span class="text-slate-400 dark:text-slate-500 text-xs">Vendedor</span>
                <p class="text-sm font-medium text-slate-700 dark:text-slate-200">{{ venta.vendedor?.nombre }}</p>
              </div>
            </div>
          </div>

          <!-- Botones de estado -->
          <div class="flex flex-col gap-2 flex-shrink-0">
            <p v-if="estadoError" class="text-xs text-red-600 max-w-xs text-right">{{ estadoError }}</p>
            <button
              v-if="NEXT_ESTADO[venta.estado]"
              class="text-sm bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-60"
              :disabled="estadoLoading"
              @click="cambiarEstado(NEXT_ESTADO[venta.estado])"
            >
              {{ LABEL_NEXT[venta.estado] }}
            </button>
            <button
              v-if="CAN_CANCEL.includes(venta.estado)"
              class="text-sm text-red-600 hover:text-red-700 border border-red-200 hover:border-red-400 px-4 py-2 rounded-lg transition-colors"
              @click="showCancelConf = true"
            >
              Cancelar venta
            </button>
          </div>
        </div>
      </div>

      <!-- ── Factura electrónica ──────────────────────────────────────────── -->
      <div class="bg-white dark:bg-[#1a1a2e] rounded-xl border border-slate-200 dark:border-white/5 overflow-hidden">
        <div class="px-5 py-3.5 border-b border-slate-200 dark:border-white/10 flex items-center justify-between">
          <div class="flex items-center gap-2">
            <svg class="w-4 h-4 text-slate-400 dark:text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z"/>
            </svg>
            <h3 class="font-semibold text-slate-800 dark:text-white text-sm">Factura electrónica</h3>
          </div>
          <!-- Botón emitir (solo si no hay factura emitida y venta entregada) -->
          <button
            v-if="isGerente && !factura && venta.estado === 'ENTREGADO'"
            class="inline-flex items-center gap-1.5 text-xs font-semibold text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-500/10 hover:bg-primary-100 dark:hover:bg-primary-500/20 border border-primary-200 dark:border-primary-500/30 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-60"
            :disabled="emitiendo"
            @click="emitir"
          >
            <svg v-if="!emitiendo" class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15"/>
            </svg>
            <svg v-else class="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
            </svg>
            {{ emitiendo ? 'Emitiendo...' : 'Emitir factura' }}
          </button>
        </div>

        <!-- Sin factura -->
        <div v-if="!factura" class="px-5 py-5 text-center">
          <p class="text-sm text-slate-400 dark:text-slate-500">
            {{ venta.estado === 'ENTREGADO'
                ? isGerente ? 'Sin factura emitida. Usá el botón para generarla.' : 'Sin factura emitida aún.'
                : 'La factura se puede emitir una vez que la venta esté en estado Entregado.' }}
          </p>
          <p v-if="facturaError" class="text-xs text-red-600 dark:text-red-400 mt-2 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-lg px-3 py-2">
            {{ facturaError }}
          </p>
        </div>

        <!-- Factura emitida -->
        <div v-else class="p-5 space-y-4">
          <!-- Demo badge -->
          <div v-if="factura.demoMode" class="flex items-center gap-2 px-3 py-2 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-lg">
            <svg class="w-3.5 h-3.5 text-amber-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"/>
            </svg>
            <span class="text-xs font-medium text-amber-700 dark:text-amber-400">Modo DEMO — CAE simulado, no enviado a AFIP</span>
          </div>

          <!-- Datos principales -->
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <p class="text-[11px] text-slate-400 dark:text-slate-500 mb-0.5">Tipo</p>
              <p class="text-sm font-semibold text-slate-800 dark:text-white">
                {{ { FACTURA_A: 'Factura A', FACTURA_B: 'Factura B', FACTURA_C: 'Factura C' }[factura.tipo] }}
              </p>
            </div>
            <div>
              <p class="text-[11px] text-slate-400 dark:text-slate-500 mb-0.5">Número</p>
              <p class="text-sm font-mono font-semibold text-slate-800 dark:text-white">
                {{ String(factura.puntoVenta).padStart(4, '0') }}-{{ String(factura.numero).padStart(8, '0') }}
              </p>
            </div>
            <div>
              <p class="text-[11px] text-slate-400 dark:text-slate-500 mb-0.5">Fecha emisión</p>
              <p class="text-sm text-slate-700 dark:text-slate-200">{{ date(factura.fechaEmision) }}</p>
            </div>
            <div>
              <p class="text-[11px] text-slate-400 dark:text-slate-500 mb-0.5">Vto. CAE</p>
              <p class="text-sm text-slate-700 dark:text-slate-200">{{ factura.caeFechaVencimiento ? date(factura.caeFechaVencimiento) : '—' }}</p>
            </div>
          </div>

          <!-- CAE -->
          <div class="bg-slate-50 dark:bg-white/[0.03] rounded-xl border border-slate-200 dark:border-white/10 px-4 py-3 flex items-center justify-between gap-3">
            <div>
              <p class="text-[11px] text-slate-400 dark:text-slate-500">CAE (Código de Autorización Electrónico)</p>
              <p class="text-base font-mono font-bold tracking-widest text-slate-800 dark:text-white mt-0.5">{{ factura.cae }}</p>
            </div>
            <div class="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-500/15 flex items-center justify-center shrink-0">
              <svg class="w-4 h-4 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="m4.5 12.75 6 6 9-13.5"/>
              </svg>
            </div>
          </div>

          <!-- Botón descargar PDF -->
          <div class="flex justify-end">
            <button
              class="inline-flex items-center gap-2 text-sm font-semibold text-white bg-slate-800 dark:bg-white/10 hover:bg-slate-700 dark:hover:bg-white/20 px-4 py-2 rounded-xl transition-all disabled:opacity-60"
              :disabled="descargandoPDF"
              @click="descargarPDF"
            >
              <svg v-if="!descargandoPDF" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3"/>
              </svg>
              <svg v-else class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
              </svg>
              {{ descargandoPDF ? 'Generando...' : 'Descargar PDF' }}
            </button>
          </div>

          <!-- Importes -->
          <div class="grid grid-cols-3 gap-3">
            <div class="bg-slate-50 dark:bg-white/[0.03] rounded-xl border border-slate-200 dark:border-white/10 px-4 py-3 text-center">
              <p class="text-[11px] text-slate-400 dark:text-slate-500">Neto</p>
              <p class="text-sm font-bold text-slate-800 dark:text-white mt-0.5">{{ currency(factura.importeNeto) }}</p>
            </div>
            <div class="bg-slate-50 dark:bg-white/[0.03] rounded-xl border border-slate-200 dark:border-white/10 px-4 py-3 text-center">
              <p class="text-[11px] text-slate-400 dark:text-slate-500">IVA 21%</p>
              <p class="text-sm font-bold text-slate-800 dark:text-white mt-0.5">{{ currency(factura.importeIva) }}</p>
            </div>
            <div class="bg-primary-50 dark:bg-primary-500/10 rounded-xl border border-primary-100 dark:border-primary-500/20 px-4 py-3 text-center">
              <p class="text-[11px] text-primary-600 dark:text-primary-400">Total</p>
              <p class="text-sm font-bold text-primary-700 dark:text-primary-300 mt-0.5">{{ currency(factura.importeTotal) }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Permuta -->
      <div v-if="venta.permuta" class="bg-white dark:bg-[#1a1a2e] rounded-xl border border-slate-200 dark:border-white/5 p-5">
        <h3 class="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-3">Permuta</h3>
        <div class="grid grid-cols-3 gap-3 text-sm">
          <div><p class="text-xs text-slate-400 dark:text-slate-500">Vehículo</p><p class="font-medium text-slate-800 dark:text-white">{{ venta.permuta.marca }} {{ venta.permuta.modelo }} {{ venta.permuta.anio }}</p></div>
          <div><p class="text-xs text-slate-400 dark:text-slate-500">Patente</p><p class="font-mono text-slate-800 dark:text-white">{{ venta.permuta.patente || '—' }}</p></div>
          <div><p class="text-xs text-slate-400 dark:text-slate-500">Tasación</p><p class="font-bold text-slate-800 dark:text-white">{{ currency(venta.permuta.valorTasacion) }}</p></div>
        </div>
      </div>

      <!-- Financiamiento -->
      <div v-if="venta.financiamiento" class="bg-white dark:bg-[#1a1a2e] rounded-xl border border-slate-200 dark:border-white/5 p-5 space-y-4">
        <div class="flex items-center justify-between">
          <h3 class="text-sm font-semibold text-slate-700 dark:text-slate-200">Financiamiento</h3>
          <AppBadge :value="venta.financiamiento.estado" size="xs" />
        </div>

        <!-- Datos financiamiento -->
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
          <div><p class="text-xs text-slate-400">Entidad</p><p class="font-medium text-slate-800 dark:text-slate-200">{{ venta.financiamiento.entidad }}</p></div>
          <div><p class="text-xs text-slate-400">Monto financiado</p><p class="font-medium font-mono text-slate-800 dark:text-slate-200">{{ currency(venta.financiamiento.montoFinanciado) }}</p></div>
          <div><p class="text-xs text-slate-400">Cuotas</p><p class="font-medium text-slate-800 dark:text-slate-200">{{ venta.financiamiento.cantCuotas }}</p></div>
          <div><p class="text-xs text-slate-400">Valor cuota</p><p class="font-bold font-mono text-slate-800 dark:text-slate-200">{{ currency(venta.financiamiento.valorCuota) }}</p></div>
        </div>

        <div v-if="venta.financiamiento.numeroExpediente" class="pt-3 border-t border-slate-200 dark:border-white/10">
          <p class="text-xs text-slate-400 dark:text-slate-500">Expediente: <span class="font-mono text-slate-600 dark:text-slate-300">{{ venta.financiamiento.numeroExpediente }}</span></p>
        </div>
      </div>

      <!-- Documentos -->
      <div class="bg-white dark:bg-[#1a1a2e] rounded-xl border border-slate-200 dark:border-white/5">
        <div class="px-5 py-4 border-b border-slate-200 dark:border-white/10 flex items-center justify-between">
          <h3 class="font-semibold text-slate-800 dark:text-white">Documentos</h3>
          <button class="text-xs text-primary-600 dark:text-primary-400 font-medium hover:text-primary-700" @click="showDocModal = true">+ Agregar</button>
        </div>
        <div v-if="!documentos.length" class="px-5 py-6 text-sm text-slate-400 text-center">Sin documentos.</div>
        <div v-else class="divide-y divide-slate-200 dark:divide-white/5">
          <div v-for="d in documentos" :key="d.id" class="px-5 py-3 flex items-center justify-between text-sm">
            <span class="font-medium text-slate-700 dark:text-slate-200">{{ LABEL_DOC[d.tipo] }}</span>
            <a v-if="d.urlArchivo" :href="d.urlArchivo" target="_blank" class="text-xs text-primary-600 dark:text-primary-400 hover:underline">Ver archivo</a>
            <span v-else class="text-xs text-slate-400">Sin archivo</span>
          </div>
        </div>
      </div>

      <!-- Postventa -->
      <div v-if="postventas.length" class="bg-white dark:bg-[#1a1a2e] rounded-xl border border-slate-200 dark:border-white/5">
        <div class="px-5 py-4 border-b border-slate-200 dark:border-white/10">
          <h3 class="font-semibold text-slate-800 dark:text-white">Postventa</h3>
        </div>
        <div class="divide-y divide-slate-200 dark:divide-white/5">
          <div v-for="pv in postventas" :key="pv.id" class="px-5 py-3">
            <div class="flex items-center gap-2 mb-0.5">
              <AppBadge :value="pv.estado" size="xs" />
              <span class="text-xs text-slate-500 dark:text-slate-400">{{ { GARANTIA: 'Garantía', RECLAMO: 'Reclamo', CONSULTA: 'Consulta', SEGUIMIENTO: 'Seguimiento' }[pv.tipo] }}</span>
            </div>
            <p class="text-sm text-slate-700 dark:text-slate-300">{{ pv.descripcion }}</p>
            <p class="text-xs text-slate-400 mt-0.5">{{ date(pv.fechaContacto) }}</p>
          </div>
        </div>
      </div>

    </template>

    <!-- Modal cancelar -->
    <AppModal v-model="showCancelConf" title="Cancelar venta" size="sm">
      <p class="text-sm text-slate-600 dark:text-slate-300">¿Estás seguro? Esta acción devolverá el vehículo al stock como disponible.</p>
      <template #footer="{ close }">
        <button class="text-sm px-4 py-2 rounded-lg border border-slate-300 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors" @click="close">No, volver</button>
        <button
          class="text-sm bg-red-600 hover:bg-red-700 text-white px-5 py-2 rounded-lg font-medium disabled:opacity-60"
          :disabled="estadoLoading"
          @click="cambiarEstado('CANCELADO')"
        >
          Sí, cancelar venta
        </button>
      </template>
    </AppModal>

    <!-- Modal nuevo documento -->
    <AppModal v-model="showDocModal" title="Agregar documento" size="sm">
      <div class="space-y-3">
        <div>
          <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Tipo</label>
          <AppSelect v-model="docForm.tipo" :options="tipoDocOptions" />
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">URL / Ruta del archivo</label>
          <input v-model="docForm.urlArchivo" type="text" placeholder="Opcional"
            class="w-full rounded-lg border-slate-300 dark:border-white/10 bg-white dark:bg-white/5 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 text-sm focus:border-primary-500 focus:ring-primary-500" />
        </div>
      </div>
      <template #footer="{ close }">
        <button class="text-sm px-4 py-2 rounded-lg border border-slate-300 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors" @click="close">Cancelar</button>
        <button
          class="text-sm bg-primary-600 hover:bg-primary-700 text-white px-5 py-2 rounded-lg font-medium disabled:opacity-60"
          :disabled="docSaving"
          @click="guardarDoc"
        >
          {{ docSaving ? 'Guardando...' : 'Guardar' }}
        </button>
      </template>
    </AppModal>

  </div>
</template>
