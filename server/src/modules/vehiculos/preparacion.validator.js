const { z } = require('zod');

const TipoPreparacion   = z.enum(['LAVADO', 'SERVICE', 'REPARACION', 'DETAILING', 'OTRO']);
const EstadoPreparacion = z.enum(['PENDIENTE', 'EN_CURSO', 'COMPLETADO']);

const createPreparacionSchema = z.object({
  tipo:        TipoPreparacion,
  descripcion: z.string().optional(),
  proveedor:   z.string().optional(),
  costo:       z.number().min(0).default(0),
  fechaInicio: z.string().optional().nullable(),
  fechaFin:    z.string().optional().nullable(),
});

const updatePreparacionSchema = z.object({
  tipo:        TipoPreparacion.optional(),
  descripcion: z.string().optional(),
  proveedor:   z.string().optional(),
  costo:       z.number().min(0).optional(),
  estado:      EstadoPreparacion.optional(),
  fechaInicio: z.string().optional().nullable(),
  fechaFin:    z.string().optional().nullable(),
});

module.exports = { createPreparacionSchema, updatePreparacionSchema };
