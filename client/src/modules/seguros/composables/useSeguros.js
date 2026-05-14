import { ref } from 'vue'
import api from '../../../plugins/axios.js'

export function useSeguros() {
  const seguros = ref([])
  const loading = ref(false)
  const error   = ref(null)

  async function fetchSeguros() {
    loading.value = true; error.value = null
    try {
      const { data } = await api.get('/seguros')
      seguros.value = data.data
    } catch (err) { error.value = err.response?.data?.error ?? 'Error al cargar seguros' }
    finally { loading.value = false }
  }

  async function createSeguro(payload) {
    const { data } = await api.post('/seguros', payload)
    return data.data
  }

  async function updateSeguro(id, payload) {
    const { data } = await api.patch(`/seguros/${id}`, payload)
    return data.data
  }

  async function deleteSeguro(id) {
    await api.delete(`/seguros/${id}`)
  }

  return { seguros, loading, error, fetchSeguros, createSeguro, updateSeguro, deleteSeguro }
}
