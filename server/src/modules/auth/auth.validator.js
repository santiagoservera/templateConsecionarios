const { z } = require('zod');

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'La contraseña es requerida'),
});

const refreshSchema = z.object({
  refreshToken: z.string().min(1, 'refreshToken es requerido'),
});

module.exports = { loginSchema, refreshSchema };
