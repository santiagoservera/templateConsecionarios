import { ref } from 'vue'
import api from '../../../plugins/axios.js'

export function useRoles() {
  const roles   = ref([])
  const loading = ref(false)
  const error   = ref(null)

  async function fetchRoles() {
    loading.value = true
    error.value   = null
    try {
      const { data } = await api.get('/roles')
      roles.value = data.data
    } catch (err) {
      error.value = err.response?.data?.error ?? 'Error al cargar roles'
    } finally {
      loading.value = false
    }
  }

  async function createRol(payload) {
    const { data } = await api.post('/roles', payload)
    return data.data
  }

  async function updateRol(id, payload) {
    const { data } = await api.patch(`/roles/${id}`, payload)
    return data.data
  }

  async function deleteRol(id) {
    await api.delete(`/roles/${id}`)
  }

  return { roles, loading, error, fetchRoles, createRol, updateRol, deleteRol }
}
