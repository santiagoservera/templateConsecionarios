<script setup>
import { ref, onMounted } from 'vue'
import { useVentaWizardStore } from '../store/ventaWizardStore.js'
import { useVehiculos } from '../../stock/composables/useVehiculos.js'
import AppBadge from '../../../shared/components/AppBadge.vue'
import AppSelect from '../../../shared/components/AppSelect.vue'
import AppPagination from '../../../shared/components/AppPagination.vue'
import { currency, number } from '../../../shared/utils/format.js'

const wizard = useVentaWizardStore()
const { vehiculos, loading, meta, fetchVehiculos } = useVehiculos()
const filters = ref({ marca: '', tipo: '', page: 1, pageSize: 12 })

const TIPO_OPTIONS = [
  { value: '', label: 'Todos' },
  { value: 'AUTO', label: 'Auto' },
  { value: 'MOTO', label: 'Moto' },
]

function load() { fetchVehiculos({ ...filters.value, estado: 'DISPONIBLE' }) }
function applyFilters() { filters.value.page = 1; load() }
function changePage(p) { filters.value.page = p; load() }

onMounted(load)
</script>

<template>
  <div class="space-y-4">
    <div>
      <h2 class="text-lg font-semibold text-slate-900 dark:text-white">Seleccionar vehículo</h2>
      <p class="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Solo se muestran vehículos disponibles para la venta.</p>
    </div>

    <!-- Filtros -->
    <div class="flex gap-2">
      <input
        v-model="filters.marca"
        type="text"
        placeholder="Buscar por marca..."
        class="flex-1 rounded-xl text-sm transition-colors
               border border-slate-200 dark:border-white/10
               bg-white dark:bg-[#0f0f17]
               text-slate-900 dark:text-white
               placeholder-slate-400 dark:placeholder-slate-500
               focus:border-primary-500 focus:ring-primary-500"
        @keyup.enter="applyFilters"
      />
      <AppSelect v-model="filters.tipo" :options="TIPO_OPTIONS" @change="applyFilters" />
      <button
        class="px-3 py-1.5 rounded-xl text-sm font-medium transition-colors
               bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/20
               text-slate-700 dark:text-slate-200"
        @click="applyFilters"
      >
        Filtrar
      </button>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex justify-center py-10">
      <svg class="w-6 h-6 animate-spin text-primary-500" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
      </svg>
    </div>

    <!-- Grilla -->
    <div v-else class="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-72 overflow-y-auto pr-1 custom-scroll">
      <button
        v-for="v in vehiculos"
        :key="v.id"
        class="text-left rounded-xl border-2 p-3 transition-all text-left"
        :class="wizard.vehiculo?.id === v.id
          ? [
              'border-primary-500 shadow-sm',
              'bg-orange-50 dark:bg-[#1f1208]',
            ]
          : [
              'border-slate-200 dark:border-white/10',
              'bg-white dark:bg-[#13131f]',
              'hover:border-slate-300 dark:hover:border-white/20',
              'hover:bg-slate-50 dark:hover:bg-[#1a1a2e]',
            ]"
        @click="wizard.vehiculo = v"
      >
        <!-- Badges -->
        <div class="flex flex-wrap items-center gap-1 mb-2">
          <AppBadge :value="v.tipo" size="xs" />
          <AppBadge :value="v.tipoStock" size="xs" />
        </div>

        <!-- Nombre -->
        <p class="text-sm font-semibold leading-tight"
           :class="wizard.vehiculo?.id === v.id ? 'text-primary-700 dark:text-primary-400' : 'text-slate-800 dark:text-slate-100'">
          {{ v.marca }} {{ v.modelo }}
        </p>

        <!-- Año + km -->
        <p class="text-xs mt-0.5"
           :class="wizard.vehiculo?.id === v.id ? 'text-orange-600/70 dark:text-primary-500/70' : 'text-slate-400 dark:text-slate-500'">
          {{ v.anio }}<span v-if="v.km > 0"> · {{ number(v.km) }} km</span>
        </p>

        <!-- Precio -->
        <p class="text-sm font-bold font-mono mt-1.5"
           :class="wizard.vehiculo?.id === v.id ? 'text-primary-600 dark:text-primary-400' : 'text-slate-900 dark:text-white'">
          {{ currency(v.precioVenta) }}
        </p>

        <!-- Indicador seleccionado -->
        <div v-if="wizard.vehiculo?.id === v.id" class="flex items-center gap-1 mt-1.5 pt-1.5 border-t border-primary-200 dark:border-primary-500/30">
          <svg class="w-3 h-3 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
            <path stroke-linecap="round" stroke-linejoin="round" d="m4.5 12.75 6 6 9-13.5"/>
          </svg>
          <span class="text-[10px] font-semibold text-primary-500">Seleccionado</span>
        </div>
      </button>

      <div v-if="!vehiculos.length" class="col-span-3 text-center py-10 text-sm text-slate-400 dark:text-slate-500">
        <svg class="w-8 h-8 mx-auto mb-2 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1">
          <path stroke-linecap="round" stroke-linejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125"/>
        </svg>
        No hay vehículos disponibles con esos filtros.
      </div>
    </div>

    <AppPagination
      v-if="!loading && meta.total > meta.pageSize"
      :page="meta.page" :total="meta.total" :page-size="meta.pageSize"
      @update:page="changePage"
    />

    <!-- Vehículo seleccionado — banner -->
    <div v-if="wizard.vehiculo"
      class="flex items-center gap-3 p-4 rounded-xl border
             bg-emerald-50 dark:bg-[#0a1f14]
             border-emerald-200 dark:border-emerald-500/30">
      <div class="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center shrink-0">
        <svg class="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="m4.5 12.75 6 6 9-13.5"/>
        </svg>
      </div>
      <div class="min-w-0 flex-1">
        <p class="text-sm font-semibold text-emerald-700 dark:text-emerald-400">
          {{ wizard.vehiculo.marca }} {{ wizard.vehiculo.modelo }} {{ wizard.vehiculo.anio }}
        </p>
        <p class="text-xs font-mono text-emerald-600 dark:text-emerald-500 mt-0.5">
          {{ currency(wizard.vehiculo.precioVenta) }}
        </p>
      </div>
      <button
        class="text-xs font-medium text-emerald-600 dark:text-emerald-500 hover:text-red-500 dark:hover:text-red-400 underline transition-colors"
        @click="wizard.vehiculo = null"
      >
        Cambiar
      </button>
    </div>
  </div>
</template>
