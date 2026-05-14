import { ref, computed } from 'vue'
import api from '../../../plugins/axios.js'

export function useCategorias() {
  const categorias = ref([])
  const loading    = ref(false)
  const error      = ref(null)

  async function fetchCategorias(soloActivas = true) {
    loading.value = true
    error.value   = null
    try {
      const { data } = await api.get('/indumentaria/categorias', { params: { soloActivas } })
      categorias.value = data.data
    } catch (err) {
      error.value = err.response?.data?.error ?? 'Error al cargar categorías'
    } finally {
      loading.value = false
    }
  }

  async function createCategoria(nombre) {
    const { data } = await api.post('/indumentaria/categorias', { nombre })
    return data.data
  }

  async function updateCategoria(id, payload) {
    const { data } = await api.patch(`/indumentaria/categorias/${id}`, payload)
    return data.data
  }

  async function deleteCategoria(id) {
    await api.delete(`/indumentaria/categorias/${id}`)
  }

  // Opciones formateadas para AppSelect
  const categoriasOptions = computed(() =>
    categorias.value.map(c => ({ value: c.nombre, label: c.nombre }))
  )

  const categoriasFilterOptions = computed(() => [
    { value: '', label: 'Categoría (todas)' },
    ...categorias.value.map(c => ({ value: c.nombre, label: c.nombre })),
  ])

  return {
    categorias, loading, error,
    fetchCategorias, createCategoria, updateCategoria, deleteCategoria,
    categoriasOptions, categoriasFilterOptions,
  }
}
