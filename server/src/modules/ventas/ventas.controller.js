const ventasService = require('./ventas.service');
const { ok } = require('../../shared/utils/response.helper');

const getAll = async (req, res) => {
  const { estado, formaPago, fechaDesde, fechaHasta, clienteNombre, page, pageSize } = req.query;
  let { vendedorId } = req.query;
  // El VENDEDOR solo ve sus propias ventas
  if (req.user.rol === 'VENDEDOR') vendedorId = req.user.sub;
  const result = await ventasService.getAll({ estado, vendedorId, formaPago, fechaDesde, fechaHasta, clienteNombre, page, pageSize });
  return ok(res, result.items, result.meta);
};

const getById = async (req, res) => {
  const venta = await ventasService.getById(req.params.id);
  return ok(res, venta);
};

const create = async (req, res) => {
  // vendedorId = usuario autenticado que está registrando la venta
  const venta = await ventasService.create(req.body, req.user.sub);
  return ok(res, venta);
};

const updateEstado = async (req, res) => {
  const venta = await ventasService.updateEstado(req.params.id, req.body);
  return ok(res, venta);
};

const createPermuta = async (req, res) => {
  const permuta = await ventasService.createPermuta(req.params.id, req.body);
  return ok(res, permuta);
};

const createFinanciamiento = async (req, res) => {
  const fin = await ventasService.createFinanciamiento(req.params.id, req.body);
  return ok(res, fin);
};

const ingresarPermutaAlStock = async (req, res) => {
  const vehiculo = await ventasService.ingresarPermutaAlStock(req.params.id, req.body);
  return ok(res, vehiculo);
};

module.exports = { getAll, getById, create, updateEstado, createPermuta, createFinanciamiento, ingresarPermutaAlStock };
