const { z } = require('zod');

const TipoCobertura = z.enum(['RESPONSABILIDAD_CIVIL','TERCEROS_COMPLETO','TODO_RIESGO','OTRO']);
const AplicaA       = z.enum(['AUTO','MOTO','AMBOS']);

const planSchema = z.object({
  codigoPlan:    z.string().optional().nullable(),
  tipoCobertura: TipoCobertura.default('TODO_RIESGO'),
  aplicaA:       AplicaA.default('AMBOS'),
  precioMensual: z.number().positive().optional().nullable(),
  precioAnual:   z.number().positive().optional().nullable(),
  sumaCubierta:  z.string().optional().nullable(),
  descripcion:   z.string().optional().nullable(),
  urlDocumento:  z.string().optional().nullable(),
  activo:        z.boolean().default(true),
});

const createAseguradoraSchema = z.object({
  nombre:      z.string().min(1, 'Requerido'),
  descripcion: z.string().optional().nullable(),
  contacto:    z.string().optional().nullable(),
  planes:      z.array(planSchema).optional().default([]),
});

const updateAseguradoraSchema = z.object({
  nombre:      z.string().min(1).optional(),
  descripcion: z.string().optional().nullable(),
  contacto:    z.string().optional().nullable(),
  activo:      z.boolean().optional(),
}).refine(d => Object.keys(d).length > 0, { message: 'Se requiere al menos un campo' });

const upsertPlanesSchema = z.object({
  planes: z.array(planSchema).min(0),
});

module.exports = { createAseguradoraSchema, updateAseguradoraSchema, upsertPlanesSchema };
