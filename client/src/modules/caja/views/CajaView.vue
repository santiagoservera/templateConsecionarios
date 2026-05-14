<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '../../auth/store/authStore.js'
import { useCaja } from '../composables/useCaja.js'
import { useToast } from '../../../shared/composables/useToast.js'
import AppModal from '../../../shared/components/AppModal.vue'
import AppSelect from '../../../shared/components/AppSelect.vue'
import { currency, date, datetime } from '../../../shared/utils/format.js'
import api from '../../../plugins/axios.js'

const authStore = useAuthStore()
const toast     = useToast()
const { sesion, sesiones, sesionActiva, loading, meta, fetchSesionActiva, fetchSesion, fetchSesiones, abrirSesion, cerrarSesion, registrarMovimiento } = useCaja()

// ── Tabs ───────────────────────────────────────────────────────────────────────
const tab = ref('hoy') // 'hoy' | 'historial'

onMounted(async () => {
  const activa = await fetchSesionActiva()
  if (activa) fetchSesion(activa.id)
})

// ── Historial ──────────────────────────────────────────────────────────────────
const histFechaDesde  = ref('')
const histFechaHasta  = ref('')
const histPage        = ref(1)
const expandida       = ref(null) // id de la sesión expandida

async function cargarHistorial() {
  await fetchSesiones({
    estado:      'CERRADA',
    fechaDesde:  histFechaDesde.value || undefined,
    fechaHasta:  histFechaHasta.value || undefined,
    page:        histPage.value,
    pageSize:    15,
  })
}

async function switchTab(t) {
  tab.value = t
  if (t === 'historial' && !sesiones.value.length) cargarHistorial()
}

function toggleExpandida(id) {
  expandida.value = expandida.value === id ? null : id
}

function diferencia(s) {
  if (!s.montoCierre) return null
  return Number(s.montoCierre) - s._stats.saldo
}

// ── Abrir sesión ───────────────────────────────────────────────────────────────
const showAbrir   = ref(false)
const abriendo    = ref(false)
const montoApert  = ref(0)
const obsApert    = ref('')

async function confirmarAbrir() {
  abriendo.value = true
  try {
    const s = await abrirSesion({ montoApertura: Number(montoApert.value), observaciones: obsApert.value || undefined })
    await fetchSesion(s.id)
    toast.success('Caja abierta', `Saldo inicial: ${currency(montoApert.value)}`)
    showAbrir.value = false
  } catch (err) { toast.error('Error', err.response?.data?.error ?? 'No se pudo abrir') }
  finally { abriendo.value = false }
}

// ── Cerrar sesión ──────────────────────────────────────────────────────────────
const showCerrar  = ref(false)
const cerrando    = ref(false)
const montoCierre = ref(0)
const obsCierre   = ref('')

async function confirmarCerrar() {
  cerrando.value = true
  try {
    await cerrarSesion(sesionActiva.value.id, { montoCierre: Number(montoCierre.value), observaciones: obsCierre.value || undefined })
    sesion.value = null
    toast.success('Caja cerrada')
    showCerrar.value = false
  } catch (err) { toast.error('Error', err.response?.data?.error ?? 'No se pudo cerrar') }
  finally { cerrando.value = false }
}

// ── Registrar movimiento ───────────────────────────────────────────────────────
const showMov   = ref(false)
const savingMov = ref(false)
const formMov   = ref({ tipo: 'INGRESO', concepto: 'OTRO', monto: '', observaciones: '' })

const tipoOptions    = [{ value: 'INGRESO', label: 'Ingreso' }, { value: 'EGRESO', label: 'Egreso' }]
const conceptoOptions= [
  { value: 'CUOTA_PLAN_PAGO', label: 'Cuota plan de pago' },
  { value: 'GASTO', label: 'Gasto' },
  { value: 'OTRO', label: 'Otro' },
]

