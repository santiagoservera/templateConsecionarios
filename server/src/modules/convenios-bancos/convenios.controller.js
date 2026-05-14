const service = require('./convenios.service');
const { ok } = require('../../shared/utils/response.helper');

const getAll = async (req, res) => {
  const soloActivos = req.query.soloActivos !== 'false';
  const data = await service.getAll(soloActivos);
  return ok(res, data);
};

const getById = async (req, res) => {
  const data = await service.getById(req.params.id);
  return ok(res, data);
};

const create = async (req, res) => {
  const data = await service.create(req.body);
  return ok(res, data);
};

const update = async (req, res) => {
  const data = await service.update(req.params.id, req.body);
  return ok(res, data);
};

const remove = async (req, res) => {
  await service.remove(req.params.id);
  return ok(res, { message: 'Convenio desactivado correctamente' });
};

const upsertPlanes = async (req, res) => {
  const data = await service.upsertPlanes(req.params.id, req.body.planes);
  return ok(res, data);
};

module.exports = { getAll, getById, create, update, remove, upsertPlanes };
