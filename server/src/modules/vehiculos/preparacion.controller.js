const preparacionService = require('./preparacion.service');
const { ok } = require('../../shared/utils/response.helper');

const getByVehiculo = async (req, res) => {
  const preps = await preparacionService.getByVehiculo(req.params.id);
  return ok(res, preps);
};

const create = async (req, res) => {
  const prep = await preparacionService.create(req.params.id, req.body, req.user.sub);
  return ok(res, prep);
};

// req.params.id       = vehiculoId
// req.params.prepId   = preparacionId
const update = async (req, res) => {
  const prep = await preparacionService.update(req.params.prepId, req.params.id, req.body);
  return ok(res, prep);
};

module.exports = { getByVehiculo, create, update };
