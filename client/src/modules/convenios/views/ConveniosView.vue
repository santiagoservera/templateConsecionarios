<script setup>
import { ref, computed, onMounted } from 'vue'
import { useConvenios } from '../composables/useConvenios.js'
import { useToast } from '../../../shared/composables/useToast.js'
import AppModal from '../../../shared/components/AppModal.vue'

const toast = useToast()
const { convenios, loading, error, fetchConvenios, createConvenio, updateConvenio, removeConvenio, upsertPlanes } = useConvenios()

onMounted(() => fetchConvenios(false)) // carga todos, activos e inactivos

// ── Modal banco ────────────────────────────────────────────────────────────────
const showModalBanco  = ref(false)
const editandoBanco   = ref(null)
const savingBanco     = ref(false)
const bancoError      = ref('')

const formBanco = ref({ nombre: '', descripcion: '' })

const planesForm = ref([{ cantCuotas: 12, tasaInteres: 0, activo: true }])

function abrirCrearBanco() {
  editandoBanco.value = null
  formBanco.value     = { nombre: '', descripcion: '' }
  planesForm.value    = [{ cantCuotas: 12, tasaInteres: 0, activo: true }]
  bancoError.value    = ''
  showModalBanco.value = true
}

function abrirEditarBanco(banco) {
  editandoBanco.value = banco
  formBanco.value     = { nombre: banco.nombre, descripcion: banco.descripcion ?? '' }
  planesForm.value    = banco.planes.length
    ? banco.planes.map(p => ({ cantCuotas: p.cantCuotas, tasaInteres: Number(p.tasaInteres), activo: p.activo }))
    : [{ cantCuotas: 12, tasaInteres: 0, activo: true }]
  bancoError.value    = ''
  showModalBanco.value = true
}

function agregarPlan() {
  planesForm.value.push({ cantCuotas: 12, tasaInteres: 0, activo: true })
}

function quitarPlan(idx) {
  if (planesForm.value.length > 1) planesForm.value.splice(idx, 1)
}

async function guardarBanco() {
  if (!formBanco.value.nombre.trim()) { bancoError.value = 'El nombre del banco es requerido'; return }
  if (!planesForm.value.length)        { bancoError.value = 'Agregá al menos un plan de cuotas'; return }

  savingBanco.value = true
  bancoError.value  = ''
  try {
    const planes = planesForm.value.map(p => ({
      cantCuotas:  Number(p.cantCuotas),
      tasaInteres: Number(p.tasaInteres),
      activo:      p.activo,
    }))

    if (editandoBanco.value) {
      await updateConvenio(editandoBanco.value.id, {
        nombre:      formBanco.value.nombre.trim(),
        descripcion: formBanco.value.descripcion.trim() || undefined,
      })
      await upsertPlanes(editandoBanco.value.id, planes)
      toast.success('Actualizado', `Convenio con ${formBanco.value.nombre} actualizado`)
    } else {
      await createConvenio({
        nombre:      formBanco.value.nombre.trim(),
        descripcion: formBanco.value.descripcion.trim() || undefined,
        planes,
      })
      toast.success('Creado', `Convenio con ${formBanco.value.nombre} creado`)
    }
    showModalBanco.value = false
    fetchConvenios(false)
  } catch (err) {
    bancoError.value = err.response?.data?.error ?? 'Error al guardar'
  } finally {
    savingBanco.value = false
  }
}

// ── Toggle activo/inactivo ─────────────────────────────────────────────────────
async function toggleActivo(banco) {
  try {
    await updateConvenio(banco.id, { activo: !banco.activo })
    toast.success(banco.activo ? 'Desactivado' : 'Activado', banco.nombre)
    fetchConvenios(false)
  } catch {
    toast.error('Error', 'No se pudo cambiar el estado')
  }
}

// ── Eliminar ───────────────────────────────────────────────────────────────────
const bancoAEliminar  = ref(null)
const eliminando      = ref(false)
const showEliminar    = computed({
  get: () => !!bancoAEliminar.value,
  set: (v) => { if (!v) bancoAEliminar.value = null },
})

async function confirmarEliminar() {
  eliminando.value = true
  try {
    await removeConvenio(bancoAEliminar.value.id)
    toast.success('Desactivado', bancoAEliminar.value.nombre)
    bancoAEliminar.value = null
    fetchConvenios(false)
  } catch (err) {
    toast.error('Error', err.response?.data?.error ?? 'No se pudo eliminar')
  } finally {
    eliminando.value = false
  }
}
</script>

