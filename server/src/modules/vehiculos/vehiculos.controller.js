const vehiculosService = require('./vehiculos.service');
const { ok } = require('../../shared/utils/response.helper');

const getAll = async (req, res) => {
  const { tipo, marca, q, estado, tipoStock, page, pageSize } = req.query;
  const result = await vehiculosService.getAll({ tipo, marca, q, estado, tipoStock, page, pageSize });
  return ok(res, result.items, result.meta);
};

const getById = async (req, res) => {
  const vehiculo = await vehiculosService.getById(req.params.id);
  return ok(res, vehiculo);
};

const create = async (req, res) => {
  const vehiculo = await vehiculosService.create(req.body);
  return ok(res, vehiculo);
};

const update = async (req, res) => {
  const vehiculo = await vehiculosService.update(req.params.id, req.body);
  return ok(res, vehiculo);
};

const remove = async (req, res) => {
  await vehiculosService.remove(req.params.id);
  return ok(res, null);
};

const getCostoReal = async (req, res) => {
  const costo = await vehiculosService.getCostoReal(req.params.id);
  return ok(res, costo);
};

const importMany = async (req, res, next) => {
  try {
    const { rows } = req.body;
    if (!Array.isArray(rows) || !rows.length)
      return res.status(400).json({ success: false, error: 'Se requiere un array de filas' });
    const result = await vehiculosService.importMany(rows);
    return ok(res, result);
  } catch (e) { next(e); }
};

module.exports = { getAll, getById, create, update, remove, getCostoReal, importMany };
