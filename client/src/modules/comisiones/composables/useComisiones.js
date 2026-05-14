import { ref } from 'vue'
import api from '../../../plugins/axios.js'

export function useComisiones() {
  const comisiones = ref([])
  const loading    = ref(false)
  const error      = ref(null)
  const meta       = ref(null)
  const totales    = ref(null)

  async function fetchComisiones(params = {}) {
    loading.value = true
    error.value   = null
    try {
      const { data } = await api.get('/comisiones', { params })
      comisiones.value = data.data
      totales.value    = data.meta?._totales ?? null
      meta.value       = data.meta
    } catch (err) {
      error.value = err.response?.data?.error ?? 'Error al cargar comisiones'
    } finally {
      loading.value = false
    }
  }

  async function updateComision(id, payload) {
    const { data } = await api.patch(`/comisiones/${id}`, payload)
    return data.data
  }

  async function liquidarLote(payload) {
    const { data } = await api.post('/comisiones/liquidar', payload)
    return data.data
  }

  return { comisiones, loading, error, meta, totales, fetchComisiones, updateComision, liquidarLote }
}
