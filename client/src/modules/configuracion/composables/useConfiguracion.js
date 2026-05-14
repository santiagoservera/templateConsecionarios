import { ref } from 'vue'
import api from '../../../plugins/axios.js'

export function useConfiguracion() {
  const config  = ref(null)
  const loading = ref(false)
  const error   = ref(null)

  async function fetchConfig() {
    loading.value = true
    error.value   = null
    try {
      const { data } = await api.get('/configuracion')
      config.value = data.data
    } catch (err) {
      error.value = err.response?.data?.error ?? 'Error al cargar configuración'
    } finally {
      loading.value = false
    }
  }

  async function updateConfig(payload) {
    const { data } = await api.patch('/configuracion', payload)
    config.value = data.data
    return data.data
  }

  return { config, loading, error, fetchConfig, updateConfig }
}
