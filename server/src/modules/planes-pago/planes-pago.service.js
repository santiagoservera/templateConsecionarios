const prisma = require('../../shared/prisma');
const { paginate, paginateMeta } = require('../../shared/utils/pagination.helper');

const PLAN_INCLUDE = {
  cuotas:  { orderBy: { numeroCuota: 'asc' } },
  cliente: { select: { id: true, nombre: true, apellido: true, telefono: true, dniCuit: true } },
  vehiculo:{ select: { id: true, marca: true, modelo: true, anio: true, patente: true, precioVenta: true } },
  vendedor:{ select: { id: true, nombre: true } },
  venta:   { select: { id: true, estado: true } },
};

function enriquecerPlan(plan) {
  const cuotas   = plan.cuotas ?? [];
  const pagadas  = cuotas.filter(c => c.estado === 'PAGADO').length;
  const vencidas = cuotas.filter(c => c.estado !== 'PAGADO' && new Date(c.fechaVencimiento) < new Date()).length;
  const proxima  = cuotas.find(c => c.estado === 'PENDIENTE');
  const pct      = plan.cantCuotas > 0 ? Math.round((pagadas / plan.cantCuotas) * 100) : 0;

  return {
    ...plan,
    _stats: {
      totalCuotas: plan.cantCuotas,
      pagadas,
      vencidas,
      pendientes:  plan.cantCuotas - pagadas,
      montoPagado: Number(plan.montoPagado),
      montoTotal:  Number(plan.precioTotal),
      porcentaje:  pct,
      puedeRetirar: plan.montoEntrega
        ? Number(plan.montoPagado) >= Number(plan.montoEntrega)
        : pagadas === plan.cantCuotas,
      proximaCuota: proxima?.fechaVencimiento ?? null,
    },
  };
}

const getAll = async ({ clienteId, vendedorId, estado, page, pageSize } = {}) => {
  const where = {};
  if (clienteId)  where.clienteId  = Number(clienteId);
  if (vendedorId) where.vendedorId = Number(vendedorId);
  if (estado)     where.estado     = estado;

  const { take, skip } = paginate(page, pageSize);
  const [total, items] = await Promise.all([
    prisma.planPagoDNI.count({ where }),
    prisma.planPagoDNI.findMany({ where, skip, take, include: PLAN_INCLUDE, orderBy: { createdAt: 'desc' } }),
  ]);
  return { items: items.map(enriquecerPlan), meta: paginateMeta(total, page, pageSize) };
};

const getById = async (id) => {
  const plan = await prisma.planPagoDNI.findUnique({
    where:   { id: Number(id) },
    include: PLAN_INCLUDE,
  });
  if (!plan) throw Object.assign(new Error('Plan no encontrado'), { statusCode: 404 });
  return enriquecerPlan(plan);
};

/**
 * Crea el plan, reserva el vehículo y genera el cronograma de cuotas.
 */
const create = async (data, vendedorId) => {
  const { clienteId, vehiculoId, precioTotal, cantCuotas, valorCuota, montoEntrega, observaciones, fechaInicio } = data;

  const vehiculo = await prisma.vehiculo.findUnique({ where: { id: Number(vehiculoId) } });
  if (!vehiculo)                throw Object.assign(new Error('Vehículo no encontrado'), { statusCode: 404 });
  if (vehiculo.estado !== 'DISPONIBLE')
    throw Object.assign(new Error(`El vehículo no está disponible (estado: ${vehiculo.estado})`), { statusCode: 409 });

  const base = fechaInicio ? new Date(fechaInicio) : new Date();
  const cuotasData = Array.from({ length: cantCuotas }, (_, i) => {
    const venc = new Date(base);
    venc.setMonth(venc.getMonth() + i + 1);
    return { numeroCuota: i + 1, fechaVencimiento: venc, monto: valorCuota, estado: 'PENDIENTE' };
  });

  return prisma.$transaction(async (tx) => {
    const plan = await tx.planPagoDNI.create({
      data: {
        clienteId:    Number(clienteId),
        vehiculoId:   Number(vehiculoId),
        vendedorId:   Number(vendedorId),
        precioTotal,
        cantCuotas,
        valorCuota,
        montoEntrega: montoEntrega ?? null,
        observaciones: observaciones ?? null,
        cuotas: { create: cuotasData },
      },
      include: PLAN_INCLUDE,
    });
    await tx.vehiculo.update({ where: { id: Number(vehiculoId) }, data: { estado: 'RESERVADO' } });
    return enriquecerPlan(plan);
  });
};

