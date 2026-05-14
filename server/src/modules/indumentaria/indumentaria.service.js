const prisma = require('../../shared/prisma');
const { paginate, paginateMeta } = require('../../shared/utils/pagination.helper');

const getAll = async ({ categoria, marca, q, talla, soloActivos = true, page, pageSize } = {}) => {
  const where = {};
  if (soloActivos !== false) where.activo = true;
  if (categoria) where.categoria = categoria;
  if (talla)     where.talla     = talla;

  // Búsqueda flexible: q busca en nombre, marca y descripción
  if (q) {
    where.OR = [
      { nombre:      { contains: q } },
      { marca:       { contains: q } },
      { descripcion: { contains: q } },
    ];
  } else if (marca) {
    where.marca = { contains: marca };
  }

  const { take, skip } = paginate(page, pageSize);
  const [total, items] = await Promise.all([
    prisma.indumentaria.count({ where }),
    prisma.indumentaria.findMany({ where, skip, take, orderBy: { createdAt: 'desc' } }),
  ]);

  return { items, meta: paginateMeta(total, page, pageSize) };
};

const getById = async (id) => {
  const item = await prisma.indumentaria.findUnique({ where: { id: Number(id) } });
  if (!item) throw Object.assign(new Error('Ítem no encontrado'), { statusCode: 404 });
  return item;
};

const create = async (data) => {
  return prisma.indumentaria.create({ data });
};

const update = async (id, data) => {
  await getById(id);
  return prisma.indumentaria.update({ where: { id: Number(id) }, data });
};

const remove = async (id) => {
  await getById(id);
  return prisma.indumentaria.update({
    where: { id: Number(id) },
    data:  { activo: false },
  });
};

/**
 * Venta de indumentaria:
 * 1. Descuenta el stock.
 * 2. Si hay una sesión de caja abierta del usuario, registra el movimiento.
 * Funciona aunque no haya sesión de caja activa.
 */
const vender = async (id, { cantidad, sesionCajaId }, usuarioId) => {
  const item = await getById(id);

  if (item.cantidad < cantidad)
    throw Object.assign(
      new Error(`Stock insuficiente. Disponible: ${item.cantidad}`),
      { statusCode: 409 }
    );

  const precioTotal = Number(item.precioVenta) * cantidad;

  return prisma.$transaction(async (tx) => {
    // 1. Descontar stock
    const updated = await tx.indumentaria.update({
      where: { id: Number(id) },
      data:  { cantidad: { decrement: cantidad } },
    });

    // 2. Si hay sesión de caja, registrar movimiento
    if (sesionCajaId) {
      const sesion = await tx.sesionCaja.findUnique({
        where: { id: Number(sesionCajaId), estado: 'ABIERTA' },
      });
      if (sesion) {
        await tx.movimientoCaja.create({
          data: {
            sesionCajaId: sesion.id,
            tipo:         'INGRESO',
            concepto:     'VENTA_INDUMENTARIA',
            monto:        precioTotal,
            observaciones:`${cantidad}x ${item.nombre}`,
            usuarioId:    Number(usuarioId),
          },
        });
      }
    }

    return { item: updated, cantidad, precioTotal };
  });
};

const CATEGORIAS_VALIDAS = ['Ropa', 'Accesorio', 'Calzado', 'Merchandising', 'Otro'];
const TALLAS_VALIDAS     = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'UNICA'];

const importMany = async (rows) => {
  const errores = [];
  const validos = [];

  rows.forEach((row, i) => {
    const fila = i + 2;
    const e = [];

    if (!row.nombre) e.push('Nombre requerido');

    const costo = Number(row.precioCosto);
    const venta = Number(row.precioVenta);
    if (!costo || costo <= 0) e.push('Precio Costo inválido');
    if (!venta || venta <= 0) e.push('Precio Venta inválido');

    const cat = row.categoria ? String(row.categoria).trim() : 'Otro';
    if (!CATEGORIAS_VALIDAS.includes(cat)) e.push(`Categoría inválida (${CATEGORIAS_VALIDAS.join(', ')})`);

    const talla = row.talla ? String(row.talla).toUpperCase().trim() : null;
    if (talla && !TALLAS_VALIDAS.includes(talla)) e.push(`Talla inválida (${TALLAS_VALIDAS.join(', ')})`);

    if (e.length) {
      errores.push({ fila, errores: e });
    } else {
      validos.push({
        nombre:      String(row.nombre).trim(),
        descripcion: row.descripcion ? String(row.descripcion).trim() : null,
        categoria:   cat,
        talla:       talla || null,
        color:       row.color ? String(row.color).trim() : null,
        marca:       row.marca ? String(row.marca).trim() : null,
        cantidad:    Number(row.cantidad) || 0,
        precioCosto: costo,
        precioVenta: venta,
      });
    }
  });

  let importados = 0;
  if (validos.length) {
    const result = await prisma.indumentaria.createMany({ data: validos });
    importados = result.count;
  }

  return { importados, errores };
};

module.exports = { getAll, getById, create, update, remove, importMany, vender };
