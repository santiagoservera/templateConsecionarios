const prisma = require('../../shared/prisma');
const { paginate, paginateMeta } = require('../../shared/utils/pagination.helper');

const CONSIG_INCLUDE = {
  vehiculo:    { select: { id: true, marca: true, modelo: true, anio: true, patente: true, km: true, estado: true, precioVenta: true } },
  propietario: { select: { id: true, nombre: true, apellido: true, telefono: true, email: true, dniCuit: true } },
};

function enriquecer(c) {
  const hoy = new Date();
  return {
    ...c,
    _vencida: c.fechaVencimiento ? new Date(c.fechaVencimiento) < hoy : false,
    _comisionEstimada: c.estado === 'VENDIDA'
      ? Number(c.precioAcordado) * Number(c.comisionPct) / 100
      : null,
  };
}

const getAll = async ({ estado, propietarioId, page, pageSize } = {}) => {
  const where = {};
  if (estado)        where.estado        = estado;
  if (propietarioId) where.propietarioId = Number(propietarioId);

  const { take, skip } = paginate(page, pageSize);
  const [total, items] = await Promise.all([
    prisma.consignacion.count({ where }),
    prisma.consignacion.findMany({ where, skip, take, include: CONSIG_INCLUDE, orderBy: { fechaIngreso: 'desc' } }),
  ]);
  return { items: items.map(enriquecer), meta: paginateMeta(total, page, pageSize) };
};

const getById = async (id) => {
  const c = await prisma.consignacion.findUnique({ where: { id: Number(id) }, include: CONSIG_INCLUDE });
  if (!c) throw Object.assign(new Error('Consignación no encontrada'), { statusCode: 404 });
  return enriquecer(c);
};

const create = async ({ vehiculoId, propietarioId, precioAcordado, comisionPct, fechaVencimiento, observaciones }) => {
  const vehiculo = await prisma.vehiculo.findUnique({ where: { id: Number(vehiculoId) } });
  if (!vehiculo) throw Object.assign(new Error('Vehículo no encontrado'), { statusCode: 404 });
  if (vehiculo.estado !== 'DISPONIBLE' && vehiculo.estado !== 'EN_CONSIGNACION') {
    throw Object.assign(
      new Error(`El vehículo no puede consignarse (estado: ${vehiculo.estado})`),
      { statusCode: 409 }
    );
  }

  const existente = await prisma.consignacion.findUnique({ where: { vehiculoId: Number(vehiculoId) } });
  if (existente) throw Object.assign(new Error('El vehículo ya tiene una consignación activa'), { statusCode: 409 });

  return prisma.$transaction(async (tx) => {
    const consignacion = await tx.consignacion.create({
      data: {
        vehiculoId:      Number(vehiculoId),
        propietarioId:   Number(propietarioId),
        precioAcordado,
        comisionPct,
        fechaVencimiento: fechaVencimiento ? new Date(fechaVencimiento) : null,
        observaciones,
      },
      include: CONSIG_INCLUDE,
    });
    await tx.vehiculo.update({ where: { id: Number(vehiculoId) }, data: { estado: 'EN_CONSIGNACION' } });
    return enriquecer(consignacion);
  });
};

const update = async (id, data) => {
  const consignacion = await prisma.consignacion.findUnique({ where: { id: Number(id) } });
  if (!consignacion) throw Object.assign(new Error('Consignación no encontrada'), { statusCode: 404 });

  const updateData = {};
  if (data.precioAcordado  !== undefined) updateData.precioAcordado  = data.precioAcordado;
  if (data.comisionPct     !== undefined) updateData.comisionPct     = data.comisionPct;
  if (data.observaciones   !== undefined) updateData.observaciones   = data.observaciones;
  if (data.fechaVencimiento !== undefined) updateData.fechaVencimiento = data.fechaVencimiento ? new Date(data.fechaVencimiento) : null;

  // Transición de estado con efectos secundarios
  if (data.estado && data.estado !== consignacion.estado) {
    updateData.estado = data.estado;

    return prisma.$transaction(async (tx) => {
      const updated = await tx.consignacion.update({
        where: { id: Number(id) },
        data:  updateData,
        include: CONSIG_INCLUDE,
      });

      if (data.estado === 'RETIRADA') {
        await tx.vehiculo.update({ where: { id: consignacion.vehiculoId }, data: { estado: 'DISPONIBLE' } });
      }

      return enriquecer(updated);
    });
  }

  const updated = await prisma.consignacion.update({ where: { id: Number(id) }, data: updateData, include: CONSIG_INCLUDE });
  return enriquecer(updated);
};

module.exports = { getAll, getById, create, update };
