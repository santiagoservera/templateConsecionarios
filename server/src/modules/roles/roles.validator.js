const { z } = require('zod');

const SECCIONES = ['stock','indumentaria','clientes','leads','ventas','planesDNI','tramites','postventa','preparacion','caja','convenios','seguros','reportes','usuarios'];
const ACCIONES  = ['ver','crear','editar','eliminar'];

// Permisos como objeto { seccion: [acciones] }
const permisosObjectSchema = z.record(
  z.enum(SECCIONES),
  z.array(z.enum(ACCIONES))
);

const createRolSchema = z.object({
  nombre:      z.string().min(2, 'Mínimo 2 caracteres'),
  descripcion: z.string().optional(),
  permisos:    permisosObjectSchema,
});

const updateRolSchema = z.object({
  nombre:      z.string().min(2).optional(),
  descripcion: z.string().optional(),
  permisos:    permisosObjectSchema.optional(),
}).refine((data) => Object.keys(data).length > 0, {
  message: 'Se requiere al menos un campo para actualizar',
});

module.exports = { createRolSchema, updateRolSchema, SECCIONES, ACCIONES };
