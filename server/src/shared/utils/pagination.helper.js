/**
 * Devuelve { take, skip } para pasar directamente a Prisma.
 * Limita el pageSize máximo a 100 para proteger la DB.
 */
const paginate = (page = 1, pageSize = 20) => {
  const take = Math.min(Math.max(Number(pageSize) || 20, 1), 100);
  const skip = (Math.max(Number(page) || 1, 1) - 1) * take;
  return { take, skip };
};

/**
 * Construye el objeto meta de paginación para incluir en la respuesta.
 */
const paginateMeta = (total, page, pageSize) => {
  const ps = Math.min(Math.max(Number(pageSize) || 20, 1), 100);
  const p = Math.max(Number(page) || 1, 1);
  return {
    total,
    page: p,
    pageSize: ps,
    totalPages: Math.ceil(total / ps),
  };
};

module.exports = { paginate, paginateMeta };
