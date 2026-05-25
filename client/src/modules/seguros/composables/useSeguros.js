import { ref } from 'vue'
import api from '../../../plugins/axios.js'

export function useSeguros() {
  const aseguradoras = ref([])
  const loading      = ref(false)
  const error        = ref(null)

  async function fetchAseguradoras(soloActivos = true) {
    loading.value = true
    error.value   = null
    try {
      const { data } = await api.get('/seguros', { params: { soloActivos } })
      aseguradoras.value = data.data
    } catch (err) {
      error.value = err.response?.data?.error ?? 'Error al cargar seguros'
    } finally {
      loading.value = false
    }
  }

  async function createAseguradora(payload) {
    const { data } = await api.post('/seguros', payload)
    return data.data
  }

  async function updateAseguradora(id, payload) {
    const { data } = await api.patch(`/seguros/${id}`, payload)
    return data.data
  }

  async function removeAseguradora(id) {
    await api.delete(`/seguros/${id}`)
  }

  async function upsertPlanes(aseguradoraId, planes) {
    const { data } = await api.put(`/seguros/${aseguradoraId}/planes`, { planes })
    return data.data
  }

  return { aseguradoras, loading, error, fetchAseguradoras, createAseguradora, updateAseguradora, removeAseguradora, upsertPlanes }
}
