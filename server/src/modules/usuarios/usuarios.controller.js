const usuariosService = require('./usuarios.service');
const { ok } = require('../../shared/utils/response.helper');

const getAll = async (req, res) => {
  const { page, pageSize } = req.query;
  const result = await usuariosService.getAll({ page, pageSize });
  return ok(res, result.items, result.meta);
};

const getById = async (req, res) => {
  const usuario = await usuariosService.getById(req.params.id);
  return ok(res, usuario);
};

const create = async (req, res) => {
  const usuario = await usuariosService.create(req.body);
  return ok(res, usuario);
};

const update = async (req, res) => {
  const usuario = await usuariosService.update(req.params.id, req.body);
  return ok(res, usuario);
};

const remove = async (req, res) => {
  const usuario = await usuariosService.remove(req.params.id);
  return ok(res, usuario);
};

const getVendedores = async (req, res) => {
  const vendedores = await usuariosService.getVendedores();
  return ok(res, vendedores);
};

const getVendedoresStats = async (req, res, next) => {
  try { ok(res, await usuariosService.getVendedoresStats()) } catch (e) { next(e) }
};

const updateComisionPct = async (req, res, next) => {
  try {
    const { comisionPct } = req.body;
    ok(res, await usuariosService.updateComisionPct(req.params.id, comisionPct ?? null))
  } catch (e) { next(e) }
};

module.exports = { getAll, getById, create, update, remove, getVendedores, getVendedoresStats, updateComisionPct };
