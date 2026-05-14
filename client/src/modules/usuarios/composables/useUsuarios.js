import { ref } from 'vue'
import api from '../../../plugins/axios.js'

export function useUsuarios() {
  const usuarios = ref([])
  const usuario  = ref(null)
  const loading  = ref(false)
  const error    = ref(null)
  const meta     = ref({ total: 0, page: 1, pageSize: 50, totalPages: 0 })

  async function fetchUsuarios(filters = {}) {
    loading.value = true
    error.value   = null
    try {
      const params = Object.fromEntries(
        Object.entries(filters).filter(([, v]) => v !== '' && v != null)
      )
      const { data } = await api.get('/usuarios', { params })
      usuarios.value = data.data
      if (data.meta) meta.value = data.meta
    } catch (err) {
      error.value = err.response?.data?.error ?? 'Error al cargar usuarios'
    } finally {
      loading.value = false
    }
  }

  async function fetchUsuario(id) {
    loading.value = true
    error.value   = null
    try {
      const { data } = await api.get(`/usuarios/${id}`)
      usuario.value = data.data
      return data.data
    } catch (err) {
      error.value = err.response?.data?.error ?? 'Error al cargar el usuario'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function createUsuario(payload) {
    const { data } = await api.post('/usuarios', payload)
    return data.data
  }

  async function updateUsuario(id, payload) {
    const { data } = await api.patch(`/usuarios/${id}`, payload)
    return data.data
  }

  async function toggleActivo(id, activo) {
    const { data } = await api.patch(`/usuarios/${id}`, { activo })
    return data.data
  }

  return {
    usuarios,
    usuario,
    loading,
    error,
    meta,
    fetchUsuarios,
    fetchUsuario,
    createUsuario,
    updateUsuario,
    toggleActivo,
  }
}
