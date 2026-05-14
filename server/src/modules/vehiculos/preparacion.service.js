const prisma = require('../../shared/prisma');

const PREP_INCLUDE = {
  usuario: { select: { id: true, nombre: true } },
};

const getByVehiculo = async (vehiculoId) => {
  const vehiculo = await prisma.vehiculo.findUnique({
    where:  { id: Number(vehiculoId) },
    select: { id: true },
  });
  if (!vehiculo) throw Object.assign(new Error('Vehículo no encontrado'), { statusCode: 404 });

  return prisma.preparacion.findMany({
    where:   { vehiculoId: Number(vehiculoId) },
    include: PREP_INCLUDE,
    orderBy: { createdAt: 'desc' },
  });
};

/**
 * Crea una tarea de preparación para un vehículo.
 * Si el vehículo estaba DISPONIBLE, lo mueve a EN_PREPARACION en la misma transacción.
 */
const create = async (vehiculoId, data, usuarioId) => {
  const vehiculo = await prisma.vehiculo.findUnique({
    where:  { id: Number(vehiculoId) },
    select: { id: true, estado: true },
  });
  if (!vehiculo) throw Object.assign(new Error('Vehículo no encontrado'), { statusCode: 404 });

  return prisma.$transaction(async (tx) => {
    const prep = await tx.preparacion.create({
      data: {
        vehiculoId:  Number(vehiculoId),
        usuarioId:   Number(usuarioId),
        tipo:        data.tipo,
        descripcion: data.descripcion ?? null,
        proveedor:   data.proveedor ?? null,
        costo:       data.costo ?? 0,
        estado:      'PENDIENTE',
        fechaInicio: data.fechaInicio ? new Date(data.fechaInicio) : null,
        fechaFin:    data.fechaFin    ? new Date(data.fechaFin)    : null,
      },
      include: PREP_INCLUDE,
    });

    if (vehiculo.estado === 'DISPONIBLE') {
      await tx.vehiculo.update({
        where: { id: Number(vehiculoId) },
        data:  { estado: 'EN_PREPARACION' },
      });
    }

    return prep;
  });
};

/**
 * Actualiza una preparación.
 * Cuando el estado pasa a COMPLETADO y ya no quedan tareas PENDIENTE o EN_CURSO
 * para ese vehículo, devuelve el vehículo a DISPONIBLE (todo en la misma tx).
 */
const update = async (preparacionId, vehiculoId, data) => {
  const { fechaInicio, fechaFin, ...rest } = data;
  const updateData = { ...rest };
  // Solo convertir fechas si vienen en el payload (undefined = no tocar el campo)
  if (fechaInicio !== undefined) updateData.fechaInicio = fechaInicio ? new Date(fechaInicio) : null;
  if (fechaFin    !== undefined) updateData.fechaFin    = fechaFin    ? new Date(fechaFin)    : null;

  return prisma.$transaction(async (tx) => {
    const prep = await tx.preparacion.update({
      where:   { id: Number(preparacionId) },
      data:    updateData,
      include: PREP_INCLUDE,
    });

    if (data.estado === 'COMPLETADO') {
      // La preparación que acabamos de completar ya no aparece en PENDIENTE/EN_CURSO
      const pendientes = await tx.preparacion.count({
        where: {
          vehiculoId: Number(vehiculoId),
          estado: { in: ['PENDIENTE', 'EN_CURSO'] },
        },
      });

      if (pendientes === 0) {
        await tx.vehiculo.update({
          where: { id: Number(vehiculoId) },
          data:  { estado: 'DISPONIBLE' },
        });
      }
    }

    return prep;
  });
};

module.exports = { getByVehiculo, create, update };
