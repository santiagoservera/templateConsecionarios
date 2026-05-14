const { Router } = require('express');
const controller = require('./planes-pago.controller');
const { authMiddleware } = require('../../shared/middleware/auth.middleware');
const { authorize }      = require('../../shared/middleware/role.middleware');
const { validate }       = require('../../shared/validators/validate');
const { createPlanSchema, updatePlanSchema, cobrarCuotaSchema, entregarAutoSchema } = require('./planes-pago.validator');

const router = Router();
router.use(authMiddleware);

router.get('/',    authorize('ADMIN','GERENTE','VENDEDOR','CAJERO'), controller.getAll);
router.get('/:id', authorize('ADMIN','GERENTE','VENDEDOR','CAJERO'), controller.getById);

router.post('/',
  authorize('ADMIN','GERENTE','VENDEDOR'),
  validate(createPlanSchema),
  controller.create
);
router.patch('/:id',
  authorize('ADMIN','GERENTE'),
  validate(updatePlanSchema),
  controller.update
);

// Cobrar una cuota (CAJERO puede hacerlo)
router.post('/:id/cobrar-cuota',
  authorize('ADMIN','GERENTE','VENDEDOR','CAJERO'),
  validate(cobrarCuotaSchema),
  controller.cobrarCuota
);

// Entregar el auto (solo GERENTE/ADMIN)
router.post('/:id/entregar',
  authorize('ADMIN','GERENTE'),
  validate(entregarAutoSchema),
  controller.entregarAuto
);

module.exports = router;
