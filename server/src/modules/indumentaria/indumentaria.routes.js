const { Router } = require('express');
const controller     = require('./indumentaria.controller');
const catController  = require('./categorias.controller');
const { authMiddleware } = require('../../shared/middleware/auth.middleware');
const { authorize }      = require('../../shared/middleware/role.middleware');
const { validate }       = require('../../shared/validators/validate');
const { createIndumentariaSchema, updateIndumentariaSchema } = require('./indumentaria.validator');
const { z } = require('zod');

const router = Router();
router.use(authMiddleware);

// ── Categorías (sub-recurso) ───────────────────────────────────────────────────
const categoriaSchema = z.object({ nombre: z.string().min(1, 'Requerido') });
const updateCatSchema = z.object({
  nombre: z.string().min(1).optional(),
  activo: z.boolean().optional(),
}).refine(d => Object.keys(d).length > 0, { message: 'Se requiere al menos un campo' });

router.get('/categorias',        authorize('ADMIN','GERENTE','VENDEDOR','ASESOR','CAJERO'), catController.getAll);
router.post('/categorias',       authorize('ADMIN','GERENTE','CAJERO'), validate(categoriaSchema),  catController.create);
router.patch('/categorias/:id',  authorize('ADMIN','GERENTE','CAJERO'), validate(updateCatSchema),  catController.update);
router.delete('/categorias/:id', authorize('ADMIN','GERENTE','CAJERO'),                             catController.remove);

// ── Indumentaria ───────────────────────────────────────────────────────────────
router.get('/',    authorize('ADMIN','GERENTE','VENDEDOR','ASESOR','CAJERO'), controller.getAll);
router.get('/:id', authorize('ADMIN','GERENTE','VENDEDOR','ASESOR','CAJERO'), controller.getById);
router.post('/import',      authorize('ADMIN','GERENTE','CAJERO'), controller.importMany);
router.post('/:id/vender', authorize('ADMIN','GERENTE','VENDEDOR','CAJERO'), controller.vender);
router.post('/',       authorize('ADMIN','GERENTE','CAJERO'), validate(createIndumentariaSchema), controller.create);
router.patch('/:id',  authorize('ADMIN','GERENTE','CAJERO'), validate(updateIndumentariaSchema), controller.update);
router.delete('/:id', authorize('ADMIN','GERENTE','CAJERO'), controller.remove);

module.exports = router;
