<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { usePermisos } from '../../../shared/composables/usePermisos.js'
import { usePlanesPago } from '../composables/usePlanesPago.js'
import { useCaja } from '../../caja/composables/useCaja.js'
import { useToast } from '../../../shared/composables/useToast.js'
import AppModal from '../../../shared/components/AppModal.vue'
import { currency, date } from '../../../shared/utils/format.js'

const route     = useRoute()
const router    = useRouter()
const toast     = useToast()
const { canDo } = usePermisos()
const { plan, loading, error, fetchPlan, cobrarCuota, entregarAuto, updatePlan } = usePlanesPago()
const { sesionActiva, fetchSesionActiva } = useCaja()

onMounted(async () => {
  fetchPlan(route.params.id)
  fetchSesionActiva()
})

const canManage = computed(() => canDo('planesDNI', 'editar'))
const canCobrar = computed(() => canDo('planesDNI', 'editar'))

// Estados colores
const ESTADO_STYLE = {
  ACTIVO:'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400',
  SUSPENDIDO:'bg-amber-500/15 text-amber-700 dark:text-amber-400',
  COMPLETADO:'bg-blue-500/15 text-blue-700 dark:text-blue-400',
  CANCELADO:'bg-red-500/15 text-red-700 dark:text-red-400',
}
const CUOTA_STYLE = {
  PENDIENTE:'bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400',
  PAGADO:'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400',
  VENCIDO:'bg-red-500/15 text-red-700 dark:text-red-400',
}

const estaVencida = (c) => c.estado === 'PENDIENTE' && new Date(c.fechaVencimiento) < new Date()

// ── Cobrar cuota ───────────────────────────────────────────────────────────────
const showCobrar   = ref(false)
const cuotaSelec   = ref(null)
const cobrandoCuota= ref(false)
const fechaCobro   = ref(new Date().toISOString().slice(0,10))
const obsCobro     = ref('')

function abrirCobrar(cuota) {
  cuotaSelec.value = cuota
  fechaCobro.value = new Date().toISOString().slice(0,10)
  obsCobro.value   = ''
  showCobrar.value = true
}

async function confirmarCobro() {
  cobrandoCuota.value = true
  try {
    await cobrarCuota(plan.value.id, {
      cuotaId:      cuotaSelec.value.id,
      fechaPago:    new Date(fechaCobro.value).toISOString(),
      observaciones:obsCobro.value || undefined,
      sesionCajaId: sesionActiva.value?.id,
    })
    toast.success('Cuota cobrada', `Cuota ${cuotaSelec.value.numeroCuota} registrada`)
    showCobrar.value = false
  } catch (err) {
    toast.error('Error', err.response?.data?.error ?? 'No se pudo cobrar')
  } finally { cobrandoCuota.value = false }
}

// ── Entregar auto ──────────────────────────────────────────────────────────────
const showEntregar   = ref(false)
const entregando     = ref(false)
const obsEntrega     = ref('')

async function confirmarEntrega() {
  entregando.value = true
  try {
    await entregarAuto(plan.value.id, { observaciones: obsEntrega.value || undefined })
    toast.success('Auto entregado', 'Se generó la Venta formal automáticamente')
    showEntregar.value = false
  } catch (err) {
    toast.error('Error', err.response?.data?.error ?? 'No se pudo entregar')
  } finally { entregando.value = false }
}

// ── Cambiar estado ─────────────────────────────────────────────────────────────
async function cambiarEstado(estado) {
  try {
    await updatePlan(plan.value.id, { estado })
    toast.success('Actualizado', `Plan ${estado.toLowerCase()}`)
  } catch (err) { toast.error('Error', err.response?.data?.error ?? 'No se pudo cambiar estado') }
}
</script>

