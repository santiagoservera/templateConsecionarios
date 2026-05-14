const prisma = require('../../shared/prisma');

const getAll = async (soloActivos = true) => {
  return prisma.convenioBanco.findMany({
    where:   soloActivos ? { activo: true } : {},
    include: { planes: { where: { activo: true }, orderBy: { cantCuotas: 'asc' } } },
    orderBy: { nombre: 'asc' },
  });
};

const getById = async (id) => {
  const convenio = await prisma.convenioBanco.findUnique({
    where:   { id: Number(id) },
    include: { planes: { orderBy: { cantCuotas: 'asc' } } },
  });
  if (!convenio) throw Object.assign(new Error('Convenio no encontrado'), { statusCode: 404 });
  return convenio;
};

/**
 * Crea el banco con sus planes en una sola transacción.
 */
const create = async ({ nombre, descripcion, planes }) => {
  return prisma.convenioBanco.create({
    data: {
      nombre,
      descripcion,
      planes: { create: planes.map((p) => ({ cantCuotas: p.cantCuotas, tasaInteres: p.tasaInteres, activo: p.activo ?? true })) },
    },
    include: { planes: { orderBy: { cantCuotas: 'asc' } } },
  });
};

const update = async (id, { nombre, descripcion, activo }) => {
  await getById(id);
  const data = {};
  if (nombre      !== undefined) data.nombre      = nombre;
  if (descripcion !== undefined) data.descripcion = descripcion;
  if (activo      !== undefined) data.activo      = activo;
  return prisma.convenioBanco.update({
    where:   { id: Number(id) },
    data,
    include: { planes: { orderBy: { cantCuotas: 'asc' } } },
  });
};

const remove = async (id) => {
  await getById(id);
  // Soft delete: desactiva banco y todos sus planes
  await prisma.$transaction([
    prisma.planCuotas.updateMany({ where: { convenioBancoId: Number(id) }, data: { activo: false } }),
    prisma.convenioBanco.update({ where: { id: Number(id) }, data: { activo: false } }),
  ]);
};

/**
 * Reemplaza todos los planes de un banco.
 * Elimina los existentes y crea los nuevos dentro de una transacción.
 */
const upsertPlanes = async (bancoId, planes) => {
  await getById(bancoId);
  return prisma.$transaction(async (tx) => {
    await tx.planCuotas.deleteMany({ where: { convenioBancoId: Number(bancoId) } });
    await tx.planCuotas.createMany({
      data: planes.map((p) => ({
        convenioBancoId: Number(bancoId),
        cantCuotas:      p.cantCuotas,
        tasaInteres:     p.tasaInteres,
        activo:          p.activo ?? true,
      })),
    });
    return prisma.convenioBanco.findUnique({
      where:   { id: Number(bancoId) },
      include: { planes: { orderBy: { cantCuotas: 'asc' } } },
    });
  });
};

module.exports = { getAll, getById, create, update, remove, upsertPlanes };
