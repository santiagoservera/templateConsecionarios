const service = require('./planes-pago.service');
const { ok } = require('../../shared/utils/response.helper');

const getAll = async (req, res) => {
  const { clienteId, vendedorId, estado, page, pageSize } = req.query;
  const { items, meta } = await service.getAll({ clienteId, vendedorId, estado, page, pageSize });
  return ok(res, items, meta);
};

const getById = async (req, res) => {
  const data = await service.getById(req.params.id);
  return ok(res, data);
};

const create = async (req, res) => {
  const data = await service.create(req.body, req.user.sub);
  return ok(res, data);
};

const update = async (req, res) => {
  const data = await service.update(req.params.id, req.body);
  return ok(res, data);
};

const cobrarCuota = async (req, res) => {
  const data = await service.cobrarCuota(req.params.id, req.body, req.user.sub);
  return ok(res, data);
};

const entregarAuto = async (req, res) => {
  const data = await service.entregarAuto(req.params.id, req.body, req.user.sub);
  return ok(res, data);
};

module.exports = { getAll, getById, create, update, cobrarCuota, entregarAuto };
