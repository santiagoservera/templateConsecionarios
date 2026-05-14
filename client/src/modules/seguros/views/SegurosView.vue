<script setup>
import { ref, computed, onMounted } from 'vue'
import { usePermisos } from '../../../shared/composables/usePermisos.js'
import { useSeguros } from '../composables/useSeguros.js'
import { useToast } from '../../../shared/composables/useToast.js'
import AppModal from '../../../shared/components/AppModal.vue'
import AppSelect from '../../../shared/components/AppSelect.vue'
import { date, currency } from '../../../shared/utils/format.js'

const toast     = useToast()
const { canDo } = usePermisos()
const { seguros, loading, error, fetchSeguros, createSeguro, updateSeguro, deleteSeguro } = useSeguros()

const canManage = computed(() => canDo('seguros', 'editar'))

onMounted(fetchSeguros)

const TIPOS = ['RESPONSABILIDAD_CIVIL','TERCEROS_COMPLETO','TODO_RIESGO','OTRO']
const LABEL_TIPO = { RESPONSABILIDAD_CIVIL:'Resp. Civil', TERCEROS_COMPLETO:'Terceros Completo', TODO_RIESGO:'Todo Riesgo', OTRO:'Otro' }
const ESTADO_STYLE = { VIGENTE:'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400', VENCIDO:'bg-red-500/15 text-red-700 dark:text-red-400', CANCELADO:'bg-slate-100 text-slate-500 dark:text-slate-400' }

const tipoOptions = computed(() => TIPOS.map(t => ({ value: t, label: LABEL_TIPO[t] })))
const estadoOptions = [
  { value: 'VIGENTE', label: 'Vigente' },
  { value: 'VENCIDO', label: 'Vencido' },
  { value: 'CANCELADO', label: 'Cancelado' },
]

// ── Modal ──────────────────────────────────────────────────────────────────────
const showModal  = ref(false)
const editando   = ref(null)
const saving     = ref(false)
const modalError = ref('')

const form = ref({ aseguradora: '', numeroPoliza: '', tipoCobertura: 'TODO_RIESGO', vigenciaDesde: '', vigenciaHasta: '', monto: '', urlDocumento: '', observaciones: '' })

function abrirCrear() {
  editando.value = null
  form.value = { aseguradora:'', numeroPoliza:'', tipoCobertura:'TODO_RIESGO', vigenciaDesde:'', vigenciaHasta:'', monto:'', urlDocumento:'', observaciones:'' }
  modalError.value = ''; showModal.value = true
}

function abrirEditar(s) {
  editando.value = s
  form.value = {
    aseguradora:   s.aseguradora,
    numeroPoliza:  s.numeroPoliza,
    tipoCobertura: s.tipoCobertura,
    vigenciaDesde: new Date(s.vigenciaDesde).toISOString().slice(0,10),
    vigenciaHasta: new Date(s.vigenciaHasta).toISOString().slice(0,10),
    monto:         s.monto ? Number(s.monto) : '',
    urlDocumento:  s.urlDocumento ?? '',
    observaciones: s.observaciones ?? '',
  }
  modalError.value = ''; showModal.value = true
}

async function guardar() {
  if (!form.value.aseguradora || !form.value.numeroPoliza || !form.value.vigenciaDesde || !form.value.vigenciaHasta) {
    modalError.value = 'Completá los campos requeridos'; return
  }
  saving.value = true; modalError.value = ''
  try {
    const payload = {
      aseguradora:   form.value.aseguradora.trim(),
      tipoCobertura: form.value.tipoCobertura,
      vigenciaDesde: new Date(form.value.vigenciaDesde).toISOString(),
      vigenciaHasta: new Date(form.value.vigenciaHasta).toISOString(),
      monto:         form.value.monto ? Number(form.value.monto) : undefined,
      urlDocumento:  form.value.urlDocumento.trim() || undefined,
      observaciones: form.value.observaciones.trim() || undefined,
    }
    if (editando.value) {
      await updateSeguro(editando.value.id, payload)
      toast.success('Actualizado', 'Seguro actualizado')
    } else {
      await createSeguro({ ...payload, numeroPoliza: form.value.numeroPoliza.trim() })
      toast.success('Creado', 'Seguro registrado')
    }
    showModal.value = false
    fetchSeguros()
  } catch (err) { modalError.value = err.response?.data?.error ?? 'Error al guardar' }
  finally { saving.value = false }
}

async function eliminar(s) {
  if (!confirm(`¿Eliminar el seguro ${s.numeroPoliza}?`)) return
  try { await deleteSeguro(s.id); toast.success('Eliminado', s.numeroPoliza); fetchSeguros() }
  catch (err) { toast.error('Error', err.response?.data?.error ?? 'No se pudo eliminar') }
}

const inputCls = 'w-full rounded-xl border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 text-sm focus:border-primary-500 focus:ring-primary-500'
</script>

