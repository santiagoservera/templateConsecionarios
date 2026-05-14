const prisma = require('../../shared/prisma');

/** Primer instante del mes en curso */
const startOfCurrentMonth = () =>
  new Date(new Date().getFullYear(), new Date().getMonth(), 1);

const TIPO_POSTVENTA_LABEL = {
  GARANTIA: 'garantía',
  RECLAMO: 'reclamo',
  CONSULTA: 'consulta',
  SEGUIMIENTO: 'seguimiento',
};

const TIPO_STOCK_LABEL = {
  NUEVO: 'nuevo',
  USADO: 'usado',
  CONSIGNACION: 'consignación',
};

/**
 * Actividad reciente del sistema (últimos 20 eventos ordenados por fecha desc).
 * Si se pasa vendedorId, filtra solo eventos del vendedor.
 */
const getActividadReciente = async (vendedorId = null) => {
  const vid = vendedorId ? Number(vendedorId) : null;

  const [ventas, leads, clientes, postventas, vehiculos] = await Promise.all([
    prisma.venta.findMany({
      where: vid ? { vendedorId: vid } : {},
      take: 8,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        precioFinal: true,
        createdAt: true,
        vendedor: { select: { nombre: true } },
        cliente:  { select: { nombre: true, apellido: true } },
        vehiculo: { select: { marca: true, modelo: true, anio: true } },
      },
    }),

    prisma.lead.findMany({
      where: vid ? { vendedorId: vid } : {},
      take: 8,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        createdAt: true,
        vendedor:       { select: { nombre: true } },
        cliente:        { select: { nombre: true, apellido: true } },
        vehiculoInteres:{ select: { marca: true, modelo: true } },
      },
    }),

    // Solo para gerente/admin
    vid ? Promise.resolve([]) : prisma.cliente.findMany({
      take: 8,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        nombre: true,
        apellido: true,
        createdAt: true,
        vendedor: { select: { nombre: true } },
      },
    }),

    prisma.postventa.findMany({
      where: vid ? { usuarioId: vid } : {},
      take: 8,
      orderBy: { fechaContacto: 'desc' },
      select: {
        id: true,
        tipo: true,
        fechaContacto: true,
        usuario: { select: { nombre: true } },
        cliente: { select: { nombre: true, apellido: true } },
      },
    }),

    // Solo para gerente/admin
    vid ? Promise.resolve([]) : prisma.vehiculo.findMany({
      take: 8,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        marca: true,
        modelo: true,
        anio: true,
        tipoStock: true,
        createdAt: true,
      },
    }),
  ]);

  const eventos = [
    ...ventas.map(v => ({
      tipo: 'venta',
      descripcion: `${v.vendedor?.nombre ?? 'Sistema'} registró una venta — ${v.vehiculo?.marca} ${v.vehiculo?.modelo} ${v.vehiculo?.anio} a ${v.cliente?.nombre} ${v.cliente?.apellido}`,
      monto: Number(v.precioFinal),
      fecha: v.createdAt,
      id: `venta-${v.id}`,
    })),
    ...leads.map(l => ({
      tipo: 'lead',
      descripcion: `${l.vendedor?.nombre ?? 'Sistema'} creó un lead — ${l.cliente?.nombre} ${l.cliente?.apellido}${l.vehiculoInteres ? ` interesado/a en ${l.vehiculoInteres.marca} ${l.vehiculoInteres.modelo}` : ''}`,
      fecha: l.createdAt,
      id: `lead-${l.id}`,
    })),
    ...clientes.map(c => ({
      tipo: 'cliente',
      descripcion: `${c.vendedor?.nombre ?? 'Sistema'} registró un nuevo cliente — ${c.nombre} ${c.apellido}`,
      fecha: c.createdAt,
      id: `cliente-${c.id}`,
    })),
    ...postventas.map(p => ({
      tipo: 'postventa',
      descripcion: `${p.usuario?.nombre ?? 'Sistema'} abrió un ticket de ${TIPO_POSTVENTA_LABEL[p.tipo] ?? p.tipo} — ${p.cliente?.nombre} ${p.cliente?.apellido}`,
      fecha: p.fechaContacto,
      id: `postventa-${p.id}`,
    })),
    ...vehiculos.map(v => ({
      tipo: 'vehiculo',
      descripcion: `Se ingresó al stock — ${v.marca} ${v.modelo} ${v.anio} (${TIPO_STOCK_LABEL[v.tipoStock] ?? v.tipoStock})`,
      fecha: v.createdAt,
      id: `vehiculo-${v.id}`,
    })),
  ];

  return eventos
    .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
    .slice(0, 20);
};

