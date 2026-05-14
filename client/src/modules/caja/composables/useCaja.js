import { ref } from 'vue'
import api from '../../../plugins/axios.js'

export function useCaja() {
  const sesiones      = ref([])
  const sesion        = ref(null)
  const sesionActiva  = ref(null)
  const loading       = ref(false)
  const error         = ref(null)
  const meta          = ref({ total: 0, page: 1, pageSize: 20 })

  async function fetchSesiones(filters = {}) {
    loading.value = true; error.value = null
    try {
      const params = Object.fromEntries(Object.entries(filters).filter(([,v]) => v !== '' && v != null))
      const { data } = await api.get('/caja', { params })
      sesiones.value = data.data
      if (data.meta) meta.value = data.meta
    } catch (err) { error.value = err.response?.data?.error ?? 'Error' }
    finally { loading.value = false }
  }

  async function fetchSesionActiva() {
    try {
      const { data } = await api.get('/caja/activa')
      sesionActiva.value = data.data
      return data.data
    } catch { sesionActiva.value = null; return null }
  }

  async function fetchSesion(id) {
    loading.value = true; error.value = null
    try {
      const { data } = await api.get(`/caja/${id}`)
      sesion.value = data.data
      return data.data
    } catch (err) { error.value = err.response?.data?.error ?? 'Error'; throw err }
    finally { loading.value = false }
  }

  async function abrirSesion(payload) {
    const { data } = await api.post('/caja/abrir', payload)
    sesionActiva.value = data.data
    return data.data
  }

  async function cerrarSesion(id, payload) {
    const { data } = await api.post(`/caja/${id}/cerrar`, payload)
    sesionActiva.value = null
    return data.data
  }

  async function registrarMovimiento(sesionId, payload) {
    const { data } = await api.post(`/caja/${sesionId}/movimiento`, payload)
    return data.data
  }

  async function venderIndumentaria(sesionId, payload) {
    const { data } = await api.post(`/caja/${sesionId}/vender-indumentaria`, payload)
    return data.data
  }

  return {
    sesiones, sesion, sesionActiva, loading, error, meta,
    fetchSesiones, fetchSesionActiva, fetchSesion,
    abrirSesion, cerrarSesion, registrarMovimiento, venderIndumentaria,
  }
}
