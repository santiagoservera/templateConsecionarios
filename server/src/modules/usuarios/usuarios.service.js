const bcrypt = require('bcryptjs');
const prisma = require('../../shared/prisma');
const { paginate, paginateMeta } = require('../../shared/utils/pagination.helper');

const PUBLIC_FIELDS = {
  id: true, nombre: true, email: true, rol: true, activo: true,
  permisosJson: true, rolId: true, comisionPct: true, createdAt: true,
};

const getAll = async ({ page, pageSize } = {}) => {
  const { take, skip } = paginate(page, pageSize);
  const [total, items] = await Promise.all([
    prisma.usuario.count(),
    prisma.usuario.findMany({ select: PUBLIC_FIELDS, skip, take, orderBy: { nombre: 'asc' } }),
  ]);
  return { items, meta: paginateMeta(total, page, pageSize) };
};

const getById = async (id) => {
  const usuario = await prisma.usuario.findUnique({
    where: { id: Number(id) },
    select: PUBLIC_FIELDS,
  });
  if (!usuario) throw Object.assign(new Error('Usuario no encontrado'), { statusCode: 404 });
  return usuario;
};

const create = async ({ nombre, email, password, rol, permisosJson }) => {
  const passwordHash = await bcrypt.hash(password, 10);
  return prisma.usuario.create({
    data: { nombre, email, passwordHash, rol, permisosJson },
    select: PUBLIC_FIELDS,
  });
};

const update = async (id, { password, rolId, ...rest }) => {
  const data = { ...rest };
  if (password) data.passwordHash = await bcrypt.hash(password, 10);

  // Si se asigna un rol personalizado, sincronizar permisosJson desde los permisos del rol
  if (rolId !== undefined) {
    if (rolId === null) {
      data.rolId = null;
    } else {
      const rol = await prisma.rol.findUnique({ where: { id: Number(rolId) } });
      if (!rol) throw Object.assign(new Error('Rol personalizado no encontrado'), { statusCode: 404 });
      data.rolId       = Number(rolId);
      data.permisosJson = rol.permisos; // ya está guardado como string JSON en la BD
    }
  }

  return prisma.usuario.update({
    where: { id: Number(id) },
    data,
    select: PUBLIC_FIELDS,
  });
};

// Soft delete: protege la integridad de ventas/leads/clientes asociados al usuario
const remove = async (id) => {
  return prisma.usuario.update({
    where: { id: Number(id) },
    data: { activo: false },
    select: PUBLIC_FIELDS,
  });
};

// Lista mínima de vendedores activos (id + nombre) para uso en filtros
const getVendedores = async () => {
  return prisma.usuario.findMany({
    where:   { rol: 'VENDEDOR', activo: true },
    select:  { id: true, nombre: true },
    orderBy: { nombre: 'asc' },
  });
};

/**
 * Vendedores con stats de rendimiento del mes actual y comisión configurada.
 * Solo para ADMIN / GERENTE.
 */
const getVendedoresStats = async () => {
  const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

  const vendedores = await prisma.usuario.findMany({
    where:   { rol: 'VENDEDOR' },
    select:  { id: true, nombre: true, email: true, activo: true, comisionPct: true },
    orderBy: { nombre: 'asc' },
  });

  const ids = vendedores.map(v => v.id);

  const [ventasMes, comisionesPend, comisionesMes] = await Promise.all([
    // Ventas del mes por vendedor
    prisma.venta.groupBy({
      by:    ['vendedorId'],
      where: { vendedorId: { in: ids }, createdAt: { gte: startOfMonth } },
      _count: { id: true },
      _sum:   { precioFinal: true },
    }),
    // Comisiones pendientes por vendedor
    prisma.comision.groupBy({
      by:    ['vendedorId'],
      where: { vendedorId: { in: ids }, estado: 'PENDIENTE' },
      _sum:  { montoComision: true },
      _count:{ id: true },
    }),
    // Comisiones del mes
    prisma.comision.groupBy({
      by:    ['vendedorId'],
      where: { vendedorId: { in: ids }, venta: { createdAt: { gte: startOfMonth } } },
      _sum:  { montoComision: true },
    }),
  ]);

  const ventasMap     = Object.fromEntries(ventasMes.map(v => [v.vendedorId, v]));
  const pendMap       = Object.fromEntries(comisionesPend.map(c => [c.vendedorId, c]));
  const mesMap        = Object.fromEntries(comisionesMes.map(c => [c.vendedorId, c]));

  return vendedores.map(v => ({
    ...v,
    _stats: {
      ventasMesCant:    ventasMap[v.id]?._count.id           ?? 0,
      ventasMesMonto:   Number(ventasMap[v.id]?._sum.precioFinal ?? 0),
      comisionPendMonto:Number(pendMap[v.id]?._sum.montoComision  ?? 0),
      comisionPendCant: pendMap[v.id]?._count.id              ?? 0,
      comisionMesMonto: Number(mesMap[v.id]?._sum.montoComision   ?? 0),
    },
  }));
};

/**
 * Actualiza solo la comisión personal de un vendedor.
 */
const updateComisionPct = async (id, comisionPct) => {
  return prisma.usuario.update({
    where:  { id: Number(id) },
    data:   { comisionPct: comisionPct === null ? null : Number(comisionPct) },
    select: PUBLIC_FIELDS,
  });
};

module.exports = { getAll, getById, create, update, remove, getVendedores, getVendedoresStats, updateComisionPct };