<template>
  <div class="p-6 max-w-4xl mx-auto space-y-5 animate-fade-in">

    <button class="flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 transition-colors" @click="router.back()">
      <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18"/></svg>
      Volver a planes
    </button>

    <div v-if="loading && !plan" class="flex justify-center py-16">
      <svg class="w-8 h-8 animate-spin text-primary-500" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg>
    </div>
    <div v-if="error" class="rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 px-4 py-3 text-sm text-red-700 dark:text-red-400">{{ error }}</div>

    <template v-if="plan">

      <!-- Header -->
      <div class="bg-white dark:bg-[#1a1a2e] rounded-2xl border border-slate-200 dark:border-white/10 shadow-card dark:shadow-none p-6">
        <div class="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div class="flex items-center gap-2 mb-2">
              <span class="text-xs font-semibold px-2.5 py-1 rounded-full" :class="ESTADO_STYLE[plan.estado]">
                {{ plan.estado }}
              </span>
              <span v-if="plan.vehiculoEntregado" class="text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 px-2.5 py-1 rounded-full">
                Auto entregado
              </span>
            </div>
            <h1 class="text-xl font-bold text-slate-900 dark:text-white">
              {{ plan.cliente?.apellido }}, {{ plan.cliente?.nombre }}
            </h1>
            <p class="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              {{ plan.vehiculo?.marca }} {{ plan.vehiculo?.modelo }} {{ plan.vehiculo?.anio }}
              <span v-if="plan.vehiculo?.patente" class="font-mono bg-slate-100 dark:bg-white/10 px-1.5 py-0.5 rounded ml-1 text-xs">{{ plan.vehiculo.patente }}</span>
            </p>
          </div>

          <!-- Acciones -->
          <div class="flex flex-wrap gap-2" v-if="canManage">
            <button v-if="plan._stats?.puedeRetirar && !plan.vehiculoEntregado && plan.estado !== 'CANCELADO'"
              class="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-all"
              @click="showEntregar = true">
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25"/></svg>
              Entregar auto
            </button>
            <button v-if="plan.estado === 'ACTIVO'"
              class="text-sm text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 hover:bg-amber-100 px-3 py-2 rounded-xl font-semibold transition-colors"
              @click="cambiarEstado('SUSPENDIDO')">Suspender</button>
            <button v-if="plan.estado === 'SUSPENDIDO'"
              class="text-sm text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 hover:bg-emerald-100 px-3 py-2 rounded-xl font-semibold transition-colors"
              @click="cambiarEstado('ACTIVO')">Reactivar</button>
            <button v-if="['ACTIVO','SUSPENDIDO'].includes(plan.estado)"
              class="text-sm text-red-500 bg-red-50 dark:bg-red-500/10 hover:bg-red-100 px-3 py-2 rounded-xl font-semibold transition-colors"
              @click="cambiarEstado('CANCELADO')">Cancelar plan</button>
          </div>
        </div>

        <!-- Datos del plan -->
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-5 pt-5 border-t border-slate-200 dark:border-white/10 text-sm">
          <div><p class="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wide font-semibold">Precio total</p><p class="font-bold font-mono text-slate-900 dark:text-white mt-0.5">{{ currency(plan.precioTotal) }}</p></div>
          <div><p class="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wide font-semibold">Cuotas</p><p class="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">{{ plan.cantCuotas }} × {{ currency(plan.valorCuota) }}</p></div>
          <div><p class="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wide font-semibold">Pagado</p><p class="font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-0.5">{{ currency(plan.montoPagado) }}</p></div>
          <div v-if="plan.montoEntrega"><p class="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wide font-semibold">Mínimo retiro</p><p class="font-semibold text-slate-800 dark:text-slate-200 mt-0.5 font-mono">{{ currency(plan.montoEntrega) }}</p></div>
        </div>

        <!-- Nota sesión caja -->
        <div v-if="canCobrar && !sesionActiva" class="mt-4 flex items-center gap-2 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-xl px-4 py-3">
          <svg class="w-4 h-4 text-amber-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"/></svg>
          <p class="text-xs text-amber-700 dark:text-amber-400">Sin sesión de caja abierta. El cobro no quedará registrado en caja.</p>
        </div>
        <div v-else-if="sesionActiva" class="mt-4 flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400">
          <div class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"/>
          Caja abierta — los cobros se registran automáticamente
        </div>
      </div>

      <!-- Stats -->
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-3" v-if="plan._stats">
        <div class="bg-white dark:bg-[#1a1a2e] rounded-2xl border border-slate-200 dark:border-white/10 shadow-card dark:shadow-none p-4 text-center">
          <p class="text-3xl font-bold font-mono text-slate-900 dark:text-white">{{ plan._stats.pagadas }}</p>
          <p class="text-xs text-slate-400 mt-0.5">Pagadas</p>
        </div>
        <div class="bg-white dark:bg-[#1a1a2e] rounded-2xl border shadow-card dark:shadow-none p-4 text-center"
          :class="plan._stats.vencidas > 0 ? 'border-red-200 dark:border-red-500/30' : 'border-slate-200 dark:border-white/10'">
          <p class="text-3xl font-bold font-mono" :class="plan._stats.vencidas > 0 ? 'text-red-500' : 'text-slate-900 dark:text-white'">{{ plan._stats.vencidas }}</p>
          <p class="text-xs mt-0.5" :class="plan._stats.vencidas > 0 ? 'text-red-400' : 'text-slate-400'">Vencidas</p>
        </div>
        <div class="bg-white dark:bg-[#1a1a2e] rounded-2xl border border-slate-200 dark:border-white/10 shadow-card dark:shadow-none p-4 text-center">
          <p class="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400">{{ plan._stats.porcentaje }}%</p>
          <p class="text-xs text-slate-400 mt-0.5">Completado</p>
        </div>
        <div class="bg-white dark:bg-[#1a1a2e] rounded-2xl border border-slate-200 dark:border-white/10 shadow-card dark:shadow-none p-4 text-center">
          <p class="text-sm font-semibold text-slate-900 dark:text-white">
            {{ plan._stats.proximaCuota ? date(plan._stats.proximaCuota) : '—' }}
          </p>
          <p class="text-xs text-slate-400 mt-0.5">Próx. cuota</p>
          <p v-if="plan._stats.puedeRetirar && !plan.vehiculoEntregado" class="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 mt-1">¡Puede retirar!</p>
        </div>
      </div>

      <!-- Cronograma -->
      <div class="bg-white dark:bg-[#1a1a2e] rounded-2xl border border-slate-200 dark:border-white/10 shadow-card dark:shadow-none overflow-hidden">
        <div class="px-5 py-4 border-b border-slate-200 dark:border-white/10">
          <h3 class="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wide">Cronograma de cuotas</h3>
        </div>

        <!-- Barra global -->
        <div class="px-5 py-2 bg-slate-50 dark:bg-white/[0.02] border-b border-slate-200 dark:border-white/10">
          <div class="h-2 bg-slate-200 dark:bg-white/5 rounded-full overflow-hidden">
            <div class="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-700"
              :style="{ width: `${plan._stats?.porcentaje ?? 0}%` }"/>
          </div>
        </div>

        <div class="divide-y divide-slate-200 dark:divide-white/5">
          <div v-for="cuota in plan.cuotas" :key="cuota.id"
            class="flex items-center gap-4 px-5 py-3.5 hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors group"
            :class="{ 'bg-red-50/30 dark:bg-red-500/5': estaVencida(cuota) }">

            <!-- Número -->
            <div class="w-8 h-8 rounded-lg flex items-center justify-center font-mono text-xs font-bold shrink-0"
              :class="cuota.estado === 'PAGADO' ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400' : estaVencida(cuota) ? 'bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400' : 'bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-400'">
              {{ cuota.numeroCuota }}
            </div>

            <!-- Info -->
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 flex-wrap">
                <span class="text-xs font-semibold px-2 py-0.5 rounded-md" :class="CUOTA_STYLE[estaVencida(cuota) ? 'VENCIDO' : cuota.estado]">
                  {{ estaVencida(cuota) ? 'VENCIDO' : cuota.estado }}
                </span>
                <span class="text-xs text-slate-500 dark:text-slate-400">Vence {{ date(cuota.fechaVencimiento) }}</span>
                <span v-if="cuota.estado === 'PAGADO' && cuota.fechaPago" class="text-xs text-emerald-600 dark:text-emerald-400">
                  · Pagado {{ date(cuota.fechaPago) }}
                </span>
              </div>
              <p v-if="cuota.observaciones" class="text-xs text-slate-400 mt-0.5 truncate">{{ cuota.observaciones }}</p>
            </div>

            <!-- Monto -->
            <p class="text-sm font-bold font-mono text-slate-900 dark:text-white shrink-0">{{ currency(cuota.monto) }}</p>

            <!-- Acción cobrar -->
            <div class="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
              <button v-if="cuota.estado !== 'PAGADO' && canCobrar && ['ACTIVO'].includes(plan.estado)"
                class="text-xs font-semibold text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-500/10 hover:bg-primary-100 px-3 py-1.5 rounded-lg transition-colors"
                @click.stop="abrirCobrar(cuota)">
                Cobrar
              </button>
            </div>
          </div>
        </div>
      </div>

    </template>

    <!-- Modal cobrar cuota -->
    <AppModal v-model="showCobrar" :title="`Cobrar cuota ${cuotaSelec?.numeroCuota}`" size="sm">
      <div class="space-y-3">
        <div class="bg-slate-50 dark:bg-white/5 rounded-xl px-4 py-3 text-sm">
          <p class="text-slate-500 dark:text-slate-400">Monto a cobrar</p>
          <p class="text-xl font-bold font-mono text-slate-900 dark:text-white">{{ currency(cuotaSelec?.monto) }}</p>
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Fecha de pago</label>
          <input v-model="fechaCobro" type="date" class="w-full rounded-xl border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-white text-sm focus:border-primary-500 focus:ring-primary-500"/>
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Observaciones</label>
          <textarea v-model="obsCobro" rows="2" class="w-full rounded-xl border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-white text-sm focus:border-primary-500 focus:ring-primary-500 resize-none"/>
        </div>
      </div>
      <template #footer="{ close }">
        <button class="text-sm text-slate-600 dark:text-slate-300 px-4 py-2 rounded-xl border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors" @click="close">Cancelar</button>
        <button class="text-sm bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-2 rounded-xl font-semibold disabled:opacity-60 transition-all shadow-sm" :disabled="cobrandoCuota" @click="confirmarCobro">
          {{ cobrandoCuota ? 'Registrando...' : 'Confirmar cobro' }}
        </button>
      </template>
    </AppModal>

    <!-- Modal entregar auto -->
    <AppModal v-model="showEntregar" title="Entregar vehículo" size="sm">
      <div class="space-y-3">
        <div class="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-xl px-4 py-3">
          <p class="text-sm text-emerald-700 dark:text-emerald-400">
            Se marcará el auto como entregado y se creará una <strong>Venta formal</strong> automáticamente.
          </p>
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Observaciones</label>
          <textarea v-model="obsEntrega" rows="2" class="w-full rounded-xl border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-white text-sm focus:border-primary-500 focus:ring-primary-500 resize-none"/>
        </div>
      </div>
      <template #footer="{ close }">
        <button class="text-sm text-slate-600 dark:text-slate-300 px-4 py-2 rounded-xl border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors" @click="close">Cancelar</button>
        <button class="text-sm bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-2 rounded-xl font-semibold disabled:opacity-60 transition-all shadow-sm" :disabled="entregando" @click="confirmarEntrega">
          {{ entregando ? 'Procesando...' : 'Confirmar entrega' }}
        </button>
      </template>
    </AppModal>

  </div>
</template>
