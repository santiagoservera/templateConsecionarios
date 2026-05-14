<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { usePostventa } from '../composables/usePostventa.js'
import AppBadge from '../../../shared/components/AppBadge.vue'
import { date as formatDate } from '../../../shared/utils/format.js'

const route  = useRoute()
const router = useRouter()
const { caso, loading, error, fetchCaso, updateCaso } = usePostventa()

onMounted(() => fetchCaso(route.params.id))

const changingEstado = ref(false)
const estadoError    = ref('')

const FLUJO_ESTADO = { ABIERTO: 'EN_GESTION', EN_GESTION: 'CERRADO' }
const LABEL_ACCION = { ABIERTO: 'Tomar en gestión', EN_GESTION: 'Cerrar caso' }

const siguienteEstado = computed(() => caso.value ? FLUJO_ESTADO[caso.value.estado] : null)

async function avanzarEstado() {
  if (!siguienteEstado.value) return
  changingEstado.value = true
  estadoError.value    = ''
  try {
    await updateCaso(route.params.id, { estado: siguienteEstado.value })
    await fetchCaso(route.params.id)
  } catch (err) {
    estadoError.value = err.response?.data?.error ?? 'Error al actualizar estado'
  } finally {
    changingEstado.value = false
  }
}

const editingDesc  = ref(false)
const descForm     = ref('')
const savingDesc   = ref(false)
const descError    = ref('')

function startEditDesc() {
  descForm.value = caso.value?.descripcion ?? ''
  editingDesc.value = true
}

async function saveDesc() {
  if (!descForm.value.trim()) { descError.value = 'La descripción no puede estar vacía'; return }
  savingDesc.value = true
  descError.value  = ''
  try {
    await updateCaso(route.params.id, { descripcion: descForm.value })
    await fetchCaso(route.params.id)
    editingDesc.value = false
  } catch (err) {
    descError.value = err.response?.data?.error ?? 'Error al guardar'
  } finally {
    savingDesc.value = false
  }
}

const LABEL_TIPO   = { GARANTIA: 'Garantía', RECLAMO: 'Reclamo', CONSULTA: 'Consulta', SEGUIMIENTO: 'Seguimiento' }
const LABEL_ESTADO = { ABIERTO: 'Abierto', EN_GESTION: 'En gestión', CERRADO: 'Cerrado' }
</script>

