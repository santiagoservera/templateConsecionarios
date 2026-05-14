import { ref } from 'vue'
import api from '../../../plugins/axios.js'

export function useIndumentaria() {
  const items   = ref([])
  const item    = ref(null)
  const loading = ref(false)
  const error   = ref(null)
  const meta    = ref({ total: 0, page: 1, pageSize: 20, totalPages: 0 })

  async function fetchItems(filters = {}) {
    loading.value = true
    error.value   = null
    try {
      const params = Object.fromEntries(
        Object.entries(filters).filter(([, v]) => v !== '' && v != null)
      )
      const { data } = await api.get('/indumentaria', { params })
      items.value = data.data
      if (data.meta) meta.value = data.meta
    } catch (err) {
      error.value = err.response?.data?.error ?? 'Error al cargar indumentaria'
    } finally {
      loading.value = false
    }
  }

  async function createItem(payload) {
    const { data } = await api.post('/indumentaria', payload)
    return data.data
  }

  async function updateItem(id, payload) {
    const { data } = await api.patch(`/indumentaria/${id}`, payload)
    return data.data
  }

  async function removeItem(id) {
    await api.delete(`/indumentaria/${id}`)
  }

  return { items, item, loading, error, meta, fetchItems, createItem, updateItem, removeItem }
}
