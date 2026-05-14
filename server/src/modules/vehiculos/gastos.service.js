const prisma = require('../../shared/prisma');

const GASTO_INCLUDE = {
  usuario: { select: { id: true, nombre: true } },
};

const getByVehiculo = async (vehiculoId) => {
  const vehiculo = await prisma.vehiculo.findUnique({
    where:  { id: Number(vehiculoId) },
    select: { id: true },
  });
  if (!vehiculo) throw Object.assign(new Error('Vehículo no encontrado'), { statusCode: 404 });

  return prisma.gastoVehiculo.findMany({
    where:   { vehiculoId: Number(vehiculoId) },
    include: GASTO_INCLUDE,
    orderBy: { fecha: 'desc' },
  });
};

/**
 * Crea el gasto y, si el vehículo está en estado DISPONIBLE o EN_PREPARACION,
 * acumula el monto en vehiculo.precioCosto dentro de la misma transacción.
 *
 * Nota: por esta razón GET /vehiculos/:id/costoReal muestra el desglose histórico
 * de los gastos; precioCosto refleja el costo base actualizado.
 */
const create = async (vehiculoId, { concepto, monto, proveedor, fecha }, usuarioId) => {
  const vehiculo = await prisma.vehiculo.findUnique({
    where:  { id: Number(vehiculoId) },
    select: { id: true, estado: true, precioCosto: true },
  });
  if (!vehiculo) throw Object.assign(new Error('Vehículo no encontrado'), { statusCode: 404 });

  return prisma.$transaction(async (tx) => {
    const gasto = await tx.gastoVehiculo.create({
      data: {
        vehiculoId: Number(vehiculoId),
        concepto,
        monto,
        proveedor,
        fecha:     fecha ? new Date(fecha) : new Date(),
        usuarioId: Number(usuarioId),
      },
      include: GASTO_INCLUDE,
    });

    // Solo acumular si el vehículo aún puede tener costos de preparación activos
    if (['EN_PREPARACION', 'DISPONIBLE'].includes(vehiculo.estado)) {
      const nuevoPrecioCosto = Number(vehiculo.precioCosto) + Number(monto);
      await tx.vehiculo.update({
        where: { id: Number(vehiculoId) },
        data:  { precioCosto: nuevoPrecioCosto },
      });
    }

    return gasto;
  });
};

module.exports = { getByVehiculo, create };