<template>
  <div class="p-6 space-y-6 animate-fade-in">

    <!-- Encabezado -->
    <div class="flex items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold text-slate-900 dark:text-white">Convenios con bancos</h1>
        <p class="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
          Configurá las tasas por banco y cantidad de cuotas para el financiamiento de ventas.
        </p>
      </div>
      <button
        class="inline-flex items-center gap-2 bg-primary-500 hover:bg-primary-600 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-all shadow-sm hover:shadow-glow active:scale-[0.98] shrink-0"
        @click="abrirCrearBanco"
      >
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15"/>
        </svg>
        Nuevo banco
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
    <div v-else-if="!convenios.length" class="text-center py-20 bg-white dark:bg-[#1a1a2e] rounded-2xl border border-slate-200 dark:border-white/10 shadow-card dark:shadow-none">
      <svg class="w-12 h-12 mx-auto mb-3 text-slate-200 dark:text-white/10" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1">
        <path stroke-linecap="round" stroke-linejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0 0 12 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75Z"/>
      </svg>
      <p class="font-medium text-slate-500 dark:text-slate-400">Sin convenios configurados</p>
      <p class="text-sm mt-1 text-slate-400 dark:text-slate-500">Agregá un banco para comenzar.</p>
    </div>

    <!-- Lista de bancos -->
    <div v-else class="space-y-4">
      <div
        v-for="banco in convenios"
        :key="banco.id"
        class="bg-white dark:bg-[#1a1a2e] rounded-2xl border shadow-card dark:shadow-none overflow-hidden transition-all"
        :class="banco.activo
          ? 'border-slate-200 dark:border-white/10'
          : 'border-slate-200 dark:border-white/10 opacity-60'"
      >
        <!-- Header banco -->
        <div class="px-5 py-4 flex items-center justify-between gap-4 border-b border-slate-200 dark:border-white/10">
          <div class="flex items-center gap-3 min-w-0">
            <!-- Ícono banco -->
            <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shrink-0 shadow-sm">
              <svg class="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0 0 12 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75Z"/>
              </svg>
            </div>
            <div class="min-w-0">
              <div class="flex items-center gap-2">
                <h3 class="text-sm font-bold text-slate-900 dark:text-white">{{ banco.nombre }}</h3>
                <span v-if="!banco.activo" class="text-[10px] font-semibold text-slate-400 bg-slate-100 dark:bg-white/10 px-2 py-0.5 rounded-full">Inactivo</span>
              </div>
              <p v-if="banco.descripcion" class="text-xs text-slate-400 dark:text-slate-500 truncate mt-0.5">{{ banco.descripcion }}</p>
              <p class="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                <span class="font-semibold font-mono text-slate-600 dark:text-slate-300">{{ banco.planes.length }}</span>
                plan{{ banco.planes.length !== 1 ? 'es' : '' }} configurado{{ banco.planes.length !== 1 ? 's' : '' }}
              </p>
            </div>
          </div>

          <!-- Acciones -->
          <div class="flex items-center gap-2 shrink-0">
            <button
              class="text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
              :class="banco.activo
                ? 'text-slate-500 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 dark:text-slate-400 dark:bg-white/5 dark:hover:bg-white/10'
                : 'text-emerald-600 bg-emerald-50 hover:bg-emerald-100 dark:text-emerald-400 dark:bg-emerald-500/10'"
              @click="toggleActivo(banco)"
            >
              {{ banco.activo ? 'Desactivar' : 'Activar' }}
            </button>
            <button
              class="text-xs font-semibold text-primary-600 hover:text-primary-700 bg-primary-50 hover:bg-primary-100 dark:text-primary-400 dark:bg-primary-500/10 px-3 py-1.5 rounded-lg transition-colors"
              @click="abrirEditarBanco(banco)"
            >
              Editar
            </button>
            <button
              class="text-xs font-semibold text-red-500 dark:text-red-400 hover:text-red-600 bg-red-50 hover:bg-red-100 dark:bg-red-500/10 dark:hover:bg-red-500/20 px-3 py-1.5 rounded-lg transition-colors"
              @click="bancoAEliminar = banco"
            >
              Eliminar
            </button>
          </div>
        </div>

        <!-- Tabla de planes -->
        <div class="px-5 py-3">
          <div v-if="!banco.planes.length" class="text-xs text-slate-400 dark:text-slate-500 italic py-2">Sin planes activos.</div>
          <div v-else class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
            <div
              v-for="plan in banco.planes"
              :key="plan.id"
              class="text-center rounded-xl border py-3 px-2"
              :class="plan.activo
                ? 'bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10'
                : 'bg-slate-50/50 dark:bg-white/[0.02] border-dashed border-slate-200 dark:border-white/5 opacity-50'"
            >
              <p class="text-2xl font-bold font-mono text-slate-900 dark:text-white leading-none">{{ plan.cantCuotas }}</p>
              <p class="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">cuotas</p>
              <p class="text-sm font-semibold text-primary-600 dark:text-primary-400 mt-1.5 font-mono">{{ Number(plan.tasaInteres).toFixed(2) }}%</p>
              <p class="text-[10px] text-slate-400 dark:text-slate-500">TNA</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ══════════════════ MODAL BANCO ══════════════════ -->
    <AppModal v-model="showModalBanco" :title="editandoBanco ? `Editar — ${editandoBanco.nombre}` : 'Nuevo convenio'" size="lg">
      <div class="space-y-5">
        <p v-if="bancoError" class="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl px-4 py-3">{{ bancoError }}</p>

        <div class="grid grid-cols-2 gap-4">
          <div class="col-span-2 sm:col-span-1">
            <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Nombre del banco *</label>
            <input
              v-model="formBanco.nombre"
              type="text"
              placeholder="Ej: Banco Nación"
              class="w-full rounded-xl border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 text-sm focus:border-primary-500 focus:ring-primary-500"
            />
          </div>
          <div class="col-span-2 sm:col-span-1">
            <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Descripción</label>
            <input
              v-model="formBanco.descripcion"
              type="text"
              placeholder="Descripción opcional..."
              class="w-full rounded-xl border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 text-sm focus:border-primary-500 focus:ring-primary-500"
            />
          </div>
        </div>

        <!-- Planes -->
        <div>
          <div class="flex items-center justify-between mb-3">
            <label class="text-sm font-medium text-slate-700 dark:text-slate-300">
              Planes de cuotas *
              <span class="text-xs font-normal text-slate-400 ml-1">(cantidad de cuotas → tasa anual)</span>
            </label>
            <button
              type="button"
              class="inline-flex items-center gap-1.5 text-xs font-semibold text-primary-600 hover:text-primary-700 bg-primary-50 hover:bg-primary-100 dark:bg-primary-500/10 px-3 py-1.5 rounded-lg transition-colors"
              @click="agregarPlan"
            >
              <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15"/>
              </svg>
              Agregar plan
            </button>
          </div>

          <div class="space-y-2">
            <div
              v-for="(plan, idx) in planesForm"
              :key="idx"
              class="flex items-center gap-3 bg-slate-50 dark:bg-white/3 rounded-xl px-4 py-3 border border-slate-200 dark:border-white/5"
            >
              <div class="flex-1 grid grid-cols-2 gap-3">
                <div>
                  <label class="block text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">Cuotas</label>
                  <input
                    v-model.number="plan.cantCuotas"
                    type="number" min="1"
                    class="w-full rounded-lg border-slate-200 dark:border-white/10 bg-white dark:bg-[#1a1a2e] text-slate-900 dark:text-white text-sm focus:border-primary-500 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label class="block text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">Tasa anual (%)</label>
                  <input
                    v-model.number="plan.tasaInteres"
                    type="number" min="0" step="0.01"
                    class="w-full rounded-lg border-slate-200 dark:border-white/10 bg-white dark:bg-[#1a1a2e] text-slate-900 dark:text-white text-sm focus:border-primary-500 focus:ring-primary-500"
                  />
                </div>
              </div>

              <!-- Toggle activo -->
              <label class="flex items-center gap-1.5 cursor-pointer shrink-0">
                <input type="checkbox" v-model="plan.activo" class="rounded border-slate-300 text-primary-500 focus:ring-primary-500"/>
                <span class="text-xs text-slate-500 dark:text-slate-400">Activo</span>
              </label>

              <!-- Quitar -->
              <button
                type="button"
                class="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors shrink-0"
                :disabled="planesForm.length === 1"
                @click="quitarPlan(idx)"
              >
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      <template #footer="{ close }">
        <button class="text-sm text-slate-600 dark:text-slate-300 px-4 py-2 rounded-xl border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors" @click="close">Cancelar</button>
        <button
          class="text-sm bg-primary-500 hover:bg-primary-600 text-white px-5 py-2 rounded-xl font-semibold disabled:opacity-60 transition-all shadow-sm hover:shadow-glow"
          :disabled="savingBanco"
          @click="guardarBanco"
        >
          {{ savingBanco ? 'Guardando...' : editandoBanco ? 'Guardar cambios' : 'Crear convenio' }}
        </button>
      </template>
    </AppModal>

    <!-- Modal eliminar -->
    <AppModal v-model="showEliminar" title="Desactivar convenio" size="sm">
      <p class="text-sm text-slate-700 dark:text-slate-300">
        ¿Desactivar el convenio con <strong class="text-slate-900 dark:text-white">{{ bancoAEliminar?.nombre }}</strong>?
        No estará disponible en nuevas ventas.
      </p>
      <template #footer>
        <button class="text-sm text-slate-600 px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors" @click="showEliminar = false">Cancelar</button>
        <button class="text-sm bg-red-500 hover:bg-red-600 text-white px-5 py-2 rounded-xl font-semibold disabled:opacity-60 transition-colors" :disabled="eliminando" @click="confirmarEliminar">
          {{ eliminando ? 'Desactivando...' : 'Desactivar' }}
        </button>
      </template>
    </AppModal>

  </div>
</template>
