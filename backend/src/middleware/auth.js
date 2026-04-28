const jwt = require('jsonwebtoken');

function verificarToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ')
    ? authHeader.slice(7)
    : null;

  if (!token) {
    return res.status(401).json({ error: 'Token de acceso requerido' });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.usuario = payload;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expirado' });
    }
    return res.status(403).json({ error: 'Token inválido' });
  }
}

const JERARQUIA = { superadmin: 3, admin: 2, gestor: 1 };

function nivelRol(rol) {
  return JERARQUIA[rol] || 0;
}

// Permite superadmin y admin
function soloAdmin(req, res, next) {
  if (nivelRol(req.usuario?.rol) < 2) {
    return res.status(403).json({ error: 'Acceso restringido a administradores' });
  }
  next();
}

// Permite solo superadmin
function soloSuperadmin(req, res, next) {
  if (req.usuario?.rol !== 'superadmin') {
    return res.status(403).json({ error: 'Acceso restringido a superadministradores' });
  }
  next();
}

module.exports = { verificarToken, soloAdmin, soloSuperadmin, nivelRol };
