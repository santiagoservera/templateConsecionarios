const rolesService = require('./roles.service');
const { ok } = require('../../shared/utils/response.helper');

const getAll = async (req, res) => {
  const roles = await rolesService.getAll();
  return ok(res, roles);
};

const getById = async (req, res) => {
  const rol = await rolesService.getById(req.params.id);
  return ok(res, rol);
};

const create = async (req, res) => {
  const rol = await rolesService.create(req.body);
  return ok(res, rol);
};

const update = async (req, res) => {
  const rol = await rolesService.update(req.params.id, req.body);
  return ok(res, rol);
};

const remove = async (req, res) => {
  await rolesService.remove(req.params.id);
  return ok(res, null);
};

module.exports = { getAll, getById, create, update, remove };
