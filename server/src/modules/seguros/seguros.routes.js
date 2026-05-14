const { Router } = require('express');
const controller = require('./seguros.controller');
const { authMiddleware } = require('../../shared/middleware/auth.middleware');
const { authorize }      = require('../../shared/middleware/role.middleware');
const { validate }       = require('../../shared/validators/validate');
const { createSeguroSchema, updateSeguroSchema } = require('./seguros.validator');

const router = Router();
router.use(authMiddleware);

router.get('/',    authorize('ADMIN','GERENTE','VENDEDOR','CAJERO','ASESOR'), controller.getAll);
router.get('/:id', authorize('ADMIN','GERENTE','VENDEDOR','CAJERO','ASESOR'), controller.getById);
router.post('/',     authorize('ADMIN','GERENTE'), validate(createSeguroSchema), controller.create);
router.patch('/:id', authorize('ADMIN','GERENTE'), validate(updateSeguroSchema), controller.update);
router.delete('/:id',authorize('ADMIN'),                                        controller.remove);

module.exports = router;
