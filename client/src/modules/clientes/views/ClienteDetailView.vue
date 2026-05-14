<script setup>
import { computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useClientes } from '../composables/useClientes.js'
import AppBadge from '../../../shared/components/AppBadge.vue'
import { date, currency } from '../../../shared/utils/format.js'

const route  = useRoute()
const router = useRouter()
const { cliente, loading, fetchCliente } = useClientes()

onMounted(() => fetchCliente(route.params.id))

const leadsActivos = computed(() =>
  (cliente.value?.leads ?? []).filter((l) => !['GANADO', 'PERDIDO'].includes(l.etapa))
)
const historialVentas = computed(() => cliente.value?.ventas ?? [])

const LABEL_ORIGEN = {
  VISITA: 'Visita', WHATSAPP: 'WhatsApp', INSTAGRAM: 'Instagram',
  REFERIDO: 'Referido', WEB: 'Web', OTRO: 'Otro',
}
</script>

<template>
  <div class="p-6 max-w-4xl mx-auto space-y-5">

    <!-- Volver -->
    <button
      class="flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
      @click="router.back()"
    >
      <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
      </svg>
      Volver a clientes
    </button>

    <!-- Loading -->
    <div v-if="loading" class="flex justify-center py-16">
      <svg class="w-8 h-8 animate-spin text-primary-600" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
      </svg>
    </div>

    <template v-else-if="cliente">

      <!-- Datos del cliente -->
      <div class="bg-white dark:bg-[#1a1a2e] rounded-xl border border-slate-200 dark:border-white/5 p-6">
        <div class="flex items-start justify-between">
          <div class="flex items-start gap-4">
            <!-- Avatar inicial -->
            <div class="w-12 h-12 bg-primary-100 dark:bg-primary-500/20 rounded-full flex items-center justify-center flex-shrink-0">
              <span class="text-primary-700 dark:text-primary-400 font-bold text-lg">{{ cliente.nombre.charAt(0) }}</span>
            </div>
            <div>
              <h1 class="text-xl font-bold text-slate-800 dark:text-white">
                {{ cliente.apellido }}, {{ cliente.nombre }}
              </h1>
              <div class="flex flex-wrap items-center gap-3 mt-1 text-sm text-slate-500 dark:text-slate-400">
                <span v-if="cliente.dniCuit">DNI/CUIT: {{ cliente.dniCuit }}</span>
                <span v-if="cliente.telefono">📞 {{ cliente.telefono }}</span>
                <span v-if="cliente.email">{{ cliente.email }}</span>
              </div>
              <div class="flex items-center gap-2 mt-2">
                <AppBadge :value="cliente.origen" :label="LABEL_ORIGEN[cliente.origen]" size="xs" />
                <span v-if="cliente.vendedor" class="text-xs text-slate-400 dark:text-slate-500">
                  Vendedor: {{ cliente.vendedor.nombre }}
                </span>
              </div>
            </div>
          </div>
          <p class="text-xs text-slate-400 dark:text-slate-500 flex-shrink-0">Desde {{ date(cliente.createdAt) }}</p>
        </div>

        <div v-if="cliente.direccion" class="mt-3 pt-3 border-t border-slate-200 dark:border-white/10 text-sm text-slate-500 dark:text-slate-400">
          📍 {{ cliente.direccion }}
        </div>
      </div>

      <!-- Leads activos + Historial de ventas -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-5">

        <!-- Leads activos -->
        <div class="bg-white dark:bg-[#1a1a2e] rounded-xl border border-slate-200 dark:border-white/5">
          <div class="px-5 py-4 border-b border-slate-200 dark:border-white/10 flex items-center justify-between">
            <h2 class="font-semibold text-slate-800 dark:text-white">Leads activos</h2>
            <span class="text-xs text-slate-400 dark:text-slate-500">{{ leadsActivos.length }} activo{{ leadsActivos.length !== 1 ? 's' : '' }}</span>
          </div>

          <div v-if="!leadsActivos.length" class="px-5 py-8 text-center text-sm text-slate-400 dark:text-slate-500">
            Sin leads activos.
          </div>

          <div v-else class="divide-y divide-slate-200 dark:divide-white/5">
            <div
              v-for="lead in leadsActivos"
              :key="lead.id"
              class="px-5 py-3 flex items-center justify-between gap-3"
            >
              <div class="min-w-0">
                <AppBadge :value="lead.etapa" size="xs" />
                <p v-if="lead.vehiculoInteres" class="text-xs text-slate-500 dark:text-slate-400 mt-1 truncate">
                  {{ lead.vehiculoInteres.marca }} {{ lead.vehiculoInteres.modelo }} {{ lead.vehiculoInteres.anio }}
                </p>
                <p v-if="lead.proximoContacto" class="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                  Próximo: {{ date(lead.proximoContacto) }}
                </p>
              </div>
              <p class="text-xs text-slate-400 dark:text-slate-500 flex-shrink-0">{{ date(lead.createdAt) }}</p>
            </div>
          </div>
        </div>

        <!-- Historial de ventas -->
        <div class="bg-white dark:bg-[#1a1a2e] rounded-xl border border-slate-200 dark:border-white/5">
          <div class="px-5 py-4 border-b border-slate-200 dark:border-white/10 flex items-center justify-between">
            <h2 class="font-semibold text-slate-800 dark:text-white">Historial de ventas</h2>
            <span class="text-xs text-slate-400 dark:text-slate-500">{{ historialVentas.length }} venta{{ historialVentas.length !== 1 ? 's' : '' }}</span>
          </div>

          <div v-if="!historialVentas.length" class="px-5 py-8 text-center text-sm text-slate-400 dark:text-slate-500">
            Sin ventas registradas.
          </div>

          <div v-else class="divide-y divide-slate-200 dark:divide-white/5">
            <div
              v-for="venta in historialVentas"
              :key="venta.id"
              class="px-5 py-3 flex items-center justify-between gap-3 cursor-pointer hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
              @click="router.push(`/ventas/${venta.id}`)"
            >
              <div class="min-w-0">
                <p class="text-sm font-medium text-slate-800 dark:text-white truncate">
                  {{ venta.vehiculo?.marca }} {{ venta.vehiculo?.modelo }} {{ venta.vehiculo?.anio }}
                </p>
                <div class="flex items-center gap-2 mt-0.5">
                  <AppBadge :value="venta.estado" size="xs" />
                  <span class="text-xs text-slate-400 dark:text-slate-500">{{ date(venta.fechaReserva) }}</span>
                </div>
              </div>
              <p class="text-sm font-semibold text-slate-700 dark:text-slate-100 flex-shrink-0">
                {{ currency(venta.precioFinal) }}
              </p>
            </div>
          </div>
        </div>

      </div>
    </template>
  </div>
</template>