/**
 * Dashboard para GERENTE / ADMIN
 *
 * Incluye:
 *  - ventas del mes (cantidad + monto acumulado)
 *  - stock por estado (conteo)
 *  - leads por etapa (conteo)
 *  - top 3 vendedores por cantidad de ventas en el mes
 *  - comisiones pendientes de liquidar (cantidad + monto total)
 */
const getDashboardGerente = async () => {
  const startOfMonth = startOfCurrentMonth();

  const [
    ventasMesAgg,
    stockPorEstado,
    leadsPorEtapa,
    comisionesAgg,
    ventasDelMes,
    actividadReciente,
  ] = await Promise.all([
    // Totales de ventas del mes
    prisma.venta.aggregate({
      where: { createdAt: { gte: startOfMonth } },
      _count: { id: true },
      _sum:   { precioFinal: true },
    }),

    // Stock agrupado por estado
    prisma.vehiculo.groupBy({
      by:     ['estado'],
      _count: { id: true },
      orderBy: { estado: 'asc' },
    }),

    // Leads agrupados por etapa
    prisma.lead.groupBy({
      by:     ['etapa'],
      _count: { id: true },
    }),

    // Comisiones pendientes de liquidar
    prisma.comision.aggregate({
      where: { estado: 'PENDIENTE' },
      _count: { id: true },
      _sum:   { montoComision: true },
    }),

    // Ventas del mes con vendedor (para calcular top 3 en JS)
    prisma.venta.findMany({
      where:   { createdAt: { gte: startOfMonth } },
      select:  { vendedorId: true, precioFinal: true, vendedor: { select: { id: true, nombre: true } } },
    }),

    getActividadReciente(),
  ]);

  // Calcular top 3 vendedores
  const vendedorMap = {};
  for (const v of ventasDelMes) {
    const id = v.vendedorId;
    if (!vendedorMap[id]) {
      vendedorMap[id] = { vendedorId: id, nombre: v.vendedor.nombre, cantVentas: 0, totalVentas: 0 };
    }
    vendedorMap[id].cantVentas++;
    vendedorMap[id].totalVentas += Number(v.precioFinal);
  }
  const topVendedores = Object.values(vendedorMap)
    .sort((a, b) => b.cantVentas - a.cantVentas)
    .slice(0, 3);

  return {
    ventasMes: {
      cantidad:   ventasMesAgg._count.id,
      montoTotal: Number(ventasMesAgg._sum.precioFinal ?? 0),
    },
    stockPorEstado: stockPorEstado.map((s) => ({
      estado: s.estado,
      count:  s._count.id,
    })),
    leadsPorEtapa: leadsPorEtapa.map((l) => ({
      etapa: l.etapa,
      count: l._count.id,
    })),
    topVendedores,
    comisionesPendientes: {
      cantidad:   comisionesAgg._count.id,
      montoTotal: Number(comisionesAgg._sum.montoComision ?? 0),
    },
    actividadReciente,
  };
};

/**
 * Dashboard para VENDEDOR
 *
 * Incluye:
 *  - sus leads por etapa (conteo)
 *  - sus ventas del mes (cantidad + monto)
 *  - su comisión pendiente estimada (suma de montoComision donde estado = PENDIENTE)
 */
