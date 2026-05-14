import { defineStore } from 'pinia'
import { ref, reactive } from 'vue'

const pagoInicial = () => ({
  formaPago:           'CONTADO',
  precioFinal:         '',
  tienePermuta:        false,
  tieneFinanciamiento: false,
  permuta: {
    marca: '', modelo: '', anio: new Date().getFullYear(),
    patente: '', km: 0, valorTasacion: '',
  },
  financiamiento: {
    entidad: '', montoFinanciado: '', cantCuotas: 12,
    tasaInteres: 0, valorCuota: 0,
  },
})

export const useVentaWizardStore = defineStore('ventaWizard', () => {
  const cliente  = ref(null)
  const vehiculo = ref(null)
  const pago     = reactive(pagoInicial())

  function reset() {
    cliente.value  = null
    vehiculo.value = null
    Object.assign(pago, pagoInicial())
  }

  return { cliente, vehiculo, pago, reset }
})
