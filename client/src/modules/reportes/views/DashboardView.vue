<script setup>
import { ref, onMounted } from 'vue'
import { useAuthStore } from '../../auth/store/authStore.js'
import { useDashboard } from '../composables/useDashboard.js'
import DashboardGerente  from '../components/DashboardGerente.vue'
import DashboardVendedor from '../components/DashboardVendedor.vue'
import api from '../../../plugins/axios.js'

const authStore = useAuthStore()
const { dashboard, loading, error, fetchDashboard } = useDashboard()

// Alertas (solo ADMIN/GERENTE)
const alertas     = ref(null)
const isGerente   = ['ADMIN', 'GERENTE'].includes(authStore.userRole)

onMounted(async () => {
  const rol = authStore.userRole
  const vendedorId = rol === 'VENDEDOR' ? authStore.user?.id : undefined
  fetchDashboard(rol, vendedorId)
  if (isGerente) {
    try {
      const { data } = await api.get('/reportes/alertas')
      alertas.value = data.data
    } catch { /* silencioso */ }
  }
})
</script>

<template>
  <!-- Loading -->
  <div v-if="loading" class="flex justify-center items-center py-24">
    <svg class="w-8 h-8 animate-spin text-primary-600" fill="none" viewBox="0 0 24 24">
      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
    </svg>
  </div>

  <!-- Error -->
  <div v-else-if="error" class="p-6">
    <div class="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{{ error }}</div>
  </div>

  <!-- Dashboard según rol -->
  <template v-else-if="dashboard">
    <DashboardGerente
      v-if="['ADMIN', 'GERENTE'].includes(authStore.userRole)"
      :data="dashboard"
      :alertas="alertas"
    />
    <DashboardVendedor
      v-else-if="authStore.userRole === 'VENDEDOR'"
      :data="dashboard"
      :nombre="authStore.userName"
    />
    <!-- ASESOR: vista de solo lectura básica -->
    <div v-else class="p-6">
      <h1 class="text-2xl font-bold text-slate-800 dark:text-white">Bienvenido, {{ authStore.userName }}</h1>
      <p class="text-slate-500 dark:text-slate-400 mt-1">Usá el menú lateral para consultar stock y clientes.</p>
    </div>
  </template>
</template>
