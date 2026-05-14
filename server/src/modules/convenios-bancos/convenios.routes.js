const { Router } = require('express');
const controller = require('./convenios.controller');
const { authMiddleware } = require('../../shared/middleware/auth.middleware');
const { authorize }      = require('../../shared/middleware/role.middleware');
const { validate }       = require('../../shared/validators/validate');
const { createConvenioSchema, updateConvenioSchema, upsertPlanesSchema } = require('./convenios.validator');

const router = Router();

router.use(authMiddleware);

// Lectura: todos los roles (necesario para el wizard de venta)
router.get('/',    authorize('ADMIN', 'GERENTE', 'VENDEDOR', 'ASESOR'), controller.getAll);
router.get('/:id', authorize('ADMIN', 'GERENTE', 'VENDEDOR', 'ASESOR'), controller.getById);

// Escritura: solo ADMIN y GERENTE
router.post('/',            authorize('ADMIN', 'GERENTE'), validate(createConvenioSchema),  controller.create);
router.patch('/:id',        authorize('ADMIN', 'GERENTE'), validate(updateConvenioSchema),  controller.update);
router.put('/:id/planes',   authorize('ADMIN', 'GERENTE'), validate(upsertPlanesSchema),    controller.upsertPlanes);
router.delete('/:id',       authorize('ADMIN', 'GERENTE'),                                  controller.remove);

module.exports = router;
