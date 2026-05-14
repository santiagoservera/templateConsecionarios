const prisma = require('../../shared/prisma');
const { paginate, paginateMeta } = require('../../shared/utils/pagination.helper');

const LEAD_INCLUDE = {
  cliente:         { select: { id: true, nombre: true, apellido: true, telefono: true } },
  vendedor:        { select: { id: true, nombre: true } },
  vehiculoInteres: { select: { id: true, marca: true, modelo: true, anio: true, precioVenta: true } },
};

const getAll = async ({ clienteId, vendedorId, etapa, page, pageSize } = {}) => {
  const where = {};
  if (clienteId)  where.clienteId  = Number(clienteId);
  if (vendedorId) where.vendedorId = Number(vendedorId);
  if (etapa)      where.etapa      = etapa;

  const { take, skip } = paginate(page, pageSize);
  const [total, items] = await Promise.all([
    prisma.lead.count({ where }),
    prisma.lead.findMany({ where, skip, take, include: LEAD_INCLUDE, orderBy: { updatedAt: 'desc' } }),
  ]);

  return { items, meta: paginateMeta(total, page, pageSize) };
};

const getById = async (id) => {
  const lead = await prisma.lead.findUnique({
    where: { id: Number(id) },
    include: LEAD_INCLUDE,
  });
  if (!lead) throw Object.assign(new Error('Lead no encontrado'), { statusCode: 404 });
  return lead;
};

const create = async (data) => {
  return prisma.lead.create({ data, include: LEAD_INCLUDE });
};

const update = async (id, data) => {
  return prisma.lead.update({ where: { id: Number(id) }, data, include: LEAD_INCLUDE });
};

const remove = async (id) => {
  return prisma.lead.delete({ where: { id: Number(id) } });
};

/**
 * Endpoint dedicado para cambiar la etapa del lead.
 * Separado del update general para hacer explícita la transición en el Kanban.
 * Opcionalmente actualiza las notas en el mismo paso.
 */
const updateEtapa = async (id, { etapa, notas }) => {
  const data = { etapa };
  if (notas !== undefined) data.notas = notas;
  return prisma.lead.update({ where: { id: Number(id) }, data, include: LEAD_INCLUDE });
};

module.exports = { getAll, getById, create, update, remove, updateEtapa };
