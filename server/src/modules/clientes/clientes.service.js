const prisma = require('../../shared/prisma');
const { paginate, paginateMeta } = require('../../shared/utils/pagination.helper');

const getAll = async ({ nombre, dniCuit, vendedorId, sinVendedor, estadoVenta, page, pageSize } = {}) => {
  const where = {};

  if (nombre) {
    where.OR = [
      { nombre:   { contains: nombre } },
      { apellido: { contains: nombre } },
      { dniCuit:  { contains: nombre } },
      { telefono: { contains: nombre } },
    ];
  }
  if (dniCuit) where.dniCuit = { contains: dniCuit };

  if (sinVendedor === 'true' || sinVendedor === true) {
    where.vendedorId = null;
  } else if (vendedorId) {
    where.vendedorId = Number(vendedorId);
  }

  // Filtro por estado de venta activa
  if (estadoVenta === 'SIN_VENTA') {
    // Clientes sin ninguna venta activa (no cancelada)
    where.ventas = { none: { estado: { not: 'CANCELADO' } } };
  } else if (estadoVenta) {
    where.ventas = { some: { estado: estadoVenta } };
  }

  const { take, skip } = paginate(page, pageSize);
  const [total, items] = await Promise.all([
    prisma.cliente.count({ where }),
    prisma.cliente.findMany({
      where, skip, take,
      orderBy: { apellido: 'asc' },
      include: {
        vendedor: { select: { id: true, nombre: true } },
        // Venta activa más reciente (no cancelada)
        ventas: {
          where:   { estado: { not: 'CANCELADO' } },
          orderBy: { createdAt: 'desc' },
          take:    1,
          select:  {
            id:      true,
            estado:  true,
            vehiculo: { select: { marca: true, modelo: true, anio: true } },
          },
        },
      },
    }),
  ]);

  return { items, meta: paginateMeta(total, page, pageSize) };
};

const getById = async (id) => {
  const cliente = await prisma.cliente.findUnique({
    where: { id: Number(id) },
    include: {
      vendedor: { select: { id: true, nombre: true } },
      leads: {
        orderBy: { updatedAt: 'desc' },
        include: {
          vehiculoInteres: { select: { id: true, marca: true, modelo: true, anio: true } },
        },
      },
      ventas: {
        orderBy: { createdAt: 'desc' },
        include: {
          vehiculo: { select: { id: true, marca: true, modelo: true, anio: true } },
        },
      },
    },
  });
  if (!cliente) throw Object.assign(new Error('Cliente no encontrado'), { statusCode: 404 });
  return cliente;
};

const create = async (data) => {
  return prisma.cliente.create({ data });
};

const update = async (id, data) => {
  return prisma.cliente.update({ where: { id: Number(id) }, data });
};

const remove = async (id) => {
  const ventasCount = await prisma.venta.count({ where: { clienteId: Number(id) } });
  if (ventasCount > 0) {
    throw Object.assign(
      new Error('No se puede eliminar: el cliente tiene ventas registradas'),
      { statusCode: 409 }
    );
  }
  return prisma.cliente.delete({ where: { id: Number(id) } });
};

module.exports = { getAll, getById, create, update, remove };
