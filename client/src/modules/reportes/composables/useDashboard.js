import { ref } from 'vue'
import api from '../../../plugins/axios.js'

export function useDashboard() {
  const dashboard = ref(null)
  const loading   = ref(false)
  const error     = ref(null)

  async function fetchDashboard(rol, vendedorId) {
    loading.value = true
    error.value   = null
    try {
      const params = { rol }
      if (vendedorId) params.vendedorId = vendedorId
      const { data } = await api.get('/reportes/dashboard', { params })
      dashboard.value = data.data
      return data.data
    } catch (err) {
      error.value = err.response?.data?.error ?? 'Error al cargar el dashboard'
    } finally {
      loading.value = false
    }
  }

  return { dashboard, loading, error, fetchDashboard }
}
