const jwt = require('jsonwebtoken');
const { fail } = require('../utils/response.helper');

/**
 * Verifica el Bearer token del header Authorization.
 * Si es válido, adjunta el payload decodificado en req.user:
 *   { sub: userId, rol, nombre, email, iat, exp }
 */
const authMiddleware = (req, res, next) => {
  const header = req.headers.authorization;

  if (!header?.startsWith('Bearer ')) {
    return fail(res, 'Token no proporcionado', 401);
  }

  const token = header.slice(7);

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return fail(res, 'Token expirado', 401);
    }
    return fail(res, 'Token inválido', 401);
  }
};

module.exports = { authMiddleware };
