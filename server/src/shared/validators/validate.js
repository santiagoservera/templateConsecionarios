/**
 * Middleware factory que valida req.body contra un schema Zod.
 * Si el schema pasa, reemplaza req.body con el valor parseado (strip de campos extra).
 * Si falla, responde 422 con los errores por campo.
 *
 * Uso:
 *   router.post('/ruta', validate(miSchema), controller.accion)
 */
const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);
  if (!result.success) {
    return res.status(422).json({
      success: false,
      error: 'Datos inválidos',
      details: result.error.flatten().fieldErrors,
    });
  }
  req.body = result.data;
  next();
};

module.exports = { validate };
