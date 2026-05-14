const clientesService = require('./clientes.service');
const { ok } = require('../../shared/utils/response.helper');

const getAll = async (req, res) => {
  const { nombre, dniCuit, estadoVenta, page, pageSize } = req.query;
  let { vendedorId, sinVendedor } = req.query;

  // VENDEDOR solo puede ver sus propios clientes — ignorar filtros externos
  if (req.user.rol === 'VENDEDOR') {
    vendedorId  = req.user.sub;
    sinVendedor = undefined;
  }

  const result = await clientesService.getAll({ nombre, dniCuit, vendedorId, sinVendedor, estadoVenta, page, pageSize });
  return ok(res, result.items, result.meta);
};

const getById = async (req, res) => {
  const cliente = await clientesService.getById(req.params.id);
  return ok(res, cliente);
};

const create = async (req, res) => {
  const data = { ...req.body };
  // Si es VENDEDOR y no especificó vendedorId, se asigna a sí mismo automáticamente
  if (!data.vendedorId && req.user.rol === 'VENDEDOR') {
    data.vendedorId = req.user.sub;
  }
  const cliente = await clientesService.create(data);
  return ok(res, cliente);
};

const update = async (req, res) => {
  const cliente = await clientesService.update(req.params.id, req.body);
  return ok(res, cliente);
};

const remove = async (req, res) => {
  await clientesService.remove(req.params.id);
  return ok(res, null);
};

module.exports = { getAll, getById, create, update, remove };
