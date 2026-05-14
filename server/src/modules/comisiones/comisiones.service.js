const prisma = require('../../shared/prisma');
const { paginate, paginateMeta } = require('../../shared/utils/pagination.helper');

const COM_INCLUDE = {
  vendedor: { select: { id: true, nombre: true, email: true } },
  venta: {
    select: {
      id:         true,
      precioFinal: true,
      formaPago:  true,
      estado:     true,
      fechaEntrega: true,
      cliente:    { select: { id: true, nombre: true, apellido: true } },
      vehiculo:   { select: { id: true, marca: true, modelo: true, anio: true, patente: true } },
    },
  },
};

const getAll = async ({ vendedorId, estado, fechaDesde, fechaHasta, page, pageSize } = {}) => {
  const where = {};
  if (vendedorId) where.vendedorId = Number(vendedorId);
  if (estado)     where.estado     = estado;
  if (fechaDesde || fechaHasta) {
    where.venta = {
      fechaEntrega: {
        ...(fechaDesde ? { gte: new Date(fechaDesde) } : {}),
        ...(fechaHasta ? { lte: new Date(fechaHasta + 'T23:59:59') } : {}),
      },
    };
  }

  const { take, skip } = paginate(page, pageSize);
  const [total, items] = await Promise.all([
    prisma.comision.count({ where }),
    prisma.comision.findMany({ where, skip, take, include: COM_INCLUDE, orderBy: { id: 'desc' } }),
  ]);

  const totalPendiente  = items.filter(c => c.estado === 'PENDIENTE').reduce((s, c) => s + Number(c.montoComision), 0);
  const totalLiquidado  = items.filter(c => c.estado === 'LIQUIDADA').reduce((s, c) => s + Number(c.montoComision), 0);

  return {
    items,
    meta:  paginateMeta(total, page, pageSize),
    _totales: { totalPendiente, totalLiquidado },
  };
};

const getById = async (id) => {
  const c = await prisma.comision.findUnique({ where: { id: Number(id) }, include: COM_INCLUDE });
  if (!c) throw Object.assign(new Error('Comisión no encontrada'), { statusCode: 404 });
  return c;
};

/**
 * Actualiza una comisión individual (ajuste de monto o estado).
 */
const update = async (id, { estado, montoComision, observaciones }) => {
  const comision = await prisma.comision.findUnique({ where: { id: Number(id) } });
  if (!comision) throw Object.assign(new Error('Comisión no encontrada'), { statusCode: 404 });

  const data = {};
  if (estado         !== undefined) data.estado         = estado;
  if (montoComision  !== undefined) data.montoComision   = montoComision;
  if (estado === 'LIQUIDADA' && !comision.fechaLiquidacion) data.fechaLiquidacion = new Date();
  if (estado === 'PENDIENTE') data.fechaLiquidacion = null;

  return prisma.comision.update({ where: { id: Number(id) }, data, include: COM_INCLUDE });
};

/**
 * Liquidación en lote: marca como LIQUIDADAS todas las comisiones con los ids indicados.
 * Si no se pasan ids, liquida todas las PENDIENTE del vendedor indicado.
 */
const liquidarLote = async ({ ids, vendedorId, fechaLiquidacion }) => {
  const fecha = fechaLiquidacion ? new Date(fechaLiquidacion) : new Date();

  const where = { estado: 'PENDIENTE' };
  if (ids?.length)  where.id         = { in: ids.map(Number) };
  if (vendedorId)   where.vendedorId = Number(vendedorId);

  const { count } = await prisma.comision.updateMany({
    where,
    data: { estado: 'LIQUIDADA', fechaLiquidacion: fecha },
  });

  return { liquidadas: count, fecha };
};

module.exports = { getAll, getById, update, liquidarLote };
