const { z } = require('zod');

const planSchema = z.object({
  cantCuotas:  z.number().int().positive('Debe ser positivo'),
  tasaInteres: z.number().min(0, 'Debe ser 0 o mayor'),
  activo:      z.boolean().default(true),
});

const createConvenioSchema = z.object({
  nombre:      z.string().min(1, 'Requerido'),
  descripcion: z.string().optional(),
  planes:      z.array(planSchema).min(1, 'Se requiere al menos un plan de cuotas'),
});

const updateConvenioSchema = z.object({
  nombre:      z.string().min(1).optional(),
  descripcion: z.string().optional(),
  activo:      z.boolean().optional(),
}).refine((d) => Object.keys(d).length > 0, { message: 'Se requiere al menos un campo' });

const upsertPlanesSchema = z.object({
  planes: z.array(planSchema).min(1, 'Se requiere al menos un plan'),
});

module.exports = { createConvenioSchema, updateConvenioSchema, upsertPlanesSchema };
