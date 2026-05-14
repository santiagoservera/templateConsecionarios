import { ref } from 'vue'
import api from '../../../plugins/axios.js'

export function useFacturacion() {
  const factura  = ref(null)
  const loading  = ref(false)
  const error    = ref(null)

  async function fetchFactura(ventaId) {
    loading.value = true
    error.value   = null
    try {
      const { data } = await api.get(`/facturacion/venta/${ventaId}`)
      factura.value = data.data
    } catch (err) {
      // 404 = sin factura aún, es normal — no mostrar error
      // 500 = problema de servidor (ej. migración pendiente) — silencioso en mount
      factura.value = null
    } finally {
      loading.value = false
    }
  }

  async function emitirFactura(ventaId) {
    const { data } = await api.post(`/facturacion/venta/${ventaId}`)
    factura.value = data.data
    return data.data
  }

  return { factura, loading, error, fetchFactura, emitirFactura }
}
