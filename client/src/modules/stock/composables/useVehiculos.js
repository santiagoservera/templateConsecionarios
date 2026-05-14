import { ref } from 'vue'
import api from '../../../plugins/axios.js'

export function useVehiculos() {
  const vehiculos = ref([])
  const vehiculo  = ref(null)
  const loading   = ref(false)
  const error     = ref(null)
  const meta      = ref({ total: 0, page: 1, pageSize: 20, totalPages: 0 })

  // ── Listado con filtros opcionales ────────────────────────────────────────
  async function fetchVehiculos(filters = {}) {
    loading.value = true
    error.value   = null
    try {
      // Limpiar filtros vacíos antes de enviar
      const params = Object.fromEntries(
        Object.entries(filters).filter(([, v]) => v !== '' && v != null)
      )
      const { data } = await api.get('/vehiculos', { params })
      vehiculos.value = data.data
      if (data.meta) meta.value = data.meta
    } catch (err) {
      error.value = err.response?.data?.error ?? 'Error al cargar vehículos'
    } finally {
      loading.value = false
    }
  }

  // ── Detalle de un vehículo ─────────────────────────────────────────────────
  async function fetchVehiculo(id) {
    loading.value = true
    error.value   = null
    try {
      const { data } = await api.get(`/vehiculos/${id}`)
      vehiculo.value = data.data
      return data.data
    } catch (err) {
      error.value = err.response?.data?.error ?? 'Error al cargar el vehículo'
      throw err
    } finally {
      loading.value = false
    }
  }

  // ── Crear vehículo ─────────────────────────────────────────────────────────
  async function createVehiculo(payload) {
    loading.value = true
    error.value   = null
    try {
      const { data } = await api.post('/vehiculos', payload)
      return data.data
    } catch (err) {
      error.value = err.response?.data?.error ?? 'Error al crear el vehículo'
      throw err
    } finally {
      loading.value = false
    }
  }

  // ── Actualizar vehículo ────────────────────────────────────────────────────
  async function updateVehiculo(id, payload) {
    loading.value = true
    error.value   = null
    try {
      const { data } = await api.patch(`/vehiculos/${id}`, payload)
      return data.data
    } catch (err) {
      error.value = err.response?.data?.error ?? 'Error al actualizar el vehículo'
      throw err
    } finally {
      loading.value = false
    }
  }

  // ── Costo real (precioCosto + suma de gastos) ──────────────────────────────
  // Solo disponible para ADMIN y GERENTE (el servidor valida el rol).
  async function fetchCostoReal(id) {
    try {
      const { data } = await api.get(`/vehiculos/${id}/costoReal`)
      return data.data
    } catch (err) {
      error.value = err.response?.data?.error ?? 'Error al calcular costo real'
      throw err
    }
  }

  return {
    vehiculos,
    vehiculo,
    loading,
    error,
    meta,
    fetchVehiculos,
    fetchVehiculo,
    createVehiculo,
    updateVehiculo,
    fetchCostoReal,
  }
}
