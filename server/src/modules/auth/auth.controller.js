const authService = require('./auth.service');
const { ok } = require('../../shared/utils/response.helper');

/**
 * POST /api/v1/auth/login
 * Body validado por loginSchema antes de llegar aquí.
 */
const login = async (req, res) => {
  const { email, password } = req.body;
  const result = await authService.login(email, password);
  return ok(res, result);
};

/**
 * POST /api/v1/auth/refresh
 * Body validado por refreshSchema antes de llegar aquí.
 */
const refresh = async (req, res) => {
  const { refreshToken } = req.body;
  const result = await authService.refresh(refreshToken);
  return ok(res, result);
};

/**
 * GET /api/v1/auth/me
 * Requiere authMiddleware — req.user.sub contiene el userId.
 */
const me = async (req, res) => {
  const user = await authService.getMe(req.user.sub);
  return ok(res, user);
};

module.exports = { login, refresh, me };
