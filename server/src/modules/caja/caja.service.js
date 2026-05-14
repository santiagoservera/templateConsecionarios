const prisma = require('../../shared/prisma');
const { paginate, paginateMeta } = require('../../shared/utils/pagination.helper');

const SESION_INCLUDE = {
  usuario:     { select: { id: true, nombre: true } },
  movimientos: { orderBy: { createdAt: 'asc' },
    include: { planPago: { select: { id: true, cliente: { select: { nombre: true, apellido: true } } } } },
  },
};

// ── Sesiones ──────────────────────────────────────────────────────────────────

const getSesiones = async ({ estado, fechaDesde, fechaHasta, page, pageSize } = {}) => {
  const where = {};
  if (estado) where.estado = estado;
  if (fechaDesde || fechaHasta) {
    where.fechaApertura = {};
    if (fechaDesde) where.fechaApertura.gte = new Date(fechaDesde);
    if (fechaHasta) where.fechaApertura.lte = new Date(fechaHasta + 'T23:59:59');
  }
  const { take, skip } = paginate(page, pageSize);
  const [total, items] = await Promise.all([
    prisma.sesionCaja.count({ where }),
    prisma.sesionCaja.findMany({ where, skip, take, include: SESION_INCLUDE, orderBy: { fechaApertura: 'desc' } }),
  ]);
  return { items: items.map(enriquecerSesion), meta: paginateMeta(total, page, pageSize) };
};

const getSesionActiva = async (usuarioId) => {
  return prisma.sesionCaja.findFirst({
    where:   { usuarioId: Number(usuarioId), estado: 'ABIERTA' },
    include: SESION_INCLUDE,
  });
};

const getSesionById = async (id) => {
  const s = await prisma.sesionCaja.findUnique({ where: { id: Number(id) }, include: SESION_INCLUDE });
  if (!s) throw Object.assign(new Error('Sesión no encontrada'), { statusCode: 404 });
  return enriquecerSesion(s);
};

function enriquecerSesion(s) {
  const movs   = s.movimientos ?? [];
  const totalI = movs.filter(m => m.tipo === 'INGRESO').reduce((a, m) => a + Number(m.monto), 0);
  const totalE = movs.filter(m => m.tipo === 'EGRESO').reduce((a, m) => a + Number(m.monto), 0);
  return {
    ...s,
    _stats: {
      totalIngresos: totalI,
      totalEgresos:  totalE,
      saldo:         Number(s.montoApertura) + totalI - totalE,
      cantMovimientos: movs.length,
    },
  };
}

const abrirSesion = async ({ montoApertura, observaciones }, usuarioId) => {
  const abierta = await getSesionActiva(usuarioId);
  if (abierta)
    throw Object.assign(new Error('Ya tenés una sesión abierta'), { statusCode: 409 });

  const s = await prisma.sesionCaja.create({
    data: { usuarioId: Number(usuarioId), montoApertura, observaciones },
    include: SESION_INCLUDE,
  });
  return enriquecerSesion(s);
};

const cerrarSesion = async (id, { montoCierre, observaciones }, usuarioId) => {
  const s = await getSesionById(id);
  if (s.estado !== 'ABIERTA')
    throw Object.assign(new Error('La sesión ya está cerrada'), { statusCode: 409 });
  if (s.usuarioId !== Number(usuarioId) && !['ADMIN','GERENTE'].includes('')) {
    // cualquier check de permiso si lo necesitás
  }

  const updated = await prisma.sesionCaja.update({
    where:   { id: Number(id) },
    data:    { estado: 'CERRADA', fechaCierre: new Date(), montoCierre, observaciones },
    include: SESION_INCLUDE,
  });
  return enriquecerSesion(updated);
};

// ── Movimientos ───────────────────────────────────────────────────────────────

const registrarMovimiento = async (sesionId, data, usuarioId) => {
  const s = await getSesionById(sesionId);
  if (s.estado !== 'ABIERTA')
    throw Object.assign(new Error('La sesión está cerrada'), { statusCode: 409 });

  const mov = await prisma.movimientoCaja.create({
    data: {
      sesionCajaId:  Number(sesionId),
      tipo:          data.tipo,
      concepto:      data.concepto,
      monto:         data.monto,
      planPagoDNIId: data.planPagoDNIId ?? null,
      observaciones: data.observaciones ?? null,
      usuarioId:     Number(usuarioId),
    },
    include: { planPago: { select: { id: true, cliente: { select: { nombre: true, apellido: true } } } } },
  });
  return mov;
};

/**
 * Vende uno o varios ítems de indumentaria desde caja:
 * - Descuenta cantidad del stock
 * - Registra movimiento de caja por el total
 */
const venderIndumentaria = async (sesionId, { items, observaciones }, usuarioId) => {
  const s = await getSesionById(sesionId);
  if (s.estado !== 'ABIERTA')
    throw Object.assign(new Error('La sesión está cerrada'), { statusCode: 409 });

  return prisma.$transaction(async (tx) => {
    let total = 0;
    const detalle = [];

    for (const item of items) {
      const ind = await tx.indumentaria.findUnique({ where: { id: item.indumentariaId } });
      if (!ind) throw Object.assign(new Error(`Ítem ${item.indumentariaId} no encontrado`), { statusCode: 404 });
      if (ind.cantidad < item.cantidad)
        throw Object.assign(new Error(`Sin stock suficiente para "${ind.nombre}"`), { statusCode: 409 });

      await tx.indumentaria.update({
        where: { id: item.indumentariaId },
        data:  { cantidad: { decrement: item.cantidad } },
      });

      const subtotal = Number(ind.precioVenta) * item.cantidad;
      total += subtotal;
      detalle.push(`${item.cantidad}x ${ind.nombre}`);
    }

    const obs = [observaciones, detalle.join(', ')].filter(Boolean).join(' | ');
    const mov = await tx.movimientoCaja.create({
      data: {
        sesionCajaId:  Number(sesionId),
        tipo:          'INGRESO',
        concepto:      'VENTA_INDUMENTARIA',
        monto:         total,
        observaciones: obs,
        usuarioId:     Number(usuarioId),
      },
    });
    return { movimiento: mov, total, detalle };
  });
};

module.exports = { getSesiones, getSesionActiva, getSesionById, abrirSesion, cerrarSesion, registrarMovimiento, venderIndumentaria };
