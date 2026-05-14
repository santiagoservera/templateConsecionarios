import { ref } from 'vue'
import api from '../../../plugins/axios.js'

export function useConsignacion() {
  const consignaciones = ref([])
  const consignacion   = ref(null)
  const loading        = ref(false)
  const error          = ref(null)
  const meta           = ref(null)

  async function fetchConsignaciones(params = {}) {
    loading.value = true
    error.value   = null
    try {
      const { data } = await api.get('/consignacion', { params })
      consignaciones.value = data.data
      meta.value           = data.meta
    } catch (err) {
      error.value = err.response?.data?.error ?? 'Error al cargar consignaciones'
    } finally {
      loading.value = false
    }
  }

  async function fetchById(id) {
    loading.value = true
    error.value   = null
    try {
      const { data } = await api.get(`/consignacion/${id}`)
      consignacion.value = data.data
    } catch (err) {
      error.value = err.response?.data?.error ?? 'Error al cargar consignación'
    } finally {
      loading.value = false
    }
  }

  async function createConsignacion(payload) {
    const { data } = await api.post('/consignacion', payload)
    return data.data
  }

  async function updateConsignacion(id, payload) {
    const { data } = await api.patch(`/consignacion/${id}`, payload)
    return data.data
  }

  return { consignaciones, consignacion, loading, error, meta, fetchConsignaciones, fetchById, createConsignacion, updateConsignacion }
}
