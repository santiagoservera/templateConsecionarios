const { Router } = require('express');
const leadsController = require('./leads.controller');
const { authMiddleware } = require('../../shared/middleware/auth.middleware');
const { authorize }      = require('../../shared/middleware/role.middleware');
const { validate }       = require('../../shared/validators/validate');
const { createLeadSchema, updateLeadSchema, updateEtapaSchema } = require('./leads.validator');

const router = Router();

router.use(authMiddleware);
// ASESOR no puede gestionar leads (solo consulta stock y clientes)
router.use(authorize('ADMIN', 'GERENTE', 'VENDEDOR'));

router.get('/',      leadsController.getAll);
router.get('/:id',   leadsController.getById);
router.post('/',     validate(createLeadSchema),  leadsController.create);
router.patch('/:id', validate(updateLeadSchema),  leadsController.update);

// Endpoint dedicado para cambiar etapa (más semántico que un PATCH genérico)
router.patch('/:id/etapa', validate(updateEtapaSchema), leadsController.updateEtapa);

// Solo ADMIN y GERENTE pueden eliminar leads
router.delete('/:id', authorize('ADMIN', 'GERENTE'), leadsController.remove);

module.exports = router;
