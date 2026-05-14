/**
 * Respuesta exitosa.
 * @param {import('express').Response} res
 * @param {*} data
 * @param {object} [meta]  - Paginación u otro metadata opcional
 */
const ok = (res, data, meta) => {
  const body = { success: true, data };
  if (meta !== undefined) body.meta = meta;
  return res.json(body);
};

/**
 * Respuesta de error.
 * @param {import('express').Response} res
 * @param {string} error
 * @param {number} [status=400]
 */
const fail = (res, error, status = 400) =>
  res.status(status).json({ success: false, error });

module.exports = { ok, fail };
