const gastosService = require('./gastos.service');
const { ok } = require('../../shared/utils/response.helper');

const getByVehiculo = async (req, res) => {
  const gastos = await gastosService.getByVehiculo(req.params.id);
  return ok(res, gastos);
};

const create = async (req, res) => {
  const gasto = await gastosService.create(req.params.id, req.body, req.user.sub);
  return ok(res, gasto);
};

module.exports = { getByVehiculo, create };
