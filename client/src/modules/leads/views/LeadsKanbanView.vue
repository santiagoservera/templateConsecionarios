<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '../../auth/store/authStore.js'
import { useLeads } from '../composables/useLeads.js'
import { useToast } from '../../../shared/composables/useToast.js'
import AppModal from '../../../shared/components/AppModal.vue'
import AppSelect from '../../../shared/components/AppSelect.vue'
import { date } from '../../../shared/utils/format.js'
import api from '../../../plugins/axios.js'

const authStore = useAuthStore()
const { leads, loading, error, fetchLeads, createLead, cambiarEtapa, deleteLead } = useLeads()
const toast     = useToast()

const ETAPAS = ['NUEVO','CONTACTADO','INTERESADO','NEGOCIACION','GANADO','PERDIDO']
const ETAPA_LABELS = { NUEVO:'Nuevo', CONTACTADO:'Contactado', INTERESADO:'Interesado', NEGOCIACION:'Negociación', GANADO:'Ganado', PERDIDO:'Perdido' }

// Cabeceras de columna con color distintivo por etapa
const ETAPA_HEADER = {
  NUEVO:       'bg-blue-500',
  CONTACTADO:  'bg-cyan-500',
  INTERESADO:  'bg-indigo-500',
  NEGOCIACION: 'bg-orange-500',
  GANADO:      'bg-emerald-500',
  PERDIDO:     'bg-slate-500',
}
const ETAPA_BG = {
  NUEVO:       'bg-blue-50/50',
  CONTACTADO:  'bg-cyan-50/50',
  INTERESADO:  'bg-indigo-50/50',
  NEGOCIACION: 'bg-orange-50/50',
  GANADO:      'bg-emerald-50/50',
  PERDIDO:     'bg-slate-50/50',
}

const esGestor       = computed(() => ['ADMIN','GERENTE'].includes(authStore.userRole))
const vendedores     = ref([])
const filtroVendedor = ref('')

const vendedorOptions = computed(() => [
  { value: '', label: 'Todos los vendedores' },
  ...vendedores.value.map(v => ({ value: v.id, label: v.nombre })),
])

onMounted(async () => {
  if (esGestor.value) {
    try {
      const { data } = await api.get('/usuarios/vendedores')
      vendedores.value = data.data
    } catch { /* silencioso */ }
  }
  cargarLeads()
})

function cargarLeads() {
  const params = { pageSize: 100 }
  if (filtroVendedor.value) params.vendedorId = filtroVendedor.value
  fetchLeads(params)
}

function onFiltroVendedor() { cargarLeads() }

const leadsByEtapa = computed(() => {
  const map = Object.fromEntries(ETAPAS.map(e => [e, []]))
  leads.value.forEach(l => { if (map[l.etapa]) map[l.etapa].push(l) })
  return map
})

// Drag & Drop
const draggingLead = ref(null)
const dragOver     = ref(null)

function onDragStart(lead) { draggingLead.value = lead }
function onDragEnd()       { draggingLead.value = null; dragOver.value = null }
function onDragLeave(e)    { if (!e.currentTarget.contains(e.relatedTarget)) dragOver.value = null }

async function onDrop(e, newEtapa) {
  e.preventDefault()
  const lead = draggingLead.value
  dragOver.value = null; draggingLead.value = null
  if (!lead || lead.etapa === newEtapa) return
  const old = lead.etapa
  lead.etapa = newEtapa
  try { await cambiarEtapa(lead.id, newEtapa) } catch { lead.etapa = old }
}

const now = new Date()
const estaVencido = (f) => f && new Date(f) < now

// Iniciales del cliente para avatar
const iniciales = (lead) => {
  const n = lead.cliente?.nombre?.charAt(0) ?? ''
  const a = lead.cliente?.apellido?.charAt(0) ?? ''
  return (n + a).toUpperCase() || '?'
}

// Colores de avatar por primera letra
const avatarColor = (lead) => {
  const colors = ['bg-blue-500','bg-emerald-500','bg-violet-500','bg-orange-500','bg-cyan-500','bg-rose-500','bg-amber-500','bg-indigo-500']
  const code = (lead.cliente?.nombre?.charCodeAt(0) ?? 0) % colors.length
  return colors[code]
}

