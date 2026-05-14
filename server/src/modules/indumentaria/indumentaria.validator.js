const { z } = require('zod');

const CategoriaEnum = z.enum(['Ropa', 'Accesorio', 'Calzado', 'Merchandising', 'Otro']);
const TallaEnum     = z.enum(['XS', 'S', 'M', 'L', 'XL', 'XXL', 'UNICA']).optional();

const createIndumentariaSchema = z.object({
  nombre:      z.string().min(1, 'Requerido'),
  descripcion: z.string().optional(),
  categoria:   CategoriaEnum.default('Otro'),
  talla:       TallaEnum,
  color:       z.string().optional(),
  marca:       z.string().optional(),
  cantidad:    z.number().int().min(0).default(0),
  precioCosto: z.number().positive('Debe ser positivo'),
  precioVenta: z.number().positive('Debe ser positivo'),
  fotosJson:   z.string().optional(),
});

const updateIndumentariaSchema = createIndumentariaSchema
  .partial()
  .extend({ activo: z.boolean().optional() })
  .refine((d) => Object.keys(d).length > 0, { message: 'Se requiere al menos un campo' });

module.exports = { createIndumentariaSchema, updateIndumentariaSchema };