async function guardarMovimiento() {
  if (!formMov.value.monto) return
  savingMov.value = true
  try {
    await registrarMovimiento(sesionActiva.value.id, {
      tipo:     formMov.value.tipo,
      concepto: formMov.value.concepto,
      monto:    Number(formMov.value.monto),
      observaciones: formMov.value.observaciones || undefined,
    })
    await fetchSesion(sesionActiva.value.id)
    toast.success('Movimiento registrado')
    showMov.value = false
    formMov.value = { tipo: 'INGRESO', concepto: 'OTRO', monto: '', observaciones: '' }
  } catch (err) { toast.error('Error', err.response?.data?.error ?? 'Error') }
  finally { savingMov.value = false }
}

// ── Venta de indumentaria desde caja ─────────────────────────────────────────
const showIndModal   = ref(false)
const indItems       = ref([])
const indSearch      = ref('')
const indSelected    = ref(null)
const indCantidad    = ref(1)
const indSaving      = ref(false)
const indError       = ref('')
const loadingInd     = ref(false)

const indFiltrados = computed(() => {
  const q = indSearch.value.trim().toLowerCase()
  return indItems.value
    .filter(i => i.cantidad > 0)
    .filter(i => !q || i.nombre.toLowerCase().includes(q) || (i.marca ?? '').toLowerCase().includes(q) || (i.categoria ?? '').toLowerCase().includes(q))
    .slice(0, 20)
})

async function abrirIndModal() {
  showIndModal.value = true
  indSelected.value  = null
  indSearch.value    = ''
  indCantidad.value  = 1
  indError.value     = ''
  if (!indItems.value.length) {
    loadingInd.value = true
    try {
      const { data } = await api.get('/indumentaria', { params: { pageSize: 100 } })
      indItems.value = data.data ?? []
    } catch { indItems.value = [] }
    finally { loadingInd.value = false }
  }
}

function seleccionarInd(item) {
  indSelected.value = item
  indCantidad.value = 1
  indError.value    = ''
}

async function confirmarVentaInd() {
  if (!indSelected.value) { indError.value = 'Seleccioná un producto'; return }
  if (indCantidad.value < 1 || indCantidad.value > indSelected.value.cantidad) {
    indError.value = `Cantidad inválida. Stock disponible: ${indSelected.value.cantidad}`
    return
  }
  indSaving.value = true; indError.value = ''
  try {
    await api.post(`/indumentaria/${indSelected.value.id}/vender`, {
      cantidad:     Number(indCantidad.value),
      sesionCajaId: sesionActiva.value.id,
    })
    await fetchSesion(sesionActiva.value.id)
    // Actualizar stock localmente
    const found = indItems.value.find(i => i.id === indSelected.value.id)
    if (found) found.cantidad -= indCantidad.value
    toast.success('Venta registrada',
      `${indCantidad.value}x ${indSelected.value.nombre} — ${currency(Number(indSelected.value.precioVenta) * indCantidad.value)}`)
    showIndModal.value = false
  } catch (err) { indError.value = err.response?.data?.error ?? 'Error al registrar' }
  finally { indSaving.value = false }
}

// ── Colores ────────────────────────────────────────────────────────────────────
const CONCEPTO_LABEL = { CUOTA_PLAN_PAGO:'Cuota plan', VENTA_INDUMENTARIA:'Venta ind.', GASTO:'Gasto', OTRO:'Otro' }
const CONCEPTO_COLOR = { CUOTA_PLAN_PAGO:'bg-blue-500/15 text-blue-700 dark:text-blue-400', VENTA_INDUMENTARIA:'bg-violet-500/15 text-violet-700 dark:text-violet-400', GASTO:'bg-red-500/15 text-red-700 dark:text-red-400', OTRO:'bg-slate-100 text-slate-600 dark:text-slate-400' }

const stats = computed(() => sesion.value?._stats ?? { totalIngresos: 0, totalEgresos: 0, saldo: 0, cantMovimientos: 0 })
</script>

