const { z } = require('zod');

const EtapaLead = z.enum(['NUEVO', 'CONTACTADO', 'INTERESADO', 'NEGOCIACION', 'GANADO', 'PERDIDO']);

const createLeadSchema = z.object({
  clienteId:         z.number().int().positive('Requerido'),
  vendedorId:        z.number().int().positive().optional(), // Si no viene, se usa req.user.sub
  vehiculoInteresId: z.number().int().positive().optional().nullable(),
  etapa:             EtapaLead.default('NUEVO'),
  origen:            z.string().optional(),
  notas:             z.string().optional(),
  proximoContacto:   z.string().optional().nullable(), // ISO 8601
});

const updateLeadSchema = createLeadSchema.partial();

const updateEtapaSchema = z.object({
  etapa: EtapaLead,
  notas: z.string().optional(), // Actualizar notas en el mismo paso es conveniente
});

module.exports = { createLeadSchema, updateLeadSchema, updateEtapaSchema };
