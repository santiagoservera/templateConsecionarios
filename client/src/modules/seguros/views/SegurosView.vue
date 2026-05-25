<script setup>
import { ref, computed, onMounted } from 'vue'
import { usePermisos } from '../../../shared/composables/usePermisos.js'
import { useSeguros } from '../composables/useSeguros.js'
import { useToast } from '../../../shared/composables/useToast.js'
import AppModal from '../../../shared/components/AppModal.vue'
import AppSelect from '../../../shared/components/AppSelect.vue'
import { currency } from '../../../shared/utils/format.js'

const toast     = useToast()
const { canDo } = usePermisos()
const { aseguradoras, loading, error, fetchAseguradoras, createAseguradora, updateAseguradora, removeAseguradora, upsertPlanes } = useSeguros()

const canManage = computed(() => canDo('seguros', 'editar'))

onMounted(() => fetchAseguradoras(false))

// ── Constantes ─────────────────────────────────────────────────────────────────
const LABEL_TIPO = {
  RESPONSABILIDAD_CIVIL: 'Resp. Civil',
  TERCEROS_COMPLETO:     'Terceros Completo',
  TODO_RIESGO:           'Todo Riesgo',
  OTRO:                  'Otro',
}
const COLOR_TIPO = {
  RESPONSABILIDAD_CIVIL: 'bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300',
  TERCEROS_COMPLETO:     'bg-blue-100 dark:bg-blue-500/15 text-blue-700 dark:text-blue-400',
  TODO_RIESGO:           'bg-emerald-100 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400',
  OTRO:                  'bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300',
}
const LABEL_APLICA = { AUTO: 'Autos', MOTO: 'Motos', AMBOS: 'Autos y Motos' }
const COLOR_APLICA = {
  AUTO:  'bg-violet-100 dark:bg-violet-500/15 text-violet-700 dark:text-violet-400',
  MOTO:  'bg-amber-100 dark:bg-amber-500/15 text-amber-700 dark:text-amber-400',
  AMBOS: 'bg-primary-100 dark:bg-primary-500/15 text-primary-700 dark:text-primary-400',
}

const tipoOptions = [
  { value: 'RESPONSABILIDAD_CIVIL', label: 'Responsabilidad Civil' },
  { value: 'TERCEROS_COMPLETO',     label: 'Terceros Completo' },
  { value: 'TODO_RIESGO',           label: 'Todo Riesgo' },
  { value: 'OTRO',                  label: 'Otro' },
]
const aplicaOptions = [
  { value: 'AMBOS', label: 'Autos y Motos' },
  { value: 'AUTO',  label: 'Solo Autos' },
  { value: 'MOTO',  label: 'Solo Motos' },
]

// ── Modal aseguradora ──────────────────────────────────────────────────────────
const showModal       = ref(false)
const editando        = ref(null)
const saving          = ref(false)
const modalError      = ref('')

const formAseg = ref({ nombre: '', descripcion: '', contacto: '' })

const emptyPlan = () => ({
  codigoPlan:    '',
  tipoCobertura: 'TODO_RIESGO',
  aplicaA:       'AMBOS',
  precioMensual: '',
  precioAnual:   '',
  sumaCubierta:  '',
  descripcion:   '',
  urlDocumento:  '',
  activo:        true,
})

const planesForm = ref([emptyPlan()])

function abrirCrear() {
  editando.value  = null
  formAseg.value  = { nombre: '', descripcion: '', contacto: '' }
  planesForm.value = [emptyPlan()]
  modalError.value = ''
  showModal.value  = true
}

function abrirEditar(aseg) {
  editando.value = aseg
  formAseg.value = {
    nombre:      aseg.nombre,
    descripcion: aseg.descripcion ?? '',
    contacto:    aseg.contacto    ?? '',
  }
  planesForm.value = aseg.planes.length
    ? aseg.planes.map(p => ({
        codigoPlan:    p.codigoPlan    ?? '',
        tipoCobertura: p.tipoCobertura,
        aplicaA:       p.aplicaA       ?? 'AMBOS',
        precioMensual: p.precioMensual ? Number(p.precioMensual) : '',
        precioAnual:   p.precioAnual   ? Number(p.precioAnual)   : '',
        sumaCubierta:  p.sumaCubierta  ?? '',
        descripcion:   p.descripcion   ?? '',
        urlDocumento:  p.urlDocumento  ?? '',
        activo:        p.activo,
      }))
    : [emptyPlan()]
  modalError.value = ''
  showModal.value  = true
}

