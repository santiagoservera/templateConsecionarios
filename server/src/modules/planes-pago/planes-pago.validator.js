const { z } = require('zod');

const createPlanSchema = z.object({
  clienteId:    z.number().int().positive('Requerido'),
  vehiculoId:   z.number().int().positive('Requerido'),
  precioTotal:  z.number().positive('Debe ser positivo'),
  cantCuotas:   z.number().int().positive('Debe ser positivo'),
  valorCuota:   z.number().positive('Debe ser positivo'),
  montoEntrega: z.number().positive().optional(),
  observaciones:z.string().optional(),
  fechaInicio:  z.string().datetime({ offset: true }).optional(),
});

const updatePlanSchema = z.object({
  estado:       z.enum(['ACTIVO','SUSPENDIDO','COMPLETADO','CANCELADO']).optional(),
  observaciones:z.string().optional(),
  montoEntrega: z.number().positive().optional().nullable(),
}).refine(d => Object.keys(d).length > 0, { message: 'Se requiere al menos un campo' });

const cobrarCuotaSchema = z.object({
  cuotaId:      z.number().int().positive('Requerido'),
  fechaPago:    z.string().datetime({ offset: true }).optional(),
  observaciones:z.string().optional(),
  sesionCajaId: z.number().int().positive().optional(),
});

const entregarAutoSchema = z.object({
  observaciones: z.string().optional(),
});

module.exports = { createPlanSchema, updatePlanSchema, cobrarCuotaSchema, entregarAutoSchema };
