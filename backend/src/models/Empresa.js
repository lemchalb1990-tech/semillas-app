const pool = require('../db/connection');

async function listarEmpresas() {
  const { rows } = await pool.query(`
    SELECT e.*,
      COUNT(DISTINCT eu.usuario_id) AS total_usuarios,
      COUNT(DISTINCT p.id)          AS total_proyectos
    FROM empresas e
    LEFT JOIN empresa_usuarios eu ON eu.empresa_id = e.id
    LEFT JOIN proyectos p         ON p.empresa_id  = e.id
    GROUP BY e.id
    ORDER BY e.created_at DESC
  `);
  return rows;
}

async function buscarEmpresaPorId(id) {
  const { rows } = await pool.query(
    `SELECT e.*,
       COUNT(DISTINCT eu.usuario_id) AS total_usuarios,
       COUNT(DISTINCT p.id)          AS total_proyectos
     FROM empresas e
     LEFT JOIN empresa_usuarios eu ON eu.empresa_id = e.id
     LEFT JOIN proyectos p         ON p.empresa_id  = e.id
     WHERE e.id = $1
     GROUP BY e.id`,
    [id]
  );
  return rows[0] || null;
}

async function crearEmpresa({ nombre, descripcion }) {
  const { rows } = await pool.query(
    `INSERT INTO empresas (nombre, descripcion)
     VALUES ($1, $2)
     RETURNING *`,
    [nombre, descripcion || null]
  );
  return rows[0];
}

async function actualizarEmpresa(id, { nombre, descripcion, estado }) {
  const { rows } = await pool.query(
    `UPDATE empresas
     SET nombre      = COALESCE($1, nombre),
         descripcion = COALESCE($2, descripcion),
         estado      = COALESCE($3, estado),
         updated_at  = NOW()
     WHERE id = $4
     RETURNING *`,
    [nombre, descripcion, estado, id]
  );
  return rows[0] || null;
}

async function eliminarEmpresa(id) {
  const { rowCount } = await pool.query('DELETE FROM empresas WHERE id = $1', [id]);
  return rowCount > 0;
}

async function obtenerUsuariosDeEmpresa(empresaId) {
  const { rows } = await pool.query(
    `SELECT u.id, u.nombre, u.email, u.rol, eu.created_at AS asignado_en
     FROM usuarios u
     JOIN empresa_usuarios eu ON eu.usuario_id = u.id
     WHERE eu.empresa_id = $1
     ORDER BY u.nombre`,
    [empresaId]
  );
  return rows;
}

async function asignarUsuario(empresaId, usuarioId) {
  await pool.query(
    `INSERT INTO empresa_usuarios (empresa_id, usuario_id)
     VALUES ($1, $2)
     ON CONFLICT DO NOTHING`,
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
    `SELECT e.id, e.nombre FROM empresas e
     JOIN empresa_usuarios eu ON eu.empresa_id = e.id
     WHERE eu.usuario_id = $1 AND e.estado = 'activa'`,
    [usuarioId]
  );
  return rows;
}

module.exports = {
  listarEmpresas, buscarEmpresaPorId, crearEmpresa, actualizarEmpresa, eliminarEmpresa,
  obtenerUsuariosDeEmpresa, asignarUsuario, desasignarUsuario, empresasDeUsuario,
};