<template>
  <div class="p-6 space-y-5 animate-fade-in">

    <div class="flex items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold text-slate-900 dark:text-white">Seguros</h1>
        <p class="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Pólizas de seguro del concesionario.</p>
      </div>
      <button v-if="canManage"
        class="inline-flex items-center gap-2 bg-primary-500 hover:bg-primary-600 text-white text-sm font-semibold px-4 py-2.5 rounded-xl shadow-sm hover:shadow-glow active:scale-[0.98]"
        @click="abrirCrear">
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15"/></svg>
        Nueva póliza
      </button>
    </div>

    <div v-if="error" class="rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 px-4 py-3 text-sm text-red-700 dark:text-red-400">{{ error }}</div>
    <div v-if="loading" class="flex justify-center py-16"><svg class="w-8 h-8 animate-spin text-primary-500" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg></div>

    <div v-else-if="!seguros.length" class="text-center py-20 bg-white dark:bg-[#1a1a2e] rounded-2xl border border-slate-200 dark:border-white/10 shadow-card dark:shadow-none">
      <svg class="w-12 h-12 mx-auto mb-3 text-slate-200 dark:text-white/10" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z"/></svg>
      <p class="font-medium text-slate-500 dark:text-slate-400">Sin pólizas registradas</p>
    </div>

    <div v-else class="space-y-3">
      <div v-for="s in seguros" :key="s.id"
        class="bg-white dark:bg-[#1a1a2e] rounded-2xl border shadow-card dark:shadow-none p-5 transition-all"
        :class="s._vencido ? 'border-red-200 dark:border-red-500/30' : s.estado === 'VIGENTE' ? 'border-slate-200 dark:border-white/10' : 'border-slate-200 dark:border-white/10 opacity-60'">

        <div class="flex items-start justify-between gap-4">
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 flex-wrap mb-1">
              <h3 class="text-sm font-bold text-slate-900 dark:text-white">{{ s.aseguradora }}</h3>
              <span class="text-[10px] font-semibold px-2 py-0.5 rounded-full" :class="ESTADO_STYLE[s._vencido ? 'VENCIDO' : s.estado]">
                {{ s._vencido ? 'VENCIDO' : s.estado }}
              </span>
              <span class="text-[10px] text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-white/5 px-2 py-0.5 rounded-md">{{ LABEL_TIPO[s.tipoCobertura] }}</span>
            </div>
            <p class="text-xs text-slate-500 dark:text-slate-400">Póliza: <span class="font-mono">{{ s.numeroPoliza }}</span></p>
            <div class="flex flex-wrap gap-4 mt-2 text-xs text-slate-500 dark:text-slate-400">
              <span>Desde {{ date(s.vigenciaDesde) }}</span>
              <span>Hasta {{ date(s.vigenciaHasta) }}</span>
              <span v-if="!s._vencido" :class="s._diasRestantes <= 30 ? 'text-amber-600 dark:text-amber-400 font-semibold' : ''">
                {{ s._diasRestantes }} días restantes
              </span>
              <span v-if="s.monto" class="font-mono text-slate-700 dark:text-slate-300">{{ currency(s.monto) }}/año</span>
            </div>
            <p v-if="s.observaciones" class="text-xs text-slate-400 dark:text-slate-500 mt-1.5 italic">{{ s.observaciones }}</p>
          </div>

          <div class="flex items-center gap-2 shrink-0">
            <a v-if="s.urlDocumento" :href="s.urlDocumento" target="_blank"
              class="text-xs font-semibold text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-500/10 hover:bg-primary-100 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1">
              <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z"/></svg>
              Ver PDF
            </a>
            <button v-if="canManage" class="text-xs font-semibold text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-500/10 hover:bg-primary-100 px-3 py-1.5 rounded-lg transition-colors" @click="abrirEditar(s)">Editar</button>
            <button v-if="canDo('seguros','eliminar')" class="text-xs font-semibold text-red-500 bg-red-50 dark:bg-red-500/10 hover:bg-red-100 px-3 py-1.5 rounded-lg transition-colors" @click="eliminar(s)">Eliminar</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal seguro -->
    <AppModal v-model="showModal" :title="editando ? 'Editar póliza' : 'Nueva póliza'" size="md">
      <div class="space-y-4">
        <p v-if="modalError" class="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl px-3 py-2">{{ modalError }}</p>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Aseguradora *</label>
            <input v-model="form.aseguradora" type="text" placeholder="Ej: SANCOR, ZURICH..." :class="inputCls"/>
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Número de póliza *</label>
            <input v-model="form.numeroPoliza" type="text" :disabled="!!editando" :class="inputCls + (editando ? ' opacity-50' : '')"/>
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Tipo de cobertura</label>
            <AppSelect v-model="form.tipoCobertura" :options="tipoOptions"/>
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Prima anual</label>
            <input v-model.number="form.monto" type="number" min="0" placeholder="Opcional" :class="inputCls"/>
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Vigencia desde *</label>
            <input v-model="form.vigenciaDesde" type="date" :class="inputCls"/>
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Vigencia hasta *</label>
            <input v-model="form.vigenciaHasta" type="date" :class="inputCls"/>
          </div>
          <div class="col-span-2">
            <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">URL del documento (PDF)</label>
            <input v-model="form.urlDocumento" type="url" placeholder="https://..." :class="inputCls"/>
            <p class="text-xs text-slate-400 dark:text-slate-500 mt-1">Subí el PDF a Cloudinary y pegá la URL aquí.</p>
          </div>
          <div class="col-span-2">
            <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Observaciones</label>
            <textarea v-model="form.observaciones" rows="2" :class="inputCls + ' resize-none'"/>
          </div>
        </div>
      </div>
      <template #footer="{ close }">
        <button class="text-sm text-slate-600 dark:text-slate-300 px-4 py-2 rounded-xl border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors" @click="close">Cancelar</button>
        <button class="text-sm bg-primary-500 hover:bg-primary-600 text-white px-5 py-2 rounded-xl font-semibold disabled:opacity-60 transition-all shadow-sm" :disabled="saving" @click="guardar">
          {{ saving ? 'Guardando...' : editando ? 'Guardar cambios' : 'Registrar póliza' }}
        </button>
      </template>
    </AppModal>

  </div>
</template>
