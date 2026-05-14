const service = require('./comisiones.service');
const { ok } = require('../../shared/utils/response.helper');

const getAll = async (req, res, next) => {
  try {
    const r = await service.getAll(req.query);
    ok(res, r.items, { ...r.meta, _totales: r._totales });
  } catch (e) { next(e); }
};
const getById      = async (req, res, next) => { try { ok(res, await service.getById(req.params.id));                 } catch (e) { next(e); } };
const update       = async (req, res, next) => { try { ok(res, await service.update(req.params.id, req.body));        } catch (e) { next(e); } };
const liquidarLote = async (req, res, next) => { try { ok(res, await service.liquidarLote(req.body));                 } catch (e) { next(e); } };

module.exports = { getAll, getById, update, liquidarLote };
