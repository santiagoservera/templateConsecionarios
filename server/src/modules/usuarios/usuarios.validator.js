const { z } = require('zod');

const Rol = z.enum(['ADMIN', 'GERENTE', 'VENDEDOR', 'ASESOR']);

const createUsuarioSchema = z.object({
  nombre:       z.string().min(2, 'Mínimo 2 caracteres'),
  email:        z.string().email('Email inválido'),
  password:     z.string().min(8, 'Mínimo 8 caracteres'),
  rol:          Rol.default('VENDEDOR'),
  permisosJson: z.string().optional(),
});

const updateUsuarioSchema = z
  .object({
    nombre:       z.string().min(2).optional(),
    email:        z.string().email().optional(),
    password:     z.string().min(8).optional(),
    rol:          Rol.optional(),
    activo:       z.boolean().optional(),
    permisosJson: z.string().optional(),
    rolId:        z.number().int().positive().nullable().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Se requiere al menos un campo para actualizar',
  });

module.exports = { createUsuarioSchema, updateUsuarioSchema };
