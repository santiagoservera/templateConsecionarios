<script setup>
/**
 * Modal de importación masiva desde Excel.
 * Props:
 *   type: 'vehiculos' | 'indumentaria'
 * Emits:
 *   done: cuando se importó al menos 1 registro (para recargar la lista)
 */
import { ref, computed } from 'vue'
import * as XLSX from 'xlsx'
import api from '../../plugins/axios.js'
import AppModal from './AppModal.vue'

const props = defineProps({
  modelValue: { type: Boolean, required: true },
  type:       { type: String, required: true }, // 'vehiculos' | 'indumentaria'
})
const emit = defineEmits(['update:modelValue', 'done'])
const close = () => emit('update:modelValue', false)

// ── Configuración por tipo ─────────────────────────────────────────────────────
const CONFIG = {
  vehiculos: {
    title:    'Importar vehículos',
    endpoint: '/vehiculos/import',
    columns: [
      { key: 'tipo',        label: 'Tipo',         required: true,  hint: 'AUTO o MOTO' },
      { key: 'marca',       label: 'Marca',        required: true,  hint: 'Toyota, Ford...' },
      { key: 'modelo',      label: 'Modelo',       required: true,  hint: 'Corolla, Focus...' },
      { key: 'anio',        label: 'Año',          required: true,  hint: '2024' },
      { key: 'tipoStock',   label: 'Tipo Stock',   required: true,  hint: 'NUEVO, USADO o CONSIGNACION' },
      { key: 'precioCosto', label: 'Precio Costo', required: true,  hint: '15000000' },
      { key: 'precioVenta', label: 'Precio Venta', required: true,  hint: '18000000' },
      { key: 'version',     label: 'Versión',      required: false, hint: 'XEI CVT' },
      { key: 'color',       label: 'Color',        required: false, hint: 'Blanco' },
      { key: 'km',          label: 'Kilometraje',  required: false, hint: '0' },
      { key: 'patente',     label: 'Patente',      required: false, hint: 'AA123BB' },
      { key: 'combustible', label: 'Combustible',  required: false, hint: 'Nafta' },
      { key: 'transmision', label: 'Transmisión',  required: false, hint: 'Automática' },
      { key: 'precioMinimo',label: 'Precio Mínimo',required: false, hint: '17000000' },
    ],
  },
  indumentaria: {
    title:    'Importar indumentaria',
    endpoint: '/indumentaria/import',
    columns: [
      { key: 'nombre',      label: 'Nombre',       required: true,  hint: 'Campera Ford Racing' },
      { key: 'precioCosto', label: 'Precio Costo', required: true,  hint: '8500' },
      { key: 'precioVenta', label: 'Precio Venta', required: true,  hint: '14000' },
      { key: 'categoria',   label: 'Categoría',    required: false, hint: 'Ropa, Accesorio, Calzado, Merchandising, Otro' },
      { key: 'talla',       label: 'Talla',        required: false, hint: 'XS, S, M, L, XL, XXL, UNICA' },
      { key: 'color',       label: 'Color',        required: false, hint: 'Negro' },
      { key: 'marca',       label: 'Marca',        required: false, hint: 'Ford' },
      { key: 'cantidad',    label: 'Cantidad',     required: false, hint: '5' },
      { key: 'descripcion', label: 'Descripción',  required: false, hint: 'Opcional' },
    ],
  },
}

const cfg = computed(() => CONFIG[props.type])

// ── Estado del wizard ──────────────────────────────────────────────────────────
// step: 'upload' | 'preview' | 'result'
const step      = ref('upload')
const isDragging = ref(false)
const rows       = ref([])   // filas parseadas del Excel
const rowErrors  = ref({})   // { [rowIndex]: ['error1', 'error2'] }
const importing  = ref(false)
const result     = ref(null) // { importados, errores }

function reset() {
  step.value      = 'upload'
  rows.value      = []
  rowErrors.value = {}
  result.value    = null
  importing.value = false
}