const getDashboardVendedor = async (vendedorId) => {
  const startOfMonth = startOfCurrentMonth();
  const vid = Number(vendedorId);

  const [leadsPorEtapa, ventasMesAgg, comisionAgg, actividadReciente] = await Promise.all([
    prisma.lead.groupBy({
      by:    ['etapa'],
      where: { vendedorId: vid },
      _count: { id: true },
    }),

    prisma.venta.aggregate({
      where: { vendedorId: vid, createdAt: { gte: startOfMonth } },
      _count: { id: true },
      _sum:   { precioFinal: true },
    }),

    prisma.comision.aggregate({
      where: { vendedorId: vid, estado: 'PENDIENTE' },
      _count: { id: true },
      _sum:   { montoComision: true },
    }),

    getActividadReciente(vendedorId),
  ]);

  return {
    leadsPorEtapa: leadsPorEtapa.map((l) => ({ etapa: l.etapa, count: l._count.id })),
    ventasMes: {
      cantidad:   ventasMesAgg._count.id,
      montoTotal: Number(ventasMesAgg._sum.precioFinal ?? 0),
    },
    comisionPendiente: {
      cantidad:        comisionAgg._count.id,
      montoEstimado:   Number(comisionAgg._sum.montoComision ?? 0),
    },
    actividadReciente,
  };
};

/**
 * Reporte mensual del año indicado.
 * Devuelve 12 entradas (una por mes) con ventas, comisiones, clientes y leads.
 */
const getReporteMensual = async (year) => {
  const y     = Number(year) || new Date().getFullYear();
  const desde = new Date(y, 0, 1);          // 1 ene
  const hasta = new Date(y + 1, 0, 1);      // 1 ene del año siguiente

  const [ventas, comisiones, clientes, leads] = await Promise.all([
    prisma.venta.findMany({
      where:  { createdAt: { gte: desde, lt: hasta } },
      select: { precioFinal: true, estado: true, createdAt: true },
    }),
    prisma.comision.findMany({
      where:  {
        venta: { createdAt: { gte: desde, lt: hasta } },
      },
      select: { montoComision: true, estado: true, venta: { select: { createdAt: true } } },
    }),
    prisma.cliente.findMany({
      where:  { createdAt: { gte: desde, lt: hasta } },
      select: { createdAt: true },
    }),
    prisma.lead.findMany({
      where:  { createdAt: { gte: desde, lt: hasta } },
      select: { etapa: true, createdAt: true },
    }),
  ]);

  // Agrupar por mes (0-11)
  const meses = Array.from({ length: 12 }, (_, i) => ({
    mes:             i + 1,
    ventasCantidad:  0,
    ventasMonto:     0,
    ventasEntregadas:0,
    comisionesMonto: 0,
    clientesNuevos:  0,
    leadsNuevos:     0,
    leadsGanados:    0,
  }));

  ventas.forEach(v => {
    const m = new Date(v.createdAt).getMonth();
    meses[m].ventasCantidad++;
    meses[m].ventasMonto += Number(v.precioFinal);
    if (v.estado === 'ENTREGADO') meses[m].ventasEntregadas++;
  });

  comisiones.forEach(c => {
    const m = new Date(c.venta.createdAt).getMonth();
    meses[m].comisionesMonto += Number(c.montoComision);
  });

  clientes.forEach(c => {
    const m = new Date(c.createdAt).getMonth();
    meses[m].clientesNuevos++;
  });

  leads.forEach(l => {
    const m = new Date(l.createdAt).getMonth();
    meses[m].leadsNuevos++;
    if (l.etapa === 'GANADO') meses[m].leadsGanados++;
  });

  const totales = meses.reduce((acc, m) => ({
    ventasCantidad:   acc.ventasCantidad   + m.ventasCantidad,
    ventasMonto:      acc.ventasMonto      + m.ventasMonto,
    ventasEntregadas: acc.ventasEntregadas + m.ventasEntregadas,
    comisionesMonto:  acc.comisionesMonto  + m.comisionesMonto,
    clientesNuevos:   acc.clientesNuevos   + m.clientesNuevos,
    leadsNuevos:      acc.leadsNuevos      + m.leadsNuevos,
    leadsGanados:     acc.leadsGanados     + m.leadsGanados,
  }), { ventasCantidad:0, ventasMonto:0, ventasEntregadas:0, comisionesMonto:0, clientesNuevos:0, leadsNuevos:0, leadsGanados:0 });

  return { year: y, meses, totales };
};

/**
 * Alertas operativas del sistema:
 * - Cuotas plan DNI vencidas
 * - Seguros por vencer en los próximos 30 días
 * - Services pendientes vencidos (fechaProximoService pasada)
 * - Leads sin actividad hace más de 7 días
 */
