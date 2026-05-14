const { z } = require('zod');

const updateConfigSchema = z.object({
  nombreConcesionaria: z.string().min(1).optional(),
  comisionPctDefault:  z.number().min(0).max(100).optional(),
  moneda:              z.string().min(1).max(3).optional(),
  direccion:           z.string().optional().nullable(),
  telefono:            z.string().optional().nullable(),
  email:               z.string().email().optional().nullable(),
  afipCuit:            z.string().optional().nullable(),
  afipPuntoVenta:      z.number().int().min(1).max(9999).optional(),
  afipCondicionIva:    z.enum(['RESPONSABLE_INSCRIPTO', 'MONOTRIBUTO']).optional(),
  afipIvaAlicuota:     z.number().min(0).max(27).optional(),
}).refine((d) => Object.keys(d).length > 0, { message: 'Se requiere al menos un campo' });

module.exports = { updateConfigSchema };