// ── Parse Excel ────────────────────────────────────────────────────────────────
function onFileInput(e) {
  const file = e.target.files?.[0]
  if (file) parseFile(file)
  e.target.value = '' // reset input
}

function onDrop(e) {
  isDragging.value = false
  const file = e.dataTransfer?.files?.[0]
  if (file) parseFile(file)
}

function parseFile(file) {
  const reader = new FileReader()
  reader.onload = (e) => {
    const wb = XLSX.read(e.target.result, { type: 'array' })
    const ws = wb.Sheets[wb.SheetNames[0]]
    const data = XLSX.utils.sheet_to_json(ws, { defval: '' })
    rows.value = data
    validateRows(data)
    step.value = 'preview'
  }
  reader.readAsArrayBuffer(file)
}

// ── Validación client-side (preview) ──────────────────────────────────────────
function validateRows(data) {
  const errs = {}
  data.forEach((row, i) => {
    const e = []
    cfg.value.columns.filter(c => c.required).forEach(col => {
      if (!row[col.label] && !row[col.key]) e.push(`${col.label} es requerido`)
    })
    if (e.length) errs[i] = e
  })
  rowErrors.value = errs
}

const validCount   = computed(() => rows.value.length - Object.keys(rowErrors.value).length)
const invalidCount = computed(() => Object.keys(rowErrors.value).length)

// ── Mapear columnas por label → key ───────────────────────────────────────────
function normalizeRow(row) {
  const out = {}
  cfg.value.columns.forEach(col => {
    // Acepta tanto el label en español como el key en inglés
    out[col.key] = row[col.label] ?? row[col.key] ?? ''
  })
  return out
}

// ── Importar ───────────────────────────────────────────────────────────────────
async function importar() {
  importing.value = true
  try {
    const payload = rows.value
      .filter((_, i) => !rowErrors.value[i])
      .map(normalizeRow)

    const { data } = await api.post(cfg.value.endpoint, { rows: payload })
    result.value = data.data
    step.value   = 'result'
    if (result.value.importados > 0) emit('done')
  } catch (err) {
    result.value = { importados: 0, errores: [{ fila: '-', errores: [err.response?.data?.error ?? 'Error de servidor'] }] }
    step.value   = 'result'
  } finally {
    importing.value = false
  }
}

// ── Descargar template ─────────────────────────────────────────────────────────
function descargarTemplate() {
  const headers = cfg.value.columns.map(c => c.label)
  const example = Object.fromEntries(cfg.value.columns.map(c => [c.label, c.hint]))

  const ws = XLSX.utils.json_to_sheet([example])
  // Ancho de columnas
  ws['!cols'] = cfg.value.columns.map(c => ({ wch: Math.max(c.label.length, c.hint.length, 14) }))

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Template')
  XLSX.writeFile(wb, `template_${props.type}.xlsx`)
}
</script>

