const prisma = require('../../shared/prisma');
const { paginate, paginateMeta } = require('../../shared/utils/pagination.helper');

const PV_INCLUDE = {
  cliente: { select: { id: true, nombre: true, apellido: true, telefono: true } },
  venta:   { select: { id: true, estado: true, vehiculo: { select: { marca: true, modelo: true, anio: true } } } },
  usuario: { select: { id: true, nombre: true } },
};

const getAll = async ({ ventaId, clienteId, estado, tipo, fechaDesde, fechaHasta, page, pageSize } = {}) => {
  const where = {};
  if (ventaId)   where.ventaId   = Number(ventaId);
  if (clienteId) where.clienteId = Number(clienteId);
  if (estado)    where.estado    = estado;
  if (tipo)      where.tipo      = tipo;
  if (fechaDesde || fechaHasta) {
    where.fechaContacto = {};
    if (fechaDesde) where.fechaContacto.gte = new Date(fechaDesde);
    if (fechaHasta) where.fechaContacto.lte = new Date(fechaHasta + 'T23:59:59');
  }

  const { take, skip } = paginate(page, pageSize);
  const [total, items] = await Promise.all([
    prisma.postventa.count({ where }),
    prisma.postventa.findMany({ where, skip, take, include: PV_INCLUDE, orderBy: { fechaContacto: 'desc' } }),
  ]);

  return { items, meta: paginateMeta(total, page, pageSize) };
};

const getById = async (id) => {
  const pv = await prisma.postventa.findUnique({
    where:   { id: Number(id) },
    include: PV_INCLUDE,
  });
  if (!pv) throw Object.assign(new Error('Registro de postventa no encontrado'), { statusCode: 404 });
  return pv;
};

const create = async ({ ventaId, clienteId, tipo, descripcion, estado, fechaContacto }, usuarioId) => {
  return prisma.postventa.create({
    data: {
      ventaId:      Number(ventaId),
      clienteId:    Number(clienteId),
      usuarioId:    Number(usuarioId),
      tipo,
      descripcion,
      estado:       estado ?? 'ABIERTO',
      fechaContacto: fechaContacto ? new Date(fechaContacto) : new Date(),
    },
    include: PV_INCLUDE,
  });
};

/**
 * Actualiza el estado de un caso de postventa.
 * Al pasar a CERRADO, registra fechaResolucion automáticamente si no se provee.
 */
const update = async (id, data) => {
  const { fechaResolucion, ...rest } = data;
  const updateData = { ...rest };

  if (data.estado === 'CERRADO') {
    updateData.fechaResolucion = fechaResolucion ? new Date(fechaResolucion) : new Date();
  } else if (fechaResolucion !== undefined) {
    updateData.fechaResolucion = fechaResolucion ? new Date(fechaResolucion) : null;
  }

  return prisma.postventa.update({
    where:   { id: Number(id) },
    data:    updateData,
    include: PV_INCLUDE,
  });
};

module.exports = { getAll, getById, create, update };
