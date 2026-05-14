const service = require('./configuracion.service');
const { ok, fail } = require('../../shared/utils/response.helper');

const get = async (req, res, next) => {
  try {
    ok(res, await service.get());
  } catch (e) { next(e); }
};

const update = async (req, res, next) => {
  try {
    ok(res, await service.update(req.body));
  } catch (e) { next(e); }
};

module.exports = { get, update };
