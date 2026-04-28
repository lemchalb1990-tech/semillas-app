const pool = require('../db/connection');

async function listarEmpresas() {
  const { rows } = await pool.query(`
    SELECT e.*, COUNT(eu.usuario_id) AS total_usuarios
    FROM empresas e
    LEFT JOIN empresa_usuarios eu ON eu.empresa_id = e.id
    GROUP BY e.id
    ORDER BY e.created_at DESC
  `);
  return rows;
}

async function buscarEmpresaPorId(id) {
  const { rows } = await pool.query('SELECT * FROM empresas WHERE id = $1', [id]);
  return rows[0] || null;
}

async function crearEmpresa({ nombre, rut, nombreContacto, telefonoContacto, correoContacto }) {
  const { rows } = await pool.query(
    `INSERT INTO empresas (nombre, rut, nombre_contacto, telefono_contacto, correo_contacto)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [nombre, rut || null, nombreContacto || null, telefonoContacto || null, correoContacto || null]
  );
  return rows[0];
}

async function actualizarEmpresa(id, { nombre, rut, nombreContacto, telefonoContacto, correoContacto }) {
  const { rows } = await pool.query(
    `UPDATE empresas
     SET nombre            = COALESCE($1, nombre),
         rut               = COALESCE($2, rut),
         nombre_contacto   = COALESCE($3, nombre_contacto),
         telefono_contacto = COALESCE($4, telefono_contacto),
         correo_contacto   = COALESCE($5, correo_contacto),
         updated_at        = NOW()
     WHERE id = $6
     RETURNING *`,
    [nombre, rut, nombreContacto, telefonoContacto, correoContacto, id]
  );
  return rows[0] || null;
}

async function eliminarEmpresa(id) {
  const { rowCount } = await pool.query('DELETE FROM empresas WHERE id = $1', [id]);
  return rowCount > 0;
}

async function obtenerUsuariosDeEmpresa(empresaId) {
  const { rows } = await pool.query(
    `SELECT u.id, u.nombre, u.email, u.rol
     FROM usuarios u
     JOIN empresa_usuarios eu ON eu.usuario_id = u.id
     WHERE eu.empresa_id = $1
     ORDER BY u.nombre`,
    [empresaId]
  );
  return rows;
}

async function usuariosDisponibles(empresaId) {
  const { rows } = await pool.query(
    `SELECT id, nombre, email, rol FROM usuarios
     WHERE rol IN ('admin','gestor')
       AND id NOT IN (
         SELECT usuario_id FROM empresa_usuarios WHERE empresa_id = $1
       )
     ORDER BY nombre`,
    [empresaId]
  );
  return rows;
}

async function asignarUsuario(empresaId, usuarioId) {
  await pool.query(
    `INSERT INTO empresa_usuarios (empresa_id, usuario_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
    [empresaId, usuarioId]
  );
}

async function desasignarUsuario(empresaId, usuarioId) {
  await pool.query(
    `DELETE FROM empresa_usuarios WHERE empresa_id = $1 AND usuario_id = $2`,
    [empresaId, usuarioId]
  );
}

async function empresasDeUsuario(usuarioId) {
  const { rows } = await pool.query(
    `SELECT e.id FROM empresas e
     JOIN empresa_usuarios eu ON eu.empresa_id = e.id
     WHERE eu.usuario_id = $1`,
    [usuarioId]
  );
  return rows.map(r => r.id);
}

module.exports = {
  listarEmpresas, buscarEmpresaPorId, crearEmpresa, actualizarEmpresa, eliminarEmpresa,
  obtenerUsuariosDeEmpresa, usuariosDisponibles, asignarUsuario, desasignarUsuario, empresasDeUsuario,
};
