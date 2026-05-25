import { ref } from 'vue'
import api from '../../../plugins/axios.js'

export function useLeads() {
  const leads   = ref([])
  const lead    = ref(null)
  const loading = ref(false)
  const error   = ref(null)

  async function fetchLeads(filters = {}) {
    loading.value = true
    error.value   = null
    try {
      const params = Object.fromEntries(
        Object.entries(filters).filter(([, v]) => v !== '' && v != null)
      )
      const { data } = await api.get('/leads', { params })
      leads.value = data.data
      return data.data
    } catch (err) {
      error.value = err.response?.data?.error ?? 'Error al cargar leads'
    } finally {
      loading.value = false
    }
  }

  async function fetchLead(id) {
    loading.value = true
    error.value   = null
    try {
      const { data } = await api.get(`/leads/${id}`)
      lead.value = data.data
      return data.data
    } catch (err) {
      error.value = err.response?.data?.error ?? 'Error al cargar lead'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function createLead(payload) {
    loading.value = true
    error.value   = null
    try {
      const { data } = await api.post('/leads', payload)
      return data.data
    } catch (err) {
      error.value = err.response?.data?.error ?? 'Error al crear lead'
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Cambia la etapa de un lead y opcionalmente actualiza las notas.
   * Llamado desde el kanban al hacer drop en otra columna.
   */
  async function cambiarEtapa(id, etapa, notas) {
    try {
      const payload = { etapa }
      if (notas) payload.notas = notas
      const { data } = await api.patch(`/leads/${id}/etapa`, payload)
      return data.data
    } catch (err) {
      error.value = err.response?.data?.error ?? 'Error al cambiar etapa'
      throw err
    }
  }

  async function updateLead(id, payload) {
    try {
      const { data } = await api.patch(`/leads/${id}`, payload)
      return data.data
    } catch (err) {
      error.value = err.response?.data?.error ?? 'Error al actualizar lead'
      throw err
    }
  }

  async function deleteLead(id) {
    try {
      await api.delete(`/leads/${id}`)
    } catch (err) {
      error.value = err.response?.data?.error ?? 'Error al eliminar lead'
      throw err
    }
  }

  return { leads, lead, loading, error, fetchLeads, fetchLead, createLead, updateLead, cambiarEtapa, deleteLead }
}