const update = async (id, data) => {
  const plan = await prisma.planPagoDNI.findUnique({ where: { id: Number(id) } });
  if (!plan) throw Object.assign(new Error('Plan no encontrado'), { statusCode: 404 });
  const updated = await prisma.planPagoDNI.update({
    where:   { id: Number(id) },
    data,
    include: PLAN_INCLUDE,
  });
  return enriquecerPlan(updated);
};

/**
 * Cobra una cuota: actualiza la cuota, suma al monto pagado del plan.
 * Si el plan queda completamente pagado → cambia estado a COMPLETADO.
 * Opcionalmente registra un MovimientoCaja si se recibe sesionCajaId.
 */
const cobrarCuota = async (planId, { cuotaId, fechaPago, observaciones, sesionCajaId }, usuarioId) => {
  const plan = await getById(planId);
  const cuota = plan.cuotas?.find(c => c.id === Number(cuotaId));
  if (!cuota)              throw Object.assign(new Error('Cuota no encontrada'), { statusCode: 404 });
  if (cuota.estado === 'PAGADO')
    throw Object.assign(new Error('La cuota ya fue pagada'), { statusCode: 409 });

  const montoNuevo = Number(plan.montoPagado) + Number(cuota.monto);
  const completado = montoNuevo >= Number(plan.precioTotal);

  return prisma.$transaction(async (tx) => {
    await tx.cuotaPlanPago.update({
      where: { id: Number(cuotaId) },
      data: {
        estado:       'PAGADO',
        fechaPago:    fechaPago ? new Date(fechaPago) : new Date(),
        observaciones: observaciones ?? null,
        usuarioId:    Number(usuarioId),
      },
    });

    const planData = { montoPagado: montoNuevo };
    if (completado) planData.estado = 'COMPLETADO';

    const updatedPlan = await tx.planPagoDNI.update({
      where:   { id: Number(planId) },
      data:    planData,
      include: PLAN_INCLUDE,
    });

    // Registrar movimiento de caja si se pasa sesión
    if (sesionCajaId) {
      await tx.movimientoCaja.create({
        data: {
          sesionCajaId:  Number(sesionCajaId),
          tipo:          'INGRESO',
          concepto:      'CUOTA_PLAN_PAGO',
          monto:         Number(cuota.monto),
          planPagoDNIId: Number(planId),
          observaciones: `Cuota ${cuota.numeroCuota} — ${plan.cliente?.nombre} ${plan.cliente?.apellido}`,
          usuarioId:     Number(usuarioId),
        },
      });
    }

    return enriquecerPlan(updatedPlan);
  });
};

/**
 * Marca el vehículo como entregado y genera la Venta formal.
 */
const entregarAuto = async (planId, { observaciones }, usuarioId) => {
  const plan = await getById(planId);
  if (plan.vehiculoEntregado)
    throw Object.assign(new Error('El vehículo ya fue entregado'), { statusCode: 409 });

  const stats = plan._stats;
  if (!stats.puedeRetirar)
    throw Object.assign(
      new Error(`El cliente aún no cumple la condición de retiro. Monto pagado: $${stats.montoPagado} / mínimo: $${plan.montoEntrega ?? plan.precioTotal}`),
      { statusCode: 409 }
    );

  return prisma.$transaction(async (tx) => {
    // Crear Venta formal
    const venta = await tx.venta.create({
      data: {
        clienteId:   plan.clienteId,
        vehiculoId:  plan.vehiculoId,
        vendedorId:  plan.vendedorId,
        precioFinal: plan.precioTotal,
        formaPago:   'PLAN_DNI',
        estado:      'ENTREGADO',
        fechaReserva:plan.createdAt,
        fechaEntrega:new Date(),
      },
    });

    // Comisión (2%)
    const montoComision = (Number(plan.precioTotal) * 2) / 100;
    await tx.comision.create({
      data: {
        ventaId:      venta.id,
        vendedorId:   plan.vendedorId,
        montoBase:    plan.precioTotal,
        porcentaje:   2,
        montoComision,
      },
    });

    // Actualizar vehículo y plan
    await tx.vehiculo.update({ where: { id: plan.vehiculoId }, data: { estado: 'VENDIDO' } });
    const updatedPlan = await tx.planPagoDNI.update({
      where:   { id: Number(planId) },
      data:    { vehiculoEntregado: true, estado: 'COMPLETADO', ventaId: venta.id, observaciones: observaciones ?? null },
      include: PLAN_INCLUDE,
    });

    return enriquecerPlan(updatedPlan);
  });
};

module.exports = { getAll, getById, create, update, cobrarCuota, entregarAuto };
