const service = require('./categorias.service');
const { ok } = require('../../shared/utils/response.helper');

const getAll = async (req, res) => {
  const soloActivas = req.query.soloActivas !== 'false';
  const data = await service.getAll(soloActivas);
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
  return ok(res, { message: 'Categoría eliminada' });
};

module.exports = { getAll, create, update, remove };
