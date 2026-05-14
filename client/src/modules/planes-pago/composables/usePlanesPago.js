import { ref } from 'vue'
import api from '../../../plugins/axios.js'

export function usePlanesPago() {
  const planes  = ref([])
  const plan    = ref(null)
  const loading = ref(false)
  const error   = ref(null)
  const meta    = ref({ total: 0, page: 1, pageSize: 20, totalPages: 0 })

  async function fetchPlanes(filters = {}) {
    loading.value = true; error.value = null
    try {
      const params = Object.fromEntries(Object.entries(filters).filter(([,v]) => v !== '' && v != null))
      const { data } = await api.get('/planes-pago', { params })
      planes.value = data.data
      if (data.meta) meta.value = data.meta
    } catch (err) { error.value = err.response?.data?.error ?? 'Error al cargar planes' }
    finally { loading.value = false }
  }

  async function fetchPlan(id) {
    loading.value = true; error.value = null
    try {
      const { data } = await api.get(`/planes-pago/${id}`)
      plan.value = data.data
      return data.data
    } catch (err) { error.value = err.response?.data?.error ?? 'Error'; throw err }
    finally { loading.value = false }
  }

  async function createPlan(payload) {
    const { data } = await api.post('/planes-pago', payload)
    return data.data
  }

  async function updatePlan(id, payload) {
    const { data } = await api.patch(`/planes-pago/${id}`, payload)
    plan.value = data.data
    return data.data
  }

  async function cobrarCuota(planId, payload) {
    const { data } = await api.post(`/planes-pago/${planId}/cobrar-cuota`, payload)
    plan.value = data.data
    return data.data
  }

  async function entregarAuto(planId, payload = {}) {
    const { data } = await api.post(`/planes-pago/${planId}/entregar`, payload)
    plan.value = data.data
    return data.data
  }

  return { planes, plan, loading, error, meta, fetchPlanes, fetchPlan, createPlan, updatePlan, cobrarCuota, entregarAuto }
}
