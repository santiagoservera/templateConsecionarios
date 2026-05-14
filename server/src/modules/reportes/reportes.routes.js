const { Router } = require('express');
const reportesController = require('./reportes.controller');
const { authMiddleware } = require('../../shared/middleware/auth.middleware');
const { authorize }      = require('../../shared/middleware/role.middleware');

const router = Router();

router.use(authMiddleware);

// Cada rol recibe la vista correspondiente a sus datos
router.get('/dashboard', reportesController.dashboard);
router.get('/mensual',   authorize('ADMIN', 'GERENTE'), reportesController.mensual);
router.get('/alertas',   authorize('ADMIN', 'GERENTE'), reportesController.alertas);

module.exports = router;
