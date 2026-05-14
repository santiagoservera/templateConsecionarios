const { Router } = require('express');
const controller = require('./comisiones.controller');
const { authMiddleware } = require('../../shared/middleware/auth.middleware');
const { authorize }      = require('../../shared/middleware/role.middleware');
const { validate }       = require('../../shared/validators/validate');
const { updateComisionSchema, liquidarLoteSchema } = require('./comisiones.validator');

const router = Router();

router.use(authMiddleware);

router.get('/',             authorize('ADMIN', 'GERENTE', 'VENDEDOR'), controller.getAll);
router.get('/:id',          authorize('ADMIN', 'GERENTE', 'VENDEDOR'), controller.getById);
router.patch('/:id',        authorize('ADMIN', 'GERENTE'), validate(updateComisionSchema), controller.update);
router.post('/liquidar',    authorize('ADMIN', 'GERENTE'), validate(liquidarLoteSchema),   controller.liquidarLote);

module.exports = router;
