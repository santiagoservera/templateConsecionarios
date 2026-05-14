<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUsuarios } from '../composables/useUsuarios.js'
import { useToast } from '../../../shared/composables/useToast.js'
import AppTable from '../../../shared/components/AppTable.vue'
import AppBadge from '../../../shared/components/AppBadge.vue'
import AppPagination from '../../../shared/components/AppPagination.vue'

const router = useRouter()
const { usuarios, loading, error, meta, fetchUsuarios, toggleActivo } = useUsuarios()
const toast  = useToast()

const page = ref(1)

function load() {
  fetchUsuarios({ page: page.value, pageSize: 50 })
}

function changePage(p) {
  page.value = p
  load()
}

onMounted(load)

// ── Toggle activo ──────────────────────────────────────────────────────────────
const toggling = ref(null)

async function handleToggle(usuario) {
  toggling.value = usuario.id
  try {
    await toggleActivo(usuario.id, !usuario.activo)
    toast.success('Estado actualizado', usuario.nombre)
    load()
  } finally {
    toggling.value = null
  }
}

// ── Tabla ──────────────────────────────────────────────────────────────────────
const ROLES_LABEL = { ADMIN: 'Administrador', GERENTE: 'Gerente', VENDEDOR: 'Vendedor', ASESOR: 'Asesor' }

const COLUMNS = [
  { key: 'nombre', label: 'Nombre' },
  { key: 'email',  label: 'Email' },
  { key: 'rol',    label: 'Rol' },
  { key: 'activo', label: 'Estado' },
  { key: 'acciones', label: '' },
]
</script>

<template>
  <div class="p-6 space-y-5">

    <!-- Tabs -->
    <div class="flex gap-0.5 border-b border-slate-200 dark:border-white/10">
      <router-link
        to="/usuarios"
        class="px-5 py-2.5 text-sm font-medium transition-colors relative text-primary-500 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-primary-500 after:rounded-t"
      >
        Usuarios
      </router-link>
      <router-link
        to="/usuarios/roles"
        class="px-5 py-2.5 text-sm font-medium transition-colors text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
      >
        Roles
      </router-link>
      <router-link
        to="/usuarios/vendedores"
        class="px-5 py-2.5 text-sm font-medium transition-colors text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
      >
        Vendedores
      </router-link>
    </div>

    <!-- Encabezado -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-slate-900 dark:text-white">Usuarios</h1>
        <p class="text-sm text-slate-500 mt-0.5">{{ meta.total }} usuario{{ meta.total !== 1 ? 's' : '' }} en total</p>
      </div>
      <button
        class="inline-flex items-center gap-2 bg-primary-500 hover:bg-primary-600 text-white text-sm font-semibold px-4 py-2.5 rounded-xl shadow-sm hover:shadow-glow active:scale-[0.98]"
        @click="router.push('/usuarios/nuevo')"
      >
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
        Nuevo usuario
      </button>
    </div>

    <!-- Error -->
    <div v-if="error" class="rounded-lg bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 px-4 py-3 text-sm text-red-700 dark:text-red-400">{{ error }}</div>

    <!-- Tabla -->
    <AppTable :columns="COLUMNS" :rows="usuarios" :loading="loading">

      <template #cell-nombre="{ row }">
        <span class="font-medium text-slate-800 dark:text-slate-100">{{ row.nombre }}</span>
      </template>

      <template #cell-rol="{ value }">
        <span class="text-sm text-slate-700 dark:text-slate-300">{{ ROLES_LABEL[value] ?? value }}</span>
      </template>

      <template #cell-activo="{ value }">
        <AppBadge :value="value ? 'ACTIVO' : 'INACTIVO'" size="xs" />
      </template>

      <template #cell-acciones="{ row }">
        <div class="flex items-center justify-end gap-2">
          <button
            class="text-xs text-primary-500 hover:text-primary-400 font-medium px-2 py-1 rounded hover:bg-primary-500/10 dark:hover:bg-primary-500/20 transition-colors"
            @click.stop="router.push(`/usuarios/${row.id}`)"
          >
            Editar
          </button>
          <button
            class="text-xs font-medium px-2 py-1 rounded transition-colors"
            :class="row.activo
              ? 'text-red-500 hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10'
              : 'text-emerald-500 hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-500/10'"
            :disabled="toggling === row.id"
            @click.stop="handleToggle(row)"
          >
            {{ toggling === row.id ? '...' : row.activo ? 'Desactivar' : 'Activar' }}
          </button>
        </div>
      </template>

      <template #empty>
        No hay usuarios registrados.
      </template>
    </AppTable>

    <!-- Paginación -->
    <AppPagination
      v-if="!loading"
      :page="meta.page"
      :total="meta.total"
      :page-size="meta.pageSize"
      @update:page="changePage"
    />

  </div>
</template>
