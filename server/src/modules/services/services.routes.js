const { Router } = require('express');
const controller = require('./services.controller');
const { authMiddleware } = require('../../shared/middleware/auth.middleware');
const { authorize }      = require('../../shared/middleware/role.middleware');
const { validate }       = require('../../shared/validators/validate');
const { createServiceSchema, updateServiceSchema } = require('./services.validator');

const router = Router();

router.use(authMiddleware);

router.get('/',    authorize('ADMIN', 'GERENTE', 'VENDEDOR', 'ASESOR'), controller.getAll);
router.get('/:id', authorize('ADMIN', 'GERENTE', 'VENDEDOR', 'ASESOR'), controller.getById);
router.post('/',     authorize('ADMIN', 'GERENTE', 'VENDEDOR'), validate(createServiceSchema), controller.create);
router.patch('/:id', authorize('ADMIN', 'GERENTE', 'VENDEDOR'), validate(updateServiceSchema), controller.update);

module.exports = router;
