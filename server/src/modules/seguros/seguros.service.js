const prisma = require('../../shared/prisma');

const PLANES_ORDER = { orderBy: [{ tipoCobertura: 'asc' }, { precioMensual: 'asc' }] };

const getAll = async (soloActivos = true) => {
  return prisma.aseguradora.findMany({
    where:   soloActivos ? { activo: true } : {},
    include: { planes: { where: soloActivos ? { activo: true } : {}, ...PLANES_ORDER } },
    orderBy: { nombre: 'asc' },
  });
};

const getById = async (id) => {
  const aseg = await prisma.aseguradora.findUnique({
    where:   { id: Number(id) },
    include: { planes: PLANES_ORDER },
  });
  if (!aseg) throw Object.assign(new Error('Aseguradora no encontrada'), { statusCode: 404 });
  return aseg;
};

const create = async ({ nombre, descripcion, contacto, planes = [] }) => {
  return prisma.aseguradora.create({
    data: {
      nombre,
      descripcion,
      contacto,
      planes: { create: planes.map(planData) },
    },
    include: { planes: PLANES_ORDER },
  });
};

const update = async (id, { nombre, descripcion, contacto, activo }) => {
  await getById(id);
  const data = {};
  if (nombre      !== undefined) data.nombre      = nombre;
  if (descripcion !== undefined) data.descripcion = descripcion;
  if (contacto    !== undefined) data.contacto    = contacto;
  if (activo      !== undefined) data.activo      = activo;
  return prisma.aseguradora.update({
    where:   { id: Number(id) },
    data,
    include: { planes: PLANES_ORDER },
  });
};

const remove = async (id) => {
  await getById(id);
  await prisma.$transaction([
    prisma.seguro.updateMany({ where: { aseguradoraId: Number(id) }, data: { activo: false } }),
    prisma.aseguradora.update({ where: { id: Number(id) }, data: { activo: false } }),
  ]);
};

const upsertPlanes = async (aseguradoraId, planes) => {
  await getById(aseguradoraId);
  return prisma.$transaction(async (tx) => {
    await tx.seguro.deleteMany({ where: { aseguradoraId: Number(aseguradoraId) } });
    if (planes.length) {
      await tx.seguro.createMany({
        data: planes.map(p => ({ ...planData(p), aseguradoraId: Number(aseguradoraId) })),
      });
    }
    return prisma.aseguradora.findUnique({
      where:   { id: Number(aseguradoraId) },
      include: { planes: PLANES_ORDER },
    });
  });
};

function planData(p) {
  return {
    codigoPlan:    p.codigoPlan    ?? null,
    tipoCobertura: p.tipoCobertura ?? 'TODO_RIESGO',
    aplicaA:       p.aplicaA       ?? 'AMBOS',
    precioMensual: p.precioMensual ?? null,
    precioAnual:   p.precioAnual   ?? null,
    sumaCubierta:  p.sumaCubierta  ?? null,
    descripcion:   p.descripcion   ?? null,
    urlDocumento:  p.urlDocumento  ?? null,
    activo:        p.activo        ?? true,
  };
}

module.exports = { getAll, getById, create, update, remove, upsertPlanes };
