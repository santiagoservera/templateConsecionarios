const { Router } = require('express');

// Controladores
const vehiculosController  = require('./vehiculos.controller');
const gastosController     = require('./gastos.controller');
const preparacionController = require('./preparacion.controller');

// Middlewares
const { authMiddleware } = require('../../shared/middleware/auth.middleware');
const { authorize }      = require('../../shared/middleware/role.middleware');
const { validate }       = require('../../shared/validators/validate');

// Validators
const { createVehiculoSchema, updateVehiculoSchema }      = require('./vehiculos.validator');
const { createGastoSchema }                                = require('./gastos.validator');
const { createPreparacionSchema, updatePreparacionSchema } = require('./preparacion.validator');

const router = Router();

router.use(authMiddleware);

// ── Vehículos CRUD ─────────────────────────────────────────────────────────────
// Lectura: cualquier usuario autenticado puede consultar el stock
router.get('/',    vehiculosController.getAll);
router.get('/:id', vehiculosController.getById);

// costoReal: visible solo para ADMIN/GERENTE (contiene márgenes internos)
router.get('/:id/costoReal', authorize('ADMIN', 'GERENTE'), vehiculosController.getCostoReal);

// Escritura: solo ADMIN y GERENTE
router.post('/import', authorize('ADMIN', 'GERENTE'), vehiculosController.importMany);
router.post('/',       authorize('ADMIN', 'GERENTE'), validate(createVehiculoSchema), vehiculosController.create);
router.patch('/:id', authorize('ADMIN', 'GERENTE'), validate(updateVehiculoSchema), vehiculosController.update);
router.delete('/:id', authorize('ADMIN'),           vehiculosController.remove);

// ── Gastos del vehículo ────────────────────────────────────────────────────────
// Lectura: ADMIN y GERENTE (contiene costos internos)
router.get('/:id/gastos',
  authorize('ADMIN', 'GERENTE'),
  gastosController.getByVehiculo);

// Escritura: ADMIN y GERENTE
router.post('/:id/gastos',
  authorize('ADMIN', 'GERENTE'),
  validate(createGastoSchema),
  gastosController.create);

// ── Preparaciones del vehículo ─────────────────────────────────────────────────
// Lectura: cualquier usuario autenticado
router.get('/:id/preparacion', preparacionController.getByVehiculo);

// Crear nueva tarea de preparación: ADMIN, GERENTE, VENDEDOR
router.post('/:id/preparacion',
  authorize('ADMIN', 'GERENTE', 'VENDEDOR'),
  validate(createPreparacionSchema),
  preparacionController.create);

// Actualizar tarea (cambiar estado a EN_CURSO / COMPLETADO, etc.)
router.patch('/:id/preparacion/:prepId',
  authorize('ADMIN', 'GERENTE', 'VENDEDOR'),
  validate(updatePreparacionSchema),
  preparacionController.update);

module.exports = router;
