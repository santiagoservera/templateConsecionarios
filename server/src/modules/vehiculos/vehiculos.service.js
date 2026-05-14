const prisma = require('../../shared/prisma');
const { paginate, paginateMeta } = require('../../shared/utils/pagination.helper');

const getAll = async ({ tipo, marca, q, estado, tipoStock, page, pageSize } = {}) => {
  const where = {};
  if (tipo)      where.tipo      = tipo;
  if (estado)    where.estado    = estado;
  if (tipoStock) where.tipoStock = tipoStock;

  // Búsqueda general: q busca en marca, modelo, patente y versión
  if (q) {
    where.OR = [
      { marca:   { contains: q } },
      { modelo:  { contains: q } },
      { patente: { contains: q } },
      { version: { contains: q } },
    ];
  } else if (marca) {
    where.marca = { contains: marca };
  }

  const { take, skip } = paginate(page, pageSize);
  const [total, items] = await Promise.all([
    prisma.vehiculo.count({ where }),
    prisma.vehiculo.findMany({ where, skip, take, orderBy: { createdAt: 'desc' } }),
  ]);

  return { items, meta: paginateMeta(total, page, pageSize) };
};

const getById = async (id) => {
  const vehiculo = await prisma.vehiculo.findUnique({
    where: { id: Number(id) },
    include: {
      gastos: { orderBy: { fecha: 'desc' } },
    },
  });
  if (!vehiculo) throw Object.assign(new Error('Vehículo no encontrado'), { statusCode: 404 });
  return vehiculo;
};

const create = async (data) => {
  return prisma.vehiculo.create({ data });
};

const update = async (id, data) => {
  return prisma.vehiculo.update({ where: { id: Number(id) }, data });
};

const remove = async (id) => {
  const ventasCount = await prisma.venta.count({ where: { vehiculoId: Number(id) } });
  if (ventasCount > 0) {
    throw Object.assign(
      new Error('No se puede eliminar: el vehículo tiene una venta asociada'),
      { statusCode: 409 }
    );
  }
  return prisma.vehiculo.delete({ where: { id: Number(id) } });
};

/**
 * Costo real = precioCosto original + suma de todos los GastoVehiculo.
 * Útil para calcular el margen real antes de fijar el precio de venta.
 */
const getCostoReal = async (id) => {
  const vehiculo = await prisma.vehiculo.findUnique({
    where: { id: Number(id) },
    select: {
      id: true,
      marca: true,
      modelo: true,
      anio: true,
      precioCosto: true,
      gastos: {
        select: { id: true, concepto: true, monto: true, fecha: true, proveedor: true },
        orderBy: { fecha: 'desc' },
      },
    },
  });
  if (!vehiculo) throw Object.assign(new Error('Vehículo no encontrado'), { statusCode: 404 });

  const precioCosto = Number(vehiculo.precioCosto);
  const totalGastos = vehiculo.gastos.reduce((sum, g) => sum + Number(g.monto), 0);

  return {
    vehiculoId:  vehiculo.id,
    descripcion: `${vehiculo.marca} ${vehiculo.modelo} ${vehiculo.anio}`,
    precioCosto,
    totalGastos,
    costoReal:   precioCosto + totalGastos,
    gastos:      vehiculo.gastos,
  };
};

/**
 * Importación masiva de vehículos.
 * Valida cada fila individualmente y crea las válidas en lote.
 * Devuelve { importados, errores: [{ fila, campo, mensaje }] }
 */
const importMany = async (rows) => {
  const errores = [];
  const validos = [];

  rows.forEach((row, i) => {
    const fila = i + 2; // fila 1 = encabezado, datos desde fila 2
    const e = [];

    if (!row.tipo || !['AUTO', 'MOTO'].includes(String(row.tipo).toUpperCase()))
      e.push('Tipo debe ser AUTO o MOTO');
    if (!row.marca)   e.push('Marca requerida');
    if (!row.modelo)  e.push('Modelo requerido');

    const anio = Number(row.anio);
    if (!anio || anio < 1900 || anio > new Date().getFullYear() + 2)
      e.push('Año inválido');

    if (!row.tipoStock || !['NUEVO', 'USADO', 'CONSIGNACION'].includes(String(row.tipoStock).toUpperCase()))
      e.push('Tipo Stock debe ser NUEVO, USADO o CONSIGNACION');

    const costo = Number(row.precioCosto);
    const venta = Number(row.precioVenta);
    if (!costo || costo <= 0) e.push('Precio Costo inválido');
    if (!venta || venta <= 0) e.push('Precio Venta inválido');

    if (e.length) {
      errores.push({ fila, errores: e });
    } else {
      validos.push({
        tipo:        String(row.tipo).toUpperCase(),
        marca:       String(row.marca).trim(),
        modelo:      String(row.modelo).trim(),
        anio,
        version:     row.version     ? String(row.version).trim()     : null,
        color:       row.color       ? String(row.color).trim()       : null,
        patente:     row.patente     ? String(row.patente).trim()     : null,
        vinChasis:   row.vinChasis   ? String(row.vinChasis).trim()   : null,
        km:          Number(row.km) || 0,
        combustible: row.combustible ? String(row.combustible).trim() : null,
        transmision: row.transmision ? String(row.transmision).trim() : null,
        tipoStock:   String(row.tipoStock).toUpperCase(),
        precioCosto: costo,
        precioVenta: venta,
        precioMinimo:row.precioMinimo ? Number(row.precioMinimo) : null,
      });
    }
  });

  let importados = 0;
  if (validos.length) {
    const result = await prisma.vehiculo.createMany({ data: validos, skipDuplicates: true });
    importados = result.count;
  }

  return { importados, errores };
};

module.exports = { getAll, getById, create, update, remove, getCostoReal, importMany };
