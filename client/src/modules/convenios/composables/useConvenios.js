import { ref } from 'vue'
import api from '../../../plugins/axios.js'

export function useConvenios() {
  const convenios = ref([])
  const loading   = ref(false)
  const error     = ref(null)

  async function fetchConvenios(soloActivos = true) {
    loading.value = true
    error.value   = null
    try {
      const { data } = await api.get('/convenios-bancos', { params: { soloActivos } })
      convenios.value = data.data
    } catch (err) {
      error.value = err.response?.data?.error ?? 'Error al cargar convenios'
    } finally {
      loading.value = false
    }
  }

  async function createConvenio(payload) {
    const { data } = await api.post('/convenios-bancos', payload)
    return data.data
  }

  async function updateConvenio(id, payload) {
    const { data } = await api.patch(`/convenios-bancos/${id}`, payload)
    return data.data
  }

  async function removeConvenio(id) {
    await api.delete(`/convenios-bancos/${id}`)
  }

  async function upsertPlanes(bancoId, planes) {
    const { data } = await api.put(`/convenios-bancos/${bancoId}/planes`, { planes })
    return data.data
  }

  return { convenios, loading, error, fetchConvenios, createConvenio, updateConvenio, removeConvenio, upsertPlanes }
}
