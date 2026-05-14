<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../../auth/store/authStore.js'
import { useVehiculos } from '../composables/useVehiculos.js'
import { usePermisos }  from '../../../shared/composables/usePermisos.js'
import AppBadge       from '../../../shared/components/AppBadge.vue'
import AppPagination  from '../../../shared/components/AppPagination.vue'
import AppSelect      from '../../../shared/components/AppSelect.vue'
import AppImportModal from '../../../shared/components/AppImportModal.vue'
import { currency, number } from '../../../shared/utils/format.js'

const showImport = ref(false)

const router    = useRouter()
const { canDo } = usePermisos()
const { vehiculos, loading, error, meta, fetchVehiculos } = useVehiculos()

const viewMode = ref('grid')
const search   = ref('')
const filters  = ref({ tipo: '', estado: '', tipoStock: '', page: 1, pageSize: 20 })

let searchTimer = null
function onSearchInput() {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => { filters.value.page = 1; load() }, 300)
}

const ESTADOS      = ['DISPONIBLE','RESERVADO','VENDIDO','EN_PREPARACION','EN_CONSIGNACION']
const TIPOS_STOCK  = ['NUEVO','USADO','CONSIGNACION']
const LABEL_ESTADO = { DISPONIBLE:'Disponible', RESERVADO:'Reservado', VENDIDO:'Vendido', EN_PREPARACION:'En preparación', EN_CONSIGNACION:'En consignación' }
const LABEL_STOCK  = { NUEVO:'Nuevo', USADO:'Usado', CONSIGNACION:'Consignación' }
const ESTADO_DOT   = { DISPONIBLE:'bg-emerald-400', RESERVADO:'bg-amber-400', VENDIDO:'bg-slate-400', EN_PREPARACION:'bg-blue-400', EN_CONSIGNACION:'bg-violet-400' }

const tipoOptions = [
  { value: '', label: 'Tipo (todos)' },
  { value: 'AUTO', label: 'Auto' },
  { value: 'MOTO', label: 'Moto' },
]
const estadoOptions = computed(() => [
  { value: '', label: 'Estado (todos)' },
  ...ESTADOS.map(e => ({ value: e, label: LABEL_ESTADO[e] })),
])
const tipoStockOptions = computed(() => [
  { value: '', label: 'Tipo stock (todos)' },
  ...TIPOS_STOCK.map(t => ({ value: t, label: LABEL_STOCK[t] })),
])

function load()         { fetchVehiculos({ ...filters.value, q: search.value || undefined }) }
function applyFilters() { filters.value.page = 1; load() }
function clearFilters() { search.value = ''; filters.value = { tipo:'', estado:'', tipoStock:'', page:1, pageSize:20 }; load() }
function changePage(p)  { filters.value.page = p; load() }

const firstFoto = (v) => {
  try { const arr = JSON.parse(v.fotosJson ?? '[]'); return arr[0] ?? null } catch { return null }
}

onMounted(load)
</script>

