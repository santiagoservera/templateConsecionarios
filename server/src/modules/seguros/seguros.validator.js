const { z } = require('zod');

const TipoCobertura = z.enum(['RESPONSABILIDAD_CIVIL','TERCEROS_COMPLETO','TODO_RIESGO','OTRO']);
const EstadoSeguro  = z.enum(['VIGENTE','VENCIDO','CANCELADO']);

const createSeguroSchema = z.object({
  aseguradora:   z.string().min(1, 'Requerido'),
  numeroPoliza:  z.string().min(1, 'Requerido'),
  tipoCobertura: TipoCobertura.default('TODO_RIESGO'),
  vigenciaDesde: z.string().datetime({ offset: true }),
  vigenciaHasta: z.string().datetime({ offset: true }),
  monto:         z.number().positive().optional(),
  urlDocumento:  z.string().optional(),
  observaciones: z.string().optional(),
});

const updateSeguroSchema = z.object({
  aseguradora:   z.string().min(1).optional(),
  tipoCobertura: TipoCobertura.optional(),
  vigenciaDesde: z.string().datetime({ offset: true }).optional(),
  vigenciaHasta: z.string().datetime({ offset: true }).optional(),
  monto:         z.number().positive().optional(),
  urlDocumento:  z.string().optional().nullable(),
  observaciones: z.string().optional(),
  estado:        EstadoSeguro.optional(),
}).refine(d => Object.keys(d).length > 0, { message: 'Se requiere al menos un campo' });

module.exports = { createSeguroSchema, updateSeguroSchema };
