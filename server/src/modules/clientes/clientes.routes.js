const { Router } = require('express');
const clientesController = require('./clientes.controller');
const { authMiddleware } = require('../../shared/middleware/auth.middleware');
const { authorize }      = require('../../shared/middleware/role.middleware');
const { validate }       = require('../../shared/validators/validate');
const { createClienteSchema, updateClienteSchema } = require('./clientes.validator');

const router = Router();

router.use(authMiddleware);

router.get('/',      clientesController.getAll);
router.get('/:id',   clientesController.getById);
router.post('/',     validate(createClienteSchema), clientesController.create);
router.patch('/:id', validate(updateClienteSchema), clientesController.update);
// Solo ADMIN y GERENTE pueden eliminar clientes
router.delete('/:id', authorize('ADMIN', 'GERENTE'), clientesController.remove);

module.exports = router;
