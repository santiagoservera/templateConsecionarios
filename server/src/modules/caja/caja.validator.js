const { z } = require('zod');

const abrirSesionSchema = z.object({
  montoApertura: z.number().min(0, 'Debe ser 0 o mayor'),
  observaciones: z.string().optional(),
});

const cerrarSesionSchema = z.object({
  montoCierre:   z.number().min(0),
  observaciones: z.string().optional(),
});

const movimientoSchema = z.object({
  tipo:          z.enum(['INGRESO','EGRESO']),
  concepto:      z.enum(['CUOTA_PLAN_PAGO','VENTA_INDUMENTARIA','GASTO','OTRO']),
  monto:         z.number().positive('Debe ser positivo'),
  planPagoDNIId: z.number().int().positive().optional(),
  observaciones: z.string().optional(),
});

const ventaIndumentariaSchema = z.object({
  items: z.array(z.object({
    indumentariaId: z.number().int().positive(),
    cantidad:       z.number().int().positive().default(1),
  })).min(1, 'Se requiere al menos un ítem'),
  observaciones: z.string().optional(),
});

module.exports = { abrirSesionSchema, cerrarSesionSchema, movimientoSchema, ventaIndumentariaSchema };
