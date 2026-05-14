const { z } = require('zod');

const FormaPago  = z.enum(['CONTADO', 'FINANCIADO', 'MIXTO']);
const EstadoVenta = z.enum(['RESERVA', 'EN_TRAMITE', 'ENTREGADO', 'CANCELADO']);

const createVentaSchema = z.object({
  clienteId:           z.number().int().positive('Requerido'),
  vehiculoId:          z.number().int().positive('Requerido'),
  precioFinal:         z.number().positive('Debe ser positivo'),
  formaPago:           FormaPago,
  tienePermuta:        z.boolean().default(false),
  tieneFinanciamiento: z.boolean().default(false),
});

const updateEstadoSchema = z.object({
  estado:       EstadoVenta,
  fechaEntrega: z.string().optional().nullable(), // ISO 8601, requerido al pasar a ENTREGADO
});

const createPermutaSchema = z.object({
  marca:         z.string().min(1, 'Requerido'),
  modelo:        z.string().min(1, 'Requerido'),
  anio:          z.number().int().min(1900),
  patente:       z.string().optional(),
  km:            z.number().int().min(0),
  valorTasacion: z.number().positive('Debe ser positivo'),
  estadoIngreso: z.string().optional(),
});

const createFinanciamientoSchema = z.object({
  entidad:         z.string().min(1, 'Requerido'),
  montoFinanciado: z.number().positive('Debe ser positivo'),
  tasaInteres:     z.number().min(0),
  cantCuotas:      z.number().int().positive(),
  valorCuota:      z.number().positive('Debe ser positivo'),
});

module.exports = {
  createVentaSchema,
  updateEstadoSchema,
  createPermutaSchema,
  createFinanciamientoSchema,
};
