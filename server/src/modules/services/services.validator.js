const { z } = require('zod');

const TipoService   = z.enum(['REVISION', 'MANTENIMIENTO', 'GARANTIA', 'OTRO']);
const EstadoService = z.enum(['PENDIENTE', 'REALIZADO', 'CANCELADO']);

const createServiceSchema = z.object({
  ventaId:             z.number().int().positive().optional(),
  vehiculoId:          z.number().int().positive().optional(),
  tipoService:         TipoService.default('MANTENIMIENTO'),
  descripcion:         z.string().min(1, 'Requerido'),
  kmActual:            z.number().int().min(0).optional(),
  kmProximoService:    z.number().int().min(0).optional(),
  fechaService:        z.string().datetime({ offset: true }).optional(),
  fechaProximoService: z.string().datetime({ offset: true }).optional().nullable(),
  observaciones:       z.string().optional(),
});

const updateServiceSchema = z.object({
  tipoService:         TipoService.optional(),
  descripcion:         z.string().min(1).optional(),
  estado:              EstadoService.optional(),
  kmActual:            z.number().int().min(0).optional(),
  kmProximoService:    z.number().int().min(0).optional(),
  fechaService:        z.string().datetime({ offset: true }).optional(),
  fechaProximoService: z.string().datetime({ offset: true }).optional().nullable(),
  observaciones:       z.string().optional(),
}).refine((d) => Object.keys(d).length > 0, { message: 'Se requiere al menos un campo' });

module.exports = { createServiceSchema, updateServiceSchema };