<template>
  <AppModal :model-value="modelValue" :title="cfg.title" size="lg" @update:model-value="$emit('update:modelValue', $event)">

    <!-- ── STEP 1: Upload ───────────────────────────────────────────────────── -->
    <div v-if="step === 'upload'" class="space-y-5">

      <!-- Info de columnas -->
      <div class="rounded-xl border border-slate-200 dark:border-white/10 overflow-hidden">
        <div class="bg-slate-50 dark:bg-white/5 px-4 py-2.5 flex items-center justify-between">
          <p class="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Columnas del Excel</p>
          <button
            class="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 border border-emerald-200 dark:border-emerald-500/20 px-3 py-1 rounded-lg transition-colors"
            @click="descargarTemplate"
          >
            <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3"/>
            </svg>
            Descargar template
          </button>
        </div>
        <div class="divide-y divide-slate-200 dark:divide-white/5 max-h-48 overflow-y-auto">
          <div v-for="col in cfg.columns" :key="col.key"
            class="flex items-center gap-3 px-4 py-2 text-xs"
          >
            <span class="font-semibold w-28 shrink-0 text-slate-700 dark:text-slate-200">{{ col.label }}</span>
            <span v-if="col.required" class="text-[10px] font-bold text-red-500 bg-red-50 dark:bg-red-500/10 px-1.5 py-0.5 rounded shrink-0">REQ</span>
            <span v-else class="text-[10px] text-slate-400 dark:text-slate-500 shrink-0">opcional</span>
            <span class="text-slate-400 dark:text-slate-500 italic truncate">{{ col.hint }}</span>
          </div>
        </div>
      </div>

      <!-- Drop zone -->
      <label
        class="block cursor-pointer"
        @dragover.prevent="isDragging = true"
        @dragleave="isDragging = false"
        @drop.prevent="onDrop"
      >
        <div
          class="rounded-2xl border-2 border-dashed transition-all py-10 px-6 text-center"
          :class="isDragging
            ? 'border-primary-400 bg-primary-50 dark:bg-primary-500/10'
            : 'border-slate-200 dark:border-white/10 hover:border-primary-300 dark:hover:border-primary-500/40 hover:bg-slate-50 dark:hover:bg-white/[0.02]'"
        >
          <svg class="w-10 h-10 mx-auto mb-3 text-slate-300 dark:text-white/20" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1">
            <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m6.75 12-3-3m0 0-3 3m3-3v6m-1.5-15H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z"/>
          </svg>
          <p class="text-sm font-semibold text-slate-600 dark:text-slate-300">
            Arrastrá tu archivo Excel aquí
          </p>
          <p class="text-xs text-slate-400 dark:text-slate-500 mt-1">o hacé clic para seleccionarlo (.xlsx, .xls)</p>
          <input type="file" accept=".xlsx,.xls,.csv" class="sr-only" @change="onFileInput" />
        </div>
      </label>
    </div>

    <!-- ── STEP 2: Preview ──────────────────────────────────────────────────── -->
    <div v-else-if="step === 'preview'" class="space-y-4">

      <!-- Resumen -->
      <div class="flex items-center gap-3">
        <div class="flex-1 flex items-center gap-2.5 px-4 py-3 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20">
          <svg class="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"/>
          </svg>
          <span class="text-sm font-semibold text-emerald-700 dark:text-emerald-300">{{ validCount }} válidas</span>
        </div>
        <div v-if="invalidCount" class="flex-1 flex items-center gap-2.5 px-4 py-3 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20">
          <svg class="w-4 h-4 text-red-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"/>
          </svg>
          <span class="text-sm font-semibold text-red-600 dark:text-red-400">{{ invalidCount }} con errores</span>
        </div>
      </div>

      <!-- Tabla de preview -->
      <div class="rounded-xl border border-slate-200 dark:border-white/10 overflow-auto max-h-72">
        <table class="w-full text-xs">
          <thead class="bg-slate-50 dark:bg-white/5 sticky top-0">
            <tr>
              <th class="px-3 py-2 text-left font-semibold text-slate-500 dark:text-slate-400 w-10">#</th>
              <th v-for="col in cfg.columns.slice(0, 6)" :key="col.key"
                class="px-3 py-2 text-left font-semibold text-slate-500 dark:text-slate-400 whitespace-nowrap">
                {{ col.label }}
              </th>
              <th class="px-3 py-2 text-left font-semibold text-slate-500 dark:text-slate-400">Estado</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-200 dark:divide-white/5">
            <tr v-for="(row, i) in rows" :key="i"
              :class="rowErrors[i] ? 'bg-red-50/50 dark:bg-red-500/5' : 'hover:bg-slate-50 dark:hover:bg-white/[0.02]'"
            >
              <td class="px-3 py-2 text-slate-400 dark:text-slate-500">{{ i + 2 }}</td>
              <td v-for="col in cfg.columns.slice(0, 6)" :key="col.key"
                class="px-3 py-2 text-slate-700 dark:text-slate-200 whitespace-nowrap max-w-[120px] truncate"
                :class="col.required && !row[col.label] && !row[col.key] ? 'text-red-500' : ''"
              >
                {{ row[col.label] ?? row[col.key] ?? '—' }}
              </td>
              <td class="px-3 py-2">
                <span v-if="!rowErrors[i]" class="text-emerald-600 dark:text-emerald-400 font-medium">✓ OK</span>
                <span v-else class="text-red-500 text-[10px]">{{ rowErrors[i].join(' · ') }}</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <p class="text-xs text-slate-400 dark:text-slate-500">
        Las filas con errores serán omitidas. Solo se importarán las {{ validCount }} filas válidas.
      </p>
    </div>

    <!-- ── STEP 3: Result ───────────────────────────────────────────────────── -->
    <div v-else-if="step === 'result'" class="space-y-4">
      <div class="text-center py-4">
        <div v-if="result.importados > 0"
          class="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-500/15 flex items-center justify-center mx-auto mb-3">
          <svg class="w-7 h-7 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"/>
          </svg>
        </div>
        <p class="text-lg font-bold text-slate-900 dark:text-white">
          {{ result.importados }} registro{{ result.importados !== 1 ? 's' : '' }} importado{{ result.importados !== 1 ? 's' : '' }}
        </p>
        <p v-if="result.errores?.length" class="text-sm text-slate-500 dark:text-slate-400 mt-1">
          {{ result.errores.length }} fila{{ result.errores.length !== 1 ? 's' : '' }} rechazada{{ result.errores.length !== 1 ? 's' : '' }} por el servidor
        </p>
      </div>

      <!-- Errores del servidor -->
      <div v-if="result.errores?.length" class="rounded-xl border border-red-200 dark:border-red-500/20 overflow-hidden">
        <div class="bg-red-50 dark:bg-red-500/10 px-4 py-2">
          <p class="text-xs font-semibold text-red-600 dark:text-red-400">Filas rechazadas</p>
        </div>
        <div class="divide-y divide-red-100 dark:divide-red-500/10 max-h-40 overflow-y-auto">
          <div v-for="err in result.errores" :key="err.fila" class="px-4 py-2 text-xs">
            <span class="font-semibold text-slate-600 dark:text-slate-300">Fila {{ err.fila }}:</span>
            <span class="text-red-600 dark:text-red-400 ml-1">{{ Array.isArray(err.errores) ? err.errores.join(' · ') : err.errores }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- ── Footer ───────────────────────────────────────────────────────────── -->
    <template #footer="{ close: closeModal }">
      <template v-if="step === 'upload'">
        <button class="text-sm text-slate-600 dark:text-slate-300 px-4 py-2 rounded-xl border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors" @click="closeModal">
          Cancelar
        </button>
      </template>

      <template v-else-if="step === 'preview'">
        <button class="text-sm text-slate-600 dark:text-slate-300 px-4 py-2 rounded-xl border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors" @click="reset">
          Volver
        </button>
        <button
          class="text-sm bg-primary-500 hover:bg-primary-600 text-white px-5 py-2 rounded-xl font-semibold disabled:opacity-60 transition-all shadow-sm hover:shadow-glow"
          :disabled="importing || validCount === 0"
          @click="importar"
        >
          {{ importing ? 'Importando...' : `Importar ${validCount} registro${validCount !== 1 ? 's' : ''}` }}
        </button>
      </template>

      <template v-else-if="step === 'result'">
        <button class="text-sm text-slate-600 dark:text-slate-300 px-4 py-2 rounded-xl border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors" @click="reset">
          Importar otro
        </button>
        <button class="text-sm bg-primary-500 hover:bg-primary-600 text-white px-5 py-2 rounded-xl font-semibold transition-all" @click="closeModal">
          Cerrar
        </button>
      </template>
    </template>

  </AppModal>
</template>
