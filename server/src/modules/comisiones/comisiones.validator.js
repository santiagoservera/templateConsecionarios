const { z } = require('zod');

const updateComisionSchema = z.object({
  estado:       z.enum(['PENDIENTE', 'LIQUIDADA']).optional(),
  montoComision: z.number().positive().optional(),
}).refine((d) => Object.keys(d).length > 0, { message: 'Se requiere al menos un campo' });

const liquidarLoteSchema = z.object({
  ids:              z.array(z.number().int().positive()).optional(),
  vendedorId:       z.number().int().positive().optional(),
  fechaLiquidacion: z.string().datetime({ offset: true }).optional(),
}).refine(
  (d) => (d.ids?.length ?? 0) > 0 || d.vendedorId,
  { message: 'Se requiere ids o vendedorId' }
);

module.exports = { updateComisionSchema, liquidarLoteSchema };
