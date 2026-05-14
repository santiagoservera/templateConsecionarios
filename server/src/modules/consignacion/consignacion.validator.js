const { z } = require('zod');

const EstadoConsignacion = z.enum(['ACTIVA', 'VENDIDA', 'RETIRADA']);

const createConsignacionSchema = z.object({
  vehiculoId:       z.number().int().positive('Requerido'),
  propietarioId:    z.number().int().positive('Requerido'),
  precioAcordado:   z.number().positive('Debe ser positivo'),
  comisionPct:      z.number().min(0).max(100, 'Máximo 100%'),
  fechaVencimiento: z.string().datetime({ offset: true }).optional().nullable(),
  observaciones:    z.string().optional(),
});

const updateConsignacionSchema = z.object({
  estado:           EstadoConsignacion.optional(),
  precioAcordado:   z.number().positive().optional(),
  comisionPct:      z.number().min(0).max(100).optional(),
  fechaVencimiento: z.string().datetime({ offset: true }).optional().nullable(),
  observaciones:    z.string().optional(),
}).refine((d) => Object.keys(d).length > 0, { message: 'Se requiere al menos un campo' });

module.exports = { createConsignacionSchema, updateConsignacionSchema };