<template>
  <div class="p-6 max-w-3xl mx-auto space-y-5">

    <!-- Volver -->
    <button
      class="inline-flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
      @click="router.push('/postventa')"
    >
      <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
      </svg>
      Volver al listado
    </button>

    <!-- Loading -->
    <div v-if="loading" class="flex justify-center py-16">
      <svg class="w-8 h-8 animate-spin text-primary-600" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
      </svg>
    </div>

    <div v-else-if="error" class="rounded-lg bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 px-4 py-3 text-sm text-red-700 dark:text-red-400">{{ error }}</div>

    <template v-else-if="caso">

      <!-- Encabezado del caso -->
      <div class="bg-white dark:bg-[#1a1a2e] rounded-xl border border-slate-200 dark:border-white/5 p-6">
        <div class="flex items-start justify-between gap-4">
          <div>
            <div class="flex items-center gap-2 mb-1">
              <AppBadge :value="caso.tipo" :label="LABEL_TIPO[caso.tipo]" />
              <AppBadge :value="caso.estado" :label="LABEL_ESTADO[caso.estado]" />
            </div>
            <h1 class="text-xl font-bold text-slate-800 dark:text-white mt-2">
              Caso #{{ caso.id }} — {{ caso.cliente?.nombre }} {{ caso.cliente?.apellido }}
            </h1>
            <p class="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              {{ caso.venta?.vehiculo ? `${caso.venta.vehiculo.marca} ${caso.venta.vehiculo.modelo} ${caso.venta.vehiculo.anio}` : '—' }}
            </p>
          </div>

          <!-- Botón de avance de estado -->
          <button
            v-if="siguienteEstado"
            class="flex-shrink-0 inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors disabled:opacity-60"
            :disabled="changingEstado"
            @click="avanzarEstado"
          >
            {{ changingEstado ? 'Actualizando...' : LABEL_ACCION[caso.estado] }}
          </button>
        </div>

        <p v-if="estadoError" class="mt-3 text-xs text-red-600 dark:text-red-400">{{ estadoError }}</p>
      </div>

      <!-- Datos del caso -->
      <div class="bg-white dark:bg-[#1a1a2e] rounded-xl border border-slate-200 dark:border-white/5 p-6 space-y-4">
        <h2 class="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide">Información del caso</h2>

        <dl class="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
          <div>
            <dt class="text-slate-500 dark:text-slate-400">Cliente</dt>
            <dd class="font-medium text-slate-800 dark:text-white">{{ caso.cliente?.nombre }} {{ caso.cliente?.apellido }}</dd>
          </div>
          <div>
            <dt class="text-slate-500 dark:text-slate-400">Teléfono</dt>
            <dd class="font-medium text-slate-800 dark:text-white">{{ caso.cliente?.telefono ?? '—' }}</dd>
          </div>
          <div>
            <dt class="text-slate-500 dark:text-slate-400">Fecha de contacto</dt>
            <dd class="font-medium text-slate-800 dark:text-white">{{ formatDate(caso.fechaContacto) }}</dd>
          </div>
          <div>
            <dt class="text-slate-500 dark:text-slate-400">Fecha de resolución</dt>
            <dd class="font-medium text-slate-800 dark:text-white">{{ caso.fechaResolucion ? formatDate(caso.fechaResolucion) : '—' }}</dd>
          </div>
          <div>
            <dt class="text-slate-500 dark:text-slate-400">Asesor</dt>
            <dd class="font-medium text-slate-800 dark:text-white">{{ caso.usuario?.nombre ?? '—' }}</dd>
          </div>
          <div>
            <dt class="text-slate-500 dark:text-slate-400">Venta</dt>
            <dd class="font-medium text-slate-800 dark:text-white">#{{ caso.ventaId }}</dd>
          </div>
        </dl>
      </div>

      <!-- Descripción / Notas -->
      <div class="bg-white dark:bg-[#1a1a2e] rounded-xl border border-slate-200 dark:border-white/5 p-6 space-y-3">
        <div class="flex items-center justify-between">
          <h2 class="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide">Descripción</h2>
          <button
            v-if="!editingDesc && caso.estado !== 'CERRADO'"
            class="text-xs text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-300 font-medium"
            @click="startEditDesc"
          >
            Editar
          </button>
        </div>

        <!-- Edición -->
        <template v-if="editingDesc">
          <p v-if="descError" class="text-xs text-red-600 dark:text-red-400">{{ descError }}</p>
          <textarea
            v-model="descForm"
            rows="4"
            class="w-full rounded-lg border-slate-300 dark:border-white/10 bg-white dark:bg-white/5 text-slate-900 dark:text-white text-sm focus:border-primary-500 focus:ring-primary-500"
          />
          <div class="flex justify-end gap-2">
            <button
              class="text-sm text-slate-600 dark:text-slate-300 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
              @click="editingDesc = false"
            >
              Cancelar
            </button>
            <button
              class="text-sm bg-primary-600 hover:bg-primary-700 text-white px-4 py-1.5 rounded-lg font-medium disabled:opacity-60"
              :disabled="savingDesc"
              @click="saveDesc"
            >
              {{ savingDesc ? 'Guardando...' : 'Guardar' }}
            </button>
          </div>
        </template>

        <!-- Vista -->
        <p v-else class="text-sm text-slate-700 dark:text-slate-200 whitespace-pre-wrap">{{ caso.descripcion }}</p>
      </div>

    </template>
  </div>
</template>
