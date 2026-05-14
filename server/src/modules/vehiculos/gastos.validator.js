const { z } = require('zod');

const createGastoSchema = z.object({
  concepto:  z.string().min(1, 'Requerido'),
  monto:     z.number().positive('Debe ser positivo'),
  proveedor: z.string().optional(),
  fecha:     z.string().optional().nullable(), // ISO 8601; si no viene, se usa ahora
});

module.exports = { createGastoSchema };
