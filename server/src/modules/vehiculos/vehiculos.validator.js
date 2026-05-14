const { z } = require('zod');

const TipoVehiculo   = z.enum(['AUTO', 'MOTO']);
const TipoStock      = z.enum(['NUEVO', 'USADO', 'CONSIGNACION']);
const EstadoVehiculo = z.enum(['DISPONIBLE', 'RESERVADO', 'VENDIDO', 'EN_CONSIGNACION']);

const createVehiculoSchema = z.object({
  tipo:        TipoVehiculo,
  marca:       z.string().min(1, 'Requerido'),
  modelo:      z.string().min(1, 'Requerido'),
  anio:        z.number().int().min(1900).max(new Date().getFullYear() + 2),
  version:     z.string().optional(),
  color:       z.string().optional(),
  vinChasis:   z.string().optional(),
  patente:     z.string().optional(),
  km:          z.number().int().min(0).default(0),
  combustible: z.string().optional(),
  transmision: z.string().optional(),
  tipoStock:   TipoStock,
  precioCosto:  z.number().positive('Debe ser positivo'),
  precioVenta:  z.number().positive('Debe ser positivo'),
  precioMinimo: z.number().positive().optional(),
  fotosJson:   z.string().optional(),
});

// Para PATCH: todos los campos opcionales + permite cambiar estado y flag preparacion
const updateVehiculoSchema = createVehiculoSchema
  .partial()
  .extend({
    estado:        EstadoVehiculo.optional(),
    enPreparacion: z.boolean().optional(),
  });

module.exports = { createVehiculoSchema, updateVehiculoSchema };
