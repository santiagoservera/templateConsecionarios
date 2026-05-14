const { Router } = require('express');
const controller = require('./configuracion.controller');
const { authMiddleware } = require('../../shared/middleware/auth.middleware');
const { authorize }      = require('../../shared/middleware/role.middleware');
const { validate }       = require('../../shared/validators/validate');
const { updateConfigSchema } = require('./configuracion.validator');

const router = Router();

router.use(authMiddleware);

// Lectura disponible para ADMIN y GERENTE
router.get('/',    authorize('ADMIN', 'GERENTE'), controller.get);
// Solo ADMIN puede modificar
router.patch('/',  authorize('ADMIN'), validate(updateConfigSchema), controller.update);

module.exports = router;
