<script setup>
import { ref, onMounted } from 'vue'
import { useToast } from '../../../shared/composables/useToast.js'
import { currency } from '../../../shared/utils/format.js'
import api from '../../../plugins/axios.js'

const toast      = useToast()
const vendedores = ref([])
const loading    = ref(false)
const configPct  = ref(2) // default global del sistema

async function load() {
  loading.value = true
  try {
    const [statsRes, configRes] = await Promise.all([
      api.get('/usuarios/vendedores/stats'),
      api.get('/configuracion'),
    ])
    vendedores.value = statsRes.data.data ?? []
    configPct.value  = Number(configRes.data.data?.comisionPctDefault ?? 2)
  } catch {
    toast.error('Error', 'No se pudieron cargar los vendedores')
  } finally {
    loading.value = false
  }
}

onMounted(load)

// ── Edición inline de comisión ────────────────────────────────────────────────
const editando   = ref(null)   // id del vendedor en edición
const editPct    = ref('')
const savingPct  = ref(false)

function abrirEditar(v) {
  editando.value = v.id
  editPct.value  = v.comisionPct !== null ? Number(v.comisionPct) : ''
}

function cancelarEditar() { editando.value = null; editPct.value = '' }

async function guardarComision(v) {
  savingPct.value = true
  try {
    const pct = editPct.value === '' ? null : Number(editPct.value)
    await api.patch(`/usuarios/vendedores/${v.id}/comision`, { comisionPct: pct })
    v.comisionPct = pct
    toast.success('Comisión actualizada', pct === null
      ? `${v.nombre} usará el % global (${configPct.value}%)`
      : `${v.nombre}: ${pct}%`)
    editando.value = null
  } catch (err) {
    toast.error('Error', err.response?.data?.error ?? 'No se pudo guardar')
  } finally {
    savingPct.value = false
  }
}

function pctEfectivo(v) {
  return v.comisionPct !== null ? Number(v.comisionPct) : configPct.value
}
</script>

<template>
  <div class="p-6 space-y-6 animate-fade-in">

    <!-- Tabs -->
    <div class="flex gap-0.5 border-b border-slate-200 dark:border-white/10">
      <router-link to="/usuarios"
        class="px-5 py-2.5 text-sm font-medium transition-colors text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200">
        Usuarios
      </router-link>
      <router-link to="/usuarios/roles"
        class="px-5 py-2.5 text-sm font-medium transition-colors text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200">
        Roles
      </router-link>
      <router-link to="/usuarios/vendedores"
        class="px-5 py-2.5 text-sm font-medium transition-colors relative text-primary-500 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-primary-500 after:rounded-t">
        Vendedores
      </router-link>
    </div>

    <!-- Header -->
    <div>
      <h1 class="text-2xl font-bold text-slate-900 dark:text-white">Vendedores</h1>
      <p class="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
        Rendimiento del mes y comisión personalizada por vendedor.
        Comisión global actual: <strong class="text-primary-500">{{ configPct }}%</strong>
      </p>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex justify-center py-20">
      <svg class="w-8 h-8 animate-spin text-primary-500" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
      </svg>
    </div>

    <!-- Grid de vendedores -->
    <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <div v-for="v in vendedores" :key="v.id"
        class="bg-white dark:bg-[#1a1a2e] rounded-2xl border border-slate-200 dark:border-white/10 overflow-hidden transition-all"
        :class="!v.activo ? 'opacity-50' : ''">

        <!-- Header vendedor -->
        <div class="flex items-center gap-3 px-5 py-4 border-b border-slate-100 dark:border-white/5">
          <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-orange-400 flex items-center justify-center text-white text-sm font-bold shrink-0">
            {{ v.nombre.charAt(0).toUpperCase() }}
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-bold text-slate-900 dark:text-white truncate">{{ v.nombre }}</p>
            <p class="text-xs text-slate-400 dark:text-slate-500 truncate">{{ v.email }}</p>
          </div>
          <span v-if="!v.activo" class="text-[10px] font-semibold bg-red-100 dark:bg-red-500/15 text-red-600 dark:text-red-400 px-2 py-0.5 rounded-full shrink-0">Inactivo</span>
        </div>

        <!-- Stats del mes -->
        <div class="grid grid-cols-3 divide-x divide-slate-100 dark:divide-white/5">
          <div class="px-4 py-3 text-center">
            <p class="text-xl font-bold text-slate-900 dark:text-white">{{ v._stats.ventasMesCant }}</p>
            <p class="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">Ventas</p>
          </div>
          <div class="px-4 py-3 text-center">
            <p class="text-sm font-bold text-emerald-600 dark:text-emerald-400 font-mono leading-tight">
              {{ currency(v._stats.comisionMesMonto) }}
            </p>
            <p class="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">Comis. mes</p>
          </div>
          <div class="px-4 py-3 text-center">
            <p class="text-sm font-bold text-amber-600 dark:text-amber-400 font-mono leading-tight">
              {{ currency(v._stats.comisionPendMonto) }}
            </p>
            <p class="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">Pendiente</p>
          </div>
        </div>

        <!-- Comisión editable -->
        <div class="px-5 py-4 border-t border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.02]">
          <div class="flex items-center justify-between gap-3">
            <div>
              <p class="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-0.5">Comisión personal</p>
              <div v-if="editando !== v.id" class="flex items-center gap-2">
                <span class="text-lg font-bold"
                  :class="v.comisionPct !== null ? 'text-primary-600 dark:text-primary-400' : 'text-slate-400 dark:text-slate-500'">
                  {{ pctEfectivo(v) }}%
                </span>
                <span v-if="v.comisionPct === null"
                  class="text-[10px] text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-white/5 px-2 py-0.5 rounded-full">
                  global
                </span>
                <span v-else
                  class="text-[10px] text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-500/10 px-2 py-0.5 rounded-full font-semibold">
                  personalizado
                </span>
              </div>

              <!-- Edición inline -->
              <div v-else class="flex items-center gap-2 mt-1">
                <div class="relative">
                  <input v-model="editPct" type="number" min="0" max="100" step="0.5"
                    :placeholder="`${configPct} (global)`"
                    class="w-28 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1a1a2e] text-slate-900 dark:text-white text-sm px-3 py-1.5 pr-7 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                    @keyup.enter="guardarComision(v)"
                    @keyup.escape="cancelarEditar"/>
                  <span class="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400">%</span>
                </div>
                <button
                  class="text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 px-2.5 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                  :disabled="savingPct"
                  @click="guardarComision(v)">
                  {{ savingPct ? '...' : 'OK' }}
                </button>
                <button class="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors" @click="cancelarEditar">✕</button>
              </div>
            </div>

            <!-- Botón editar / usar global -->
            <div v-if="editando !== v.id" class="flex flex-col gap-1.5 shrink-0">
              <button
                class="text-xs font-semibold text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-500/10 hover:bg-primary-100 dark:hover:bg-primary-500/20 px-3 py-1.5 rounded-lg transition-colors"
                @click="abrirEditar(v)">
                Editar %
              </button>
              <button v-if="v.comisionPct !== null"
                class="text-[11px] text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors text-center"
                @click="editPct = ''; guardarComision(v)">
                Usar global
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty -->
      <div v-if="!vendedores.length" class="col-span-3 text-center py-16 bg-white dark:bg-[#1a1a2e] rounded-2xl border border-slate-200 dark:border-white/10">
        <p class="text-slate-400 dark:text-slate-500 font-medium">No hay vendedores registrados.</p>
      </div>
    </div>

  </div>
</template>
