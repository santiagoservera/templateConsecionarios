const prisma = require('../../shared/prisma');

const get = async () => {
  let config = await prisma.configuracion.findUnique({ where: { id: 1 } });
  if (!config) {
    config = await prisma.configuracion.create({
      data: { id: 1, nombreConcesionaria: 'DealerOS', comisionPctDefault: 2, moneda: 'ARS' },
    });
  }
  return config;
};

const update = async (data) => {
  return prisma.configuracion.upsert({
    where:  { id: 1 },
    update: data,
    create: { id: 1, nombreConcesionaria: 'DealerOS', comisionPctDefault: 2, moneda: 'ARS', ...data },
  });
};

module.exports = { get, update };
