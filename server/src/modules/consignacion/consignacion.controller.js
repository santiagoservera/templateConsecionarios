const service = require('./consignacion.service');
const { ok, fail } = require('../../shared/utils/response.helper');

const getAll  = async (req, res, next) => { try { const r = await service.getAll(req.query); ok(res, r.items, r.meta); } catch (e) { next(e); } };
const getById = async (req, res, next) => { try { ok(res, await service.getById(req.params.id));           } catch (e) { next(e); } };
const create  = async (req, res, next) => { try { ok(res, await service.create(req.body), null, 201);      } catch (e) { next(e); } };
const update  = async (req, res, next) => { try { ok(res, await service.update(req.params.id, req.body));  } catch (e) { next(e); } };

module.exports = { getAll, getById, create, update };
