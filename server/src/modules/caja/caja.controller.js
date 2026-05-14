const service = require('./caja.service');
const { ok } = require('../../shared/utils/response.helper');

const getSesiones     = async (req, res) => { const { estado, fechaDesde, fechaHasta, page, pageSize } = req.query; const { items, meta } = await service.getSesiones({ estado, fechaDesde, fechaHasta, page, pageSize }); return ok(res, items, meta); };
const getSesionById   = async (req, res) => { const data = await service.getSesionById(req.params.id); return ok(res, data); };
const getSesionActiva = async (req, res) => { const data = await service.getSesionActiva(req.user.sub); return ok(res, data); };
const abrirSesion     = async (req, res) => { const data = await service.abrirSesion(req.body, req.user.sub); return ok(res, data); };
const cerrarSesion    = async (req, res) => { const data = await service.cerrarSesion(req.params.id, req.body, req.user.sub); return ok(res, data); };
const registrarMovimiento = async (req, res) => { const data = await service.registrarMovimiento(req.params.id, req.body, req.user.sub); return ok(res, data); };
const venderIndumentaria  = async (req, res) => { const data = await service.venderIndumentaria(req.params.id, req.body, req.user.sub); return ok(res, data); };

module.exports = { getSesiones, getSesionById, getSesionActiva, abrirSesion, cerrarSesion, registrarMovimiento, venderIndumentaria };
