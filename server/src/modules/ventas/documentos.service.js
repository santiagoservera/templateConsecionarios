const prisma = require('../../shared/prisma');

const DOC_INCLUDE = {
  usuario: { select: { id: true, nombre: true } },
};

const getByVenta = async (ventaId) => {
  const venta = await prisma.venta.findUnique({
    where:  { id: Number(ventaId) },
    select: { id: true },
  });
  if (!venta) throw Object.assign(new Error('Venta no encontrada'), { statusCode: 404 });

  return prisma.documento.findMany({
    where:   { ventaId: Number(ventaId) },
    include: DOC_INCLUDE,
    orderBy: { fechaGeneracion: 'desc' },
  });
};

const create = async (ventaId, { tipo, urlArchivo }, usuarioId) => {
  const venta = await prisma.venta.findUnique({
    where:  { id: Number(ventaId) },
    select: { id: true },
  });
  if (!venta) throw Object.assign(new Error('Venta no encontrada'), { statusCode: 404 });

  return prisma.documento.create({
    data: {
      ventaId:   Number(ventaId),
      tipo,
      urlArchivo: urlArchivo ?? null,
      usuarioId: Number(usuarioId),
    },
    include: DOC_INCLUDE,
  });
};

module.exports = { getByVenta, create };
