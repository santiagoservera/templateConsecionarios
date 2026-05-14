<script setup>
import { ref, computed } from 'vue'
import { useVentaWizardStore } from '../store/ventaWizardStore.js'
import api from '../../../plugins/axios.js'

const wizard = useVentaWizardStore()

// ── Estado local del buscador ──────────────────────────────────────────────────
const todosClientes = ref([])     // cargados una sola vez al abrir
const query         = ref(wizard.cliente ? `${wizard.cliente.apellido}, ${wizard.cliente.nombre}` : '')
const open          = ref(false)
const loadingLocal  = ref(false)

// Filtra en memoria mientras el usuario escribe
const clientesFiltrados = computed(() => {
  if (!todosClientes.value.length) return []
  const q = query.value.trim().toLowerCase()
  if (!q) return todosClientes.value
  return todosClientes.value.filter((c) =>
    c.nombre.toLowerCase().includes(q) ||
    c.apellido.toLowerCase().includes(q) ||
    (c.dniCuit ?? '').includes(q)
  )
})

// Carga los clientes una sola vez (el backend filtra por vendedor si corresponde)
async function cargarClientes() {
  if (todosClientes.value.length) return
  loadingLocal.value = true
  try {
    const { data } = await api.get('/clientes', { params: { pageSize: 50 } })
    todosClientes.value = data.data ?? []
  } finally {
    loadingLocal.value = false
  }
}

function abrirDropdown() {
  open.value = true
  cargarClientes()
}

function cerrarDropdown() {
  // pequeño delay para permitir el click en el item
  setTimeout(() => { open.value = false }, 150)
}

function seleccionar(c) {
  wizard.cliente = c
  query.value    = `${c.apellido}, ${c.nombre}`
  open.value     = false
}

function limpiar() {
  wizard.cliente      = null
  query.value         = ''
  todosClientes.value = []
  open.value          = false
}
</script>

<template>
  <div class="space-y-4">
    <h2 class="text-lg font-semibold text-slate-900 dark:text-white">Seleccionar cliente</h2>

    <!-- Buscador -->
    <div class="relative">
      <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none"
        fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round"
          d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
      </svg>
      <input
        v-model="query"
        type="text"
        placeholder="Hacé clic para ver clientes o escribí para filtrar..."
        autocomplete="off"
        class="w-full pl-9 rounded-xl text-sm transition-colors focus:border-primary-500 focus:ring-primary-500 border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f0f17] text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500"
        @focus="abrirDropdown"
        @blur="cerrarDropdown"
      />

      <!-- Dropdown -->
      <div
        v-if="open"
        class="absolute z-20 top-full left-0 right-0 mt-1 bg-white dark:bg-[#13131f] rounded-xl border border-slate-200 dark:border-white/10 shadow-lg dark:shadow-2xl max-h-60 overflow-y-auto"
      >
        <!-- Cargando -->
        <div v-if="loadingLocal" class="flex items-center justify-center py-6">
          <svg class="w-5 h-5 animate-spin text-primary-500" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
        </div>

        <!-- Resultados -->
        <template v-else>
          <button
            v-for="c in clientesFiltrados"
            :key="c.id"
            class="w-full text-left px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors border-b border-slate-200 dark:border-white/10 last:border-0"
            @mousedown.prevent="seleccionar(c)"
          >
            <p class="text-sm font-medium text-slate-800 dark:text-slate-100">{{ c.apellido }}, {{ c.nombre }}</p>
            <p class="text-xs text-slate-400">
              <span v-if="c.dniCuit">{{ c.dniCuit }}</span>
              <span v-if="c.telefono" class="ml-2">{{ c.telefono }}</span>
            </p>
          </button>
          <div v-if="!clientesFiltrados.length" class="px-4 py-4 text-sm text-slate-400 text-center">
            Sin resultados para "{{ query }}"
          </div>
        </template>
      </div>
    </div>

    <!-- Cliente seleccionado -->
    <div
      v-if="wizard.cliente"
      class="bg-emerald-50 dark:bg-[#0a1f14] border border-emerald-200 dark:border-emerald-500/30 rounded-xl p-4 flex items-start justify-between"
    >
      <div>
        <p class="text-sm font-semibold text-emerald-700 dark:text-emerald-400">
          {{ wizard.cliente.apellido }}, {{ wizard.cliente.nombre }}
        </p>
        <div class="flex gap-3 text-xs text-emerald-600 mt-0.5">
          <span v-if="wizard.cliente.dniCuit">DNI: {{ wizard.cliente.dniCuit }}</span>
          <span v-if="wizard.cliente.telefono">{{ wizard.cliente.telefono }}</span>
          <span v-if="wizard.cliente.email">{{ wizard.cliente.email }}</span>
        </div>
      </div>
      <button class="text-xs text-emerald-600 hover:text-red-500 underline" @click="limpiar">
        Cambiar
      </button>
    </div>

    <p v-else class="text-sm text-slate-400 italic">
      Hacé clic en el campo para ver los clientes disponibles.
    </p>
  </div>
</template>
