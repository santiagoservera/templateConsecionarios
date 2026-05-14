import { ref } from 'vue'
import api from '../../../plugins/axios.js'

export function useServices() {
  const services = ref([])
  const loading  = ref(false)
  const error    = ref(null)
  const meta     = ref({ total: 0, page: 1, pageSize: 20, totalPages: 0 })

  async function fetchServices(filters = {}) {
    loading.value = true
    error.value   = null
    try {
      const params = Object.fromEntries(
        Object.entries(filters).filter(([, v]) => v !== '' && v != null)
      )
      const { data } = await api.get('/services', { params })
      services.value = data.data
      if (data.meta) meta.value = data.meta
    } catch (err) {
      error.value = err.response?.data?.error ?? 'Error al cargar services'
    } finally {
      loading.value = false
    }
  }

  async function createService(payload) {
    const { data } = await api.post('/services', payload)
    return data.data
  }

  async function updateService(id, payload) {
    const { data } = await api.patch(`/services/${id}`, payload)
    return data.data
  }

  return { services, loading, error, meta, fetchServices, createService, updateService }
}
