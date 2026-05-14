const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../../shared/prisma');

// Campos del usuario que se exponen al exterior (nunca incluir passwordHash)
const PUBLIC_USER_FIELDS = {
  id: true,
  nombre: true,
  email: true,
  rol: true,
  activo: true,
  permisosJson: true,
};

/**
 * Genera el par accessToken + refreshToken para un usuario dado.
 */
const generateTokens = (user) => {
  const accessPayload = {
    sub: user.id,
    rol: user.rol,
    nombre: user.nombre,
    email: user.email,
  };

  const accessToken = jwt.sign(accessPayload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '15m',
  });

  const refreshToken = jwt.sign(
    { sub: user.id },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
  );

  return { accessToken, refreshToken };
};

/**
 * Valida credenciales y devuelve { user, accessToken, refreshToken }.
 * Lanza error 401 si el email no existe, el usuario está inactivo o la contraseña no coincide.
 * El mensaje de error es deliberadamente genérico para no dar pistas.
 */
const login = async (email, password) => {
  const user = await prisma.usuario.findUnique({
    where: { email },
    select: { ...PUBLIC_USER_FIELDS, passwordHash: true },
  });

  const INVALID_CREDS = Object.assign(new Error('Credenciales inválidas'), { statusCode: 401 });

  if (!user || !user.activo) throw INVALID_CREDS;

  const passwordMatch = await bcrypt.compare(password, user.passwordHash);
  if (!passwordMatch) throw INVALID_CREDS;

  // Quitar passwordHash antes de devolver el usuario
  const { passwordHash: _omit, ...userSafe } = user;
  const tokens = generateTokens(userSafe);

  return { user: userSafe, ...tokens };
};

/**
 * Verifica el refreshToken y devuelve un nuevo accessToken.
 * Lanza error 401 si el token es inválido, expirado o el usuario ya no está activo.
 */
const refresh = async (refreshToken) => {
  let payload;
  try {
    payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
  } catch {
    throw Object.assign(new Error('Refresh token inválido o expirado'), { statusCode: 401 });
  }

  const user = await prisma.usuario.findUnique({
    where: { id: Number(payload.sub) },
    select: PUBLIC_USER_FIELDS,
  });

  if (!user || !user.activo) {
    throw Object.assign(new Error('Usuario no encontrado o inactivo'), { statusCode: 401 });
  }

  const { accessToken } = generateTokens(user);
  return { accessToken };
};

/**
 * Devuelve los datos públicos del usuario autenticado.
 */
const getMe = async (userId) => {
  const user = await prisma.usuario.findUnique({
    where: { id: Number(userId) },
    select: PUBLIC_USER_FIELDS,
  });

  if (!user) {
    throw Object.assign(new Error('Usuario no encontrado'), { statusCode: 404 });
  }

  return user;
};

module.exports = { login, refresh, getMe };
