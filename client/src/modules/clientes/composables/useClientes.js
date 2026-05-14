import { ref } from 'vue'
import api from '../../../plugins/axios.js'

export function useClientes() {
  const clientes = ref([])
  const cliente  = ref(null)
  const loading  = ref(false)
  const error    = ref(null)
  const meta     = ref({ total: 0, page: 1, pageSize: 20, totalPages: 0 })

  async function fetchClientes(filters = {}) {
    loading.value = true
    error.value   = null
    try {
      const params = Object.fromEntries(
        Object.entries(filters).filter(([, v]) => v !== '' && v != null)
      )
      const { data } = await api.get('/clientes', { params })
      clientes.value = data.data
      if (data.meta) meta.value = data.meta
    } catch (err) {
      error.value = err.response?.data?.error ?? 'Error al cargar clientes'
    } finally {
      loading.value = false
    }
  }

  async function fetchCliente(id) {
    loading.value = true
    error.value   = null
    try {
      const { data } = await api.get(`/clientes/${id}`)
      cliente.value = data.data
      return data.data
    } catch (err) {
      error.value = err.response?.data?.error ?? 'Error al cargar el cliente'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function createCliente(payload) {
    loading.value = true
    error.value   = null
    try {
      const { data } = await api.post('/clientes', payload)
      return data.data
    } catch (err) {
      error.value = err.response?.data?.error ?? 'Error al crear el cliente'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function updateCliente(id, payload) {
    loading.value = true
    error.value   = null
    try {
      const { data } = await api.patch(`/clientes/${id}`, payload)
      return data.data
    } catch (err) {
      error.value = err.response?.data?.error ?? 'Error al actualizar el cliente'
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    clientes,
    cliente,
    loading,
    error,
    meta,
    fetchClientes,
    fetchCliente,
    createCliente,
    updateCliente,
  }
}
