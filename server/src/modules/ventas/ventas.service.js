const prisma = require('../../shared/prisma');
const { paginate, paginateMeta } = require('../../shared/utils/pagination.helper');

// Include liviano para listados (getAll)
const VENTA_INCLUDE_LIST = {
  cliente:  { select: { id: true, nombre: true, apellido: true } },
  vehiculo: { select: { id: true, marca: true, modelo: true, anio: true, patente: true } },
  vendedor: { select: { id: true, nombre: true } },
  comision: { select: { id: true, estado: true, montoComision: true } },
};

// Include completo para detalle (getById)
const VENTA_INCLUDE = {
  cliente:        { select: { id: true, nombre: true, apellido: true, telefono: true, email: true } },
  vehiculo:       { select: { id: true, marca: true, modelo: true, anio: true, patente: true, km: true, color: true } },
  vendedor:       { select: { id: true, nombre: true } },
  permuta:        true,
  financiamiento: true,
  comision:       true,
};

/**
 * Obtiene el porcentaje de comisión efectivo:
 * si el vendedor tiene comisionPct propio lo usa, sino usa el global de Configuracion.
 */
async function getComisionPct(vendedorId) {
  const [vendedor, config] = await Promise.all([
    prisma.usuario.findUnique({ where: { id: Number(vendedorId) }, select: { comisionPct: true } }),
    prisma.configuracion.findUnique({ where: { id: 1 }, select: { comisionPctDefault: true } }),
  ]);
  return Number(vendedor?.comisionPct ?? config?.comisionPctDefault ?? 2);
}

const getAll = async ({ vendedorId, estado, formaPago, fechaDesde, fechaHasta, clienteNombre, page, pageSize } = {}) => {
  const where = {};
  if (vendedorId) where.vendedorId = Number(vendedorId);
  if (estado)     where.estado     = estado;
  if (formaPago)  where.formaPago  = formaPago;
  if (fechaDesde || fechaHasta) {
    where.createdAt = {};
    if (fechaDesde) where.createdAt.gte = new Date(fechaDesde);
    if (fechaHasta) where.createdAt.lte = new Date(fechaHasta + 'T23:59:59');
  }
  if (clienteNombre) {
    where.cliente = {
      OR: [
        { nombre:   { contains: clienteNombre } },
        { apellido: { contains: clienteNombre } },
      ],
    };
  }

  const { take, skip } = paginate(page, pageSize);
  const [total, items] = await Promise.all([
    prisma.venta.count({ where }),
    prisma.venta.findMany({ where, skip, take, include: VENTA_INCLUDE_LIST, orderBy: { createdAt: 'desc' } }),
  ]);

  return { items, meta: paginateMeta(total, page, pageSize) };
};

const getById = async (id) => {
  const venta = await prisma.venta.findUnique({
    where: { id: Number(id) },
    include: { ...VENTA_INCLUDE, documentos: true, postventas: true },
  });
  if (!venta) throw Object.assign(new Error('Venta no encontrada'), { statusCode: 404 });
  return venta;
};

/**
 * Crea una venta y en la misma transacción:
 *   1. Cambia el estado del vehículo a RESERVADO
 *   2. Genera el registro de Comision con estado PENDIENTE
 *
 * Falla con 409 si el vehículo no está en estado DISPONIBLE.
 */
const create = async ({ clienteId, vehiculoId, precioFinal, formaPago, tienePermuta, tieneFinanciamiento }, vendedorId) => {
  const vehiculo = await prisma.vehiculo.findUnique({ where: { id: Number(vehiculoId) } });
  if (!vehiculo) {
    throw Object.assign(new Error('Vehículo no encontrado'), { statusCode: 404 });
  }
  if (vehiculo.estado !== 'DISPONIBLE') {
    throw Object.assign(
      new Error(`El vehículo no está disponible (estado actual: ${vehiculo.estado})`),
      { statusCode: 409 }
    );
  }

  const comisionPct   = await getComisionPct(vendedorId);
  const montoComision = (Number(precioFinal) * comisionPct) / 100;

  return prisma.$transaction(async (tx) => {
    // 1. Crear la venta
    const venta = await tx.venta.create({
      data: {
        clienteId:           Number(clienteId),
        vehiculoId:          Number(vehiculoId),
        vendedorId:          Number(vendedorId),
        precioFinal,
        formaPago,
        tienePermuta:        tienePermuta ?? false,
        tieneFinanciamiento: tieneFinanciamiento ?? false,
      },
      include: VENTA_INCLUDE,
    });

    // 2. Bloquear el vehículo
    await tx.vehiculo.update({
      where: { id: Number(vehiculoId) },
      data:  { estado: 'RESERVADO' },
    });

    // 3. Registrar la comisión (queda PENDIENTE hasta que el gerente la liquide)
    await tx.comision.create({
      data: {
        ventaId:      venta.id,
        vendedorId:   Number(vendedorId),
        montoBase:    precioFinal,
        porcentaje:   comisionPct,
        montoComision,
      },
    });

    return venta;
  });
};

