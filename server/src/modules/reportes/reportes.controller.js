const reportesService = require('./reportes.service');
const { ok, fail } = require('../../shared/utils/response.helper');

/**
 * GET /api/v1/reportes/dashboard?rol=GERENTE|VENDEDOR[&vendedorId=N]
 *
 * - ADMIN/GERENTE siempre reciben el dashboard de gerente.
 * - VENDEDOR recibe el suyo propio (vendedorId del token).
 * - Si un ADMIN/GERENTE pasa ?rol=VENDEDOR&vendedorId=N, puede ver el
 *   dashboard de un vendedor específico.
 */
const dashboard = async (req, res) => {
  const { rol: rolQuery, vendedorId: vendedorIdQuery } = req.query;
  const rolEfectivo = rolQuery?.toUpperCase() || req.user.rol;

  if (rolEfectivo === 'ADMIN' || rolEfectivo === 'GERENTE') {
    const data = await reportesService.getDashboardGerente();
    return ok(res, data);
  }

  if (rolEfectivo === 'VENDEDOR') {
    // Si el usuario autenticado es VENDEDOR, solo puede ver su propio dashboard
    const vendedorId = req.user.rol === 'VENDEDOR'
      ? req.user.sub
      : (vendedorIdQuery ?? req.user.sub);

    const data = await reportesService.getDashboardVendedor(vendedorId);
    return ok(res, data);
  }

  return fail(res, `Rol '${rolEfectivo}' no tiene dashboard configurado`, 400);
};

const mensual = async (req, res) => {
  const data = await reportesService.getReporteMensual(req.query.year);
  return ok(res, data);
};

const alertas = async (req, res, next) => {
  try { ok(res, await reportesService.getAlertas()) } catch (e) { next(e) }
};

module.exports = { dashboard, mensual, alertas };
