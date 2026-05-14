const prisma = require('../../shared/prisma');
const { paginate, paginateMeta } = require('../../shared/utils/pagination.helper');

const SRV_INCLUDE = {
  venta: {
    select: {
      id:      true,
      estado:  true,
      cliente: { select: { id: true, nombre: true, apellido: true, telefono: true } },
      vehiculo:{ select: { id: true, marca: true, modelo: true, anio: true, patente: true, km: true, color: true } },
    },
  },
  vehiculo: { select: { id: true, marca: true, modelo: true, anio: true, patente: true, km: true } },
  usuario:  { select: { id: true, nombre: true } },
};

/**
 * Calcula si un service está próximo a vencer (dentro de los próximos 30 días)
 * o ya venció (fechaProximoService pasada y estado PENDIENTE).
 */
function calcularAlerta(srv) {
  if (!srv.fechaProximoService || srv.estado !== 'PENDIENTE') return null;
  const hoy  = Date.now();
  const venc = new Date(srv.fechaProximoService).getTime();
  const diff = Math.ceil((venc - hoy) / 86400000);
  if (diff < 0)  return 'VENCIDO';
  if (diff <= 30) return 'PROXIMO';
  return null;
}

const getAll = async ({ ventaId, vehiculoId, estado, tipoService, soloActivos, proximosDias, mes, anio, fechaDesde, fechaHasta, page, pageSize } = {}) => {
  const where = {};
  if (ventaId)    where.ventaId    = Number(ventaId);
  if (vehiculoId) where.vehiculoId = Number(vehiculoId);
  // Filtro por mes/año o rango de fechaProximoService (para el calendario)
  if (mes && anio) {
    const y = Number(anio), m = Number(mes) - 1;
    where.fechaProximoService = { gte: new Date(y, m, 1), lt: new Date(y, m + 1, 1) };
  } else if (fechaDesde || fechaHasta) {
    where.fechaProximoService = {};
    if (fechaDesde) where.fechaProximoService.gte = new Date(fechaDesde);
    if (fechaHasta) where.fechaProximoService.lte = new Date(fechaHasta + 'T23:59:59');
  }
  if (estado)     where.estado     = estado;
  if (tipoService) where.tipoService = tipoService;
  if (soloActivos === 'true' || soloActivos === true) {
    where.estado = { not: 'CANCELADO' };
  }
  // Filtro por próximos N días
  if (proximosDias) {
    const limite = new Date();
    limite.setDate(limite.getDate() + Number(proximosDias));
    where.fechaProximoService = { lte: limite };
    where.estado = 'PENDIENTE';
  }

  const { take, skip } = paginate(page, pageSize);
  const [total, items] = await Promise.all([
    prisma.serviceVehiculo.count({ where }),
    prisma.serviceVehiculo.findMany({
      where,
      skip,
      take,
      include:  SRV_INCLUDE,
      orderBy:  [{ fechaProximoService: 'asc' }, { fechaService: 'desc' }],
    }),
  ]);

  return {
    items: items.map((s) => ({ ...s, _alerta: calcularAlerta(s) })),
    meta:  paginateMeta(total, page, pageSize),
  };
};

const getById = async (id) => {
  const srv = await prisma.serviceVehiculo.findUnique({
    where:   { id: Number(id) },
    include: SRV_INCLUDE,
  });
  if (!srv) throw Object.assign(new Error('Service no encontrado'), { statusCode: 404 });
  return { ...srv, _alerta: calcularAlerta(srv) };
};

const create = async (data, usuarioId) => {
  const { fechaService, fechaProximoService, ...rest } = data;
  const srv = await prisma.serviceVehiculo.create({
    data: {
      ...rest,
      usuarioId:           Number(usuarioId),
      fechaService:        fechaService        ? new Date(fechaService)        : new Date(),
      fechaProximoService: fechaProximoService ? new Date(fechaProximoService) : null,
    },
    include: SRV_INCLUDE,
  });
  return { ...srv, _alerta: calcularAlerta(srv) };
};

const update = async (id, data) => {
  const { fechaService, fechaProximoService, ...rest } = data;
  const updateData = { ...rest };
  if (fechaService        !== undefined) updateData.fechaService        = new Date(fechaService);
  if (fechaProximoService !== undefined) updateData.fechaProximoService = fechaProximoService ? new Date(fechaProximoService) : null;

  const srv = await prisma.serviceVehiculo.update({
    where:   { id: Number(id) },
    data:    updateData,
    include: SRV_INCLUDE,
  });
  return { ...srv, _alerta: calcularAlerta(srv) };
};

module.exports = { getAll, getById, create, update };