function agregarPlan()   { planesForm.value.push(emptyPlan()) }
function quitarPlan(idx) { if (planesForm.value.length > 1) planesForm.value.splice(idx, 1) }

async function guardar() {
  if (!formAseg.value.nombre.trim()) { modalError.value = 'El nombre de la aseguradora es requerido'; return }
  saving.value = true; modalError.value = ''
  try {
    const planes = planesForm.value.map(p => ({
      codigoPlan:    p.codigoPlan.trim()    || null,
      tipoCobertura: p.tipoCobertura,
      aplicaA:       p.aplicaA,
      precioMensual: p.precioMensual !== '' ? Number(p.precioMensual) : null,
      precioAnual:   p.precioAnual   !== '' ? Number(p.precioAnual)   : null,
      sumaCubierta:  p.sumaCubierta.trim()  || null,
      descripcion:   p.descripcion.trim()   || null,
      urlDocumento:  p.urlDocumento.trim()  || null,
      activo:        p.activo,
    }))

    if (editando.value) {
      await updateAseguradora(editando.value.id, {
        nombre:      formAseg.value.nombre.trim(),
        descripcion: formAseg.value.descripcion.trim() || null,
        contacto:    formAseg.value.contacto.trim()    || null,
      })
      await upsertPlanes(editando.value.id, planes)
      toast.success('Actualizado', `${formAseg.value.nombre} actualizado.`)
    } else {
      await createAseguradora({
        nombre:      formAseg.value.nombre.trim(),
        descripcion: formAseg.value.descripcion.trim() || null,
        contacto:    formAseg.value.contacto.trim()    || null,
        planes,
      })
      toast.success('Creado', `${formAseg.value.nombre} registrado.`)
    }
    showModal.value = false
    fetchAseguradoras(false)
  } catch (err) {
    modalError.value = err.response?.data?.error ?? 'Error al guardar'
  } finally {
    saving.value = false
  }
}

// ── Toggle activo/inactivo ─────────────────────────────────────────────────────
async function toggleActivo(aseg) {
  try {
    await updateAseguradora(aseg.id, { activo: !aseg.activo })
    toast.success(aseg.activo ? 'Desactivada' : 'Activada', aseg.nombre)
    fetchAseguradoras(false)
  } catch {
    toast.error('Error', 'No se pudo cambiar el estado')
  }
}

// ── Eliminar ───────────────────────────────────────────────────────────────────
const asegAEliminar = ref(null)
const eliminando    = ref(false)
const showEliminar  = computed({
  get: () => !!asegAEliminar.value,
  set: (v) => { if (!v) asegAEliminar.value = null },
})

async function confirmarEliminar() {
  eliminando.value = true
  try {
    await removeAseguradora(asegAEliminar.value.id)
    toast.success('Desactivada', asegAEliminar.value.nombre)
    asegAEliminar.value = null
    fetchAseguradoras(false)
  } catch (err) {
    toast.error('Error', err.response?.data?.error ?? 'No se pudo desactivar')
  } finally {
    eliminando.value = false
  }
}

// ── Expandir descripción del plan ──────────────────────────────────────────────
const expandidos = ref(new Set())
function toggleExpand(id) {
  if (expandidos.value.has(id)) expandidos.value.delete(id)
  else expandidos.value.add(id)
}

const inputCls = 'w-full rounded-lg border-slate-200 dark:border-white/10 bg-white dark:bg-[#1a1a2e] text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 text-sm focus:border-primary-500 focus:ring-primary-500'
</script>

