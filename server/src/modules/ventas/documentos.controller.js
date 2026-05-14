const documentosService = require('./documentos.service');
const { ok } = require('../../shared/utils/response.helper');

const getByVenta = async (req, res) => {
  const docs = await documentosService.getByVenta(req.params.id);
  return ok(res, docs);
};

const create = async (req, res) => {
  const doc = await documentosService.create(req.params.id, req.body, req.user.sub);
  return ok(res, doc);
};

module.exports = { getByVenta, create };
