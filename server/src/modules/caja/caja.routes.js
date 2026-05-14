const { Router } = require('express');
const controller = require('./caja.controller');
const { authMiddleware } = require('../../shared/middleware/auth.middleware');
const { authorize }      = require('../../shared/middleware/role.middleware');
const { validate }       = require('../../shared/validators/validate');
const { abrirSesionSchema, cerrarSesionSchema, movimientoSchema, ventaIndumentariaSchema } = require('./caja.validator');

const router = Router();
router.use(authMiddleware);

const CAJA_ROLES = ['ADMIN','GERENTE','CAJERO'];

router.get('/',         authorize(...CAJA_ROLES), controller.getSesiones);
router.get('/activa',   authorize(...CAJA_ROLES), controller.getSesionActiva);
router.get('/:id',      authorize(...CAJA_ROLES), controller.getSesionById);

router.post('/abrir',   authorize(...CAJA_ROLES), validate(abrirSesionSchema),   controller.abrirSesion);
router.post('/:id/cerrar', authorize(...CAJA_ROLES), validate(cerrarSesionSchema), controller.cerrarSesion);
router.post('/:id/movimiento', authorize(...CAJA_ROLES), validate(movimientoSchema), controller.registrarMovimiento);
router.post('/:id/vender-indumentaria', authorize(...CAJA_ROLES), validate(ventaIndumentariaSchema), controller.venderIndumentaria);

module.exports = router;
