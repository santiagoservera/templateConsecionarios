const { z } = require('zod');

const TipoPostventa   = z.enum(['GARANTIA', 'RECLAMO', 'CONSULTA', 'SEGUIMIENTO']);
const EstadoPostventa = z.enum(['ABIERTO', 'EN_GESTION', 'CERRADO']);

const createPostventaSchema = z.object({
  ventaId:       z.number().int().positive('Requerido'),
  clienteId:     z.number().int().positive('Requerido'),
  tipo:          TipoPostventa,
  descripcion:   z.string().min(1, 'Requerido'),
  estado:        EstadoPostventa.default('ABIERTO'),
  fechaContacto: z.string().optional().nullable(),
});

const updatePostventaSchema = z.object({
  tipo:            TipoPostventa.optional(),
  descripcion:     z.string().min(1).optional(),
  estado:          EstadoPostventa.optional(),
  fechaResolucion: z.string().optional().nullable(),
});

module.exports = { createPostventaSchema, updatePostventaSchema };
