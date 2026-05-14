const { Router } = require('express');
const controller     = require('./facturacion.controller');
const { authMiddleware } = require('../../shared/middleware/auth.middleware');
const { authorize }      = require('../../shared/middleware/role.middleware');

const router = Router();
router.use(authMiddleware);

// Listado de todas las facturas (ADMIN / GERENTE)
router.get('/', authorize('ADMIN', 'GERENTE'), controller.getAll);

// Factura de una venta específica (cualquier operador)
router.get('/venta/:ventaId', authorize('ADMIN', 'GERENTE', 'VENDEDOR'), controller.getByVenta);

// Emitir factura para una venta (ADMIN / GERENTE)
router.post('/venta/:ventaId', authorize('ADMIN', 'GERENTE'), controller.emitir);

// Descargar PDF de una factura emitida
router.get('/venta/:ventaId/pdf', authorize('ADMIN', 'GERENTE', 'VENDEDOR'), controller.descargarPDF);

module.exports = router;
