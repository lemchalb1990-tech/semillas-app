const pool = require('../db/connection');
const bcrypt = require('bcryptjs');

const SALT_ROUNDS = 12;

async function crearUsuario({ nombre, email, password, rol = 'usuario' }) {
  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const { rows } = await pool.query(
    `INSERT INTO usuarios (nombre, email, password_hash, rol)
     VALUES ($1, $2, $3, $4)
     RETURNING id, nombre, email, rol, created_at`,
    [nombre, email, passwordHash, rol]
  );
  return rows[0];
}

async function buscarPorEmail(email) {
  const { rows } = await pool.query(
    'SELECT * FROM usuarios WHERE email = $1',
    [email]
  );
  return rows[0] || null;
}

async function buscarPorId(id) {
  const { rows } = await pool.query(
    'SELECT id, nombre, email, rol, created_at FROM usuarios WHERE id = $1',
    [id]
  );
  return rows[0] || null;
}

async function actualizarPerfil(id, { nombre, passwordNueva }) {
  let passwordHash = null;
  if (passwordNueva) passwordHash = await bcrypt.hash(passwordNueva, SALT_ROUNDS);

  const { rows } = await pool.query(
    `UPDATE usuarios
     SET nombre        = COALESCE($1, nombre),
         password_hash = COALESCE($2, password_hash),
         updated_at    = NOW()
     WHERE id = $3
     RETURNING id, nombre, email, rol, created_at`,
    [nombre || null, passwordHash, id]
  );
  return rows[0] || null;
}

async function listarUsuarios() {
  const { rows } = await pool.query(
    `SELECT id, nombre, email, rol, created_at FROM usuarios ORDER BY created_at DESC`
  );
  return rows;
}

async function actualizarUsuario(id, { nombre, email, rol }) {
  const { rows } = await pool.query(
    `UPDATE usuarios
     SET nombre = COALESCE($1, nombre),
         email  = COALESCE($2, email),
         rol    = COALESCE($3, rol),
         updated_at = NOW()
     WHERE id = $4
     RETURNING id, nombre, email, rol, created_at`,
    [nombre, email, rol, id]
  );
  return rows[0] || null;
}

async function eliminarUsuario(id) {
  const { rowCount } = await pool.query('DELETE FROM usuarios WHERE id = $1', [id]);
  return rowCount > 0;
}

async function verificarPassword(passwordPlano, passwordHash) {
  return bcrypt.compare(passwordPlano, passwordHash);
}

module.exports = {
  crearUsuario, buscarPorEmail, buscarPorId, actualizarPerfil,
  listarUsuarios, actualizarUsuario, eliminarUsuario, verificarPassword,
};
