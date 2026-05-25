const service = require('./seguros.service');
const { ok } = require('../../shared/utils/response.helper');

const getAll       = async (req, res) => ok(res, await service.getAll(req.query.soloActivos !== 'false'));
const getById      = async (req, res) => ok(res, await service.getById(req.params.id));
const create       = async (req, res) => ok(res, await service.create(req.body));
const update       = async (req, res) => ok(res, await service.update(req.params.id, req.body));
const remove       = async (req, res) => { await service.remove(req.params.id); return ok(res, { message: 'Aseguradora desactivada' }); };
const upsertPlanes = async (req, res) => ok(res, await service.upsertPlanes(req.params.id, req.body.planes));

module.exports = { getAll, getById, create, update, remove, upsertPlanes };