// Eliminar
const leadAEliminar = ref(null)
const eliminando    = ref(false)

const showConfirmDelete = computed({
  get: () => !!leadAEliminar.value,
  set: (val) => { if (!val) leadAEliminar.value = null },
})

async function confirmarEliminacion() {
  eliminando.value = true
  try {
    await deleteLead(leadAEliminar.value.id)
    toast.success('Lead eliminado', 'El lead fue eliminado del pipeline.')
    leadAEliminar.value = null
    cargarLeads()
  } finally { eliminando.value = false }
}

// Modal nuevo lead
const showModal  = ref(false)
const modalError = ref('')
const saving     = ref(false)
const notas      = ref('')

const todosClientes   = ref([])
const clienteQuery    = ref('')
const clienteSel      = ref(null)
const openClientes    = ref(false)
const loadingClientes = ref(false)

const clientesFiltrados = computed(() => {
  const q = clienteQuery.value.trim().toLowerCase()
  if (!q) return todosClientes.value
  return todosClientes.value.filter(c => c.nombre.toLowerCase().includes(q) || c.apellido.toLowerCase().includes(q) || (c.dniCuit??'').includes(q))
})

async function cargarClientes() {
  if (todosClientes.value.length) return
  loadingClientes.value = true
  try { const { data } = await api.get('/clientes',{ params:{ pageSize:50 } }); todosClientes.value = data.data??[] }
  finally { loadingClientes.value = false }
}

function abrirClientes() { openClientes.value = true; cargarClientes() }
function cerrarClientes() { setTimeout(() => { openClientes.value = false }, 150) }
function seleccionarCliente(c) { clienteSel.value = c; clienteQuery.value = `${c.apellido}, ${c.nombre}`; openClientes.value = false }

const todosVehiculos   = ref([])
const vehiculoQuery    = ref('')
const vehiculoSel      = ref(null)
const openVehiculos    = ref(false)
const loadingVehiculos = ref(false)

const vehiculosFiltrados = computed(() => {
  const q = vehiculoQuery.value.trim().toLowerCase()
  if (!q) return todosVehiculos.value
  return todosVehiculos.value.filter(v => v.marca.toLowerCase().includes(q) || v.modelo.toLowerCase().includes(q))
})

async function cargarVehiculos() {
  if (todosVehiculos.value.length) return
  loadingVehiculos.value = true
  try { const { data } = await api.get('/vehiculos',{ params:{ estado:'DISPONIBLE', pageSize:50 } }); todosVehiculos.value = data.data??[] }
  finally { loadingVehiculos.value = false }
}

function abrirVehiculos() { openVehiculos.value = true; cargarVehiculos() }
function cerrarVehiculos() { setTimeout(() => { openVehiculos.value = false }, 150) }
function seleccionarVehiculo(v) { vehiculoSel.value = v; vehiculoQuery.value = `${v.marca} ${v.modelo} ${v.anio}`; openVehiculos.value = false }

function abrirModal() {
  clienteQuery.value=''; clienteSel.value=null; todosClientes.value=[]
  vehiculoQuery.value=''; vehiculoSel.value=null; todosVehiculos.value=[]
  notas.value=''; modalError.value=''
  showModal.value=true
}

async function guardarLead() {
  if (!clienteSel.value) { modalError.value='Seleccioná un cliente'; return }
  modalError.value=''; saving.value=true
  try {
    const payload = { clienteId: clienteSel.value.id, notas: notas.value||undefined }
    if (vehiculoSel.value) payload.vehiculoInteresId = vehiculoSel.value.id
    await createLead(payload)
    toast.success('Lead creado', 'El lead fue registrado en el pipeline.')
    showModal.value=false; cargarLeads()
  } catch (err) { modalError.value = err.response?.data?.error??'Error al crear lead' }
  finally { saving.value=false }
}
</script>

