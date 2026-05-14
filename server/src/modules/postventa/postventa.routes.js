const { Router } = require('express');
const postventaController = require('./postventa.controller');
const { authMiddleware } = require('../../shared/middleware/auth.middleware');
const { authorize }      = require('../../shared/middleware/role.middleware');
const { validate }       = require('../../shared/validators/validate');
const { createPostventaSchema, updatePostventaSchema } = require('./postventa.validator');

const router = Router();

router.use(authMiddleware);
// ASESOR no gestiona postventa
router.use(authorize('ADMIN', 'GERENTE', 'VENDEDOR'));

router.get('/',      postventaController.getAll);
router.get('/:id',   postventaController.getById);
router.post('/',     validate(createPostventaSchema), postventaController.create);
router.patch('/:id', validate(updatePostventaSchema), postventaController.update);

module.exports = router;
