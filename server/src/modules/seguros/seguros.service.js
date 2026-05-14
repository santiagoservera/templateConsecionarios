const prisma = require('../../shared/prisma');

const getAll = async () => {
  const hoy = new Date();
  const seguros = await prisma.seguro.findMany({ orderBy: { vigenciaHasta: 'asc' } });
  // Auto-actualizar estado vencido
  return seguros.map(s => ({
    ...s,
    _vencido: new Date(s.vigenciaHasta) < hoy,
    _diasRestantes: Math.ceil((new Date(s.vigenciaHasta).getTime() - hoy.getTime()) / 86400000),
  }));
};

const getById = async (id) => {
  const s = await prisma.seguro.findUnique({ where: { id: Number(id) } });
  if (!s) throw Object.assign(new Error('Seguro no encontrado'), { statusCode: 404 });
  const hoy = new Date();
  return { ...s, _vencido: new Date(s.vigenciaHasta) < hoy, _diasRestantes: Math.ceil((new Date(s.vigenciaHasta).getTime() - hoy.getTime()) / 86400000) };
};

const create = async ({ vigenciaDesde, vigenciaHasta, ...rest }) => {
  return prisma.seguro.create({
    data: { ...rest, vigenciaDesde: new Date(vigenciaDesde), vigenciaHasta: new Date(vigenciaHasta) },
  });
};

const update = async (id, { vigenciaDesde, vigenciaHasta, ...rest }) => {
  await getById(id);
  const data = { ...rest };
  if (vigenciaDesde) data.vigenciaDesde = new Date(vigenciaDesde);
  if (vigenciaHasta) data.vigenciaHasta = new Date(vigenciaHasta);
  return prisma.seguro.update({ where: { id: Number(id) }, data });
};

const remove = async (id) => {
  await getById(id);
  return prisma.seguro.delete({ where: { id: Number(id) } });
};

module.exports = { getAll, getById, create, update, remove };