<template>
  <div class="flex flex-col h-full animate-fade-in">

    <!-- Header -->
    <div class="px-6 pt-6 pb-4 flex items-center justify-between gap-4 shrink-0">
      <div>
        <h1 class="text-2xl font-bold text-slate-900 dark:text-white">Pipeline de leads</h1>
        <p class="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
          <span class="font-mono font-semibold text-slate-700 dark:text-slate-200">{{ leads.length }}</span>
          lead{{ leads.length!==1?'s':'' }} activos
        </p>
      </div>

      <div class="flex items-center gap-3">
        <!-- Filtro vendedor -->
        <AppSelect v-if="esGestor" v-model="filtroVendedor" :options="vendedorOptions" @change="onFiltroVendedor" />

        <button
          class="inline-flex items-center gap-2 bg-primary-500 hover:bg-primary-600 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-all shadow-sm hover:shadow-glow active:scale-[0.98]"
          @click="abrirModal"
        >
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15"/>
          </svg>
          Nuevo lead
        </button>
      </div>
    </div>

    <div v-if="error" class="mx-6 mb-3 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 px-4 py-3 text-sm text-red-700 dark:text-red-400">{{ error }}</div>

    <!-- Kanban -->
    <div class="flex-1 overflow-x-auto px-6 pb-6">
      <div class="flex gap-3 h-full min-h-0" style="min-width: max-content;">

        <div v-for="etapa in ETAPAS" :key="etapa" class="flex flex-col w-64 shrink-0">

          <!-- Header de columna con color -->
          <div class="rounded-xl overflow-hidden mb-2">
            <div :class="[ETAPA_HEADER[etapa], 'px-3 py-2 flex items-center justify-between']">
              <span class="text-xs font-bold text-white uppercase tracking-wide">{{ ETAPA_LABELS[etapa] }}</span>
              <span class="bg-white/20 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                {{ leadsByEtapa[etapa].length }}
              </span>
            </div>
          </div>

          <!-- Zona de drop -->
          <div
            class="flex-1 rounded-xl p-2 space-y-2 transition-all min-h-24 border-2"
            :class="[
              ETAPA_BG[etapa],
              dragOver===etapa ? 'border-primary-400 ring-2 ring-primary-200 bg-primary-50/50' : 'border-transparent',
            ]"
            @dragover.prevent="dragOver=etapa"
            @dragleave="onDragLeave"
            @drop="onDrop($event,etapa)"
          >
            <!-- Cards -->
            <div
              v-for="lead in leadsByEtapa[etapa]"
              :key="lead.id"
              draggable="true"
              class="bg-white dark:bg-[#1a1a2e] rounded-xl border border-slate-200 dark:border-white/10 p-3 cursor-grab active:cursor-grabbing shadow-card dark:shadow-none hover:shadow-card-md dark:hover:bg-[#1e1e35] transition-all select-none"
              :class="{ 'opacity-30': draggingLead?.id===lead.id }"
              @dragstart="onDragStart(lead)"
              @dragend="onDragEnd"
            >
              <!-- Avatar + nombre -->
              <div class="flex items-start gap-2.5">
                <div :class="[avatarColor(lead), 'w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0']">
                  {{ iniciales(lead) }}
                </div>
                <div class="min-w-0 flex-1">
                  <p class="text-sm font-semibold text-slate-800 dark:text-white leading-tight truncate">
                    {{ lead.cliente?.apellido }}, {{ lead.cliente?.nombre }}
                  </p>
                  <p v-if="lead.cliente?.telefono" class="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                    {{ lead.cliente.telefono }}
                  </p>
                </div>
              </div>

              <!-- Vendedor (para ADMIN/GERENTE) -->
              <div v-if="esGestor && lead.vendedor" class="mt-2">
                <span class="text-[10px] font-medium text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-500/10 px-2 py-0.5 rounded-md">
                  {{ lead.vendedor.nombre }}
                </span>
              </div>

              <!-- Vehículo de interés — chip -->
              <div v-if="lead.vehiculoInteres" class="mt-2">
                <span class="inline-flex items-center gap-1 text-[10px] font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-white/10 rounded-md px-2 py-0.5">
                  <svg class="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6"/></svg>
                  {{ lead.vehiculoInteres.marca }} {{ lead.vehiculoInteres.modelo }} {{ lead.vehiculoInteres.anio }}
                </span>
              </div>

              <!-- Próximo contacto con indicador de urgencia -->
              <div
                v-if="lead.proximoContacto"
                class="mt-2 flex items-center gap-1.5 rounded-lg px-2 py-1"
                :class="estaVencido(lead.proximoContacto) ? 'bg-red-50 dark:bg-red-500/10' : 'bg-slate-50 dark:bg-white/5'"
              >
                <div class="w-1.5 h-1.5 rounded-full shrink-0 animate-pulse"
                  :class="estaVencido(lead.proximoContacto) ? 'bg-red-500' : 'bg-slate-300 dark:bg-slate-600'" />
                <span class="text-[10px] font-medium"
                  :class="estaVencido(lead.proximoContacto) ? 'text-red-600 dark:text-red-400' : 'text-slate-400 dark:text-slate-500'">
                  {{ estaVencido(lead.proximoContacto) ? '¡Vencido! ' : '' }}{{ date(lead.proximoContacto) }}
                </span>
              </div>

              <!-- Acción eliminar -->
              <div class="flex justify-end mt-2 pt-2 border-t border-slate-100 dark:border-white/5">
                <button
                  class="text-[10px] text-slate-300 dark:text-slate-600 hover:text-red-400 dark:hover:text-red-500 font-medium transition-colors"
                  @click.stop="leadAEliminar=lead"
                >
                  Eliminar
                </button>
              </div>
            </div>

            <!-- Drop placeholder -->
            <div
              v-if="!leadsByEtapa[etapa].length && dragOver===etapa"
              class="h-16 rounded-xl border-2 border-dashed border-primary-300 flex items-center justify-center"
            >
              <p class="text-xs text-primary-400 font-medium">Soltar aquí</p>
            </div>

            <!-- Empty state -->
            <div
              v-else-if="!leadsByEtapa[etapa].length"
              class="h-16 rounded-xl border border-dashed border-slate-200 dark:border-white/10 flex items-center justify-center"
            >
              <p class="text-xs text-slate-300 dark:text-slate-600">Sin leads</p>
            </div>
          </div>
        </div>

      </div>
    </div>

    <!-- Modal confirmar eliminación -->
    <AppModal v-model="showConfirmDelete" title="Eliminar lead" size="sm">
      <p class="text-sm text-slate-700 dark:text-slate-300">
        ¿Eliminar el lead de
        <strong class="text-slate-900 dark:text-white">{{ leadAEliminar?.cliente?.apellido }}, {{ leadAEliminar?.cliente?.nombre }}</strong>?
        Esta acción no se puede deshacer.
      </p>
      <template #footer>
        <button class="text-sm text-slate-600 dark:text-slate-300 px-4 py-2 rounded-lg border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors" @click="leadAEliminar=null">Cancelar</button>
        <button class="text-sm bg-red-500 hover:bg-red-600 text-white px-5 py-2 rounded-lg font-semibold disabled:opacity-60 transition-colors" :disabled="eliminando" @click="confirmarEliminacion">
          {{ eliminando ? 'Eliminando...' : 'Eliminar' }}
        </button>
      </template>
    </AppModal>

    <!-- Modal nuevo lead -->
    <AppModal v-model="showModal" title="Nuevo lead" size="md">
      <div class="space-y-4">
        <p v-if="modalError" class="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-lg px-3 py-2">{{ modalError }}</p>

        <!-- Cliente -->
        <div>
          <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Cliente *</label>
          <div class="relative">
            <input v-model="clienteQuery" type="text" placeholder="Hacé clic para ver clientes..." autocomplete="off"
              class="w-full rounded-xl border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 text-sm focus:border-primary-500 focus:ring-primary-500"
              @focus="abrirClientes" @blur="cerrarClientes" />
            <div v-if="openClientes" class="absolute z-20 top-full left-0 right-0 mt-1 bg-white dark:bg-[#1a1a2e] rounded-xl border border-slate-200 dark:border-white/10 shadow-card-lg max-h-48 overflow-y-auto">
              <div v-if="loadingClientes" class="flex justify-center py-4">
                <svg class="w-5 h-5 animate-spin text-primary-500" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg>
              </div>
              <template v-else>
                <button v-for="c in clientesFiltrados" :key="c.id"
                  class="w-full text-left px-4 py-2.5 text-sm hover:bg-slate-50 dark:hover:bg-white/5 transition-colors border-b border-slate-200 dark:border-white/10 last:border-0"
                  @mousedown.prevent="seleccionarCliente(c)">
                  <span class="font-medium text-slate-800 dark:text-white">{{ c.apellido }}, {{ c.nombre }}</span>
                  <span v-if="c.dniCuit" class="text-slate-400 dark:text-slate-500 text-xs ml-2">{{ c.dniCuit }}</span>
                </button>
                <p v-if="!clientesFiltrados.length" class="text-xs text-slate-400 dark:text-slate-500 px-4 py-3 text-center">Sin resultados</p>
              </template>
            </div>
          </div>
          <p v-if="clienteSel" class="text-xs text-emerald-600 dark:text-emerald-400 mt-1 font-medium">✓ {{ clienteSel.apellido }}, {{ clienteSel.nombre }}</p>
        </div>

        <!-- Vehículo -->
        <div>
          <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
            Vehículo de interés <span class="text-slate-400 dark:text-slate-500 font-normal">(opcional)</span>
          </label>
          <div class="relative">
            <input v-model="vehiculoQuery" type="text" placeholder="Hacé clic para ver vehículos disponibles..." autocomplete="off"
              class="w-full rounded-xl border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 text-sm focus:border-primary-500 focus:ring-primary-500"
              @focus="abrirVehiculos" @blur="cerrarVehiculos" />
            <div v-if="openVehiculos" class="absolute z-20 top-full left-0 right-0 mt-1 bg-white dark:bg-[#1a1a2e] rounded-xl border border-slate-200 dark:border-white/10 shadow-card-lg max-h-40 overflow-y-auto">
              <div v-if="loadingVehiculos" class="flex justify-center py-4">
                <svg class="w-5 h-5 animate-spin text-primary-500" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg>
              </div>
              <template v-else>
                <button v-for="v in vehiculosFiltrados" :key="v.id"
                  class="w-full text-left px-4 py-2.5 text-sm text-slate-800 dark:text-white hover:bg-slate-50 dark:hover:bg-white/5 transition-colors border-b border-slate-200 dark:border-white/10 last:border-0"
                  @mousedown.prevent="seleccionarVehiculo(v)">
                  {{ v.marca }} {{ v.modelo }} {{ v.anio }}
                </button>
                <p v-if="!vehiculosFiltrados.length" class="text-xs text-slate-400 dark:text-slate-500 px-4 py-3 text-center">Sin vehículos disponibles</p>
              </template>
            </div>
          </div>
          <p v-if="vehiculoSel" class="text-xs text-emerald-600 dark:text-emerald-400 mt-1 font-medium">✓ {{ vehiculoSel.marca }} {{ vehiculoSel.modelo }}</p>
        </div>

        <!-- Notas -->
        <div>
          <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Notas</label>
          <textarea v-model="notas" rows="3" placeholder="Observaciones iniciales..."
            class="w-full rounded-xl border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 text-sm focus:border-primary-500 focus:ring-primary-500 resize-none" />
        </div>
      </div>

      <template #footer="{ close }">
        <button class="text-sm text-slate-600 dark:text-slate-300 px-4 py-2 rounded-lg border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors" @click="close">Cancelar</button>
        <button
          class="text-sm bg-primary-500 hover:bg-primary-600 text-white px-5 py-2 rounded-xl font-semibold disabled:opacity-60 transition-all shadow-sm hover:shadow-glow"
          :disabled="saving" @click="guardarLead">
          {{ saving ? 'Guardando...' : 'Crear lead' }}
        </button>
      </template>
    </AppModal>

  </div>
</template>
