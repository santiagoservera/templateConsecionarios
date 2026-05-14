import { ref } from 'vue'
import api from '../../../plugins/axios.js'

export function usePostventa() {
  const casos   = ref([])
  const caso    = ref(null)
  const loading = ref(false)
  const error   = ref(null)
  const meta    = ref({ total: 0, page: 1, pageSize: 20, totalPages: 0 })

  async function fetchCasos(filters = {}) {
    loading.value = true
    error.value   = null
    try {
      const params = Object.fromEntries(
        Object.entries(filters).filter(([, v]) => v !== '' && v != null)
      )
      const { data } = await api.get('/postventa', { params })
      casos.value = data.data
      if (data.meta) meta.value = data.meta
    } catch (err) {
      error.value = err.response?.data?.error ?? 'Error al cargar casos'
    } finally {
      loading.value = false
    }
  }

  async function fetchCaso(id) {
    loading.value = true
    error.value   = null
    try {
      const { data } = await api.get(`/postventa/${id}`)
      caso.value = data.data
      return data.data
    } catch (err) {
      error.value = err.response?.data?.error ?? 'Error al cargar el caso'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function createCaso(payload) {
    const { data } = await api.post('/postventa', payload)
    return data.data
  }

  async function updateCaso(id, payload) {
    const { data } = await api.patch(`/postventa/${id}`, payload)
    return data.data
  }

  return { casos, caso, loading, error, meta, fetchCasos, fetchCaso, createCaso, updateCaso }
}