<template>
  <div class="p-6 space-y-5 animate-fade-in">

    <!-- Header -->
    <div class="flex items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold text-slate-900 dark:text-white">Caja</h1>
        <p class="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Gestión de caja diaria, cobros e indumentaria.</p>
      </div>
      <div class="flex gap-2">
        <button v-if="!sesionActiva && tab === 'hoy'"
          class="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold px-4 py-2.5 rounded-xl shadow-sm transition-all"
          @click="showAbrir = true">
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15"/></svg>
          Abrir caja
        </button>
        <template v-if="sesionActiva && tab === 'hoy'">
          <!-- Vender indumentaria -->
          <button class="inline-flex items-center gap-2 bg-violet-500 hover:bg-violet-600 text-white text-sm font-semibold px-4 py-2.5 rounded-xl shadow-sm transition-all"
            @click="abrirIndModal">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z"/>
            </svg>
            Vender indumentaria
          </button>
          <button class="inline-flex items-center gap-2 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 hover:border-slate-300 text-sm font-medium px-4 py-2.5 rounded-xl transition-all"
            @click="showMov = true">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15"/></svg>
            Movimiento
          </button>
          <button class="inline-flex items-center gap-2 bg-slate-800 dark:bg-white/10 hover:bg-slate-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-all"
            @click="showCerrar = true">
            Cerrar caja
          </button>
        </template>
      </div>
    </div>

    <!-- Tabs -->
    <div class="flex gap-0.5 border-b border-slate-200 dark:border-white/10">
      <button
        class="px-5 py-2.5 text-sm font-medium transition-colors relative"
        :class="tab === 'hoy'
          ? 'text-primary-500 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-primary-500 after:rounded-t'
          : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'"
        @click="switchTab('hoy')">
        Sesión actual
        <span v-if="sesionActiva" class="ml-1.5 w-2 h-2 rounded-full bg-emerald-400 inline-block"/>
      </button>
      <button
        class="px-5 py-2.5 text-sm font-medium transition-colors relative"
        :class="tab === 'historial'
          ? 'text-primary-500 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-primary-500 after:rounded-t'
          : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'"
        @click="switchTab('historial')">
        Historial
      </button>
    </div>

    <!-- ── TAB: HISTORIAL ──────────────────────────────────────────────────── -->
    <template v-if="tab === 'historial'">

      <!-- Filtros fecha -->
      <div class="bg-white dark:bg-[#1a1a2e] rounded-2xl border border-slate-200 dark:border-white/10 p-4 flex flex-wrap items-end gap-3">
        <div>
          <label class="block text-xs font-semibold text-slate-400 dark:text-slate-500 mb-1.5">Desde</label>
          <input v-model="histFechaDesde" type="date"
            class="rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-white text-sm px-3 py-2 focus:outline-none focus:border-primary-500"/>
        </div>
        <div>
          <label class="block text-xs font-semibold text-slate-400 dark:text-slate-500 mb-1.5">Hasta</label>
          <input v-model="histFechaHasta" type="date"
            class="rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-white text-sm px-3 py-2 focus:outline-none focus:border-primary-500"/>
        </div>
        <button class="text-sm bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-xl font-semibold transition-all shadow-sm hover:shadow-glow" @click="() => { histPage = 1; cargarHistorial() }">
          Filtrar
        </button>
        <button v-if="histFechaDesde || histFechaHasta" class="text-sm text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 px-3 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
          @click="histFechaDesde = ''; histFechaHasta = ''; histPage = 1; cargarHistorial()">
          Limpiar
        </button>
        <p class="ml-auto text-xs text-slate-400 dark:text-slate-500 self-center">
          {{ meta.total }} sesión{{ meta.total !== 1 ? 'es' : '' }} cerrada{{ meta.total !== 1 ? 's' : '' }}
        </p>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="flex justify-center py-16">
        <svg class="w-8 h-8 animate-spin text-primary-500" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
        </svg>
      </div>

      <!-- Lista sesiones cerradas -->
      <div v-else class="space-y-2">
        <div v-if="!sesiones.length" class="text-center py-16 bg-white dark:bg-[#1a1a2e] rounded-2xl border border-slate-200 dark:border-white/10">
          <p class="text-slate-400 dark:text-slate-500 font-medium">Sin sesiones cerradas en el período seleccionado.</p>
        </div>

        <div v-for="s in sesiones" :key="s.id"
          class="bg-white dark:bg-[#1a1a2e] rounded-2xl border border-slate-200 dark:border-white/10 overflow-hidden transition-all">

          <!-- Fila resumen (clickeable para expandir) -->
          <button class="w-full flex items-center gap-4 px-5 py-4 hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors text-left"
            @click="toggleExpandida(s.id)">

            <!-- Fecha + usuario -->
            <div class="w-28 shrink-0">
              <p class="text-sm font-semibold text-slate-900 dark:text-white">{{ date(s.fechaApertura) }}</p>
              <p class="text-[11px] text-slate-400 dark:text-slate-500">{{ s.usuario?.nombre }}</p>
            </div>

            <!-- KPIs compactos -->
            <div class="flex-1 grid grid-cols-4 gap-3 text-right">
              <div>
                <p class="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider">Apertura</p>
                <p class="text-sm font-mono font-semibold text-slate-700 dark:text-slate-200">{{ currency(s.montoApertura) }}</p>
              </div>
              <div>
                <p class="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider">Ingresos</p>
                <p class="text-sm font-mono font-semibold text-emerald-600 dark:text-emerald-400">+{{ currency(s._stats.totalIngresos) }}</p>
              </div>
              <div>
                <p class="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider">Egresos</p>
                <p class="text-sm font-mono font-semibold text-red-500 dark:text-red-400">−{{ currency(s._stats.totalEgresos) }}</p>
              </div>
              <div>
                <p class="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider">Cierre</p>
                <p class="text-sm font-mono font-bold text-slate-900 dark:text-white">{{ currency(s.montoCierre) }}</p>
              </div>
            </div>

            <!-- Diferencia + movimientos -->
            <div class="shrink-0 text-right w-28">
              <span v-if="diferencia(s) !== null"
                class="text-xs font-semibold px-2 py-0.5 rounded-full"
                :class="Math.abs(diferencia(s)) < 1
                  ? 'bg-emerald-100 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400'
                  : diferencia(s) > 0
                    ? 'bg-blue-100 dark:bg-blue-500/15 text-blue-700 dark:text-blue-400'
                    : 'bg-red-100 dark:bg-red-500/15 text-red-600 dark:text-red-400'">
                {{ Math.abs(diferencia(s)) < 1 ? 'Cuadra ✓' : diferencia(s) > 0 ? `+${currency(diferencia(s))}` : currency(diferencia(s)) }}
              </span>
              <p class="text-[10px] text-slate-400 dark:text-slate-500 mt-1">{{ s._stats.cantMovimientos }} movimiento{{ s._stats.cantMovimientos !== 1 ? 's' : '' }}</p>
            </div>

            <!-- Chevron -->
            <svg class="w-4 h-4 text-slate-300 dark:text-white/20 transition-transform shrink-0"
              :class="expandida === s.id ? 'rotate-180' : ''"
              fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="m19 9-7 7-7-7"/>
            </svg>
          </button>

          <!-- Detalle movimientos (expandido) -->
          <div v-if="expandida === s.id" class="border-t border-slate-100 dark:border-white/5">
            <div v-if="!s.movimientos?.length" class="px-5 py-6 text-center text-sm text-slate-400 dark:text-slate-500">
              Sin movimientos en esta sesión.
            </div>
            <div v-else class="divide-y divide-slate-200 dark:divide-white/5">
              <div v-for="mov in s.movimientos" :key="mov.id" class="flex items-center gap-4 px-5 py-3">
                <div class="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                  :class="mov.tipo === 'INGRESO' ? 'bg-emerald-100 dark:bg-emerald-500/20' : 'bg-red-100 dark:bg-red-500/20'">
                  <svg class="w-3.5 h-3.5" :class="mov.tipo === 'INGRESO' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                    <path v-if="mov.tipo === 'INGRESO'" stroke-linecap="round" stroke-linejoin="round" d="M4.5 10.5 12 3m0 0 7.5 7.5M12 3v18"/>
                    <path v-else stroke-linecap="round" stroke-linejoin="round" d="M19.5 13.5 12 21m0 0-7.5-7.5M12 21V3"/>
                  </svg>
                </div>
                <div class="flex-1 min-w-0">
                  <span class="text-[10px] font-semibold px-2 py-0.5 rounded-md" :class="CONCEPTO_COLOR[mov.concepto]">
                    {{ CONCEPTO_LABEL[mov.concepto] ?? mov.concepto }}
                  </span>
                  <p v-if="mov.observaciones" class="text-xs text-slate-400 dark:text-slate-500 mt-0.5 truncate">{{ mov.observaciones }}</p>
                </div>
                <p class="text-xs text-slate-400 dark:text-slate-500 shrink-0">{{ datetime(mov.createdAt) }}</p>
                <p class="text-sm font-bold font-mono shrink-0"
                  :class="mov.tipo === 'INGRESO' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'">
                  {{ mov.tipo === 'INGRESO' ? '+' : '−' }}{{ currency(mov.monto) }}
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- Paginación historial -->
        <div v-if="meta.totalPages > 1" class="flex items-center justify-center gap-2 pt-2">
          <button class="px-3 py-1.5 text-sm rounded-lg border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 disabled:opacity-40 transition-colors" :disabled="histPage === 1" @click="histPage--; cargarHistorial()">← Anterior</button>
          <span class="text-sm text-slate-500 dark:text-slate-400">{{ histPage }} / {{ meta.totalPages }}</span>
          <button class="px-3 py-1.5 text-sm rounded-lg border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 disabled:opacity-40 transition-colors" :disabled="histPage === meta.totalPages" @click="histPage++; cargarHistorial()">Siguiente →</button>
        </div>
      </div>
    </template>

    <!-- ── TAB: SESIÓN ACTUAL ─────────────────────────────────────────────── -->
    <template v-if="tab === 'hoy'">

    <!-- Sin sesión activa -->
    <div v-if="!sesionActiva" class="text-center py-20 bg-white dark:bg-[#1a1a2e] rounded-2xl border border-slate-200 dark:border-white/10 shadow-card dark:shadow-none">
      <svg class="w-14 h-14 mx-auto mb-4 text-slate-200 dark:text-white/10" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1">
        <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 0 1 3 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 0 0-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 0 1-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 0 0 3 15h-.75"/>
      </svg>
      <p class="font-semibold text-slate-500 dark:text-slate-400">Caja cerrada</p>
      <p class="text-sm mt-1 text-slate-400">Abrí la caja para registrar movimientos.</p>
    </div>

    <!-- Sesión activa -->
    <template v-else-if="sesion">

      <!-- KPIs -->
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div class="bg-white dark:bg-[#1a1a2e] rounded-2xl border border-slate-200 dark:border-white/10 shadow-card dark:shadow-none p-4">
          <p class="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide mb-1">Apertura</p>
          <p class="text-xl font-bold font-mono text-slate-900 dark:text-white">{{ currency(sesion.montoApertura) }}</p>
        </div>
        <div class="bg-white dark:bg-[#1a1a2e] rounded-2xl border border-slate-200 dark:border-white/10 shadow-card dark:shadow-none p-4">
          <p class="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide mb-1">Ingresos</p>
          <p class="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400">{{ currency(stats.totalIngresos) }}</p>
        </div>
        <div class="bg-white dark:bg-[#1a1a2e] rounded-2xl border border-slate-200 dark:border-white/10 shadow-card dark:shadow-none p-4">
          <p class="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide mb-1">Egresos</p>
          <p class="text-xl font-bold font-mono text-red-500 dark:text-red-400">{{ currency(stats.totalEgresos) }}</p>
        </div>
        <div class="bg-white dark:bg-[#1a1a2e] rounded-2xl border border-primary-200 dark:border-primary-500/30 shadow-card dark:shadow-none p-4">
          <p class="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide mb-1">Saldo actual</p>
          <p class="text-xl font-bold font-mono text-primary-600 dark:text-primary-400">{{ currency(stats.saldo) }}</p>
        </div>
      </div>

      <!-- Movimientos -->
      <div class="bg-white dark:bg-[#1a1a2e] rounded-2xl border border-slate-200 dark:border-white/10 shadow-card dark:shadow-none overflow-hidden">
        <div class="px-5 py-4 border-b border-slate-200 dark:border-white/10 flex items-center justify-between">
          <h3 class="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wide">
            Movimientos del día
            <span class="ml-2 text-xs font-mono bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-slate-400 px-2 py-0.5 rounded-full">{{ stats.cantMovimientos }}</span>
          </h3>
          <p class="text-xs text-slate-400 dark:text-slate-500">Apertura: {{ datetime ? datetime(sesion.fechaApertura) : date(sesion.fechaApertura) }}</p>
        </div>

        <div v-if="!sesion.movimientos?.length" class="px-5 py-10 text-center text-sm text-slate-400 dark:text-slate-500">
          Sin movimientos aún.
        </div>

        <div v-else class="divide-y divide-slate-200 dark:divide-white/5">
          <div v-for="mov in sesion.movimientos" :key="mov.id"
            class="flex items-center gap-4 px-5 py-3.5">
            <!-- Tipo -->
            <div class="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
              :class="mov.tipo === 'INGRESO' ? 'bg-emerald-100 dark:bg-emerald-500/20' : 'bg-red-100 dark:bg-red-500/20'">
              <svg class="w-4 h-4" :class="mov.tipo === 'INGRESO' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                <path v-if="mov.tipo === 'INGRESO'" stroke-linecap="round" stroke-linejoin="round" d="M4.5 10.5 12 3m0 0 7.5 7.5M12 3v18"/>
                <path v-else stroke-linecap="round" stroke-linejoin="round" d="M19.5 13.5 12 21m0 0-7.5-7.5M12 21V3"/>
              </svg>
            </div>

            <!-- Info -->
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2">
                <span class="text-[10px] font-semibold px-2 py-0.5 rounded-md" :class="CONCEPTO_COLOR[mov.concepto]">
                  {{ CONCEPTO_LABEL[mov.concepto] ?? mov.concepto }}
                </span>
              </div>
              <p v-if="mov.observaciones" class="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">{{ mov.observaciones }}</p>
            </div>

            <!-- Monto -->
            <p class="text-sm font-bold font-mono shrink-0"
              :class="mov.tipo === 'INGRESO' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'">
              {{ mov.tipo === 'INGRESO' ? '+' : '−' }}{{ currency(mov.monto) }}
            </p>
          </div>
        </div>
      </div>
    </template>

    </template> <!-- /tab hoy -->

    <!-- ── Modal VENTA INDUMENTARIA ──────────────────────────────────────────── -->
    <AppModal v-model="showIndModal" title="Vender indumentaria" size="md">
      <div class="space-y-4">
        <p v-if="indError" class="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl px-4 py-2.5">{{ indError }}</p>

        <!-- Buscador -->
        <div class="relative">
          <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"/>
          </svg>
          <input v-model="indSearch" type="text" placeholder="Buscar por nombre, marca o categoría..."
            class="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 text-sm focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"/>
        </div>

        <!-- Lista de productos -->
        <div class="border border-slate-200 dark:border-white/10 rounded-xl overflow-hidden max-h-56 overflow-y-auto">
          <div v-if="loadingInd" class="flex justify-center py-8">
            <svg class="w-6 h-6 animate-spin text-primary-500" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg>
          </div>
          <div v-else-if="!indFiltrados.length" class="py-8 text-center text-sm text-slate-400 dark:text-slate-500">
            Sin productos con stock disponible.
          </div>
          <button v-else v-for="item in indFiltrados" :key="item.id" type="button"
            class="w-full flex items-center gap-3 px-4 py-3 border-b border-slate-100 dark:border-white/5 last:border-0 transition-colors text-left"
            :class="indSelected?.id === item.id
              ? 'bg-primary-50 dark:bg-primary-500/10'
              : 'hover:bg-slate-50 dark:hover:bg-white/5'"
            @click="seleccionarInd(item)">
            <!-- Indicador selección -->
            <div class="w-5 h-5 rounded-full border-2 shrink-0 flex items-center justify-center transition-all"
              :class="indSelected?.id === item.id ? 'border-primary-500 bg-primary-500' : 'border-slate-300 dark:border-white/20'">
              <svg v-if="indSelected?.id === item.id" class="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
                <path stroke-linecap="round" stroke-linejoin="round" d="m4.5 12.75 6 6 9-13.5"/>
              </svg>
            </div>
            <!-- Info producto -->
            <div class="flex-1 min-w-0">
              <p class="text-sm font-semibold text-slate-900 dark:text-white truncate">{{ item.nombre }}</p>
              <div class="flex items-center gap-2 mt-0.5">
                <span class="text-[10px] text-slate-400 dark:text-slate-500">{{ item.categoria }}</span>
                <span v-if="item.talla" class="text-[10px] font-mono text-slate-400 dark:text-slate-500">· {{ item.talla }}</span>
                <span class="text-[10px] font-semibold"
                  :class="item.cantidad <= 3 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'">
                  {{ item.cantidad }} en stock
                </span>
              </div>
            </div>
            <p class="text-sm font-bold text-slate-900 dark:text-white font-mono shrink-0">{{ currency(item.precioVenta) }}</p>
          </button>
        </div>

        <!-- Cantidad + total (solo si hay selección) -->
        <div v-if="indSelected" class="space-y-3">
          <div class="flex items-center gap-3">
            <label class="text-sm font-medium text-slate-700 dark:text-slate-300 shrink-0 w-24">Cantidad</label>
            <div class="flex items-center gap-2 flex-1">
              <button type="button"
                class="w-9 h-9 rounded-xl border border-slate-200 dark:border-white/10 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors disabled:opacity-40"
                :disabled="indCantidad <= 1" @click="indCantidad = Math.max(1, indCantidad - 1)">
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M5 12h14"/></svg>
              </button>
              <input v-model.number="indCantidad" type="number" min="1" :max="indSelected.cantidad"
                class="w-20 text-center rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1a1a2e] text-slate-900 dark:text-white text-base font-bold py-1.5 focus:outline-none focus:border-primary-500"/>
              <button type="button"
                class="w-9 h-9 rounded-xl border border-slate-200 dark:border-white/10 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors disabled:opacity-40"
                :disabled="indCantidad >= indSelected.cantidad" @click="indCantidad = Math.min(indSelected.cantidad, indCantidad + 1)">
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15"/></svg>
              </button>
            </div>
          </div>

          <!-- Total -->
          <div class="flex items-center justify-between px-4 py-3 bg-emerald-50 dark:bg-emerald-500/10 rounded-xl border border-emerald-200 dark:border-emerald-500/20">
            <div>
              <p class="text-xs text-emerald-700 dark:text-emerald-400 font-medium">Total a cobrar</p>
              <p class="text-[11px] text-emerald-600/70 dark:text-emerald-500">{{ indCantidad }}x {{ indSelected.nombre }}</p>
            </div>
            <p class="text-xl font-bold text-emerald-700 dark:text-emerald-400 font-mono">
              {{ currency(Number(indSelected.precioVenta) * indCantidad) }}
            </p>
          </div>
        </div>
      </div>

      <template #footer="{ close }">
        <button class="text-sm text-slate-600 dark:text-slate-300 px-4 py-2 rounded-xl border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors" @click="close">Cancelar</button>
        <button
          class="text-sm bg-violet-500 hover:bg-violet-600 text-white px-5 py-2 rounded-xl font-semibold disabled:opacity-60 transition-all shadow-sm"
          :disabled="indSaving || !indSelected" @click="confirmarVentaInd">
          {{ indSaving ? 'Registrando...' : 'Confirmar venta' }}
        </button>
      </template>
    </AppModal>

    <!-- Modal abrir caja -->
    <AppModal v-model="showAbrir" title="Abrir caja" size="sm">
      <div class="space-y-3">
        <div>
          <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Monto de apertura</label>
          <input v-model.number="montoApert" type="number" min="0" placeholder="0" class="w-full rounded-xl border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-white text-sm focus:border-primary-500 focus:ring-primary-500"/>
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Observaciones</label>
          <textarea v-model="obsApert" rows="2" class="w-full rounded-xl border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-white text-sm focus:border-primary-500 focus:ring-primary-500 resize-none"/>
        </div>
      </div>
      <template #footer="{ close }">
        <button class="text-sm text-slate-600 dark:text-slate-300 px-4 py-2 rounded-xl border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors" @click="close">Cancelar</button>
        <button class="text-sm bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-2 rounded-xl font-semibold disabled:opacity-60 transition-all shadow-sm" :disabled="abriendo" @click="confirmarAbrir">
          {{ abriendo ? 'Abriendo...' : 'Abrir caja' }}
        </button>
      </template>
    </AppModal>

    <!-- Modal cerrar caja -->
    <AppModal v-model="showCerrar" title="Cerrar caja" size="sm">
      <div class="space-y-3">
        <div class="bg-slate-50 dark:bg-white/5 rounded-xl px-4 py-3">
          <div class="flex justify-between text-sm">
            <span class="text-slate-500 dark:text-slate-400">Saldo esperado</span>
            <span class="font-mono font-bold text-slate-900 dark:text-white">{{ currency(stats.saldo) }}</span>
          </div>
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Monto real en caja</label>
          <input v-model.number="montoCierre" type="number" min="0" :class="'w-full rounded-xl border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-white text-sm focus:border-primary-500 focus:ring-primary-500'"/>
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Observaciones</label>
          <textarea v-model="obsCierre" rows="2" class="w-full rounded-xl border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-white text-sm focus:border-primary-500 focus:ring-primary-500 resize-none"/>
        </div>
      </div>
      <template #footer="{ close }">
        <button class="text-sm text-slate-600 dark:text-slate-300 px-4 py-2 rounded-xl border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors" @click="close">Cancelar</button>
        <button class="text-sm bg-slate-800 dark:bg-white/10 hover:bg-slate-700 text-white px-5 py-2 rounded-xl font-semibold disabled:opacity-60 transition-all shadow-sm" :disabled="cerrando" @click="confirmarCerrar">
          {{ cerrando ? 'Cerrando...' : 'Cerrar caja' }}
        </button>
      </template>
    </AppModal>

    <!-- Modal movimiento manual -->
    <AppModal v-model="showMov" title="Registrar movimiento" size="sm">
      <div class="space-y-3">
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Tipo</label>
            <AppSelect v-model="formMov.tipo" :options="tipoOptions"/>
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Concepto</label>
            <AppSelect v-model="formMov.concepto" :options="conceptoOptions"/>
          </div>
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Monto *</label>
          <input v-model.number="formMov.monto" type="number" min="0" placeholder="0" class="w-full rounded-xl border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-white text-sm focus:border-primary-500 focus:ring-primary-500"/>
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Observaciones</label>
          <textarea v-model="formMov.observaciones" rows="2" class="w-full rounded-xl border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-white text-sm focus:border-primary-500 focus:ring-primary-500 resize-none"/>
        </div>
      </div>
      <template #footer="{ close }">
        <button class="text-sm text-slate-600 dark:text-slate-300 px-4 py-2 rounded-xl border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors" @click="close">Cancelar</button>
        <button class="text-sm bg-primary-500 hover:bg-primary-600 text-white px-5 py-2 rounded-xl font-semibold disabled:opacity-60 transition-all shadow-sm" :disabled="savingMov" @click="guardarMovimiento">
          {{ savingMov ? 'Guardando...' : 'Registrar' }}
        </button>
      </template>
    </AppModal>

  </div>
</template>
