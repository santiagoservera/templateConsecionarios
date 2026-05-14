const service = require('./indumentaria.service');
const { ok } = require('../../shared/utils/response.helper');

const getAll = async (req, res) => {
  const { categoria, marca, q, talla, soloActivos, page, pageSize } = req.query;
  const { items, meta } = await service.getAll({ categoria, marca, q, talla, soloActivos, page, pageSize });
  return ok(res, items, meta);
};

const getById = async (req, res) => {
  const item = await service.getById(req.params.id);
  return ok(res, item);
};

const create = async (req, res) => {
  const item = await service.create(req.body);
  return ok(res, item);
};

const update = async (req, res) => {
  const item = await service.update(req.params.id, req.body);
  return ok(res, item);
};

const remove = async (req, res) => {
  await service.remove(req.params.id);
  return ok(res, { message: 'Ítem desactivado correctamente' });
};

const importMany = async (req, res, next) => {
  try {
    const { rows } = req.body;
    if (!Array.isArray(rows) || !rows.length)
      return res.status(400).json({ success: false, error: 'Se requiere un array de filas' });
    const result = await service.importMany(rows);
    return ok(res, result);
  } catch (e) { next(e); }
};

const vender = async (req, res, next) => {
  try {
    const { cantidad, sesionCajaId } = req.body;
    if (!cantidad || cantidad < 1)
      return res.status(400).json({ success: false, error: 'Cantidad inválida' });
    const result = await service.vender(req.params.id, { cantidad: Number(cantidad), sesionCajaId }, req.user.sub);
    return ok(res, result);
  } catch (e) { next(e); }
};

module.exports = { getAll, getById, create, update, remove, importMany, vender };
