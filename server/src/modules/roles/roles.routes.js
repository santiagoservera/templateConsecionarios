const { Router } = require('express');
const rolesController = require('./roles.controller');
const { authMiddleware } = require('../../shared/middleware/auth.middleware');
const { authorize }      = require('../../shared/middleware/role.middleware');
const { validate }       = require('../../shared/validators/validate');
const { createRolSchema, updateRolSchema } = require('./roles.validator');

const router = Router();

router.use(authMiddleware);

// Lectura disponible para ADMIN y GERENTE (necesario para asignar roles a usuarios)
router.get('/',    authorize('ADMIN', 'GERENTE'), rolesController.getAll);
router.get('/:id', authorize('ADMIN', 'GERENTE'), rolesController.getById);

// Escritura exclusiva de ADMIN
router.post('/',     authorize('ADMIN'), validate(createRolSchema), rolesController.create);
router.patch('/:id', authorize('ADMIN'), validate(updateRolSchema), rolesController.update);
router.delete('/:id', authorize('ADMIN'), rolesController.remove);

module.exports = router;
