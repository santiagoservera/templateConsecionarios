const { Router } = require('express');
const authController = require('./auth.controller');
const { authMiddleware } = require('../../shared/middleware/auth.middleware');
const { validate } = require('../../shared/validators/validate');
const { loginSchema, refreshSchema } = require('./auth.validator');

const router = Router();

// POST /api/v1/auth/login
router.post('/login', validate(loginSchema), authController.login);

// POST /api/v1/auth/refresh
router.post('/refresh', validate(refreshSchema), authController.refresh);

// GET /api/v1/auth/me  (protegida)
router.get('/me', authMiddleware, authController.me);

module.exports = router;
