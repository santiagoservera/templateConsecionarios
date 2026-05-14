const express = require('express');
const cors = require('cors');

// ── Routers ───────────────────────────────────────────────────────────────────
const authRouter        = require('./modules/auth/auth.routes');
const usuariosRouter    = require('./modules/usuarios/usuarios.routes');
const rolesRouter       = require('./modules/roles/roles.routes');
const clientesRouter    = require('./modules/clientes/clientes.routes');
const vehiculosRouter   = require('./modules/vehiculos/vehiculos.routes');
const leadsRouter       = require('./modules/leads/leads.routes');
const ventasRouter      = require('./modules/ventas/ventas.routes');
const postventaRouter   = require('./modules/postventa/postventa.routes');
const reportesRouter       = require('./modules/reportes/reportes.routes');
const indumentariaRouter   = require('./modules/indumentaria/indumentaria.routes');
const conveniosRouter      = require('./modules/convenios-bancos/convenios.routes');
const servicesRouter       = require('./modules/services/services.routes');
const planesPagoRouter     = require('./modules/planes-pago/planes-pago.routes');
const cajaRouter           = require('./modules/caja/caja.routes');
const segurosRouter        = require('./modules/seguros/seguros.routes');
const consignacionRouter   = require('./modules/consignacion/consignacion.routes');
const comisionesRouter     = require('./modules/comisiones/comisiones.routes');
const configuracionRouter  = require('./modules/configuracion/configuracion.routes');
const facturacionRouter    = require('./modules/facturacion/facturacion.routes');

// ── Middleware de error ────────────────────────────────────────────────────────
const { errorMiddleware } = require('./shared/middleware/error.middleware');

const app = express();

// ── Middlewares globales ───────────────────────────────────────────────────────
app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
  })
);
app.use(express.json());

// ── Health check ───────────────────────────────────────────────────────────────
app.get('/api/v1/health', (_req, res) => {
  res.json({ success: true, data: { status: 'ok', version: '1.0.0' } });
});

// ── Rutas por módulo ───────────────────────────────────────────────────────────
app.use('/api/v1/auth',       authRouter);
app.use('/api/v1/usuarios',   usuariosRouter);
app.use('/api/v1/roles',      rolesRouter);
app.use('/api/v1/clientes',   clientesRouter);
app.use('/api/v1/vehiculos',  vehiculosRouter);
app.use('/api/v1/leads',      leadsRouter);
app.use('/api/v1/ventas',     ventasRouter);
app.use('/api/v1/postventa',  postventaRouter);
app.use('/api/v1/reportes',     reportesRouter);
app.use('/api/v1/indumentaria',     indumentariaRouter);
app.use('/api/v1/convenios-bancos', conveniosRouter);
app.use('/api/v1/services',         servicesRouter);
app.use('/api/v1/planes-pago',      planesPagoRouter);
app.use('/api/v1/caja',             cajaRouter);
app.use('/api/v1/seguros',          segurosRouter);
app.use('/api/v1/consignacion',     consignacionRouter);
app.use('/api/v1/comisiones',       comisionesRouter);
app.use('/api/v1/configuracion',    configuracionRouter);
app.use('/api/v1/facturacion',      facturacionRouter);

// ── Error handler global (siempre al final) ────────────────────────────────────
app.use(errorMiddleware);

module.exports = app;
