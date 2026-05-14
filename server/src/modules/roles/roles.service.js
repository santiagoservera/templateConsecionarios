const prisma = require('../../shared/prisma');

const getAll = async () => {
  return prisma.rol.findMany({ orderBy: [{ esDefault: 'desc' }, { nombre: 'asc' }] });
};

const getById = async (id) => {
  const rol = await prisma.rol.findUnique({ where: { id: Number(id) } });
  if (!rol) throw Object.assign(new Error('Rol no encontrado'), { statusCode: 404 });
  return rol;
};

const create = async ({ nombre, descripcion, permisos }) => {
  return prisma.rol.create({
    data: {
      nombre,
      descripcion,
      permisos:  JSON.stringify(permisos),
      esDefault: false,
    },
  });
};

const update = async (id, { nombre, descripcion, permisos }) => {
  const rol = await prisma.rol.findUnique({ where: { id: Number(id) } });
  if (!rol) throw Object.assign(new Error('Rol no encontrado'), { statusCode: 404 });

  const data = {};
  if (nombre      !== undefined) data.nombre      = nombre;
  if (descripcion !== undefined) data.descripcion = descripcion;
  if (permisos    !== undefined) data.permisos    = JSON.stringify(permisos);

  const rolActualizado = await prisma.rol.update({ where: { id: Number(id) }, data });

  // Propagar permisos actualizados a todos los usuarios que usan este rol
  if (permisos !== undefined) {
    const permisosStr = JSON.stringify(permisos);
    if (rol.esDefault) {
      // Roles del sistema: propagar a todos los usuarios con ese nombre de rol
      await prisma.usuario.updateMany({
        where: { rol: rol.nombre },
        data:  { permisosJson: permisosStr },
      });
    } else {
      // Roles personalizados: propagar a usuarios con ese rolId
      await prisma.usuario.updateMany({
        where: { rolId: Number(id) },
        data:  { permisosJson: permisosStr },
      });
    }
  }

  return rolActualizado;
};

const remove = async (id) => {
  const rol = await prisma.rol.findUnique({
    where:   { id: Number(id) },
    include: { _count: { select: { usuarios: true } } },
  });
  if (!rol) throw Object.assign(new Error('Rol no encontrado'), { statusCode: 404 });
  if (rol.nombre === 'ADMIN') {
    throw Object.assign(new Error('El rol ADMIN no puede eliminarse'), { statusCode: 403 });
  }
  if (rol._count.usuarios > 0) {
    throw Object.assign(
      new Error(`No se puede eliminar: tiene ${rol._count.usuarios} usuario(s) asignado(s)`),
      { statusCode: 409 }
    );
  }
  return prisma.rol.delete({ where: { id: Number(id) } });
};

module.exports = { getAll, getById, create, update, remove };
