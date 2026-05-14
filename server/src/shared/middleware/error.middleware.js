const { fail } = require('../utils/response.helper');

/**
 * Manejador global de errores de Express (4 parámetros obligatorios).
 * Debe registrarse al final de todos los app.use() en app.js.
 *
 * Cubre:
 *  - Errores Prisma conocidos (P2002 unique constraint, P2025 not found)
 *  - Errores con statusCode/status personalizado lanzados desde los services
 *  - Cualquier otro error inesperado (500)
 */
// eslint-disable-next-line no-unused-vars
const errorMiddleware = (err, req, res, next) => {
  console.error(`[ERROR] ${req.method} ${req.url} →`, err.message);

  // Violación de unique constraint (Prisma)
  if (err.code === 'P2002') {
    const field = err.meta?.target?.join(', ') ?? 'campo';
    return fail(res, `Ya existe un registro con ese valor en: ${field}`, 409);
  }

  // Registro no encontrado (Prisma)
  if (err.code === 'P2025') {
    return fail(res, 'Registro no encontrado', 404);
  }

  const status = err.statusCode || err.status || 500;
  const message =
    status < 500
      ? err.message
      : process.env.NODE_ENV === 'production'
        ? 'Error interno del servidor'
        : err.message || 'Error interno del servidor';

  return fail(res, message, status);
};

module.exports = { errorMiddleware };
