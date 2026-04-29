const pool = require('../db/connection');

async function listarEspecies(empresaIds) {
  const { rows } = await pool.query(
    `SELECT e.*, u.nombre AS creado_por_nombre, emp.nombre AS empresa_nombre
     FROM especies e
     LEFT JOIN usuarios u   ON u.id   = e.creado_por
     LEFT JOIN empresas emp ON emp.id = e.empresa_id
     WHERE e.empresa_id = ANY($1::int[])
     ORDER BY e.created_at DESC`,
    [empresaIds]
  );
  return rows;
}

async function buscarEspeciePorId(id) {
  const { rows } = await pool.query(
    `SELECT e.*, u.nombre AS creado_por_nombre, emp.nombre AS empresa_nombre
     FROM especies e
     LEFT JOIN usuarios u   ON u.id   = e.creado_por
     LEFT JOIN empresas emp ON emp.id = e.empresa_id
     WHERE e.id = $1`,
    [id]
  );
  return rows[0] || null;
}

async function crearEspecie({ nombre, descripcion, empresaId, creadoPor }) {
  const { rows } = await pool.query(
    `INSERT INTO especies (nombre, descripcion, empresa_id, creado_por)
     VALUES ($1, $2, $3, $4) RETURNING *`,
    [nombre, descripcion || null, empresaId, creadoPor]
  );
  return rows[0];
}

async function actualizarEspecie(id, { nombre, descripcion }) {
  const { rows } = await pool.query(
    `UPDATE especies
     SET nombre      = COALESCE($1, nombre),
         descripcion = COALESCE($2, descripcion),
         updated_at  = NOW()
     WHERE id = $3
     RETURNING *`,
    [nombre, descripcion, id]
  );
  return rows[0] || null;
}

async function eliminarEspecie(id) {
  const { rowCount } = await pool.query('DELETE FROM especies WHERE id = $1', [id]);
  return rowCount > 0;
}

module.exports = { listarEspecies, buscarEspeciePorId, crearEspecie, actualizarEspecie, eliminarEspecie };