const getAlertas = async () => {
  const hoy   = new Date();
  const en30  = new Date(); en30.setDate(hoy.getDate() + 30);
  const hace7 = new Date(); hace7.setDate(hoy.getDate() - 7);

  const [cuotasVencidas, segurosVenciendo, servicesVencidos, leadsInactivos] = await Promise.all([
    // Cuotas de plan DNI vencidas (no pagadas)
    prisma.cuotaPlanPago.findMany({
      where: { estado: 'PENDIENTE', fechaVencimiento: { lt: hoy } },
      take:  10,
      orderBy: { fechaVencimiento: 'asc' },
      include: {
        plan: {
          select: {
            id: true,
            cliente: { select: { nombre: true, apellido: true } },
            vehiculo: { select: { marca: true, modelo: true } },
          },
        },
      },
    }),

    // Seguros que vencen en los próximos 30 días
    prisma.seguro.findMany({
      where: { estado: 'VIGENTE', vigenciaHasta: { gte: hoy, lte: en30 } },
      take:  10,
      orderBy: { vigenciaHasta: 'asc' },
      select: { id: true, aseguradora: true, numeroPoliza: true, vigenciaHasta: true, tipoCobertura: true },
    }),

    // Services pendientes con fecha próximo vencida
    prisma.serviceVehiculo.findMany({
      where: { estado: 'PENDIENTE', fechaProximoService: { lt: hoy, not: null } },
      take:  10,
      orderBy: { fechaProximoService: 'asc' },
      include: {
        venta: {
          select: {
            cliente:  { select: { nombre: true, apellido: true } },
            vehiculo: { select: { marca: true, modelo: true } },
          },
        },
      },
    }),

    // Leads sin actividad (updatedAt < hace 7 días) y no terminados
    prisma.lead.findMany({
      where: {
        etapa:     { notIn: ['GANADO', 'PERDIDO'] },
        updatedAt: { lt: hace7 },
      },
      take:  10,
      orderBy: { updatedAt: 'asc' },
      include: {
        cliente:  { select: { nombre: true, apellido: true } },
        vendedor: { select: { nombre: true } },
      },
    }),
  ]);

  return {
    cuotasVencidas: cuotasVencidas.map(c => ({
      id:       c.id,
      tipo:     'cuota',
      titulo:   `Cuota #${c.numeroCuota} vencida`,
      subtitulo:`${c.plan.cliente.nombre} ${c.plan.cliente.apellido} — ${c.plan.vehiculo.marca} ${c.plan.vehiculo.modelo}`,
      fecha:    c.fechaVencimiento,
      linkTo:   `/planes-pago`,
    })),
    segurosVenciendo: segurosVenciendo.map(s => ({
      id:       s.id,
      tipo:     'seguro',
      titulo:   `Seguro por vencer — ${s.aseguradora}`,
      subtitulo:`Póliza ${s.numeroPoliza} · ${s.tipoCobertura.replace(/_/g, ' ')}`,
      fecha:    s.vigenciaHasta,
      linkTo:   `/seguros`,
    })),
    servicesVencidos: servicesVencidos.map(s => ({
      id:       s.id,
      tipo:     'service',
      titulo:   `Service vencido`,
      subtitulo:`${s.venta?.vehiculo?.marca ?? ''} ${s.venta?.vehiculo?.modelo ?? ''} — ${s.venta?.cliente?.nombre ?? ''} ${s.venta?.cliente?.apellido ?? ''}`,
      fecha:    s.fechaProximoService,
      linkTo:   `/postventa`,
    })),
    leadsInactivos: leadsInactivos.map(l => ({
      id:       l.id,
      tipo:     'lead',
      titulo:   `Lead inactivo`,
      subtitulo:`${l.cliente.nombre} ${l.cliente.apellido} — ${l.etapa} · ${l.vendedor.nombre}`,
      fecha:    l.updatedAt,
      linkTo:   `/leads`,
    })),
  };
};

module.exports = { getDashboardGerente, getDashboardVendedor, getReporteMensual, getAlertas };
