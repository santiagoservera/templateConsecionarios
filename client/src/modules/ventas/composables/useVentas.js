import { ref } from 'vue'
import api from '../../../plugins/axios.js'

export function useVentas() {
  const ventas  = ref([])
  const venta   = ref(null)
  const loading = ref(false)
  const error   = ref(null)
  const meta    = ref({ total: 0, page: 1, pageSize: 20, totalPages: 0 })

  async function fetchVentas(filters = {}) {
    loading.value = true
    error.value   = null
    try {
      const params = Object.fromEntries(
        Object.entries(filters).filter(([, v]) => v !== '' && v != null)
      )
      const { data } = await api.get('/ventas', { params })
      ventas.value = data.data
      if (data.meta) meta.value = data.meta
    } catch (err) {
      error.value = err.response?.data?.error ?? 'Error al cargar ventas'
    } finally {
      loading.value = false
    }
  }

  async function fetchVenta(id) {
    loading.value = true
    error.value   = null
    try {
      const { data } = await api.get(`/ventas/${id}`)
      venta.value = data.data
      return data.data
    } catch (err) {
      error.value = err.response?.data?.error ?? 'Error al cargar la venta'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function crearVenta(payload) {
    loading.value = true
    error.value   = null
    try {
      const { data } = await api.post('/ventas', payload)
      return data.data
    } catch (err) {
      error.value = err.response?.data?.error ?? 'Error al crear la venta'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function actualizarEstado(id, estado, fechaEntrega) {
    try {
      const payload = { estado }
      if (fechaEntrega) payload.fechaEntrega = fechaEntrega
      const { data } = await api.patch(`/ventas/${id}/estado`, payload)
      venta.value = data.data
      return data.data
    } catch (err) {
      error.value = err.response?.data?.error ?? 'Error al actualizar estado'
      throw err
    }
  }

  async function agregarPermuta(id, data) {
    try {
      const res = await api.post(`/ventas/${id}/permuta`, data)
      return res.data.data
    } catch (err) {
      error.value = err.response?.data?.error ?? 'Error al agregar permuta'
      throw err
    }
  }

  async function agregarFinanciamiento(id, data) {
    try {
      const res = await api.post(`/ventas/${id}/financiamiento`, data)
      return res.data.data
    } catch (err) {
      error.value = err.response?.data?.error ?? 'Error al agregar financiamiento'
      throw err
    }
  }

  return {
    ventas, venta, loading, error, meta,
    fetchVentas, fetchVenta, crearVenta,
    actualizarEstado, agregarPermuta, agregarFinanciamiento,
  }
}
