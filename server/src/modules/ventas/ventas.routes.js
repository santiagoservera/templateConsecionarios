const { Router } = require('express');

// Controladores
const ventasController     = require('./ventas.controller');
const documentosController = require('./documentos.controller');

// Middlewares
const { authMiddleware } = require('../../shared/middleware/auth.middleware');
const { authorize }      = require('../../shared/middleware/role.middleware');
const { validate }       = require('../../shared/validators/validate');

// Validators
const {
  createVentaSchema,
  updateEstadoSchema,
  createPermutaSchema,
  createFinanciamientoSchema,
} = require('./ventas.validator');
const { createDocumentoSchema } = require('./documentos.validator');

const router = Router();

router.use(authMiddleware);

// ── Ventas CRUD ────────────────────────────────────────────────────────────────
// Lectura: cualquier usuario autenticado
router.get('/',    ventasController.getAll);
router.get('/:id', ventasController.getById);

// ASESOR solo puede ver ventas, no crearlas ni modificarlas
const soloOperadores = authorize('ADMIN', 'GERENTE', 'VENDEDOR');

router.post('/',
  soloOperadores,
  validate(createVentaSchema),
  ventasController.create);

router.patch('/:id/estado',
  soloOperadores,
  validate(updateEstadoSchema),
  ventasController.updateEstado);

router.post('/:id/permuta',
  soloOperadores,
  validate(createPermutaSchema),
  ventasController.createPermuta);

router.post('/:id/financiamiento',
  soloOperadores,
  validate(createFinanciamientoSchema),
  ventasController.createFinanciamiento);

router.post('/:id/permuta/ingresar-stock',
  authorize('ADMIN', 'GERENTE'),
  ventasController.ingresarPermutaAlStock);

// ── Documentos de la venta ─────────────────────────────────────────────────────
router.get('/:id/documentos',
  documentosController.getByVenta);

router.post('/:id/documentos',
  soloOperadores,
  validate(createDocumentoSchema),
  documentosController.create);

module.exports = router;
