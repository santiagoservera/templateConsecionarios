const postventaService = require('./postventa.service');
const { ok } = require('../../shared/utils/response.helper');

const getAll = async (req, res) => {
  const { ventaId, clienteId, estado, tipo, fechaDesde, fechaHasta, page, pageSize } = req.query;
  const result = await postventaService.getAll({ ventaId, clienteId, estado, tipo, fechaDesde, fechaHasta, page, pageSize });
  return ok(res, result.items, result.meta);
};

const getById = async (req, res) => {
  const pv = await postventaService.getById(req.params.id);
  return ok(res, pv);
};

const create = async (req, res) => {
  const pv = await postventaService.create(req.body, req.user.sub);
  return ok(res, pv);
};

const update = async (req, res) => {
  const pv = await postventaService.update(req.params.id, req.body);
  return ok(res, pv);
};

module.exports = { getAll, getById, create, update };