<template>
  <div class="p-6 space-y-6 animate-fade-in">

    <!-- Encabezado -->
    <div class="flex items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold text-slate-900 dark:text-white">Seguros</h1>
        <p class="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
          Aseguradoras y planes disponibles para ofrecer a los clientes.
        </p>
      </div>
      <button v-if="canManage"
        class="inline-flex items-center gap-2 bg-primary-500 hover:bg-primary-600 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-all shadow-sm hover:shadow-glow active:scale-[0.98] shrink-0"
        @click="abrirCrear">
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15"/>
        </svg>
        Nueva aseguradora
      </button>
    </div>

    <!-- Error / Loading -->
    <div v-if="error" class="rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 px-4 py-3 text-sm text-red-700 dark:text-red-400">{{ error }}</div>
    <div v-if="loading" class="flex justify-center py-16">
      <svg class="w-8 h-8 animate-spin text-primary-500" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
      </svg>
    </div>

    <!-- Empty state -->
    <div v-else-if="!aseguradoras.length" class="text-center py-20 bg-white dark:bg-[#1a1a2e] rounded-2xl border border-slate-200 dark:border-white/10">
      <svg class="w-12 h-12 mx-auto mb-3 text-slate-200 dark:text-white/10" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1">
        <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z"/>
      </svg>
      <p class="font-medium text-slate-500 dark:text-slate-400">Sin aseguradoras registradas</p>
      <p class="text-sm mt-1 text-slate-400 dark:text-slate-500">Agregá una aseguradora para comenzar.</p>
    </div>

    <!-- Lista de aseguradoras -->
    <div v-else class="space-y-4">
      <div
        v-for="aseg in aseguradoras"
        :key="aseg.id"
        class="bg-white dark:bg-[#1a1a2e] rounded-2xl border shadow-card dark:shadow-none overflow-hidden transition-all"
        :class="aseg.activo ? 'border-slate-200 dark:border-white/10' : 'border-slate-200 dark:border-white/10 opacity-60'"
      >
        <!-- Header aseguradora -->
        <div class="px-5 py-4 flex items-center justify-between gap-4 border-b border-slate-200 dark:border-white/10">
          <div class="flex items-center gap-3 min-w-0">
            <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shrink-0 shadow-sm">
              <svg class="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z"/>
              </svg>
            </div>
            <div class="min-w-0">
              <div class="flex items-center gap-2 flex-wrap">
                <h3 class="text-sm font-bold text-slate-900 dark:text-white">{{ aseg.nombre }}</h3>
                <span v-if="!aseg.activo" class="text-[10px] font-semibold text-slate-400 bg-slate-100 dark:bg-white/10 px-2 py-0.5 rounded-full">Inactiva</span>
              </div>
              <div class="flex items-center gap-3 mt-0.5 flex-wrap">
                <p v-if="aseg.descripcion" class="text-xs text-slate-400 dark:text-slate-500 truncate">{{ aseg.descripcion }}</p>
                <a v-if="aseg.contacto" :href="aseg.contacto.includes('@') ? `mailto:${aseg.contacto}` : `tel:${aseg.contacto}`"
                  class="text-xs text-primary-500 dark:text-primary-400 hover:underline">
                  {{ aseg.contacto }}
                </a>
              </div>
              <p class="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                <span class="font-semibold font-mono text-slate-600 dark:text-slate-300">{{ aseg.planes.length }}</span>
                plan{{ aseg.planes.length !== 1 ? 'es' : '' }} configurado{{ aseg.planes.length !== 1 ? 's' : '' }}
              </p>
            </div>
          </div>

          <div v-if="canManage" class="flex items-center gap-2 shrink-0">
            <button
              class="text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
              :class="aseg.activo
                ? 'text-slate-500 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 dark:text-slate-400 dark:bg-white/5 dark:hover:bg-white/10'
                : 'text-emerald-600 bg-emerald-50 hover:bg-emerald-100 dark:text-emerald-400 dark:bg-emerald-500/10'"
              @click="toggleActivo(aseg)"
            >
              {{ aseg.activo ? 'Desactivar' : 'Activar' }}
            </button>
            <button
              class="text-xs font-semibold text-primary-600 hover:text-primary-700 bg-primary-50 hover:bg-primary-100 dark:text-primary-400 dark:bg-primary-500/10 px-3 py-1.5 rounded-lg transition-colors"
              @click="abrirEditar(aseg)"
            >
              Editar
            </button>
            <button
              class="text-xs font-semibold text-red-500 dark:text-red-400 bg-red-50 hover:bg-red-100 dark:bg-red-500/10 dark:hover:bg-red-500/20 px-3 py-1.5 rounded-lg transition-colors"
              @click="asegAEliminar = aseg"
            >
              Eliminar
            </button>
          </div>
        </div>

        <!-- Planes -->
        <div class="p-4">
          <div v-if="!aseg.planes.length" class="text-xs text-slate-400 dark:text-slate-500 italic py-2 px-1">Sin planes activos.</div>
          <div v-else class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
            <div
              v-for="plan in aseg.planes"
              :key="plan.id"
              class="rounded-xl border p-4 flex flex-col gap-3 transition-all"
              :class="plan.activo
                ? 'bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10'
                : 'bg-slate-50/50 dark:bg-white/[0.02] border-dashed border-slate-200 dark:border-white/5 opacity-50'"
            >
              <!-- Badges -->
              <div class="flex flex-wrap gap-1.5">
                <span class="text-[10px] font-semibold px-2 py-0.5 rounded-full" :class="COLOR_TIPO[plan.tipoCobertura]">
                  {{ LABEL_TIPO[plan.tipoCobertura] }}
                </span>
                <span class="text-[10px] font-semibold px-2 py-0.5 rounded-full" :class="COLOR_APLICA[plan.aplicaA ?? 'AMBOS']">
                  {{ LABEL_APLICA[plan.aplicaA ?? 'AMBOS'] }}
                </span>
              </div>

              <!-- Nombre del plan -->
              <p v-if="plan.codigoPlan" class="text-sm font-semibold text-slate-700 dark:text-slate-200 leading-tight">
                {{ plan.codigoPlan }}
              </p>

              <!-- Precio -->
              <div class="flex items-end gap-3">
                <div v-if="plan.precioMensual">
                  <p class="text-[10px] text-slate-400 dark:text-slate-500 font-medium uppercase tracking-wide">Por mes</p>
                  <p class="text-xl font-bold text-slate-900 dark:text-white leading-none">{{ currency(plan.precioMensual) }}</p>
                </div>
                <div v-if="plan.precioAnual" :class="plan.precioMensual ? 'border-l border-slate-200 dark:border-white/10 pl-3' : ''">
                  <p class="text-[10px] text-slate-400 dark:text-slate-500 font-medium uppercase tracking-wide">Por año</p>
                  <p class="text-base font-semibold text-slate-600 dark:text-slate-300 leading-none">{{ currency(plan.precioAnual) }}</p>
                </div>
                <p v-if="!plan.precioMensual && !plan.precioAnual" class="text-xs text-slate-400 dark:text-slate-500 italic">Precio a consultar</p>
              </div>

              <!-- Suma cubierta -->
              <div v-if="plan.sumaCubierta" class="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300">
                <svg class="w-3.5 h-3.5 text-emerald-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"/>
                </svg>
                Cubre {{ plan.sumaCubierta }}
              </div>

              <!-- Descripción (colapsable) -->
              <div v-if="plan.descripcion">
                <button
                  class="text-[11px] text-primary-500 dark:text-primary-400 font-medium hover:underline"
                  @click="toggleExpand(plan.id)"
                >
                  {{ expandidos.has(plan.id) ? 'Ocultar detalle ▲' : 'Ver detalle ▼' }}
                </button>
                <p v-if="expandidos.has(plan.id)" class="mt-1.5 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  {{ plan.descripcion }}
                </p>
              </div>

              <!-- PDF -->
              <a v-if="plan.urlDocumento" :href="plan.urlDocumento" target="_blank"
                class="mt-auto inline-flex items-center gap-1 text-[11px] font-semibold text-primary-600 dark:text-primary-400 hover:underline">
                <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z"/>
                </svg>
                Condiciones (PDF)
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ── Modal aseguradora ─────────────────────────────────────────────────── -->
    <AppModal v-model="showModal" :title="editando ? `Editar — ${editando.nombre}` : 'Nueva aseguradora'" size="lg">
      <div class="space-y-5">
        <p v-if="modalError" class="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl px-4 py-3">{{ modalError }}</p>

        <!-- Datos de la aseguradora -->
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Aseguradora *</label>
            <input v-model="formAseg.nombre" type="text" placeholder="Ej: El Triunfo, SANCOR, Zurich..." :class="inputCls"/>
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Contacto <span class="text-slate-400 dark:text-slate-500 font-normal">(tel. o email)</span></label>
            <input v-model="formAseg.contacto" type="text" placeholder="Ej: 11 4567-8901" :class="inputCls"/>
          </div>
          <div class="col-span-2">
            <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Descripción <span class="text-slate-400 dark:text-slate-500 font-normal">(opcional)</span></label>
            <input v-model="formAseg.descripcion" type="text" placeholder="Ej: Especialistas en motos, atención 24hs..." :class="inputCls"/>
          </div>
        </div>

        <!-- Planes -->
        <div>
          <div class="flex items-center justify-between mb-3">
            <label class="text-sm font-medium text-slate-700 dark:text-slate-300">
              Planes de cobertura
            </label>
            <button type="button"
              class="inline-flex items-center gap-1.5 text-xs font-semibold text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-500/10 hover:bg-primary-100 dark:hover:bg-primary-500/20 px-3 py-1.5 rounded-lg transition-colors"
              @click="agregarPlan">
              <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15"/>
              </svg>
              Agregar plan
            </button>
          </div>

          <div class="space-y-3">
            <div
              v-for="(plan, idx) in planesForm"
              :key="idx"
              class="bg-slate-50 dark:bg-white/[0.03] rounded-xl border border-slate-200 dark:border-white/5 p-4 space-y-3"
            >
              <!-- Fila 1: nombre + tipo + aplica a -->
              <div class="grid grid-cols-3 gap-3">
                <div>
                  <label class="block text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">Nombre del plan</label>
                  <input v-model="plan.codigoPlan" type="text" placeholder="Ej: Plan Full, RC básico..." :class="inputCls"/>
                </div>
                <div>
                  <label class="block text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">Cobertura</label>
                  <AppSelect v-model="plan.tipoCobertura" :options="tipoOptions"/>
                </div>
                <div>
                  <label class="block text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">Aplica a</label>
                  <AppSelect v-model="plan.aplicaA" :options="aplicaOptions"/>
                </div>
              </div>

              <!-- Fila 2: precios + suma cubierta -->
              <div class="grid grid-cols-3 gap-3">
                <div>
                  <label class="block text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">Precio mensual</label>
                  <input v-model.number="plan.precioMensual" type="number" min="0" placeholder="Ej: 15000" :class="inputCls"/>
                </div>
                <div>
                  <label class="block text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">Prima anual</label>
                  <input v-model.number="plan.precioAnual" type="number" min="0" placeholder="Ej: 180000" :class="inputCls"/>
                </div>
                <div>
                  <label class="block text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">Suma cubierta</label>
                  <input v-model="plan.sumaCubierta" type="text" placeholder="Ej: hasta $10.000.000" :class="inputCls"/>
                </div>
              </div>

              <!-- Fila 3: descripción + url + activo + quitar -->
              <div class="flex items-start gap-3">
                <div class="flex-1">
                  <label class="block text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">¿Qué cubre?</label>
                  <textarea v-model="plan.descripcion" rows="2" placeholder="Robo total, destrucción total, daños a terceros..." :class="inputCls + ' resize-none'"/>
                </div>
                <div class="w-40 shrink-0">
                  <label class="block text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">Link PDF</label>
                  <input v-model="plan.urlDocumento" type="url" placeholder="https://..." :class="inputCls"/>
                </div>
                <div class="flex flex-col items-center gap-2 shrink-0 pt-5">
                  <label class="flex items-center gap-1 cursor-pointer">
                    <input type="checkbox" v-model="plan.activo" class="rounded border-slate-300 dark:border-white/20 text-primary-500 focus:ring-primary-500"/>
                    <span class="text-xs text-slate-500 dark:text-slate-400">Activo</span>
                  </label>
                  <button type="button"
                    class="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                    :disabled="planesForm.length === 1"
                    @click="quitarPlan(idx)">
                    <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12"/>
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <template #footer="{ close }">
        <button class="text-sm text-slate-600 dark:text-slate-300 px-4 py-2 rounded-xl border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors" @click="close">Cancelar</button>
        <button class="text-sm bg-primary-500 hover:bg-primary-600 text-white px-5 py-2 rounded-xl font-semibold disabled:opacity-60 transition-all shadow-sm hover:shadow-glow" :disabled="saving" @click="guardar">
          {{ saving ? 'Guardando...' : editando ? 'Guardar cambios' : 'Crear aseguradora' }}
        </button>
      </template>
    </AppModal>

    <!-- ── Modal eliminar ────────────────────────────────────────────────────── -->
    <AppModal v-model="showEliminar" title="Desactivar aseguradora" size="sm">
      <p class="text-sm text-slate-700 dark:text-slate-300">
        ¿Desactivar <strong class="text-slate-900 dark:text-white">{{ asegAEliminar?.nombre }}</strong> y todos sus planes?
        No se eliminarán, solo dejarán de mostrarse.
      </p>
      <template #footer>
        <button class="text-sm text-slate-600 dark:text-slate-300 px-4 py-2 rounded-xl border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors" @click="showEliminar = false">Cancelar</button>
        <button class="text-sm bg-red-500 hover:bg-red-600 text-white px-5 py-2 rounded-xl font-semibold disabled:opacity-60 transition-colors" :disabled="eliminando" @click="confirmarEliminar">
          {{ eliminando ? 'Desactivando...' : 'Desactivar' }}
        </button>
      </template>
    </AppModal>

  </div>
</template>