/**
 * Cambia el estado de una venta con sus efectos secundarios:
 *   ENTREGADO → vehiculo pasa a VENDIDO, se registra fechaEntrega
 *   CANCELADO → vehiculo vuelve a DISPONIBLE
 * Toda la operación se ejecuta en una transacción.
 */
const updateEstado = async (id, { estado, fechaEntrega }) => {
  const venta = await prisma.venta.findUnique({
    where:  { id: Number(id) },
    select: { id: true, vehiculoId: true, estado: true },
  });
  if (!venta) throw Object.assign(new Error('Venta no encontrada'), { statusCode: 404 });

  return prisma.$transaction(async (tx) => {
    const ventaData = { estado };

    if (estado === 'ENTREGADO') {
      ventaData.fechaEntrega = fechaEntrega ? new Date(fechaEntrega) : new Date();
      await tx.vehiculo.update({
        where: { id: venta.vehiculoId },
        data:  { estado: 'VENDIDO' },
      });
    }

    if (estado === 'CANCELADO') {
      await tx.vehiculo.update({
        where: { id: venta.vehiculoId },
        data:  { estado: 'DISPONIBLE' },
      });
    }

    return tx.venta.update({
      where: { id: Number(id) },
      data:  ventaData,
      include: VENTA_INCLUDE,
    });
  });
};

/**
 * Agrega una permuta a una venta existente.
 * Actualiza venta.tienePermuta = true en la misma transacción.
 */
const createPermuta = async (ventaId, data) => {
  const venta = await prisma.venta.findUnique({ where: { id: Number(ventaId) } });
  if (!venta) throw Object.assign(new Error('Venta no encontrada'), { statusCode: 404 });

  const existente = await prisma.permuta.findUnique({ where: { ventaId: Number(ventaId) } });
  if (existente) {
    throw Object.assign(new Error('La venta ya tiene una permuta registrada'), { statusCode: 409 });
  }

  return prisma.$transaction(async (tx) => {
    const permuta = await tx.permuta.create({
      data: { ...data, ventaId: Number(ventaId) },
    });
    await tx.venta.update({
      where: { id: Number(ventaId) },
      data:  { tienePermuta: true },
    });
    return permuta;
  });
};

/**
 * Agrega un financiamiento a una venta existente.
 * Actualiza venta.tieneFinanciamiento = true en la misma transacción.
 */
const createFinanciamiento = async (ventaId, data) => {
  const venta = await prisma.venta.findUnique({ where: { id: Number(ventaId) } });
  if (!venta) throw Object.assign(new Error('Venta no encontrada'), { statusCode: 404 });

  const existente = await prisma.financiamiento.findUnique({ where: { ventaId: Number(ventaId) } });
  if (existente) {
    throw Object.assign(new Error('La venta ya tiene un financiamiento registrado'), { statusCode: 409 });
  }

  return prisma.$transaction(async (tx) => {
    const fin = await tx.financiamiento.create({
      data: { ...data, ventaId: Number(ventaId) },
    });
    await tx.venta.update({
      where: { id: Number(ventaId) },
      data:  { tieneFinanciamiento: true },
    });
    return fin;
  });
};

/**
 * Convierte la permuta de una venta en un vehículo de stock.
 * Crea el Vehiculo con los datos de la permuta y vincula vehiculoGeneradoId.
 */
const ingresarPermutaAlStock = async (ventaId, { precioCosto, precioVenta, precioMinimo, km, color, version, observaciones }) => {
  const permuta = await prisma.permuta.findUnique({ where: { ventaId: Number(ventaId) } });
  if (!permuta) throw Object.assign(new Error('La venta no tiene permuta'), { statusCode: 404 });
  if (permuta.vehiculoGeneradoId) {
    throw Object.assign(new Error('La permuta ya fue ingresada al stock'), { statusCode: 409 });
  }

  return prisma.$transaction(async (tx) => {
    const vehiculo = await tx.vehiculo.create({
      data: {
        tipo:        'AUTO',
        marca:       permuta.marca,
        modelo:      permuta.modelo,
        anio:        permuta.anio,
        patente:     permuta.patente ?? undefined,
        km:          km ?? permuta.km,
        color:       color ?? undefined,
        version:     version ?? undefined,
        tipoStock:   'USADO',
        estado:      'DISPONIBLE',
        precioCosto: precioCosto ?? permuta.valorTasacion,
        precioVenta: precioVenta ?? permuta.valorTasacion,
        precioMinimo: precioMinimo ?? undefined,
      },
    });

    await tx.permuta.update({
      where: { ventaId: Number(ventaId) },
      data:  { vehiculoGeneradoId: vehiculo.id },
    });

    return vehiculo;
  });
};

module.exports = { getAll, getById, create, updateEstado, createPermuta, createFinanciamiento, ingresarPermutaAlStock };
