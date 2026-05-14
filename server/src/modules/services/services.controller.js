const service = require('./services.service');
const { ok } = require('../../shared/utils/response.helper');

const getAll = async (req, res) => {
  const { ventaId, vehiculoId, estado, tipoService, soloActivos, proximosDias, mes, anio, fechaDesde, fechaHasta, page, pageSize } = req.query;
  const { items, meta } = await service.getAll({ ventaId, vehiculoId, estado, tipoService, soloActivos, proximosDias, mes, anio, fechaDesde, fechaHasta, page, pageSize });
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

module.exports = { getAll, getById, create, update };
