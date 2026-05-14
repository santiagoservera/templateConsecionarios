const { Router } = require('express');
const controller = require('./consignacion.controller');
const { authMiddleware } = require('../../shared/middleware/auth.middleware');
const { authorize }      = require('../../shared/middleware/role.middleware');
const { validate }       = require('../../shared/validators/validate');
const { createConsignacionSchema, updateConsignacionSchema } = require('./consignacion.validator');

const router = Router();

router.use(authMiddleware);

router.get('/',     authorize('ADMIN', 'GERENTE', 'VENDEDOR'),                   controller.getAll);
router.get('/:id',  authorize('ADMIN', 'GERENTE', 'VENDEDOR'),                   controller.getById);
router.post('/',    authorize('ADMIN', 'GERENTE', 'VENDEDOR'), validate(createConsignacionSchema), controller.create);
router.patch('/:id',authorize('ADMIN', 'GERENTE'),             validate(updateConsignacionSchema), controller.update);

module.exports = router;
