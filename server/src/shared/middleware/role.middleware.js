const { fail } = require('../utils/response.helper');

/**
 * Middleware factory que restringe el acceso a los roles indicados.
 * Siempre debe usarse después de authMiddleware (requiere req.user).
 *
 * Uso:
 *   router.get('/ruta', authMiddleware, authorize('ADMIN', 'GERENTE'), controller.accion)
 */
const authorize = (...roles) =>
  (req, res, next) => {
    if (!req.user) {
      return fail(res, 'No autenticado', 401);
    }
    if (!roles.includes(req.user.rol)) {
      return fail(res, 'Sin permisos suficientes', 403);
    }
    next();
  };

module.exports = { authorize };
