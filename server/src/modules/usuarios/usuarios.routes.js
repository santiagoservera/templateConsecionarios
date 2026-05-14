const { Router } = require('express');
const usuariosController = require('./usuarios.controller');
const { authMiddleware } = require('../../shared/middleware/auth.middleware');
const { authorize }      = require('../../shared/middleware/role.middleware');
const { validate }       = require('../../shared/validators/validate');
const { createUsuarioSchema, updateUsuarioSchema } = require('./usuarios.validator');

const router = Router();

router.use(authMiddleware);

// Solo ADMIN puede gestionar usuarios
const soloAdmin = authorize('ADMIN');

// ADMIN y GERENTE pueden consultar la lista de vendedores (para filtros en Ventas, etc.)
router.get('/vendedores',       authorize('ADMIN', 'GERENTE'), usuariosController.getVendedores);
router.get('/vendedores/stats', authorize('ADMIN', 'GERENTE'), usuariosController.getVendedoresStats);
router.patch('/vendedores/:id/comision', authorize('ADMIN'),   usuariosController.updateComisionPct);

router.get('/',      soloAdmin, usuariosController.getAll);
router.get('/:id',   soloAdmin, usuariosController.getById);
router.post('/',     soloAdmin, validate(createUsuarioSchema), usuariosController.create);
router.patch('/:id', soloAdmin, validate(updateUsuarioSchema), usuariosController.update);
router.delete('/:id', soloAdmin, usuariosController.remove);

module.exports = router;
