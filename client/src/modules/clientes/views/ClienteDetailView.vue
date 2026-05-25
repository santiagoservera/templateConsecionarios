<script setup>
import { computed, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useClientes } from "../composables/useClientes.js";
import AppBadge from "../../../shared/components/AppBadge.vue";
import { date, currency } from "../../../shared/utils/format.js";

const route = useRoute();
const router = useRouter();
const { cliente, loading, fetchCliente } = useClientes();

onMounted(() => fetchCliente(route.params.id));

const leadsActivos = computed(() =>
  (cliente.value?.leads ?? []).filter(
    (l) => !["GANADO", "PERDIDO"].includes(l.etapa),
  ),
);
const historialVentas = computed(() => cliente.value?.ventas ?? []);

const LABEL_ORIGEN = {
  VISITA: "Visita",
  WHATSAPP: "WhatsApp",
  INSTAGRAM: "Instagram",
  REFERIDO: "Referido",
  WEB: "Web",
  OTRO: "Otro",
};
</script>

<template>
  <div class="p-6 max-w-4xl mx-auto space-y-5">
    <!-- Volver -->
    <button
      class="flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
      @click="router.back()"
    >
      <svg
        class="w-4 h-4"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        stroke-width="2"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18"
        />
      </svg>
      Volver a clientes
    </button>

    <!-- Loading -->
    <div v-if="loading" class="flex justify-center py-16">
      <svg
        class="w-8 h-8 animate-spin text-primary-600"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle
          class="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          stroke-width="4"
        />
        <path
          class="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8v8H4z"
        />
      </svg>
    </div>

    <template v-else-if="cliente">
      <!-- Datos del cliente -->
      <div
        class="bg-white dark:bg-[#1a1a2e] rounded-xl border border-slate-200 dark:border-white/5 p-6"
      >
        <div class="flex items-start justify-between">
          <div class="flex items-start gap-4">
            <!-- Avatar inicial -->
            <div
              class="w-12 h-12 bg-primary-100 dark:bg-primary-500/20 rounded-full flex items-center justify-center flex-shrink-0"
            >
              <span
                class="text-primary-700 dark:text-primary-400 font-bold text-lg"
                >{{ cliente.nombre.charAt(0) }}</span
              >
            </div>
            <div>
              <h1 class="text-xl font-bold text-slate-800 dark:text-white">
                {{ cliente.apellido }}, {{ cliente.nombre }}
              </h1>
              <div
                class="flex flex-wrap items-center gap-3 mt-1 text-sm text-slate-500 dark:text-slate-400"
              >
                <span v-if="cliente.dniCuit"
                  >DNI/CUIT: {{ cliente.dniCuit }}</span
                >
                <a
                  v-if="cliente.telefono"
                  :href="`https://wa.me/${cliente.telefono.replace(/\D/g, '')}`"
                  target="_blank"
                  rel="noopener"
                  class="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 hover:text-emerald-500 dark:hover:text-emerald-300 transition-colors"
                  title="Abrir en WhatsApp"
                >
                  <svg class="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                  {{ cliente.telefono }}
                </a>
                <span v-if="cliente.email">{{ cliente.email }}</span>
              </div>
              <div class="flex items-center gap-2 mt-2">
                <AppBadge
                  :value="cliente.origen"
                  :label="LABEL_ORIGEN[cliente.origen]"
                  size="xs"
                />
                <span
                  v-if="cliente.vendedor"
                  class="text-xs text-slate-400 dark:text-slate-500"
                >
                  Vendedor: {{ cliente.vendedor.nombre }}
                </span>
              </div>
            </div>
          </div>
          <p class="text-xs text-slate-400 dark:text-slate-500 flex-shrink-0">
            Desde {{ date(cliente.createdAt) }}
          </p>
        </div>

        <div
          v-if="cliente.direccion"
          class="mt-3 pt-3 border-t border-slate-200 dark:border-white/10 text-sm text-slate-500 dark:text-slate-400"
        >
          📍 {{ cliente.direccion }}
        </div>
      </div>

      <!-- Leads activos + Historial de ventas -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <!-- Leads activos -->
        <div
          class="bg-white dark:bg-[#1a1a2e] rounded-xl border border-slate-200 dark:border-white/5"
        >
          <div
            class="px-5 py-4 border-b border-slate-200 dark:border-white/10 flex items-center justify-between"
          >
            <h2 class="font-semibold text-slate-800 dark:text-white">
              Leads activos
            </h2>
            <span class="text-xs text-slate-400 dark:text-slate-500"
              >{{ leadsActivos.length }} activo{{
                leadsActivos.length !== 1 ? "s" : ""
              }}</span
            >
          </div>

          <div
            v-if="!leadsActivos.length"
            class="px-5 py-8 text-center text-sm text-slate-400 dark:text-slate-500"
          >
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
                <p
                  v-if="lead.vehiculoInteres"
                  class="text-xs text-slate-500 dark:text-slate-400 mt-1 truncate"
                >
                  {{ lead.vehiculoInteres.marca }}
                  {{ lead.vehiculoInteres.modelo }}
                  {{ lead.vehiculoInteres.anio }}
                </p>
                <p
                  v-if="lead.proximoContacto"
                  class="text-xs text-slate-400 dark:text-slate-500 mt-0.5"
                >
                  Próximo: {{ date(lead.proximoContacto) }}
                </p>
              </div>
              <p
                class="text-xs text-slate-400 dark:text-slate-500 flex-shrink-0"
              >
                {{ date(lead.createdAt) }}
              </p>
            </div>
          </div>
        </div>

        <!-- Historial de ventas -->
        <div
          class="bg-white dark:bg-[#1a1a2e] rounded-xl border border-slate-200 dark:border-white/5"
        >
          <div
            class="px-5 py-4 border-b border-slate-200 dark:border-white/10 flex items-center justify-between"
          >
            <h2 class="font-semibold text-slate-800 dark:text-white">
              Historial de ventas
            </h2>
            <span class="text-xs text-slate-400 dark:text-slate-500"
              >{{ historialVentas.length }} venta{{
                historialVentas.length !== 1 ? "s" : ""
              }}</span
            >
          </div>

          <div
            v-if="!historialVentas.length"
            class="px-5 py-8 text-center text-sm text-slate-400 dark:text-slate-500"
          >
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
                <p
                  class="text-sm font-medium text-slate-800 dark:text-white truncate"
                >
                  {{ venta.vehiculo?.marca }} {{ venta.vehiculo?.modelo }}
                  {{ venta.vehiculo?.anio }}
                </p>
                <div class="flex items-center gap-2 mt-0.5">
                  <AppBadge :value="venta.estado" size="xs" />
                  <span class="text-xs text-slate-400 dark:text-slate-500">{{
                    date(venta.fechaReserva)
                  }}</span>
                </div>
              </div>
              <p
                class="text-sm font-semibold text-slate-700 dark:text-slate-100 flex-shrink-0"
              >
                {{ currency(venta.precioFinal) }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>