<template>
  <div class="p-6 space-y-5 animate-fade-in">

    <!-- Encabezado -->
    <div class="flex items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold text-slate-900 dark:text-white">Stock de vehículos</h1>
        <p class="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
          <span class="font-mono font-semibold text-slate-700 dark:text-slate-300">{{ meta.total }}</span>
          vehículo{{ meta.total !== 1 ? 's' : '' }} en inventario
        </p>
      </div>
      <div class="flex items-center gap-2">
        <!-- Toggle vista -->
        <div class="flex items-center bg-white dark:bg-[#1a1a2e] border border-slate-200 dark:border-white/10 rounded-xl p-1 shadow-card dark:shadow-none">
          <button class="p-2 rounded-lg transition-all" :class="viewMode==='grid' ? 'bg-slate-900 dark:bg-white/10 text-white' : 'text-slate-400 hover:text-slate-600'" @click="viewMode='grid'" title="Vista grilla">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z"/></svg>
          </button>
          <button class="p-2 rounded-lg transition-all" :class="viewMode==='list' ? 'bg-slate-900 dark:bg-white/10 text-white' : 'text-slate-400 hover:text-slate-600'" @click="viewMode='list'" title="Vista lista">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0ZM3.75 12h.007v.008H3.75V12Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm-.375 5.25h.007v.008H3.75v-.008Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z"/></svg>
          </button>
        </div>
        <div v-if="canDo('stock','crear')" class="flex items-center gap-2">
          <button
            class="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5 px-3.5 py-2.5 rounded-xl transition-all"
            @click="showImport = true"
          >
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5"/>
            </svg>
            Importar Excel
          </button>
          <router-link to="/stock/nuevo"
            class="inline-flex items-center gap-2 bg-primary-500 hover:bg-primary-600 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-all shadow-sm hover:shadow-glow active:scale-[0.98]">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15"/></svg>
            Nuevo vehículo
          </router-link>
        </div>
      </div>
    </div>

    <!-- Buscador general + filtros -->
    <div class="bg-white dark:bg-[#1a1a2e] rounded-2xl border border-slate-200 dark:border-white/5 shadow-card dark:shadow-none p-4 space-y-3">
      <!-- Buscador por tipeo -->
      <div class="relative">
        <svg class="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"/>
        </svg>
        <input
          v-model="search"
          type="text"
          placeholder="Buscar por marca, modelo, patente, versión..."
          class="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 text-sm focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-colors"
          @input="onSearchInput"
        />
        <button v-if="search" class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors" @click="search=''; applyFilters()">
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12"/>
          </svg>
        </button>
      </div>
      <!-- Filtros secundarios -->
      <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <AppSelect v-model="filters.tipo"      :options="tipoOptions"      @change="applyFilters"/>
        <AppSelect v-model="filters.estado"    :options="estadoOptions"    @change="applyFilters"/>
        <AppSelect v-model="filters.tipoStock" :options="tipoStockOptions" @change="applyFilters"/>
      </div>
      <div class="flex justify-end">
        <button v-if="search || filters.tipo || filters.estado || filters.tipoStock"
          class="text-sm text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 px-3 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
          @click="clearFilters">
          Limpiar filtros
        </button>
      </div>
    </div>

    <div v-if="error" class="rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 px-4 py-3 text-sm text-red-700 dark:text-red-400">{{ error }}</div>
    <div v-if="loading" class="flex justify-center py-20">
      <svg class="w-8 h-8 animate-spin text-primary-500" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg>
    </div>

    <div v-else-if="!vehiculos.length" class="text-center py-20 text-slate-400 dark:text-slate-500">
      <svg class="w-12 h-12 mx-auto mb-3 text-slate-200 dark:text-white/10" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1"><path stroke-linecap="round" stroke-linejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125"/></svg>
      <p class="font-medium text-slate-500 dark:text-slate-400">Sin vehículos</p>
      <p class="text-sm mt-1">Ajustá los filtros o agregá uno nuevo.</p>
    </div>

    <!-- Vista grilla -->
    <div v-else-if="viewMode==='grid'" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
      <div v-for="v in vehiculos" :key="v.id"
        class="bg-white dark:bg-[#1a1a2e] rounded-2xl border border-slate-200 dark:border-white/10 overflow-hidden cursor-pointer shadow-card dark:shadow-none hover:shadow-card-lg dark:hover:bg-[#1e1e35] hover:-translate-y-1 transition-all duration-200 group"
        @click="router.push(`/stock/${v.id}`)">
        <div class="aspect-video bg-gradient-to-br from-slate-100 to-slate-200 dark:from-white/5 dark:to-white/3 overflow-hidden relative">
          <img v-if="firstFoto(v)" :src="firstFoto(v)" :alt="`${v.marca} ${v.modelo}`" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"/>
          <div v-else class="w-full h-full flex flex-col items-center justify-center gap-1">
            <svg class="w-10 h-10 text-slate-300 dark:text-white/10" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1"><path stroke-linecap="round" stroke-linejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25"/></svg>
            <span class="text-xs text-slate-300 dark:text-white/20 font-medium">{{ v.marca }}</span>
          </div>
          <div class="absolute top-2 left-2 flex items-center gap-1.5 bg-white/90 dark:bg-black/60 backdrop-blur-sm px-2.5 py-1 rounded-full shadow-sm">
            <div class="w-1.5 h-1.5 rounded-full" :class="ESTADO_DOT[v.estado]??'bg-slate-400'"/>
            <span class="text-[10px] font-semibold text-slate-700 dark:text-slate-200">{{ LABEL_ESTADO[v.estado]??v.estado }}</span>
          </div>
          <div class="absolute top-2 right-2">
            <span class="text-[10px] font-bold bg-slate-900/80 dark:bg-black/70 text-white px-2 py-0.5 rounded-full">{{ LABEL_STOCK[v.tipoStock]??v.tipoStock }}</span>
          </div>
        </div>
        <div class="p-4">
          <div class="flex items-center justify-between mb-1">
            <span class="text-xs font-semibold text-slate-400 dark:text-slate-500">{{ v.anio }}</span>
            <AppBadge :value="v.tipo" size="xs"/>
          </div>
          <p class="font-bold text-slate-900 dark:text-white text-base leading-tight">{{ v.marca }} {{ v.modelo }}</p>
          <p v-if="v.version" class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{{ v.version }}</p>
          <div class="flex flex-wrap gap-1.5 mt-3">
            <span v-if="v.km > 0" class="inline-flex items-center gap-1 text-[10px] font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-white/5 rounded-md px-2 py-0.5">{{ number(v.km) }} km</span>
            <span v-if="v.transmision" class="text-[10px] font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-white/5 rounded-md px-2 py-0.5">{{ v.transmision }}</span>
            <span v-if="v.combustible" class="text-[10px] font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-white/5 rounded-md px-2 py-0.5">{{ v.combustible }}</span>
          </div>
          <div class="mt-4 pt-3 border-t border-slate-200 dark:border-white/10">
            <p class="text-xl font-bold text-slate-900 dark:text-white font-mono">{{ currency(v.precioVenta) }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Vista lista -->
    <div v-else class="bg-white dark:bg-[#1a1a2e] rounded-2xl border border-slate-200 dark:border-white/10 shadow-card dark:shadow-none overflow-hidden">
      <div v-for="v in vehiculos" :key="v.id"
        class="flex items-center gap-4 px-5 py-4 border-b border-slate-50 dark:border-white/3 last:border-0 cursor-pointer hover:bg-orange-50/30 dark:hover:bg-white/3 transition-colors group border-l-2 border-l-transparent hover:border-l-primary-400"
        @click="router.push(`/stock/${v.id}`)">
        <div class="w-16 h-12 rounded-lg overflow-hidden bg-slate-100 dark:bg-white/5 shrink-0">
          <img v-if="firstFoto(v)" :src="firstFoto(v)" :alt="v.marca" class="w-full h-full object-cover"/>
          <div v-else class="w-full h-full flex items-center justify-center">
            <svg class="w-5 h-5 text-slate-300 dark:text-white/20" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6"/></svg>
          </div>
        </div>
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2">
            <p class="font-semibold text-slate-900 dark:text-white text-sm">{{ v.marca }} {{ v.modelo }}</p>
            <span class="text-[10px] text-slate-400 dark:text-slate-500 font-medium">{{ v.anio }}</span>
          </div>
          <div class="flex items-center gap-2 mt-0.5">
            <div class="w-1.5 h-1.5 rounded-full" :class="ESTADO_DOT[v.estado]??'bg-slate-400'"/>
            <span class="text-xs text-slate-500 dark:text-slate-400">{{ LABEL_ESTADO[v.estado] }}</span>
            <span v-if="v.km > 0" class="text-xs text-slate-400 dark:text-slate-500">· {{ number(v.km) }} km</span>
          </div>
        </div>
        <div class="hidden md:flex items-center gap-2 shrink-0">
          <AppBadge :value="v.tipo" size="xs"/>
          <AppBadge :value="v.tipoStock" size="xs"/>
        </div>
        <div class="text-right shrink-0">
          <p class="text-base font-bold text-slate-900 dark:text-white font-mono">{{ currency(v.precioVenta) }}</p>
          <p class="text-[10px] text-slate-400 dark:text-slate-500">precio de venta</p>
        </div>
        <svg class="w-4 h-4 text-slate-300 dark:text-white/20 group-hover:text-primary-500 transition-colors shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5"/></svg>
      </div>
    </div>

    <AppPagination v-if="!loading" :page="meta.page" :total="meta.total" :page-size="meta.pageSize" @update:page="changePage"/>

  </div>

  <AppImportModal v-model="showImport" type="vehiculos" @done="applyFilters" />
</template>
