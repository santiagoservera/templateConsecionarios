const leadsService = require('./leads.service');
const { ok } = require('../../shared/utils/response.helper');

const getAll = async (req, res) => {
  const { clienteId, etapa, page, pageSize } = req.query;
  let { vendedorId } = req.query;
  // El VENDEDOR solo ve sus propios leads; ADMIN/GERENTE pueden filtrar por cualquier vendedor
  if (req.user.rol === 'VENDEDOR') vendedorId = req.user.sub;
  const result = await leadsService.getAll({ clienteId, vendedorId, etapa, page, pageSize });
  return ok(res, result.items, result.meta);
};

const getById = async (req, res) => {
  const lead = await leadsService.getById(req.params.id);
  return ok(res, lead);
};

const create = async (req, res) => {
  // vendedorId: el VENDEDOR siempre es el dueño; ADMIN/GERENTE pueden asignarlo a otro
  const vendedorId = req.user.rol === 'VENDEDOR'
    ? req.user.sub
    : (req.body.vendedorId ?? req.user.sub);

  const { vendedorId: _omit, ...rest } = req.body;
  const lead = await leadsService.create({ ...rest, vendedorId: Number(vendedorId) });
  return ok(res, lead);
};

const update = async (req, res) => {
  const lead = await leadsService.update(req.params.id, req.body);
  return ok(res, lead);
};

const remove = async (req, res) => {
  await leadsService.remove(req.params.id);
  return ok(res, null);
};

const updateEtapa = async (req, res) => {
  const lead = await leadsService.updateEtapa(req.params.id, req.body);
  return ok(res, lead);
};

module.exports = { getAll, getById, create, update, remove, updateEtapa };
