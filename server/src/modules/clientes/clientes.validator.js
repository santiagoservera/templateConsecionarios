const { z } = require('zod');

const OrigenCliente = z.enum(['VISITA', 'WHATSAPP', 'INSTAGRAM', 'REFERIDO', 'WEB', 'OTRO']);

const createClienteSchema = z.object({
  nombre:     z.string().min(1, 'Requerido'),
  apellido:   z.string().min(1, 'Requerido'),
  dniCuit:    z.string().optional(),
  telefono:   z.string().optional(),
  email:      z.string().email('Email inválido').optional().nullable(),
  direccion:  z.string().optional(),
  origen:     OrigenCliente.default('VISITA'),
  vendedorId: z.number().int().positive().optional(),
});

const updateClienteSchema = createClienteSchema.partial();

module.exports = { createClienteSchema, updateClienteSchema };
